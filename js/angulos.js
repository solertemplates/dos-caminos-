// Dos Caminos — ÁNGULOS DE CÁMARA (línea ANGULO del guion: lateral | frente | aereo | mixto; por defecto mixto).
//  · lateral: de lado, como siempre.
//  · frente: los personajes se giran hacia la cámara (tres cuartos), para ver bien los gestos; quien camina,
//    va en bici o está acostado sigue de lado.
//  · aéreo: desde arriba: el suelo, los muebles vistos desde arriba (la mesa con la silla vacía, la cama con un
//    lado vacío, el camino que se separa…) y los personajes desde arriba (cabeza, hombros, brazos).
//  · contrapicado suave (solo en mixto): desde abajo, los personajes más altos y el horizonte bajo, para la fuerza
//    (subir, escalar, celebrar, llegar arriba, ganar, el avión despegando).
// Mixto: elige según el momento: aéreo para la soledad y el final triste; de frente para el llanto y el abrazo;
// lateral para caminar; contrapicado para subir, ganar y el avión. Cambios suaves (~0,6 s), nunca negro.
// Regla del arco: los ángulos salen de los sucesos y de las escenas, idénticos en los dos lados antes del momento difícil.
import { tOfP, pathInv, CHOICE, arcTime } from './render.js';
import { rawFigure } from './scenes.js';
import { drawFigureIcons } from './moments.js';
import { drawUseProp } from './uses.js';
import { WHITE, BG, figureSize } from './figure.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const nrm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const RED = '#E5484D', AMBER = '#F4B860';
const BLEND = 0.6;

// escenas con vista aérea propia (en las demás, el suelo y los personajes desde arriba)
// (v41: todas las escenas se pueden ver desde arriba; las que no tienen dibujo propio, el suelo con sus personajes y su luz)
export const AERIAL_SCENES = new Set(['mesa', 'cama', 'sofa', 'camino', 'abrazo', 'parque', 'cocina', 'telefono', 'escalera', 'tienda', 'libros', 'montana', 'puente',
  'arbol', 'alcancia', 'casa', 'fogata', 'oficina', 'coche', 'gimnasio', 'huerto', 'lluvia', 'carta', 'reloj', 'regalo', 'aeropuerto']);
const FRONT = new Set(['llora', 'abraza', 'abrazo-largo', 'recibir-corazon', 'estoy-contigo']);
const LONELY = new Set(['tristeza', 'ansiedad', 'llora', 'aleja']);
const POWER = new Set(['celebra', 'alegria']);
const CLIMB = new Set(['subir', 'escalar']);

export function anguloOf(job) {
  if (job.layout.kind === 'time') return 'lateral';
  const a = job.angulo || 'mixto';
  return ['lateral', 'frente', 'aereo'].includes(a) ? a : 'mixto';
}

// Ángulos de un panel, una vez por video: [{ t0, t1, v: 'frente' | 'aereo' | 'contra' }] (fuera de la lista = lateral)
export function anglesFor(job, plans, i) {
  const mode = anguloOf(job);
  const tl = job.tl;
  if (mode === 'lateral') return [];
  if (mode === 'frente') return [{ t0: tl.mainStart + CHOICE, t1: 1e9, v: 'frente' }];
  if (mode === 'aereo') return [{ t0: -1, t1: 1e9, v: 'aereo' }];
  const role = job.roles ? job.roles[i] : null;
  const own = job.sides[i];
  const side = job.roles && role === 'bad' ? job.sides[job.roles.indexOf('good')] : own;
  const segs = side.segments && side.segments.length > 1 ? side.segments : [{ scene: side.scene, people: side.people }];
  const nSeg = segs.length;
  const tAt = (pe) => { const q = role ? pathInv(tl, pe, role) : pe; return q == null ? null : tOfP(tl, q); };
  const segT = segs.map((g, k) => [tAt(k / nSeg), k === nSeg - 1 ? tl.resStart : tAt((k + 1) / nSeg)]);
  const segAt = (t) => { let k = 0; segT.forEach(([a], j) => { if (a != null && t >= a) k = j; }); return k; };
  const absent = (g) => g.people.some((p) => p.act === 'ausente');
  const aerialOk = (g) => AERIAL_SCENES.has(g.scene) || absent(g);
  const out = [];
  // contrapicado por escena: subir / escalar (a mitad de la escena) y el avión que despega (al final de la escena)
  segs.forEach((g, k) => {
    const [a, b] = segT[k];
    if (a == null || b == null) return;
    const L = b - a;
    if (g.people.some((p) => CLIMB.has(p.act))) out.push({ t0: a + L * 0.3, t1: a + L * 0.9, v: 'contra' });
    if (g.scene === 'aeropuerto' && g.people.some((p) => p.act === 'subir-avion')) out.push({ t0: a + L * 0.68, t1: b, v: 'contra' });
  });
  // sucesos: el llanto y el abrazo de frente; la soledad desde arriba; la alegría desde abajo
  const T0 = tl.mainStart + CHOICE + 1.2;
  // en «se rinde», antes del momento difícil los dos lados son el mismo (regla del arco): nadie es «el malo» todavía
  const tD = job.roles ? arcTime(tl) : -1;
  const badAt = (t) => !own.good && t >= tD;
  const slots = [];
  for (const e of plans[i] || []) {
    if (e.t0 < T0 || e.t0 >= tl.resStart || e.iconOnly) continue;
    let s = slots.find((q) => Math.abs(q.t0 - e.t0) < 0.01);
    if (!s) { s = { t0: e.t0, t1: e.t1, evs: [] }; slots.push(s); }
    s.evs.push(e); s.t1 = Math.max(s.t1, e.t1);
  }
  for (const s of slots) {
    const g = segs[segAt(s.t0 + 0.01)];
    const types = s.evs.map((e) => e.type);
    let v = null;
    const lonely = types.some((x) => LONELY.has(x)) && (absent(g) || (badAt(s.t0) && s.t0 > tl.mainStart + (tl.resStart - tl.mainStart) * 0.45));
    if (lonely && aerialOk(g) && !types.includes('abraza') && !types.includes('abrazo-largo')) v = 'aereo';
    else if (types.some((x) => FRONT.has(x))) v = 'frente';
    else if (!badAt(s.t0) && types.some((x) => POWER.has(x))) v = 'contra';
    if (v) out.push({ t0: s.t0, t1: s.t1, v });
  }
  // el final: triste desde arriba; el abrazo de frente; llegar, ganar o crecer desde abajo
  const res = nrm(own.result), last = (own.segments && own.segments.length > 1 ? own.segments : [{ scene: own.scene, people: own.people }]).slice(-1)[0];
  let fin = null;
  if (!own.good) fin = aerialOk(last) ? 'aereo' : null;
  else if (/abraz/.test(res)) fin = 'frente';
  else if (/llega|gana|crece|florece|llena|une/.test(res)) fin = 'contra';
  if (fin) out.push({ t0: tl.resStart, t1: 1e9, v: fin });
  // al pasar de una escena a otra, de lado (se presenta el sitio; el fundido es siempre en lateral)
  const cuts = segT.slice(1).map(([a]) => a).filter((a) => a != null);
  const list = out.sort((a, b) => a.t0 - b.t0);
  for (const c of cuts) for (const x of list) {
    if (x.v === 'frente') continue; // el llanto y el abrazo siguen de frente aunque cambie la escena
    if (x.t0 >= c - 0.7 && x.t1 <= c + 1.4) x.t1 = x.t0; // dentro: fuera
    else if (x.t0 < c - 0.7 && x.t1 > c - 0.7) x.t1 = c - 0.7;
    else if (x.t0 >= c - 0.7 && x.t0 < c + 1.4) x.t0 = c + 1.4;
  }
  // si dos se pisan, manda el que empieza después
  const clean = list.filter((x) => x.t1 > x.t0 + 0.2);
  for (let k = 0; k < clean.length - 1; k++) if (clean[k].t1 > clean[k + 1].t0) clean[k].t1 = clean[k + 1].t0;
  return clean.filter((x) => x.t1 > x.t0 + 0.2);
}

const VAL = { frente: { yaw: 1, top: 0, low: 0 }, aereo: { yaw: 0, top: 1, low: 0 }, contra: { yaw: 0, top: 0, low: 1 } };
const ZERO = { yaw: 0, top: 0, low: 0 };
const mixV = (a, b, k) => ({ yaw: a.yaw + (b.yaw - a.yaw) * k, top: a.top + (b.top - a.top) * k, low: a.low + (b.low - a.low) * k });
// Ángulo del panel en el tiempo t: { yaw, top, low } entre 0 y 1, con cambios suaves (función solo de t)
export function viewAt(job, i, t) {
  if (anguloOf(job) === 'lateral') return ZERO;
  job.angles = job.angles || [];
  if (!job.angles[i]) job.angles[i] = anglesFor(job, job.moments, i);
  return valAt(job.angles[i], t, 0);
}
const vOf = (x) => (x ? VAL[x.v] : ZERO);
function valAt(L, t, depth) {
  let cur = null, b = -1e9;
  for (const x of L) {
    if (t >= x.t0 && t < x.t1) cur = x;
    if (x.t0 <= t && x.t0 > b) b = x.t0;
    if (x.t1 <= t && x.t1 > b) b = x.t1;
  }
  const k = smooth((t - b) / BLEND);
  if (b < -1e8 || depth > 6 || k >= 1) return vOf(cur);
  return mixV(valAt(L, b - 1e-4, depth + 1), vOf(cur), k); // cambio suave desde lo que había justo antes
}

// ---------------------------------------------------------------------------
// VISTA AÉREA: suelo, muebles desde arriba y los personajes desde arriba
const TH = 1.2, CT = Math.cos(TH), ST = Math.sin(TH);
let collectCanvas = null;
export function collectCtx() {
  if (!collectCanvas) { collectCanvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(2, 2) : Object.assign(document.createElement('canvas'), { width: 2, height: 2 }); }
  const c = collectCanvas.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}

function sl(ctx, F, a, wd = 1) { ctx.strokeStyle = WHITE; ctx.globalAlpha = a; ctx.lineWidth = Math.max(1.5, F * 0.012 * wd); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function glowAt(ctx, x, y, rad, col, a) {
  if (a <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  const [r, gg, b] = [1, 3, 5].map((k) => parseInt(col.slice(k, k + 2), 16));
  g.addColorStop(0, `rgba(${r},${gg},${b},${0.5 * a})`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); ctx.restore();
}

// S: estado de la escena (S.box, S.w, S.F…), figs: figuras apuntadas al dibujar la escena (con su transformación)
export function drawAerial(ctx, S, figs) {
  const { F, w } = S;
  const scene = S.sceneName;
  const narrow = w < 2.5 * F;
  // centro del suelo visto desde arriba (algo por encima de la línea del suelo lateral)
  const y0 = -F * (narrow ? 0.62 : 0.5);
  const P = (x, depth, h = 0) => [x, y0 + depth * ST + h * CT]; // punto del suelo (h: altura, negativa hacia arriba)
  // la cámara de arriba, más cerca (todo un poco más grande alrededor del centro del suelo)
  // (el camino ya ocupa todo el ancho; y nunca tanto que alguien se salga: p. ej. al alejarse hacia los bordes)
  const reach = figs.reduce((mx, f) => { const m = f.m || { a: 1, e: 0 }; return Math.max(mx, Math.abs(m.e + m.a * f.o.x) + F * 0.3); }, F * 0.8);
  const K = scene === 'camino' ? 1 : Math.max(1, Math.min(narrow ? 1.1 : 1.45, (w / 2 - F * 0.05) / reach));
  const hw = Math.min(w / 2 / K - F * 0.04, F * 2.1), dd = F * (narrow ? 0.7 : 0.62);
  ctx.save();
  ctx.translate(0, y0); ctx.scale(K, K); ctx.translate(0, -y0);
  // suelo: un óvalo suave un poco más claro que el fondo
  const [fx, fy] = P(0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.beginPath(); ctx.ellipse(fx, fy, hw, dd * ST, 0, 0, Math.PI * 2); ctx.fill();
  sl(ctx, F, 0.22, 0.8);
  ctx.beginPath(); ctx.ellipse(fx, fy, hw, dd * ST, 0, 0, Math.PI * 2); ctx.stroke();
  // la mesa con alguien ausente va corrida en la vista lateral; desde arriba, centrada en el suelo
  if (scene === 'mesa' && S.sceneTx) ctx.translate(-S.sceneTx.d, 0);
  // figuras: x real (con lo que la escena desplazó), profundidad por escena
  const items = figs.map((f, j) => {
    const m = f.m || { a: 1, d: 1, e: 0, f: 0 };
    return { ...f, X: m.e + m.a * f.o.x, Hh: m.f + m.d * (f.o.y || 0), sc: m.a, j };
  });
  const people = S.allPeople || S.people || [];
  // muebles y caminos
  const depthOf = {};
  if (scene === 'mesa') aerialMesa(ctx, S, P, items, people);
  else if (scene === 'cama') aerialCama(ctx, S, P, items, depthOf);
  else if (scene === 'sofa') aerialSofa(ctx, S, P);
  else if (scene === 'camino') aerialCamino(ctx, S, P, items, depthOf, hw);
  else if (scene === 'cocina') { sl(ctx, F, 0.8); const [x, y] = P(-w * 0.1, -dd * 0.75); rr(ctx, x - F * 0.6, y - F * 0.12, F * 1.2, F * 0.24, F * 0.03); ctx.stroke(); for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(x + k * F * 0.25, y, F * 0.07, 0, 7); ctx.stroke(); } }
  else if (scene === 'parque') { sl(ctx, F, 0.6); const [x, y] = P(-w * 0.34, -dd * 0.55, 0); ctx.beginPath(); ctx.arc(x, y, F * 0.32, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.15; ctx.fillStyle = WHITE; ctx.fill(); }
  else if (scene === 'escalera') aerialEscalera(ctx, S, P);
  else if (scene === 'tienda') aerialTienda(ctx, S, P);
  else if (scene === 'libros') aerialLibros(ctx, S, P);
  else if (scene === 'montana') aerialMontana(ctx, S, P);
  else if (scene === 'puente') aerialPuente(ctx, S, P, dd);
  else if (scene === 'fogata') { const [x, y] = P(0, 0); glowAt(ctx, x, y, F * 0.9, '#FF7A45', S.good ? 0.9 : 0.5 * (1 - smooth(S.r))); sl(ctx, F, 0.6); ctx.beginPath(); ctx.ellipse(x, y, F * 0.2, F * 0.2 * ST, 0, 0, 7); ctx.stroke(); }
  else if (scene === 'arbol') { const [x, y] = P(0, -F * 0.2, -F * 0.9); sl(ctx, F, 0.6); ctx.beginPath(); ctx.arc(x, y, F * 0.42, 0, 7); ctx.stroke(); ctx.globalAlpha = 0.12; ctx.fillStyle = WHITE; ctx.fill(); }
  else if (scene === 'telefono') { sl(ctx, F, 0.7); for (const k of [-1, 1]) { const [x, y] = P(k * w * 0.27, 0); rr(ctx, x - F * 0.42, y - F * 0.32, F * 0.84, F * 0.64, F * 0.02); ctx.stroke(); } }
  // las figuras, de atrás hacia delante
  items.sort((a, b) => (depthOf[a.j] || 0) - (depthOf[b.j] || 0));
  for (const it of items) {
    const o = it.o;
    const oo = { ...o, x: it.X, y: y0 + it.Hh * CT, F: o.F * it.sc, view: { top: 1, depth: depthOf[it.j] || 0 } };
    const fig = rawFigure(ctx, oo);
    if (it.icons && it.icons.length) drawFigureIcons(ctx, fig, oo, it.icons, S.moments);
    if (it.use && it.use.prop !== 'bike') { try { drawUseProp(ctx, it.use, fig, { ...oo, y: oo.y }, it.k, {}); } catch (e) {} }
  }
  ctx.restore();
}

// escalera desde arriba: los escalones como franjas que van hacia la luz
function aerialEscalera(ctx, S, P) {
  const { F, w } = S;
  const K = 7, x0 = -w * 0.3, sw = (w * 0.62) / K, sh = F * 0.08, d = F * 0.42;
  sl(ctx, F, 0.8);
  for (let i = 0; i < K; i++) { const [x, y] = P(x0 + i * sw, -d / 2, -(i + 1) * sh); ctx.strokeRect(x, y, sw, d * ST); }
  const shine = S.good ? 0.45 + 0.55 * smooth(S.r / 0.5) : 0.45 * (1 - 0.6 * smooth(S.r / 0.6));
  const [gx, gy] = P(x0 + K * sw + sw * 0.4, 0, -K * sh); glowAt(ctx, gx, gy, F * 0.6, '#F4A259', shine);
}
// tienda desde arriba: el toldo a rayas y el mostrador
function aerialTienda(ctx, S, P) {
  const { F } = S;
  const sw = F * 0.95, d = F * 0.55;
  const [x, y] = P(-sw / 2, -d / 2, -F * 1.05);
  sl(ctx, F, 0.85); ctx.strokeRect(x, y, sw, d * ST);
  for (let i = 1; i < 6; i++) { ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(x + (i * sw) / 6, y); ctx.lineTo(x + (i * sw) / 6, y + d * ST); ctx.stroke(); }
}
// libros desde arriba: la mesita y la pila de libros
function aerialLibros(ctx, S, P) {
  const { F, w } = S;
  const [x, y] = P(w * 0.14, 0, -F * 0.3);
  sl(ctx, F, 0.8); ctx.strokeRect(x - F * 0.18, y - F * 0.14 * ST, F * 0.36, F * 0.28 * ST);
  const n = 1 + Math.floor(4 * smooth(S.p));
  for (let k = 0; k < n; k++) { ctx.globalAlpha = 0.5 + 0.1 * k; ctx.strokeRect(x - F * 0.1 + k * 3, y - F * 0.07 * ST - k * 3, F * 0.2, F * 0.14 * ST); }
}
// montaña desde arriba: curvas de nivel y la bandera naranja en la cima
function aerialMontana(ctx, S, P) {
  const { F, w } = S;
  const [x, y] = P(w * 0.24, 0, -F * 0.85);
  sl(ctx, F, 0.5);
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.ellipse(x - k * F * 0.04, y + k * F * 0.05, k * F * 0.3, k * F * 0.2 * ST, 0, 0, 7); ctx.globalAlpha = 0.6 - k * 0.1; ctx.stroke(); }
  ctx.globalAlpha = 0.95; ctx.fillStyle = '#F4A259'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + F * 0.14, y - F * 0.03); ctx.lineTo(x, y - F * 0.08); ctx.fill();
}
// puente desde arriba: las dos orillas, el vacío en medio y las tablas puestas
function aerialPuente(ctx, S, P, dd) {
  const { F, w } = S;
  const gL = -w * 0.27, gR = w * 0.27;
  const [ax, ay] = P(gL, -dd), [bx, by] = P(gR, dd);
  ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ax, ay, bx - ax, by - ay); ctx.restore();
  sl(ctx, F, 0.7); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, by); ctx.moveTo(bx, ay); ctx.lineTo(bx, by); ctx.stroke();
  const prog = S.good ? smooth(S.p) : smooth(S.p) * 0.5, N = 9, pw = (gR - gL) / N;
  for (let k = 0; k < Math.round(N * prog); k++) { const [x, y] = P(gL + k * pw, -F * 0.16); ctx.strokeRect(x + 2, y, pw - 4, F * 0.32 * ST); }
}

function aerialMesa(ctx, S, P, items, people) {
  const { F, w } = S;
  const n = people.length;
  const hasAbsent = people.some((p) => p.act === 'ausente');
  const narrow = w < 2.5 * F;
  const FF = F * (n > 2 ? 0.88 : 1) * (hasAbsent && narrow ? 0.7 : 1);
  const ox = S.sceneTx ? S.sceneTx.d : 0;
  const apart = !S.good ? smooth(S.r / 0.8) * FF * 0.22 : 0;
  const tw = FF * 1.0, td = FF * 0.62;
  // lámpara encendida sobre la mesa (vista desde arriba: un círculo de luz)
  const lampOn = (0.35 + 0.5 * smooth(S.p)) * (S.good ? 1 + 0.15 * S.r : 1 - smooth(S.r / 0.4));
  const [cx, cy] = P(ox, 0, -FF * 0.36);
  glowAt(ctx, cx, cy, FF * 0.9, AMBER, lampOn * 0.9);
  // mesa (se parte en dos si se alejan)
  sl(ctx, F, 0.95);
  if (apart < 1) { const [ax, ay] = P(ox - tw / 2, -td / 2, -FF * 0.36); rr(ctx, ax, ay, tw, td * ST, FF * 0.03); ctx.stroke(); }
  else for (const k of [-1, 1]) {
    const x0 = ox + k * apart * 0.5;
    const [ax, ay] = P(x0 + (k < 0 ? -tw / 2 : 0), -td / 2, -FF * 0.36);
    rr(ctx, ax, ay, tw / 2, td * ST, FF * 0.03); ctx.stroke();
  }
  // sillas y platos de cada sitio; la silla del ausente vacía con su plato vacío
  people.forEach((pe, i) => {
    const side = i % 2 === 0 ? -1 : 1, slot = Math.floor(i / 2);
    const sx = ox + side * (tw / 2 + FF * 0.24 + slot * FF * 0.48) + side * apart;
    const [x, y] = P(sx, 0, -FF * 0.22);
    sl(ctx, F, pe.act === 'ausente' ? 0.75 : 0.6);
    rr(ctx, x - FF * 0.12, y - FF * 0.12 * ST, FF * 0.24, FF * 0.24 * ST, FF * 0.02); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + side * FF * 0.13, y - FF * 0.13 * ST); ctx.lineTo(x + side * FF * 0.13, y + FF * 0.13 * ST); ctx.stroke(); // respaldo
    const [px, py] = P(ox + side * (tw / 2 - FF * 0.17) + side * apart * 0.5, 0, -FF * 0.37);
    sl(ctx, F, 0.8, 0.8);
    ctx.beginPath(); ctx.ellipse(px, py, FF * 0.09, FF * 0.09 * ST, 0, 0, 7); ctx.stroke();
    if (pe.act !== 'ausente') { ctx.globalAlpha = 0.7; ctx.fillStyle = AMBER; ctx.beginPath(); ctx.ellipse(px, py, FF * 0.045, FF * 0.045 * ST, 0, 0, 7); ctx.fill(); }
  });
  // con un ausente: la puerta cerrada, al borde, detrás de su silla vacía
  if (hasAbsent) {
    const ai = people.findIndex((p) => p.act === 'ausente'), side = ai % 2 === 0 ? -1 : 1;
    const dx = ox + side * (tw / 2 + FF * 0.6 + apart);
    const [x, y] = P(dx, 0, 0);
    sl(ctx, F, 0.85, 1.2);
    ctx.beginPath(); ctx.moveTo(x, y - FF * 0.55 * ST); ctx.lineTo(x, y + FF * 0.55 * ST); ctx.stroke();
    ctx.fillStyle = BG; ctx.globalAlpha = 1; ctx.fillRect(x - FF * 0.025, y - FF * 0.13 * ST, FF * 0.05, FF * 0.26 * ST);
    sl(ctx, F, 0.85); ctx.strokeRect(x - FF * 0.025, y - FF * 0.13 * ST, FF * 0.05, FF * 0.26 * ST);
  }
}

function aerialCama(ctx, S, P, items, depthOf) {
  const { F, w } = S;
  const two = (S.people || []).length > 1;
  const beds = two ? [[-w * 0.18, 1], [w * 0.2, 0.75]] : [[-w * 0.08, 1]];
  beds.forEach(([bx, sc], i) => {
    const bl = F * 1.1 * sc, bd = two ? F * 0.42 * sc : F * 0.86; // una persona: cama de matrimonio con un lado vacío
    const [x, y] = P(bx - bl / 2, -bd / 2, -F * 0.26);
    sl(ctx, F, 0.9);
    rr(ctx, x, y, bl, bd * ST, F * 0.04); ctx.stroke();
    // cabecera
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bd * ST); ctx.lineWidth *= 2.2; ctx.stroke();
    // almohadas
    sl(ctx, F, 0.75);
    const pillows = two ? [0] : [-0.24, 0.24];
    for (const p of pillows) { const [qx, qy] = P(bx - bl / 2 + F * 0.15, p * F, -F * 0.3); rr(ctx, qx - F * 0.08, qy - F * 0.11 * ST, F * 0.16, F * 0.22 * ST, F * 0.04); ctx.stroke(); }
    // manta doblada a la altura de los pies; el lado vacío, lisa
    const [mx, my] = P(bx + bl * 0.05, -bd / 2, -F * 0.27);
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my + bd * ST); ctx.stroke();
  });
  // la persona en su lado de la cama (una sola: el lado de delante; el de atrás queda vacío)
  items.forEach((it) => { depthOf[it.j] = two ? 0 : F * 0.24; });
}

function aerialSofa(ctx, S, P) {
  const { F, w } = S;
  const sw = F * 1.25, sd = F * 0.5;
  // alfombra delante y la lámpara de pie (un círculo de luz)
  sl(ctx, F, 0.3); const [rx, ry] = P(0, F * 0.45); ctx.beginPath(); ctx.ellipse(rx, ry, F * 0.9, F * 0.3 * ST, 0, 0, 7); ctx.stroke();
  const lamp = S.good ? 0.5 + 0.4 * S.r : 0.5 * (1 - smooth(S.r / 0.5));
  const [lx, ly] = P(-w * 0.38, -F * 0.25, -F * 1.0); glowAt(ctx, lx, ly, F * 0.8, AMBER, lamp);
  sl(ctx, F, 0.7); ctx.beginPath(); ctx.arc(lx, ly, F * 0.09, 0, 7); ctx.stroke();
  // sofá: respaldo detrás, brazos a los lados, asiento
  sl(ctx, F, 0.9);
  const [x, y] = P(-sw / 2, -sd * 0.6, -F * 0.3);
  rr(ctx, x, y, sw, sd * ST, F * 0.05); ctx.stroke();
  const [bx, by] = P(-sw / 2, -sd * 0.6, -F * 0.6); rr(ctx, bx, by, sw, F * 0.1 * ST, F * 0.03); ctx.stroke();
  for (const k of [-1, 1]) { const [ax, ay] = P(k * (sw / 2 + F * 0.04), -sd * 0.6, -F * 0.38); rr(ctx, ax - F * 0.06, ay, F * 0.12, sd * ST, F * 0.03); ctx.stroke(); }
}

function aerialCamino(ctx, S, P, items, depthOf, hw) {
  const { F, w } = S;
  // el camino de izquierda a derecha; en el lado malo, con dos personas, se separa en dos a mitad
  const two = items.length > 1;
  const split = two && !S.good;
  const xs = -w * 0.47, xe = w * 0.36, xf = -w * 0.06;
  const lane = F * 0.2;
  const branch = (x, dir) => (split && x > xf ? dir * Math.min((x - xf) * 0.55, F * 0.5) : 0);
  ctx.save();
  sl(ctx, F, 0.55);
  for (const dir of split ? [-1, 1] : [0]) {
    for (const e of [-1, 1]) {
      ctx.beginPath();
      for (let x = xs; x <= xe; x += 8) { const [px, py] = P(x, branch(x, dir) + e * lane); x === xs ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.stroke();
    }
  }
  ctx.restore();
  // la bandera al final (vista desde arriba: el mástil es un punto y el trapo rojo al lado)
  const [fx, fy] = P(xe + F * 0.12, 0);
  sl(ctx, F, 0.85); ctx.beginPath(); ctx.arc(fx, fy, F * 0.03, 0, 7); ctx.stroke();
  if (S.good && S.r > 0.3) { ctx.fillStyle = RED; ctx.globalAlpha = smooth((S.r - 0.3) / 0.3); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + F * 0.15, fy - F * 0.03); ctx.lineTo(fx, fy - F * 0.08); ctx.fill(); }
  // cada caminante en su rama
  items.forEach((it, k) => { depthOf[it.j] = split ? branch(it.X, k === 0 ? 1 : -1) : two ? (k === 0 ? lane * 0.4 : -lane * 0.4) : 0; });
}
