# Centro de mando Zunko

App instalable para manejar la tienda: productos por etapa, calculadora de precio (Calculadora 2026 del curso), creativos y landings. Sin servidor: los datos se guardan en el celular.

- `index.html`: la app (estructura y estilos).
- `app.js`: pantallas y lógica (tablero, ficha, pendientes, copia de seguridad).
- `calc.js`: las fórmulas de la calculadora. Prueba: `node test-calc.js` (debe decir «el ejemplo de la hoja cuadra»).
- `pauta.js`: las reglas de la pauta de prueba (48 h, CTR 1,5 %, día 3, escalar 20–30 %, tope de $150.000). Prueba: `node test-pauta.js`.
- `landing.js`: el generador de landings (estructura de tiendazunko.com) y su revisión. Prueba: `node test-landing.js`.
- `fotos.js`: las fotos de los productos, guardadas en el navegador.
- `creativos.js`: las 7 plantillas de creativos dibujadas en canvas (feed 4:5, historia 9:16, cuadrado 1:1).
- `crear.js`: la pantalla Crear (landing, creativos y escenas con Gemini).
- `intermediario/worker.js`: el intermediario de Gemini para Cloudflare. Prueba: `node intermediario/test-worker.mjs`.
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

## Escenas con Gemini (opcional)

El botón **✨ Escena** (Crear → Landing → Fotos) pone tu producto en otra escena: balcón, fachada, sala, de noche… La app nunca guarda la clave de Gemini. Habla con un intermediario gratis en Cloudflare que la tiene guardada, solo acepta pedidos desde tu app y pone un tope diario.

### 1. La clave de Gemini

1. Entra a **aistudio.google.com** con tu cuenta de Google.
2. **Get API key → Create API key**. Cópiala y no la pegues en ningún otro lado.
3. La generación de imágenes puede pedir que actives la facturación en Google Cloud. Cada escena se cobra ahí; pon un presupuesto con alerta en Google Cloud → Facturación → Presupuestos.

### 2. El intermediario en Cloudflare (gratis)

1. Crea una cuenta en **dash.cloudflare.com**.
2. **Workers & Pages → Create → Create Worker**. Nómbralo `zunko-gemini` y toca **Deploy**.
3. **Edit code**: borra lo que trae, pega todo el contenido de `intermediario/worker.js` y toca **Deploy**.
4. **Settings → Variables and Secrets → Add**:
   - `GEMINI_API_KEY`, tipo **Secret**: la clave del paso 1.
   - `APP_TOKEN`, tipo **Secret**: una contraseña larga que inventes (por ejemplo 30 letras y números al azar).
   - `ALLOWED_ORIGIN`, tipo **Text**: `https://cristiancamiloosuna-oss.github.io`
   - `DAILY_LIMIT`, tipo **Text** (opcional): cuántas escenas por día, por ejemplo `30`.
5. Tope diario (recomendado): **Storage & Databases → KV → Create** un espacio llamado `zunko-limites`. Luego en el Worker, **Bindings → Add → KV namespace**, nombre de la variable `LIMITES`, y elige `zunko-limites`. Sin esto, el tope diario no se aplica.
6. Copia la dirección del Worker (algo como `https://zunko-gemini.TU-CUENTA.workers.dev`).

### 3. Conectar la app

En la app: **Ajustes → Escenas con Gemini**. Pega la URL del Worker y el mismo `APP_TOKEN`, y toca **Probar conexión**. Debe decir «Conexión correcta».

La copia de seguridad no guarda la clave de la app: si restauras en otro equipo, vuelve a pegarla.

Las fotos generadas quedan marcadas como IA. La landing y los creativos muestran solos «Imagen ilustrativa». Revisa siempre que el producto se vea igual al real antes de usarla: si Gemini lo cambia, bórrala y genera otra.

## Primera prueba con un producto real

1. **Productos → + Producto**: nombre, link de Dropi y costo.
2. En la ficha, **Radar**: agrega 1 o 2 competidores con su precio y días al aire.
3. **Testeo**: escribe el ángulo y 4–6 hooks (o pídemelos con «Copiar para Claude»).
4. **Costear con la calculadora**: flete cotizado en Dropi, precio final. Mira el BREAKEVEN.
5. **Landing del producto**: sube 3–4 fotos, «Copiar pedido de copy», pégamelo, pega mi respuesta. Revisa la vista previa y los avisos.
6. **Ajustes → Landings**: pon el destino de los pedidos antes de publicar una landing de verdad.
7. **Crear → Creativos**: revisa las 7 plantillas con tus fotos y descarga el lote de hooks.
8. Cuando lances: pasa el producto a **Pauta**, pon la hora de lanzamiento y registra las métricas una vez al día. Las alertas salen en **Hoy**.
9. Descarga una **copia de seguridad** en Ajustes al terminar.
