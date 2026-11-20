// Dos Caminos — todo se guarda en el teléfono (IndexedDB y localStorage). Nada sube a internet.
const DB = 'dos-caminos';
let dbp = null;

function db() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('songs')) d.createObjectStore('songs', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('videos')) d.createObjectStore('videos', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
function tx(store, mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction(store, mode);
    const s = t.objectStore(store);
    const out = fn(s);
    t.oncomplete = () => res(out && 'result' in out ? out.result : out);
    t.onerror = () => rej(t.error);
  }));
}

export const songs = {
  all: () => tx('songs', 'readonly', (s) => s.getAll()).then((l) => l.sort((a, b) => a.added - b.added)),
  meta: async () => (await songs.all()).map(({ data, ...m }) => m),
  get: (id) => tx('songs', 'readonly', (s) => s.get(id)),
  put: (song) => tx('songs', 'readwrite', (s) => s.put(song)),
  del: (id) => tx('songs', 'readwrite', (s) => s.delete(id)),
  async update(id, patch) { const s = await songs.get(id); if (s) await songs.put({ ...s, ...patch }); },
};

// Mis videos: cada video se guarda en cuanto termina (blob + textos + redes donde ya se publicó).
export const videos = {
  all: () => tx('videos', 'readonly', (s) => s.getAll()).then((l) => l.sort((a, b) => b.created - a.created)),
  get: (id) => tx('videos', 'readonly', (s) => s.get(id)),
  put: (v) => tx('videos', 'readwrite', (s) => s.put(v)),
  del: (id) => tx('videos', 'readwrite', (s) => s.delete(id)),
  async update(id, patch) { const v = await videos.get(id); if (v) await videos.put({ ...v, ...patch }); return v; },
  count: () => tx('videos', 'readonly', (s) => s.count()),
  clear: () => tx('videos', 'readwrite', (s) => s.clear()),
};

const LS = {
  get(k, def) { try { const v = localStorage.getItem('dc.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('dc.' + k, JSON.stringify(v)); } catch (e) {} },
};

export const phrases = {
  list: () => LS.get('phrases', []),
  save: (l) => LS.set('phrases', l),
  add(texts) {
    const l = phrases.list();
    const seen = new Set(l.map((p) => p.text));
    let n = 0;
    for (const t of texts) {
      const s = t.trim().replace(/^[-•*\d.)\s]+/, '').replace(/^["“«]|["”»]$/g, '').trim();
      if (s.length < 3 || seen.has(s)) continue;
      l.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: s });
      seen.add(s);
      n++;
    }
    phrases.save(l);
    return n;
  },
  update(id, text) { phrases.save(phrases.list().map((p) => (p.id === id ? { ...p, text } : p))); },
  del(id) { phrases.save(phrases.list().filter((p) => p.id !== id)); },
};

export const DEFAULTS = {
  duration: 30,
  lang: 'es',
  layout: 'auto',
  quality: 1,
  sfx: true,
  sfxVol: 1,
  musicVol: 0.8,
  phraseChance: 0.3,
  signPhrases: true,
  starNote: true,
  handle: '',
  iosMethod: 'realtime', // en iPhone: 'realtime' (seguro) o 'fast' (WebCodecs, en prueba)
};
export const settings = {
  get: () => ({ ...DEFAULTS, ...LS.get('settings', {}) }),
  set(patch) { const s = { ...settings.get(), ...patch }; LS.set('settings', s); return s; },
};
// Tanda en curso: si la app se cierra, se retoma donde se quedó.
export const queue = {
  get: () => LS.get('queue', null),
  set: (q) => LS.set('queue', q),
  clear: () => { try { localStorage.removeItem('dc.queue'); } catch (e) {} },
};
export const draft = {
  get: () => LS.get('draft', ''),
  set: (v) => LS.set('draft', v),
};
export const counters = {
  next(name) { const n = LS.get('n.' + name, 0) + 1; LS.set('n.' + name, n); return n; },
};

export async function persist() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (e) {}
}
