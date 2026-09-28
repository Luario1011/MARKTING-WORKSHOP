# GoldGuard

Prototipo en **Astro + React + Python** para el proyecto de detección y evaluación de fraude. Incluye una muestra sintética reproducible de 10.000 transacciones procesadas, un modelo de regresión logística entrenado con NumPy y una calculadora que usa el artefacto exportado de esa corrida.

## Ejecutar la interfaz

Requiere Node.js 20+. Puedes usar npm; pnpm es opcional:

```bash
npm install
npm run dev
```

Luego abre la dirección que indica la terminal.

## Guía de estudio del código

Si necesitas entender el proyecto sin modificar la versión funcional, abre [`ESTUDIO/README.md`](ESTUDIO/README.md). Incluye mapa de llamadas, explicación del frontend, pipeline Python, límites responsables, referencia por líneas y una copia de lectura de los archivos clave.

## Reproducir los datos y el modelo

```bash
node scripts/generate-datasets.mjs
python scripts/train_fraud_model.py
```

El segundo comando requiere Python 3.10+ con `pandas` y `numpy`. Genera `src/data/model-run.json`, el artefacto que el frontend importa para mostrar la matriz, métricas y probabilidades. No edites ese JSON a mano: vuelve a ejecutar el script cuando cambie el CSV.

## Qué demuestra

- `data/transacciones_originales_sinteticas.csv`: 10.438 filas con nulos, duplicados, formatos erróneos e importes inválidos introducidos a propósito.
- `data/transacciones_procesadas.csv`: 10.000 transacciones limpias con 19 columnas y una etiqueta `fraud_label` sintética.
- `scripts/train_fraud_model.py`: crea 16 variables transformadas, separa entrenamiento/validación/prueba, ajusta una regresión logística con Python + NumPy y exporta métricas reales de la corrida.
- `/fraude`: presenta el estado del conjunto, explica el modelo, estima una nueva transacción con los coeficientes exportados, mantiene una cola temporal y documenta las señales de revisión.

## Límites responsables

- Los datos y etiquetas son sintéticos; las métricas validan la simulación, no el desempeño de un banco.
- Las referencias bancarias de la interfaz justifican señales de prevención; no son la fuente de este dataset.
- El resultado es un nivel de revisión bajo, medio o alto. Una persona debe confirmar un posible fraude.

## Al recibir un dataset real autorizado

1. Conserva una copia inalterada y documenta el origen, permiso y anonimización.
2. Conserva una copia inalterada como `datos_originales.csv` y exporta el resultado de limpieza como `datos_procesados.csv`.
3. Reentrena el pipeline y guarda una nueva corrida reproducible; la función `assessTransaction` debe consumir sus probabilidades reales.
4. Actualiza las métricas, matriz de confusión, umbrales y hallazgos con la corrida final del equipo.

Consulta `INFORME_MINERIA.md` para una bitácora corta de la demostración.
