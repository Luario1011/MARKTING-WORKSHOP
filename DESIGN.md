---
name: GoldGuard
description: Consola forense pixel para revisar un modelo de prueba de riesgo de fraude.
colors:
  ink: "#1B1814"
  surface: "#282219"
  surface-raised: "#332B20"
  slate: "#767F9E"
  caramel: "#DAA464"
  gold: "#DEC384"
  cream: "#E8DDB4"
  risk-medium: "#B96F62"
  risk-high: "#B64E45"
typography:
  display-landing:
    fontFamily: '"Courier New", ui-monospace, monospace'
    fontSize: "clamp(44px, 5vw, 72px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-4px"
  display-simulator:
    fontFamily: '"Courier New", ui-monospace, monospace'
    fontSize: "clamp(38px, 4.2vw, 56px)"
    fontWeight: 700
    lineHeight: 0.99
    letterSpacing: "-3px"
  body:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    lineHeight: 1.7
  label:
    fontFamily: '"Courier New", ui-monospace, monospace'
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: "0.8px"
rounded:
  pixel: "0px"
  control: "8px"
  hero: "20px"
spacing:
  micro: "4px"
  compact: "8px"
  card: "16px"
  panel: "23px"
  form: "30px"
  page-gutter: "48px"
components:
  action-primary:
    backgroundColor: "{colors.caramel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 17px"
  pixel-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pixel}"
    padding: "{spacing.card}"
  calculator-field:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pixel}"
    padding: "0 10px"
  risk-badge-low:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pixel}"
    padding: "3px 7px"
  risk-badge-medium:
    backgroundColor: "{colors.risk-medium}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pixel}"
    padding: "3px 7px"
  risk-badge-high:
    backgroundColor: "{colors.risk-high}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pixel}"
    padding: "3px 7px"
---

# Design System: GoldGuard

## Overview

**Creative North Star: "Consola forense pixel"**

GoldGuard convierte la evaluación de un modelo de prueba en una consola de investigación: una superficie oscura, órdenes legibles, tarjetas rectangulares y datos que se sienten manipulables. El acabado es lúdico tipo arcade, pero la lectura sigue siendo académica: cada color, señal y bloque de evidencia debe ayudar al docente a verificar de dónde viene una decisión.

La identidad combina cuadrículas tenues, microtipografía monoespaciada, oro apagado y sombras de píxel desplazadas. No pretende parecer una banca de producción ni un dashboard corporativo genérico; presenta una demostración didáctica, trazable y deliberadamente explícita sobre sus límites.

**Key Characteristics:**

- Superficies oscuras cálidas con cuadrícula de fondo tenue.
- Tipografía de terminal para jerarquía, labels y cifras; sans serif solo donde mejora la lectura larga.
- Contenedores rectangulares, bordes visibles y sombras duras sin desenfoque.
- Estados de riesgo semánticos: crema para bajo, rojo apagado para medio y rojo intenso para alto.
- Interacción breve y discreta, como respuesta de un control pixelado, nunca como una animación flotante.

## Colors

La paleta es cálida, acotada y funcional: metal, pergamino y carbón para la interfaz; rojo únicamente para comunicar severidad.

### Primary

- **Caramelo de activación:** acciones principales, foco, iconos y detalles de navegación. Es el color que invita a probar una transacción.

### Secondary

- **Oro de lectura:** texto secundario, encabezados auxiliares, indicadores y ornamentación de baja intensidad.

### Tertiary

- **Rojo de revisión:** el tono medio se reserva para advertencia o revisión; el tono alto únicamente señala fraude, prioridad o fallo crítico.

### Neutral

- **Carbón de consola:** lienzo y fondo de los paneles más profundos.
- **Marrón de superficie:** tarjetas, secciones y paneles operativos.
- **Marrón elevado:** estados seleccionados, tarjetas de fuente y subcapas.
- **Pizarra autorizada:** bordes, separadores, textos muy atenuados y sombras de controles. Es el único gris frío permitido.
- **Pergamino claro:** texto principal, campos de formulario y bajo riesgo.

### Named Rules

**The Red Means Risk Rule.** Los dos rojos no decoran: aparecen solo cuando el sistema comunica riesgo medio, alto, fraude, prioridad o una alerta vinculada a la evaluación.

**The One Cold Neutral Rule.** No se introducen azules ni verdes nuevos. La pizarra autorizada es el único gris frío y sirve para estructura, no para competir con el oro.

## Typography

**Display Font:** Courier New (con ui-monospace como respaldo)

**Body Font:** Inter (con ui-sans-serif y system-ui como respaldo)

**Label/Mono Font:** Courier New (con ui-monospace como respaldo)

**Character:** La voz tipográfica se comporta como una consola visible para una exposición: títulos y datos tienen presencia de terminal; los párrafos extensos ganan legibilidad con una sans serif directa.

### Hierarchy

- **Display:** dos escalas implementadas, una amplia para la portada y otra más contenida para el simulador; ambas usan peso fuerte, interlineado cerrado y tracking negativo.
- **Headline:** títulos de sección de 27–29px, reservados para explicar cada etapa del modelo.
- **Title:** títulos de tarjetas alrededor de 13–17px; no compiten con el resultado de riesgo.
- **Body:** 14–15px con interlineado generoso para contexto de la transacción y explicación didáctica.
- **Label:** 8–11px, peso 800–900, mayoritariamente en mayúsculas y con tracking visible; identifica campos, fuentes, métricas y estados.

### Named Rules

**The Terminal First Rule.** Cifras, estados, etiquetas y titulares usan la voz monoespaciada. La sans serif se reserva para pasajes explicativos que necesitan una lectura más larga.

## Layout

La portada usa una composición de dos columnas: argumento y llamada a la acción a la izquierda, artefacto de investigación a la derecha. El simulador conserva ese principio en su hero, pero sus áreas operativas cambian a tarjetas, tablas y una calculadora de dos columnas para priorizar escaneo.

Los contenedores principales se limitan a una anchura de escritorio cercana a 1084–1180px con gutters de 48px. La escala de separación más frecuente es 4, 8, 16, 23 y 30px. Las cartas de evidencia se distribuyen en tres columnas y se mantienen dentro del viewport: pasan a dos columnas a 820px y a una columna a 480px.

A 820px se ocultan los enlaces de navegación secundarios y los grids de hero, calculadora y panel se apilan. A 480px, métricas y campos de formulario pasan a una columna, se reduce el hero y las tablas mantienen desplazamiento horizontal dentro de su propio contenedor. Nunca se permite que una carta, hover o sombra cree overflow horizontal de página.

## Elevation & Depth

GoldGuard no usa elevación ambiental. La profundidad aparece como una pila de píxeles: bordes contrastados, capas cálidas y sombras rectas de cero desenfoque. Las sombras pequeñas identifican marca y botones; las medianas sostienen tarjetas de datos; las largas delimitan piezas principales como hero, calculadora y banners.

### Shadow Vocabulary

- **Marca:** desplazamiento corto de 3px para sellos e identidad.
- **Acción:** 4px de sombra de pizarra para botones y controles que se pueden presionar.
- **Tarjeta:** 4–5px de sombra carbón para métricas, tablas y fuentes.
- **Bloque principal:** 8–9px de sombra carbón para hero, calculadora y banners.

### Named Rules

**The Hard Offset Rule.** Todas las sombras son rectas, con desplazamiento visible y sin blur. Una sombra suave rompería el lenguaje pixel y la lectura de capas.

## Shapes

La forma predominante es rectangular y afilada: tarjetas, badges, campos, matrices, barras y paneles usan esquinas de píxel. Los bordes son parte de la información, no una decoración de bajo contraste.

Hay excepciones deliberadas: el hero conserva una silueta suavizada para actuar como marco de escena y el botón principal conserva una curvatura corta para sentirse presionable. Estas excepciones no se extienden a tarjetas de datos, evidencias ni controles de riesgo.

## Components

### Buttons

**Character:** controles de arcade sobrios que invitan a ejecutar una evaluación, no a decorar la pantalla.

- **Shape:** botón primario de control corto; botones de bloque y variantes pixel rectangulares.
- **Primary:** caramelo con texto oscuro, borde del mismo tono y sombra dura de pizarra.
- **Hover / Focus:** hover cambia al oro o comprime la sombra; focus usa un contorno de caramelo separado del control.
- **Secondary:** la variante invertida es transparente, con texto oro y sombra estructural.

### Cards / Containers

**Character:** fichas de evidencia sobre una mesa de investigación.

- **Corner Style:** rectangular en tarjetas de métricas, evidencia y fuentes.
- **Background:** superficie cálida; la versión elevada se usa en tarjetas de fuentes y estados secundarios.
- **Shadow Strategy:** sombra dura de carbón, proporcional a la importancia del bloque.
- **Border:** pizarra visible; en foco o hover de fuente pasa a caramelo sin movimiento fuera de su contenedor.
- **Internal Padding:** 16–23px según densidad.

### Inputs / Fields

**Character:** formulario tipo hoja de trabajo dentro de una consola.

- **Style:** panel de formulario pergamino; campos claros, rectangulares, con borde caramelo y texto tinta.
- **Focus:** borde y sombra dura de pizarra; el foco adicional permanece visible mediante contorno caramelo.
- **Toggle:** pista y thumb rectangulares; apagado en crema/pizarra, activo en caramelo.

### Navigation

**Character:** barra de utilidades compacta, no menú de aplicación corporativa.

- **Style:** sello de marca a la izquierda, enlaces monoespaciados al centro y acción/demostración a la derecha.
- **State:** hover desplaza la atención al caramelo u oro; foco siempre deja contorno visible.
- **Responsive:** los enlaces secundarios se ocultan a 820px sin inventar una navegación alternativa.

### Risk Badge

**Character:** una etiqueta de clasificación legible en una fila, barra o resultado.

- **Shape:** rectangular, mínimo compacto y borde de 1px.
- **Low:** pergamino claro con tinta oscura.
- **Medium:** rojo apagado con texto claro.
- **High:** rojo intenso con texto claro.

### Risk Assessment Card

**Character:** el veredicto de una transacción, no un medidor decorativo.

- **Structure:** puntuación, nivel, razones y recomendación aparecen en una superficie oscura.
- **State:** el orbe y los puntos de razón cambian solo con el nivel de riesgo; medio y alto mantienen la semántica roja.
- **Behavior:** el resultado se anuncia con `aria-live`; la explicación siempre acompaña la categoría.

### Evidence Source Card

**Character:** tarjeta de referencia sectorial, compacta y verificable.

- **Structure:** señal, descripción, variable del modelo y enlace de fuente en una jerarquía fija.
- **Layout:** cuadrícula contenida de tres, dos o una columna; sin rotaciones, apilamientos ni hover que salga del viewport.
- **State:** hover/foco cambia borde a caramelo sin cambiar posición.

### Pixel Matrix and Risk Bars

**Character:** visualizaciones de consola que priorizan comparación antes que ornamento.

- **Matrix:** celdas rectangulares con ejes explícitos; los resultados no se disfrazan de validación final del modelo.
- **Bars:** bajo usa pergamino, medio rojo apagado y alto rojo intenso; la leyenda repite exactamente la misma semántica.

## Do's and Don'ts

### Do:

- **Do** mantener la paleta acotada y usar el caramelo para acciones, foco y ornamentación funcional.
- **Do** explicar el riesgo junto a sus señales y la procedencia de la evidencia.
- **Do** usar bordes visibles, sombras duras y composiciones contenidas para que la consola se sienta pixelada.
- **Do** mantener las cartas de evidencia en grids de 3 → 2 → 1 columnas según el ancho disponible.
- **Do** conservar el aviso de que el modelo y los datos actuales son demostrativos mientras no exista validación independiente.

### Don't:

- **Don't** introducir verde o azul como acento; la pizarra existente no debe convertirse en un color protagonista.
- **Don't** usar rojo como decoración, éxito o acción primaria.
- **Don't** suavizar sombras, convertir las tarjetas en vidrio ni redondear por defecto los componentes de datos.
- **Don't** mover o rotar tarjetas de fuente al hover de modo que desborden la ventana.
- **Don't** presentar una simulación sintética como una validación final del modelo.
