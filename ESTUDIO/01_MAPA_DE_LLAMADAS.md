# 01 · Mapa de llamadas

Este documento responde tres preguntas que suelen aparecer en la sustentación:

1. ¿Qué archivo inicia cada pantalla?
2. ¿Qué función calcula el resultado?
3. ¿De dónde vienen los números que se ven en la interfaz?

## Dos recorridos independientes

### A. Preparar una nueva corrida de minería

```text
Persona en terminal
  ├─ node scripts/generate-datasets.mjs
  │    ├─ mulberry32 → números pseudoaleatorios repetibles
  │    ├─ newTransaction → una fila limpia
  │    ├─ riskScore → probabilidad sintética de etiqueta
  │    └─ toCsv → dos archivos CSV
  │
  └─ python scripts/train_fraud_model.py
       ├─ build_matrix
       │    └─ values_for_spec × 16
       ├─ stratified_indices × 2
       ├─ fit_logistic_regression
       │    └─ sigmoid × 1.800 épocas
       ├─ choose_threshold
       │    └─ binary_metrics × 153 candidatos
       ├─ binary_metrics / precision_recall_auc
       ├─ sample_rows
       │    └─ risk_level
       └─ escribe src/data/model-run.json
```

Este recorrido ocurre **antes** de abrir la página. Si no se ejecuta, la interfaz conserva el último `model-run.json` disponible.

### B. Evaluar una transacción en el navegador

```text
/fraude
  → src/pages/fraude.astro
  → BaseLayout.astro
  → <FraudDashboard client:load />
  → FraudDashboard()
      ├─ useState(defaultInput)
      ├─ assessTransaction(defaultInput)      [resultado inicial]
      └─ formulario
          ├─ cambio de campo → update(...) → setForm(...)
          ├─ cambio de país → setForm(... country, countryRisk)
          └─ submit → evaluate(...)
               → assessTransaction(form)
                    → probabilityFromModel(form)
                         → featureValue(form, spec) × 16
                         → pesos + intercepto
                         → sigmoid(logit)
                    → levelFromProbability(probabilidad)
                    → explain(form)
                         → featureValue(form, spec) × 16
                    → objeto Assessment
               → setAssessment / setEvaluatedInput / setQueue
```

Nada de ese camino hace `fetch`, `axios`, una consulta SQL ni invoca Python. La inferencia se realiza localmente con el JSON que Astro ya entregó al navegador.

## Entradas web y componentes

| Inicio | Línea / archivo | Llama a | Resultado |
|---|---|---|---|
| Ruta `/` | [`src/pages/index.astro`](../src/pages/index.astro), línea 1 | `BaseLayout` y `IdeaPresentation client:load` | Presentación de la propuesta. |
| Ruta `/fraude` | [`src/pages/fraude.astro`](../src/pages/fraude.astro), línea 1 | `BaseLayout` y `FraudDashboard client:load` | Simulador, evidencia y tabla. |
| Layout compartido | [`src/layouts/BaseLayout.astro`](../src/layouts/BaseLayout.astro), línea 1 | Importa `global.css`; recibe `title`; inserta `<slot />` | HTML base en español, metadatos y estilos. |
| Portada | [`src/components/IdeaPresentation.tsx`](../src/components/IdeaPresentation.tsx), línea 1 | Sólo navegación HTML | No guarda estado ni calcula riesgo. |
| Tablero | [`src/components/FraudDashboard.tsx`](../src/components/FraudDashboard.tsx), línea 83 | React + `fraudData.ts` | Pantalla interactiva completa. |

`client:load` significa que Astro envía el HTML y React se activa apenas el navegador carga. No significa conexión a un servidor de modelos.

## Mapa de `fraudData.ts`

```text
model-run.json
  → modelRun
      ├─ modelSampleTransactions → tabla inicial
      ├─ dataset / metrics / confusion / distribution → tarjetas e informe
      └─ features + model + thresholds
           ├─ probabilityFromModel
           │    ├─ featureValue
           │    ├─ estandarización con means/scales
           │    └─ sigmoid
           ├─ levelFromProbability
           └─ explain
                └─ explanationLabels

assessTransaction
  → { score, probability, level, reasons, recommendation }
```

| Función | Archivo y líneas | Llama a | La llama | Devuelve |
|---|---|---|---|---|
| `clamp` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 91–93 | — | `sigmoid`, `assessTransaction` | Un número entre mínimo y máximo. |
| `sigmoid` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 95–98 | `clamp` | `probabilityFromModel` | Decimal de 0 a 1. |
| `featureValue` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 100–121 | — | `probabilityFromModel`, `explain` | Una de las 16 entradas numéricas. |
| `probabilityFromModel` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 123–130 | `featureValue`, `sigmoid` | `assessTransaction` | Probabilidad decimal de revisión. |
| `levelFromProbability` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 132–136 | — | `assessTransaction` | `Bajo`, `Medio` o `Alto`. |
| `explain` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 157–172 | `featureValue`, `explanationLabels` | `assessTransaction` | Hasta cuatro señales legibles. |
| `assessTransaction` | [`fraudData.ts`](../src/lib/fraudData.ts), líneas 174–189 | Las tres anteriores y `clamp` | `FraudDashboard` | Un `Assessment` completo. |

## Mapa de `FraudDashboard.tsx`

| Pieza | Línea | Quién la usa | Función concreta |
|---|---:|---|---|
| `percentage` | 36–38 | Métricas y porcentajes | Convierte `12.3` en `12,3%`. |
| `modelPercentage` | 40–42 | Métricas provenientes del JSON | Convierte una proporción decimal a porcentaje. |
| `formatDistance` | 44–47 | Resumen del resultado | Muestra metros si hay menos de un kilómetro. |
| `RiskBadge` | 49–51 | Barras, tabla y resultado | Pinta el nivel de riesgo con su clase CSS. |
| `SignalIcon` | 53–64 | Seis cartas de evidencia | Devuelve el SVG apropiado al tipo de señal. |
| `ExternalArrow` | 66–68 | Enlaces a la fuente | Devuelve una flecha SVG decorativa. |
| `MetricCard` | 70–81 | Cuatro métricas iniciales | Evita repetir el mismo marcado de tarjeta. |
| `FraudDashboard` | 83–337 | Ruta `/fraude` | Mantiene estado, responde a eventos y renderiza secciones. |
| `update` | 110–112 | Eventos `onChange` | Cambia una propiedad del formulario de forma tipada. |
| `evaluate` | 114–128 | Evento `onSubmit` | Calcula, actualiza la tarjeta y agrega una fila temporal. |

## Qué ocurre cuando se modifica un campo

| Campo visual | Evento | Estado afectado | Campo que realmente usa el modelo |
|---|---|---|---|
| Importe | `onChange` → `update('amount', …)` | `form.amount` | `log_importe` y, por separado, `importe_vs_promedio`. |
| País | `onChange` especial | `form.country` y `form.countryRisk` | Sólo `countryRisk`; el nombre es contexto visual. |
| Categoría | `update('merchant', …)` | `form.merchant` | Indicadores de tecnología, viajes y joyería. |
| Método de pago | `update('paymentMethod', …)` | `form.paymentMethod` | Tarjeta virtual y billetera digital. |
| Hora | `update('hour', …)` | `form.hour` | `horario_nocturno`. |
| Distancia | Conversión m/km y `update('distanceKm', …)` | Siempre kilómetros internamente | `log_distancia`. |
| Interruptores | `update('deviceTrusted'/'cardPresent', …)` | Booleanos | `dispositivo_nuevo` y `tarjeta_no_presente`. |

## Traspaso del modelo al frontend

La correspondencia exacta es el punto más importante de la arquitectura:

```text
Python FEATURE_SPECS (orden 1 a 16)
   = JSON features.specs (orden 1 a 16)
   = arrays means/scales/weights (mismo orden)
   = TypeScript featureValue(input, spec)
```

Si alguien cambia manualmente el orden de una de esas piezas, un peso puede aplicarse a la variable equivocada. Por eso se reentrena y se exporta el JSON; no se corrige a mano.
