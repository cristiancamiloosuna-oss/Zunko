// Plantillas de creativos Zunko dibujadas en <canvas>. Sin IA: rellenan con los datos del producto.
(function (root) {
  const TAM = {
    feed: { w: 1080, h: 1350, nombre: 'Feed 4:5' },
    historia: { w: 1080, h: 1920, nombre: 'Historia 9:16' },
    cuadrado: { w: 1080, h: 1080, nombre: 'Cuadrado 1:1' },
  };
  const PLANTILLAS = [
    { id: 'hook', nombre: 'Hook + foto', desc: 'La base del lote de prueba: misma foto, hook distinto.', usaHook: true, usaFoto: true },
    { id: 'contraste', nombre: 'Antes / después', desc: 'El método viejo contra el producto.', usaFoto: true },
    { id: 'oferta', nombre: 'Oferta con precio', desc: 'Precio tachado, precio final y ahorro.', usaFoto: true },
    { id: 'unidad', nombre: 'Precio por unidad', desc: 'Vuelve barato un precio alto con aritmética.', usaFoto: true },
    { id: 'usos', nombre: '3 lugares de uso', desc: 'Dónde se usa, no qué trae.' },
    { id: 'garantia', nombre: 'Garantía', desc: 'Si no te sirve, no lo pagas.' },
    { id: 'lleva2', nombre: 'Lleva 2', desc: 'Oferta por volumen con el ahorro en pesos.', usaFoto: true },
  ];
  const ACCION = '#E08C0B', TINTA = '#1C1814', CREMA = '#F4EEE7';
  const D = s => `800 ${s}px "Bricolage Grotesque", system-ui, sans-serif`;
  const B = (s, w = 600) => `${w} ${s}px "Instrument Sans", system-ui, sans-serif`;
  const money = v => '$' + Math.round(+v || 0).toLocaleString('es-CO');

  // ---------- utilidades de texto y dibujo ----------
  function partir(ctx, txt, maxW) {
    const out = [];
    String(txt || '').split('\n').forEach(par => {
      let l = '';
      par.split(/\s+/).filter(Boolean).forEach(w => {
        const t = l ? l + ' ' + w : w;
        if (ctx.measureText(t).width <= maxW || !l) l = t; else { out.push(l); l = w; }
      });
      out.push(l);
    });
    return out;
  }
  // Busca el tamaño más grande que cabe en maxW × maxH. Si ni el mínimo cabe, marca desborde.
  function ajustar(ctx, txt, o) {
    const lh = o.lh || 1.08;
    for (let s = o.max; s >= o.min; s -= 2) {
      ctx.font = o.font(s);
      const ls = partir(ctx, txt, o.maxW);
      const anchoOk = ls.every(l => ctx.measureText(l).width <= o.maxW + 1);
      if (ls.length * s * lh <= o.maxH && anchoOk && (!o.maxLineas || ls.length <= o.maxLineas)) return { s, ls, lh, alto: ls.length * s * lh, desborde: false };
    }
    ctx.font = o.font(o.min);
    const ls = partir(ctx, txt, o.maxW);
    return { s: o.min, ls, lh, alto: ls.length * o.min * lh, desborde: true };
  }
  function escribir(ctx, r, x, y, color, align = 'left', font) {
    ctx.save(); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
    ctx.font = font(r.s);
    r.ls.forEach((l, i) => ctx.fillText(l, x, y + i * r.s * r.lh + r.s * (r.lh - 1) / 2));
    ctx.restore();
    return y + r.alto;
  }
  function redondeo(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function cubrir(ctx, img, x, y, w, h, r = 0, colorVacio) {
    ctx.save(); redondeo(ctx, x, y, w, h, r); ctx.clip();
    if (img) {
      const k = Math.max(w / img.width, h / img.height), iw = img.width * k, ih = img.height * k;
      ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
    } else { ctx.fillStyle = colorVacio || '#ccc'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }
  function pastilla(ctx, txt, x, y, h, bg, fg, u, ancho) {
    ctx.save(); ctx.font = B(Math.round(h * 0.42), 600);
    const w = ancho || ctx.measureText(txt).width + h * 0.9;
    ctx.fillStyle = bg; redondeo(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + w / 2, y + h / 2 + 1);
    ctx.restore(); return w;
  }
  function marca(ctx, x, y, s, color, align = 'left') {
    ctx.save(); ctx.font = D(s); ctx.textBaseline = 'top';
    const w1 = ctx.measureText('zunk').width, w2 = ctx.measureText('o').width;
    const x0 = align === 'right' ? x - w1 - w2 : align === 'center' ? x - (w1 + w2) / 2 : x;
    ctx.fillStyle = color; ctx.fillText('zunk', x0, y); ctx.fillStyle = ACCION; ctx.fillText('o', x0 + w1, y);
    ctx.restore();
  }
  function degradado(ctx, x, y, w, h, de, a) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, de); g.addColorStop(1, a); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
  const corto = n => (String(n).split(/\s+/).filter(w => !/\d/.test(w) && !/^(led|w|cm|kg|m)$/i.test(w)).slice(0, 3).join(' ') || String(n)).toLowerCase();

  // ---------- plantillas ----------
  // d = {nombre, hook, titular, viejo, nuevo, precio, tachado, escalones, anclaje:{porU, singular, plural, cantidad, mercado}, usos:[{lugar, img}], img, imgs, ia, fam}
  const DIBUJAR = {
    hook(ctx, W, H, d, L) {
      cubrir(ctx, d.img, 0, 0, W, H, 0, d.fam.acc);
      degradado(ctx, 0, 0, W, H * 0.6, 'rgba(0,0,0,.72)', 'rgba(0,0,0,0)');
      degradado(ctx, 0, H * 0.72, W, H * 0.28, 'rgba(0,0,0,0)', 'rgba(0,0,0,.6)');
      const r = ajustar(ctx, d.hook || d.titular || d.nombre, { font: D, maxW: W - 2 * L.pad, maxH: H * (H > 1500 ? 0.26 : 0.34), max: 132 * L.u, min: 54 * L.u });
      L.nota(r, 'El hook');
      escribir(ctx, r, L.pad, L.top, '#fff', 'left', D);
      const ph = 78 * L.u;
      pastilla(ctx, 'Pagas al recibir · Envío gratis', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u);
      marca(ctx, W - L.pad, L.bot - ph + 12 * L.u, 52 * L.u, '#fff', 'right');
    },
    contraste(ctx, W, H, d, L) {
      ctx.fillStyle = d.fam.bg; ctx.fillRect(0, 0, W, H);
      marca(ctx, L.pad, L.top, 46 * L.u, d.fam.ink);
      let y = L.top + 80 * L.u;
      const t = ajustar(ctx, d.titular || `Así lo resuelves hoy, y así con ${corto(d.nombre)}`, { font: D, maxW: W - 2 * L.pad, maxH: (L.bot - y) * 0.24, max: 84 * L.u, min: 40 * L.u });
      L.nota(t, 'El titular');
      y = escribir(ctx, t, L.pad, y, d.fam.ink, 'left', D) + 28 * L.u;
      const gap = 24 * L.u, alto = (L.bot - y - gap), h1 = alto * 0.42, h2 = alto - h1;
      const panel = (py, ph, bg, borde, etiqueta, colorEt, items, signo, colorSigno, img) => {
        ctx.save(); ctx.fillStyle = bg; redondeo(ctx, L.pad, py, W - 2 * L.pad, ph, 28 * L.u); ctx.fill();
        if (borde) { ctx.lineWidth = 4 * L.u; ctx.strokeStyle = borde; ctx.stroke(); } ctx.restore();
        const ip = 30 * L.u; let x = L.pad + ip, w = W - 2 * L.pad - 2 * ip;
        if (img) { const s = Math.min(ph - 2 * ip, w * 0.42); cubrir(ctx, img, x, py + (ph - s) / 2, s, s, 20 * L.u, d.fam.soft); x += s + ip; w -= s + ip; }
        ctx.font = B(26 * L.u, 700); ctx.fillStyle = colorEt; ctx.textBaseline = 'top'; ctx.fillText(etiqueta, x, py + ip);
        const txt = items.slice(0, 3).map(i => `${signo}  ${i}`).join('\n');
        const r = ajustar(ctx, txt || '—', { font: s => B(s, 600), maxW: w, maxH: ph - 2 * ip - 44 * L.u, max: 62 * L.u, min: 24 * L.u, lh: 1.3 });
        L.nota(r, etiqueta === 'HOY' ? 'Las molestias' : 'Las ventajas');
        escribir(ctx, r, x, py + ip + 44 * L.u, d.fam.ink, 'left', s => B(s, 600));
      };
      panel(y, h1, d.fam.soft, null, 'HOY', d.fam.mute, d.viejo, '✕', null);
      panel(y + h1 + gap, h2, '#FFFFFF', d.fam.acc, 'CON ' + corto(d.nombre).toUpperCase(), d.fam.acc, d.nuevo, '✓', null, d.img);
      if (!d.viejo.length || !d.nuevo.length) L.aviso('Faltan molestias o ventajas (sección 5 de la landing).');
    },
    oferta(ctx, W, H, d, L) {
      ctx.fillStyle = d.fam.bg; ctx.fillRect(0, 0, W, H);
      const fh = (L.bot - L.top) * 0.52;
      cubrir(ctx, d.img, L.pad, L.top, W - 2 * L.pad, fh, 36 * L.u, d.fam.soft);
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.92)'; redondeo(ctx, L.pad + 24 * L.u, L.top + 24 * L.u, 190 * L.u, 64 * L.u, 32 * L.u); ctx.fill(); ctx.restore();
      marca(ctx, L.pad + 24 * L.u + 95 * L.u, L.top + 34 * L.u, 40 * L.u, TINTA, 'center');
      let y = L.top + fh + 36 * L.u;
      const n = ajustar(ctx, d.titular || d.nombre, { font: D, maxW: W - 2 * L.pad, maxH: (L.bot - y) * 0.36, max: 64 * L.u, min: 34 * L.u });
      L.nota(n, 'El titular');
      y = escribir(ctx, n, L.pad, y, d.fam.ink, 'left', D) + 20 * L.u;
      ctx.save(); ctx.textBaseline = 'alphabetic';
      const ps = Math.min(132 * L.u, (L.bot - y - 84 * L.u - 90 * L.u) * 0.6); ctx.font = D(ps);
      ctx.fillStyle = d.fam.ink; ctx.fillText(money(d.precio), L.pad, y + ps);
      const pw = ctx.measureText(money(d.precio)).width;
      ctx.font = B(40 * L.u, 500); ctx.fillStyle = d.fam.mute; const tx = L.pad + pw + 24 * L.u;
      ctx.fillText(money(d.tachado), tx, y + ps - 8 * L.u);
      const tw = ctx.measureText(money(d.tachado)).width; ctx.fillRect(tx, y + ps - 22 * L.u, tw, 3 * L.u);
      ctx.restore();
      y += ps + 24 * L.u;
      ctx.font = B(42 * L.u, 700); ctx.fillStyle = d.fam.acc; ctx.textBaseline = 'top'; ctx.fillText(`Ahorras ${money(d.tachado - d.precio)} hoy`, L.pad, y);
      const ph = 84 * L.u;
      pastilla(ctx, 'Envío gratis · Pagas al recibir', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u, W - 2 * L.pad);
      if (!d.precio) L.aviso('Falta el precio final en el costeo.');
    },
    unidad(ctx, W, H, d, L) {
      ctx.fillStyle = TINTA; ctx.fillRect(0, 0, W, H);
      const a = d.anclaje;
      marca(ctx, L.pad, L.top, 46 * L.u, CREMA);
      let y = L.top + 110 * L.u;
      ctx.font = B(30 * L.u, 700); ctx.fillStyle = ACCION; ctx.textBaseline = 'top'; ctx.fillText('HAZ LA CUENTA', L.pad, y); y += 60 * L.u;
      if (!a) { L.aviso('Faltan las unidades que entrega (sección 6 de la landing).'); ctx.font = D(60 * L.u); ctx.fillStyle = CREMA; ctx.fillText('Faltan datos', L.pad, y); return; }
      const big = ajustar(ctx, '~' + a.porU, { font: D, maxW: W - 2 * L.pad, maxH: (L.bot - y) * 0.3, max: 260 * L.u, min: 90 * L.u, maxLineas: 1, lh: 1 });
      y = escribir(ctx, big, L.pad, y, ACCION, 'left', D);
      ctx.font = D(72 * L.u); ctx.fillStyle = CREMA; ctx.fillText('por ' + a.singular, L.pad, y + 6 * L.u); y += 110 * L.u;
      const l1 = ajustar(ctx, `${money(d.precio)} por ${a.cantidad} ${a.plural}.`, { font: s => B(s, 600), maxW: W - 2 * L.pad, maxH: 130 * L.u, max: 46 * L.u, min: 28 * L.u, lh: 1.25 });
      y = escribir(ctx, l1, L.pad, y, CREMA, 'left', s => B(s, 600)) + 22 * L.u;
      if (a.mercado) {
        ctx.fillStyle = 'rgba(244,238,231,.25)'; ctx.fillRect(L.pad, y, W - 2 * L.pad, 2 * L.u); y += 28 * L.u;
        const l2 = ajustar(ctx, a.mercado, { font: s => B(s, 500), maxW: W - 2 * L.pad, maxH: 180 * L.u, max: 40 * L.u, min: 26 * L.u, lh: 1.3 });
        y = escribir(ctx, l2, L.pad, y, '#B8AEA2', 'left', s => B(s, 500)) + 24 * L.u;
      }
      const ph = 84 * L.u, libre = L.bot - ph - 30 * L.u - y;
      if (d.img && libre > 160 * L.u) cubrir(ctx, d.img, L.pad, y, W - 2 * L.pad, libre, 28 * L.u);
      pastilla(ctx, 'Envío gratis · Pagas al recibir', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u, W - 2 * L.pad);
    },
    usos(ctx, W, H, d, L) {
      ctx.fillStyle = d.fam.bg; ctx.fillRect(0, 0, W, H);
      marca(ctx, L.pad, L.top, 46 * L.u, d.fam.ink);
      let y = L.top + 80 * L.u;
      const t = ajustar(ctx, d.titular || 'Dónde lo vas a usar', { font: D, maxW: W - 2 * L.pad, maxH: (L.bot - y) * 0.22, max: 84 * L.u, min: 40 * L.u });
      L.nota(t, 'El titular');
      y = escribir(ctx, t, L.pad, y, d.fam.ink, 'left', D) + 30 * L.u;
      const usos = d.usos.filter(u => u.lugar).slice(0, 3);
      if (usos.length < 3) L.aviso('Faltan lugares de uso (sección 4 de la landing).');
      const ph = 70 * L.u, fin = L.bot - ph - 30 * L.u, gap = 20 * L.u, n = Math.max(1, usos.length);
      const filas = H / W > 1.3;
      usos.forEach((u, i) => {
        let x, yy, w, h;
        if (filas) { h = (fin - y - gap * (n - 1)) / n; w = W - 2 * L.pad; x = L.pad; yy = y + i * (h + gap); }
        else { w = (W - 2 * L.pad - gap * (n - 1)) / n; h = fin - y; x = L.pad + i * (w + gap); yy = y; }
        cubrir(ctx, u.img, x, yy, w, h, 26 * L.u, d.fam.soft);
        degradado(ctx, x, yy + h * 0.55, w, h * 0.45, 'rgba(0,0,0,0)', 'rgba(0,0,0,.6)');
        ctx.save(); redondeo(ctx, x, yy, w, h, 26 * L.u); ctx.clip();
        const r = ajustar(ctx, u.lugar, { font: D, maxW: w - 40 * L.u, maxH: h * 0.35, max: 54 * L.u, min: 26 * L.u });
        escribir(ctx, r, x + 20 * L.u, yy + h - r.alto - 20 * L.u, '#fff', 'left', D); ctx.restore();
      });
      pastilla(ctx, 'Pagas al recibir · Envío gratis', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u);
    },
    garantia(ctx, W, H, d, L) {
      ctx.fillStyle = d.fam.bg; ctx.fillRect(0, 0, W, H);
      marca(ctx, W / 2, L.top, 52 * L.u, d.fam.ink, 'center');
      const zona = L.bot - L.top - 100 * L.u;
      let y = L.top + 100 * L.u + zona * (H > 1500 ? 0.12 : 0.04);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = d.fam.ink;
      const s = Math.min(122 * L.u, zona * 0.14); ctx.font = D(s);
      ctx.fillText('Si no te sirve,', W / 2, y); y += s * 1.08;
      ctx.fillText('no lo pagas', W / 2, y);
      const w = ctx.measureText('no lo pagas').width; ctx.fillStyle = ACCION; ctx.fillRect(W / 2 - w / 2, y + s * 1.02, w, 12 * L.u);
      ctx.restore();
      y += s * 1.08 + 70 * L.u;
      const items = ['No pagas nada por adelantado', '5 días hábiles de retracto (Ley 1480 de 2011)', 'Te confirmamos por WhatsApp antes de despachar'];
      const ph = 84 * L.u, alto = (L.bot - ph - 40 * L.u - y - 2 * 20 * L.u) / 3;
      items.forEach((t, i) => {
        const yy = y + i * (alto + 20 * L.u), h = Math.min(alto, 150 * L.u);
        ctx.save(); ctx.fillStyle = '#fff'; redondeo(ctx, L.pad, yy, W - 2 * L.pad, h, 24 * L.u); ctx.fill(); ctx.lineWidth = 2 * L.u; ctx.strokeStyle = d.fam.line; ctx.stroke(); ctx.restore();
        ctx.save(); ctx.fillStyle = d.fam.acc; ctx.beginPath(); ctx.arc(L.pad + 50 * L.u, yy + h / 2, 22 * L.u, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = B(26 * L.u, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✓', L.pad + 50 * L.u, yy + h / 2 + 1); ctx.restore();
        const r = ajustar(ctx, t, { font: s2 => B(s2, 600), maxW: W - 2 * L.pad - 120 * L.u, maxH: h - 30 * L.u, max: 40 * L.u, min: 24 * L.u, lh: 1.2 });
        escribir(ctx, r, L.pad + 96 * L.u, yy + (h - r.alto) / 2, d.fam.ink, 'left', s2 => B(s2, 600));
      });
      pastilla(ctx, 'Pagas en efectivo al recibir', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u, W - 2 * L.pad);
    },
    lleva2(ctx, W, H, d, L) {
      ctx.fillStyle = d.fam.bg; ctx.fillRect(0, 0, W, H);
      const e = (d.escalones || []).find(x => x.cant > 1);
      const fh = (L.bot - L.top) * 0.5;
      cubrir(ctx, d.img, L.pad, L.top, W - 2 * L.pad, fh, 36 * L.u, d.fam.soft);
      marca(ctx, L.pad + 28 * L.u, L.top + 24 * L.u, 44 * L.u, '#fff');
      if (!e) { L.aviso('Agrega un escalón «lleva 2» en la oferta por volumen de la landing.'); return; }
      const r0 = 110 * L.u, cx = W - L.pad - r0 - 10 * L.u, cy = L.top + fh - r0 * 0.6;
      ctx.save(); ctx.fillStyle = ACCION; ctx.beginPath(); ctx.arc(cx, cy, r0, 0, 7); ctx.fill();
      ctx.fillStyle = TINTA; ctx.font = D(100 * L.u); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×' + e.cant, cx, cy + 4 * L.u); ctx.restore();
      let y = L.top + fh + 50 * L.u;
      const s2 = Math.min(120 * L.u, (L.bot - y - 84 * L.u) * 0.32); ctx.font = D(s2); ctx.fillStyle = d.fam.ink; ctx.textBaseline = 'top';
      ctx.fillText(`Lleva ${e.cant}`, L.pad, y); y += s2 * 1.15;
      ctx.font = B(44 * L.u, 600); ctx.fillStyle = d.fam.mute;
      ctx.fillText(`1 por ${money(d.precio)}  ·  ${e.cant} por ${money(e.precio)}`, L.pad, y); y += 70 * L.u;
      ctx.font = D(64 * L.u); ctx.fillStyle = d.fam.acc; ctx.fillText(`Ahorras ${money(e.ahorro)}`, L.pad, y);
      const ph = 84 * L.u;
      pastilla(ctx, 'Envío gratis · Pagas al recibir', L.pad, L.bot - ph, ph, ACCION, TINTA, L.u, W - 2 * L.pad);
    },
  };

  // Dibuja una plantilla en el canvas. Devuelve la lista de avisos.
  function dibujar(canvas, plantilla, tam, d) {
    const T = TAM[tam], W = T.w, H = T.h, ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const u = W / 1080, pad = 64 * u, seguro = H >= 1900 ? 250 : 0;
    const avisos = [];
    const L = {
      u, pad, top: seguro + pad, bot: H - seguro - pad,
      nota: (r, que) => { if (r.desborde) avisos.push(`${que} no cabe bien: acórtalo.`); },
      aviso: t => avisos.push(t),
    };
    ctx.clearRect(0, 0, W, H);
    DIBUJAR[plantilla](ctx, W, H, d, L);
    if (d.ia && PLANTILLAS.find(p => p.id === plantilla).usaFoto) {
      ctx.save(); ctx.font = B(24 * u, 500); const t = 'Imagen ilustrativa', tw = ctx.measureText(t).width;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; redondeo(ctx, W - pad - tw - 28 * u, seguro + 18 * u, tw + 28 * u, 40 * u, 20 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(t, W - pad - tw - 14 * u, seguro + 39 * u); ctx.restore();
    }
    if (d.hook && plantilla === 'hook' && d.hook.trim().split(/\s+/).length > 8) avisos.push('El hook pasa de 8 palabras.');
    return avisos;
  }

  root.Creativos = { TAM, PLANTILLAS, dibujar, partir, ajustar, corto };
})(this);
