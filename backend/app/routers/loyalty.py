"""
Эндпоинты раздела лояльности:
  GET /loyalty/{user_id}/summary       — главный агрегат для дашборда
  GET /loyalty/{user_id}/history       — все транзакции (с фильтром по программе)
  GET /loyalty/{user_id}/forecast      — прогноз кэшбэка
  GET /loyalty/{user_id}/insights      — AI-инсайты
"""
from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import User, Account, LoyaltyTransaction, LoyaltyProgram
from ..schemas import (
    LoyaltySummary, ProgramSummary, TransactionItem,
    ForecastResponse, MonthlyPoint, InsightsResponse,
)
from .. import loyalty_math, forecast as forecast_mod, ai_insights

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


def _ensure_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.get("/{user_id}/summary", response_model=LoyaltySummary)
def get_summary(user_id: int, db: Session = Depends(get_db)):
    """Главный агрегат для дашборда: сумма кэшбэка, программы, уровень, серия."""
    user = _ensure_user(db, user_id)

    program_summaries = loyalty_math.get_program_summaries(db, user_id)
    by_currency = loyalty_math.get_user_total_cashback_by_currency(db, user_id)
    total_rub_eq = sum(
        loyalty_math.to_rub(amount, currency) for currency, amount in by_currency.items()
    )

    level, level_name, progress, next_thr = loyalty_math.compute_level(total_rub_eq)
    streak = loyalty_math.compute_streak_days(user_id)

    return LoyaltySummary(
        user_id=user.id,
        full_name=user.full_name,
        financial_segment=user.financial_segment,
        total_cashback_rub_equivalent=round(total_rub_eq, 2),
        total_rub=round(by_currency["rub"], 2),
        total_miles=round(by_currency["miles"], 2),
        total_bravo_points=round(by_currency["bravo-points"], 2),
        programs=[ProgramSummary(**p) for p in program_summaries],
        streak_days=streak,
        level=level,
        level_name=level_name,
        level_progress=round(progress, 4),
        next_level_threshold_rub=next_thr,
    )


@router.get("/{user_id}/history", response_model=List[TransactionItem])
def get_history(
    user_id: int,
    program_id: Optional[int] = Query(None, description="Фильтр по программе лояльности"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """История всех начислений кэшбэка пользователя."""
    _ensure_user(db, user_id)
    q = (
        db.query(LoyaltyTransaction, LoyaltyProgram, Account)
        .join(Account, Account.id == LoyaltyTransaction.account_id)
        .join(LoyaltyProgram, LoyaltyProgram.id == Account.loyalty_program_id)
        .filter(Account.user_id == user_id)
    )
    if program_id:
        q = q.filter(LoyaltyProgram.id == program_id)
    rows = q.order_by(desc(LoyaltyTransaction.payout_date)).limit(limit).all()

    return [
        TransactionItem(
            transaction_id=tx.id,
            account_id=tx.account_id,
            program_id=program.id,
            program_name=program.name,
            cashback_amount=tx.cashback_amount,
            currency=program.cashback_currency,
            payout_date=tx.payout_date,
        )
        for tx, program, _account in rows
    ]


@router.get("/{user_id}/forecast", response_model=ForecastResponse)
def get_forecast(user_id: int, db: Session = Depends(get_db)):
    """Прогноз кэшбэка на следующий месяц и год."""
    _ensure_user(db, user_id)
    history = loyalty_math.get_monthly_history(db, user_id, months=12)
    next_month, next_year, method, conf = forecast_mod.forecast_cashback(history)

    return ForecastResponse(
        next_month_rub=round(next_month, 2),
        next_year_rub=round(next_year, 2),
        method=method,
        confidence=conf,
        monthly_history=[MonthlyPoint(month=m, rub_equivalent=round(v, 2)) for m, v in history],
    )


@router.get("/{user_id}/insights", response_model=InsightsResponse)
def get_insights(user_id: int, db: Session = Depends(get_db)):
    """Персональные AI-инсайты от Claude (fallback на правила, если нет ключа)."""
    user = _ensure_user(db, user_id)

    by_currency = loyalty_math.get_user_total_cashback_by_currency(db, user_id)
    total_rub_eq = sum(
        loyalty_math.to_rub(a, c) for c, a in by_currency.items()
    )
    level, level_name, _, _ = loyalty_math.compute_level(total_rub_eq)

    cutoff_30d = date.today() - timedelta(days=30)
    history = loyalty_math.get_monthly_history(db, user_id, months=2)
    last_30d_rub = history[-1][1] if history else 0.0

    user_data = {
        "full_name": user.full_name,
        "financial_segment": user.financial_segment.value,
        "total_cashback_rub_equivalent": total_rub_eq,
        "last_30d_rub": last_30d_rub,
        "total_rub": by_currency["rub"],
        "total_miles": by_currency["miles"],
        "total_bravo_points": by_currency["bravo-points"],
        "level": level,
        "level_name": level_name,
    }

    insights, generated_by = ai_insights.generate_insights(user_data)
    return InsightsResponse(user_id=user.id, insights=insights, generated_by=generated_by)
