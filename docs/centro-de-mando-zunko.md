# Centro de mando Zunko: pantallas y plantillas

Borrador v2 · 26 nov 2026 (añade el generador de landings)

Una app instalable (PWA) en un solo `index.html`, igual que Bolsillo: sin servidor, con los datos guardados en el celular (`localStorage`), copia de seguridad en JSON y publicada en GitHub Pages.

## Reparto de trabajo

| Lo hace la app (código, gratis) | Lo hace Claude (estratégico) |
|---|---|
| Mover productos por etapas y recordar en qué va cada uno | Elegir qué producto entra al radar y cuál pasa a pauta |
| Calcular precio sugerido, BREAKEVEN y proyección | Elegir el ángulo de venta y escribir los hooks |
| Aplicar las reglas fijas de pauta (48 h, CTR 1,5 %, día 3, escalar 20–30 %) | Leer los resultados y decidir qué cambiar |
| Rellenar plantillas de creativos y descargarlas en PNG | Escribir el copy de la landing (titular, contraste, FAQ por objeción) |
| Armar la landing completa con ese copy y revisarla antes de publicar | (Más adelante, Gemini: escenas del producto) |
| Llevar los pendientes | |

**El puente para ahorrar tokens:** cada producto tiene un botón **«Copiar para Claude»** que arma un resumen corto en texto (datos, costeo, métricas por día, pregunta). Se pega en el chat y Claude no tiene que consultar Dropi, Dropkiller ni Meta para reconstruir el contexto.

El camino de vuelta también es corto: cuando la app le pide copy a Claude, le pide la respuesta en un bloque JSON con los campos exactos. Ese bloque se pega en **«Pegar respuesta de Claude»** y llena la ficha sola, sin copiar campo por campo.

---

## Navegación

Barra inferior con 5 pestañas, una columna de máximo 480 px (como Bolsillo):

**Hoy · Productos · Calcular · Crear · Ajustes**

**Crear** tiene dos pestañas arriba: **Creativos** y **Landing**. Las dos leen el mismo «contenido de venta» de la ficha (ver abajo), así que lo que se escribe una vez sirve para el anuncio y para la página.

---

## 1. Hoy

Lo primero que se ve al abrir. Responde «¿qué toca hacer hoy?».

- **Alertas de pauta**, calculadas desde el registro diario de cada producto en pauta:
  - «No tocar: faltan 31 h para cumplir las 48 h» (cuenta regresiva desde el lanzamiento).
  - «Día 1: ningún creativo pasa de 1,5 % de CTR. El problema es el hook».
  - «Día 3: 2 creativos superan el BREAKEVEN de $17.600. Apágalos».
  - «Día 4+: el ganador va bien. Sube máximo 20–30 % (de $80.000 a $96.000–104.000)».
  - «Antes de pasar $150.000/día confirma stock por escrito y primeras entregas» (bloquea hasta marcar las dos casillas).
  - «Falta el registro de hoy» si un producto en pauta no tiene métricas del día.
- **Pendientes de hoy y vencidos**, con check rápido. Cada uno puede ir ligado a un producto.
- **Resumen por etapa**: cuántos productos hay en Radar, Testeo, Costeo y Pauta. Tocar uno abre el tablero filtrado.

## 2. Productos (tablero)

Columnas por etapa, deslizables en el celular: **Radar → Testeo → Costeo → Pauta**, más **Descartados** (plegada, con el motivo).

Tarjeta: foto, nombre, costo proveedor, BREAKEVEN si ya se calculó, días en la etapa y un punto de color (verde = listo para avanzar, ámbar = le falta un dato, rojo = no cabe).

Botón **+ Producto** abre un formulario corto: nombre, link de Dropi o Dropkiller, costo proveedor, foto (subida desde el celular).

### Ficha de producto

Una pantalla por producto con secciones según la etapa. Cada etapa tiene una **condición para avanzar**; la app avisa pero deja avanzar igual (la decisión es tuya).

| Etapa | Qué se llena | Condición para avanzar |
|---|---|---|
| **Radar** | Link del proveedor, costo, link de la competencia, días al aire del anuncio de la competencia, precio que cobra la competencia, notas | Tener costo y al menos un competidor |
| **Testeo** | Ángulo elegido (el que la competencia ya validó), 4–6 hooks, fotos reales recibidas o no, stock que dice el proveedor, contenido de venta | Ángulo, al menos 4 hooks y la landing sin errores en la revisión |
| **Costeo** | Flete cotizado en Dropi, efectividad y cancelaciones, precio final. Usa la misma calculadora de la pestaña Calcular, guardada en el producto | BREAKEVEN ≥ $15.000 y precio final ≤ precio de la competencia |
| **Pauta** | Fecha y hora de lanzamiento, presupuesto diario, registro diario por creativo (gasto, impresiones, clics, pedidos), entregas reales | — |

Arriba de la ficha, siempre: precio final, BREAKEVEN, CPA actual y el botón **Copiar para Claude**. Abajo: **historial de decisiones** (fecha + qué se decidió + por qué), que también va en el resumen para Claude.

### Contenido de venta

Un bloque de la ficha que alimenta creativos y landing a la vez. Así no se escribe dos veces lo mismo:

| Campo | Lo usa la landing en | Lo usa el creativo |
|---|---|---|
| Titular (ataca el problema o nombra el resultado) y entradilla | Hero | 1 Hook y foto |
| Método viejo: 2–3 molestias concretas / con el producto: 2–3 ventajas | Contraste | 2 Antes y después |
| 3 lugares o situaciones de uso, cada uno con foto | Casos de uso | 5 Tres lugares |
| Unidades que entrega + rango de precio del mercado (sin marcas) | Anclaje por unidad | 4 Precio por unidad |
| Escalones de precio por volumen (1, 2, 3 unidades) | Bloque de compra, formulario y cierre | 7 Lleva 2 |
| 3 pasos de uso | Cómo funciona | — |
| Ficha técnica (medidas en cm, peso en kg) | Ficha técnica | — |
| 8 o más preguntas frecuentes contra las objeciones del producto | FAQ | — |
| Familia de color (nogal, pino, azul noche) | Todos los colores | Todos los colores |

Con las entregas reales, la app sugiere reemplazar la efectividad supuesta (70 %) por la real y recalcula el BREAKEVEN.

## 3. Calcular

La Calculadora de Precio 2026 del curso, celda por celda. Se puede usar suelta o abrirla desde un producto (ahí guarda).

**Entradas:** precio proveedor, flete base, efectividad (70 % por defecto), cancelaciones (20 %), administrativos (0), fulfillment (0), CPA del Ads Manager ($20.000 por defecto), importe a gastar.

**Salidas, en este orden:**

1. **Precio sugerido** a 15 %, 20 % y 25 % de margen, con botón para fijar el margen propio.
2. **Precio final**: campo con el sugerido redondeado a precio comercial (ej. $89.900). Todo lo de abajo se recalcula con este.
3. **BREAKEVEN (CPA techo)**, en grande. En rojo si queda bajo $15.000 («no aguanta pauta en Meta Colombia»), ámbar entre $15.000 y $20.000, verde arriba.
4. **Barra de % del precio**: proveedor, flete con devoluciones, CPA real, utilidad. Se ve de un vistazo cuál de los tres mata el producto.
5. Utilidad por entregado, utilidad por pedido en Shopify, ROAS neto real, precio de comparación (P ÷ 0,7).
6. **Proyección** con el importe a gastar: pedidos totales, despachados, entregados, facturación, utilidad neta.

Cada número muestra si es **supuesto** o **real** (etiqueta pequeña).

La app trae una prueba interna con el ejemplo de la hoja (C 40.000, F 18.000, E 80 %, X 20 %, CPA 20.000, P 90.000 → BREAKEVEN 17.600, utilidad por entregado −3.750). Si alguna vez no da, la app lo dice.

> **Decidido:** toda la app usa el **BREAKEVEN de la hoja del curso** como único CPA techo.

## 4. Crear → Creativos

Rellena plantillas en código (dibujadas en `<canvas>`) y descarga PNG. Sin IA y sin costo.

**Flujo:** elegir producto → elegir plantilla → elegir tamaño → revisar los textos (vienen prellenados desde la ficha) → **Descargar**. O bien **Lote de hooks**: una plantilla × los 4–6 hooks del producto → descarga un `.zip` con todas las variantes, listas para el conjunto de prueba.

**Tamaños:** 1080×1350 (feed 4:5, el principal), 1080×1920 (historias y reels), 1080×1080 (cuadrado).

**Sistema visual Zunko** (igual que las landings): Bricolage Grotesque 800 para titulares, Instrument Sans para texto, ámbar `#E08C0B` solo para precio y llamado a la acción, fondo según la familia del producto (nogal, pino, azul noche). Marca `zunko` con la «o» en ámbar en una esquina.

### Las 7 plantillas

| # | Plantilla | Para qué | Campos |
|---|---|---|---|
| 1 | **Hook + foto** | La base del lote de prueba: misma foto, hook distinto | Hook (máx. 8 palabras), foto, sello «Pagas al recibir» |
| 2 | **Antes / después** | El contraste contra el método viejo, lo que más convierte en tráfico frío | Título, foto y 2–3 molestias del «antes»; foto y 2–3 ventajas del «con [producto]» |
| 3 | **Oferta con precio** | Remarketing y cierre | Foto, nombre, precio tachado (P ÷ 0,7), precio final, ahorro en pesos, «Envío gratis · Pagas al recibir» |
| 4 | **Precio por unidad** | Volver barato un precio alto con aritmética | «$239.990 por 1.000 luces = $240 por luz», comparación con el rango de mercado (sin marcas) |
| 5 | **3 lugares de uso** | Vender dónde se usa, no qué trae | 3 fotos pequeñas con su etiqueta (el balcón, la reja, el antejardín) + titular |
| 6 | **Garantía** | Responder el miedo de contraentrega | «Si no te sirve, no lo pagas», tres puntos: no pagas nada por adelantado · 5 días hábiles de retracto (Ley 1480 de 2011) · te confirmamos por WhatsApp |
| 7 | **Lleva 2** | Oferta por volumen | Precio de 1 y de 2, ahorro en pesos, foto doble |

### Reglas que la app impone (no se pueden saltar)

- **No hay campo de reseñas ni testimonios** en ninguna plantilla.
- Si la foto se marca como generada con IA, se añade sola una línea pequeña: «Imagen ilustrativa».
- Aviso si el texto trae palabras de una lista de marcas registradas comunes.
- Aviso si el hook pasa de 8 palabras o el texto se sale de la zona segura de historias (franjas de 250 px arriba y abajo).

### Más adelante: Gemini para escenas

Botón **«Generar escena»** en la foto de una plantilla (el producto en el balcón, en la reja, etc.). La app nunca guarda la clave: llama a un intermediario pequeño (un Cloudflare Worker gratis) que tiene la clave de Gemini guardada, limita las llamadas por día y solo acepta pedidos desde el dominio de la app. Las escenas se marcan como IA automáticamente.

## 5. Crear → Landing

Arma la landing del producto con la estructura que mejor ha funcionado en tiendazunko.com (la de las luces solares) y la entrega lista para publicar. El código pone el diseño, la estructura, el formulario y las reglas. Claude solo escribe el copy.

### Flujo

1. **Elegir producto.** La app trae fotos, precio final, precio tachado (P ÷ 0,7), escalones por volumen y familia de color desde la ficha.
2. **Pedir el copy a Claude** (solo si falta). El botón **«Copiar pedido de copy»** arma un texto con el producto, el ángulo, la competencia y las fotos, y pide de vuelta un JSON con titular, entradilla, casos de uso, contraste, anclaje, pasos, ficha técnica y FAQ. Se pega en «Pegar respuesta de Claude».
3. **Revisar y ajustar** cada sección con vista previa en vivo, en tamaño celular y de computador.
4. **Revisión automática** (ver abajo). Si hay errores en rojo, no se puede descargar.
5. **Descargar** de una de dos formas:
   - `.zip` con `index.html` y la carpeta `img/`, para publicar en GitHub Pages o Netlify (una carpeta por producto).
   - **Copiar como sección de Shopify**: el HTML con estilos aislados, para pegar en una sección «Liquid personalizado» del tema.

### Estructura fija, en orden

Las secciones no se reordenan por producto; solo se llenan.

| # | Sección | Qué pone el código | Qué viene del contenido de venta |
|---|---|---|---|
| 1 | Barra de confianza | Fondo tinta: «Envío gratis · Pagas al recibir · Garantía» | — |
| 2 | Cabecera | Marca `zunko` con la «o» ámbar, `tiendazunko.com`, botón a `#pedido` | — |
| 3 | Galería | 3–4 fotos con miniaturas; avisa si la primera es el render del catálogo | Fotos |
| 4 | Hero y compra | Precio grande, tachado, envío gratis, selector de variación, oferta por volumen con ahorro en pesos, CTA y la línea «No pagas nada ahora · Pagas al recibir · Entrega en 1 a 7 días hábiles · 5 días hábiles de retracto» | Titular, entradilla, variaciones, escalones |
| 5 | Casos de uso | Tres bloques con foto | 3 lugares de uso |
| 6 | Contraste contra el método viejo | Dos columnas en prosa corta (no una tabla de palomitas) | Molestias y ventajas |
| 7 | Así se ve puesto | Galería o video con `loading="lazy"` | Fotos o video en uso |
| 8 | Anclaje por unidad | Hace la cuenta sola: precio ÷ unidades, comparado con el rango de mercado | Unidades y rango |
| 9 | Cómo funciona | 3 pasos numerados | Pasos de uso |
| 10 | Cómo pedir | Fijo: llenas el formulario / te escribimos por WhatsApp / lo recibes y ahí pagas | — |
| 11 | Ficha técnica | `<dl>` con números tabulares y «Mide tu espacio antes de pedirlo» si el tamaño importa | Medidas |
| 12 | Garantía | Fijo: «Si no te sirve, **no lo pagas**», no pagas nada por adelantado, retracto de 5 días hábiles (Ley 1480 de 2011), confirmación por WhatsApp | — |
| 13 | Formulario | Ver abajo | Escalones |
| 14 | FAQ | `<details>` con +/–; añade solas las tres fijas: ¿de verdad pago al recibir?, ¿cuánto se demora?, ¿y si llega dañado? | 8 o más preguntas propias |
| 15 | Cierre | Repite precio, oferta por volumen, pago al recibir y ancla al formulario | — |
| 16 | Pie | Marca, dominio y solo las redes que tengan perfil real (se configuran en Ajustes) | — |

### Diseño

- Bricolage Grotesque 800 para titulares (`letter-spacing:-.02em`, `text-wrap:balance`) e Instrument Sans para el texto.
- Ámbar `#E08C0B` (`#F0A520` en oscuro) como único color de acción, con texto `#1C1814`. No se puede cambiar desde la app.
- Fondo según la familia: nogal `#FBF8F4` / `#8A5A32`, pino `#FAF7F2` / `#1F5137`, azul noche `#F7F8FB` / `#1B2A4A`. Todos los tokens en `:root`, con modo oscuro.
- Una columna de máximo 720 px con márgenes de 16 px; precios con números tabulares.

### Formulario contraentrega

- Campos: nombre, celular (WhatsApp), departamento (los 33, en orden), ciudad, dirección, barrio y referencia, cantidad con el precio de cada escalón y notas. Todos con `id` estable y `autocomplete` correcto.
- Dos columnas que pasan a una bajo 430 px. El total se recalcula al cambiar la cantidad, en formato `es-CO`.
- Al enviar valida, oculta el formulario y confirma con nombre, celular y total.
- El destino del pedido (`SUBMIT_ENDPOINT`: Dropi, Shopify o un webhook) y el número de WhatsApp se configuran una vez en Ajustes y se inyectan en todas las landings.
- **Un solo camino de compra:** el generador no trae botón de WhatsApp flotante ni «Agregar al carrito». Si no, no hay forma de medir el costo por pedido.

### Revisión automática antes de descargar

**Errores (bloquean la descarga):**
- Algún campo de reseña o testimonio. No existe en el generador, y si el copy pegado trae citas de clientes, se marca.
- Fotos marcadas como IA sin la línea «Las imágenes son ilustrativas; el producto real puede verse algo distinto» (la app la pone sola, pero no se puede borrar).
- Marcas registradas ajenas en el copy o en el anclaje (lista de marcas comunes, editable).
- Menos de 8 preguntas propias en el FAQ, o falta el precio, el formulario o la garantía.
- Medidas en pulgadas o libras sin convertir.

**Avisos (dejan descargar):**
- El titular describe el producto en vez de atacar el problema (por ejemplo, empieza con el nombre o con «1.000 LED»).
- Una pregunta del FAQ es genérica (se repite igual en otra landing).
- Fotos sin texto `alt` en español, o con texto en inglés según tu marca.
- El precio final queda por encima del precio de la competencia guardado en la ficha.
- Scroll horizontal a 400 px (la vista previa lo mide).

## 6. Ajustes

- Supuestos por defecto: efectividad, cancelaciones, CPA esperado, presupuesto de prueba ($80.000), administrativos y fulfillment.
- Familias de color y logo.
- Para las landings: destino de los pedidos (`SUBMIT_ENDPOINT`), número de WhatsApp, dominio, redes con perfil real y lista de marcas prohibidas.
- Copia de seguridad: descargar, copiar y restaurar (mismo esquema que Bolsillo).
- Instalar la app.

---

## Datos (resumen)

```js
{
  productos: [{
    id, nombre, etapa, // radar | testeo | costeo | pauta | descartado
    fotos: [{id, ia:false}], familia, // nogal | pino | noche
    proveedor: {link, costo, stock},
    competencia: [{link, precio, diasAlAire}],
    angulo, hooks: [],
    venta: {titular, entradilla, usos:[{lugar, fotoId}], viejo:[], nuevo:[], unidades, rangoMercado,
            escalones:[{cant, precio}], variaciones:[], pasos:[], ficha:[{k, v}], faq:[{p, r}]},
    costeo: {flete, efectividad, cancelaciones, admin, fulfillment, cpa, precioFinal, real:{efectividad:false}},
    pauta: {lanzamiento, presupuesto, stockConfirmado:false, entregasConfirmadas:false,
            dias: [{fecha, creativos:[{hook, gasto, impresiones, clics, pedidos}]}]},
    decisiones: [{fecha, texto}],
    motivoDescarte
  }],
  pendientes: [{id, texto, fecha, productoId, hecho}],
  ajustes: {...}
}
```

Las fotos van en IndexedDB (no caben en `localStorage`); la copia de seguridad las incluye.

## Orden de construcción propuesto

1. Calculadora (con la prueba del ejemplo de la hoja).
2. Tablero, ficha de producto y pendientes.
3. Registro de pauta y las alertas de Hoy.
4. Contenido de venta en la ficha y «Pegar respuesta de Claude».
5. Generador de landing con revisión automática y las dos formas de descarga.
6. Plantillas de creativos 1, 2, 3 y 6, más el lote de hooks.
7. Plantillas 4, 5 y 7.
8. Intermediario y escenas con Gemini.
