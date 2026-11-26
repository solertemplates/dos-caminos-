// Dos Caminos — PLANOS de cámara (línea PLANO del guion: general | cerca | mixto; por defecto mixto).
//  · plano general: cuerpo entero, con el escenario (como siempre).
//  · primer plano: los personajes grandes, de la cintura para arriba, cerca de la cámara, para ver bien
//    los gestos, las lágrimas y los corazones. La cámara se acerca y se aleja despacio (nunca un salto ni negro).
// Mixto: plano general al empezar cada escena y en lo que pasa en el escenario (lluvia, alguien llega, el avión…);
// primer plano en los momentos emotivos (llora, abrazo, corazón, tristeza, ansiedad, pide, distraído…).
// Regla del arco: los planos salen de los sucesos y de las posiciones, que son idénticos en los dos lados
// antes del momento difícil → los dos lados siguen idénticos píxel a píxel.
import { MOMENTS } from './moments.js';
import { tOfP, pathInv, CHOICE, segBoundsOf } from './render.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

// sucesos que piden primer plano (se ve la cara, el gesto, el corazón)
const CLOSE = new Set(['corazon', 'abraza', 'rie', 'llora', 'cansa', 'sorpresa', 'piensa', 'sujeta', 'movil', 'duerme',
  'ansiedad', 'ilusion', 'tristeza', 'distraido', 'dar-corazon', 'recibir-corazon', 'estoy-contigo', 'pedir', 'abrazo-largo']);
// los más fuertes: siempre en primer plano, aunque vengan seguidos
const STRONG = new Set(['llora', 'abraza', 'abrazo-largo', 'tristeza', 'recibir-corazon']);
// acciones que necesitan el plano general (el avión despegando o aterrizando se ve de lejos)
const WIDE_ACTS = new Set(['subir-avion', 'llegar-avion']);
const ZMAX = 2.6, BLEND = 0.6;

export function planoOf(job) {
  if (job.layout.kind === 'time') return 'general';
  const p = job.plano || 'mixto';
  return p === 'general' || p === 'cerca' ? p : 'mixto';
}

// Planos de un panel, calculados una vez por video: [{ t0, t1, close, who: [índices] | 'all' }]
export function shotsFor(job, plans, i) {
  const mode = planoOf(job);
  const tl = job.tl;
  if (mode === 'general') return [];
  const role = job.roles ? job.roles[i] : null;
  const side = job.roles && role === 'bad' ? job.sides[job.roles.indexOf('good')] : job.sides[i];
  const segs = side.segments && side.segments.length > 1 ? side.segments : [{ scene: side.scene, people: side.people }];
  const nSeg = segs.length;
  // cuándo empieza cada escena (plano general para presentarla)
  const cuts = [];
  for (let k = 1; k < nSeg; k++) {
    const bk = segBoundsOf(side, nSeg)[k];
    const pe = role ? pathInv(tl, bk, role) : bk;
    if (pe != null) cuts.push({ t: tOfP(tl, pe), k });
  }
  const segAt = (t) => { let k = 0; for (const c of cuts) if (t >= c.t) k = c.k; return segs[k]; };
  const T0 = tl.mainStart + CHOICE;
  // tramos de sucesos (los sucesos que empiezan a la vez van juntos: p. ej. el contraste pide + distraído)
  const evs = (plans[i] || []).filter((e) => e.t0 < tl.resStart);
  const slots = [];
  for (const e of evs) {
    let s = slots.find((q) => Math.abs(q.t0 - e.t0) < 0.01);
    if (!s) { s = { t0: e.t0, t1: e.t1, evs: [] }; slots.push(s); }
    s.evs.push(e); s.t1 = Math.max(s.t1, e.t1);
  }
  slots.sort((a, b) => a.t0 - b.t0);
  const shots = [];
  let closeRun = 0, lastGeneral = T0;
  for (const s of slots) {
    const seg = segAt(s.t0 + 0.01);
    const wideScene = seg.people.some((p) => WIDE_ACTS.has(p.act));
    const closeEvs = s.evs.filter((e) => CLOSE.has(e.type) && !e.iconOnly && MOMENTS[e.type]);
    const anyWorld = s.evs.some((e) => MOMENTS[e.type]?.kind === 'world');
    let close;
    if (mode === 'cerca') close = !wideScene && !anyWorld;
    else {
      close = !wideScene && closeEvs.length > 0;
      // alternar: después de dos primeros planos seguidos, uno general (salvo los momentos más fuertes)
      if (close && closeRun >= 2 && !closeEvs.some((e) => STRONG.has(e.type))) close = false;
      // y si lleva mucho rato en general (> 6 s), un primer plano de los personajes
      if (!close && !wideScene && !anyWorld && s.t0 - lastGeneral > 6 && s.evs.every((e) => MOMENTS[e.type]?.kind !== 'world' && !MOMENTS[e.type]?.legs)) close = true;
    }
    const who = close ? (closeEvs.length ? whoOf(closeEvs) : 'all') : null;
    const main = closeEvs[0] && typeof closeEvs[0].who === 'number' ? closeEvs[0].who : null;
    if (s.t0 < T0 + 1.2) close = false; // al elegir, todavía en general (se ve el sitio y la diferencia)
    shots.push({ t0: Math.max(s.t0, T0), t1: s.t1, close, who, main });
    if (close) closeRun++; else { closeRun = 0; lastGeneral = s.t1; }
    if (close && closeRun === 1) lastGeneral = s.t0;
  }
  // al empezar cada escena: plano general (se presenta el sitio); el fundido entre escenas es siempre en general
  for (const c of cuts) for (const sh of shots) if (sh.t1 > c.t - 0.7 && sh.t0 < c.t + 1.6) {
    if (sh.t0 >= c.t - 0.7 && sh.t1 <= c.t + 1.6) sh.close = false;
    else if (sh.t0 < c.t - 0.7) sh.t1 = Math.min(sh.t1, c.t - 0.7);
    else sh.t0 = Math.max(sh.t0, c.t + 1.6);
  }
  // el final: primer plano del abrazo, de quien se queda o de quien llega agotado; después la cámara se aleja
  // para ver el corazón grande (o lo que se cae, se seca o se aleja) y la frase
  const res = String(job.sides[i].result || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lastSeg = segs[nSeg - 1];
  const people = !lastSeg.people.some((p) => WIDE_ACTS.has(p.act)) && /abraz|une|agotad|despiert|queda/.test(res);
  shots.push({ t0: tl.resStart, t1: tl.resStart + tl.res * 0.45, close: people, who: 'all', main: null });
  shots.push({ t0: tl.resStart + tl.res * 0.45, t1: tl.D + 1, close: false, who: null, main: null });
  return shots.filter((s) => s.t1 > s.t0 + 0.05).sort((a, b) => a.t0 - b.t0);
}
function whoOf(evs) {
  const w = new Set();
  for (const e of evs) {
    if (e.who === 'all') return 'all';
    if (typeof e.who === 'number') w.add(e.who);
    if (typeof e.target === 'number') w.add(e.target);
  }
  return [...w];
}

// zona útil del panel para el primer plano (debajo de los títulos, dentro de la zona segura).
// La misma para todos los paneles (relativa al suelo): así el mismo encuadre sale igual en los dos lados (regla del arco)
export function camBox(layout) {
  const bs = layout.panels.map(panelBox);
  return { L: Math.max(...bs.map((b) => b.L)), R: Math.min(...bs.map((b) => b.R)), top: Math.max(...bs.map((b) => b.top)), bot: Math.min(...bs.map((b) => b.bot)) };
}
function panelBox(pn) {
  const L = pn.clip[0] - pn.cx, R = pn.clip[0] + pn.clip[2] - pn.cx;
  const lines = pn.align === 'center' ? 3 : 2;
  const top = pn.titleY + (lines - 1) * pn.size * 1.2 + pn.sub * 1.5 + 10 - pn.groundY;
  const bot = Math.min(pn.clip[1] + pn.clip[3], 1360) - pn.groundY;
  return { L, R, top, bot };
}

// encuadre de un primer plano con las posiciones del fotograma anterior
function closeFrame(job, i, pn, shot, t) {
  const plan = job.moments && job.moments[i];
  const pos = plan && plan.pos;
  if (!pos) return null;
  const tx = plan.camTx; // «ausente»: la escena va corrida y más pequeña
  const people = (plan.camPeople || []);
  const fresh = (k) => { const p = pos[k]; return p && p.head && Math.abs(p.t - t) < 0.25 && people[k] && people[k].act !== 'ausente' ? p : null; };
  const all = Object.keys(pos).map(Number).filter((k) => fresh(k));
  if (!all.length) return null;
  let ids = shot.who === 'all' || !shot.who ? all : shot.who.filter((k) => fresh(k));
  if (!ids.length) ids = all;
  const B = camBox(job.layout);
  const fit = (list) => {
    let l = Infinity, r = -Infinity, tp = Infinity, bt = -Infinity;
    for (const k of list) {
      const p = pos[k];
      const s = tx ? tx.s : 1, d = tx ? tx.d : 0;
      const hx = p.head[0] * s + d, hy = p.head[1] * s, H = p.H * s;
      l = Math.min(l, hx - H * 0.42); r = Math.max(r, hx + H * 0.42);
      tp = Math.min(tp, hy - H * 0.27); bt = Math.max(bt, hy + H * 0.52);
    }
    const z = Math.min(ZMAX, ((B.R - B.L) * 0.92) / (r - l), (B.bot - B.top) / (bt - tp));
    return { z, cx: (l + r) / 2, bottom: bt };
  };
  let f = fit(ids);
  // si no caben los dos (casas lejanas, orillas), primer plano de quien hace el gesto
  if (f.z < 1.55 && ids.length > 1) {
    const one = shot.main != null && fresh(shot.main) ? [shot.main] : [ids[0]];
    f = fit(one);
  }
  if (f.z < 1.15) return null;
  const z = f.z;
  return { z, ox: (B.L + B.R) / 2 - z * f.cx, oy: B.bot - z * f.bottom };
}

const ID = { z: 1, ox: 0, oy: 0 };
const mix = (a, b, k) => ({ z: a.z + (b.z - a.z) * k, ox: a.ox + (b.ox - a.ox) * k, oy: a.oy + (b.oy - a.oy) * k });

// Cámara de un panel en el tiempo t: { z, ox, oy } → x' = ox + z·x, y' = oy + z·y (coordenadas del panel).
// Se suaviza en el tiempo (sin sacudidas cuando el personaje se ríe o gesticula).
export function cameraAt(job, i, pn, t) {
  const cs = job.coverShot; // portada: primer plano del lado del momento más emotivo
  if (planoOf(job) === 'general' && !(cs && cs.i === i)) return ID;
  job.shots = job.shots || [];
  if (!job.shots[i]) job.shots[i] = cs && cs.i === i ? [{ t0: -1, t1: 1e9, close: true, who: cs.who, main: cs.main }] : planoOf(job) === 'general' ? [] : shotsFor(job, job.moments, i);
  const shots = job.shots[i];
  let cur = -1;
  for (let k = 0; k < shots.length; k++) if (shots[k].t0 <= t) cur = k;
  const frameOf = (sh) => (sh && sh.close ? closeFrame(job, i, pn, sh, t) || ID : ID);
  let target = ID;
  if (cur >= 0 && t < shots[cur].t1) {
    const sh = shots[cur];
    const prev = cur > 0 && shots[cur - 1].t1 >= sh.t0 - 0.05 ? shots[cur - 1] : null;
    const k = smooth((t - sh.t0) / BLEND);
    target = k < 1 ? mix(frameOf(prev), frameOf(sh), k) : frameOf(sh);
  } else if (cur >= 0) {
    // hueco entre planos: vuelve despacio al general
    const sh = shots[cur];
    target = mix(frameOf(sh), ID, smooth((t - sh.t1) / BLEND));
  }
  // suavizado en el tiempo (determinista: mismo guion → mismo video)
  const st = (job.camState = job.camState || [])[i];
  const dt = st ? t - st.t : 0;
  let out = target;
  if (st && dt === 0) out = st.c;
  else if (st && dt > 0 && dt < 0.5) out = mix(st.c, target, 1 - Math.exp(-dt / 0.22));
  job.camState[i] = { t, c: out };
  return out;
}
