"""
Парсинг CSV и наполнение БД.
"""
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from .database import SessionLocal, engine, Base
from .models import (
    User, Account, LoyaltyProgram, LoyaltyTransaction, Offer, FinancialSegment
)

DATA_DIR = Path(os.getenv("DATA_DIR", "./data"))


def _read_csv(filename: str, sep: str) -> pd.DataFrame:
    """Читаем CSV, убиваем BOM в заголовках и пробелы"""
    path = DATA_DIR / filename
    df = pd.read_csv(path, sep=sep, encoding="utf-8-sig")
    df.columns = [c.strip().lstrip("\ufeff") for c in df.columns]
    return df


def seed_database():
    """Заполнить БД из CSV. Безопасно вызывать многократно"""
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("[seed] Database already populated, skipping")
            return

        programs_df = _read_csv("LoyaltyPrograms.csv", sep=";")
        for _, row in programs_df.iterrows():
            db.add(LoyaltyProgram(
                id=int(row["loyalty_program_id"]),
                name=str(row["loyalty_program_name"]),
                cashback_currency=str(row["cashback_currency"]),
            ))

        users_df = _read_csv("Users.csv", sep=";")
        for _, row in users_df.iterrows():
            db.add(User(
                id=int(row["id"]),
                email=str(row["email"]).strip(),
                phone_number=str(row["phone_number"]).strip(),
                full_name=str(row["full_name"]).strip(),
                financial_segment=FinancialSegment(row["financial_segment"]),
            ))
        accounts_df = _read_csv("Accounts.csv", sep=";")
        for _, row in accounts_df.iterrows():
            db.add(Account(
                id=int(row["account_id"]),
                user_id=int(row["user_id"]),
                loyalty_program_id=int(row["loyalty_program_id"]),
                current_balance=float(row["current_balance"]),
            ))

        history_df = _read_csv("LoyaltyHistory.csv", sep=",")
        for _, row in history_df.iterrows():
            db.add(LoyaltyTransaction(
                id=int(row["transaction_id"]),
                account_id=int(row["account_id"]),
                cashback_amount=float(row["cashback_amount"]),
                payout_date=datetime.strptime(str(row["payout_date"]), "%Y-%m-%d").date(),
            ))

        offers_df = _read_csv("Offers.csv", sep=",")
        for _, row in offers_df.iterrows():
            db.add(Offer(
                id=int(row["partner_id"]),
                partner_name=str(row["partner_name"]),
                short_description=str(row["short_description"]),
                logo_url=str(row["logo_url"]),
                brand_color_hex=str(row["brand_color_hex"]),
                cashback_percent=float(row["cashback_percent"]),
                financial_segment=FinancialSegment(row["financial_segment"]),
            ))

        db.commit()
        print(f"[seed] Loaded: {len(users_df)} users, {len(accounts_df)} accounts, "
              f"{len(history_df)} transactions, {len(offers_df)} offers.")
    except Exception as e:
        db.rollback()
        print(f"[seed] ERROR: {e}")
        raise
    finally:
        db.close()
