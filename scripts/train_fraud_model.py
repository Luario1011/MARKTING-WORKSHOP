"""Entrena y exporta el modelo didáctico de fraude para GoldGuard.

El script trabaja exclusivamente con `data/transacciones_procesadas.csv`, una
muestra sintética reproducible. No pretende representar fraude bancario real.
Usa pandas y NumPy para que la corrida pueda ejecutarse sin una instalación de
scikit-learn: la regresión logística se ajusta con descenso por gradiente y el
artefacto JSON resultante se reutiliza en la interfaz Astro/React.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DATASET = PROJECT_ROOT / "data" / "transacciones_procesadas.csv"
RAW_DATASET = PROJECT_ROOT / "data" / "transacciones_originales_sinteticas.csv"
ARTIFACT_PATH = PROJECT_ROOT / "src" / "data" / "model-run.json"
SEED = 20260927


# Cada especificación es serializable y tiene un equivalente en TypeScript.
# El modelo usa variables transformadas, no la etiqueta ni los identificadores.
FEATURE_SPECS: list[dict[str, str]] = [
    {"name": "log_importe", "source": "amount", "transform": "log1p", "label": "Importe de la transacción"},
    {"name": "importe_vs_promedio", "source": "amountVsAverage", "transform": "identity", "label": "Importe frente al promedio"},
    {"name": "transacciones_24h", "source": "transactionCount24h", "transform": "identity", "label": "Velocidad en 24 horas"},
    {"name": "log_antiguedad", "source": "accountAgeDays", "transform": "log1p", "label": "Antigüedad de la cuenta"},
    {"name": "intentos_fallidos", "source": "failedAttempts", "transform": "identity", "label": "Intentos fallidos"},
    {"name": "log_distancia", "source": "distanceKm", "transform": "log1p", "label": "Distancia desde la última compra"},
    {"name": "horario_nocturno", "source": "isNight", "transform": "binary", "label": "Operación nocturna"},
    {"name": "dispositivo_nuevo", "source": "deviceNew", "transform": "binary", "label": "Dispositivo no reconocido"},
    {"name": "tarjeta_no_presente", "source": "cardNotPresent", "transform": "binary", "label": "Tarjeta no presente"},
    {"name": "pais_riesgo_medio", "source": "countryRisk", "transform": "equals:Medio", "label": "País de riesgo medio"},
    {"name": "pais_riesgo_alto", "source": "countryRisk", "transform": "equals:Alto", "label": "País de riesgo alto"},
    {"name": "comercio_tecnologia", "source": "merchant", "transform": "equals:Tecnología", "label": "Comercio de tecnología"},
    {"name": "comercio_viajes", "source": "merchant", "transform": "equals:Viajes", "label": "Comercio de viajes"},
    {"name": "comercio_joyeria", "source": "merchant", "transform": "equals:Joyería", "label": "Comercio de joyería"},
    {"name": "pago_virtual", "source": "paymentMethod", "transform": "equals:Tarjeta virtual", "label": "Pago con tarjeta virtual"},
    {"name": "billetera_digital", "source": "paymentMethod", "transform": "equals:Billetera digital", "label": "Pago con billetera digital"},
]


def sigmoid(values: np.ndarray) -> np.ndarray:
    """Sigmoide estable para evitar desbordamientos numéricos."""

    clipped = np.clip(values, -35, 35)
    return 1.0 / (1.0 + np.exp(-clipped))


def stratified_indices(labels: np.ndarray, fraction: float, rng: np.random.Generator) -> tuple[np.ndarray, np.ndarray]:
    """Separa una fracción manteniendo la proporción de fraude/no fraude."""

    selected: list[np.ndarray] = []
    remaining: list[np.ndarray] = []
    for class_value in (0, 1):
        indices = np.flatnonzero(labels == class_value)
        rng.shuffle(indices)
        cutoff = int(round(len(indices) * fraction))
        selected.append(indices[:cutoff])
        remaining.append(indices[cutoff:])
    return np.concatenate(selected), np.concatenate(remaining)


def values_for_spec(frame: pd.DataFrame, spec: dict[str, str]) -> np.ndarray:
    """Convierte una columna del CSV a una entrada numérica del modelo."""

    source = spec["source"]
    transform = spec["transform"]
    source_columns: dict[str, pd.Series] = {
        "amount": frame["amount_cop"].astype(float),
        "amountVsAverage": frame["amount_vs_average"].astype(float),
        "transactionCount24h": frame["transactions_24h"].astype(float),
        "accountAgeDays": frame["account_age_days"].astype(float),
        "failedAttempts": frame["failed_attempts"].astype(float),
        "distanceKm": frame["distance_km"].astype(float),
        "isNight": ((frame["transaction_hour"] <= 5) | (frame["transaction_hour"] >= 23)).astype(float),
        "deviceNew": (frame["device_trusted"] == "No").astype(float),
        "cardNotPresent": (frame["card_present"] == "No").astype(float),
        "countryRisk": frame["country_risk"].astype(str),
        "merchant": frame["merchant_category"].astype(str),
        "paymentMethod": frame["payment_method"].astype(str),
    }
    values = source_columns[source]
    if transform == "log1p":
        return np.log1p(values.to_numpy(dtype=float))
    if transform == "identity" or transform == "binary":
        return values.to_numpy(dtype=float)
    if transform.startswith("equals:"):
        return (values == transform.split(":", 1)[1]).to_numpy(dtype=float)
    raise ValueError(f"Transformación no soportada: {transform}")


def build_matrix(frame: pd.DataFrame) -> np.ndarray:
    return np.column_stack([values_for_spec(frame, spec) for spec in FEATURE_SPECS])


def fit_logistic_regression(
    matrix: np.ndarray,
    labels: np.ndarray,
    *,
    epochs: int = 1800,
    learning_rate: float = 0.085,
    l2_penalty: float = 0.012,
) -> tuple[np.ndarray, float]:
    """Ajusta una regresión logística ponderada para la clase minoritaria."""

    weights = np.zeros(matrix.shape[1], dtype=float)
    intercept = 0.0
    positive_rate = max(float(labels.mean()), 1e-6)
    example_weights = np.where(labels == 1, 0.5 / positive_rate, 0.5 / (1.0 - positive_rate))
    total_weight = float(example_weights.sum())

    for _ in range(epochs):
        probabilities = sigmoid(matrix @ weights + intercept)
        residual = (probabilities - labels) * example_weights
        gradient = (matrix.T @ residual) / total_weight + l2_penalty * weights
        intercept_gradient = float(residual.sum() / total_weight)
        weights -= learning_rate * gradient
        intercept -= learning_rate * intercept_gradient
    return weights, intercept


def binary_metrics(labels: np.ndarray, probabilities: np.ndarray, threshold: float) -> dict[str, float | int]:
    predicted = probabilities >= threshold
    true_positive = int(np.sum((predicted == 1) & (labels == 1)))
    false_positive = int(np.sum((predicted == 1) & (labels == 0)))
    true_negative = int(np.sum((predicted == 0) & (labels == 0)))
    false_negative = int(np.sum((predicted == 0) & (labels == 1)))
    precision = true_positive / max(true_positive + false_positive, 1)
    recall = true_positive / max(true_positive + false_negative, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-12)
    accuracy = (true_positive + true_negative) / len(labels)
    return {
        "threshold": float(threshold),
        "tp": true_positive,
        "fp": false_positive,
        "tn": true_negative,
        "fn": false_negative,
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "accuracy": float(accuracy),
    }


def precision_recall_auc(labels: np.ndarray, probabilities: np.ndarray) -> float:
    """Calcula el área trapezoidal de la curva precisión-recall."""

    order = np.argsort(-probabilities)
    sorted_labels = labels[order]
    true_positives = np.cumsum(sorted_labels)
    ranks = np.arange(1, len(labels) + 1)
    precision_at_rank = true_positives / ranks
    recall_at_rank = true_positives / max(sorted_labels.sum(), 1)
    precision_points = np.concatenate(([1.0], precision_at_rank))
    recall_points = np.concatenate(([0.0], recall_at_rank))
    return float(np.sum(np.diff(recall_points) * (precision_points[1:] + precision_points[:-1]) / 2))


def choose_threshold(labels: np.ndarray, probabilities: np.ndarray) -> float:
    """Prefiere F1, pero evita elegir un umbral que deje caer el recall bajo 75%."""

    candidates = np.linspace(0.12, 0.88, 153)
    reports = [binary_metrics(labels, probabilities, float(candidate)) for candidate in candidates]
    eligible = [report for report in reports if report["recall"] >= 0.75]
    selected = max(eligible or reports, key=lambda report: (report["f1"], report["recall"], report["precision"]))
    return float(selected["threshold"])


def risk_level(probability: float, low_threshold: float, high_threshold: float) -> str:
    if probability >= high_threshold:
        return "Alto"
    if probability >= low_threshold:
        return "Medio"
    return "Bajo"


def sample_rows(frame: pd.DataFrame, probabilities: np.ndarray, low_threshold: float, high_threshold: float) -> list[dict[str, Any]]:
    """Exporta ocho observaciones del holdout con variedad de niveles para la tabla."""

    output = frame.copy()
    output["probability"] = probabilities
    output["risk_level"] = [risk_level(value, low_threshold, high_threshold) for value in probabilities]
    selected: list[pd.DataFrame] = []
    for level, size in (("Alto", 3), ("Medio", 3), ("Bajo", 2)):
        candidates = output[output["risk_level"] == level].sort_values("probability", ascending=False)
        selected.append(candidates.head(size))
    rows = pd.concat(selected, ignore_index=True)
    return [
        {
            "id": row.transaction_id,
            "createdAt": row.transaction_datetime,
            "amount": int(row.amount_cop),
            "hour": int(row.transaction_hour),
            "country": row.country,
            "countryRisk": row.country_risk,
            "merchant": row.merchant_category,
            "paymentMethod": row.payment_method,
            "deviceTrusted": row.device_trusted == "Sí",
            "cardPresent": row.card_present == "Sí",
            "transactionCount24h": int(row.transactions_24h),
            "accountAgeDays": int(row.account_age_days),
            "failedAttempts": int(row.failed_attempts),
            "distanceKm": float(row.distance_km),
            "amountVsAverage": float(row.amount_vs_average),
            "riskScore": max(1, min(99, int(round(float(row.probability) * 100)))),
            "riskLevel": row.risk_level,
            "fraudActual": row.fraud_label == "Fraude",
        }
        for row in rows.itertuples(index=False)
    ]


def rounded(value: float, digits: int = 4) -> float:
    return round(float(value), digits)


def main() -> None:
    frame = pd.read_csv(PROCESSED_DATASET)
    raw_rows = max(sum(1 for _ in RAW_DATASET.open(encoding="utf-8")) - 1, 0)
    labels = (frame["fraud_label"] == "Fraude").astype(int).to_numpy(dtype=int)
    rng = np.random.default_rng(SEED)

    test_indices, non_test_indices = stratified_indices(labels, 0.15, rng)
    validation_relative_fraction = 0.15 / 0.85
    validation_relative_indices, train_relative_indices = stratified_indices(labels[non_test_indices], validation_relative_fraction, rng)
    validation_indices = non_test_indices[validation_relative_indices]
    train_indices = non_test_indices[train_relative_indices]

    raw_matrix = build_matrix(frame)
    train_matrix = raw_matrix[train_indices]
    validation_matrix = raw_matrix[validation_indices]
    test_matrix = raw_matrix[test_indices]
    train_labels = labels[train_indices]
    validation_labels = labels[validation_indices]
    test_labels = labels[test_indices]

    means = train_matrix.mean(axis=0)
    scales = train_matrix.std(axis=0)
    scales[scales == 0] = 1.0
    standardized_train = (train_matrix - means) / scales
    standardized_validation = (validation_matrix - means) / scales
    standardized_test = (test_matrix - means) / scales
    weights, intercept = fit_logistic_regression(standardized_train, train_labels)

    validation_probabilities = sigmoid(standardized_validation @ weights + intercept)
    high_threshold = choose_threshold(validation_labels, validation_probabilities)
    low_threshold = round(min(high_threshold * 0.52, high_threshold - 0.08), 4)
    test_probabilities = sigmoid(standardized_test @ weights + intercept)
    test_metrics = binary_metrics(test_labels, test_probabilities, high_threshold)
    test_metrics["pr_auc"] = precision_recall_auc(test_labels, test_probabilities)

    all_probabilities = sigmoid(((raw_matrix - means) / scales) @ weights + intercept)
    all_levels = np.array([risk_level(value, low_threshold, high_threshold) for value in all_probabilities])
    coefficient_order = np.argsort(np.abs(weights))[::-1]
    top_features = [
        {
            "name": FEATURE_SPECS[int(index)]["name"],
            "label": FEATURE_SPECS[int(index)]["label"],
            "direction": "eleva" if weights[int(index)] > 0 else "reduce",
            "weight": rounded(weights[int(index)]),
        }
        for index in coefficient_order[:5]
    ]

    artifact: dict[str, Any] = {
        "schemaVersion": 1,
        "run": {
            "name": "Regresión logística explicable",
            "engine": "Python + pandas + NumPy",
            "source": "data/transacciones_procesadas.csv",
            "seed": SEED,
            "note": "Corrida didáctica sobre datos sintéticos. No representa una validación bancaria real.",
        },
        "dataset": {
            "rawRows": raw_rows,
            "processedRows": int(len(frame)),
            "columns": int(len(frame.columns)),
            "target": "fraud_label",
            "fraudRate": rounded(labels.mean()),
            "averageAmount": rounded(frame["amount_cop"].mean(), 2),
            "splits": {"train": int(len(train_indices)), "validation": int(len(validation_indices)), "test": int(len(test_indices))},
        },
        "features": {
            "selected": len(FEATURE_SPECS),
            "specs": FEATURE_SPECS,
            "derived": [
                {"name": "importe_vs_promedio", "formula": "importe ÷ promedio_cliente", "purpose": "Mide cuánto se aleja la compra del hábito."},
                {"name": "horario_nocturno", "formula": "hora ≤ 05:00 o hora ≥ 23:00", "purpose": "Señala actividad fuera del horario habitual."},
                {"name": "log_distancia", "formula": "log(1 + distancia_km)", "purpose": "Reduce el peso extremo de trayectos muy largos."},
            ],
            "excluded": "No se usan ID, fecha, etiqueta ni variables duplicadas para evitar fuga de información o doble conteo.",
        },
        "thresholds": {"medium": low_threshold, "high": high_threshold},
        "metrics": {
            "accuracy": rounded(test_metrics["accuracy"]),
            "precision": rounded(test_metrics["precision"]),
            "recall": rounded(test_metrics["recall"]),
            "f1": rounded(test_metrics["f1"]),
            "prAuc": rounded(test_metrics["pr_auc"]),
        },
        "confusion": {key: int(test_metrics[key]) for key in ("tp", "fp", "tn", "fn")},
        "distribution": {
            "Bajo": int(np.sum(all_levels == "Bajo")),
            "Medio": int(np.sum(all_levels == "Medio")),
            "Alto": int(np.sum(all_levels == "Alto")),
        },
        "model": {
            "intercept": rounded(intercept, 8),
            "weights": [rounded(weight, 8) for weight in weights],
            "means": [rounded(mean, 8) for mean in means],
            "scales": [rounded(scale, 8) for scale in scales],
            "topFeatures": top_features,
        },
        "samples": sample_rows(frame.iloc[test_indices], test_probabilities, low_threshold, high_threshold),
    }

    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        "Modelo entrenado con "
        f"{artifact['dataset']['splits']['train']} filas; "
        f"PR-AUC={artifact['metrics']['prAuc']}, "
        f"recall={artifact['metrics']['recall']}, "
        f"F1={artifact['metrics']['f1']}."
    )
    print(f"Artefacto exportado: {ARTIFACT_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
    main()
