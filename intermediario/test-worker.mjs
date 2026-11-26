// Prueba del intermediario con Gemini simulado: node intermediario/test-worker.mjs
import assert from 'node:assert';
import worker from './worker.js';

const ORIGEN = 'https://cristiancamiloosuna-oss.github.io';
const kv = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } }; };
const env = { GEMINI_API_KEY: 'clave-secreta', APP_TOKEN: 'token-app', ALLOWED_ORIGIN: ORIGEN + '/', DAILY_LIMIT: '2', LIMITES: kv() };
const pedir = (o = {}) => worker.fetch(new Request('https://x.workers.dev/', {
  method: o.method || 'POST',
  headers: Object.assign({ Origin: o.origin ?? ORIGEN, 'X-App-Token': o.token ?? 'token-app', 'Content-Type': 'application/json' }, o.headers),
  body: o.method === 'OPTIONS' || o.method === 'GET' ? undefined : JSON.stringify(o.body ?? { prompt: 'en el balcón', imagen: 'QUJD', mime: 'image/jpeg' }),
}), o.env || env);

let llamada = null;
globalThis.fetch = async (url, init) => {
  llamada = { url, init, body: JSON.parse(init.body) };
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }, { inlineData: { mimeType: 'image/png', data: 'UE5H' } }] } }] }), { status: 200 });
};

let r = await pedir({ method: 'OPTIONS' });
assert.strictEqual(r.status, 204); assert.strictEqual(r.headers.get('Access-Control-Allow-Origin'), ORIGEN);
assert.strictEqual((await pedir({ origin: 'https://otro.com' })).status, 403);
assert.strictEqual((await pedir({ token: 'mal' })).status, 401);
assert.strictEqual((await pedir({ body: { prompt: '', imagen: 'x' } })).status, 400);
assert.strictEqual((await pedir({ body: { prompt: 'a', imagen: 'x', mime: 'image/gif' } })).status, 400);
assert.strictEqual((await pedir({ method: 'GET' })).status, 405);

r = await pedir();
assert.strictEqual(r.status, 200);
assert.deepStrictEqual(await r.json(), { imagen: 'UE5H', mime: 'image/png' });
assert.match(llamada.url, /models\/gemini-2\.5-flash-image:generateContent$/);
assert.strictEqual(llamada.init.headers['x-goog-api-key'], 'clave-secreta');
assert.strictEqual(llamada.body.contents[0].parts[1].inline_data.data, 'QUJD');
assert.ok(!JSON.stringify(await (await pedir({ env: { ...env, LIMITES: kv() } })).json()).includes('clave-secreta'), 'la clave nunca vuelve a la app');

// Tope diario de 2: la segunda pasa, la tercera no
assert.strictEqual((await pedir()).status, 200);
r = await pedir();
assert.strictEqual(r.status, 429); assert.match((await r.json()).error, /tope de 2/);

// Gemini sin imagen o con error
globalThis.fetch = async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'SAFETY', content: { parts: [{ text: 'No puedo.' }] } }] }), { status: 200 });
r = await pedir({ env: { ...env, LIMITES: undefined } });
assert.strictEqual(r.status, 502); assert.match((await r.json()).error, /SAFETY.*No puedo/);
globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 400 });
r = await pedir({ env: { ...env, LIMITES: undefined } });
assert.match((await r.json()).error, /API key not valid/);

console.log('Intermediario OK: origen, clave de la app, tope diario, errores de Gemini y la clave nunca sale.');
