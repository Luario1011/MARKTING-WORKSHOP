# Datos sintéticos para la demostración

Ejecuta `node scripts/generate-datasets.mjs` desde la raíz para recrear los archivos CSV sin depender de una descarga externa.

- `transacciones_originales_sinteticas.csv`: 10.438 filas, incluidas 160 duplicadas, 140 con nulos, 88 fechas o categorías mal formateadas y 50 importes inválidos.
- `transacciones_procesadas.csv`: 10.000 transacciones únicas y limpias, con 19 columnas útiles (incluida la etiqueta `fraud_label`).

Las variables derivadas son `amount_vs_average`, `velocity_24h` e `is_night_operation`. Son la evidencia para la fase de ingeniería de características. El conjunto es sintético y solo sirve para la demostración: para una entrega final, documenta claramente su origen o sustituye ambos archivos por la fuente real autorizada.

## Corrida de minería de datos

`../scripts/train_fraud_model.py` lee `transacciones_procesadas.csv`, crea 16 variables transformadas, reserva entrenamiento, validación y prueba, y ajusta una regresión logística con Python + pandas + NumPy. El resultado se exporta como `../src/data/model-run.json`; la interfaz lo usa para presentar la matriz de confusión, las métricas y la calculadora.

No se usan `transaction_id`, `transaction_datetime`, `fraud_label` ni columnas redundantes como atajos del modelo. La etiqueta sigue siendo sintética, por lo que la corrida demuestra trazabilidad y metodología, no desempeño bancario real.
