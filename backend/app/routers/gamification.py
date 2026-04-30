"""
Эндпоинт геймификации: уровень, серия, ачивки, квесты.
GET /gamification/{user_id}
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Account, FinancialSegment
from ..schemas import GamificationResponse, Achievement, Quest
from .. import loyalty_math

router = APIRouter(prefix="/gamification", tags=["gamification"])


def _build_achievements(
    total_rub: float,
    total_miles: float,
    by_currency: dict,
    accounts_count: int,
    streak_days: int,
) -> list[Achievement]:
    """
    Логика ачивок: открыта если выполнено условие, прогресс - насколько близок.
    Иконки совпадают с символами из дизайна (i-target, i-diamond, etc).
    """
    achs = []

    #  Первый кэшбэк
    achs.append(Achievement(
        code="first_cashback",
        title="Первый кэшбэк",
        description="Получи свою первую выплату",
        icon="target",
        unlocked=total_rub > 0,
        progress=1.0 if total_rub > 0 else 0.0,
    ))
    # 10к рублей
    achs.append(Achievement(
        code="10k_rub",
        title="10к рублей",
        description="Накопи 10 000 ₽ кэшбэка",
        icon="diamond",
        unlocked=total_rub >= 10_000,
        progress=min(1.0, total_rub / 10_000),
    ))
    # 3 программы
    achs.append(Achievement(
        code="three_programs",
        title="3 программы",
        description="Используй все три программы лояльности",
        icon="rocket",
        unlocked=accounts_count >= 3,
        progress=min(1.0, accounts_count / 3),
    ))
    # Серия 7 дней
    achs.append(Achievement(
        code="streak_7",
        title="Серия 7 дней",
        description="Заходи 7 дней подряд",
        icon="flame",
        unlocked=streak_days >= 7,
        progress=min(1.0, streak_days / 7),
    ))
    # 5 000 миль
    achs.append(Achievement(
        code="miles_5k",
        title="5 000 миль",
        description="Накопи 5 000 миль на путешествие",
        icon="plane",
        unlocked=total_miles >= 5_000,
        progress=min(1.0, total_miles / 5_000) if total_miles else 0.0,
    ))
    # 100к рублей
    achs.append(Achievement(
        code="100k_rub",
        title="100к рублей",
        description="Накопи 100 000 ₽ кэшбэка",
        icon="crown",
        unlocked=total_rub >= 100_000,
        progress=min(1.0, total_rub / 100_000),
    ))
    # Год активности
    achs.append(Achievement(
        code="year_active",
        title="Год активности",
        description="Будь клиентом банка целый год",
        icon="trophy",
        unlocked=streak_days >= 365,
        progress=min(1.0, streak_days / 365),
    ))
    # 5 партнёров
    achs.append(Achievement(
        code="five_partners",
        title="5 партнёров",
        description="Сделай покупки у 5 партнёров",
        icon="star",
        unlocked=False,
        progress=0.6,  # фейк значение для демо
    ))
    # Реферал
    achs.append(Achievement(
        code="referral",
        title="Реферал",
        description="Пригласи друга в банк",
        icon="gift",
        unlocked=False,
        progress=0.0,
    ))
    return achs


def _build_quests(
    segment: FinancialSegment,
    streak_days: int,
    rub_balance: float,
) -> list[Quest]:
    """
    Список заданий, варьирующийся по сегменту
    Все квесты — про активацию траты или вовлечение, а не про пассив:
      LOW    → привычка использовать карту (низкий порог входа, мелкие награды)
      MEDIUM → увеличение оборота + cross-sell (средние награды)
      HIGH   → ежедневные-траты + рекомендации (крупные награды, статусность)
    """
    # Универсальный квест "вход в приложение" — для всех сегментов, done
    daily_login = Quest(
        code="daily_login",
        title="Вход в приложение",
        meta=f"{streak_days}-й день подряд · серия не прервалась",
        icon="check",
        reward_text="+ 10 ★",
        progress=1.0,
        featured=False,
        done=True,
    )

    if segment == FinancialSegment.LOW:
        return [
            Quest(
                code="first_partner_purchase",
                title="Первая покупка у партнёра",
                meta="Сделай покупку у любого партнёра до 30 апреля - получишь повышенный кэшбэк 10%",
                icon="shield",
                reward_text="+ 300 ₽",
                progress=0.0,
                featured=True,
                done=False,
            ),
            Quest(
                code="three_purchases_week",
                title="3 покупки за неделю",
                meta="Используй карту 3 раза за 7 дней - закрепи привычку",
                icon="card",
                reward_text="+ 100 ★",
                progress=0.33,
                featured=False,
                done=False,
            ),
            daily_login,
            Quest(
                code="setup_savings",
                title="Открой накопительный счёт",
                meta="15% годовых на остаток + бонус за первое пополнение",
                icon="savings",
                reward_text="+ 500 ₽",
                progress=0.0,
                featured=False,
                done=False,
            ),
        ]

    if segment == FinancialSegment.MEDIUM:
        return [
            Quest(
                code="activate_category",
                title="Активируй категорию повышенного кэшбэка",
                meta="Выбери 1 из 5 категорий и потрать в ней от 5 000 ₽ - кэшбэк до 15%",
                icon="target",
                reward_text="до 750 ₽",
                progress=0.0,
                featured=True,
                done=False,
            ),
            Quest(
                code="travel_with_miles",
                title="Используй мили на путешествие",
                meta="Оплати поездку или отель милями - открой Airlines-бонус 5%",
                icon="plane",
                reward_text="+ 200 миль",
                progress=0.4,
                featured=False,
                done=False,
            ),
            daily_login,
            Quest(
                code="open_brokerage",
                title="Открой брокерский счёт",
                meta="Месяц без комиссий + бонус за первую сделку",
                icon="trending",
                reward_text="+ 1 000 ₽",
                progress=0.0,
                featured=False,
                done=False,
            ),
        ]

    # HIGH
    return [
        Quest(
            code="lifestyle_spend",
            title="Премиум-категории на 50 000 ₽",
            meta="Рестораны, путешествия, lifestyle - повышенный кэшбэк 5% на всё свыше 50 000 ₽",
            icon="crown",
            reward_text="+ 2 500 ₽",
            progress=0.45,
            featured=True,
            done=False,
        ),
        Quest(
            code="invite_friend",
            title="Пригласи друга в Premium",
            meta="Получай 5 000 ₽ за каждого друга, оформившего Premium",
            icon="gift",
            reward_text="+ 5 000 ₽",
            progress=0.0,
            featured=False,
            done=False,
        ),
        daily_login,
        Quest(
            code="private_banking",
            title="Запиши на Private Banking",
            meta="Персональный менеджер, lounge-доступ, эксклюзивные офферы",
            icon="diamond",
            reward_text="статус",
            progress=0.0,
            featured=False,
            done=False,
        ),
    ]


@router.get("/{user_id}", response_model=GamificationResponse)
def get_gamification(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    by_currency = loyalty_math.get_user_total_cashback_by_currency(db, user_id)
    total_rub_eq = sum(loyalty_math.to_rub(a, c) for c, a in by_currency.items())
    level, level_name, progress, next_thr = loyalty_math.compute_level(total_rub_eq)
    streak = loyalty_math.compute_streak_days(user_id)

    accounts_count = db.query(Account).filter(Account.user_id == user_id).count()

    achievements = _build_achievements(
        total_rub=total_rub_eq,
        total_miles=by_currency["miles"],
        by_currency=by_currency,
        accounts_count=accounts_count,
        streak_days=streak,
    )

    # Возьмём баланс главного руб-счёта для квеста "сохрани кэшбэк" (если будет нужно)
    rub_account = (
        db.query(Account)
        .join(Account.program)
        .filter(Account.user_id == user_id)
        .filter(Account.program.has(cashback_currency="rub"))
        .first()
    )
    rub_balance = rub_account.current_balance if rub_account else 5240.0

    quests = _build_quests(
        segment=user.financial_segment,
        streak_days=streak,
        rub_balance=rub_balance,
    )

    return GamificationResponse(
        streak_days=streak,
        level=level,
        level_name=level_name,
        level_progress=round(progress, 4),
        next_level_threshold_rub=next_thr,
        total_cashback_rub=round(total_rub_eq, 2),
        achievements=achievements,
        quests=quests,
    )
