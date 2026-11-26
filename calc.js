// Calculadora de Precio 2026 (curso). Fórmulas celda por celda.
// Entradas: C costo proveedor, F flete base, E efectividad (0-1), X cancelaciones (0-1),
// A administrativos, U fulfillment, CPA del Ads Manager, P precio de venta, I importe a gastar.
(function (root) {
  function calcular(i) {
    const C = +i.C || 0, F = +i.F || 0, E = +i.E || 0, X = +i.X || 0;
    const A = +i.A || 0, U = +i.U || 0, CPA = +i.CPA || 0, P = +i.P || 0, I = +i.I || 0;
    const factor = E * (1 - X);
    const fleteDev = E ? F / E : 0;
    const cpaReal = factor ? CPA / factor : 0;
    const costos = C + fleteDev + A + U + cpaReal;
    const utilEnt = P - costos;
    const utilTom = utilEnt * factor;
    const breakeven = (P - C - fleteDev - A - U) * factor;
    const pct = v => (P ? v / P : 0);
    const r = {
      factor, fleteDev, cpaReal, costos, utilEnt, utilTom, breakeven,
      comparacion: P / 0.7,
      ahorro: P / 0.7 - P,
      roasNeto: cpaReal ? utilEnt / cpaReal : 0,
      margenReal: P ? 1 - costos / P : 0,
      pct: { C: pct(C), fleteDev: pct(fleteDev), AU: pct(A + U), cpaReal: pct(cpaReal), costos: pct(costos), utilEnt: pct(utilEnt) },
      sugerido: m => (m < 1 ? costos / (1 - m) : Infinity),
    };
    const pedidos = CPA ? I / CPA : 0;
    const desp = pedidos * (1 - X);
    const ent = desp * E;
    r.op = {
      pedidos, desp, ent,
      facturacion: pedidos * P,
      valDesp: desp * P,
      valEnt: ent * P,
      cpaReal: ent ? I / ent : 0,
      cpaRealPct: ent * P ? I / (ent * P) : 0,
      utilNeta: ent * utilEnt,
      roasNeto: I ? (ent * utilEnt) / I : 0,
    };
    return r;
  }

  // Redondea hacia arriba a un precio comercial terminado en 9.900 (93.750 -> 99.900).
  function precioComercial(v) {
    if (!isFinite(v) || v <= 0) return 0;
    return Math.ceil((v + 100) / 10000) * 10000 - 100;
  }

  // Semáforo del BREAKEVEN según el CPA sostenible en Meta Colombia.
  function semaforo(be) {
    if (be < 15000) return 'rojo';
    if (be < 20000) return 'ambar';
    return 'verde';
  }

  // Ejemplo de control que trae la hoja. Devuelve la lista de diferencias (vacía = todo bien).
  const CONTROL = { C: 40000, F: 18000, E: 0.8, X: 0.2, A: 0, U: 0, CPA: 20000, P: 90000, I: 400000 };
  function autoprueba() {
    const r = calcular(CONTROL);
    const esperado = [
      ['Flete con devoluciones', r.fleteDev, 22500], ['CPA real', r.cpaReal, 31250],
      ['Costos totales', r.costos, 93750], ['Utilidad x entregado', r.utilEnt, -3750],
      ['Utilidad x tomado', r.utilTom, -2400], ['BREAKEVEN', r.breakeven, 17600],
      ['Precio de comparación', Math.round(r.comparacion), 128571], ['Pedidos', r.op.pedidos, 20],
      ['Despachados', r.op.desp, 16], ['Entregados', r.op.ent, 12.8],
      ['Utilidad neta', r.op.utilNeta, -48000], ['ROAS neto', r.op.roasNeto, -0.12],
    ];
    return esperado.filter(([, v, e]) => Math.abs(v - e) > 1e-6).map(([n, v, e]) => `${n}: da ${v}, debía dar ${e}`);
  }

  const api = { calcular, precioComercial, semaforo, autoprueba, CONTROL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calc = api;
})(this);
