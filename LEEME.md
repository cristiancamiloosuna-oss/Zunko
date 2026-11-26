# Centro de mando Zunko

App instalable para manejar la tienda: productos por etapa, calculadora de precio (Calculadora 2026 del curso), creativos y landings. Sin servidor: los datos se guardan en el celular.

- `index.html`: la app.
- `calc.js`: las fórmulas de la calculadora. Prueba: `node test-calc.js` (debe decir «el ejemplo de la hoja cuadra»).
- `docs/centro-de-mando-zunko.md`: la especificación de pantallas, plantillas y landings.

## Publicar en GitHub Pages

En el repositorio: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. En uno o dos minutos queda en `https://TU-USUARIO.github.io/Zunko/`.

## Instalar en el PC (Windows)

1. Abre `https://cristiancamiloosuna-oss.github.io/Zunko/` en **Edge** o **Chrome**.
2. Toca el ícono de **Instalar** que aparece a la derecha de la barra de direcciones (una pantalla con una flecha), o el menú **⋯ → Aplicaciones → Instalar este sitio como aplicación** en Edge / **⋮ → Transmitir, guardar y compartir → Instalar página como app** en Chrome.
3. Queda en el menú Inicio con el ícono de Zunko. Clic derecho en su ícono de la barra de tareas → **Anclar a la barra de tareas**.

Abre en su propia ventana, sin pestañas, y funciona sin internet. Los datos viven en ese navegador de ese PC: si usas Edge y Chrome a la vez, cada uno tiene sus propios datos. Usa siempre el mismo.

También se puede instalar en el celular (Chrome **⋮ → Instalar app**), pero los datos no se pasan solos de un equipo a otro.

## Actualizar

Si cambias archivos, sube la versión nueva y cambia en `sw.js` la línea `const V='zunko-v1'` por `zunko-v2` para que el celular descargue todo de nuevo.
