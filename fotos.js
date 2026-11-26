// Fotos de productos en IndexedDB (no caben en localStorage). Se reducen a 1600 px en JPEG al subirlas.
(function (root) {
  const DB = 'zunko-fotos', ST = 'fotos';
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(modo, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(ST, modo), st = t.objectStore(ST), out = fn(st);
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const put = (id, blob) => tx('readwrite', st => st.put(blob, id));
  const get = id => tx('readonly', st => st.get(id));
  const del = id => tx('readwrite', st => st.delete(id));

  async function reducir(file, max = 1600) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(b => res(b), 'image/jpeg', 0.85));
  }
  const urls = {};
  async function url(id) {
    if (urls[id]) return urls[id];
    const b = await get(id); if (!b) return '';
    return (urls[id] = URL.createObjectURL(b));
  }
  const aDataURL = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  async function deDataURL(s) { return (await fetch(s)).blob(); }

  root.Fotos = { put, get, del, reducir, url, aDataURL, deDataURL };
})(this);
