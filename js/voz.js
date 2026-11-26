// Dos Caminos — UNA SOLA HISTORIA Y LUEGO SE DIVIDE (líneas INICIO y SEPARAR) y VOZ SINCRONIZADA (línea VOZ).
//  · INICIO: escenas | personajes | acciones — al principio, pantalla completa con una sola historia (la parte común).
//    En SEPARAR (segundo; por defecto el 40 % del video) la pantalla se parte con una raya vertical en el centro:
//    izquierda = camino A, derecha = camino B. Fundido suave entre las dos imágenes, nunca negro.
//  · VOZ: «0-4 texto > 4-9 texto > …»: cada tramo muestra lo que dice en esos segundos: los cambios de escena caen
//    al empezar el tramo que la nombra (o el más cercano) y los gestos que nombra (llora, abraza…) empiezan con él.
//    Con SUBTITULOS (por defecto sí), el texto sale grande abajo, palabra a palabra, al ritmo de cada tramo.
import { makeTimeline, layoutFor, tOfP, CHOICE, W } from './render.js';
import { SCENE_ALIAS, norm } from './parser.js';
const AMBER = '#F4B860', WHITE = '#F4F2EC';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

const FONT = '"Helvetica Neue", "Arial Black", system-ui, sans-serif';
const TRANS = 0.6; // fundido de la división (s)

export function vozOf(job) { return (job.lang === 'en' ? job.vozEn || job.voz : job.voz) || null; }

// palabras que nombran cada escena (de los alias del formato: «aeropuerto», «avión», «mesa», «cena»…)
const SCENE_WORDS = {};
for (const [w, sc] of Object.entries(SCENE_ALIAS)) (SCENE_WORDS[sc] = SCENE_WORDS[sc] || []).push(w);
const SCENE_EXTRA = { aeropuerto: ['avion', 'vuela', 'vuelo', 'aeropuerto'], telefono: ['llama', 'llamada', 'telefono', 'movil'], cama: ['cama', 'duerme', 'noche'], mesa: ['mesa', 'cena', 'come', 'plato'], camino: ['camino', 'camina', 'corre'], abrazo: ['abrazo', 'abraza'] };
const mentions = (text, scene) => { const t = ' ' + norm(text).replace(/[^a-z0-9ñ ]/g, ' ') + ' '; return [...(SCENE_WORDS[scene] || []), ...(SCENE_EXTRA[scene] || [])].some((w) => t.includes(' ' + w + ' ')); };

// inicio de cada escena de un lado con la VOZ: el tramo que la nombra o, si no, el que empieza más cerca
function vozBounds(segs, tl, voz) {
  const n = segs.length;
  if (n < 2 || !voz) return null;
  const P = (T) => clamp((T - tl.mainStart - CHOICE) / Math.max(0.1, tl.mainDur - CHOICE));
  const tEnd = tl.resStart, minLen = 1.2;
  const b = [0];
  let prev = tOfP(tl, 0);
  for (let k = 1; k < n; k++) {
    const def = tOfP(tl, k / n), segLen = (tEnd - tOfP(tl, 0)) / n;
    const room = (T) => T > prev + minLen && T < tEnd - (n - k) * minLen;
    let T = null;
    const named = voz.find((v) => room(v.a) && mentions(v.text, segs[k].scene) && !mentions(v.text, segs[k - 1].scene));
    if (named) T = named.a;
    else {
      const near = voz.filter((v) => room(v.a) && Math.abs(v.a - def) < segLen * 0.8).sort((x, y) => Math.abs(x.a - def) - Math.abs(y.a - def))[0];
      T = near ? near.a : Math.max(def, prev + minLen);
    }
    b.push(P(T)); prev = T;
  }
  b.push(1);
  for (let k = 1; k < b.length; k++) b[k] = Math.max(b[k], b[k - 1] + 0.01);
  b[b.length - 1] = 1;
  return b;
}

// Prepara el video: historia común + división, y la VOZ. job ya tiene tl, sides, layout… (lo llama app.js / pruebas)
export function prepareStory(job, { intro = null, split = null, voz = null, vozEn = null, subs = true } = {}) {
  job.voz = voz; job.vozEn = vozEn; job.subs = subs !== false;
  job.sides = job.sides.map((sd) => ({ ...sd })); // copia propia: los segundos de cada escena son de este video
  if (intro) intro = { ...intro };
  const V = vozOf(job);
  const D = job.tl.D;
  if (intro && job.layout.kind !== 'time') {
    // el segundo de la división: SEPARAR, o el 40 % (con VOZ, el tramo que empieza más cerca, ±2 s)
    let Ts = split != null ? split : D * 0.4;
    if (split == null && V) { const near = V.filter((v) => Math.abs(v.a - Ts) <= 2 && v.a > 2.5).sort((x, y) => Math.abs(x.a - Ts) - Math.abs(y.a - Ts))[0]; if (near) Ts = near.a; }
    Ts = Math.max(3, Math.min(Ts, D * 0.65));
    job.layoutKind = 'lr';
    job.layout = layoutFor('lr'); // izquierda = A, derecha = B
    job.tl = makeTimeline(D, Ts);
    const ms = Math.min(1.8, Ts * 0.4);
    const itl = { D: Ts, hookHold: 1.2, mainStart: ms, resStart: Ts, endStart: Ts, mainDur: Ts - ms, res: 1e-6, end: 1, C: Math.max(2, Math.round((Ts - ms) / 1.6)) };
    const IJ = {
      isIntro: true, tl: itl, layout: layoutFor('full'), layoutKind: 'full', seed: job.seed + 101, stars: job.stars, bg: job.bg,
      plano: job.plano, angulo: job.angulo, lang: job.lang, title: job.title, voz: job.voz, vozEn: job.vozEn,
      sides: [intro], texts: { hook: job.texts.hook, phrase: '', postPhrase: '', question: '', signature: '', sides: [] },
    };
    job.intro = { Ts, job: IJ };
    if (V) { const segs = intro.segments && intro.segments.length > 1 ? intro.segments : null; if (segs) intro.segBounds = vozBounds(segs, itl, V); }
  }
  if (V && job.layout.kind !== 'time') for (const sd of job.sides) { if (sd.segments && sd.segments.length > 1) sd.segBounds = vozBounds(sd.segments, job.tl, V); }
  return job;
}

// Los gestos que nombra un tramo de la VOZ (llora, abraza, le da un corazón…) empiezan al empezar ese tramo
export function alignMomentsToVoz(plan, V, T0, T1, typesIn) {
  if (!V || !plan) return plan;
  for (const v of V) {
    const types = typesIn(v.text);
    if (!types.size) continue;
    for (const e of plan) {
      if (!types.has(e.type) || e._voz || Math.abs(e.t0 - v.a) > 3.5) continue;
      const dur = e.t1 - e.t0;
      const shift = Math.max(T0, Math.min(v.a, T1 - dur)) - e.t0;
      // los que van juntos (p. ej. el contraste: pide + distraído) se mueven juntos
      for (const g of plan) if (g !== e && Math.abs(g.t0 - e.t0) < 0.01) { g.t0 += shift; g.t1 += shift; g._voz = true; }
      e.t0 += shift; e.t1 += shift; e._voz = true;
    }
  }
  plan.sort((a, b) => a.t0 - b.t0);
  return plan;
}

// Subtítulos grandes, palabra a palabra, al ritmo de cada tramo de la VOZ
export function drawVoz(ctx, job, t, scale) {
  const V = vozOf(job);
  if (!V || !job.subs) return;
  const v = V.find((x) => t >= x.a && t < x.b);
  if (!v) return;
  const words = v.text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  // en trozos de hasta 7 palabras (que quepan en 2 líneas); cada trozo y cada palabra, según su largo
  const chunks = [];
  for (let i = 0; i < words.length; i += 7) chunks.push(words.slice(i, i + 7));
  const len = (ws) => ws.join(' ').length + 2;
  const total = chunks.reduce((s, c) => s + len(c), 0);
  let acc = v.a, chunk = chunks[chunks.length - 1], c0 = v.a, c1 = v.b;
  for (const c of chunks) { const d = ((v.b - v.a) * len(c)) / total; if (t < acc + d) { chunk = c; c0 = acc; c1 = acc + d; break; } acc += d; }
  const shown = [];
  const cl = chunk.reduce((s, w) => s + w.length + 1, 0);
  let wa = c0;
  for (const w of chunk) { if (t >= wa) shown.push(w); wa += ((c1 - c0) * 0.85 * (w.length + 1)) / cl; }
  if (!shown.length) shown.push(chunk[0]);
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = Math.min(1, (t - v.a) / 0.12, (v.b - t) / 0.12);
  const fs = 62;
  ctx.font = `800 ${fs}px ${FONT}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  // dos líneas como mucho, centradas, abajo (dentro de la zona segura)
  const sp = ctx.measureText(' ').width, maxW = 900;
  const lines = [];
  let cur = [], cw = 0;
  for (const w of chunk) { const ww = ctx.measureText(w).width; if (cur.length && cw + sp + ww > maxW) { lines.push(cur); cur = [w]; cw = ww; } else { cur.push(w); cw += (cur.length > 1 ? sp : 0) + ww; } }
  if (cur.length) lines.push(cur);
  const y0 = 1265 - (lines.length - 1) * fs * 1.12;
  // banda oscura suave detrás (se lee sobre cualquier dibujo)
  {
    const a0 = ctx.globalAlpha, top = y0 - fs * 0.95, bot = y0 + (lines.length - 1) * fs * 1.12 + fs * 0.45;
    const g = ctx.createLinearGradient(0, top - 30, 0, bot + 30);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.25, 'rgba(0,0,0,0.45)'); g.addColorStop(0.75, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, top - 30, W, bot - top + 60);
    ctx.globalAlpha = a0;
  }
  let idx = 0;
  lines.slice(0, 3).forEach((ln, li) => {
    const lw = ln.reduce((s, w, j) => s + ctx.measureText(w).width + (j ? sp : 0), 0);
    let x = W / 2 - lw / 2;
    const y = y0 + li * fs * 1.12;
    for (const w of ln) {
      const ww = ctx.measureText(w).width;
      if (idx < shown.length) {
        const last = idx === shown.length - 1 && shown.length < chunk.length + 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.92)'; ctx.lineWidth = 11; ctx.strokeText(w, x, y);
        ctx.fillStyle = last ? AMBER : WHITE; ctx.fillText(w, x, y);
      }
      x += ww + sp; idx++;
    }
  });
  ctx.restore();
}

export const SPLIT_TRANS = TRANS;
