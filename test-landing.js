// Prueba del generador de landings: node test-landing.js
const assert = require('assert');
const L = require('./landing.js');

const p = {
  nombre: 'Luces solares 1000 LED', angulo: 'Sin enchufes', hooks: ['Sin cables'], competencia: [{ link: 'https://x.co', precio: 259900 }], proveedor: { link: '' },
  costeo: { P: 239990 },
  fotos: [{ id: 'f1', alt: 'Luces en la fachada' }, { id: 'f2', alt: 'Reja' }, { id: 'f3', alt: 'Balcón' }, { id: 'f4', alt: 'Árbol', ia: true }, { id: 'f5', alt: 'De noche' }],
  venta: Object.assign(L.ventaNueva(), {
    familia: 'pino', titular: 'Ilumina el árbol, la reja y la fachada sin un solo enchufe', entradilla: 'Se cargan con el sol.',
    usos: [{ lugar: 'El antejardín', texto: 'a', foto: 'f2' }, { lugar: 'La reja', texto: 'b', foto: '' }, { lugar: 'El balcón', texto: 'c', foto: '' }],
    viejo: ['La extensión por la ventana', 'El cable para tropezarse'], nuevo: ['Cero cables', 'Se prenden solas'],
    unidades: { cantidad: 1000, singular: 'luz', plural: 'luces' }, mercado: { min: 60000, max: 80000, cantidad: 100, descripcion: 'juegos de 100 luces' },
    pasos: ['Clava el panel', 'Extiende', 'Listo'], ficha: [{ dato: 'Largo', valor: '100 m' }],
    faq: Array.from({ length: 8 }, (_, i) => ({ pregunta: `¿Pregunta ${i}?`, respuesta: 'Sí.' })),
    escalones: [{ cant: 2, precio: 429990 }],
  }),
};

// Anclaje como en la skill
assert.strictEqual(L.anclaje(p), '$239.990 por 1.000 luces son ~$240 por luz. Los juegos de 100 luces cuestan $60.000–80.000, o sea $600–800 cada luz.');
assert.strictEqual(L.tachado(239990), 342800);
assert.deepStrictEqual(L.escalones(p).map(e => e.ahorro), [0, 49990]);

// Revisión limpia
let r = L.revisar(p, { marcas: ['Philips'], endpoint: 'https://hook', precioCompetencia: 259900 });
assert.deepStrictEqual(r.errores, [], r.errores.join('\n'));

// Errores que bloquean
const malo = JSON.parse(JSON.stringify(p));
malo.venta.faq = malo.venta.faq.slice(0, 5);
malo.venta.entradilla = 'Más de 500 clientes satisfechos. Mejor que Philips. Mide 12 pulgadas.';
r = L.revisar(malo, { marcas: ['Philips'] });
assert.strictEqual(r.errores.length, 4, r.errores.join('\n')); // faq, testimonio, marca, pulgadas
assert.ok(r.avisos.some(a => /destino de pedidos/.test(a)));
// Titular que describe el producto
malo.venta.titular = 'Luces solares 1000 LED para exterior';
assert.ok(L.revisar(malo, {}).avisos.some(a => /describir el producto/.test(a)));
// Pregunta repetida en otra landing
assert.ok(L.revisar(p, { otrasPreguntas: ['¿Pregunta 3?'] }).avisos.some(a => /se repiten/.test(a)));

// Respuesta de Claude con texto alrededor y ```json
const resp = 'Aquí va:\n```json\n{"titular":"T","faq":[{"pregunta":"¿A?","respuesta":"B"}],"usos":[{"lugar":"X","texto":"Y"}],"unidades":{"cantidad":"10","singular":"u","plural":"us"}}\n```\nSaludos';
const j = L.parsearRespuesta(resp);
assert.strictEqual(j.titular, 'T'); assert.strictEqual(j.usos.length, 3); assert.strictEqual(j.unidades.cantidad, 10);
assert.throws(() => L.parsearRespuesta('nada'), /JSON/);

// HTML
const html = L.generar(p, id => 'img/' + id + '.jpg', { endpoint: 'https://hook', whatsapp: '573001112233', instagram: '@tiendazunko' });
for (const t of ['Si no te sirve, <u>no lo pagas</u>', 'Ley 1480 de 2011', 'id="pedido"', 'Bogotá D.C.', 'Vichada', '¿De verdad pago al recibir?', 'Haz la cuenta',
  'Las imágenes son ilustrativas', '$342.800', 'ahorras $49.990', 'SUBMIT_ENDPOINT = "https://hook"', '#1F5137', 'Instagram @tiendazunko', '<title>Luces solares 1000 LED</title>'])
  assert.ok(html.includes(t), 'falta: ' + t);
assert.strictEqual((html.match(/<option>[^<]+<\/option>/g) || []).filter(o => L.DEPARTAMENTOS.some(d => o.includes(d))).length, 33);
assert.ok(!/whatsapp\.com|wa\.me|carrito/i.test(html.replace(/const WHATSAPP[^\n]+/, '')), 'un solo camino de compra');
assert.ok(!/Facebook|TikTok/.test(html), 'sin redes que no existen');
const orden = ['class="confianza"', 'class="cab"', 'class="gal"', 'class="hero"', 'Dónde lo vas a usar', 'Así lo resuelves hoy', 'Así se ve puesto', 'Haz la cuenta', 'Cómo funciona', 'Cómo pedir', 'Ficha técnica', 'no lo pagas', 'Haz tu pedido', 'Preguntas frecuentes', 'class="cierre', '<footer'];
orden.reduce((pos, t) => { const i = html.indexOf(t); assert.ok(i > pos, 'orden: ' + t); return i; }, -1);
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
new Function(script);
assert.ok(html.includes('<h3>Sin luces solares</h3>'), 'contraste sin cifras'); // el script de la landing compila
require('fs').writeFileSync(process.argv[2] || '/dev/null', html);

// ZIP
const z = L.zip([{ nombre: 'index.html', datos: new TextEncoder().encode(html) }, { nombre: 'img/f1.jpg', datos: new Uint8Array([1, 2, 3]) }]);
assert.strictEqual(L.crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
if (process.argv[3]) require('fs').writeFileSync(process.argv[3], z);

console.log('Landing OK: estructura de 16 secciones, revisión, respuesta de Claude y zip.');
