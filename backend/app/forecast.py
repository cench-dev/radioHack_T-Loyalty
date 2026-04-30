"""
Прогнозирование будущего кэшбэка
Линейная регрессия по месячным агрегатам
уверенность в прогнозе считается по R² модели и коэффициенту вариации (CV) истории
"""
from typing import List, Tuple
import numpy as np
from sklearn.linear_model import LinearRegression


def forecast_cashback(
    history: List[Tuple[str, float]]
) -> Tuple[float, float, str, str]:
    """
    Принимает список (YYYY-MM, rub) - возвращает (next_month, next_year, method, confidence)
    """
    if len(history) < 2:
        last = history[-1][1] if history else 0.0
        return last, last * 12, "mean_baseline", "low"

    if len(history) < 4:
        # Среднее за имеющиеся месяцы
        mean = float(np.mean([v for _, v in history]))
        return mean, mean * 12, "mean_baseline", "low"

    # Линейная регрессия
    X = np.array(range(len(history))).reshape(-1, 1)
    y = np.array([v for _, v in history])
    model = LinearRegression().fit(X, y)

    next_idx = len(history)
    next_month = max(0.0, float(model.predict([[next_idx]])[0]))

    next_year_preds = model.predict(
        np.array(range(next_idx, next_idx + 12)).reshape(-1, 1)
    )
    next_year = float(np.maximum(next_year_preds, 0).sum())

    # R² — насколько хорошо модель описывает наблюдения
    r2 = float(model.score(X, y))

    # CV — коэффициент вариации истории (std / mean)
    #    Высокий CV → данные шумные → низкая уверенность
    mean_y = float(np.mean(y))
    std_y = float(np.std(y))
    cv = std_y / mean_y if mean_y > 0 else 1.0

    # Длина истории — чем больше точек, тем выше доверие
    history_factor = min(1.0, len(history) / 12)

    # Композитный score: R² растит уверенность, CV снижает, длина учитывается
    score = (r2 * 0.5) + (history_factor * 0.3) - (min(cv, 1.0) * 0.4)

    if score > 0.5:
        confidence = "high"
    elif score > 0.15:
        confidence = "medium"
    else:
        confidence = "low"

    return next_month, next_year, "linear_regression", confidence

