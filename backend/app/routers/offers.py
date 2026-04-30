"""
Эндпоинты офферов и кросс-селла:
  GET /offers                            — все партнёры
  GET /offers/for-user/{user_id}         — отфильтрованы под сегмент
  GET /offers/cross-sell/{user_id}       — продукты экосистемы под сегмент
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Offer, FinancialSegment
from ..schemas import OfferItem, CrossSellItem

router = APIRouter(prefix="/offers", tags=["offers"])


@router.get("", response_model=List[OfferItem])
def list_all_offers(db: Session = Depends(get_db)):
    """Все офферы без фильтра по сегменту."""
    return db.query(Offer).order_by(Offer.cashback_percent.desc()).all()


@router.get("/for-user/{user_id}", response_model=List[OfferItem])
def list_offers_for_user(user_id: int, db: Session = Depends(get_db)):
    """Офферы под сегмент юзера. По кейсу financial_segment в Offers соответствует целевому сегменту."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return (
        db.query(Offer)
        .filter(Offer.financial_segment == user.financial_segment)
        .order_by(Offer.cashback_percent.desc())
        .all()
    )

PRODUCT_URLS = {
    "investments": "https://www.tbank.ru/invest/",
    "business":    "https://www.tbank.ru/business/",
    "mobile":      "https://www.tbank.ru/mobile-operator/",
    "premium":     "https://www.tbank.ru/tinkoff-premium/",
    "savings":     "https://www.tbank.ru/savings/saving-account/",
}


# Кросс-селл — статически зашитые предложения, варьируются по сегменту
CROSS_SELL_BY_SEGMENT = {
    FinancialSegment.LOW: [
        {
            "product": "savings",
            "title": "Накопительный счёт",
            "description": "15% годовых на остаток + кэшбэк рублями",
            "cta": "Открыть за 1 минуту",
            "external_url": PRODUCT_URLS["savings"],
            "estimated_benefit_rub": 1500.0,
        },
        {
            "product": "investments",
            "title": "Инвесткопилка",
            "description": "+0.5% к кэшбэку при балансе от 10 000 ₽",
            "cta": "Узнать больше",
            "external_url": PRODUCT_URLS["investments"],
            "estimated_benefit_rub": 500.0,
        },
        {
            "product": "mobile",
            "title": "Мобильная связь",
            "description": "Безлимит на 6 месяцев бесплатно с подпиской",
            "cta": "Подключить",
            "external_url": PRODUCT_URLS["mobile"],
            "estimated_benefit_rub": 3600.0,
        },
    ],
    FinancialSegment.MEDIUM: [
        {
            "product": "investments",
            "title": "Брокерский счёт",
            "description": "Доступ к акциям и облигациям без комиссии 1 месяц",
            "cta": "Открыть счёт",
            "external_url": PRODUCT_URLS["investments"],
            "estimated_benefit_rub": 5000.0,
        },
        {
            "product": "savings",
            "title": "Накопительный счёт Pro",
            "description": "До 16% годовых с автопополнением",
            "cta": "Открыть",
            "external_url": PRODUCT_URLS["savings"],
            "estimated_benefit_rub": 8000.0,
        },
        {
            "product": "business",
            "title": "Расчётный счёт для ИП",
            "description": "Бесплатный год обслуживания при подключении до 30 апреля",
            "cta": "Открыть ИП",
            "external_url": PRODUCT_URLS["business"],
            "estimated_benefit_rub": 12000.0,
        },
    ],
    FinancialSegment.HIGH: [
        {
            "product": "premium",
            "title": "Tinkoff Premium",
            "description": "Персональный менеджер, lounge-доступ в аэропортах, 5% кэшбэк",
            "cta": "Получить доступ",
            "external_url": PRODUCT_URLS["premium"],
            "estimated_benefit_rub": 50000.0,
        },
        {
            "product": "investments",
            "title": "Структурные продукты",
            "description": "Защита капитала + потенциал доходности до 25%",
            "cta": "Узнать условия",
            "external_url": PRODUCT_URLS["investments"],
            "estimated_benefit_rub": 75000.0,
        },
        {
            "product": "business",
            "title": "Бизнес-решения",
            "description": "Эквайринг 0.7%, выделенный менеджер, овердрафт от 5 млн",
            "cta": "Подключить",
            "external_url": PRODUCT_URLS["business"],
            "estimated_benefit_rub": 100000.0,
        },
    ],
}


@router.get("/cross-sell/{user_id}", response_model=List[CrossSellItem])
def get_cross_sell(user_id: int, db: Session = Depends(get_db)):
    """Продукты экосистемы под сегмент юзера."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    items = CROSS_SELL_BY_SEGMENT[user.financial_segment]
    return [CrossSellItem(**item) for item in items]
