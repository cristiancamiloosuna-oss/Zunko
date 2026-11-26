'use strict';
// Crear → Landing: fotos, contenido de venta, pedido de copy a Claude, revisión, vista previa y descarga.
// Usa las utilidades y el estado de app.js (se cargan en la misma página).

const MARCAS_DEF = 'Apple, Samsung, Xiaomi, Huawei, Sony, LG, Philips, Dyson, Oster, Black+Decker, Imusa, Tefal, Ikea, Nike, Adidas, Disney, Marvel, Pokémon, Lego, Barbie, Hello Kitty, Coca-Cola, Amazon, Shein, Temu, Mercado Libre';
function ajLanding() {
  S.ajustes.landing = Object.assign({ endpoint: '', whatsapp: '', dominio: 'tiendazunko.com', instagram: '', tiktok: '', facebook: '', marcas: MARCAS_DEF }, S.ajustes.landing);
  return S.ajustes.landing;
}
function prepararVenta(p) {
  p.venta = Object.assign(Landing.ventaNueva(), p.venta);
  p.fotos = p.fotos || [];
  return p;
}
function crearEstado() {
  S.crear = Object.assign({ sub: 'landing', prodId: '', vista: 'cel' }, S.crear);
  const vivos = S.productos.filter(p => p.etapa !== 'descartado');
  if (!prod(S.crear.prodId) && vivos.length) S.crear.prodId = (vivos.find(p => p.etapa !== 'radar') || vivos[0]).id;
  return S.crear;
}
function ctxRevision(p) {
  const a = ajLanding();
  return {
    marcas: a.marcas.split(','), endpoint: a.endpoint, precioCompetencia: precioCompetencia(p),
    otrasPreguntas: S.productos.filter(x => x.id !== p.id && x.venta).flatMap(x => x.venta.faq.map(f => f.pregunta)),
  };
}

function vCrear() {
  const c = crearEstado();
  const tabs = `<div class="seg2"><button data-csub="landing" aria-pressed="${c.sub === 'landing'}">Landing</button><button data-csub="creativos" aria-pressed="${c.sub === 'creativos'}">Creativos</button></div>`;
  if (c.sub === 'creativos') return header('Crear', tabs) + `<div class="card vacio"><h2>Plantillas de creativos</h2><p>Siguiente paso: las 7 plantillas en PNG y el lote de hooks, con las mismas fotos y textos de la landing.</p></div>`;
  const vivos = S.productos.filter(p => p.etapa !== 'descartado');
  if (!vivos.length) return header('Crear', tabs) + `<div class="card vacio"><h2>Primero agrega un producto</h2><p>La landing toma el precio, la competencia y los hooks de la ficha.</p><button class="btn" data-tab="prod" style="margin-top:14px">Ir a Productos</button></div>`;
  const p = prepararVenta(prod(c.prodId)), v = p.venta;
  const lines = a => esc((a || []).join('\n'));
  const T = (path, label, val, ph = '') => `<div class="f"><label for="cv-${path}">${label}</label><div class="inp"><input id="cv-${path}" data-v="${path}" value="${esc(val)}" placeholder="${esc(ph)}" autocomplete="off"></div></div>`;
  const N = (path, label, val, ph = '', money = false) => `<div class="f"><label for="cv-${path}">${label}</label><div class="inp">${money ? '<span>$</span>' : ''}<input id="cv-${path}" data-v="${path}" data-num inputmode="numeric" value="${esc(fmtIn(val))}" placeholder="${esc(ph)}"></div></div>`;
  const A = (path, label, val, rows = 3, ph = '', extra = '') => `<div class="f"><label for="cv-${path}">${label}</label><textarea id="cv-${path}" data-v="${path}" ${extra} rows="${rows}" placeholder="${esc(ph)}">${val}</textarea></div>`;
  const optsFoto = sel => `<option value="">Automática</option>` + p.fotos.map((f, i) => `<option value="${f.id}" ${f.id === sel ? 'selected' : ''}>Foto ${i + 1}${f.alt ? ' · ' + esc(f.alt.slice(0, 24)) : ''}</option>`).join('');

  return header('Crear', tabs) + `
  <div class="row" style="margin-bottom:12px;align-items:center;flex-wrap:wrap">
    <div class="f" style="flex:1 1 260px"><label for="c-prod">Producto</label><div class="inp"><select id="c-prod">${vivos.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.nombre)} · ${nombreEtapa(x.etapa)}</option>`).join('')}</select></div></div>
    <div class="f" style="flex:1 1 200px"><label for="cv-familia">Color de fondo</label><div class="inp"><select id="cv-familia" data-v="familia">${Object.entries(Landing.FAMILIAS).map(([k, f]) => `<option value="${k}" ${k === v.familia ? 'selected' : ''}>${f.nombre}</option>`).join('')}</select></div></div>
  </div>
  <div class="cols fija" id="crear"><div class="in">

  <section class="card"><h2>1 · Copy con Claude</h2>
    <p class="note" style="margin:0 0 10px">Copia el pedido, pégalo en Claude y pega aquí su respuesta (el bloque JSON). Llena el contenido de venta de una vez.</p>
    <button class="btn sec" id="c-pedido" style="width:100%">${ic('copy', 18)}Copiar pedido de copy</button>
    <div class="f" style="margin-top:10px"><label for="c-resp">Respuesta de Claude</label><textarea id="c-resp" rows="3" placeholder='{"titular": "...", ...}'></textarea></div>
    <button class="btn" id="c-aplicar" style="width:100%;margin-top:8px">Pegar respuesta de Claude</button>
  </section>

  <section class="card"><h2>2 · Fotos</h2>
    <p class="note" style="margin:0 0 10px">Las 4 primeras son la galería; la primera, mejor el producto en uso que el render del catálogo. Se guardan en este navegador, reducidas a 1600 px.</p>
    <div id="c-fotos">${p.fotos.map((f, i) => `<div class="foto" data-fid="${f.id}">
      <img data-thumb="${f.id}" alt="">
      <div class="foto-d"><div class="inp"><input data-falt="${f.id}" value="${esc(f.alt || '')}" placeholder="Qué se ve (texto alternativo)" aria-label="Descripción de la foto ${i + 1}"></div>
      <div class="foto-c"><label><input type="checkbox" data-fflag="${f.id}|ia" ${f.ia ? 'checked' : ''}> Hecha con IA</label><label><input type="checkbox" data-fflag="${f.id}|render" ${f.render ? 'checked' : ''}> Render del catálogo</label><label><input type="checkbox" data-fflag="${f.id}|ingles" ${f.ingles ? 'checked' : ''}> Texto en inglés</label></div></div>
      <div class="foto-a"><button class="ib" data-fmov="${f.id}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button><button class="ib" data-fmov="${f.id}|1" aria-label="Bajar" ${i === p.fotos.length - 1 ? 'disabled' : ''}>↓</button><button class="ib" data-fdel="${f.id}" aria-label="Borrar">${ic('x', 18)}</button></div>
    </div>`).join('') || '<p class="empty small">Sin fotos todavía.</p>'}</div>
    <label class="btn sec" style="width:100%;margin-top:10px;cursor:pointer">${ic('plus', 18)}Subir fotos<input type="file" id="c-subir" accept="image/*" multiple hidden></label>
  </section>

  <section class="card"><h2>3 · Hero</h2>
    ${A('titular', 'Titular (ataca el problema o nombra el resultado)', esc(v.titular), 2, 'Ilumina la fachada sin un solo enchufe')}
    ${A('entradilla', 'Entradilla (2 o 3 líneas)', esc(v.entradilla), 3)}
    ${A('variaciones', 'Variaciones, una por línea (solo si existen de verdad)', lines(v.variaciones), 2, 'Blanco cálido', 'data-lines')}
    <h3 class="sub">Oferta por volumen <span class="mute">1 unidad = ${+p.costeo.P ? money(+p.costeo.P) : 'precio del costeo'}</span></h3>
    ${v.escalones.map((e, i) => `<div class="row" style="margin-bottom:8px"><div class="f"><label for="ce-${i}-c">Unidades</label><div class="inp"><input id="ce-${i}-c" data-esc="${i}|cant" inputmode="numeric" value="${esc(e.cant)}"></div></div><div class="f"><label for="ce-${i}-p">Precio total</label><div class="inp"><span>$</span><input id="ce-${i}-p" data-esc="${i}|precio" inputmode="numeric" value="${esc(fmtIn(e.precio))}"></div></div><button class="ib" data-escdel="${i}" aria-label="Quitar">${ic('x', 18)}</button></div>`).join('')}
    <button class="addrow" id="c-addesc">${ic('plus', 18)}Agregar escalón (lleva 2, lleva 3…)</button>
  </section>

  <section class="card"><h2>4 · Casos de uso</h2>
    ${v.usos.map((u, i) => `<div class="grid" style="margin-bottom:12px">${T(`usos.${i}.lugar`, `Lugar ${i + 1}`, u.lugar, ['El antejardín', 'La reja', 'El balcón'][i])}<div class="f"><label for="cv-usos.${i}.foto">Foto</label><div class="inp"><select id="cv-usos.${i}.foto" data-v="usos.${i}.foto">${optsFoto(u.foto)}</select></div></div><div class="full">${A(`usos.${i}.texto`, 'Texto', esc(u.texto), 2)}</div></div>`).join('')}
  </section>

  <section class="card"><h2>5 · Contraste contra el método viejo</h2><div class="grid">
    ${A('viejo', 'Hoy, sin el producto (una molestia por línea)', lines(v.viejo), 4, 'La extensión por la ventana', 'data-lines')}
    ${A('nuevo', 'Con el producto (una ventaja por línea)', lines(v.nuevo), 4, 'Cero cables', 'data-lines')}
  </div></section>

  <section class="card"><h2>6 · Anclaje de precio por unidad</h2><div class="grid">
    ${N('unidades.cantidad', 'Unidades que entrega', v.unidades.cantidad, '1.000')}
    ${T('unidades.plural', 'Nombre en plural', v.unidades.plural, 'luces')}
    ${T('unidades.singular', 'Nombre en singular', v.unidades.singular, 'luz')}
    ${T('mercado.descripcion', 'La alternativa del mercado (sin marcas)', v.mercado.descripcion, 'juegos de 100 luces')}
    ${N('mercado.cantidad', 'Unidades de la alternativa', v.mercado.cantidad, '100')}
    ${N('mercado.min', 'Precio mínimo de la alternativa', v.mercado.min, '60.000', true)}
    ${N('mercado.max', 'Precio máximo', v.mercado.max, '80.000', true)}
  </div><p class="note" id="c-anc">${Landing.anclaje(p) || 'Llena las unidades y la alternativa para ver la cuenta.'}</p></section>

  <section class="card"><h2>7 · Cómo funciona y ficha técnica</h2>
    ${A('pasos', '3 pasos de uso, uno por línea', lines(v.pasos), 3, '', 'data-lines')}
    ${A('ficha', 'Ficha técnica, «Dato: valor» por línea (cm y kg)', esc(v.ficha.map(f => f.dato + ': ' + f.valor).join('\n')), 4, 'Largo: 100 m', 'data-ficha')}
    <label class="check"><input type="checkbox" data-vc="medirEspacio" ${v.medirEspacio ? 'checked' : ''}> Mostrar «Mide tu espacio antes de pedirlo»</label>
  </section>

  <section class="card"><h2>8 · Preguntas frecuentes <span class="mute" style="text-transform:none;letter-spacing:0">${v.faq.filter(f => f.pregunta && f.respuesta).length} de mínimo 8</span></h2>
    <p class="note" style="margin:0 0 10px">Contra las objeciones de este producto. La app agrega sola: ¿de verdad pago al recibir?, ¿cuánto se demora? y ¿si llega dañado?</p>
    ${v.faq.map((f, i) => `<div class="faq-e"><div class="inp"><input data-faq="${i}|pregunta" value="${esc(f.pregunta)}" placeholder="Pregunta" aria-label="Pregunta ${i + 1}"></div><textarea data-faq="${i}|respuesta" rows="2" placeholder="Respuesta" aria-label="Respuesta ${i + 1}">${esc(f.respuesta)}</textarea><button class="ib" data-faqdel="${i}" aria-label="Quitar">${ic('x', 18)}</button></div>`).join('')}
    <button class="addrow" id="c-addfaq">${ic('plus', 18)}Agregar pregunta</button>
  </section>
  </div>

  <div class="out">
    <section class="card" id="c-rev"></section>
    <section class="card"><div class="row" style="align-items:center;margin-bottom:10px"><h2 style="margin:0;flex:1">Vista previa</h2><div class="seg2"><button data-cvista="cel" aria-pressed="${c.vista === 'cel'}">Celular</button><button data-cvista="pc" aria-pressed="${c.vista === 'pc'}">PC</button></div></div>
      <div class="prev ${c.vista}"><iframe id="c-prev" title="Vista previa de la landing" sandbox="allow-scripts allow-same-origin"></iframe></div>
    </section>
  </div></div>`;
}

// Después de pintar: miniaturas, revisión y vista previa
async function crearMontado() {
  const c = S.crear, p = c && prod(c.prodId); if (!p || c.sub !== 'landing') return;
  for (const img of document.querySelectorAll('[data-thumb]')) img.src = await Fotos.url(img.dataset.thumb);
  actualizarCrear(true);
}
let crearT = null;
function actualizarCrear(ya) {
  clearTimeout(crearT);
  crearT = setTimeout(async () => {
    const p = prod(S.crear.prodId); if (!p || !$('#c-rev')) return;
    const r = Landing.revisar(p, ctxRevision(p));
    $('#c-rev').innerHTML = `<h2>Revisión antes de publicar</h2>
      ${r.errores.length ? `<div class="als">${r.errores.map(e => `<div class="al mal"><span class="al-i">!</span><div><p>${esc(e)}</p></div></div>`).join('')}</div>` : '<div class="al bien"><span class="al-i">✓</span><div><p>Sin errores: se puede descargar.</p></div></div>'}
      ${r.avisos.length ? `<div class="als">${r.avisos.map(e => `<div class="al aviso"><span class="al-i">!</span><div><p>${esc(e)}</p></div></div>`).join('')}</div>` : ''}
      <div class="acts"><button class="btn" id="c-zip" ${r.errores.length ? 'disabled' : ''}>Descargar .zip</button><button class="btn sec" id="c-uno" ${r.errores.length ? 'disabled' : ''}>Un solo archivo .html</button></div>
      <p class="note">El .zip trae index.html y la carpeta img/ (para GitHub Pages o Netlify). El archivo único lleva las fotos dentro: más pesado, pero se abre o sube en cualquier parte.</p>`;
    const anc = $('#c-anc'); if (anc) anc.textContent = Landing.anclaje(p) || 'Llena las unidades y la alternativa para ver la cuenta.';
    const urls = {};
    for (const f of p.fotos) urls[f.id] = await Fotos.url(f.id);
    const fr = $('#c-prev'); if (!fr) return;
    let y = 0; try { y = fr.contentWindow.scrollY; } catch (e) {}
    fr.onload = () => { try { fr.contentWindow.scrollTo(0, y); } catch (e) {} };
    fr.srcdoc = Landing.generar(p, id => urls[id] || '', ajLanding());
  }, ya ? 0 : 500);
}

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'landing';
function bajar(blob, nombre) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function descargarLanding(p, unico) {
  const nombres = {}, archivos = [];
  for (let i = 0; i < p.fotos.length; i++) {
    const f = p.fotos[i], b = await Fotos.get(f.id); if (!b) continue;
    if (unico) nombres[f.id] = await Fotos.aDataURL(b);
    else { nombres[f.id] = `img/foto-${i + 1}.jpg`; archivos.push({ nombre: nombres[f.id], datos: new Uint8Array(await b.arrayBuffer()) }); }
  }
  const html = Landing.generar(p, id => nombres[id] || '', ajLanding());
  if (unico) bajar(new Blob([html], { type: 'text/html' }), `${slug(p.nombre)}.html`);
  else bajar(new Blob([Landing.zip([{ nombre: 'index.html', datos: new TextEncoder().encode(html) }].concat(archivos))], { type: 'application/zip' }), `landing-${slug(p.nombre)}.zip`);
  p.decisiones.push({ fecha: new Date().toISOString(), texto: `Landing descargada (${unico ? 'archivo único' : '.zip'}).` });
  save(); toast('Landing descargada');
}

// ---------- eventos de Crear ----------
const cp = () => prod(S.crear && S.crear.prodId);
document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || !b.closest('#app') || b.closest('#dlg')) return;
  const d = b.dataset, p = cp();
  if (d.csub) { S.crear.sub = d.csub; save(); render(); return; }
  if (d.cvista) { S.crear.vista = d.cvista; save(); document.querySelectorAll('[data-cvista]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('.prev').className = 'prev ' + d.cvista; return; }
  if (d.landing) { S.crear = Object.assign(crearEstado(), { sub: 'landing', prodId: d.landing }); ir('crear'); return; }
  if (!p) return;
  if (b.id === 'c-pedido') { copiar(Landing.pedidoCopy(p), 'Pedido copiado: pégalo en Claude'); return; }
  if (b.id === 'c-aplicar') {
    let j; try { j = Landing.parsearRespuesta($('#c-resp').value); } catch (err) { toast(err.message); return; }
    const hay = p.venta.titular || p.venta.faq.length;
    if (hay) { const r = await pedir({ titulo: 'Reemplazar el contenido', texto: 'Los campos que trae la respuesta reemplazan lo que ya escribiste (fotos, escalones y variaciones se conservan).', ok: 'Reemplazar' }); if (!r) return; }
    if (j.usos) j.usos.forEach((u, i) => { u.foto = (p.venta.usos[i] || {}).foto || ''; });
    Object.assign(p.venta, j);
    p.decisiones.push({ fecha: new Date().toISOString(), texto: 'Copy de la landing cargado desde Claude.' });
    save(); render(); toast('Contenido cargado'); return;
  }
  if (d.fmov) { const [id, k] = d.fmov.split('|'), i = p.fotos.findIndex(f => f.id === id), j = i + +k; if (j < 0 || j >= p.fotos.length) return; [p.fotos[i], p.fotos[j]] = [p.fotos[j], p.fotos[i]]; save(); render(); return; }
  if (d.fdel) { p.fotos = p.fotos.filter(f => f.id !== d.fdel); p.venta.usos.forEach(u => { if (u.foto === d.fdel) u.foto = ''; }); await Fotos.del(d.fdel); save(); render(); return; }
  if (b.id === 'c-addesc') { const n = (p.venta.escalones.reduce((m, x) => Math.max(m, +x.cant || 1), 1)) + 1; p.venta.escalones.push({ cant: n, precio: '' }); save(); render(); return; }
  if (d.escdel != null) { p.venta.escalones.splice(+d.escdel, 1); save(); render(); return; }
  if (b.id === 'c-addfaq') { p.venta.faq.push({ pregunta: '', respuesta: '' }); save(); render(); const q = document.querySelector(`[data-faq="${p.venta.faq.length - 1}|pregunta"]`); if (q) q.focus(); return; }
  if (d.faqdel != null) { p.venta.faq.splice(+d.faqdel, 1); save(); render(); return; }
  if (b.id === 'c-zip' || b.id === 'c-uno') { b.disabled = true; try { await descargarLanding(p, b.id === 'c-uno'); } finally { b.disabled = false; } return; }
});

document.addEventListener('input', e => {
  const el = e.target, p = cp(); if (!p || !el.closest('#app')) return;
  const v = p.venta;
  if (el.dataset.v) {
    const path = el.dataset.v; let val = el.value;
    if (el.dataset.num != null) { val = parse(val); el.value = fmtIn(val); }
    else if (el.dataset.lines != null) val = el.value.split('\n').map(x => x.trim()).filter(Boolean);
    else if (el.dataset.ficha != null) val = el.value.split('\n').map(x => { const i = x.indexOf(':'); return i < 0 ? { dato: x.trim(), valor: '' } : { dato: x.slice(0, i).trim(), valor: x.slice(i + 1).trim() }; }).filter(f => f.dato);
    setPath(v, path, val);
  } else if (el.dataset.faq) { const [i, k] = el.dataset.faq.split('|'); v.faq[+i][k] = el.value; }
  else if (el.dataset.esc) { const [i, k] = el.dataset.esc.split('|'), n = parse(el.value); if (k === 'precio') el.value = fmtIn(n); v.escalones[+i][k] = n; }
  else if (el.dataset.falt) { p.fotos.find(f => f.id === el.dataset.falt).alt = el.value; }
  else return;
  save(); actualizarCrear();
});

document.addEventListener('change', async e => {
  const el = e.target; if (!el.closest('#app')) return;
  if (el.id === 'c-prod') { S.crear.prodId = el.value; save(); render(); return; }
  const p = cp(); if (!p) return;
  if (el.dataset.v && el.tagName === 'SELECT') { setPath(p.venta, el.dataset.v, el.value); save(); actualizarCrear(true); return; }
  if (el.dataset.vc) { p.venta[el.dataset.vc] = el.checked; save(); actualizarCrear(true); return; }
  if (el.dataset.fflag) { const [id, k] = el.dataset.fflag.split('|'); p.fotos.find(f => f.id === id)[k] = el.checked; save(); actualizarCrear(true); return; }
  if (el.id === 'c-subir' && el.files.length) {
    toast('Subiendo fotos…');
    for (const file of el.files) {
      try { const blob = await Fotos.reducir(file), id = uid(); await Fotos.put(id, blob); p.fotos.push({ id, alt: '', ia: false, render: false, ingles: false }); }
      catch (err) { toast('No se pudo leer ' + file.name); }
    }
    el.value = ''; save(); render(); toast('Fotos guardadas');
  }
});
