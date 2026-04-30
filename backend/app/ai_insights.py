"""
AI-советы от GigaChat API
"""
import os
import json
import time
from typing import List, Dict, Tuple

from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
from gigachat.exceptions import RateLimitError

from .schemas import Insight


def safe_chat(client, payload, retries: int = 3, base_delay: float = 1.5):
    """
    Retry wrapper для защиты от 429 RateLimitError
    """
    for attempt in range(retries):
        try:
            return client.chat(payload)
        except RateLimitError:
            if attempt == retries - 1:
                raise
            time.sleep(base_delay * (attempt + 1))


def clean_json(text: str) -> str:
    """
    Убирает markdown ```json блоки если модель их вернула
    """
    text = text.strip()

    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rsplit("```", 1)[0]

    return text.strip()


def generate_insights(user_data: Dict) -> Tuple[List[Insight], str]:
    """
    Генерация персональных советов через GigaChat
    Возвращает: (insights, "gigachat")
    """

    credentials = os.getenv("GIGACHAT_CREDENTIALS", "").strip()
    if not credentials:
        raise ValueError("GIGACHAT_CREDENTIALS не задан в переменных окружения")

    scope = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")

    with GigaChat(
        credentials=credentials,
        verify_ssl_certs=False,
        scope=scope
    ) as client:

        payload = Chat(
            messages=[
                Messages(
                    role=MessagesRole.SYSTEM,
                    content=(
                        "Ты финансовый ассистент банка. "
                        "Отвечай строго JSON-массивом без пояснений."
                    )
                ),
                Messages(
                    role=MessagesRole.USER,
                    content=f"""
Сгенерируй 2-3 персональных инсайта для пользователя.

Данные:
- Имя: {user_data.get('full_name')}
- Сегмент: {user_data.get('financial_segment')}
- Кэшбэк: {user_data.get('total_cashback_rub_equivalent', 0):.0f}
- 30 дней: {user_data.get('last_30d_rub', 0):.0f}
- Мили: {user_data.get('total_miles', 0):.0f}
- Bravo: {user_data.get('total_bravo_points', 0):.0f}
- Уровень: {user_data.get('level')} ({user_data.get('level_name')})

Формат строго:
[
  {{
    "icon": "trending|sparkles|plane|crown|target|gift",
    "title": "до 30 символов",
    "body": "до 150 символов"
  }}
]

Без markdown. Только JSON.
"""
                )
            ],
            temperature=0.7,
            max_tokens=600
        )

        response = safe_chat(client, payload)

        text = response.choices[0].message.content
        text = clean_json(text)

        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Некорректный JSON от GigaChat: {text}") from e

        insights = [Insight(**item) for item in data]

        return insights, "gigachat"