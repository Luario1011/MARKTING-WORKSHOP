# 04 · Referencia por archivo y líneas

Esta guía no inserta comentarios dentro de la aplicación funcional. En cambio, la carpeta [copia-para-estudiar](copia-para-estudiar/README.md) conserva el código para leerlo y este índice explica **cada bloque ejecutable, función, componente y tramo visual** mediante sus líneas exactas.

Una llave de cierre, un paréntesis, una etiqueta JSX o una propiedad CSS aislada no tiene una llamada propia; su significado depende del bloque donde vive. Por eso esta referencia se organiza por unidades de ejecución reales, que es la forma mantenible de documentar el código línea por línea.

## Inventario de código

| Archivo | Líneas físicas | Líneas no vacías | Cómo estudiarlo |
|---|---:|---:|---|
| [`astro.config.mjs`](../astro.config.mjs) | 11 | 10 | Configuración de Astro. |
| [`scripts/generate-datasets.mjs`](../scripts/generate-datasets.mjs) | 92 | 83 | Construcción reproducible del escenario de datos. |
| [`scripts/train_fraud_model.py`](../scripts/train_fraud_model.py) | 337 | 288 | Pipeline y modelo de minería de datos. |
| [`src/components/FraudDashboard.tsx`](../src/components/FraudDashboard.tsx) | 337 | 306 | Interfaz React principal. |
| [`src/components/IdeaPresentation.tsx`](../src/components/IdeaPresentation.tsx) | 44 | 40 | Portada React. |
| [`src/layouts/BaseLayout.astro`](../src/layouts/BaseLayout.astro) | 22 | 19 | Marco HTML de las rutas. |
| [`src/lib/fraudData.ts`](../src/lib/fraudData.ts) | 211 | 191 | Puente entre JSON de Python y calculadora. |
| [`src/pages/fraude.astro`](../src/pages/fraude.astro) | 8 | 7 | Entrada de `/fraude`. |
| [`src/pages/index.astro`](../src/pages/index.astro) | 8 | 7 | Entrada de `/`. |
| [`src/styles/global.css`](../src/styles/global.css) | 2.535 | 2.210 | Sistema visual y responsive. |
| **Total** | **3.605** | **3.161** | Código fuente propio; no incluye CSV, JSON generado, `dist` o dependencias. |

## 1. Configuración y rutas

### `astro.config.mjs` · 1–11

| Líneas | Significado | Llamadas / efectos |
|---|---|---|
| 1–2 | Importa el constructor de configuración de Astro y la integración de React. | Astro carga este archivo al iniciar, comprobar o compilar. |
| 4–11 | Exporta la configuración. | Activa React, genera salida estática y usa objetivo JavaScript moderno. |
| 5 | `integrations: [react()]`. | Permite renderizar e hidratar los componentes `.tsx`. |
| 6 | `output: 'static'`. | Prueba que no hay backend web o SSR atendiendo solicitudes. |
| 7–10 | Objetivo `esnext` para Vite/esbuild. | Navegadores modernos; no añade lógica de riesgo. |

### `src/layouts/BaseLayout.astro` · 1–22

| Líneas | Significado | Llamadas / efectos |
|---|---|---|
| 1–9 | Bloque de servidor/build de Astro. Importa CSS, define la prop `title` y la obtiene desde `Astro.props`. | Las dos páginas lo invocan. |
| 11–18 | Documento HTML y metadatos. | Declara idioma español, codificación, viewport y descripción. |
| 19–21 | `<body><slot /></body>`. | Inserta el componente de cada ruta. |

### Rutas de Astro · 1–8 de cada archivo

| Archivo | Líneas | Lectura lineal |
|---|---|---|
| [`index.astro`](../src/pages/index.astro) | 1–4 | Importa layout y portada. |
|  | 6–8 | Pasa el título y monta `IdeaPresentation` con `client:load`. |
| [`fraude.astro`](../src/pages/fraude.astro) | 1–4 | Importa layout y tablero. |
|  | 6–8 | Pasa el título y monta `FraudDashboard` con `client:load`. |

## 2. Generación de dataset · `scripts/generate-datasets.mjs`

| Líneas | Bloque | Explicación concreta |
|---|---|---|
| 1 | Importación de Node. | `mkdir` y `writeFile` crean archivos de datos. |
| 3–11 | Constantes. | Directorio de salida, semilla, catálogos y pesos sintéticos de comercios. |
| 13–20 | `mulberry32`. | Construye un generador pseudoaleatorio determinista. La línea 18 normaliza un entero a decimal entre 0 y 1. |
| 22 | `pick`. | Selecciona una categoría usando el generador anterior. |
| 23 | `clamp`. | Evita que un puntaje o importe sintético salga de un intervalo. |
| 24–27 | `csvValue`. | Convierte un valor a texto y escapa comas, comillas y saltos de línea. |
| 28–30 | `toCsv`. | Construye encabezado y filas CSV. |
| 32–45 | `riskScore`. | Suma reglas sintéticas de riesgo; no es el modelo final ni una regla bancaria real. |
| 47–68 | Inicio de `newTransaction`. | Selecciona categorías y crea campos crudos de una operación limpia. |
| 69–71 | Variables derivadas de la fila. | Calcula relación con promedio, velocidad categórica y horario nocturno. |
| 72–75 | Etiqueta sintética. | Usa `riskScore`, lo transforma en probabilidad y sortea `Fraude`/`No fraude`. |
| 78–80 | Dos colecciones base. | Construye 10.000 filas limpias y una copia inicial para ensuciar. |
| 81–85 | Problemas intencionales. | Agrega duplicados, nulos, formatos erróneos e importes inválidos a la copia original. |
| 87 | Columnas. | Mantiene un orden fijo de 19 columnas para ambos CSV. |
| 88–90 | Escritura de archivos. | Crea `data/` si falta y guarda los dos CSV. |
| 92 | Mensaje final. | Informa cuántas filas se generaron. |

## 3. Modelo Python · `scripts/train_fraud_model.py`

| Líneas | Bloque | Explicación concreta |
|---|---|---|
| 1–8 | Docstring. | Declara que es didáctico, sintético y que reutiliza el JSON en Astro/React. |
| 10–17 | Importaciones. | JSON, rutas, tipos, NumPy y pandas. |
| 20–24 | Rutas y semilla. | Ubica el proyecto, CSV procesado, CSV original, artefacto y semilla de entrenamiento. |
| 27–46 | `FEATURE_SPECS`. | Especifica las 16 transformaciones en el orden que define el modelo. |
| 49–53 | `sigmoid`. | Convierte logits a probabilidades de manera numéricamente segura. |
| 56–67 | `stratified_indices`. | Parte etiquetas 0/1 conservando proporciones, con RNG reproducible. |
| 70–96 | `values_for_spec`. | Mapea columnas del CSV, ejecuta `log1p`, identidad, binario o `equals:`. |
| 99–100 | `build_matrix`. | Apila las 16 columnas en una matriz de NumPy. |
| 103–126 | `fit_logistic_regression`. | Inicializa pesos, pondera la clase minoritaria y actualiza por descenso de gradiente. |
| 129–149 | `binary_metrics`. | Calcula matriz y métricas a partir de un umbral. |
| 152–163 | `precision_recall_auc`. | Ordena probabilidades y calcula área precisión-recall por trapecios. |
| 166–173 | `choose_threshold`. | Evalúa 153 umbrales y selecciona F1 alto preservando recall ≥ 75%. |
| 176–181 | `risk_level`. | Convierte probabilidad decimal en Bajo/Medio/Alto. |
| 184–217 | `sample_rows`. | Genera ocho objetos compatibles con TypeScript desde el holdout. |
| 220–221 | `rounded`. | Deja números JSON legibles. |
| 224–229 | Inicio de `main`. | Lee datos, cuenta filas originales, crea etiquetas y RNG. |
| 230–234 | Particiones. | Reserva prueba y validación de forma estratificada. |
| 236–250 | Matrices y estandarización. | Construye matrices, obtiene medias/desviaciones de train y ajusta el modelo. |
| 252–258 | Validación y prueba. | Escoge umbral con validación y reporta métricas de prueba reservada. |
| 259–270 | Distribución y variables destacadas. | Puntúa las 10.000 filas y ordena coeficientes por magnitud. |
| 272–322 | Construcción del artefacto. | Organiza metadatos, datos, transformaciones, métricas, modelo y muestras. |
| 324–333 | Exportación. | Crea carpeta si falta, escribe JSON y muestra resumen de corrida. |
| 336–337 | Punto de entrada. | Sólo llama `main()` si se ejecuta el archivo directamente. |

## 4. Inferencia TypeScript · `src/lib/fraudData.ts`

| Líneas | Bloque | Explicación concreta |
|---|---|---|
| 1 | Importación JSON. | Trae el artefacto producido por Python a la aplicación. |
| 3–5 | Tipos de unión. | Restringen riesgos, países y categorías permitidos mientras se desarrolla. |
| 7–21 | `TransactionInput`. | Contrato de los campos que debe entregar la calculadora. |
| 23–29 | `Transaction`. | Agrega ID, fecha, score, nivel y etiqueta sintética a una entrada. |
| 31–37 | `Assessment`. | Contrato del resultado de evaluación. |
| 39–75 | Tipos de artefacto. | Describe la forma esperada de `model-run.json`. |
| 77–80 | `modelRun` y muestras. | Expone JSON tipado y sus ocho filas para la tabla. |
| 82–89 | `COUNTRY_OPTIONS`. | Une el país visible con el riesgo geográfico predefinido. |
| 91–93 | `clamp`. | Limita un número a un rango. |
| 95–98 | `sigmoid`. | Copia la función numérica de Python para obtener la misma probabilidad. |
| 100–121 | `featureValue`. | Reconstruye exactamente cada entrada de `FEATURE_SPECS`. |
| 123–130 | `probabilityFromModel`. | Estandariza, multiplica por pesos y aplica sigmoide. |
| 132–136 | `levelFromProbability`. | Aplica umbral medio y alto del JSON. |
| 138–155 | `explanationLabels`. | Traduce nombres técnicos a lenguaje comprensible. |
| 157–172 | `explain`. | Calcula aportes positivos, descarta los pequeños, ordena y conserva cuatro. |
| 174–189 | `assessTransaction`. | Función orquestadora: resultado, nivel, señales y recomendación. |
| 191–195 | `currency`. | Formateador de pesos colombianos. |
| 197–211 | `defaultInput`. | Caso inicial que se evalúa al cargar la página. |

## 5. Tablero React · `src/components/FraudDashboard.tsx`

| Líneas | Bloque | Explicación concreta |
|---|---|---|
| 1–14 | Importaciones. | React, tipos, modelo, formato y función de evaluación. |
| 16–34 | Catálogos y seis señales. | Opciones de comercio, clases de nivel, tipos de ícono y tarjetas explicativas. |
| 36–47 | Formato de valores. | Porcentajes y distancia legible. |
| 49–81 | Subcomponentes pequeños. | Insignia, iconos SVG, flecha y tarjeta de métrica. |
| 83–90 | Inicio y estado. | Declara muestras, formulario, resultado, copia evaluada, cola, filtro y unidad. |
| 92–108 | Datos derivados. | Arma resumen, distribución y filas visibles de la tabla. |
| 110–112 | `update`. | Actualiza una propiedad del formulario sin repetir lógica. |
| 114–128 | `evaluate`. | Calcula, conserva contexto y agrega la evaluación a la cola temporal. |
| 130 | Máximo de distribución. | Sirve para convertir conteos en anchos relativos de barra. |
| 132–155 | Navegación. | Marca, anclas y menú compacto para móvil. |
| 157–179 | Hero y aviso. | Presenta la demo y avisa que los datos son sintéticos. |
| 181–205 | Panel. | Dibuja métricas, distribución y puntuación actual. |
| 207–241 | Informe. | Explica pipeline, particiones, métricas y archivos. |
| 243–285 | Calculadora. | Campos, cambios de unidad, interruptores y tarjeta de resultado accesible. |
| 287–290 | Consulta. | Filtros y tabla de cola/muestras. |
| 292–299 | Trazabilidad. | Evidencia de datos, ingeniería y lecturas exploratorias. |
| 301–328 | Matriz. | Dibuja VP/FN/FP/VN sobre la prueba reservada. |
| 330–332 | Seis cartas. | Conecta fuentes publicadas con variables didácticas del modelo. |
| 334–337 | Footer y cierre. | Pie de página y retorno de JSX. |

## 6. Portada y estilos

### `IdeaPresentation.tsx` · 1–44

| Líneas | Bloque | Explicación concreta |
|---|---|---|
| 1–8 | Cabecera. | Marca, anclas y acceso al simulador. |
| 10–25 | Hero. | Copia de la idea, botón y escenario pixel decorativo. |
| 27–34 | Flujo. | Tres pasos: preparar, descubrir y explicar. |
| 36–39 | Fuentes. | Contexto de las seis señales y enlace a las cartas. |
| 41–44 | Pie y cierre. | Navegación adicional y cierre del componente. |

### `global.css` · 1–2.535

| Líneas | Bloque | Qué estilo describe |
|---|---|---|
| 1–75 | Fundamentos globales. | Tokens de color, tipografía, reset, foco y prevención de overflow. |
| 77–153 | Navegación. | Marca, enlaces, sello demo y menú móvil. |
| 155–429 | Hero de fraude. | Título, botón, preview de alerta, escala y señales. |
| 430–700 | Panel de métricas. | Aviso, tarjetas, barras, badges, score y leyenda. |
| 701–907 | Informe de minería. | Relato, ledger de métricas y mapa de código. |
| 908–1301 | Calculadora y resultado. | Inputs, interruptores, expediente de señales y recomendación. |
| 1302–1390 | Tabla y filtros. | Contenedor desplazable local y filas vacías. |
| 1391–1615 | Evidencia. | Tres cartas, comparación de calidad y definiciones de variables. |
| 1616–1791 | Matriz. | Marco, scroll local, celdas VP/FP/VN/FN y pie. |
| 1792–2011 | Cartas de señales. | Distribución, interacción, mapeo de variable y enlace externo. |
| 2012–2328 | Portada. | Hero, moneda pixel, tickets flotantes, pasos y banner de fuentes. |
| 2329–2535 | Responsive. | Ajusta grillas, tipografía, navegación y anchuras para cinco breakpoints. |

## Cómo usar la copia de estudio junto a esta guía

1. Abre el archivo equivalente en `ESTUDIO/copia-para-estudiar/`.
2. En tu editor activa números de línea.
3. Busca el rango que aparece aquí, por ejemplo `train_fraud_model.py:103–126`.
4. Lee la tabla de entrada, salida, llamada y límite de [03 · datos y modelo](03_DATOS_Y_MODELO.md).
5. Sólo después edita el archivo real si entiendes qué contrato debe conservar.

El principal contrato a preservar es el orden de las 16 variables entre Python, JSON y TypeScript.
