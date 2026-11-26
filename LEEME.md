# Centro de mando Zunko

App instalable para manejar la tienda: productos por etapa, calculadora de precio (Calculadora 2026 del curso), creativos y landings. Sin servidor: los datos se guardan en el celular.

- `index.html`: la app.
- `calc.js`: las fórmulas de la calculadora. Prueba: `node test-calc.js` (debe decir «el ejemplo de la hoja cuadra»).
- `docs/centro-de-mando-zunko.md`: la especificación de pantallas, plantillas y landings.

## Publicar en GitHub Pages

En el repositorio: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. En uno o dos minutos queda en `https://TU-USUARIO.github.io/zunko/`.

## Instalar en el celular

Abre el enlace en Chrome y usa **⋮ → Instalar app**. En iPhone, desde Safari: **Compartir → Agregar a inicio**.

## Actualizar

Si cambias archivos, sube la versión nueva y cambia en `sw.js` la línea `const V='zunko-v1'` por `zunko-v2` para que el celular descargue todo de nuevo.
