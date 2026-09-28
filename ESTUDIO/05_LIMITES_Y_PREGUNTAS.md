# 05 · Límites, contexto y preguntas para exposición

## Qué es y qué no es GoldGuard

| Sí es | No es |
|---|---|
| Una demostración académica reproducible de minería de datos. | Un sistema de fraude bancario validado en producción. |
| Un pipeline offline de Python que exporta un modelo. | Un backend HTTP, API o microservicio en tiempo real. |
| Una calculadora React que usa pesos exportados. | Una conexión a una base de datos o a datos de clientes reales. |
| Un apoyo para priorizar revisión humana. | Una decisión autónoma para rechazar o bloquear pagos. |
| Una muestra sintética de 10.000 transacciones procesadas. | Un dataset obtenido de Bank of America, Chase u otro banco. |

## Límites técnicos explicados con claridad

### Datos

- Las transacciones, etiquetas, montos y patrones son sintéticos.
- El CSV “original” contiene errores introducidos por el generador; no proviene de una fuente externa desordenada.
- La etiqueta `fraud_label` se fabrica con reglas relacionadas con variables de entrada. Por eso el modelo aprende un escenario pedagógico coherente, no fraude desconocido del mundo real.
- La división de datos es aleatoria y estratificada. En un banco real convendría una separación temporal para evitar evaluar con futuro parecido al pasado.
- El país visible es contexto; el modelo sólo consume su categoría `countryRisk`. No usa GPS, IP, dirección ni historial geográfico real.

### Modelo

- Es regresión logística con implementación didáctica de descenso por gradiente, no un servicio ML gestionado ni un modelo de última generación.
- El nivel medio no es una tercera clase entrenada: es una franja entre dos umbrales para ordenar la revisión.
- El umbral alto se eligió entre 0,12 y 0,88 usando validación, con recall mínimo de 75% y F1 como criterio principal. No se eligió por accuracy sola.
- La puntuación visual se limita de 1 a 99; la clasificación usa la probabilidad decimal previa al redondeo.
- `explain` enseña como máximo cuatro contribuciones positivas mayores de 0,05. No muestra todo el cálculo, efectos protectores ni causalidad.
- Si se cambia el orden de `FEATURE_SPECS`, pesos, medias o escalas, el frontend puede dejar de reproducir el modelo de Python.

### Interfaz y operación

- La cola de nuevas transacciones está en `useState`; se borra con una recarga.
- Sólo se muestran ocho muestras del holdout en la tabla; el navegador no navega ni consulta las 10.000 filas completas.
- No hay autenticación, permisos, auditoría de decisiones, cifrado de datos, observabilidad ni monitoreo de deriva.
- No existe validación de negocio en un servidor. Los mínimos y máximos de HTML ayudan al uso manual, pero no protegen una integración externa maliciosa.
- El JSON con pesos llega al navegador; eso es adecuado para explicar la demo, no para proteger lógica propietaria en producción.

## Respuestas cortas para la exposición

### “¿Esto viene de un banco?”

> No. Usamos una muestra sintética reproducible para demostrar el proceso completo sin tratar datos personales o bancarios. Las fuentes bancarias visibles sólo justifican señales de prevención que conectamos con variables didácticas.

### “¿Dónde está el backend?”

> No hay backend web en esta demostración. Python se ejecuta antes, entrena el modelo y exporta un JSON. La página estática consume ese artefacto y calcula localmente para que el flujo sea visible y reproducible.

### “¿Por qué no eligieron el modelo por exactitud?”

> Como fraude es una clase minoritaria, una exactitud alta puede ocultar fraudes que se dejaron pasar. Por eso revisamos recall, precisión, F1, PR-AUC y la matriz de confusión; el umbral se eligió en validación priorizando recuperación de fraudes sintéticos.

### “¿Qué hace la calculadora?”

> Convierte la información de una operación en las mismas 16 variables que usó Python, aplica los pesos exportados, calcula una probabilidad y la traduce en Bajo, Medio o Alto. Después muestra las señales con contribución positiva y una recomendación de revisión.

### “¿Qué haría falta para un caso real?”

> Datos autorizados y anonimizados, limpieza reproducible sobre datos reales, separación temporal, calibración, pruebas de sesgo, validación de negocio, API segura, control de acceso, auditoría, monitoreo de deriva y una revisión humana operativa.

## Contexto recomendado para la portada o el informe

Puedes usar esta descripción:

> GoldGuard es un prototipo de minería de datos para explorar transacciones, convertir señales de comportamiento en una prioridad de revisión y explicar la decisión. El modelo es una prueba reproducible entrenada con datos sintéticos; no confirma fraude ni sustituye una revisión humana.

## Lista de verificación antes de presentar

- [ ] Mostrar los dos CSV y aclarar que son sintéticos.
- [ ] Explicar al menos tres variables derivadas: importe vs promedio, horario nocturno y distancia transformada.
- [ ] Mostrar la partición 7.000 / 1.500 / 1.500.
- [ ] Leer la matriz de confusión sin afirmar que valida un banco.
- [ ] Cambiar varios campos de la calculadora y mostrar que cambian las razones.
- [ ] Aclarar que la cola temporal se borra al recargar.
- [ ] Explicar que una alerta alta significa “priorizar revisión”, no “fraude confirmado”.
- [ ] Tener abiertas [03 · datos y modelo](03_DATOS_Y_MODELO.md) y [04 · referencia por líneas](04_REFERENCIA_POR_LINEAS.md) para preguntas técnicas.
