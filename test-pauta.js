// Prueba de las reglas de pauta: node test-pauta.js
const assert = require('assert');
const P = require('./pauta.js');
const H = 36e5;
const ahora = new Date('2026-12-10T20:00:00').getTime();
const iso = t => new Date(t).toLocaleDateString('en-CA');

function prod(horas, registro = {}, extra = {}) {
  return {
    etapa: 'pauta', costeo: { E: 70, real: {} },
    pauta: Object.assign({
      lanzamiento: new Date(ahora - horas * H).toISOString(), presupuesto: 80000,
      creativos: [{ id: 'a', nombre: 'Hook A', estado: 'activo' }, { id: 'b', nombre: 'Hook B', estado: 'activo' }, { id: 'c', nombre: 'Hook C', estado: 'activo' }],
      registro, entregas: {},
    }, extra),
  };
}
const txt = l => l.map(a => a.nivel + ': ' + a.texto).join('\n');

// Sin lanzamiento
assert.match(txt(P.alertas({ etapa: 'pauta', costeo: {}, pauta: { lanzamiento: '' } }, 30000, ahora)), /fecha y hora de lanzamiento/);

// 10 h: no tocar y sin alerta de registro todavía
let a = P.alertas(prod(10), 30000, ahora);
assert.match(txt(a), /faltan 38 h/);
assert.doesNotMatch(txt(a), /Falta el registro|Todavía no hay registro/);

// Día 1 con CTR bajo en todos
a = P.alertas(prod(20, { [iso(ahora)]: { a: { gasto: 30000, imp: 5000, clics: 50 }, b: { gasto: 30000, imp: 4000, clics: 52 } } }), 30000, ahora);
assert.match(txt(a), /Ningún creativo pasa de 1,5% de CTR \(el mejor, «Hook B», va en 1,3%\)/);
assert.strictEqual(P.tiempo(prod(20), ahora).dia, 1);

// Un creativo sobre 1,5 % quita la alerta
a = P.alertas(prod(20, { [iso(ahora)]: { a: { gasto: 30000, imp: 5000, clics: 100 } } }), 30000, ahora);
assert.doesNotMatch(txt(a), /Ningún creativo/);

// Día 2: anotar, no apagar; falta registro si el último es de antes de ayer
a = P.alertas(prod(30, { [iso(ahora - 2 * 864e5)]: { a: { gasto: 1, imp: 1000, clics: 30 } } }), 30000, ahora);
assert.strictEqual(P.tiempo(prod(30), ahora).dia, 2);
assert.match(txt(a), /Día 2: anota/);
assert.match(txt(a), /Falta el registro/);

// Día 3: apagar el que pasa el techo y el que gastó más que el techo sin pedidos
const reg3 = { [iso(ahora - 864e5)]: { a: { gasto: 90000, imp: 20000, clics: 400, pedidos: 2 }, b: { gasto: 60000, imp: 9000, clics: 200, pedidos: 3 }, c: { gasto: 35000, imp: 8000, clics: 150, pedidos: 0 } } };
a = P.alertas(prod(50, reg3), 30000, ahora);
const ap = a.filter(x => x.accion && x.accion.tipo === 'apagar').map(x => x.accion.id).sort();
assert.deepStrictEqual(ap, ['a', 'c']); // a: CPA 45.000 > 30.000; c: 35.000 sin pedidos
assert.doesNotMatch(txt(a), /Sube máximo/); // día 3 todavía no escala

// Día 4: b (CPA 20.000 <= 24.000) es ganador -> subir de 80.000 a 96.000–104.000
a = P.alertas(prod(80, reg3), 30000, ahora);
const sub = a.find(x => x.accion && x.accion.tipo === 'subir');
assert.ok(sub, txt(a));
assert.strictEqual(sub.accion.a, 96000);
assert.match(sub.texto, /de \$80\.000 a \$96\.000–\$104\.000/);
assert.deepStrictEqual(P.subida(80000), [96000, 104000]);

// Una sola subida por día
a = P.alertas(prod(80, reg3, { ultimaSubida: iso(ahora) }), 30000, ahora);
assert.ok(!a.some(x => x.accion && x.accion.tipo === 'subir'));
assert.match(txt(a), /Ya subiste el presupuesto hoy/);

// Escalar sobre 150.000 se bloquea sin confirmaciones
a = P.alertas(prod(80, reg3, { presupuesto: 130000 }), 30000, ahora);
assert.ok(!a.some(x => x.accion && x.accion.tipo === 'subir'));
assert.match(txt(a), /confirma por escrito el stock/);
a = P.alertas(prod(80, reg3, { presupuesto: 130000, stockConfirmado: true, entregasConfirmadas: true }), 30000, ahora);
assert.ok(a.some(x => x.accion && x.accion.tipo === 'subir'));

// Creativo apagado no cuenta
const pa = prod(80, reg3); pa.pauta.creativos[0].estado = 'apagado';
assert.ok(!P.alertas(pa, 30000, ahora).some(x => x.accion && x.accion.id === 'a'));

// Métricas acumuladas
const m = P.metricas(prod(80, Object.assign({ [iso(ahora)]: { b: { gasto: 40000, imp: 1000, clics: 20, pedidos: 2 } } }, reg3)));
const b = m.creativos.find(c => c.id === 'b');
assert.strictEqual(b.gasto, 100000); assert.strictEqual(b.pedidos, 5); assert.strictEqual(b.cpa, 20000);
assert.strictEqual(m.dias.length, 2); assert.strictEqual(m.total.gasto, 225000);

// Efectividad real
const pe = prod(200, reg3, { entregas: { despachados: 40, entregados: 26 } });
assert.strictEqual(P.efectividadReal(pe), 0.65);
assert.ok(P.alertas(pe, 30000, ahora).some(x => x.accion && x.accion.tipo === 'efectividad'));

console.log('Pauta OK: reglas de 48 h, CTR, día 3, escalado, tope de $150.000 y efectividad.');
