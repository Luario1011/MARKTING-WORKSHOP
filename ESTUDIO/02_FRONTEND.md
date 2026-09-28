# 02 · Frontend: páginas, interacción y estilos

## Contexto del frontend

El frontend está hecho con **Astro + React + TypeScript**. Astro organiza rutas y construye un sitio estático; React se usa sólo donde hay interacción. La tecnología visual no participa en el entrenamiento del modelo.

| Archivo | Contexto de uso | Límite principal |
|---|---|---|
| [`astro.config.mjs`](../astro.config.mjs) | Activa integración React y salida estática. | No configura API ni servidor de Python. |
| [`src/pages/index.astro`](../src/pages/index.astro) | Ruta de presentación. | No tiene lógica de negocio. |
| [`src/pages/fraude.astro`](../src/pages/fraude.astro) | Ruta de la demo. | Carga un componente cliente, no una API. |
| [`BaseLayout.astro`](../src/layouts/BaseLayout.astro) | Capa HTML común. | Sólo recibe un título y un `<slot />`. |
| [`IdeaPresentation.tsx`](../src/components/IdeaPresentation.tsx) | Portada de idea y navegación. | Contenido estático; sin estado. |
| [`FraudDashboard.tsx`](../src/components/FraudDashboard.tsx) | Calculadora, informe, tabla y cartas. | Estado vive únicamente en el navegador. |
| [`fraudData.ts`](../src/lib/fraudData.ts) | Contratos y cálculo de cliente. | No verifica un JSON externo ni persiste resultados. |
| [`global.css`](../src/styles/global.css) | Estilo pixel forense, responsive y accesibilidad. | No hace cálculos de fraude. |

## La portada: `IdeaPresentation`

`IdeaPresentation` (líneas 1–44) es una función de React sin parámetros ni estado. Devuelve tres secciones:

1. Hero: explica el propósito y enlaza al simulador.
2. Flujo: presenta preparar, descubrir y explicar.
3. Fuentes: aclara que las señales tienen respaldo externo, pero no afirma que el dataset venga de un banco.

La función se ejecuta para dibujar la portada. No llama al modelo, no hace solicitudes de red y no almacena datos.

## El tablero: estado de React

`FraudDashboard` comienza en la línea 83. `useState` guarda información que puede cambiar mientras la página está abierta y `useMemo` evita recalcular datos derivados cuando sus dependencias no cambian.

| Variable | Línea | Tipo/valor inicial | Uso | Vida útil |
|---|---:|---|---|---|
| `transactions` | 84 | Ocho muestras de `model-run.json` | Base de la tabla. | Fija durante la sesión. |
| `form` | 85 | `defaultInput` | Campos que la persona está editando. | Se actualiza por cada cambio. |
| `assessment` | 86 | `assessTransaction(defaultInput)` | Resultado visible en la tarjeta. | Cambia al evaluar. |
| `evaluatedInput` | 87 | `defaultInput` | Copia del perfil que generó el último resultado. | Cambia al evaluar. |
| `queue` | 88 | `[]` | Nuevas evaluaciones de la sesión. | Desaparece al refrescar. |
| `filter` | 89 | `Todos` | Filtro de la tabla. | Cambia al pulsar una pestaña. |
| `distanceUnit` | 90 | `km` | Unidad de edición de la distancia. | Se guarda como km aunque se escriba en m. |

### Por qué hay `form` y `evaluatedInput`

Sin `evaluatedInput`, la tarjeta de resultado podría mostrar el resultado viejo junto a los campos nuevos que una persona está modificando. Al evaluar, el código copia el formulario en ambos lugares: uno puede seguir editándose y el otro conserva el contexto de la decisión ya calculada.

## Funciones de interfaz

| Función | Líneas | Entrada | Salida | Contexto / límite |
|---|---:|---|---|---|
| `percentage` | 36–38 | Un porcentaje ya expresado de 0 a 100. | Texto localizado, por ejemplo `79,7%`. | No valida que el número esté en el rango. |
| `modelPercentage` | 40–42 | Proporción decimal, por ejemplo `0.7969`. | Texto de porcentaje. | Se usa para métricas que vienen del modelo. |
| `formatDistance` | 44–47 | Kilómetros. | `m` bajo 1 km, de lo contrario `km`. | Sólo es formato; el modelo trabaja en km. |
| `RiskBadge` | 49–51 | `Bajo`, `Medio` o `Alto`. | Un `span` con clase visual. | No modifica el nivel. |
| `SignalIcon` | 53–64 | Tipo de ícono. | SVG decorativo. | Si llega un tipo fuera de la unión TypeScript, no hay un ícono previsto. |
| `ExternalArrow` | 66–68 | Ninguna. | SVG decorativo. | No realiza navegación por sí mismo. |
| `MetricCard` | 70–81 | Ícono, etiqueta, valor y detalle. | Tarjeta de una métrica. | Sólo presentación reutilizable. |
| `update` | 110–112 | Clave y valor de `TransactionInput`. | Cambia `form`. | No valida semánticamente el valor. |
| `evaluate` | 114–128 | Evento del formulario. | Resultado, perfil evaluado y fila temporal. | La fila no se guarda en base de datos. |

## Límites del formulario

Los atributos HTML evitan algunos errores comunes en el navegador, pero no sustituyen una validación de servidor.

| Campo | Restricción visual | Observación |
|---|---|---|
| Importe | Mínimo 0; pasos de 1.000 COP. | No tiene máximo en la interfaz. |
| Hora | Entre 0 y 23. | El cálculo nocturno considera `≤ 5` o `≥ 23`. |
| Operaciones en 24 h | 0 a 30. | La variable real del modelo fue entrenada en el rango sintético. |
| Antigüedad | Mínimo 0 días. | No tiene máximo en la interfaz. |
| Intentos fallidos | 0 a 20. | No valida el contexto real del intento. |
| Distancia | Mínimo 0; unidad m o km. | El valor se convierte a km antes de puntuar. |
| Importe/promedio | 0 a 20, paso 0,1. | Es una relación, no pesos colombianos. |
| País | Lista fija. | Sólo cambia `countryRisk`, no hace geolocalización. |

La protección completa para uso real exigiría validación en API, autenticación, auditoría y controles de negocio. Esta demo no los tiene.

## La interacción de evaluación, paso a paso

1. `onSubmit={evaluate}` intercepta el envío nativo para que la página no se recargue.
2. `evaluate` llama `assessTransaction(form)`.
3. Guarda el resultado como `assessment`.
4. Copia el perfil a `evaluatedInput`.
5. Construye una fila con ID `NUEVA-001`, `NUEVA-002` y fecha actual.
6. Inserta esa fila al inicio de `queue`.
7. `visibleRows` mezcla cola y muestras, aplica el filtro y limita la tabla a ocho filas.

Ese límite de ocho es intencional: evita una tabla inmanejable durante la demostración. No significa que el modelo sólo haya visto ocho operaciones; la corrida usó 10.000.

## Secciones renderizadas por `FraudDashboard`

| Rango | Sección | Fuente principal |
|---|---|---|
| 134–155 | Navegación, modo demo y menú móvil. | Texto fijo y anclas. |
| 157–179 | Hero y aviso de datos sintéticos. | Texto fijo. |
| 181–205 | Métricas, barras y tarjeta de puntuación. | `modelRun`, `summary`, `assessment`. |
| 207–241 | Informe “Expediente 10K”. | Particiones, métricas y umbrales del JSON. |
| 243–285 | Calculadora y resultado. | Estados de formulario y `Assessment`. |
| 287–290 | Cola, tabla y filtros. | Muestras + `queue`. |
| 292–299 | Evidencia de limpieza e ingeniería. | Texto y número de variables. |
| 301–328 | Matriz de confusión de prueba. | `modelRun.confusion` y métricas. |
| 330–332 | Seis cartas de señales. | `bankRiskSignals`; enlaces externos. |
| 334 | Pie de página. | Navegación de regreso. |

## Estilos y accesibilidad

[`global.css`](../src/styles/global.css) tiene 2.535 líneas. No contiene funciones ni llamadas de negocio: asocia selectores CSS con los elementos que los componentes dibujan.

| Rango CSS | Qué controla | Componentes relacionados |
|---|---|---|
| 1–75 | Variables de color, tipografía, reset, foco visible y control global de desbordamiento. | Todo el sitio. |
| 77–153 | Navegación compartida. | Portada y tablero. |
| 155–700 | Hero, tarjetas, barras y métricas. | `FraudDashboard`. |
| 701–907 | Informe de minería. | Sección `#modelo`. |
| 908–1390 | Calculadora, resultado, tabla y filtros. | Sección `#evaluar` y cola. |
| 1391–1791 | Evidencia y matriz. | Secciones `#evidencia` y clasificación. |
| 1792–2011 | Seis cartas de señales y pie de página. | `bankRiskSignals`. |
| 2012–2328 | Portada pixel. | `IdeaPresentation`. |
| 2329–2535 | Adaptación para 1020, 900, 820, 640 y 480 px. | Todo el sitio en pantallas pequeñas. |

Decisiones ya aplicadas:

- La paleta base es dorada/caramelo/crema; el rojo se reserva para riesgo intermedio y alto.
- `overflow-x: clip` protege el borde de la página; la tabla y la matriz conservan scroll horizontal sólo dentro de su contenedor cuando hace falta.
- Enlaces, botones, campos y selector móvil tienen foco visible con teclado.
- Las imágenes de iconos son SVG decorativos con `aria-hidden`; la información se mantiene en texto.
- `aria-live="polite"` en el resultado permite anunciar cambios sin interrumpir de forma agresiva a lectores de pantalla.

## Qué no hace el frontend

- No descarga ni reentrena el CSV.
- No consulta a Bank of America ni a otra fuente durante una evaluación.
- No guarda la cola después de recargar.
- No bloquea pagos ni identifica personas.
- No sustituye la revisión humana indicada en la propia tarjeta de resultado.
