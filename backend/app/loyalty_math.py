"""
Бизнес-логика лояльности: агрегаты, уровни, конвертация валют
Чистые функции легко покрываются юнит-тестами
"""
from datetime import date, timedelta
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from . import models

# конверсия в рубли
CURRENCY_TO_RUB = {
    "rub": 1.0,
    "miles": 1.5,
    "bravo-points": 1.0,
}


def to_rub(amount: float, currency: str) -> float:
    """Сконвертировать любую валюту лояльности в рубли"""
    return amount * CURRENCY_TO_RUB.get(currency, 1.0)



LEVELS = [
    (0,        "Новичок"),
    (5_000,    "Активный"),
    (15_000,   "Постоянный"),
    (50_000,   "Топ"),
    (200_000,  "Премиум"),
]


def compute_level(total_rub: float) -> Tuple[int, str, float, float]:
    """
    По общему кэшбэку (в рублёвом эквиваленте) определить:
      level (1..5), level_name, progress (0..1), next_threshold
    """
    level = 1
    name = LEVELS[0][1]
    for i, (threshold, lname) in enumerate(LEVELS):
        if total_rub >= threshold:
            level = i + 1
            name = lname

    if level >= len(LEVELS):
        return level, name, 1.0, LEVELS[-1][0]

    cur_thr = LEVELS[level - 1][0]
    next_thr = LEVELS[level][0]
    progress = (total_rub - cur_thr) / (next_thr - cur_thr) if next_thr > cur_thr else 0.0
    return level, name, max(0.0, min(1.0, progress)), float(next_thr)


def get_user_total_cashback_by_currency(db: Session, user_id: int) -> Dict[str, float]:
    """Сумма всех начислений юзера по валютам (rub/miles/bravo-points)"""
    rows = (
        db.query(
            models.LoyaltyProgram.cashback_currency,
            func.coalesce(func.sum(models.LoyaltyTransaction.cashback_amount), 0).label("total"),
        )
        .join(models.Account, models.Account.loyalty_program_id == models.LoyaltyProgram.id)
        .join(models.LoyaltyTransaction, models.LoyaltyTransaction.account_id == models.Account.id)
        .filter(models.Account.user_id == user_id)
        .group_by(models.LoyaltyProgram.cashback_currency)
        .all()
    )
    out = {"rub": 0.0, "miles": 0.0, "bravo-points": 0.0}
    for currency, total in rows:
        out[currency] = float(total or 0)
    return out


def get_program_summaries(db: Session, user_id: int) -> List[dict]:
    """По каждому счёту юзера: программа, валюта, баланс, начисления all-time / 30d"""
    accounts = (
        db.query(models.Account)
        .filter(models.Account.user_id == user_id)
        .all()
    )
    today = date.today()
    cutoff_30d = today - timedelta(days=30)

    summaries = []
    for acc in accounts:
        all_time = (
            db.query(func.coalesce(func.sum(models.LoyaltyTransaction.cashback_amount), 0))
            .filter(models.LoyaltyTransaction.account_id == acc.id)
            .scalar() or 0
        )
        last_30 = (
            db.query(func.coalesce(func.sum(models.LoyaltyTransaction.cashback_amount), 0))
            .filter(
                models.LoyaltyTransaction.account_id == acc.id,
                models.LoyaltyTransaction.payout_date >= cutoff_30d,
            )
            .scalar() or 0
        )
        summaries.append({
            "program_id": acc.program.id,
            "program_name": acc.program.name,
            "currency": acc.program.cashback_currency,
            "current_balance": float(acc.current_balance),
            "total_earned_all_time": float(all_time),
            "total_earned_last_30d": float(last_30),
        })
    return summaries


def get_monthly_history(db: Session, user_id: int, months: int = 12) -> List[Tuple[str, float]]:
    """История кэшбэка по месяцам (в рублёвом эквиваленте)"""
    rows = (
        db.query(
            models.LoyaltyTransaction.payout_date,
            models.LoyaltyTransaction.cashback_amount,
            models.LoyaltyProgram.cashback_currency,
        )
        .join(models.Account, models.Account.id == models.LoyaltyTransaction.account_id)
        .join(models.LoyaltyProgram, models.LoyaltyProgram.id == models.Account.loyalty_program_id)
        .filter(models.Account.user_id == user_id)
        .all()
    )

    bucket: Dict[str, float] = {}
    for payout_date, amount, currency in rows:
        key = payout_date.strftime("%Y-%m")
        bucket[key] = bucket.get(key, 0) + to_rub(float(amount), currency)

    items = sorted(bucket.items())
    return items[-months:]


def compute_streak_days(user_id: int) -> int:
    """
    Серия ежедневного захода. По заданию у нас нет логов входа - генерируем
    детерминированный фейковый серия на базе user_id (стабильно между запросами)
    """
    return 7 + (user_id * 3) % 30


def get_total_cashback_rub_equivalent(db: Session, user_id: int) -> float:
    """Сумма всех начислений в рублёвом эквиваленте"""
    by_currency = get_user_total_cashback_by_currency(db, user_id)
    return sum(to_rub(amount, currency) for currency, amount in by_currency.items())
