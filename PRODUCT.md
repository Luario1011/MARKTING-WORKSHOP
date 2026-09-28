# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro + React

## Users

El usuario principal es el docente que evalúa el proyecto integrador. Revisa la demostración, la trazabilidad de los datos, el uso de minería de datos y la justificación de cada nivel de riesgo.

## Product Purpose

GoldGuard es una calculadora demostrativa de riesgo de fraude. Permite introducir una transacción, estimar un nivel de riesgo bajo, medio o alto y explicar las señales que conducen a la recomendación. Su propósito es demostrar un flujo de minería de datos para la evaluación académica, no realizar análisis de datos genérico.

## Positioning

Un prototipo explicable para exposición: muestra cómo un modelo de prueba transforma variables de una transacción en una decisión de riesgo legible para el docente.

## Operating Context

Se usa durante la exposición y revisión del proyecto integrador. El docente puede consultar el estado de los datos, probar la calculadora y revisar las señales externas que justifican las variables del modelo.

## Capabilities and Constraints

- Calculadora interactiva de riesgo con resultado bajo, medio o alto y explicación de señales; usa el artefacto de una regresión logística Python/NumPy entrenada sobre la muestra sintética.
- El producto se presenta como modelo de prueba; no debe afirmarse que es un sistema productivo ni un modelo entrenado con fraude real sin evidencia independiente.
- La evidencia bancaria debe dejar clara su procedencia, alcance y autorización de uso. El repositorio actual contiene una demostración sintética reproducible de 10.000 transacciones; está pendiente documentar si será reemplazada por un conjunto bancario utilizable para la entrega final.
- No hay restricciones funcionales ni de accesibilidad adicionales confirmadas.

## Brand Commitments

GoldGuard debe comunicar con claridad que se trata de un modelo de prueba basado en minería de datos y hacer visible el origen de las señales o datos utilizados como respaldo.

## Evidence on Hand

- `data/transacciones_originales_sinteticas.csv` y `data/transacciones_procesadas.csv`: demostración sintética reproducible.
- `scripts/train_fraud_model.py` y `src/data/model-run.json`: pipeline y artefacto reproducible del modelo de prueba, con división entrenamiento/validación/prueba.
- `REFERENCIAS.md`: fuentes de señales de riesgo publicadas por Bank of America, Chase y Asobancaria.
- La fuente bancaria de datos que se use para la entrega final requiere documentación de procedencia y permiso de uso.

## Product Principles

1. El docente debe poder entender la decisión, no solo ver una categoría de riesgo.
2. La calculadora demuestra minería de datos y debe diferenciarse de un análisis descriptivo de datos.
3. El modelo de prueba debe declarar sus límites y no exagerar sus resultados.
4. Las señales y datos deben conservar trazabilidad hacia su fuente.
