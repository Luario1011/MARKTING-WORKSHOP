# Expediente 10K · bitácora del modelo

## En una frase

GoldGuard es una demostración de minería de datos: toma 10.000 transacciones sintéticas limpias, aprende señales de riesgo y convierte la probabilidad resultante en **Bajo**, **Medio** o **Alto** para apoyar una revisión humana.

> Importante: el conjunto es sintético. Las cifras de esta bitácora no prueban el desempeño de un banco ni autorizan bloquear una transacción real.

## El recorrido, como una pequeña misión arcade

1. **Ordenar el tablero.** `transacciones_originales_sinteticas.csv` empieza con 10.438 registros, incluidos nulos, duplicados y formatos mixtos. La limpieza conserva 10.000 transacciones y 19 columnas útiles.
2. **Crear pistas.** El pipeline transforma 16 variables para el modelo: importe frente al promedio del cliente, actividad de 24 horas, antigüedad, intentos fallidos, distancia, horario nocturno, dispositivo, tarjeta presente, país, comercio y medio de pago.
3. **Entrenar sin mirar la prueba.** Se separan 7.000 filas para entrenamiento, 1.500 para ajustar el umbral y 1.500 para la prueba final. La separación es estratificada: conserva la proporción de fraude sintético en cada parte.
4. **Encender la alarma.** Una regresión logística explicable en Python asigna una probabilidad. El umbral para alerta alta se elige con la validación y la interfaz la traduce a Bajo, Medio o Alto.

## Resultado de la corrida incluida

La prueba reservada tiene 1.500 transacciones sintéticas. El resultado fue: 51 alertas acertadas, 13 fraudes sintéticos que no fueron alertados, 199 alertas que luego no eran fraude y 1.237 transacciones permitidas correctamente.

| Medida | Resultado | Por qué importa |
| --- | ---: | --- |
| Recall | 79,7 % | De los fraudes sintéticos de prueba, cuántos logró señalar. |
| Precisión | 20,4 % | De las alertas altas, cuántas correspondieron a fraude sintético. |
| F1 | 32,5 % | Equilibra precisión y recall. |
| PR-AUC | 42,4 % | Resume el desempeño al buscar una clase rara como el fraude. |
| Exactitud | 85,9 % | Se muestra como contexto, no como criterio único. |

La exactitud sola sería engañosa: la mayor parte de las transacciones sintéticas no son fraude. Por eso el umbral se eligió mirando recall y F1 durante la validación, y el reporte conserva también PR-AUC y la matriz de confusión.

## Qué hace el código

- `scripts/generate-datasets.mjs` crea los dos CSV sintéticos y deja rastros de calidad para limpiar.
- `scripts/train_fraud_model.py` lee el CSV limpio con pandas, transforma variables con NumPy, entrena la regresión logística, evalúa la prueba reservada y exporta el artefacto.
- `src/data/model-run.json` guarda coeficientes, escalas, umbrales, métricas y una pequeña muestra de prueba.
- `src/lib/fraudData.ts` aplica exactamente esos coeficientes a lo que se escribe en la calculadora.
- `src/components/FraudDashboard.tsx` presenta el recorrido, las métricas, la matriz, las señales y la explicación de cada resultado.

## Qué hace la página

- La portada presenta la idea del proyecto.
- El tablero resume las 10.000 transacciones y la distribución de riesgo del artefacto.
- El informe **Expediente 10K** explica de dónde sale cada paso del modelo.
- La calculadora transforma una transacción nueva en una probabilidad y una recomendación de revisión.
- La sección de evidencia conecta seis señales de fraude con el modelo, y la matriz muestra la prueba reservada.

## Reproducir la demostración

Con Node y Python 3.10 o posterior instalados:

```text
node scripts/generate-datasets.mjs
python scripts/train_fraud_model.py
npm install
npm run dev
```

No se requiere pnpm. Si cambias el CSV, vuelve a ejecutar el entrenamiento antes de abrir la calculadora: así la página usará el nuevo artefacto y no cifras antiguas.

## Límites honestos

Esta es una demostración académica reproducible. Antes de un uso real harían falta datos autorizados, revisión de sesgos, controles de privacidad, evaluación temporal, monitoreo de deriva, calibración, revisión humana y aprobación de riesgo/compliance.
