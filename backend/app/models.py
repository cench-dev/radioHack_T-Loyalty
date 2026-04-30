"""
SQLAlchemy ORM модели.

Схема:
  Users (1) → (N) Accounts (1) → (N) LoyaltyHistory
  Accounts (N) → (1) LoyaltyPrograms
  Offers — независимая таблица (партнёрские акции).
"""
import enum
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship

from .database import Base


class FinancialSegment(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    financial_segment = Column(Enum(FinancialSegment), nullable=False)

    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")


class LoyaltyProgram(Base):
    __tablename__ = "loyalty_programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)               # All Airlines / Black / Bravo
    cashback_currency = Column(String, nullable=False)  # miles / rub / bravo-points

    accounts = relationship("Account", back_populates="program")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    loyalty_program_id = Column(Integer, ForeignKey("loyalty_programs.id"), nullable=False)
    current_balance = Column(Float, nullable=False, default=0.0)

    user = relationship("User", back_populates="accounts")
    program = relationship("LoyaltyProgram", back_populates="accounts")
    history = relationship("LoyaltyTransaction", back_populates="account", cascade="all, delete-orphan")


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_history"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    cashback_amount = Column(Float, nullable=False)
    payout_date = Column(Date, nullable=False, index=True)

    account = relationship("Account", back_populates="history")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    partner_name = Column(String, nullable=False)
    short_description = Column(String, nullable=False)
    logo_url = Column(String, nullable=False)
    brand_color_hex = Column(String, nullable=False)
    cashback_percent = Column(Float, nullable=False)
    financial_segment = Column(Enum(FinancialSegment), nullable=False)
