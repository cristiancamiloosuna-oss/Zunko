// Prueba de la calculadora: node zunko/test-calc.js
const assert = require('assert');
const { calcular, precioComercial, semaforo, autoprueba } = require('./calc.js');

const fallas = autoprueba();
assert.deepStrictEqual(fallas, [], fallas.join('\n'));

const r = calcular({ C: 40000, F: 18000, E: 0.8, X: 0.2, CPA: 20000, P: 90000 });
assert.strictEqual(Math.round(r.pct.fleteDev * 100), 25);
assert.strictEqual(Math.round(r.pct.cpaReal * 100), 35);
assert.strictEqual(Math.round(r.pct.costos * 100), 104);
assert.strictEqual(Math.round(r.sugerido(0.2)), 117188);
// BREAKEVEN = CPA + utilidad x tomado (así lo calcula la hoja)
assert.ok(Math.abs(r.breakeven - (20000 + r.utilTom)) < 1e-9);

assert.strictEqual(precioComercial(93750), 99900);
assert.strictEqual(precioComercial(89900), 89900);
assert.strictEqual(precioComercial(117187.5), 119900);
assert.strictEqual(semaforo(14999), 'rojo');
assert.strictEqual(semaforo(17600), 'ambar');
assert.strictEqual(semaforo(20000), 'verde');

// Sin datos no explota
const z = calcular({});
assert.ok(Object.values(z.op).every(Number.isFinite));

console.log('Calculadora OK: el ejemplo de la hoja cuadra.');
