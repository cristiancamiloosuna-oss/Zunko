// Generador de landings COD Zunko (estructura de tiendazunko.com) + revisión antes de publicar.
// Puro: no toca el DOM, para poder probarlo con node.
(function (root) {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = v => '$' + Math.round(+v || 0).toLocaleString('es-CO');
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  const DEPARTAMENTOS = ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'];

  const FAMILIAS = {
    nogal: { nombre: 'Nogal (hogar, organización)', claro: { bg: '#FBF8F4', card: '#FFFFFF', soft: '#F2EAE0', ink: '#1C1814', mute: '#6F655B', line: '#E7DFD5', acc: '#8A5A32' }, oscuro: { bg: '#16120E', card: '#201A15', soft: '#2A221B', ink: '#F3ECE4', mute: '#B3A799', line: '#3A3028', acc: '#D2A06F' } },
    pino: { nombre: 'Pino (navidad)', claro: { bg: '#FAF7F2', card: '#FFFFFF', soft: '#ECEFE6', ink: '#16201A', mute: '#5E6B62', line: '#DFE5DA', acc: '#1F5137' }, oscuro: { bg: '#0F1612', card: '#17201A', soft: '#1F2B23', ink: '#EDF2EC', mute: '#A3B2A8', line: '#2C3A31', acc: '#7FC29B' } },
    noche: { nombre: 'Azul noche (tecnología)', claro: { bg: '#F7F8FB', card: '#FFFFFF', soft: '#E9ECF4', ink: '#141A2A', mute: '#5D6478', line: '#DDE1EB', acc: '#1B2A4A' }, oscuro: { bg: '#0E1220', card: '#161B2B', soft: '#1E2438', ink: '#EEF1F8', mute: '#A4ABC0', line: '#2B3247', acc: '#9DB4E8' } },
  };

  function ventaNueva() {
    return {
      familia: 'nogal', titular: '', entradilla: '',
      usos: [{ lugar: '', texto: '', foto: '' }, { lugar: '', texto: '', foto: '' }, { lugar: '', texto: '', foto: '' }],
      viejo: [], nuevo: [], unidades: { cantidad: '', singular: '', plural: '' },
      mercado: { min: '', max: '', cantidad: '', descripcion: '' },
      pasos: [], ficha: [], faq: [], medirEspacio: false, variaciones: [], escalones: [],
    };
  }

  // Precio por escalón: el primero es el precio final del costeo.
  function escalones(p) {
    const P = +p.costeo.P || 0, ex = (p.venta.escalones || []).filter(e => +e.cant > 1 && +e.precio > 0).sort((a, b) => a.cant - b.cant);
    return [{ cant: 1, precio: P }].concat(ex).map(e => ({ cant: +e.cant, precio: +e.precio, ahorro: Math.max(0, e.cant * P - e.precio) }));
  }
  const tachado = P => Math.round(P / 0.7 / 100) * 100;

  function anclaje(p) {
    const v = p.venta, P = +p.costeo.P, u = v.unidades || {}, m = v.mercado || {};
    if (!P || !+u.cantidad || !u.plural) return '';
    const porU = P / +u.cantidad, r = x => (x >= 1000 ? money(Math.round(x / 100) * 100) : money(Math.round(x)));
    let t = `${money(P)} por ${(+u.cantidad).toLocaleString('es-CO')} ${esc(u.plural)} son ~${r(porU)} por ${esc(u.singular || u.plural)}.`;
    if (+m.min && +m.cantidad) {
      const a = +m.min / +m.cantidad, b = +(m.max || m.min) / +m.cantidad;
      t += ` ${m.descripcion ? 'Los ' + esc(m.descripcion) : 'La alternativa'} cuesta${m.descripcion ? 'n' : ''} ${money(m.min)}${+m.max && +m.max !== +m.min ? '–' + money(m.max).slice(1) : ''}, o sea ${r(a)}${b !== a ? '–' + r(b).slice(1) : ''} cada ${esc(u.singular || 'unidad')}.`;
    }
    return t;
  }

  // ---------- Revisión ----------
  const RX_TESTIMONIO = /(testimoni|rese[ñn]a|opini[oó]n(es)? de (nuestros )?clientes|clientes satisfechos|★|⭐|\b\d([.,]\d)?\s?estrellas)/i;
  const RX_IMPERIAL = /\b\d+([.,]\d+)?\s?(pulgadas?|pulg\.?|inch(es)?|in\b|"|lbs?\b|libras?)/i;
  function textos(p) {
    const v = p.venta;
    return [v.titular, v.entradilla, ...v.usos.flatMap(u => [u.lugar, u.texto]), ...v.viejo, ...v.nuevo, ...v.pasos,
      ...v.ficha.flatMap(f => [f.dato, f.valor]), ...v.faq.flatMap(f => [f.pregunta, f.respuesta]), v.mercado.descripcion, ...v.variaciones].filter(Boolean);
  }
  function revisar(p, ctx = {}) {
    const v = p.venta, errores = [], avisos = [], fotos = p.fotos || [];
    const marcas = (ctx.marcas || []).map(m => m.trim()).filter(Boolean);
    const todo = textos(p).join('\n');
    if (!(+p.costeo.P)) errores.push('Falta el precio final (se toma del costeo del producto).');
    if (!v.titular) errores.push('Falta el titular.');
    if (!fotos.length) errores.push('Falta al menos una foto del producto.');
    if (RX_TESTIMONIO.test(todo)) errores.push('El texto habla de reseñas, testimonios o estrellas. No se publican reseñas que no sean reales: va el bloque de garantía.');
    const hallada = marcas.find(m => new RegExp('(^|[^a-z0-9])' + norm(m).replace(/ /g, '\\s+') + '([^a-z0-9]|$)', 'i').test(norm(todo)));
    if (hallada) errores.push(`Aparece la marca «${hallada}». No uses marcas registradas ajenas, ni en el anclaje de precio.`);
    if (RX_IMPERIAL.test(todo)) errores.push('Hay medidas en pulgadas o libras. Conviértelas a cm y kg.');
    const propias = v.faq.filter(f => f.pregunta && f.respuesta);
    if (propias.length < 8) errores.push(`El FAQ tiene ${propias.length} preguntas propias; mínimo 8, escritas contra las objeciones de este producto.`);

    const n = norm(p.nombre), t = norm(v.titular);
    if (v.titular && (t.startsWith(n.split(' ').slice(0, 2).join(' ')) || /^\d|\b\d+\s?(led|w|mah|lm|v)\b/.test(t)))
      avisos.push('El titular parece describir el producto. Mejor que ataque el problema o nombre el resultado.');
    if (fotos.length && fotos.length < 3) avisos.push('La galería queda mejor con 3 o 4 fotos.');
    if (fotos[0] && fotos[0].render) avisos.push('La primera foto es el render del catálogo. Mejor el producto en uso.');
    if (fotos.some(f => !f.alt)) avisos.push('Hay fotos sin descripción (texto alternativo) en español.');
    if (fotos.some(f => f.ingles)) avisos.push('Hay fotos con texto en inglés: delatan el render del proveedor. Pide rehacerlas en español.');
    if (v.usos.filter(u => u.lugar && u.texto).length < 3) avisos.push('Faltan casos de uso: van tres, por lugar o situación.');
    if (v.viejo.length < 2 || v.nuevo.length < 2) avisos.push('El contraste contra el método viejo necesita 2–3 molestias y 2–3 ventajas.');
    if (v.pasos.length !== 3) avisos.push('«Cómo funciona» lleva 3 pasos.');
    if (!anclaje(p)) avisos.push('Sin anclaje de precio por unidad (llena unidades que entrega y el precio de la alternativa).');
    const otras = new Set((ctx.otrasPreguntas || []).map(norm));
    const rep = propias.filter(f => otras.has(norm(f.pregunta)));
    if (rep.length) avisos.push(`Preguntas que se repiten igual en otra landing (suenan genéricas): ${rep.map(f => '«' + f.pregunta + '»').join(', ')}.`);
    if (ctx.precioCompetencia && +p.costeo.P > ctx.precioCompetencia) avisos.push(`El precio (${money(p.costeo.P)}) pasa el de la competencia más barata (${money(ctx.precioCompetencia)}).`);
    if (!ctx.endpoint) avisos.push('Sin destino de pedidos (Ajustes): la landing solo confirmará en pantalla, no te llegará el pedido.');
    return { errores, avisos };
  }

  // ---------- Pedido de copy para Claude y lectura de la respuesta ----------
  function pedidoCopy(p) {
    const comp = (p.competencia || []).map(c => `- ${c.link || 'sin link'} · ${c.precio ? money(c.precio) : 's/precio'}${c.dias ? ` · ${c.dias} días al aire` : ''}`).join('\n');
    return `Escribe el copy de la landing contraentrega (Colombia, tienda Zunko, skill landing-producto-zunko) para este producto. Responde SOLO con un bloque JSON con exactamente estos campos, sin texto antes ni después.

Producto: ${p.nombre}
Precio final: ${money(p.costeo.P)} (tachado ${money(tachado(+p.costeo.P))}), envío gratis, pago contraentrega
Ángulo: ${p.angulo || '(sin definir)'}
Hooks probados: ${(p.hooks || []).join(' | ') || '(ninguno)'}
Proveedor: ${p.proveedor && p.proveedor.link || '(sin link)'}
Competencia:
${comp || '(sin datos)'}
Notas: ${p.notas || '-'}

Reglas: titular que ataque el problema o nombre el resultado (no que describa el producto); casos de uso por lugar o situación; contraste con molestias concretas del método viejo; medidas en cm y kg verificadas contra las fotos del proveedor; nada de reseñas ni testimonios; ninguna marca registrada, tampoco en la comparación de precio; mínimo 8 preguntas frecuentes contra las objeciones reales de ESTE producto (no incluyas las de pago al recibir, tiempo de entrega ni producto dañado: la app las agrega).

{
  "titular": "",
  "entradilla": "2 o 3 líneas",
  "usos": [{"lugar": "", "texto": ""}, {"lugar": "", "texto": ""}, {"lugar": "", "texto": ""}],
  "viejo": ["molestia concreta 1", "molestia 2", "molestia 3"],
  "nuevo": ["ventaja 1", "ventaja 2", "ventaja 3"],
  "unidades": {"cantidad": 0, "singular": "", "plural": ""},
  "mercado": {"min": 0, "max": 0, "cantidad": 0, "descripcion": "juegos de 100 luces"},
  "pasos": ["", "", ""],
  "ficha": [{"dato": "Medidas", "valor": "cm"}],
  "faq": [{"pregunta": "", "respuesta": ""}],
  "medirEspacio": false
}`;
  }
  function parsearRespuesta(txt) {
    let s = String(txt || '').replace(/```(json)?/gi, '');
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('No encontré un bloque JSON en lo que pegaste.');
    let j;
    try { j = JSON.parse(s.slice(a, b + 1)); } catch (e) { throw new Error('El JSON está incompleto o mal formado. Pídele a Claude que lo repita completo.'); }
    const arr = x => (Array.isArray(x) ? x.map(y => String(y).trim()).filter(Boolean) : []);
    const out = {};
    if (j.titular) out.titular = String(j.titular).trim();
    if (j.entradilla) out.entradilla = String(j.entradilla).trim();
    if (Array.isArray(j.usos)) out.usos = [0, 1, 2].map(i => ({ lugar: String((j.usos[i] || {}).lugar || '').trim(), texto: String((j.usos[i] || {}).texto || '').trim(), foto: '' }));
    if (j.viejo) out.viejo = arr(j.viejo);
    if (j.nuevo) out.nuevo = arr(j.nuevo);
    if (j.pasos) out.pasos = arr(j.pasos);
    if (j.unidades) out.unidades = { cantidad: +j.unidades.cantidad || '', singular: String(j.unidades.singular || ''), plural: String(j.unidades.plural || '') };
    if (j.mercado) out.mercado = { min: +j.mercado.min || '', max: +j.mercado.max || '', cantidad: +j.mercado.cantidad || '', descripcion: String(j.mercado.descripcion || '') };
    if (Array.isArray(j.ficha)) out.ficha = j.ficha.map(f => ({ dato: String(f.dato || '').trim(), valor: String(f.valor || '').trim() })).filter(f => f.dato);
    if (Array.isArray(j.faq)) out.faq = j.faq.map(f => ({ pregunta: String(f.pregunta || '').trim(), respuesta: String(f.respuesta || '').trim() })).filter(f => f.pregunta);
    if ('medirEspacio' in j) out.medirEspacio = !!j.medirEspacio;
    if (!Object.keys(out).length) throw new Error('El JSON no trae ninguno de los campos esperados.');
    return out;
  }

  // ---------- HTML de la landing ----------
  const FAQ_FIJAS = [
    { pregunta: '¿De verdad pago al recibir?', respuesta: 'Sí. No pagas nada por adelantado: llenas el formulario, te confirmamos por WhatsApp y pagas en efectivo cuando el producto llega a tu puerta.' },
    { pregunta: '¿Cuánto se demora?', respuesta: 'Entre 1 y 7 días hábiles según tu ciudad. Te escribimos por WhatsApp cuando el pedido sale.' },
    { pregunta: '¿Y si llega dañado?', respuesta: 'Nos escribes por WhatsApp con una foto apenas lo recibas y te lo cambiamos sin costo. Además tienes 5 días hábiles de retracto según la Ley 1480 de 2011.' },
  ];

  // Nombre corto para «Sin …» / «Con …»: primeras 3 palabras sin cifras ni unidades.
  const corto = n => (String(n).split(/\s+/).filter(w => !/\d/.test(w) && !/^(led|w|cm|kg|m)$/i.test(w)).slice(0, 3).join(' ') || String(n)).toLowerCase();

  // img(id) -> URL de la foto (blob para vista previa, img/… en el zip, data: en archivo único)
  function generar(p, img, ctx = {}) {
    const v = p.venta, F = FAMILIAS[v.familia] || FAMILIAS.nogal, c = F.claro, o = F.oscuro;
    const P = +p.costeo.P || 0, T = tachado(P), esc2 = escalones(p);
    const fotos = (p.fotos || []).filter(f => img(f.id));
    const gal = fotos.slice(0, 4);
    const usadas = new Set(gal.map(f => f.id).concat(v.usos.map(u => u.foto)));
    let enUso = fotos.filter(f => !usadas.has(f.id));
    if (!enUso.length) enUso = fotos.slice(1, 4);
    const fotoUso = (u, i) => fotos.find(f => f.id === u.foto) || fotos[(i + 1) % Math.max(1, fotos.length)];
    const ia = fotos.some(f => f.ia);
    const dom = ctx.dominio || 'tiendazunko.com';
    const redes = [['Instagram', ctx.instagram, 'https://instagram.com/'], ['TikTok', ctx.tiktok, 'https://tiktok.com/@'], ['Facebook', ctx.facebook, 'https://facebook.com/']].filter(r => r[1]);
    const faq = v.faq.filter(f => f.pregunta && f.respuesta).concat(FAQ_FIJAS);
    const imgTag = (f, cls = '', lazy = true) => f ? `<img src="${esc(img(f.id))}" alt="${esc(f.alt || p.nombre)}"${cls ? ` class="${cls}"` : ''}${lazy ? ' loading="lazy"' : ''} decoding="async">` : '';
    const anc = anclaje(p);
    const marca = '<span class="marca">zunk<b>o</b></span>';
    const cta = (t = 'Pedir ahora, pago al recibir') => `<a class="cta" href="#pedido">${t}</a>`;
    const ofertas = esc2.length > 1 ? `<ul class="vol">${esc2.map(e => `<li><b>${e.cant} ${e.cant > 1 ? 'unidades' : 'unidad'}</b><span>${money(e.precio)}</span>${e.ahorro ? `<em>Ahorras ${money(e.ahorro)}</em>` : ''}</li>`).join('')}</ul>` : '';
    const tokens = t => `--bg:${t.bg};--card:${t.card};--soft:${t.soft};--ink:${t.ink};--mute:${t.mute};--line:${t.line};--acc:${t.acc};`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(p.nombre)}</title>
<meta name="description" content="${esc(v.entradilla || v.titular)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{${tokens(c)}--action:#E08C0B;--onaction:#1C1814;--tinta:#1C1814;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${tokens(o)}--action:#F0A520;color-scheme:dark}}
:root[data-theme="dark"]{${tokens(o)}--action:#F0A520;color-scheme:dark}
*{box-sizing:border-box;min-width:0}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 "Instrument Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-x:clip}
h1,h2,h3{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:800;letter-spacing:-.02em;text-wrap:balance;line-height:1.1;margin:0 0 .5em}
h1{font-size:clamp(30px,7vw,44px)}h2{font-size:clamp(24px,5.4vw,32px)}h3{font-size:20px}
p{margin:0 0 1em}img{display:block;max-width:100%;height:auto}
.num,.precio,.vol,dl{font-variant-numeric:tabular-nums}
.wrap{max-width:720px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
section{padding:40px 0}
.banda{background:var(--soft)}
.confianza{background:var(--tinta);color:#F4EEE7;font-size:13px;font-weight:600;text-align:center}
.confianza .wrap{display:flex;gap:6px 18px;justify-content:center;flex-wrap:wrap;padding-top:8px;padding-bottom:8px}
header.cab .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:14px;padding-bottom:14px}
.marca{font:800 26px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em}.marca b{color:var(--action)}
.dom{display:block;font-size:12px;color:var(--mute);margin-top:2px}
.cta{display:flex;align-items:center;justify-content:center;min-height:54px;padding:0 22px;border-radius:14px;background:var(--action);color:var(--onaction);font-weight:600;font-size:18px;text-decoration:none;border:0;cursor:pointer;width:100%}
.cta.chico{min-height:40px;font-size:15px;width:auto;padding:0 14px;border-radius:10px}
.gal{padding-top:0}
.gal .main{aspect-ratio:1;border-radius:18px;overflow:hidden;background:var(--soft)}
.gal .main img{width:100%;height:100%;object-fit:cover}
.thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.thumbs button{padding:0;border:2px solid transparent;border-radius:10px;overflow:hidden;aspect-ratio:1;background:none;cursor:pointer}
.thumbs button[aria-current="true"]{border-color:var(--action)}
.thumbs img{width:100%;height:100%;object-fit:cover}
.ia{font-size:13px;color:var(--mute);margin-top:8px}
.hero{padding-top:8px}
.lede{font-size:19px;color:var(--mute)}
.precio{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:18px 0 6px}
.precio b{font:800 40px/1 "Bricolage Grotesque",sans-serif;letter-spacing:-.02em}
.precio s{color:var(--mute)}.precio .gratis{font-weight:600;color:var(--acc)}
.ahorro{font-weight:600;color:var(--acc);margin:0 0 14px}
.vol{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:8px}
.vol li{display:flex;gap:10px;align-items:baseline;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;flex-wrap:wrap}
.vol li span{margin-left:auto;font-weight:600}.vol em{font-style:normal;color:var(--acc);font-size:14px;width:100%}
.variacion{margin:0 0 14px}
.tranq{list-style:none;padding:0;margin:14px 0 0;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px;color:var(--mute)}
.tranq li::before{content:"✓ ";color:var(--acc);font-weight:700}
.usos{display:grid;gap:22px}
.uso img{border-radius:16px;aspect-ratio:4/3;object-fit:cover;width:100%;margin-bottom:12px}
.contraste{display:grid;gap:14px}
.lado{border-radius:16px;padding:18px 20px;background:var(--card);border:1px solid var(--line)}
.lado.nuevo{border-color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc)}
.lado ul{margin:0;padding-left:20px}.lado li{margin:6px 0}
.galeria-uso{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.galeria-uso img{border-radius:12px;aspect-ratio:1;object-fit:cover;width:100%}
.anclaje{font-size:20px}
.pasos{list-style:none;counter-reset:n;padding:0;margin:0;display:grid;gap:14px}
.pasos li{counter-increment:n;display:flex;gap:14px;align-items:flex-start}
.pasos li::before{content:counter(n);flex:none;width:34px;height:34px;border-radius:50%;background:var(--action);color:var(--onaction);font-weight:700;display:flex;align-items:center;justify-content:center}
dl.ficha{display:grid;grid-template-columns:auto 1fr;gap:10px 18px;margin:0}
dl.ficha dt{color:var(--mute)}dl.ficha dd{margin:0;font-weight:600}
.garantia{text-align:center}
.garantia h2 u{text-decoration-color:var(--action);text-decoration-thickness:4px;text-underline-offset:6px}
.garantia ul{list-style:none;padding:0;margin:18px auto 0;max-width:520px;display:grid;gap:10px;text-align:left}
.garantia li{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.campo{display:flex;flex-direction:column;gap:5px}.campo.full{grid-column:1/-1}
label{font-size:14px;font-weight:600}
input,select,textarea{font:inherit;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;min-height:50px;width:100%}
input:focus,select:focus,textarea:focus{outline:2px solid var(--action);outline-offset:1px}
.total{grid-column:1/-1;display:flex;justify-content:space-between;align-items:baseline;font-size:18px;padding:6px 2px}
.total b{font:800 28px "Bricolage Grotesque",sans-serif}
.nota{grid-column:1/-1;font-size:14px;color:var(--mute);margin:0}
.ok{display:none;background:var(--card);border:2px solid var(--acc);border-radius:18px;padding:22px}
.ok.on{display:block}
details{border-bottom:1px solid var(--line);padding:14px 0}
summary{cursor:pointer;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:12px}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-size:22px;line-height:1;color:var(--acc)}
details[open] summary::after{content:"–"}
details p{margin:10px 0 0;color:var(--mute)}
.cierre{text-align:center}
footer{padding:28px 0 40px;text-align:center;color:var(--mute);font-size:14px}
footer a{color:inherit}
@media (max-width:430px){form{grid-template-columns:1fr}}
@media (min-width:640px){.contraste{grid-template-columns:1fr 1fr}.usos{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="confianza"><div class="wrap"><span>Envío gratis</span><span>Pagas al recibir</span><span>Garantía de retracto</span></div></div>
<header class="cab"><div class="wrap"><div>${marca}<span class="dom">${esc(dom)}</span></div><a class="cta chico" href="#pedido">Pedir</a></div></header>

<main>
<section class="gal"><div class="wrap">
  <div class="main">${imgTag(gal[0], '', false).replace('<img', '<img id="fotoPrincipal" fetchpriority="high"')}</div>
  ${gal.length > 1 ? `<div class="thumbs">${gal.map((f, i) => `<button type="button" data-src="${esc(img(f.id))}" data-alt="${esc(f.alt || p.nombre)}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}">${imgTag(f)}</button>`).join('')}</div>` : ''}
  ${ia ? '<p class="ia">Las imágenes son ilustrativas; el producto real puede verse algo distinto.</p>' : ''}
</div></section>

<section class="hero"><div class="wrap">
  <h1>${esc(v.titular)}</h1>
  ${v.entradilla ? `<p class="lede">${esc(v.entradilla)}</p>` : ''}
  <div class="precio"><b>${money(P)}</b><s>${money(T)}</s><span class="gratis">Envío gratis</span></div>
  <p class="ahorro">Ahorras ${money(T - P)} hoy</p>
  ${v.variaciones.length ? `<div class="variacion campo"><label for="varHero">Elige</label><select id="varHero">${v.variaciones.map(x => `<option>${esc(x)}</option>`).join('')}</select></div>` : ''}
  ${ofertas}
  ${cta()}
  <ul class="tranq"><li>No pagas nada ahora</li><li>Pagas al recibir</li><li>Entrega en 1 a 7 días hábiles</li><li>5 días hábiles para retracto</li></ul>
</div></section>

${v.usos.some(u => u.lugar) ? `<section class="banda"><div class="wrap"><h2>Dónde lo vas a usar</h2><div class="usos">
${v.usos.filter(u => u.lugar).map((u, i) => `<article class="uso">${imgTag(fotoUso(u, i))}<h3>${esc(u.lugar)}</h3><p>${esc(u.texto)}</p></article>`).join('')}
</div></div></section>` : ''}

${v.viejo.length || v.nuevo.length ? `<section><div class="wrap"><h2>Así lo resuelves hoy, y así con esto</h2><div class="contraste">
  <div class="lado"><h3>Sin ${esc(corto(p.nombre))}</h3><ul>${v.viejo.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="lado nuevo"><h3>Con ${esc(corto(p.nombre))}</h3><ul>${v.nuevo.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
</div></div></section>` : ''}

${enUso.length ? `<section class="banda"><div class="wrap"><h2>Así se ve puesto</h2><div class="galeria-uso">${enUso.map(f => imgTag(f)).join('')}</div>${ia ? '<p class="ia">Las imágenes son ilustrativas; el producto real puede verse algo distinto.</p>' : ''}</div></section>` : ''}

${anc ? `<section><div class="wrap"><h2>Haz la cuenta</h2><p class="anclaje">${anc}</p></div></section>` : ''}

${v.pasos.length ? `<section class="banda"><div class="wrap"><h2>Cómo funciona</h2><ol class="pasos">${v.pasos.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></section>` : ''}

<section><div class="wrap"><h2>Cómo pedir</h2><ol class="pasos"><li>Llenas el formulario con tu dirección. No pagas nada todavía.</li><li>Te escribimos por WhatsApp para confirmar tu pedido.</li><li>Lo recibes en tu casa y ahí pagas, en efectivo.</li></ol></div></section>

${v.ficha.length ? `<section class="banda"><div class="wrap"><h2>Ficha técnica</h2><dl class="ficha">${v.ficha.map(f => `<dt>${esc(f.dato)}</dt><dd>${esc(f.valor)}</dd>`).join('')}</dl>${v.medirEspacio ? '<p style="margin-top:14px"><b>Mide tu espacio antes de pedirlo.</b></p>' : ''}</div></section>` : ''}

<section class="garantia"><div class="wrap"><h2>Si no te sirve, <u>no lo pagas</u></h2>
<ul><li>No pones un peso por adelantado: pagas cuando lo tienes en la mano.</li><li>Tienes 5 días hábiles de derecho de retracto, según la Ley 1480 de 2011 (Estatuto del Consumidor).</li><li>Te confirmamos por WhatsApp antes de despachar.</li></ul></div></section>

<section class="banda" id="pedido"><div class="wrap"><h2>Haz tu pedido</h2>
<form id="formPedido" novalidate>
  <div class="campo full"><label for="nombre">Nombre completo</label><input id="nombre" name="nombre" autocomplete="name" required></div>
  <div class="campo"><label for="celular">Celular (WhatsApp)</label><input id="celular" name="celular" type="tel" inputmode="tel" autocomplete="tel" pattern="[0-9 +]{10,15}" required></div>
  <div class="campo"><label for="departamento">Departamento</label><select id="departamento" name="departamento" autocomplete="address-level1" required><option value="">Elige</option>${DEPARTAMENTOS.map(d => `<option>${d}</option>`).join('')}</select></div>
  <div class="campo"><label for="ciudad">Ciudad</label><input id="ciudad" name="ciudad" autocomplete="address-level2" required></div>
  <div class="campo"><label for="direccion">Dirección</label><input id="direccion" name="direccion" autocomplete="street-address" required></div>
  <div class="campo full"><label for="barrio">Barrio y referencia</label><input id="barrio" name="barrio" autocomplete="address-level3" required></div>
  ${v.variaciones.length ? `<div class="campo"><label for="variacion">Opción</label><select id="variacion" name="variacion">${v.variaciones.map(x => `<option>${esc(x)}</option>`).join('')}</select></div>` : ''}
  <div class="campo${v.variaciones.length ? '' : ' full'}"><label for="cantidad">Cantidad</label><select id="cantidad" name="cantidad">${esc2.map(e => `<option value="${e.cant}" data-precio="${e.precio}">${e.cant} ${e.cant > 1 ? 'unidades' : 'unidad'} · ${money(e.precio)}${e.ahorro ? ` (ahorras ${money(e.ahorro)})` : ''}</option>`).join('')}</select></div>
  <div class="campo full"><label for="notas">Notas (opcional)</label><textarea id="notas" name="notas" rows="2"></textarea></div>
  <div class="total"><span>Total a pagar al recibir</span><b id="total">${money(P)}</b></div>
  <button class="cta full" type="submit">Confirmar pedido, pago al recibir</button>
  <p class="nota">No pagas nada ahora. Te escribimos por WhatsApp para confirmar.</p>
</form>
<div class="ok" id="ok" role="status" aria-live="polite"></div>
</div></section>

<section><div class="wrap"><h2>Preguntas frecuentes</h2>
${faq.map(f => `<details><summary>${esc(f.pregunta)}</summary><p>${esc(f.respuesta)}</p></details>`).join('\n')}
</div></section>

<section class="cierre banda"><div class="wrap"><h2>${esc(v.titular)}</h2>
  <div class="precio" style="justify-content:center"><b>${money(P)}</b><s>${money(T)}</s><span class="gratis">Envío gratis</span></div>
  ${esc2.length > 1 ? `<p>${esc2.slice(1).map(e => `Lleva ${e.cant} por ${money(e.precio)}${e.ahorro ? ` y ahorra ${money(e.ahorro)}` : ''}`).join(' · ')}.</p>` : ''}
  <p>Pagas en efectivo cuando lo recibes.</p>
  ${cta('Hacer mi pedido')}
</div></section>
</main>

<footer><div class="wrap">${marca}<br>${esc(dom)}${redes.length ? '<br>' + redes.map(r => `<a href="${esc(r[2] + r[1].replace(/^@/, ''))}" rel="noopener">${r[0]} @${esc(r[1].replace(/^@/, ''))}</a>`).join(' · ') : ''}</div></footer>

<script>
// Para recibir los pedidos: URL de un webhook (Dropi, Shopify, Make, Google Apps Script...). Vacío = solo confirma en pantalla.
const SUBMIT_ENDPOINT = ${JSON.stringify(ctx.endpoint || '')};
const WHATSAPP = ${JSON.stringify(ctx.whatsapp || '')};
const PRODUCTO = ${JSON.stringify(p.nombre).replace(/</g, '\\u003c')};
(function () {
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('es-CO'); };
  document.querySelectorAll('.thumbs button').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = document.getElementById('fotoPrincipal'); if (!m) return;
      m.src = b.dataset.src; m.alt = b.dataset.alt;
      document.querySelectorAll('.thumbs button').forEach(function (x) { x.setAttribute('aria-current', x === b); });
    });
  });
  var f = document.getElementById('formPedido'), cant = document.getElementById('cantidad'), tot = document.getElementById('total');
  var vh = document.getElementById('varHero'), vf = document.getElementById('variacion');
  if (vh && vf) vh.addEventListener('change', function () { vf.value = vh.value; });
  var precio = function () { return +cant.options[cant.selectedIndex].dataset.precio; };
  cant.addEventListener('change', function () { tot.textContent = fmt(precio()); });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    var d = Object.fromEntries(new FormData(f)); d.producto = PRODUCTO; d.total = precio(); d.fecha = new Date().toISOString();
    if (SUBMIT_ENDPOINT) fetch(SUBMIT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) }).catch(function () {});
    var ok = document.getElementById('ok');
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    ok.innerHTML = '<h3>¡Listo, ' + esc(d.nombre.split(' ')[0]) + '! Recibimos tu pedido</h3><p>Te escribimos al <b>' + esc(d.celular) + '</b> por WhatsApp para confirmarlo antes de despachar.</p><p>Total a pagar al recibir: <b>' + fmt(d.total) + '</b></p>';
    f.style.display = 'none'; ok.classList.add('on'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
</script>
</body>
</html>`;
  }

  // ---------- ZIP sin compresión (para descargar la landing con su carpeta img/) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(archivos) { // [{nombre, datos:Uint8Array}]
    const enc = new TextEncoder(), partes = [], central = []; let off = 0;
    for (const a of archivos) {
      const nom = enc.encode(a.nombre), d = a.datos, crc = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, 0, true); h.setUint16(12, 0x21, true); h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
      h.setUint16(26, nom.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nom, d);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true);
      c.setUint16(28, nom.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nom);
      off += 30 + nom.length + d.length;
    }
    const tamC = central.reduce((s, x) => s + x.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamC, true); fin.setUint32(16, off, true);
    const todo = partes.concat(central, [new Uint8Array(fin.buffer)]);
    const out = new Uint8Array(todo.reduce((s, x) => s + x.length, 0)); let i = 0;
    for (const x of todo) { out.set(x, i); i += x.length; }
    return out;
  }

  const api = { ventaNueva, FAMILIAS, DEPARTAMENTOS, escalones, tachado, anclaje, revisar, pedidoCopy, parsearRespuesta, generar, zip, crc32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Landing = api;
})(this);
