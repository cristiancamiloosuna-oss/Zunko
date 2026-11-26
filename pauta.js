// Reglas de la pauta de prueba COD (estructura fija Zunko). Sin pantallas: solo cálculo, para poder probarlo.
// p.pauta = { lanzamiento, presupuesto, stockConfirmado, entregasConfirmadas,
//             creativos:[{id, nombre, estado:'activo'|'apagado'}],
//             registro:{ 'AAAA-MM-DD': { idCreativo: {gasto, imp, clics, pedidos} } },
//             entregas:{despachados, entregados} }
(function (root) {
  const HORA = 36e5, DIA = 864e5;
  const CTR_MIN = 0.015, TOPE_ESCALA = 150000, HOLGURA = 0.8;
  const isoLocal = t => new Date(t).toLocaleDateString('en-CA');

  function tiempo(p, ahora) {
    const L = p.pauta.lanzamiento ? new Date(p.pauta.lanzamiento).getTime() : NaN;
    if (!isFinite(L)) return { lanzado: false, horas: 0, dia: 0 };
    const horas = (ahora - L) / HORA;
    return { lanzado: true, horas, dia: horas < 0 ? 0 : Math.floor(horas / 24) + 1 };
  }

  // Suma por creativo de todo el registro, más totales y una fila por día.
  function metricas(p) {
    const reg = p.pauta.registro || {}, cr = {};
    (p.pauta.creativos || []).forEach(c => { cr[c.id] = { id: c.id, nombre: c.nombre, estado: c.estado, gasto: 0, imp: 0, clics: 0, pedidos: 0 }; });
    const total = { gasto: 0, imp: 0, clics: 0, pedidos: 0 };
    const dias = Object.keys(reg).sort().map(fecha => {
      const d = { fecha, gasto: 0, imp: 0, clics: 0, pedidos: 0 };
      Object.entries(reg[fecha]).forEach(([id, v]) => {
        ['gasto', 'imp', 'clics', 'pedidos'].forEach(k => {
          const n = +v[k] || 0; d[k] += n; total[k] += n; if (cr[id]) cr[id][k] += n;
        });
      });
      return fin(d);
    });
    return { creativos: Object.values(cr).map(fin), total: fin(total), dias };
  }
  function fin(o) { o.ctr = o.imp ? o.clics / o.imp : 0; o.cpa = o.pedidos ? o.gasto / o.pedidos : 0; return o; }

  // Subida diaria máxima de 20–30 %, redondeada a miles.
  function subida(pres) {
    return [Math.ceil(pres * 1.2 / 1000) * 1000, Math.floor(pres * 1.3 / 1000) * 1000];
  }
  const puedeEscalar = p => !!(p.pauta.stockConfirmado && p.pauta.entregasConfirmadas);
  const efectividadReal = p => {
    const e = p.pauta.entregas || {}; const d = +e.despachados || 0, n = +e.entregados || 0;
    return d ? Math.min(1, n / d) : null;
  };

  // Alertas en orden de importancia. nivel: 'mal' | 'aviso' | 'bien' | 'info'.
  // accion opcional: {tipo:'apagar', id} | {tipo:'subir', a} | {tipo:'efectividad'}
  function alertas(p, breakeven, ahora = Date.now()) {
    const out = [], t = tiempo(p, ahora), money = v => '$' + Math.round(v).toLocaleString('es-CO');
    const pctTxt = v => (Math.round(v * 1000) / 10).toLocaleString('es-CO') + '%';
    if (!t.lanzado) {
      if (p.etapa === 'pauta') out.push({ nivel: 'aviso', texto: 'Pon la fecha y hora de lanzamiento para activar las alertas de pauta.' });
      return out;
    }
    if (t.horas < 0) { out.push({ nivel: 'info', texto: `Lanza el ${new Date(p.pauta.lanzamiento).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}. Una campaña, un conjunto, público amplio, 4–6 creativos.` }); return out; }
    if (!(breakeven > 0)) out.push({ nivel: 'aviso', texto: 'Sin costeo con precio final: no hay BREAKEVEN contra qué comparar el CPA.' });

    const m = metricas(p);
    const activos = m.creativos.filter(c => c.estado !== 'apagado');
    const conDatos = activos.filter(c => c.imp > 0);
    const presu = +p.pauta.presupuesto || 0;

    if (t.horas < 48) out.push({ nivel: 'info', texto: `No toques nada: faltan ${Math.ceil(48 - t.horas)} h para cumplir las 48 h. Cualquier cambio reinicia el aprendizaje.` });

    const fechas = Object.keys(p.pauta.registro || {}).filter(f => Object.keys(p.pauta.registro[f]).length).sort();
    const ultima = fechas[fechas.length - 1], ayer = isoLocal(ahora - DIA);
    if (t.horas >= 24 && (!ultima || ultima < ayer)) out.push({ nivel: 'aviso', texto: ultima ? `Falta el registro: el último es del ${ultima}. Anota las métricas una vez al día.` : 'Todavía no hay registro de métricas. Anótalas una vez al día, con todo junto.' });

    if (t.dia <= 2 && conDatos.length && conDatos.every(c => c.ctr < CTR_MIN)) {
      const mejor = conDatos.reduce((a, b) => (b.ctr > a.ctr ? b : a));
      out.push({ nivel: 'mal', texto: `Ningún creativo pasa de 1,5% de CTR (el mejor, «${mejor.nombre}», va en ${pctTxt(mejor.ctr)}). El problema es el hook: graba otros antes de seguir gastando.` });
    }
    if (t.dia === 2) out.push({ nivel: 'info', texto: 'Día 2: anota el costo por pedido de cada creativo, pero no apagues nada todavía. Faltan datos.' });

    let apagar = [];
    if (t.dia >= 3 && breakeven > 0) {
      apagar = activos.filter(c => (c.pedidos > 0 && c.cpa > breakeven) || (c.pedidos === 0 && c.gasto > breakeven));
      apagar.forEach(c => out.push({
        nivel: 'mal', accion: { tipo: 'apagar', id: c.id },
        texto: `Día ${t.dia}: apaga «${c.nombre}». ${c.pedidos ? `Su CPA es ${money(c.cpa)}` : `Gastó ${money(c.gasto)} sin pedidos`} y el techo es ${money(breakeven)}.`,
      }));
    }
    if (t.dia >= 4 && breakeven > 0) {
      const ganadores = activos.filter(c => c.pedidos > 0 && c.cpa <= breakeven * HOLGURA).sort((a, b) => a.cpa - b.cpa);
      if (ganadores.length && presu && p.pauta.ultimaSubida === isoLocal(ahora)) {
        out.push({ nivel: 'info', texto: `Ya subiste el presupuesto hoy a ${money(presu)}. La próxima subida, como pronto mañana, con los datos del día.` });
      } else if (ganadores.length && presu) {
        const [a, b] = subida(presu), g = ganadores[0];
        if (a > TOPE_ESCALA && !puedeEscalar(p)) {
          out.push({ nivel: 'mal', texto: `«${g.nombre}» va holgado (CPA ${money(g.cpa)}), pero subir pasaría de ${money(TOPE_ESCALA)} al día. Antes confirma por escrito el stock con el proveedor y las primeras entregas (casillas de abajo).` });
        } else {
          out.push({ nivel: 'bien', accion: { tipo: 'subir', a }, texto: `Día ${t.dia}: «${g.nombre}» va holgado (CPA ${money(g.cpa)} contra techo ${money(breakeven)}). Sube máximo 20–30%: de ${money(presu)} a ${money(a)}–${money(b)}.` });
        }
      }
    }
    if (t.dia >= 3 && breakeven > 0 && !apagar.length && !out.some(x => x.nivel === 'bien') && conDatos.length) {
      out.push({ nivel: 'info', texto: `Día ${t.dia}: ningún creativo supera el techo de ${money(breakeven)}. Sigue observando una vez al día.` });
    }
    if (presu >= TOPE_ESCALA && !puedeEscalar(p)) out.push({ nivel: 'mal', texto: `Ya estás en ${money(presu)} al día sin confirmar stock por escrito y primeras entregas. Confírmalos antes de seguir subiendo.` });
    const er = efectividadReal(p);
    if (er != null && !(p.costeo.real && p.costeo.real.E) && Math.abs(er * 100 - (+p.costeo.E || 0)) >= 1) {
      out.push({ nivel: 'aviso', accion: { tipo: 'efectividad' }, texto: `La efectividad real va en ${pctTxt(er)} y el costeo usa ${p.costeo.E}% supuesto. Actualízala para recalcular el BREAKEVEN.` });
    } else if (t.dia >= 7 && er == null) {
      out.push({ nivel: 'aviso', texto: 'Ya va una semana: anota despachados y entregados para cambiar la efectividad supuesta por la real.' });
    }
    return out;
  }

  const api = { tiempo, metricas, alertas, subida, puedeEscalar, efectividadReal, CTR_MIN, TOPE_ESCALA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Pauta = api;
})(this);
