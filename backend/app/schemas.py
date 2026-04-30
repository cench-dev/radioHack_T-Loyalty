"""
контракты API.
"""
from datetime import date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

from .models import FinancialSegment


class UserBrief(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str
    financial_segment: FinancialSegment

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    """Логин по email ИЛИ телефону"""
    identifier: str = Field(..., description="email или phone_number")


class LoginResponse(BaseModel):
    user: UserBrief


class ProgramSummary(BaseModel):
    """Сводка по одной программе лояльности юзера"""
    program_id: int
    program_name: str
    currency: str
    current_balance: float
    total_earned_all_time: float
    total_earned_last_30d: float


class LoyaltySummary(BaseModel):
    """Главный агрегат раздела — для шапки дашборда"""
    user_id: int
    full_name: str
    financial_segment: FinancialSegment
    total_cashback_rub_equivalent: float    
    total_rub: float
    total_miles: float
    total_bravo_points: float
    programs: List[ProgramSummary]
    streak_days: int
    level: int                              
    level_name: str
    level_progress: float                   
    next_level_threshold_rub: float


class TransactionItem(BaseModel):
    transaction_id: int
    account_id: int
    program_id: int
    program_name: str
    cashback_amount: float
    currency: str
    payout_date: date

    model_config = {"from_attributes": True}


class MonthlyPoint(BaseModel):
    month: str                              # YYYY-MM
    rub_equivalent: float


class ForecastResponse(BaseModel):
    """Прогноз будущей выгоды"""
    next_month_rub: float
    next_year_rub: float
    method: str                   
    confidence: Literal["low", "medium", "high"]
    monthly_history: List[MonthlyPoint]


class OfferItem(BaseModel):
    id: int
    partner_name: str
    short_description: str
    logo_url: str
    brand_color_hex: str
    cashback_percent: float
    financial_segment: FinancialSegment

    model_config = {"from_attributes": True}


class CrossSellItem(BaseModel):
    """Кросс-селл другого продукта экосистемы."""
    product: Literal["investments", "business", "mobile", "premium", "savings"]
    title: str
    description: str
    cta: str
    external_url: str
    estimated_benefit_rub: Optional[float] = None

class Insight(BaseModel):
    icon: str
    title: str
    body: str


class InsightsResponse(BaseModel):
    user_id: int
    insights: List[Insight]
    generated_by: Literal["gigachat", "fallback"]


class Achievement(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    unlocked: bool
    progress: float                    


class Quest(BaseModel):
    code: str
    title: str
    meta: str
    icon: str
    reward_text: str
    progress: float
    featured: bool
    done: bool


class GamificationResponse(BaseModel):
    streak_days: int
    level: int
    level_name: str
    level_progress: float
    next_level_threshold_rub: float
    total_cashback_rub: float
    achievements: List[Achievement]
    quests: List[Quest]
