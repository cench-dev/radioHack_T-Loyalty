"""
API tests
Запуск: pytest -v
"""
import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.main import app 

client = TestClient(app)


def test_health_check():
    """Health endpoint работает"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_users_returns_30_users():
    """Список юзеров возвращает 30 тестовых пользователей."""
    response = client.get("/users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) == 30
    for u in users:
        assert u["id"] > 0
        assert "@" in u["email"]
        assert u["financial_segment"] in ["LOW", "MEDIUM", "HIGH"]


def test_login_by_email():
    """Логин по email возвращает данные юзера"""
    response = client.post(
        "/users/login",
        json={"identifier": "dmitriy.ivanov29@yandex.ru"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["full_name"].startswith("Иванов")
    assert data["user"]["financial_segment"] == "LOW"


def test_login_invalid_user_404():
    """Логин с несуществующим email возвращает 404"""
    response = client.post(
        "/users/login",
        json={"identifier": "ghost@nowhere.com"}
    )
    assert response.status_code == 404


def test_loyalty_summary_for_user_1():
    """Summary для юзера 1 содержит все требуемые поля и программы"""
    response = client.get("/loyalty/1/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert data["financial_segment"] in ["LOW", "MEDIUM", "HIGH"]
    assert data["total_cashback_rub_equivalent"] >= 0
    assert isinstance(data["programs"], list)
    assert 1 <= data["level"] <= 5
    assert 0.0 <= data["level_progress"] <= 1.0


def test_history_for_user_returns_transactions():
    """История транзакций возвращает список с корректной структурой"""
    response = client.get("/loyalty/1/history?limit=10")
    assert response.status_code == 200
    transactions = response.json()
    assert len(transactions) > 0
    tx = transactions[0]
    assert "transaction_id" in tx
    assert "cashback_amount" in tx
    assert "currency" in tx


def test_forecast_returns_monthly_history():
    """Прогноз содержит history и предсказания"""
    response = client.get("/loyalty/1/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["next_month_rub"] >= 0
    assert data["next_year_rub"] >= 0
    assert data["confidence"] in ["low", "medium", "high"]
    assert isinstance(data["monthly_history"], list)


def test_offers_for_user_filtered_by_segment():
    """Офферы фильтруются под сегмент юзера"""
    user_resp = client.get("/users/1")
    segment = user_resp.json()["financial_segment"]

    response = client.get("/offers/for-user/1")
    assert response.status_code == 200
    offers = response.json()
    for offer in offers:
        assert offer["financial_segment"] == segment


def test_cross_sell_returns_three_products():
    """Кросс-селл возвращает 3 продукта под сегмент"""
    response = client.get("/offers/cross-sell/1")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 3
    products = {item["product"] for item in items}
    valid = {"investments", "business", "mobile", "premium", "savings"}
    assert products.issubset(valid)


def test_gamification_returns_level_and_quests():
    """Геймификация возвращает уровень, ачивки, квесты"""
    response = client.get("/gamification/1")
    assert response.status_code == 200
    data = response.json()
    assert 1 <= data["level"] <= 5
    assert len(data["achievements"]) == 9
    assert len(data["quests"]) == 4
    featured = [q for q in data["quests"] if q["featured"]]
    assert len(featured) == 1
    assert featured[0]["code"] == "save_cashback"
    assert "5%" in featured[0]["meta"]


def test_insights_returns_at_least_one():
    """AI-советы возвращают хотя бы один совет"""
    response = client.get("/loyalty/1/insights")
    assert response.status_code == 200
    data = response.json()
    assert data["generated_by"] in ["gigachat", "fallback"]
    assert len(data["insights"]) >= 1
