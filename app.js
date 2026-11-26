'use strict';
// Centro de mando Zunko. Datos en localStorage de este navegador.
const LSK = 'zunko-mando-v1';
const DEF = { E: 70, X: 20, CPA: 20000, A: 0, U: 0, I: 560000 }; // I: 7 días a $80.000
const ETAPAS = [
  ['radar', 'Radar'], ['testeo', 'Testeo'], ['costeo', 'Costeo'], ['pauta', 'Pauta'], ['descartado', 'Descartados'],
];
const ORDEN = ['radar', 'testeo', 'costeo', 'pauta'];
const nombreEtapa = id => (ETAPAS.find(e => e[0] === id) || [, id])[1];

let S = load();

function costeoNuevo(a) {
  return { C: '', F: '', E: a.E, X: a.X, A: a.A, U: a.U, CPA: a.CPA, P: '', I: a.I, m: 0.2, real: {} };
}
function pautaNueva() {
  return { lanzamiento: '', presupuesto: 80000, stockConfirmado: false, entregasConfirmadas: false, creativos: [], registro: {}, entregas: { despachados: '', entregados: '' } };
}
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(LSK)); } catch (e) {}
  s = s || {};
  s.ajustes = Object.assign({}, DEF, s.ajustes);
  s.calc = Object.assign(costeoNuevo(s.ajustes), s.calc);
  s.productos = s.productos || [];
  s.pendientes = s.pendientes || [];
  s.tab = s.tab || 'calc';
  s.view = s.view || null;
  s.productos.forEach(p => { p.pauta = Object.assign(pautaNueva(), p.pauta); });
  return s;
}
function save() {
  try { localStorage.setItem(LSK, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar: el navegador no deja escribir'); }
}

// ---------- utilidades ----------
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const neg = t => t.replace(/^-/, '−');
const money = v => (v < 0 ? '−$' : '$') + Math.round(Math.abs(v)).toLocaleString('es-CO');
const pct = v => neg(Math.round(v * 100).toLocaleString('es-CO')) + '%';
const dec = (v, d = 2) => neg(v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtIn = v => (v === '' || v == null ? '' : Number(v).toLocaleString('es-CO'));
const parse = s => { const d = String(s).replace(/[^\d]/g, ''); return d === '' ? '' : Number(d); };
const sgn = v => (v < 0 ? 'neg' : v > 0 ? 'pos' : '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hoyISO = () => new Date().toLocaleDateString('en-CA');
const fechaCorta = iso => { if (!iso) return ''; const d = new Date(iso.length === 10 ? iso + 'T12:00' : iso); return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }); };
const dias = desde => Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 864e5));
const linkCorto = u => { try { const x = new URL(u); return x.hostname.replace(/^www\./, ''); } catch (e) { return u; } };
const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');

function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2000); }
function copiar(txt, ok) { navigator.clipboard.writeText(txt).then(() => toast(ok || 'Copiado'), () => toast('No se pudo copiar')); }

const IC = {
  hoy: '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  prod: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
  crear: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/>',
  ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};
const ic = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const TABS = [['hoy', 'Hoy'], ['prod', 'Productos'], ['calc', 'Calcular'], ['crear', 'Crear'], ['ajustes', 'Ajustes']];

// ---------- diálogo genérico ----------
// campos: [{k, label, type:'text'|'textarea'|'money'|'date'|'select', value, options:[[v,t]], required}]
function pedir({ titulo, texto = '', campos = [], ok = 'Guardar', peligro = false }) {
  return new Promise(res => {
    const d = $('#dlg');
    d.innerHTML = `<form method="dialog"><h2>${esc(titulo)}</h2>${texto ? `<p class="note" style="margin:0 0 12px">${texto}</p>` : ''}
      ${campos.map(c => `<div class="f" style="margin-bottom:10px"><label for="dl-${c.k}">${esc(c.label)}</label>${
        c.type === 'textarea' ? `<textarea id="dl-${c.k}" rows="3" ${c.required ? 'required' : ''}>${esc(c.value || '')}</textarea>`
        : c.type === 'select' ? `<div class="inp"><select id="dl-${c.k}">${c.options.map(([v, t]) => `<option value="${esc(v)}" ${v === c.value ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`
        : `<div class="inp">${c.type === 'money' ? '<span>$</span>' : ''}<input id="dl-${c.k}" ${c.type === 'money' ? 'inputmode="numeric" data-money' : `type="${c.type || 'text'}"`} value="${esc(c.type === 'money' ? fmtIn(c.value) : c.value || '')}" ${c.required ? 'required' : ''} autocomplete="off"></div>`
      }</div>`).join('')}
      <div class="dlg-act"><button type="button" class="btn sec" value="no">Cancelar</button><button class="btn ${peligro ? 'peligro' : ''}" value="si">${esc(ok)}</button></div></form>`;
    const f = d.querySelector('form');
    f.querySelector('[value="no"]').onclick = () => { d.close(); res(null); };
    f.addEventListener('input', e => { if (e.target.dataset.money != null) e.target.value = fmtIn(parse(e.target.value)); });
    f.onsubmit = e => {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      const out = {};
      campos.forEach(c => { const v = f.querySelector('#dl-' + c.k).value; out[c.k] = c.type === 'money' ? parse(v) : v.trim(); });
      d.close(); res(out);
    };
    d.oncancel = () => res(null);
    d.showModal();
    const first = f.querySelector('input,textarea,select'); if (first) first.focus();
  });
}

// ---------- navegación ----------
function ir(tab, view = null) { S.tab = tab; S.view = view; save(); render(); scrollTo(0, 0); }
function renderTabs() {
  $('#tabs').innerHTML = '<span class="logo">zunk<b>o</b></span>' + TABS.map(([id, n]) => `<button data-tab="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${ic(id)}${n}</button>`).join('');
}
function render() {
  renderPendiente = false;
  renderTabs();
  document.body.classList.toggle('ancho', S.tab === 'prod' && !S.view);
  const v = S.view && S.view.ficha ? vFicha : S.view && S.view.costeo ? vCalc
    : ({ hoy: vHoy, prod: vTablero, calc: vCalc, ajustes: vAjustes }[S.tab] || vPronto);
  $('#app').innerHTML = v();
  if (v === vCalc) pintarResultados();
}
const prod = id => S.productos.find(p => p.id === id);
const header = (t, extra = '') => `<header class="top"><h1>${t}</h1>${extra}<span class="brand">zunk<b>o</b></span></header>`;

// ---------- reglas de producto ----------
function calcProd(p) {
  const c = p.costeo;
  return Calc.calcular({ C: c.C, F: c.F, E: (+c.E || 0) / 100, X: (+c.X || 0) / 100, A: c.A, U: c.U, CPA: c.CPA, P: c.P, I: c.I });
}
function precioCompetencia(p) {
  const v = p.competencia.map(x => +x.precio).filter(Boolean);
  return v.length ? Math.min(...v) : 0;
}
// Qué falta para pasar a la siguiente etapa. Lista vacía = listo.
function faltantes(p) {
  const f = [];
  if (p.etapa === 'radar') {
    if (!+p.costeo.C) f.push('el costo del proveedor');
    if (!p.competencia.length) f.push('al menos un competidor');
  } else if (p.etapa === 'testeo') {
    if (!p.angulo) f.push('el ángulo de venta');
    if (p.hooks.length < 4) f.push(`${4 - p.hooks.length} hook${4 - p.hooks.length > 1 ? 's' : ''} más (mínimo 4)`);
  } else if (p.etapa === 'costeo') {
    const P = +p.costeo.P;
    if (!P || !+p.costeo.C) f.push('el precio final en el costeo');
    else {
      const be = calcProd(p).breakeven;
      if (be < 15000) f.push(`un BREAKEVEN de al menos $15.000 (va en ${money(be)})`);
      const pc = precioCompetencia(p);
      if (pc && P > pc) f.push(`un precio que no pase el de la competencia (${money(pc)})`);
    }
  }
  return f;
}
function semaforoProd(p) {
  if (+p.costeo.P && +p.costeo.C && calcProd(p).breakeven < 15000) return 'rojo';
  return faltantes(p).length ? 'ambar' : 'verde';
}
function nuevoProducto(nombre, link, costo) {
  const t = new Date().toISOString();
  const p = {
    id: uid(), nombre, etapa: 'radar', creado: t, etapaDesde: t,
    proveedor: { link: link || '', stock: '' }, competencia: [], notas: '',
    angulo: '', hooks: [], fotosReales: false,
    costeo: costeoNuevo(S.ajustes), pauta: pautaNueva(),
    decisiones: [{ fecha: t, texto: 'Entró al radar.' }], motivoDescarte: '',
  };
  p.costeo.C = costo || '';
  S.productos.unshift(p);
  return p;
}
async function moverEtapa(p, destino) {
  if (destino === p.etapa) return;
  let motivo = '';
  if (destino === 'descartado') {
    const r = await pedir({ titulo: `Descartar ${p.nombre}`, campos: [{ k: 'm', label: 'Motivo', type: 'textarea', required: true }], ok: 'Descartar', peligro: true });
    if (!r) return; motivo = r.m;
  } else if (ORDEN.indexOf(destino) > ORDEN.indexOf(p.etapa) && p.etapa !== 'descartado') {
    const f = faltantes(p);
    if (f.length) {
      const r = await pedir({ titulo: `¿Pasar a ${nombreEtapa(destino)} igual?`, texto: `Todavía falta ${f.map(esc).join(', ')}. Puedes avanzarlo igual: la decisión es tuya.`, ok: 'Avanzar igual' });
      if (!r) return;
    }
  }
  const t = new Date().toISOString();
  p.decisiones.push({ fecha: t, texto: destino === 'descartado' ? `Descartado: ${motivo}` : `Pasó de ${nombreEtapa(p.etapa)} a ${nombreEtapa(destino)}.` });
  p.motivoDescarte = motivo;
  if (destino === 'pauta' && !p.pauta.creativos.length && p.hooks.length) p.pauta.creativos = p.hooks.map(h => ({ id: uid(), nombre: h, estado: 'activo' }));
  p.etapa = destino; p.etapaDesde = t;
  save(); render(); toast(destino === 'descartado' ? 'Producto descartado' : 'Movido a ' + nombreEtapa(destino));
}

// ---------- Hoy ----------
function vHoy() {
  const hoy = hoyISO();
  const pend = S.pendientes.filter(x => !x.hecho).sort((a, b) => (a.fecha || '9').localeCompare(b.fecha || '9'));
  const vence = pend.filter(x => x.fecha && x.fecha <= hoy), luego = pend.filter(x => !x.fecha || x.fecha > hoy);
  const hechos = S.pendientes.filter(x => x.hecho).slice(-5).reverse();
  const cuenta = id => S.productos.filter(p => p.etapa === id).length;
  const listos = S.productos.filter(p => ORDEN.slice(0, 3).includes(p.etapa) && !faltantes(p).length);
  return header('Hoy') + `
  <div class="cols"><div class="in">
  <section class="card"><h2>Pendientes</h2>
    <form class="addp" id="addp"><div class="inp grow"><input id="p-txt" placeholder="Nuevo pendiente" autocomplete="off" required></div>
    <div class="inp"><input id="p-fecha" type="date" value="${hoy}" aria-label="Fecha"></div>
    <div class="inp"><select id="p-prod" aria-label="Producto"><option value="">Sin producto</option>${S.productos.filter(p => p.etapa !== 'descartado').map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</select></div>
    <button class="btn" aria-label="Agregar pendiente">${ic('plus', 20)}</button></form>
    ${vence.length ? `<h3 class="sub">Para hoy y vencidos</h3>${vence.map(filaPend).join('')}` : ''}
    ${luego.length ? `<h3 class="sub">Próximos</h3>${luego.map(filaPend).join('')}` : ''}
    ${!pend.length ? '<p class="empty">Nada pendiente.</p>' : ''}
    ${hechos.length ? `<details class="hechos"><summary>Hechos recientes</summary>${hechos.map(filaPend).join('')}</details>` : ''}
  </section></div>
  <div class="out">
  <section class="card"><h2>Productos por etapa</h2><div class="etapas">${ETAPAS.slice(0, 4).map(([id, n]) => `<button class="etapa" data-tab="prod"><b>${cuenta(id)}</b><span>${n}</span></button>`).join('')}</div></section>
  ${listos.length ? `<section class="card"><h2>Listos para avanzar</h2>${listos.map(p => `<button class="lrow" data-ficha="${p.id}"><span class="dot verde"></span><span><b>${esc(p.nombre)}</b><small>${nombreEtapa(p.etapa)} → ${nombreEtapa(ORDEN[ORDEN.indexOf(p.etapa) + 1])}</small></span></button>`).join('')}</section>` : ''}
  <section class="card"><h2>Alertas de pauta</h2>${alertasHoy()}</section>
  </div></div>`;
}
function filaPend(x) {
  const p = x.productoId && prod(x.productoId), hoy = hoyISO();
  const tarde = !x.hecho && x.fecha && x.fecha < hoy;
  return `<div class="prow ${x.hecho ? 'hecho' : ''}"><input type="checkbox" data-pend="${x.id}" ${x.hecho ? 'checked' : ''} aria-label="Marcar hecho"><span><b>${esc(x.texto)}</b><small>${x.fecha ? `<span class="${tarde ? 'neg' : ''}">${tarde ? 'Venció ' : ''}${fechaCorta(x.fecha)}</span>` : 'Sin fecha'}${p ? ` · <button class="lnk" data-ficha="${p.id}">${esc(p.nombre)}</button>` : ''}</small></span><button class="ib" data-delpend="${x.id}" aria-label="Borrar">${ic('x', 18)}</button></div>`;
}

// ---------- Tablero ----------
function vTablero() {
  return header('Productos', `<button class="btn" id="nuevo">${ic('plus', 20)}Producto</button>`) +
  `<div class="board">${ETAPAS.map(([id, n]) => {
    const ps = S.productos.filter(p => p.etapa === id);
    return `<section class="colk ${id}" data-drop="${id}"><h2>${n} <span>${ps.length}</span></h2>${ps.map(tarjeta).join('') || `<p class="empty small">${id === 'radar' ? 'Agrega el primer producto con el botón + Producto.' : 'Vacío'}</p>`}</section>`;
  }).join('')}</div>
  <p class="note">En el computador puedes arrastrar las tarjetas entre columnas.</p>`;
}
function tarjeta(p) {
  const tiene = +p.costeo.P && +p.costeo.C;
  const be = tiene ? calcProd(p).breakeven : null;
  const sem = p.etapa === 'descartado' ? '' : semaforoProd(p);
  return `<button class="tk" draggable="true" data-ficha="${p.id}" data-drag="${p.id}">
    <span class="tk-h">${sem ? `<span class="dot ${sem}"></span>` : ''}<b>${esc(p.nombre)}</b></span>
    <span class="tk-m">${+p.costeo.C ? `Costo ${money(+p.costeo.C)}` : 'Sin costo'}${be != null ? ` · BE <b class="${Calc.semaforo(be) === 'rojo' ? 'neg' : ''}">${money(be)}</b>` : ''}</span>
    <span class="tk-m">${p.etapa === 'descartado' ? esc(p.motivoDescarte) : `${dias(p.etapaDesde)} d en la etapa`}</span></button>`;
}

// ---------- Ficha ----------
function campoTxt(id, path, label, val, ph = '', tipo = 'text') {
  return `<div class="f"><label for="pf-${id}">${label}</label><div class="inp">${tipo === 'money' ? '<span>$</span>' : ''}<input id="pf-${id}" data-pf="${path}" ${tipo === 'money' ? 'inputmode="numeric" data-money' : `type="${tipo}"`} value="${esc(tipo === 'money' ? fmtIn(val) : val)}" placeholder="${esc(ph)}" autocomplete="off"></div></div>`;
}
function vFicha() {
  const p = prod(S.view.ficha);
  if (!p) { S.view = null; return vTablero(); }
  const i = ORDEN.indexOf(p.etapa), sig = ORDEN[i + 1], ant = ORDEN[i - 1];
  const f = p.etapa === 'pauta' || p.etapa === 'descartado' ? [] : faltantes(p);
  const tiene = +p.costeo.P && +p.costeo.C, r = tiene ? calcProd(p) : null;
  const pc = precioCompetencia(p);
  return `<header class="top"><button class="ib" data-tab="prod" aria-label="Volver al tablero">${ic('back')}</button><h1 class="editable"><input id="pf-nombre" data-pf="nombre" value="${esc(p.nombre)}" aria-label="Nombre del producto"></h1><span class="brand">zunk<b>o</b></span></header>
  <div class="stepper">${ORDEN.map(e => `<button data-mover="${e}" class="${e === p.etapa ? 'on' : ORDEN.indexOf(e) < i ? 'done' : ''}">${nombreEtapa(e)}</button>`).join('')}</div>
  <div class="cols"><div class="in">
  ${p.etapa === 'descartado' ? `<div class="alerta">Descartado: ${esc(p.motivoDescarte)} <button class="lnk" data-mover="radar">Devolver al radar</button></div>` : ''}
  ${f.length ? `<div class="aviso">Para pasar a ${nombreEtapa(sig)} falta ${f.map(esc).join(', ')}.</div>` : sig && p.etapa !== 'descartado' ? `<div class="aviso ok">Listo para pasar a ${nombreEtapa(sig)}.</div>` : ''}

  ${p.etapa === 'pauta' ? seccionPauta(p) : ''}
  <section class="card"><h2>Radar · proveedor y competencia</h2><div class="grid">
    ${campoTxt('link', 'proveedor.link', 'Link del proveedor (Dropi / Dropkiller)', p.proveedor.link, 'https://', 'url')}
    ${campoTxt('costo', 'costeo.C', 'Costo proveedor', p.costeo.C, '0', 'money')}
  </div>
  <h3 class="sub">Competencia</h3>
  ${p.competencia.map((c, k) => `<div class="lrow"><span><b>${safeUrl(c.link) ? `<a href="${esc(safeUrl(c.link))}" target="_blank" rel="noopener">${esc(linkCorto(c.link))} ${ic('ext', 14)}</a>` : esc(c.link || 'Sin link')}</b><small>${c.precio ? money(+c.precio) : 'Sin precio'}${c.dias ? ` · ${esc(c.dias)} días al aire` : ''}</small></span><button class="ib" data-delcomp="${k}" aria-label="Quitar">${ic('x', 18)}</button></div>`).join('') || '<p class="empty small">Sin competidores todavía.</p>'}
  <button class="addrow" id="addcomp">${ic('plus', 18)}Agregar competidor</button>
  <div class="f" style="margin-top:12px"><label for="pf-notas">Notas</label><textarea id="pf-notas" data-pf="notas" rows="2">${esc(p.notas)}</textarea></div>
  </section>

  <section class="card"><h2>Testeo · ángulo y hooks</h2>
  <div class="f"><label for="pf-angulo">Ángulo de venta (el que la competencia ya validó)</label><textarea id="pf-angulo" data-pf="angulo" rows="2">${esc(p.angulo)}</textarea></div>
  <h3 class="sub">Hooks <span class="mute">${p.hooks.length} de 4–6</span></h3>
  ${p.hooks.map((h, k) => `<div class="lrow"><span class="hk">${k + 1}</span><span><b>${esc(h)}</b>${h.split(/\s+/).length > 8 ? '<small class="neg">Más de 8 palabras</small>' : ''}</span><button class="ib" data-delhook="${k}" aria-label="Quitar">${ic('x', 18)}</button></div>`).join('')}
  <form class="addp" id="addhook"><div class="inp grow"><input id="hook-txt" placeholder="Escribe un hook y Enter" autocomplete="off" required></div><button class="btn" aria-label="Agregar hook">${ic('plus', 20)}</button></form>
  <div class="grid" style="margin-top:12px">
    ${campoTxt('stock', 'proveedor.stock', 'Stock que dice el proveedor', p.proveedor.stock, 'ej. 300 unidades')}
    <label class="check"><input type="checkbox" data-pfc="fotosReales" ${p.fotosReales ? 'checked' : ''}> Ya tengo fotos reales</label>
  </div></section>

  <section class="card"><h2>Costeo</h2>
  ${tiene ? `<dl class="kv"><dt>Precio final</dt><dd>${money(+p.costeo.P)}</dd><dt>BREAKEVEN</dt><dd class="${Calc.semaforo(r.breakeven) === 'rojo' ? 'neg' : Calc.semaforo(r.breakeven) === 'verde' ? 'pos' : ''}">${money(r.breakeven)}</dd><dt>Utilidad por entregado</dt><dd class="${sgn(r.utilEnt)}">${money(r.utilEnt)}</dd><dt>Costos / precio</dt><dd>${pct(r.pct.costos)}</dd>${pc ? `<dt>Competencia más barata</dt><dd>${money(pc)}</dd>` : ''}</dl>` : '<p class="empty small">Sin costear todavía.</p>'}
  <button class="btn sec" style="width:100%;margin-top:12px" data-costeo="${p.id}">${tiene ? 'Abrir costeo' : 'Costear con la calculadora'}</button></section>

  ${p.etapa !== 'pauta' ? seccionPauta(p) : ''}
  </div>

  <div class="out">
  <section class="card resumen"><h2>Resumen</h2>
    <dl class="kv"><dt>Etapa</dt><dd>${nombreEtapa(p.etapa)} · ${dias(p.etapaDesde)} d</dd><dt>Costo</dt><dd>${+p.costeo.C ? money(+p.costeo.C) : '—'}</dd><dt>Precio final</dt><dd>${tiene ? money(+p.costeo.P) : '—'}</dd><dt>BREAKEVEN</dt><dd>${tiene ? money(r.breakeven) : '—'}</dd></dl>
    <button class="btn" style="width:100%;margin-top:14px" data-copiarprod="${p.id}">${ic('copy', 18)}Copiar para Claude</button>
    <div class="acts">${ant && p.etapa !== 'descartado' ? `<button class="btn sec" data-mover="${ant}">← ${nombreEtapa(ant)}</button>` : ''}${sig && p.etapa !== 'descartado' ? `<button class="btn sec" data-mover="${sig}">${nombreEtapa(sig)} →</button>` : ''}</div>
    ${p.etapa !== 'descartado' ? `<button class="lnk peligro" data-mover="descartado" style="margin-top:10px">Descartar producto</button>` : ''}
  </section>
  <section class="card"><h2>Pendientes del producto</h2>
    ${S.pendientes.filter(x => x.productoId === p.id && !x.hecho).map(filaPend).join('') || '<p class="empty small">Ninguno.</p>'}
    <form class="addp" id="addpp"><div class="inp grow"><input id="pp-txt" placeholder="Nuevo pendiente" required autocomplete="off"></div><button class="btn" aria-label="Agregar">${ic('plus', 20)}</button></form>
  </section>
  <section class="card"><h2>Decisiones</h2>
    <form class="addp" id="adddec"><div class="inp grow"><input id="dec-txt" placeholder="Qué se decidió y por qué" required autocomplete="off"></div><button class="btn" aria-label="Anotar">${ic('plus', 20)}</button></form>
    <ol class="decs">${p.decisiones.slice().reverse().map(d => `<li><small>${fechaCorta(d.fecha)}</small>${esc(d.texto)}</li>`).join('')}</ol>
  </section>
  <button class="lnk peligro" data-borrarprod="${p.id}">Borrar producto para siempre</button>
  </div></div>`;
}
function resumenProducto(p) {
  const L = [`Producto: ${p.nombre} (etapa ${nombreEtapa(p.etapa)}, ${dias(p.etapaDesde)} días en ella)`];
  if (p.proveedor.link) L.push(`Proveedor: ${p.proveedor.link}`);
  if (p.proveedor.stock) L.push(`Stock: ${p.proveedor.stock}`);
  if (p.competencia.length) L.push('Competencia: ' + p.competencia.map(c => `${c.link || 's/link'} ${c.precio ? money(+c.precio) : ''}${c.dias ? ` (${c.dias} días al aire)` : ''}`).join(' | '));
  if (p.angulo) L.push(`Ángulo: ${p.angulo}`);
  if (p.hooks.length) L.push('Hooks:\n' + p.hooks.map((h, k) => `${k + 1}. ${h}`).join('\n'));
  L.push(`Fotos reales: ${p.fotosReales ? 'sí' : 'no'}`);
  if (+p.costeo.C) L.push(resumenCosteo(p.costeo));
  if (p.pauta.lanzamiento) L.push(resumenPauta(p));
  if (p.notas) L.push(`Notas: ${p.notas}`);
  L.push('Decisiones:\n' + p.decisiones.map(d => `- ${fechaCorta(d.fecha)}: ${d.texto}`).join('\n'));
  const f = faltantes(p); if (f.length) L.push(`Falta para avanzar: ${f.join(', ')}`);
  L.push('\nPregunta: ');
  return L.join('\n');
}


// ---------- Pauta: registro diario y alertas ----------
let regFecha = hoyISO();
const breakevenDe = p => (+p.costeo.P && +p.costeo.C ? calcProd(p).breakeven : 0);
const ICONIV = { mal: '!', aviso: '!', bien: '✓', info: 'i' };
function filaAlerta(a, p, conNombre) {
  let btn = '';
  if (a.accion && a.accion.tipo === 'apagar') btn = `<button class="btn sec chico" data-alapagar="${a.accion.id}" data-p="${p.id}">Marcar apagado</button>`;
  if (a.accion && a.accion.tipo === 'subir') btn = `<button class="btn sec chico" data-alsubir="${a.accion.a}" data-p="${p.id}">Subir a ${money(a.accion.a)}</button>`;
  if (a.accion && a.accion.tipo === 'efectividad') btn = `<button class="btn sec chico" data-alefect="${p.id}">Usar la real</button>`;
  return `<div class="al ${a.nivel}"><span class="al-i">${ICONIV[a.nivel]}</span><div><p>${conNombre ? `<button class="lnk" data-ficha="${p.id}">${esc(p.nombre)}</button>: ` : ''}${esc(a.texto)}</p>${btn}</div></div>`;
}
function alertasHoy() {
  const ps = S.productos.filter(p => p.etapa === 'pauta' || (p.pauta.lanzamiento && p.etapa !== 'descartado'));
  if (!ps.length) return '<p class="empty">Ningún producto en pauta.</p>';
  const filas = ps.flatMap(p => Pauta.alertas(p, breakevenDe(p)).map(a => [a, p]));
  const orden = { mal: 0, aviso: 1, bien: 2, info: 3 };
  filas.sort((x, y) => orden[x[0].nivel] - orden[y[0].nivel]);
  return filas.map(([a, p]) => filaAlerta(a, p, true)).join('') || '<p class="empty">Todo en orden.</p>';
}
function seccionPauta(p) {
  const be = breakevenDe(p), t = Pauta.tiempo(p, Date.now()), m = Pauta.metricas(p);
  const al = Pauta.alertas(p, be);
  const reg = (p.pauta.registro[regFecha]) || {};
  const crs = p.pauta.creativos;
  const cpaCls = c => (!c.pedidos ? '' : be && c.cpa > be ? 'neg' : be && c.cpa <= be * 0.8 ? 'pos' : '');
  const er = Pauta.efectividadReal(p);
  const v = (id, k) => (reg[id] && reg[id][k] !== '' && reg[id][k] != null ? fmtIn(reg[id][k]) : '');
  return `<section class="card" id="pauta"><h2>Pauta${t.lanzado && t.dia ? ` · día ${t.dia}` : ''}</h2>
  <div class="grid">
    ${campoTxt('lanz', 'pauta.lanzamiento', 'Lanzamiento (fecha y hora)', p.pauta.lanzamiento, '', 'datetime-local')}
    ${campoTxt('pres', 'pauta.presupuesto', 'Presupuesto diario', p.pauta.presupuesto, '80.000', 'money')}
  </div>
  <p class="note">Estructura fija: una campaña, un conjunto, público amplio, 4–6 creativos con el mismo guion y distinto hook. Revisa métricas una vez al día.</p>
  ${al.length ? `<div class="als">${al.map(a => filaAlerta(a, p)).join('')}</div>` : ''}

  <h3 class="sub">Creativos <span class="mute">${crs.filter(c => c.estado !== 'apagado').length} activos</span></h3>
  ${crs.length ? `<div class="tw"><table class="tb"><thead><tr><th>Creativo</th><th>Gasto</th><th>CTR</th><th>Pedidos</th><th>CPA</th><th></th></tr></thead><tbody>
    ${m.creativos.map(c => `<tr class="${c.estado === 'apagado' ? 'off' : ''}"><td>${esc(c.nombre)}</td><td>${money(c.gasto)}</td><td class="${c.imp && c.ctr < Pauta.CTR_MIN ? 'neg' : ''}">${c.imp ? pct1(c.ctr) : '—'}</td><td>${c.pedidos}</td><td class="${cpaCls(c)}">${c.pedidos ? money(c.cpa) : '—'}</td><td><button class="lnk" data-crestado="${c.id}">${c.estado === 'apagado' ? 'Encender' : 'Apagar'}</button></td></tr>`).join('')}
    <tr class="tot"><td>Total</td><td>${money(m.total.gasto)}</td><td>${m.total.imp ? pct1(m.total.ctr) : '—'}</td><td>${m.total.pedidos}</td><td>${m.total.pedidos ? money(m.total.cpa) : '—'}</td><td></td></tr>
  </tbody></table></div>${be ? `<p class="note">CPA en verde: holgado (80% del techo o menos). En rojo: pasa el BREAKEVEN de ${money(be)}.</p>` : ''}`
  : `<p class="empty small">Sin creativos.</p>${p.hooks.length ? `<button class="btn sec" id="cargarhooks" style="width:100%">Usar los ${p.hooks.length} hooks como creativos</button>` : ''}`}
  <button class="addrow" id="addcr">${ic('plus', 18)}Agregar creativo</button>

  ${crs.length ? `<h3 class="sub">Registro del día</h3>
  <div class="row" style="margin-bottom:8px"><div class="f" style="max-width:220px"><label for="reg-fecha">Fecha</label><div class="inp"><input id="reg-fecha" type="date" value="${regFecha}" max="${hoyISO()}"></div></div></div>
  <div class="tw"><table class="tb reg"><thead><tr><th>Creativo</th><th>Gasto $</th><th>Impresiones</th><th>Clics</th><th>Pedidos</th></tr></thead><tbody>
  ${crs.map(c => `<tr class="${c.estado === 'apagado' ? 'off' : ''}"><td>${esc(c.nombre)}</td>${['gasto', 'imp', 'clics', 'pedidos'].map(k => `<td><input id="rg-${c.id}-${k}" data-reg="${c.id}|${k}" inputmode="numeric" value="${v(c.id, k)}" placeholder="0" aria-label="${k} de ${esc(c.nombre)}"></td>`).join('')}</tr>`).join('')}
  </tbody></table></div>
  <p class="note">Copia los números del Ads Manager para cada creativo en el día elegido. Se guarda solo.</p>` : ''}

  ${m.dias.length ? `<h3 class="sub">Historial por día</h3><div class="tw"><table class="tb"><thead><tr><th>Fecha</th><th>Gasto</th><th>CTR</th><th>Pedidos</th><th>CPA</th></tr></thead><tbody>
  ${m.dias.slice().reverse().map(d => `<tr><td><button class="lnk" data-regdia="${d.fecha}">${fechaCorta(d.fecha)}</button></td><td>${money(d.gasto)}</td><td>${d.imp ? pct1(d.ctr) : '—'}</td><td>${d.pedidos}</td><td class="${be && d.pedidos && d.cpa > be ? 'neg' : ''}">${d.pedidos ? money(d.cpa) : '—'}</td></tr>`).join('')}
  </tbody></table></div>` : ''}

  <h3 class="sub">Entregas reales</h3>
  <div class="grid">
    ${campoTxt('desp', 'pauta.entregas.despachados', 'Pedidos despachados', p.pauta.entregas.despachados, '0', 'number')}
    ${campoTxt('entr', 'pauta.entregas.entregados', 'Pedidos entregados', p.pauta.entregas.entregados, '0', 'number')}
  </div>
  <p class="note">${er != null ? `Efectividad real: <b>${pct1(er)}</b> · el costeo usa ${p.costeo.E}% (${p.costeo.real.E ? 'real' : 'supuesto'}). ${Math.abs(er * 100 - p.costeo.E) >= 1 || !p.costeo.real.E ? `<button class="lnk" data-alefect="${p.id}">Usar ${pct1(er)} en el costeo</button>` : ''}` : 'Con las primeras entregas, cambia la efectividad supuesta por la real.'}</p>

  <h3 class="sub">Antes de pasar de $150.000 al día</h3>
  <label class="check"><input type="checkbox" data-pfc="pauta.stockConfirmado" ${p.pauta.stockConfirmado ? 'checked' : ''}> Stock confirmado por escrito con el proveedor</label>
  <label class="check"><input type="checkbox" data-pfc="pauta.entregasConfirmadas" ${p.pauta.entregasConfirmadas ? 'checked' : ''}> Primeras entregas confirmadas</label>
  </section>`;
}
const pct1 = v => (Math.round(v * 1000) / 10).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
function resumenPauta(p) {
  const m = Pauta.metricas(p), t = Pauta.tiempo(p, Date.now()), be = breakevenDe(p), er = Pauta.efectividadReal(p);
  const L = [`Pauta: lanzada ${p.pauta.lanzamiento.replace('T', ' ')} (día ${t.dia}), presupuesto ${money(+p.pauta.presupuesto || 0)}/día${be ? `, techo ${money(be)}` : ''}`];
  if (m.creativos.length) L.push('Creativos (acumulado):\n' + m.creativos.map(c => `- ${c.nombre}${c.estado === 'apagado' ? ' [apagado]' : ''}: gasto ${money(c.gasto)}, CTR ${c.imp ? pct1(c.ctr) : '—'}, ${c.pedidos} pedidos, CPA ${c.pedidos ? money(c.cpa) : '—'}`).join('\n'));
  if (m.dias.length) L.push('Por día:\n' + m.dias.map(d => `- ${d.fecha}: gasto ${money(d.gasto)}, CTR ${d.imp ? pct1(d.ctr) : '—'}, ${d.pedidos} pedidos, CPA ${d.pedidos ? money(d.cpa) : '—'}`).join('\n'));
  if (er != null) L.push(`Entregas: ${p.pauta.entregas.entregados} de ${p.pauta.entregas.despachados} despachados (${pct1(er)})`);
  L.push(`Stock confirmado: ${p.pauta.stockConfirmado ? 'sí' : 'no'} · primeras entregas confirmadas: ${p.pauta.entregasConfirmadas ? 'sí' : 'no'}`);
  const al = Pauta.alertas(p, be); if (al.length) L.push('Alertas de la app:\n' + al.map(a => `- ${a.texto}`).join('\n'));
  return L.join('\n');
}
function decidir(p, texto) { p.decisiones.push({ fecha: new Date().toISOString(), texto }); }

// ---------- Calcular (suelta o del producto) ----------
const CUR = () => (S.view && S.view.costeo && prod(S.view.costeo) ? prod(S.view.costeo).costeo : S.calc);
const CAMPOS = [
  ['C', 'Precio proveedor', '$', 'money'], ['F', 'Flete base', '$', 'money', 'real'],
  ['E', 'Efectividad', '%', 'pct', 'real'], ['X', 'Cancelaciones', '%', 'pct', 'real'],
  ['CPA', 'CPA Ads', '$', 'money', 'real'], ['A', 'Administrativos', '$', 'money'],
  ['U', 'Fulfillment', '$', 'money'], ['I', 'Importe a gastar', '$', 'money'],
];
const TAGTXT = { F: ['estimado', 'cotizado'], E: ['supuesto', 'real'], X: ['supuesto', 'real'], CPA: ['esperado', 'real'] };
const inpCalc = c => ({ C: c.C, F: c.F, E: (+c.E || 0) / 100, X: (+c.X || 0) / 100, A: c.A, U: c.U, CPA: c.CPA, P: c.P, I: c.I });

function campo([k, label, u, tipo, tag], c) {
  const t = tag ? `<button class="tag ${c.real[k] ? 'real' : ''}" data-real="${k}" aria-pressed="${!!c.real[k]}" title="Tocar para cambiar">${TAGTXT[k][c.real[k] ? 1 : 0]}</button>` : '';
  return `<div class="f"><label for="in-${k}">${label}${t}</label><div class="inp">${u === '$' ? '<span>$</span>' : ''}<input id="in-${k}" data-k="${k}" inputmode="numeric" autocomplete="off" value="${esc(tipo === 'money' ? fmtIn(c[k]) : c[k])}" placeholder="0">${u === '%' ? '<span>%</span>' : ''}</div></div>`;
}
function vCalc() {
  const c = CUR(), p = S.view && S.view.costeo ? prod(S.view.costeo) : null;
  const fallas = Calc.autoprueba();
  const top = p ? `<header class="top"><button class="ib" data-ficha="${p.id}" aria-label="Volver a la ficha">${ic('back')}</button><h1>Costeo · ${esc(p.nombre)}</h1><span class="brand">zunk<b>o</b></span></header><p class="note" style="margin:-4px 0 12px">Se guarda solo en la ficha del producto.</p>`
    : header('Calculadora de precio') + (S.productos.length ? `<p class="note" style="margin:-4px 0 12px">Calculadora suelta. Para guardar el costeo de un producto, ábrelo desde su ficha. <button class="lnk" id="aprod">Pasar estos números a un producto</button></p>` : '');
  return top + `
  ${fallas.length ? `<div class="alerta" role="alert"><b>La calculadora no cuadra con el ejemplo de la hoja.</b> No confíes en estos números.<br>${fallas.map(esc).join('<br>')}</div>` : ''}
  <div class="cols fija"><div class="in">
  <section class="card"><h2>Entradas</h2><div class="grid">${CAMPOS.map(x => campo(x, c)).join('')}</div>
  <p class="note">Toca la etiqueta de un dato para marcarlo como real o como supuesto.</p></section>
  <section class="card"><h2>1 · Precio sugerido</h2><div class="chips" id="sug"></div>
  <div class="row" style="margin-top:10px"><div class="f"><label for="in-m">Margen propio</label><div class="inp"><input id="in-m" inputmode="numeric" value="${Math.round(c.m * 100)}"><span>%</span></div></div></div></section>
  <section class="card"><h2>2 · Precio final</h2><div class="row"><div class="f"><label for="in-P">Precio al que vas a vender</label><div class="inp"><span>$</span><input id="in-P" data-k="P" inputmode="numeric" value="${esc(fmtIn(c.P))}" placeholder="89.900"></div></div><button class="btn sec" id="redondear">Usar sugerido</button></div>
  <p class="note" id="nota-p"></p></section>
  </div><div class="out" id="res"></div></div>`;
}
function pintarResultados() {
  const c = CUR(), r = Calc.calcular(inpCalc(c));
  const sug = Calc.precioComercial(r.sugerido(c.m));
  $('#sug').innerHTML = [0.15, 0.2, 0.25].map(m => `<button class="chip" data-m="${m}" aria-pressed="${Math.abs(c.m - m) < 1e-9}"><small>${pct(m)} de margen</small><b>${money(r.sugerido(m))}</b></button>`).join('');
  $('#redondear').textContent = sug ? 'Usar ' + money(sug) : 'Usar sugerido';
  $('#redondear').disabled = !sug;
  const P = +c.P || 0;
  $('#nota-p').innerHTML = `Calculado con un CPA de <b>${money(+c.CPA || 0)}</b> (${TAGTXT.CPA[c.real.CPA ? 1 : 0]}).` + (P ? ` Margen real con este precio: <b class="${sgn(r.margenReal)}">${pct(r.margenReal)}</b>.` : '');
  if (!P || !(+c.C)) { $('#res').innerHTML = `<div class="card vacio" style="padding:24px 12px"><p>Llena el precio proveedor y el precio final para ver el BREAKEVEN.</p></div>`; return; }
  const sem = Calc.semaforo(r.breakeven);
  const msg = {
    rojo: 'Por debajo de $15.000 no aguanta pauta en Meta Colombia. Sube el precio o descártalo.',
    ambar: 'Justo en el rango del CPA de mercado ($15.000–20.000). Hay poco aire.',
    verde: 'Por encima de $20.000: hay espacio para pautar.',
  }[sem];
  const tope = Math.max(P, r.costos);
  const seg = [['Proveedor', +c.C, '--s1'], ['Flete con devoluciones', r.fleteDev, '--s2'], ['Admin. y fulfillment', (+c.A || 0) + (+c.U || 0), '--s3'], ['CPA real', r.cpaReal, '--s4']];
  if (r.utilEnt > 0) seg.push(['Utilidad', r.utilEnt, '--s5']);
  const peor = [seg[0], seg[1], seg[3]].sort((a, b) => b[1] - a[1])[0];
  const o = r.op;
  $('#res').innerHTML = `
  <section class="be ${sem}" aria-live="polite"><small>BREAKEVEN · CPA techo</small><strong>${money(r.breakeven)}</strong><p>${msg} Es lo máximo que puedes pagar por pedido en el Ads Manager sin perder plata.</p></section>
  <section class="card"><h2>3 · A dónde se va el precio</h2>
  <div class="bar" role="img" aria-label="Reparto del precio">${seg.filter(s => s[1] > 0).map(s => `<i style="width:${s[1] / tope * 100}%;background:var(${s[2]})"></i>`).join('')}${r.costos > P ? `<span class="cien" style="left:${P / tope * 100}%"></span>` : ''}</div>
  <ul class="leg">${seg.filter(s => s[1] > 0 || s[0] !== 'Admin. y fulfillment').map(s => `<li><span class="d" style="background:var(${s[2]})"></span><span>${s[0]}</span><b>${money(s[1])}</b><em>${pct(s[1] / P)}</em></li>`).join('')}
  <li><span class="d"></span><span><b>Costos totales</b></span><b class="${r.costos > P ? 'neg' : ''}">${money(r.costos)}</b><em>${pct(r.pct.costos)}</em></li></ul>
  <p class="note">${r.costos > P ? `Los costos pasan del 100% del precio: <b>a este CPA pierdes plata en cada entrega</b>. ` : ''}El que más pesa es <b>${peor[0].toLowerCase()}</b> (${pct(peor[1] / P)} del precio).</p></section>
  <section class="card"><h2>4 · Por pedido</h2><dl class="kv">
  <dt>Utilidad por entregado</dt><dd class="${sgn(r.utilEnt)}">${money(r.utilEnt)}</dd>
  <dt>Utilidad por pedido en Shopify</dt><dd class="${sgn(r.utilTom)}">${money(r.utilTom)}</dd>
  <dt>ROAS neto real</dt><dd class="${sgn(r.roasNeto)}">${dec(r.roasNeto)}</dd>
  <dt>Precio de comparación (tachado)</dt><dd>${money(r.comparacion)}</dd>
  <dt>Ahorro que se muestra</dt><dd>${money(r.ahorro)}</dd>
  <dt>Factor (entregas × confirmados)</dt><dd>${pct(r.factor)}</dd></dl></section>
  <section class="card"><h2>5 · Si gastas ${money(+c.I || 0)}</h2><dl class="kv">
  <dt>Pedidos totales</dt><dd>${dec(o.pedidos, 1)}</dd><dt>Despachados</dt><dd>${dec(o.desp, 1)}</dd><dt>Entregados</dt><dd>${dec(o.ent, 1)}</dd>
  <dt>Facturación</dt><dd>${money(o.facturacion)}</dd><dt>Valor entregado (ingreso real)</dt><dd>${money(o.valEnt)}</dd>
  <dt>CPA real por entregado</dt><dd>${money(o.cpaReal)} · ${pct(o.cpaRealPct)}</dd>
  <dt>Utilidad neta</dt><dd class="${sgn(o.utilNeta)}">${money(o.utilNeta)}</dd><dt>ROAS neto real</dt><dd class="${sgn(o.roasNeto)}">${dec(o.roasNeto)}</dd></dl></section>
  <button class="btn sec" id="copiar" style="width:100%;margin-bottom:12px">${ic('copy', 18)}Copiar resumen para Claude</button>`;
}
function resumenCosteo(c) {
  const r = Calc.calcular(inpCalc(c)), t = k => (c.real[k] ? 'real' : 'supuesto');
  return [
    'Costeo (Calculadora 2026):',
    `Proveedor ${money(+c.C)} · Flete ${money(+c.F)} (${c.real.F ? 'cotizado' : 'estimado'}) · Efectividad ${c.E}% (${t('E')}) · Cancelaciones ${c.X}% (${t('X')}) · CPA ${money(+c.CPA)} (${c.real.CPA ? 'real' : 'esperado'}) · Admin ${money(+c.A)} · Fulfillment ${money(+c.U)}`,
    +c.P ? `Precio final ${money(+c.P)} · tachado ${money(r.comparacion)} · margen real ${pct(r.margenReal)}` : 'Sin precio final',
    +c.P ? `BREAKEVEN ${money(r.breakeven)} · utilidad x entregado ${money(r.utilEnt)} · x pedido Shopify ${money(r.utilTom)}` : '',
    +c.P ? `% del precio: proveedor ${pct(r.pct.C)}, flete c/dev ${pct(r.pct.fleteDev)}, CPA real ${pct(r.pct.cpaReal)}, costos ${pct(r.pct.costos)}` : '',
    +c.P ? `Con ${money(+c.I)}: ${dec(r.op.ent, 1)} entregados, utilidad neta ${money(r.op.utilNeta)}, ROAS neto ${dec(r.op.roasNeto)}` : '',
  ].filter(Boolean).join('\n');
}

// ---------- Ajustes ----------
function vAjustes() {
  const a = S.ajustes;
  const f = (k, l, u) => `<div class="f"><label for="aj-${k}">${l}</label><div class="inp">${u === '$' ? '<span>$</span>' : ''}<input id="aj-${k}" data-aj="${k}" inputmode="numeric" value="${esc(u === '$' ? fmtIn(a[k]) : a[k])}">${u === '%' ? '<span>%</span>' : ''}</div></div>`;
  return header('Ajustes') + `<div class="cols"><div class="in">
  <section class="card"><h2>Supuestos por defecto</h2><div class="grid">
  ${f('E', 'Efectividad', '%')}${f('X', 'Cancelaciones', '%')}${f('CPA', 'CPA esperado', '$')}${f('I', 'Importe a proyectar', '$')}${f('A', 'Administrativos', '$')}${f('U', 'Fulfillment', '$')}</div>
  <p class="note">Efectividad 70% mientras no haya entregas propias (el curso usa 80%, optimista para un lanzamiento). Corrígela con datos reales a la semana de pautar. Los productos nuevos arrancan con estos supuestos.</p>
  <button class="btn sec" id="aplicar" style="width:100%;margin-top:12px">Llevar estos supuestos a la calculadora suelta</button></section>
  </div><div class="out">
  <section class="card"><h2>Copia de seguridad</h2>
  <p class="note" style="margin:0 0 12px">Tus datos viven solo en este navegador de este PC. Descarga una copia cada semana y guárdala en Drive. Sirve también para pasar todo a otro equipo.</p>
  <p class="note" style="margin:0 0 12px">${S.productos.length} productos · ${S.pendientes.length} pendientes${S.ultimaCopia ? ` · última copia ${fechaCorta(S.ultimaCopia)}` : ' · nunca has descargado una copia'}</p>
  <div class="acts"><button class="btn" id="bk-down">Descargar copia</button><button class="btn sec" id="bk-up">Restaurar copia</button></div>
  <input type="file" id="bk-file" accept="application/json,.json" hidden></section>
  </div></div>`;
}
function vPronto() {
  return header('Crear') + `<div class="card vacio"><h2>En construcción</h2><p>Plantillas de creativos y generador de landings.</p></div>`;
}
function descargarCopia() {
  S.ultimaCopia = new Date().toISOString(); save();
  const data = JSON.stringify({ app: 'zunko-mando', version: 1, fecha: S.ultimaCopia, datos: { ajustes: S.ajustes, calc: S.calc, productos: S.productos, pendientes: S.pendientes } }, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = `zunko-copia-${hoyISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  render(); toast('Copia descargada');
}
async function restaurar(file) {
  let j;
  try { j = JSON.parse(await file.text()); } catch (e) { toast('Ese archivo no es una copia válida'); return; }
  if (!j || j.app !== 'zunko-mando' || !j.datos || !Array.isArray(j.datos.productos)) { toast('Ese archivo no es una copia del Centro de mando'); return; }
  const r = await pedir({ titulo: 'Restaurar copia', texto: `La copia es del ${fechaCorta(j.fecha)} y trae ${j.datos.productos.length} productos y ${(j.datos.pendientes || []).length} pendientes. <b>Reemplaza todo lo que hay ahora en este navegador.</b>`, ok: 'Reemplazar', peligro: true });
  if (!r) return;
  S = Object.assign(S, { ajustes: Object.assign({}, DEF, j.datos.ajustes), calc: j.datos.calc || costeoNuevo(DEF), productos: j.datos.productos, pendientes: j.datos.pendientes || [], view: null });
  save(); S = load(); render(); toast('Copia restaurada');
}

// ---------- eventos ----------
function setPath(o, path, v) { const k = path.split('.'); const last = k.pop(); k.reduce((a, x) => a[x], o)[last] = v; }

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || b.closest('#dlg')) return;
  const d = b.dataset;
  if (d.tab) { ir(d.tab); return; }
  if (d.ficha) { ir('prod', { ficha: d.ficha }); return; }
  if (d.costeo) { ir('prod', { costeo: d.costeo }); return; }
  if (b.id === 'nuevo') {
    const r = await pedir({ titulo: 'Nuevo producto', campos: [{ k: 'n', label: 'Nombre', required: true }, { k: 'l', label: 'Link del proveedor (opcional)', type: 'url' }, { k: 'c', label: 'Costo proveedor (opcional)', type: 'money' }], ok: 'Agregar al radar' });
    if (!r) return;
    const p = nuevoProducto(r.n, r.l, r.c); save(); ir('prod', { ficha: p.id }); return;
  }
  if (d.mover) { const p = prod(S.view.ficha); if (p) moverEtapa(p, d.mover); return; }
  if (b.id === 'addcomp') {
    const r = await pedir({ titulo: 'Agregar competidor', campos: [{ k: 'l', label: 'Link del anuncio o la tienda', type: 'url' }, { k: 'p', label: 'Precio que cobra', type: 'money' }, { k: 'd', label: 'Días al aire del anuncio', type: 'number' }], ok: 'Agregar' });
    if (!r) return;
    const p = prod(S.view.ficha); p.competencia.push({ link: r.l, precio: r.p, dias: r.d }); save(); render(); return;
  }
  if (d.delcomp != null) { const p = prod(S.view.ficha); p.competencia.splice(+d.delcomp, 1); save(); render(); return; }
  if (d.delhook != null) { const p = prod(S.view.ficha); p.hooks.splice(+d.delhook, 1); save(); render(); return; }
  if (d.copiarprod) { copiar(resumenProducto(prod(d.copiarprod)), 'Resumen copiado: pégalo en Claude'); return; }
  if (d.borrarprod) {
    const p = prod(d.borrarprod);
    const r = await pedir({ titulo: `Borrar ${p.nombre}`, texto: 'Se borra el producto con su costeo, hooks y decisiones. No se puede deshacer. Si solo no te sirve, mejor descártalo.', ok: 'Borrar', peligro: true });
    if (!r) return;
    S.productos = S.productos.filter(x => x.id !== p.id);
    S.pendientes.forEach(x => { if (x.productoId === p.id) x.productoId = ''; });
    save(); ir('prod'); toast('Producto borrado'); return;
  }
  if (d.alapagar || d.crestado) {
    const p = prod(d.p || S.view.ficha), c = p.pauta.creativos.find(x => x.id === (d.alapagar || d.crestado));
    c.estado = d.alapagar ? 'apagado' : c.estado === 'apagado' ? 'activo' : 'apagado';
    decidir(p, `Creativo «${c.nombre}» ${c.estado === 'apagado' ? 'apagado' : 'encendido'}.`); save(); render(); toast('Creativo ' + (c.estado === 'apagado' ? 'apagado' : 'encendido')); return;
  }
  if (d.alsubir) {
    const p = prod(d.p), a = +d.alsubir, antes = +p.pauta.presupuesto || 0;
    if (a > Pauta.TOPE_ESCALA && !Pauta.puedeEscalar(p)) { toast('Primero confirma stock y primeras entregas'); return; }
    p.pauta.presupuesto = a; p.pauta.ultimaSubida = hoyISO(); decidir(p, `Presupuesto de ${money(antes)} a ${money(a)} al día.`); save(); render(); toast('Presupuesto actualizado: súbelo igual en el Ads Manager'); return;
  }
  if (d.alefect) {
    const p = prod(d.alefect), er = Pauta.efectividadReal(p); if (er == null) return;
    const antes = p.costeo.E; p.costeo.E = Math.round(er * 100); p.costeo.real.E = true;
    decidir(p, `Efectividad del costeo de ${antes}% a ${p.costeo.E}% (real).${+p.costeo.P ? ` BREAKEVEN ahora ${money(calcProd(p).breakeven)}.` : ''}`); save(); render(); toast('Costeo recalculado con la efectividad real'); return;
  }
  if (d.regdia) { regFecha = d.regdia; render(); const el = $('#reg-fecha'); if (el) el.scrollIntoView({ block: 'center' }); return; }
  if (b.id === 'cargarhooks') { const p = prod(S.view.ficha); p.pauta.creativos = p.hooks.map(h => ({ id: uid(), nombre: h, estado: 'activo' })); save(); render(); return; }
  if (b.id === 'addcr') {
    const r = await pedir({ titulo: 'Agregar creativo', campos: [{ k: 'n', label: 'Nombre o hook del creativo', required: true }], ok: 'Agregar' });
    if (!r) return; const p = prod(S.view.ficha); p.pauta.creativos.push({ id: uid(), nombre: r.n, estado: 'activo' }); save(); render(); return;
  }
  if (d.delpend) { S.pendientes = S.pendientes.filter(x => x.id !== d.delpend); save(); render(); return; }
  if (d.real) { const c = CUR(), k = d.real; c.real[k] = !c.real[k]; save(); b.classList.toggle('real', c.real[k]); b.setAttribute('aria-pressed', c.real[k]); b.textContent = TAGTXT[k][c.real[k] ? 1 : 0]; pintarResultados(); return; }
  if (d.m) { const c = CUR(); c.m = +d.m; $('#in-m').value = Math.round(c.m * 100); save(); pintarResultados(); return; }
  if (b.id === 'redondear') { const c = CUR(), r = Calc.calcular(Object.assign(inpCalc(c), { P: 0 })); c.P = Calc.precioComercial(r.sugerido(c.m)); $('#in-P').value = fmtIn(c.P); save(); pintarResultados(); return; }
  if (b.id === 'copiar') { copiar(resumenCosteo(CUR()), 'Resumen copiado'); return; }
  if (b.id === 'aprod') {
    const r = await pedir({ titulo: 'Pasar a un producto', texto: 'Reemplaza el costeo guardado de ese producto con los números de la calculadora suelta.', campos: [{ k: 'p', label: 'Producto', type: 'select', value: S.productos[0].id, options: S.productos.map(p => [p.id, p.nombre]) }], ok: 'Pasar' });
    if (!r) return;
    const p = prod(r.p); p.costeo = JSON.parse(JSON.stringify(S.calc)); p.decisiones.push({ fecha: new Date().toISOString(), texto: 'Costeo actualizado desde la calculadora.' });
    save(); ir('prod', { costeo: p.id }); toast('Costeo guardado en ' + p.nombre); return;
  }
  if (b.id === 'aplicar') { const a = S.ajustes; Object.assign(S.calc, { E: a.E, X: a.X, CPA: a.CPA, A: a.A, U: a.U, I: a.I }); S.calc.real = {}; save(); toast('Supuestos aplicados'); return; }
  if (b.id === 'bk-down') { descargarCopia(); return; }
  if (b.id === 'bk-up') { $('#bk-file').click(); return; }
});

document.addEventListener('submit', e => {
  const f = e.target; if (f.closest('#dlg')) return;
  e.preventDefault();
  if (f.id === 'addp') {
    S.pendientes.push({ id: uid(), texto: $('#p-txt').value.trim(), fecha: $('#p-fecha').value, productoId: $('#p-prod').value, hecho: false });
    save(); render(); $('#p-txt').focus(); return;
  }
  const p = S.view && S.view.ficha && prod(S.view.ficha); if (!p) return;
  if (f.id === 'addhook') { p.hooks.push($('#hook-txt').value.trim()); save(); render(); $('#hook-txt').focus(); return; }
  if (f.id === 'addpp') { S.pendientes.push({ id: uid(), texto: $('#pp-txt').value.trim(), fecha: hoyISO(), productoId: p.id, hecho: false }); save(); render(); return; }
  if (f.id === 'adddec') { p.decisiones.push({ fecha: new Date().toISOString(), texto: $('#dec-txt').value.trim() }); save(); render(); $('#dec-txt').focus(); return; }
});

document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.pend) { const x = S.pendientes.find(y => y.id === el.dataset.pend); x.hecho = el.checked; x.hechoEn = el.checked ? new Date().toISOString() : ''; save(); setTimeout(render, 250); return; }
  if (el.dataset.pfc) { setPath(prod(S.view.ficha), el.dataset.pfc, el.checked); save(); renderKeep(); return; }
  if (el.id === 'reg-fecha') { regFecha = el.value || hoyISO(); render(); return; }
  if (el.id === 'bk-file' && el.files[0]) { restaurar(el.files[0]); el.value = ''; return; }
  // Al salir de un campo de la ficha se refrescan avisos, métricas y resumen, pero solo cuando el
  // foco ya no está en otra casilla: así nunca se redibuja mientras se escribe.
  if (el.dataset.pf || el.dataset.reg) { renderPendiente = true; setTimeout(refrescarSiLibre, 0); }
});
let renderPendiente = false;
function refrescarSiLibre() {
  if (!renderPendiente) return;
  const a = document.activeElement;
  if (a && a.matches('#app input:not([type=checkbox]), #app textarea, #app select')) return;
  renderKeep();
}
document.addEventListener('focusout', () => setTimeout(refrescarSiLibre, 0));
function renderKeep() {
  const id = document.activeElement && document.activeElement.id;
  render();
  const el = id && document.getElementById(id); if (el) el.focus({ preventScroll: true });
}

document.addEventListener('input', e => {
  const el = e.target; if (el.closest('#dlg')) return;
  if (el.dataset.pf) {
    const p = prod(S.view.ficha);
    if (el.dataset.money != null) { const v = parse(el.value); el.value = fmtIn(v); setPath(p, el.dataset.pf, v); }
    else setPath(p, el.dataset.pf, el.value);
    if (el.dataset.pf === 'nombre' && !el.value.trim()) return; // no guarda nombre vacío
    save(); return;
  }
  if (el.dataset.reg) {
    const p = prod(S.view.ficha), [id, k] = el.dataset.reg.split('|'), v = parse(el.value);
    el.value = fmtIn(v);
    const dia = p.pauta.registro[regFecha] = p.pauta.registro[regFecha] || {};
    const fila = dia[id] = dia[id] || {};
    fila[k] = v;
    if (Object.values(fila).every(x => x === '' || x == null)) delete dia[id];
    if (!Object.keys(dia).length) delete p.pauta.registro[regFecha];
    save(); return;
  }
  if (el.dataset.k) {
    const c = CUR(), k = el.dataset.k, isPct = k === 'E' || k === 'X';
    let v = parse(el.value);
    if (isPct && v !== '') v = Math.min(v, 100);
    c[k] = v;
    if (!isPct) { const atEnd = el.selectionStart === el.value.length; el.value = fmtIn(v); if (atEnd) el.setSelectionRange(el.value.length, el.value.length); }
    else el.value = v;
    save(); pintarResultados();
  } else if (el.id === 'in-m') {
    const c = CUR(), v = parse(el.value); c.m = v === '' ? 0 : Math.min(v, 95) / 100; save(); pintarResultados();
  } else if (el.dataset.aj) {
    const k = el.dataset.aj, isPct = k === 'E' || k === 'X';
    let v = parse(el.value); if (v === '') v = 0; if (isPct) v = Math.min(v, 100);
    S.ajustes[k] = v; if (!isPct) el.value = fmtIn(v); save();
  }
});

// Arrastrar tarjetas entre columnas (computador)
let arrastrando = null;
document.addEventListener('dragstart', e => { const t = e.target.closest('[data-drag]'); if (!t) return; arrastrando = t.dataset.drag; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrastrando); t.classList.add('drag'); });
document.addEventListener('dragend', e => { const t = e.target.closest('[data-drag]'); if (t) t.classList.remove('drag'); document.querySelectorAll('.colk.sobre').forEach(x => x.classList.remove('sobre')); });
document.addEventListener('dragover', e => { const c = e.target.closest('[data-drop]'); if (!c || !arrastrando) return; e.preventDefault(); document.querySelectorAll('.colk.sobre').forEach(x => x !== c && x.classList.remove('sobre')); c.classList.add('sobre'); });
document.addEventListener('drop', e => {
  const c = e.target.closest('[data-drop]'); if (!c || !arrastrando) return;
  e.preventDefault(); const p = prod(arrastrando); arrastrando = null;
  c.classList.remove('sobre'); if (p) moverEtapa(p, c.dataset.drop);
});

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
