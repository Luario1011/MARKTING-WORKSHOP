# 03 · Datos, minería y modelo Python

## Contexto de uso

Esta parte no es “análisis de datos” aislado: es el **pipeline de minería de datos** de la demostración. Parte de transacciones sintéticas, transforma patrones de comportamiento y estima una prioridad de revisión.

El nombre correcto para exponerlo es:

> Regresión logística explicable, entrenada en Python sobre un dataset sintético reproducible de 10.000 transacciones procesadas.

No digas que el archivo viene de un banco real. Las referencias bancarias de la interfaz aportan contexto para las señales, no originan ni entrenan el dataset.

## Los dos CSV

| Archivo | Filas | Para qué existe | Qué debe decirse con honestidad |
|---|---:|---|---|
| [`data/transacciones_originales_sinteticas.csv`](../data/transacciones_originales_sinteticas.csv) | 10.438 | Evidencia del escenario inicial. | Tiene errores insertados deliberadamente. |
| [`data/transacciones_procesadas.csv`](../data/transacciones_procesadas.csv) | 10.000 | Entrada que usa Python para entrenar. | Es una muestra limpia sintética, no un extracto bancario. |

El generador crea primero 10.000 filas limpias y luego fabrica el archivo inicial agregando 438 problemas:

- 160 duplicados;
- 140 filas con nulos en importe y distancia;
- 88 filas con fecha o país mal formateados;
- 50 filas con importe negativo o promedio inválido.

Eso simula un proceso antes/después y permite mostrar trazabilidad. Sin embargo, todavía no existe un script separado que limpie automáticamente el CSV sucio para producir el CSV procesado. Para rigor académico debe describirse como **simulación reproducible de limpieza**, no como limpieza bancaria real ejecutada contra el archivo crudo.

## Generador de datos: `generate-datasets.mjs`

| Función | Líneas | Recibe | Devuelve / modifica | La llama | Límite o contexto |
|---|---:|---|---|---|---|
| `mulberry32` | 13–20 | Semilla numérica. | Una función de números pseudoaleatorios. | Línea 4. | Es reproducible, no criptográficamente segura. |
| `pick` | 22 | Una lista. | Un elemento aleatorio de la lista. | `newTransaction`. | No pondera país o método; toma elementos con la misma probabilidad. |
| `clamp` | 23 | Valor, mínimo, máximo. | Valor dentro del rango. | `riskScore`, `newTransaction`. | Sólo limita números; no valida tipos. |
| `csvValue` | 24–27 | Un valor. | Texto CSV escapado. | `toCsv`. | Trata comillas, comas y saltos de línea. |
| `toCsv` | 28–30 | Filas y columnas. | Un texto CSV. | Escritura final de ambos archivos. | No es un parser CSV general; sólo prepara esta demostración. |
| `riskScore` | 32–45 | Una fila de transacción. | Puntaje sintético entre 1 y 99. | `newTransaction`. | Fabrica la señal de la etiqueta; no detecta fraude real. |
| `newTransaction` | 47–75 | Índice de fila. | Una fila limpia con etiqueta sintética. | `Array.from` en línea 78. | Usa distribuciones artificiales y no un historial de clientes real. |

### Cómo se fabrica una etiqueta sintética

`riskScore` suma puntos por valores como importe alto, compra alejada del promedio, ubicación inusual, dispositivo no reconocido, actividad acelerada, intentos fallidos, cuenta nueva, distancia, horario nocturno y pago virtual sin tarjeta presente. Después `newTransaction` transforma ese puntaje en una probabilidad y sortea `Fraude` o `No fraude`.

Esto explica dos cosas a la vez:

1. el modelo puede recuperar patrones coherentes y entregar una demostración reproducible;
2. sus métricas no miden una capacidad independiente de descubrir fraude del mundo real, porque la etiqueta fue fabricada a partir de reglas relacionadas con las variables que el modelo aprende.

## Variables y preparación

El CSV procesado tiene 19 columnas. El modelo no usa todas como entrada: convierte 16 señales en números ordenados y reutiliza ese orden tanto en Python como en TypeScript.

| # | Variable del modelo | Columna/campo de origen | Transformación | Para qué sirve |
|---:|---|---|---|---|
| 1 | `log_importe` | `amount_cop` / `amount` | `log(1 + importe)` | Reduce el efecto extremo de valores monetarios muy altos. |
| 2 | `importe_vs_promedio` | `amount_vs_average` | Identidad | Mide importe ÷ promedio histórico del cliente. |
| 3 | `transacciones_24h` | `transactions_24h` | Identidad | Indica actividad acumulada reciente. |
| 4 | `log_antiguedad` | `account_age_days` | `log(1 + días)` | Compara antigüedad sin dejar que cuentas muy viejas dominen. |
| 5 | `intentos_fallidos` | `failed_attempts` | Identidad | Añade fricción anterior al pago. |
| 6 | `log_distancia` | `distance_km` | `log(1 + km)` | Reduce la escala de trayectos largos. |
| 7 | `horario_nocturno` | `transaction_hour` / `hour` | 1 si ≤05:00 o ≥23:00 | Marca actividad nocturna. |
| 8 | `dispositivo_nuevo` | `device_trusted` | 1 si no era reconocido | Señala dispositivo no habitual. |
| 9 | `tarjeta_no_presente` | `card_present` | 1 si no estaba presente | Diferencia operación remota. |
| 10 | `pais_riesgo_medio` | `country_risk` | 1 si `Medio` | Codifica nivel geográfico medio. |
| 11 | `pais_riesgo_alto` | `country_risk` | 1 si `Alto` | Codifica nivel geográfico alto. |
| 12 | `comercio_tecnologia` | `merchant_category` | 1 si `Tecnología` | Indicador de categoría. |
| 13 | `comercio_viajes` | `merchant_category` | 1 si `Viajes` | Indicador de categoría. |
| 14 | `comercio_joyeria` | `merchant_category` | 1 si `Joyería` | Indicador de categoría. |
| 15 | `pago_virtual` | `payment_method` | 1 si tarjeta virtual | Indicador de método. |
| 16 | `billetera_digital` | `payment_method` | 1 si billetera digital | Indicador de método. |

`importe_vs_promedio` tiene una explicación fácil para el docente:

```text
importe_vs_promedio = importe de la compra ÷ promedio histórico del cliente

Ejemplo: $600.000 COP ÷ $150.000 COP = 4,0
La compra vale cuatro veces el gasto habitual.
```

No reemplaza el importe. El modelo usa tanto el valor monetario transformado como la relación con el comportamiento histórico.

Las columnas `transaction_id`, `transaction_datetime` y `fraud_label` se excluyen como entradas para evitar identificadores, fechas y fuga directa de la respuesta. Variables redundantes tampoco se incorporan dos veces.

## Entrenamiento: `train_fraud_model.py`

| Función | Líneas | Entrada | Salida | Llamada desde | Qué límite resuelve |
|---|---:|---|---|---|---|
| `sigmoid` | 49–53 | Logits de NumPy. | Probabilidades de 0 a 1. | Entrenamiento y predicciones en `main`. | Recorta a `[-35, 35]` para evitar desbordamiento numérico. |
| `stratified_indices` | 56–67 | Etiquetas, fracción y generador aleatorio. | Índices seleccionados y restantes. | `main`, dos veces. | Conserva la proporción sintética de fraude/no fraude en cada parte. |
| `values_for_spec` | 70–96 | DataFrame y una especificación. | Vector numérico de una variable. | `build_matrix`. | Si aparece una transformación desconocida, lanza `ValueError`. |
| `build_matrix` | 99–100 | DataFrame. | Matriz de 16 columnas. | `main`. | El orden depende de `FEATURE_SPECS`; no debe cambiarse a mano. |
| `fit_logistic_regression` | 103–126 | Matriz estandarizada y etiquetas. | Pesos e intercepto. | `main`. | Es implementación didáctica manual, no un optimizador industrial. |
| `binary_metrics` | 129–149 | Etiquetas, probabilidades y umbral. | VP, FP, VN, FN, precisión, recall, F1 y accuracy. | `choose_threshold` y `main`. | Protege divisiones por cero con mínimos numéricos. |
| `precision_recall_auc` | 152–163 | Etiquetas y probabilidades. | PR-AUC trapezoidal. | `main`. | Es útil cuando fraude es clase minoritaria. |
| `choose_threshold` | 166–173 | Validación y probabilidades. | Umbral alto. | `main`. | No selecciona sólo por accuracy: exige recall ≥75% antes de maximizar F1. |
| `risk_level` | 176–181 | Probabilidad y dos umbrales. | Bajo, Medio o Alto. | `main`, `sample_rows`. | Medio no es clase entrenada; es banda de interfaz. |
| `sample_rows` | 184–217 | Holdout, probabilidades y umbrales. | Ocho filas preparadas para React. | `main`. | Elige 3 Alto, 3 Medio y 2 Bajo por mayor probabilidad; no es muestra aleatoria. |
| `rounded` | 220–221 | Valor y precisión. | Número redondeado para JSON. | `main`. | Reduce ruido visual del artefacto. |
| `main` | 224–337 | Ninguna; usa rutas del proyecto. | Escribe `model-run.json`. | Bloque final de líneas 336–337. | Es el orquestador y debe ejecutarse desde un entorno con pandas y NumPy. |

### Qué hace `main`, en orden

1. Lee el CSV procesado y transforma `fraud_label` en `0` y `1`.
2. Usa la semilla `20260927` para que las particiones sean repetibles.
3. Reserva 15% para prueba y luego 15% del total para validación, manteniendo clases: 7.000 / 1.500 / 1.500.
4. Construye la matriz con las 16 variables.
5. Calcula media y desviación estándar sólo en entrenamiento.
6. Estandariza entrenamiento, validación y prueba con esas estadísticas de entrenamiento.
7. Ajusta pesos e intercepto mediante descenso por gradiente con ponderación de clase.
8. Busca el umbral alto en validación.
9. Evalúa una sola vez en la prueba reservada.
10. Puntúa las 10.000 filas para mostrar distribución Bajo/Medio/Alto.
11. Exporta un JSON con datos, transformaciones, pesos, métricas y muestras.

### Parámetros fijos de entrenamiento

| Parámetro | Valor | Significado |
|---|---:|---|
| Épocas | 1.800 | Veces que el descenso por gradiente actualiza los pesos. |
| Tasa de aprendizaje | 0,085 | Tamaño de cada actualización. |
| Penalización L2 | 0,012 | Evita pesos excesivamente grandes. |
| Umbrales candidatos | 0,12 a 0,88; 153 puntos | Opciones evaluadas sobre validación. |
| Recall mínimo | 75% | Regla para no elegir un F1 que deje escapar demasiados fraudes sintéticos. |
| Umbral medio | `min(alto × 0,52, alto − 0,08)` | Banda de revisión intermedia para la interfaz. |

## Resultado de la corrida incluida

La prueba reservada contiene 1.500 filas sintéticas. La corrida exportada informa:

| Medida | Valor | Interpretación correcta |
|---|---:|---|
| Umbral medio | 0,2938 | Desde allí la pantalla marca revisión media. |
| Umbral alto | 0,5650 | Desde allí la pantalla marca alerta alta. |
| Accuracy | 85,87% | Contexto general; no basta para elegir modelo con fraude minoritario. |
| Precisión | 20,40% | Proporción de alertas altas que coincidió con la etiqueta sintética. |
| Recall | 79,69% | Recuperó 51 de 64 fraudes sintéticos de prueba. |
| F1 | 32,48% | Equilibrio entre precisión y recall. |
| PR-AUC | 42,35% | Calidad de ordenamiento sobre clase minoritaria. |
| VP / FP / VN / FN | 51 / 199 / 1.237 / 13 | Matriz que debe explicarse junto a las métricas. |

Una frase segura para exponer:

> Elegimos el umbral alto mirando recall y F1 en validación, y reportamos PR-AUC y la matriz de confusión. La exactitud se muestra como contexto, no como único criterio.

## El puente: `model-run.json`

El JSON es el contrato entre Python y React. Tiene estas secciones:

| Propiedad | Quién la escribe | Quién la lee | Para qué sirve |
|---|---|---|---|
| `run` | Python | Informe de React | Nombre, motor, semilla y aviso sintético. |
| `dataset` | Python | Panel e informe | Filas, columnas, tasa de fraude y particiones. |
| `features` | Python | `fraudData.ts` e informe | Especificaciones y variables derivadas. |
| `thresholds` | Python | `levelFromProbability` y UI | Cortes Bajo/Medio/Alto. |
| `metrics`, `confusion` | Python | Informe y matriz | Evidencia de prueba reservada. |
| `distribution` | Python | Barras del tablero | Conteo de niveles sobre las 10.000 filas. |
| `model` | Python | `probabilityFromModel`, `explain` | Intercepto, pesos, medias y escalas. |
| `samples` | Python | Tabla de React | Ocho transacciones del holdout. |

No modifiques este JSON a mano. Cambiar sólo un peso, una media o el orden de una variable puede hacer que React calcule una probabilidad distinta de Python.

## Cómo repetir la demostración

Desde la raíz del proyecto:

```text
node scripts/generate-datasets.mjs
python scripts/train_fraud_model.py
npm install
npm run dev
```

No necesitas pnpm. Python requiere versión 3.10 o superior con `pandas` y `numpy` instalados.
