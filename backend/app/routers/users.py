"""
Эндпоинты для пользователей: список + логин по email/телефону без пароля.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import User
from ..schemas import UserBrief, LoginRequest, LoginResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserBrief])
def list_users(db: Session = Depends(get_db)):
    """Список всех тестовых пользователей для экрана выбора."""
    return db.query(User).order_by(User.id).all()


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Логин по email или phone_number — без пароля.
    Возвращает краткие данные юзера; фронт сохраняет user_id.
    """
    ident = req.identifier.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Введите email или телефон")

    user = (
        db.query(User)
        .filter(or_(User.email == ident, User.phone_number == ident))
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return LoginResponse(user=user)


@router.get("/{user_id}", response_model=UserBrief)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user
