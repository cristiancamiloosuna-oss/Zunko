// Intermediario de Gemini para el Centro de mando Zunko (Cloudflare Worker).
// Guarda la clave de Gemini para que nunca viaje ni quede en la app ni en GitHub.
//
// Variables del Worker (Settings → Variables and Secrets):
//   GEMINI_API_KEY  (secreto)  clave de Google AI Studio
//   APP_TOKEN       (secreto)  una contraseña larga inventada; se pega también en Ajustes de la app
//   ALLOWED_ORIGIN  (texto)    https://cristiancamiloosuna-oss.github.io  (varias, separadas por coma)
//   DAILY_LIMIT     (texto)    opcional, escenas por día (30 por defecto). Solo se aplica con LIMITES.
//   MODEL           (texto)    opcional, modelo de imagen (gemini-2.5-flash-image por defecto)
// Enlace opcional (Bindings → KV namespace): LIMITES, para el tope diario.

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const permitidos = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    const okOrigin = permitidos.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : (permitidos[0] || 'null'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    if (req.method !== 'POST') return json({ error: 'Este intermediario solo acepta pedidos de la app.' }, 405);
    if (!okOrigin) return json({ error: 'Origen no permitido. Revisa ALLOWED_ORIGIN en el Worker.' }, 403);
    if (!env.APP_TOKEN || req.headers.get('X-App-Token') !== env.APP_TOKEN) return json({ error: 'La clave de la app no coincide con APP_TOKEN del Worker.' }, 401);
    if (!env.GEMINI_API_KEY) return json({ error: 'Falta GEMINI_API_KEY en el Worker.' }, 500);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'Pedido mal formado.' }, 400); }
    const { prompt, imagen, mime = 'image/jpeg' } = body || {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 3000) return json({ error: 'Falta la descripción de la escena.' }, 400);
    if (typeof imagen !== 'string' || !imagen || imagen.length > 10000000) return json({ error: 'Falta la foto del producto o pesa demasiado.' }, 400);
    if (!/^image\/(jpeg|png|webp)$/.test(mime)) return json({ error: 'Formato de foto no admitido.' }, 400);

    if (env.LIMITES) {
      const limite = +env.DAILY_LIMIT || 30, k = 'dia:' + new Date().toISOString().slice(0, 10);
      const n = +(await env.LIMITES.get(k)) || 0;
      if (n >= limite) return json({ error: `Llegaste al tope de ${limite} escenas por hoy. Sube DAILY_LIMIT en el Worker si lo necesitas.` }, 429);
      await env.LIMITES.put(k, String(n + 1), { expirationTtl: 172800 });
    }

    const model = env.MODEL || 'gemini-2.5-flash-image';
    let r, j;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: imagen } }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });
      j = await r.json().catch(() => ({}));
    } catch (e) { return json({ error: 'No se pudo hablar con Gemini. Intenta de nuevo.' }, 502); }
    if (!r.ok) return json({ error: 'Gemini: ' + ((j.error && j.error.message) || 'respondió ' + r.status) }, 502);

    const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
    const p = parts.find(x => x.inlineData || x.inline_data);
    if (!p) {
      const txt = parts.map(x => x.text).filter(Boolean).join(' ').slice(0, 300);
      const motivo = j.candidates && j.candidates[0] && j.candidates[0].finishReason;
      return json({ error: 'Gemini no devolvió imagen' + (motivo ? ` (${motivo})` : '') + (txt ? '. Dijo: ' + txt : '.') }, 502);
    }
    const d = p.inlineData || p.inline_data;
    return json({ imagen: d.data, mime: d.mimeType || d.mime_type || 'image/png' });
  },
};
