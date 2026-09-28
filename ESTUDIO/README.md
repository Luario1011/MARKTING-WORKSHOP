# Guía de estudio de GoldGuard

Esta carpeta es la versión para **entender el proyecto**, separada de la aplicación que está funcionando. No sustituye ni altera el simulador de `/fraude`.

## Orden recomendado

1. Lee [00 · visión general](00_VISION_GENERAL.md): explica qué existe realmente y cómo viaja una transacción desde el formulario hasta el resultado.
2. Sigue [01 · mapa de llamadas](01_MAPA_DE_LLAMADAS.md): muestra qué archivo llama a cuál y qué sucede al pulsar **Calcular nivel de riesgo**.
3. Revisa [02 · frontend](02_FRONTEND.md): componentes, estados de React, formularios, estilos y límites de la interfaz.
4. Estudia [03 · datos y modelo](03_DATOS_Y_MODELO.md): generador, limpieza demostrativa, Python, regresión logística y artefacto JSON.
5. Usa [04 · referencia por líneas](04_REFERENCIA_POR_LINEAS.md) junto con [copia-para-estudiar](copia-para-estudiar/README.md): es el índice para encontrar cada bloque y cada función sin editar el código real.
6. Cierra con [05 · límites y preguntas](05_LIMITES_Y_PREGUNTAS.md): te ayuda a explicarlo de forma honesta al docente.

## La frase importante

GoldGuard tiene dos momentos distintos:

```text
ANTES de abrir la página: CSV sintético → Python → model-run.json
AL usar la página: formulario React → modelo ya exportado → resultado en el navegador
```

Por eso no hay una API, base de datos ni servidor Python atendiendo clics. El Python es un **pipeline local de minería de datos por lotes**. La pantalla usa el resultado de la última corrida guardado en `src/data/model-run.json`.

## Qué contiene la copia de estudio

`copia-para-estudiar/` replica los archivos fuente y de configuración relevantes, sin `node_modules`, `dist` ni los CSV pesados. Sirve para leer y subrayar; el proyecto canónico y ejecutable permanece en la raíz.

Si modificas el proyecto real, vuelve a crear la copia con este comando desde la raíz:

```text
powershell -ExecutionPolicy Bypass -File ESTUDIO/actualizar-copia-estudio.ps1
```

No edites `src/data/model-run.json` a mano: se vuelve a generar con `python scripts/train_fraud_model.py`.

## Código incluido en el alcance de esta guía

La explicación cubre los 10 archivos fuente principales: **3.605 líneas físicas** y **3.161 líneas no vacías**. La mayor parte son estilos CSS; por eso CSS se explica por bloques y selectores, mientras que cada función, componente, punto de entrada y tramo ejecutable tiene su referencia exacta en la guía.

Los archivos CSV, el JSON generado, dependencias y el resultado de compilación no se cuentan como código escrito a mano.
