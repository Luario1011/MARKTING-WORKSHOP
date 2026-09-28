# 00 · Visión general

## Objetivo y audiencia

GoldGuard es un prototipo académico para una exposición de minería de datos. Su audiencia es el docente y el grupo: debe demostrar preparación de datos, creación de variables, evaluación de un modelo y una interfaz que permita revisar una operación nueva.

La página no promete detectar fraude bancario real. Estima una **prioridad de revisión** (Bajo, Medio o Alto) sobre una muestra sintética reproducible.

## Arquitectura real

```text
                              ┌────────────────────────────────────┐
                              │        Trabajo fuera del navegador │
                              │                                    │
datos originales sintéticos ──┤ generate-datasets.mjs              │
  10.438 filas                │  crea CSV original y procesado     │
                              └──────────────┬─────────────────────┘
                                             │
                                             ▼
                              ┌────────────────────────────────────┐
                              │ train_fraud_model.py               │
                              │ pandas + NumPy                     │
                              │ limpia/transforma, entrena, mide   │
                              └──────────────┬─────────────────────┘
                                             │ escribe
                                             ▼
                              src/data/model-run.json
                                             │ se compila junto al sitio
                                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Navegador                                                                  │
│ Astro entrega la página estática → React hidrata los componentes           │
│ formulario → fraudData.ts → pesos/umbrales de model-run.json → resultado  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Qué significa cada capa

| Capa | Archivos | Responsabilidad | No hace |
|---|---|---|---|
| Presentación | `src/pages/*.astro`, `BaseLayout.astro`, componentes React y CSS | Muestra la idea, los datos, el simulador y la evidencia. | No entrena ni llama a una API. |
| Lógica de cliente | `src/lib/fraudData.ts` | Repite la transformación, normalización y puntuación con los parámetros exportados. | No lee los CSV completos ni guarda evaluaciones. |
| Pipeline de datos/modelo | `scripts/generate-datasets.mjs`, `scripts/train_fraud_model.py` | Genera la demostración, entrena, evalúa y exporta el artefacto. | No queda encendido atendiendo peticiones web. |
| Artefacto | `src/data/model-run.json` | Lleva pesos, medias, escalas, umbrales, métricas y ocho filas de muestra al frontend. | No es una base de datos. |

## La verdad sobre el “backend”

No hay backend web en esta versión. `astro.config.mjs` declara `output: 'static'`, de modo que Astro genera archivos estáticos. Tampoco hay rutas API, autenticación, base de datos, colas de servidor, almacenamiento de usuarios o solicitud HTTP para calcular el riesgo.

Es correcto explicarlo así:

> El proyecto tiene un **backend analítico offline**: Python procesa el CSV y exporta el modelo. La inferencia de la demo vive en el navegador para que la exposición pueda mostrar cada paso sin depender de internet.

No sería correcto decir que existe un backend bancario en tiempo real.

## Recorrido de una evaluación

```text
1. La persona cambia campos de la calculadora.
2. React guarda los valores en el estado `form`.
3. Al enviar el formulario, `evaluate` llama `assessTransaction(form)`.
4. `probabilityFromModel` produce 16 variables, las estandariza y aplica pesos.
5. La sigmoide convierte el resultado a probabilidad.
6. Los umbrales transforman la probabilidad en Bajo, Medio o Alto.
7. `explain` ordena contribuciones positivas y redacta hasta cuatro señales.
8. React muestra la recomendación y agrega la operación a una cola temporal.
```

El paso 8 ocurre sólo en memoria del navegador. Al recargar, la cola desaparece.

## Puntos de entrada

| URL | Archivo de ruta | Componente cliente | Para qué sirve |
|---|---|---|---|
| `/` | [`src/pages/index.astro`](../src/pages/index.astro) | `IdeaPresentation` | Presenta la idea, el proceso y las fuentes. |
| `/fraude` | [`src/pages/fraude.astro`](../src/pages/fraude.astro) | `FraudDashboard` | Panel, informe, calculadora, matriz y cartas de evidencia. |

Ambas rutas usan [`src/layouts/BaseLayout.astro`](../src/layouts/BaseLayout.astro), que carga el CSS global y el HTML base.

## Datos de esta entrega

- Original demostrativo: 10.438 filas con duplicados, nulos, formatos mixtos e importes inválidos introducidos adrede.
- Procesado demostrativo: 10.000 filas y 19 columnas, incluida `fraud_label` sintética.
- Modelo: regresión logística explicable creada con Python, pandas y NumPy.
- División: 7.000 filas de entrenamiento, 1.500 de validación y 1.500 de prueba reservada.
- Variables del modelo: 16 transformaciones; no usa ID, fecha ni la etiqueta como entrada.

Para los detalles y métricas, consulta [03 · datos y modelo](03_DATOS_Y_MODELO.md).
