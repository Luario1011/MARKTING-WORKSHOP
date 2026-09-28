# Copia de estudio del código

Esta carpeta contiene una copia de lectura de los archivos relevantes del proyecto. Está pensada para subrayar, poner notas y seguir la explicación de `../04_REFERENCIA_POR_LINEAS.md` sin tocar la aplicación funcional que se encuentra dos niveles arriba.

## Incluye

- configuración de Astro y TypeScript;
- generador de datos y modelo Python;
- componentes React, rutas, lógica de cálculo y estilos;
- el artefacto `model-run.json` de la corrida actual.

## No incluye

- `node_modules`;
- la carpeta generada `dist`;
- los CSV grandes de 10.438 y 10.000 filas.

Por esa razón esta copia es para **lectura**, no para iniciar un segundo servidor. El proyecto que se ejecuta está en la raíz. Si necesitas actualizar esta copia después de un cambio, ejecuta:

```text
powershell -ExecutionPolicy Bypass -File ESTUDIO/actualizar-copia-estudio.ps1
```

La referencia de líneas permanece en `../04_REFERENCIA_POR_LINEAS.md` y las explicaciones de funciones están en `../02_FRONTEND.md` y `../03_DATOS_Y_MODELO.md`.
