// Dos Caminos — escenas. Cada escena se dibuja en coordenadas de escenario:
// x desde -w/2 a w/2, y = 0 es el suelo, y negativo hacia arriba.
import { drawObject } from './objects.js';
import { figureMoments, drawFigureIcons, BUSY_ACTS } from './moments.js';
import { USES, usePose, useLift, drawUseProp } from './uses.js';
import { drawFigure as rawFigure, POSES, lerpPose, walkPose, breathe, figureSize, WHITE, BG } from './figure.js';

export const RED = '#E5484D';
// Al empezar, los dos caminos están en igualdad: todos de pie (o sentados a la mesa), sin objetos.
let NEUTRAL = 0;
export function setNeutral(v) { NEUTRAL = v; }
// estado de la escena que se está dibujando (lo fija render.js) para las acciones con objetos
let CUR = null;
export function setCurrent(S) { CUR = S; }
function neutralPose(pose) {
  const chair = pose.fl1 > 0.8 && pose.fl2 > -0.1 && pose.fl2 < 0.6;
  return chair ? POSES.sit : POSES.stand;
}
// Poses del arco: caída/cansancio común, intento (de rodillas, mira arriba, estira el brazo) y desánimo.
function arcPoses(pose, badAct) {
  const lying = pose.tr > 1.2;
  if (lying) return null;
  const chair = pose.fl1 > 0.8 && pose.fl2 > -0.1 && pose.fl2 < 0.6;
  const phone = badAct === 'celular' || badAct === 'phone' || badAct === 'ignorar';
  if (chair) {
    return {
      fallen: { ...POSES.sitSlump, tr: 0.48, hd: 0.9, fa1: 0.4, fa2: 0.35 },
      tryP: { ...POSES.sitTalk, tr: 0.0, hd: -0.32, fa1: 1.35, fa2: 1.6, ba1: 0.4, ba2: 0.8 },
      quit: phone ? { ...POSES.sitPhone, tr: 0.3, hd: 0.8 } : { ...POSES.sitSlump, tr: 0.5, hd: 1.05, fa1: 0.45, fa2: 0.3, ba1: 0.4, ba2: 0.25 },
    };
  }
  return {
    fallen: { ...POSES.floor, tr: 0.3, hd: 0.45, fa1: 0.9, fa2: 0.6, ba1: -0.4, ba2: -0.2 },
    tryP: { ...POSES.pray, tr: 0.08, hd: -0.38, fa1: 1.75, fa2: 1.95, ba1: 0.35, ba2: 0.25 },
    quit: phone ? { ...POSES.floorPhone, tr: 0.32, hd: 0.8 } : { ...POSES.floor, tr: 0.46, hd: 1.0, fa1: 0.35, fa2: 0.22, ba1: 0.3, ba2: 0.18 },
  };
}
// Final «llega-agotado» (luchar solo): el que trabajó solo se tambalea con los hombros caídos y los brazos
// colgando; el que esperaba (o miraba el móvil) le ofrece el corazón o el abrazo, y él no tiene fuerzas para recibirlo.
const IDLE_ACTS = new Set(['esperar', 'celular', 'phone', 'ignorar', 'descansar', 'sentarse', 'dormir', 'olvidar', 'perder', 'guardar']);
function exhaustedPose(pose, t) {
  const sw = Math.sin(t * 2.3);
  const chair = pose.fl1 > 0.8 && pose.fl2 > -0.1 && pose.fl2 < 0.6;
  if (chair) return { ...POSES.sitSlump, tr: 0.45 + 0.07 * sw, hd: 0.85, fa1: 0.15, fa2: 0.1, ba1: 0.1, ba2: 0.05 };
  return { tr: 0.32 + 0.07 * sw, hd: 0.75, fa1: 0.06, fa2: 0.04, ba1: 0.02, ba2: 0.02, fl1: 0.16 + 0.05 * sw, fl2: -0.1, bl1: -0.14 + 0.05 * sw, bl2: -0.04 };
}
const OFFER_HEART = { ...POSES.heart, tr: 0.06, hd: 0.05, fa1: 1.0, fa2: 1.55, ba1: 0.95, ba2: 1.5 };

function applyArc(pose, A, badAct) {
  const P = arcPoses(pose, badAct);
  if (!P) return pose;
  if (A.role === 'good') return lerpPose(pose, P.fallen, A.fall * (1 - A.rise));
  let q = lerpPose(pose, P.fallen, A.fall);
  q = lerpPose(q, P.tryP, A.tryK * (1 - A.quit));
  return lerpPose(q, P.quit, A.quit);
}

function drawFigure(ctx, o) {
  // acción de uso real de un objeto (tocar-guitarra, beber-cafe…): pose propia y el objeto en la mano o el cuerpo
  const use = o.pe && USES[o.pe.act];
  const k = { ...(CUR ? { t: CUR.t, p: CUR.p, r: CUR.r, good: CUR.good } : { t: 0, p: 0, r: 0, good: true }), F: o.F, H: figureSize(o.kind, o.F), travel: o.travel };
  if (use) {
    o = { ...o, pose: usePose(use, o.pose, k), y: (o.y || 0) - useLift(use, figureSize(o.kind, o.F)) };
    if (CUR && CUR.object === use.obj) CUR.objHand = true;
  }
  // arco de los dos caminos: caída común, el bueno se levanta, el malo lo intenta y se desanima
  const A = CUR && CUR.arc;
  if (A && !o.noArc && o.neutral !== 'none' && (A.fall > 0 || A.quit > 0)) o = { ...o, pose: applyArc(o.pose, A, o.pe && o.pe.badAct) };
  // o.neutral: 'stand' fuerza de pie al inicio; 'none' no cambia la pose (p. ej. acostados en la cama)
  // en bici empieza ya montado (quieto, sin pedalear), igual en los dos lados
  const riding = use && use.legs === 'ride';
  if (NEUTRAL > 0.001 && o.neutral !== 'none' && !riding) o = { ...o, pose: lerpPose(o.pose, o.neutral === 'stand' ? POSES.stand : neutralPose(o.pose), NEUTRAL) };
  // final «llega-agotado»
  let offerHeart = 0;
  if (!A && CUR && CUR.bad === 'tired' && !CUR.good && CUR.r > 0 && o.pe && o.neutral !== 'none' && !o.noArc && o.pose.tr < 1.2) {
    const k = smooth(CUR.r / 0.4);
    if (!IDLE_ACTS.has(o.pe.act)) o = { ...o, x: o.x + Math.sin(CUR.t * 2.3) * o.F * 0.03 * k, pose: lerpPose(o.pose, exhaustedPose(o.pose, CUR.t), k) };
    else {
      const heartOffer = o.pe.act === 'esperar' || o.pe.act === 'guardar';
      o = { ...o, pose: lerpPose(o.pose, heartOffer ? OFFER_HEART : POSES.reach, k) };
      if (heartOffer && CUR.sceneName !== 'puente') offerHeart = k; // en el puente el corazón ya lo dibuja la escena
    }
  }
  // SUCESOS (regla de ritmo): reacciones del personaje (tropieza, se ríe, saluda, se aleja…) y su símbolo
  let icons = null;
  if (CUR && CUR.moments && NEUTRAL < 0.5 && o.pe) {
    let idx = CUR.people.indexOf(o.pe);
    if (idx < 0) idx = CUR.people.findIndex((p) => p.kind === o.pe.kind && p.act === o.pe.act);
    if (idx >= 0) { const r = figureMoments(o, idx, CUR.moments, { riding, busy: BUSY_ACTS.has(o.pe.act) && !use }); o = r.o; icons = r.icons; }
  }
  const fig = rawFigure(ctx, o);
  if (icons && icons.length) drawFigureIcons(ctx, fig, o, icons);
  if (offerHeart > 0) {
    const hx = (fig.fh[0] + fig.bh[0]) / 2, hy = (fig.fh[1] + fig.bh[1]) / 2;
    const dim = 1 - 0.5 * smooth((CUR.r - 0.5) / 0.4);
    glow(ctx, hx, hy, o.F * 0.32, RED, 0.45 * offerHeart * dim);
    heart(ctx, hx, hy - o.F * 0.01, o.F * 0.12, dim > 0.7 ? RED : '#8E3A3D', offerHeart * dim);
  }
  if (A && A.role === 'bad' && A.quit > 0.6 && o.pe && /celular|phone|ignorar/.test(o.pe.badAct || '')) phoneAt(ctx, fig.fh, o.F);
  if (use && (NEUTRAL < 0.5 || riding)) {
    const st = CUR ? { ...objState(CUR) } : {};
    if (A && A.role === 'bad') st.fade = Math.max(st.fade || 0, 0.5 * A.quit);
    drawUseProp(ctx, use, fig, { ...o, y: (o.y || 0) + useLift(use, figureSize(o.kind, o.F)) }, k, st);
  }
  return fig;
}
export const GOLD = '#F4A259';
export const AMBER = '#F4B860';
export const FLAME = '#FF7A45';
export const COLD = '#CFCBC2';

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;
const frac = (x) => x - Math.floor(x);
const bump = (x, a, b, e = 0.06) => smooth((x - a) / e) * (1 - smooth((x - b) / e));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILD = new Set(['construir', 'trabajar', 'build', 'work']);

// ---------- utilidades de dibujo ----------
function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function setLine(ctx, F, a = 1, wmul = 1) {
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.globalAlpha = a;
  ctx.lineWidth = Math.max(1.5, 0.018 * F * wmul);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
export function glow(ctx, x, y, rad, color, a) {
  if (a <= 0.001 || rad <= 0) return;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, hexA(color, 0.55 * a));
  g.addColorStop(0.4, hexA(color, 0.18 * a));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.globalAlpha = 1;
  ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  ctx.restore();
}
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a)})`;
}
export function heart(ctx, x, y, s, color = RED, a = 1, half = 0, split = 0) {
  if (s <= 0 || a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 0.05, s * 0.25, -s * 0.55, -s * 0.05, -s * 0.5, -s * 0.3);
    ctx.bezierCurveTo(-s * 0.45, -s * 0.6, -s * 0.08, -s * 0.62, 0, -s * 0.32);
    ctx.bezierCurveTo(s * 0.08, -s * 0.62, s * 0.45, -s * 0.6, s * 0.5, -s * 0.3);
    ctx.bezierCurveTo(s * 0.55, -s * 0.05, s * 0.05, s * 0.25, 0, s * 0.35);
    ctx.closePath();
  };
  if (split > 0) {
    // corazón partido en dos mitades
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x + side * split * s * 0.6, y + split * split * s * 2.2);
      ctx.rotate(side * split * 0.9);
      ctx.beginPath();
      ctx.rect(side < 0 ? -s : 0, -s, s, s * 2);
      ctx.clip();
      path();
      ctx.fill();
      ctx.restore();
    }
  } else {
    ctx.translate(x, y);
    path();
    ctx.fill();
  }
  ctx.restore();
}
export function star(ctx, x, y, r, color, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r;
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// masa de tierra bajo el suelo (gris muy oscuro que se funde con el negro)
export function groundMass(ctx, F, x1, x2, path) {
  ctx.save();
  const g = ctx.createLinearGradient(0, -F * 0.1, 0, F * 1.4);
  g.addColorStop(0, 'rgba(255,255,255,0.085)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.globalAlpha = 1;
  if (path) { ctx.beginPath(); path(); ctx.fill(); } else ctx.fillRect(x1, 0, x2 - x1, F * 1.4);
  ctx.restore();
}
function groundLine(ctx, F, x1, x2, a = 0.55, mass = true) {
  if (mass) groundMass(ctx, F, x1, x2);
  setLine(ctx, F, a, 0.8);
  line(ctx, x1, 0, x2, 0);
}
function phoneAt(ctx, h, F, a = 1) {
  a *= 1 - NEUTRAL;
  if (a <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = a;
  glow(ctx, h[0], h[1] - F * 0.02, F * 0.2, COLD, 0.45);
  ctx.fillStyle = '#E8E4DC';
  ctx.fillRect(h[0] - F * 0.018, h[1] - F * 0.05, F * 0.036, F * 0.06);
  ctx.restore();
}
function plankAt(ctx, h, F, facing) {
  if (NEUTRAL > 0.5) return;
  setLine(ctx, F, 0.95, 0.8);
  ctx.strokeRect(h[0] - F * 0.12 + facing * F * 0.04, h[1] - F * 0.03, F * 0.24, F * 0.035);
}
function personDim(S) { return S.dimmed ? 0.85 : 1; }
// Estado del objeto concreto del guion: en el camino bueno se enciende al final (rojo/naranja);
// en el malo se va apagando y, si el final es caerse o alejarse, se cae.
export function objState(S) {
  return {
    hot: S.good ? smooth((S.r - 0.35) / 0.35) : 0,
    fade: S.good ? 0 : 0.5 * smooth(S.p) + 0.5 * smooth(S.r),
    fall: !S.good && (S.bad === 'fall' || S.bad === 'apart') ? smooth((S.r - 0.2) / 0.4) : 0,
  };
}
// Dibuja el objeto del guion en una ranura de la escena (en lugar del objeto genérico).
export function obj(ctx, S, x, y, size, extra = {}) {
  S.objHand = true;
  if (NEUTRAL > 0.5 && !extra.always) return;
  drawObject(ctx, S.object, x, y, size ?? S.F * 0.24, { ...objState(S), ...extra });
}

// Ciclo de trabajo: c = progreso en ciclos, k = ciclo actual, ph = fase dentro del ciclo
function cycle(p, n) {
  const c = clamp(p) * n;
  if (c >= n) return { c, k: n, ph: 1, done: true };
  return { c, k: Math.floor(c), ph: frac(c), done: false };
}

// pose de trabajo (agacharse a colocar algo) según la fase
function workPose(ph, t, high = false, stepF = 0.12) {
  const low = high ? POSES.reachUp : POSES.crouch;
  if (ph < 0.38) return breathe(POSES.carry, t);
  if (ph < 0.6) return lerpPose(POSES.carry, low, smooth((ph - 0.38) / 0.22));
  if (ph < 0.8) return lerpPose(low, POSES.stand, smooth((ph - 0.6) / 0.2));
  return lerpPose(walkPose((stepF / 0.4) * Math.PI * smooth((ph - 0.8) / 0.2)), POSES.carry, smooth((ph - 0.9) / 0.1));
}

function resultBlend(S, a = 0, b = 0.45) { return smooth((S.r - a) / (b - a)); }

// Pasos reales: la fase de la zancada depende de la distancia recorrida (sin patinar),
// medio paso ≈ 0.4·F caminando y 0.55·F corriendo.
export function stepPhase(dist, F, run = false) { return (dist / (F * (run ? 0.55 : 0.4))) * Math.PI; }
export function walkDist(dist, F, run = false) { return walkPose(stepPhase(Math.abs(dist), F, run), run); }
// Caminar entre dos posiciones: mira hacia donde va y solo mueve las piernas si avanza.
export function walkMove(xNow, xPrev, F, run = false) {
  const dx = xNow - xPrev;
  const facing = dx >= 0 ? 1 : -1;
  const moving = smooth(Math.abs(dx) / (F * 0.0025));
  return { pose: lerpPose(POSES.stand, walkPose(stepPhase(facing * xNow, F, run), run), moving), facing, moving };
}

const PHONE_ACTS = new Set(['celular', 'phone', 'ignorar']);
const SIT_ACTS = new Set(['descansar', 'sentarse', 'dormir', 'rest', 'sit']);
// Dibuja a un personaje secundario con su propia acción, en la posición dada.
// kindOf: 'work' (agacharse a colocar), 'drop' (echar algo), 'read' (leer sentado), 'stand'.
export function companion(ctx, S, pe, x, facing, opts = {}) {
  const { F, t } = S;
  const act = pe.act;
  const cy = cycle(S.p, S.C);
  const ph = cy.done ? 1 : frac(cy.ph + (opts.phase ?? 0.5));
  let pose, prop = null, chair = false, y = opts.y || 0;
  if (PHONE_ACTS.has(act)) { pose = breathe(opts.sit ? POSES.sitPhone : POSES.phone, t + 1); chair = !!opts.sit; prop = 'phone'; }
  else if (SIT_ACTS.has(act)) { pose = breathe(act === 'dormir' ? { ...POSES.floor, hd: 0.9 } : POSES.floorPhone, t + 1); prop = act === 'dormir' ? null : 'phone'; }
  else if (opts.kind === 'read') { pose = { ...breathe(POSES.read, t + 1), fa2: POSES.read.fa2 + 0.25 * bump(ph, 0.45, 0.6, 0.05) }; chair = true; prop = 'book'; }
  else if (opts.kind === 'work' && !cy.done) { pose = workPose(ph, t, false); prop = ph < 0.62 || ph > 0.93 ? 'brick' : null; }
  else if (opts.kind === 'drop' && !cy.done) { const up = smooth(ph / 0.4) * (1 - smooth((ph - 0.62) / 0.3)); pose = lerpPose(breathe(POSES.stand, t), POSES.drop, up); prop = ph < 0.5 ? 'coin' : null; }
  else if (opts.kind === 'water' && !cy.done) { const pour = bump(ph, 0.3, 0.75, 0.12); pose = lerpPose(POSES.water, { ...POSES.water, fa1: 1.25, fa2: 1.9 }, pour); prop = 'can'; }
  else pose = breathe(POSES.stand, t + 1);
  if (S.r > 0) {
    const good = opts.good ?? S.good;
    if (good) pose = lerpPose(pose, chair ? POSES.sitReach : S.r > 0.6 ? POSES.armsUp : POSES.look, resultBlend(S, 0.05, 0.6));
    else pose = lerpPose(pose, chair ? POSES.sitSlump : SIT_ACTS.has(act) ? { ...POSES.floor, hd: 0.9 } : POSES.slump, resultBlend(S));
    if (S.r > 0.3) prop = null;
  }
  if (chair) {
    const H = figureSize(pe.kind, F);
    const seatY = -0.245 * H * 0.98;
    setLine(ctx, F, 0.6, 0.7);
    line(ctx, x - F * 0.11, seatY, x + F * 0.11, seatY);
    line(ctx, x - facing * F * 0.11, seatY, x - facing * F * 0.11, seatY - F * 0.3);
    line(ctx, x - F * 0.09, seatY, x - F * 0.09, 0);
    line(ctx, x + F * 0.09, seatY, x + F * 0.09, 0);
  }
  const fig = drawFigure(ctx, { x, y, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
  if (NEUTRAL < 0.5 && prop) {
    const h = fig.fh;
    setLine(ctx, F, 1, 0.75);
    if (prop === 'phone') phoneAt(ctx, h, F);
    else if (prop === 'book') { ctx.beginPath(); ctx.moveTo(h[0] - F * 0.07, h[1] - F * 0.04); ctx.lineTo(h[0], h[1]); ctx.lineTo(h[0] + F * 0.07, h[1] - F * 0.04); ctx.stroke(); }
    else if (prop === 'brick') ctx.strokeRect(h[0] - F * 0.08, h[1] - F * 0.05, F * 0.16, F * 0.07);
    else if (prop === 'coin') { ctx.beginPath(); ctx.arc(h[0], h[1], F * 0.03, 0, Math.PI * 2); ctx.stroke(); }
    else if (prop === 'can') { ctx.strokeRect(h[0] - F * 0.02 * facing, h[1] - F * 0.01, F * 0.08 * facing, F * 0.07); }
  }
  return fig;
}

// ===================================================================
// ESCENAS
// ===================================================================
export const SCENES = {};

// ---------------- PUENTE ----------------
SCENES.puente = {
  plan(S) {
    const [L, R] = S.people;
    const bL = !!(L && BUILD.has(L.act));
    const bR = !!(R && BUILD.has(R.act));
    const nb = (bL ? 1 : 0) + (bR ? 1 : 0);
    const N = S.C * 2;
    // el mismo plan en los dos lados: la diferencia la pone el arco (el malo se rinde y deja de construir)
    let tL = 0, tR = 0;
    const good = S.good || !!S.arc; // con el arco «se rinde» los dos lados siguen el plan bueno
    if (nb === 2) { tL = good ? S.C : S.C - 1; tR = good ? S.C : S.C - 1; }
    else { const tgt = good ? N : S.C; if (bL) tL = tgt; else if (bR) tR = tgt; }
    return { bL, bR, N, tL, tR };
  },
  events(S) {
    const { tL, tR } = this.plan(S);
    const ev = [];
    for (let k = 0; k < tL; k++) ev.push({ p: (k + 0.62) / tL, type: 'tock' });
    for (let k = 0; k < tR; k++) ev.push({ p: (k + 0.62) / tR, type: 'tock', detune: 1.12 });
    if (S.good) ev.push({ r: 0.5, type: 'chime' }, { r: 0.5, type: 'heartbeat' });
    else if (S.bad === 'fall') ev.push({ r: 0.05, type: 'crash' });
    else ev.push({ r: 0.4, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    const gL = -w * 0.27, gR = w * 0.27, gap = gR - gL;
    const { bL, bR, N, tL, tR } = this.plan(S);
    const pw = gap / N;
    // orillas (masas sólidas con borde irregular)
    groundMass(ctx, F, 0, 0, () => { ctx.moveTo(-w / 2, 0); ctx.lineTo(gL, 0); ctx.lineTo(gL - F * 0.03, F * 0.18); ctx.lineTo(gL + F * 0.01, F * 0.34); ctx.lineTo(gL - F * 0.04, F * 0.55); ctx.lineTo(gL - F * 0.02, F * 1.4); ctx.lineTo(-w / 2, F * 1.4); });
    groundMass(ctx, F, 0, 0, () => { ctx.moveTo(w / 2, 0); ctx.lineTo(gR, 0); ctx.lineTo(gR + F * 0.03, F * 0.2); ctx.lineTo(gR - F * 0.01, F * 0.36); ctx.lineTo(gR + F * 0.04, F * 0.55); ctx.lineTo(gR + F * 0.02, F * 1.4); ctx.lineTo(w / 2, F * 1.4); });
    groundLine(ctx, F, -w / 2, gL, 0.55, false);
    groundLine(ctx, F, gR, w / 2, 0.55, false);
    setLine(ctx, F, 0.5, 0.8);
    ctx.beginPath();
    ctx.moveTo(gL, 0); ctx.lineTo(gL - F * 0.03, F * 0.18); ctx.lineTo(gL + F * 0.01, F * 0.34); ctx.lineTo(gL - F * 0.04, F * 0.55);
    ctx.moveTo(gR, 0); ctx.lineTo(gR + F * 0.03, F * 0.2); ctx.lineTo(gR - F * 0.01, F * 0.36); ctx.lineTo(gR + F * 0.04, F * 0.55);
    ctx.stroke();
    // agua al fondo
    setLine(ctx, F, 0.18, 0.6);
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      const yy = F * (0.5 + j * 0.08);
      for (let x = gL + F * 0.05; x <= gR - F * 0.05; x += 6) {
        const yv = yy + Math.sin(x * 0.03 + t * 1.2 + j) * F * 0.012;
        x === gL + F * 0.05 ? ctx.moveTo(x, yv) : ctx.lineTo(x, yv);
      }
      ctx.stroke();
    }
    // postes
    setLine(ctx, F, 0.8, 0.9);
    line(ctx, gL - F * 0.02, 0, gL - F * 0.02, -F * 0.26);
    line(ctx, gR + F * 0.02, 0, gR + F * 0.02, -F * 0.26);

    const fallK = S.bad === 'fall' ? S.r : 0;
    const plank = (x0, i, side) => {
      const delay = Math.abs(i - (side < 0 ? tL : tR)) * 0.02;
      const fk = clamp((fallK - 0.05 - delay) / 0.6);
      ctx.save();
      ctx.translate(x0 + pw * 0.46, F * 0.02 + fk * fk * F * 0.9);
      ctx.rotate(fk * side * 0.8);
      ctx.globalAlpha = 0.9 * (1 - fk * 0.7);
      ctx.strokeRect(-pw * 0.44, -F * 0.02, pw * 0.88, F * 0.04);
      ctx.restore();
    };
    const cl = cycle(S.p, Math.max(1, tL));
    const cr = cycle(S.p, Math.max(1, tR));
    const placedL = tL ? Math.min(tL, Math.floor(cl.c + 0.38)) : 0;
    const placedR = tR ? Math.min(tR, Math.floor(cr.c + 0.38)) : 0;
    // pilas de tablas que quedan por poner, en cada orilla
    const pile = (x, n) => {
      setLine(ctx, F, 0.75, 0.7);
      for (let j = 0; j < Math.min(n, 6); j++) ctx.strokeRect(x - F * 0.13, -(j + 1) * F * 0.035, F * 0.26, F * 0.03);
    };
    if (tL) pile(gL - F * 0.62, tL - placedL);
    if (tR) pile(gR + F * 0.62, tR - placedR);
    setLine(ctx, F, 0.9, 0.8);
    for (let i = 0; i < placedL; i++) plank(gL + i * pw, i, -1);
    for (let i = 0; i < placedR; i++) plank(gR - (i + 1) * pw, i, 1);
    // cuerdas laterales sobre lo construido
    if (placedL) { setLine(ctx, F, 0.35, 0.6); line(ctx, gL - F * 0.02, -F * 0.26, gL + placedL * pw, -F * 0.2); }
    if (placedR) { setLine(ctx, F, 0.35, 0.6); line(ctx, gR + F * 0.02, -F * 0.26, gR - placedR * pw, -F * 0.2); }

    const rb = resultBlend(S, 0, 0.5);
    const meet = S.good && bL && bR;
    const people = S.people;
    const hearts = [];
    for (let i = 0; i < Math.min(2, people.length); i++) {
      const pe = people[i];
      const side = i === 0 ? -1 : 1;
      const facing = -side;
      const builds = i === 0 ? bL : bR;
      const tgt = i === 0 ? tL : tR;
      const cy = i === 0 ? cl : cr;
      let x, pose, holding = false;
      const edge0 = i === 0 ? gL : gR;
      if (builds && tgt) {
        const edgeCount = cy.done ? tgt : cy.k + smooth((cy.ph - 0.8) / 0.2);
        x = edge0 - side * (edgeCount * pw) + side * F * 0.16;
        pose = cy.done ? breathe(POSES.stand, t) : workPose(cy.ph, t, false, pw / F);
        holding = !cy.done && (cy.ph < 0.62 || cy.ph > 0.93);
        if (S.r > 0) {
          if (meet) {
            const mk = smooth(S.r / 0.45);
            const x0 = x;
            x = lerp(x, side * F * 0.12, mk);
            pose = S.r < 0.45 ? walkDist(x - x0, F) : lerpPose(POSES.stand, POSES.hug, smooth((S.r - 0.45) / 0.2));
          } else if (S.bad === 'fall') {
            pose = lerpPose(POSES.stand, POSES.slump, rb);
          } else {
            pose = S.r < 0.5 ? lerpPose(POSES.stand, POSES.look, rb) : lerpPose(POSES.look, POSES.floor, smooth((S.r - 0.5) / 0.3));
          }
        }
      } else {
        x = edge0 + side * F * 0.28;
        const act = pe.act;
        if (act === 'esperar' || act === 'wait') {
          const sway = { ...POSES.heart, tr: POSES.heart.tr + 0.03 * Math.sin(t * 1.4 + i) };
          pose = S.good ? sway : lerpPose(sway, POSES.heartLow, smooth((S.r - 0.3) / 0.5));
          const hh = 0;
          hearts.push({ i, hh });
        } else if (act === 'celular' || act === 'phone') pose = breathe(POSES.phone, t);
        else if (act === 'descansar' || act === 'sentarse') pose = POSES.floor;
        else pose = breathe(POSES.stand, t);
      }
      const fig = drawFigure(ctx, { x, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if (holding) plankAt(ctx, fig.fh, F, facing);
      if (pe.act === 'celular' || pe.act === 'phone') phoneAt(ctx, fig.fh, F);
      if (hearts.length && hearts[hearts.length - 1].i === i) {
        const hx = (fig.fh[0] + fig.bh[0]) / 2, hy = (fig.fh[1] + fig.bh[1]) / 2;
        const fade = (1 - NEUTRAL) * (S.good ? 1 : 1 - 0.5 * smooth((S.r - 0.3) / 0.6));
        if (!S.object) glow(ctx, hx, hy, F * 0.35, RED, 0.5 * fade);
        if (S.object) obj(ctx, S, hx, hy + F * 0.11, F * 0.24, { always: true });
        else heart(ctx, hx, hy - F * 0.01, F * 0.12 * (1 + 0.05 * Math.sin(t * 3)), fade > 0.6 ? RED : '#8E3A3D', fade);
      }
    }
    if (S.good) S.focus = [meet ? 0 : (bL ? gR - F * 0.3 : gL + F * 0.3), -F * 1.35];
    S.objSpot = [gL - F * 0.34, 0];
  },
};

// ---------------- ÁRBOL ----------------
const treeCache = new Map();
function buildTree(seed) {
  if (treeCache.has(seed)) return treeCache.get(seed);
  const R = rng(seed);
  const br = [];
  const leaves = [];
  const grow = (x, y, ang, len, depth, parentBirth) => {
    const birth = parentBirth + (depth === 0 ? 0 : 0.11 + R() * 0.04);
    const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len;
    const id = br.length;
    br.push({ x, y, ang, len, depth, birth });
    if (depth >= 2) {
      const n = depth >= 4 ? 4 : 2;
      for (let i = 0; i < n; i++) {
        leaves.push({
          b: id, f: 0.55 + R() * 0.45, ox: (R() - 0.5) * 0.12, oy: (R() - 0.5) * 0.12,
          rot: R() * Math.PI, birth: birth + 0.12 + R() * 0.1, fall: R() * 0.65, drift: (R() - 0.5),
        });
      }
    }
    if (depth < 4) {
      const kids = depth === 0 ? 2 : R() < 0.35 ? 3 : 2;
      for (let i = 0; i < kids; i++) {
        const spread = kids === 3 ? (i - 1) * 0.55 : (i ? 1 : -1) * (0.32 + R() * 0.25);
        grow(x2, y2, ang + spread + (R() - 0.5) * 0.15, len * (0.7 + R() * 0.08), depth + 1, birth);
      }
    }
  };
  grow(0, 0, 0, 1, 0, 0);
  const tree = { br, leaves };
  treeCache.set(seed, tree);
  return tree;
}

function drawTree(ctx, S, tx, g, decay) {
  const { F, t } = S;
  const tree = buildTree(S.seed % 7 + 3);
  const U = 0.42 * F;
  const pos = new Array(tree.br.length);
  // calcula posiciones con caída (droop) si se seca
  const vis = (b) => clamp((g - b.birth) / 0.16);
  const ends = [];
  for (let i = 0; i < tree.br.length; i++) {
    const b = tree.br[i];
    let ang = b.ang;
    if (decay > 0 && b.depth > 0) ang += Math.sign(b.ang || 0.01) * decay * 0.12 * b.depth;
    ang += Math.sin(t * 0.9 + b.depth) * 0.008 * b.depth;
    let x0 = b.x, y0 = b.y;
    // padre
    if (i > 0) {
      let pi = -1;
      for (let j = i - 1; j >= 0; j--) if (tree.br[j].depth === b.depth - 1) { pi = j; break; }
      if (pi >= 0) [x0, y0] = ends[pi];
    }
    const v = vis(b);
    const len = b.len * v;
    const x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
    ends[i] = [x1, y1];
    pos[i] = { x0, y0, x1, y1, v, depth: b.depth };
  }
  ctx.save();
  ctx.translate(tx, 0);
  // montículo
  setLine(ctx, F, 0.55, 0.8);
  ctx.beginPath();
  ctx.ellipse(0, 0, F * 0.22, F * 0.05, 0, Math.PI, 0);
  ctx.stroke();
  const ca = 1 - decay * 0.5;
  for (const pp of pos) {
    if (pp.v <= 0) continue;
    setLine(ctx, F, ca, Math.max(0.5, 1.9 - pp.depth * 0.35));
    line(ctx, pp.x0 * U, pp.y0 * U, pp.x1 * U, pp.y1 * U);
  }
  // hojas
  for (const lf of tree.leaves) {
    const p = pos[lf.b];
    const lv = clamp((g - lf.birth) / 0.12);
    if (lv <= 0 || p.v < 0.5) continue;
    let lx = (p.x0 + (p.x1 - p.x0) * lf.f + lf.ox) * U;
    let ly = (p.y0 + (p.y1 - p.y0) * lf.f + lf.oy) * U;
    let a = 0.88, rot = lf.rot;
    if (decay > 0) {
      const fk = clamp((decay - lf.fall) / 0.3);
      if (fk > 0) {
        const groundY = -F * 0.01;
        ly = lerp(ly, groundY, fk);
        lx += Math.sin(fk * 6 + lf.drift * 5) * F * 0.06 * (1 - fk) + lf.drift * F * 0.5 * fk;
        rot += fk * 4;
        a = 0.88 - 0.55 * fk;
      }
    }
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.globalAlpha = a * lv;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(0, 0, F * 0.034 * lv, F * 0.017 * lv, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  return { pos, U, tree };
}

SCENES.arbol = {
  events(S) {
    const ev = [];
    const act = S.people[0]?.act;
    for (let k = 0; k < S.C; k++) {
      if (act === 'regar' || act === 'cuidar') ev.push({ p: (k + 0.5) / S.C, type: 'drip' });
      else if (act === 'orar') ev.push({ p: (k + 0.3) / S.C, type: 'ping', vol: 0.5 });
      else if (act === 'orar-domingo') ev.push({ p: (k + 0.08) / S.C, type: 'ping', vol: 0.35 });
    }
    if (S.good) ev.push({ r: 0.4, type: 'chime' });
    else ev.push({ r: 0.05, type: 'wind' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const tx = w * 0.15;
    const g = 0.12 + 0.88 * smooth(S.p);
    const decay = S.good || S.bad === 'stall' ? 0 : clamp(S.r * 0.95);
    const tr = drawTree(ctx, S, tx, g, decay);
    S.focus = [tx, -F * 0.95];
    S.objSpot = [tx + F * 0.45, 0];
    // frutos rojos al final del camino bueno
    if (S.good && S.r > 0.3) {
      const k = smooth((S.r - 0.3) / 0.4);
      const tips = tr.pos.filter((p) => p.depth === 3).slice(0, 4);
      tips.forEach((p, i) => {
        const fx = tx + p.x1 * tr.U, fy = p.y1 * tr.U + F * 0.03;
        glow(ctx, fx, fy, F * 0.12 * k, RED, 0.6);
        ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = RED;
        ctx.beginPath(); ctx.arc(fx, fy, F * 0.022 * k * (1 + 0.04 * Math.sin(t * 3 + i)), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
    S.people.forEach((pe, i) => {
      const cy = cycle(S.p, S.C);
      let x = -w * 0.2 - i * F * 0.55, pose, facing = 1;
      const act = pe.act;
      let can = false;
      if (act === 'orar' || act === 'pray') {
        pose = breathe(POSES.pray, t, 1.4);
        if (S.r > 0) pose = S.good ? lerpPose(pose, POSES.praiseK, resultBlend(S, 0.15, 0.6)) : lerpPose(pose, { ...POSES.pray, hd: 0.85, tr: 0.2 }, resultBlend(S));
      } else if (act === 'orar-domingo') {
        const pr = cy.done ? 0 : bump(cy.ph, 0.02, 0.2, 0.06);
        pose = lerpPose(breathe(POSES.phone, t), breathe(POSES.pray, t), pr);
        if (S.r > 0) pose = lerpPose(pose, POSES.slump, resultBlend(S));
      } else if (act === 'regar' || act === 'cuidar' || act === 'water') {
        x = tx - F * 0.55 - i * F * 0.5;
        can = true;
        const pour = cy.done ? 0 : bump(cy.ph, 0.3, 0.75, 0.12);
        pose = lerpPose(POSES.water, { ...POSES.water, fa1: 1.25, fa2: 1.9 }, pour);
        if (S.r > 0) { can = S.r < 0.3; pose = S.good ? lerpPose(pose, POSES.look, resultBlend(S)) : lerpPose(pose, POSES.slump, resultBlend(S)); }
        S._pour = pour;
      } else if (act === 'dormir' || act === 'sleep') {
        pose = breathe({ ...POSES.floor, hd: 0.9 }, t * 0.6, 2);
      } else if (act === 'celular' || act === 'phone' || act === 'ignorar') {
        pose = breathe(POSES.phone, t);
        if (S.r > 0.2) pose = lerpPose(pose, POSES.slump, resultBlend(S, 0.2, 0.7));
      } else {
        pose = breathe(POSES.stand, t);
        if (S.r > 0) pose = S.good ? lerpPose(pose, POSES.look, resultBlend(S)) : lerpPose(pose, POSES.slump, resultBlend(S));
      }
      const fig = drawFigure(ctx, { x, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if ((act === 'celular' || act === 'phone' || act === 'ignorar' || act === 'orar-domingo') && !(S.r > 0.5)) {
        const pr = act === 'orar-domingo' ? (cy.done ? 0 : bump(cy.ph, 0.02, 0.2, 0.06)) : 0;
        if (pr < 0.5) phoneAt(ctx, fig.fh, F, 1 - pr * 2);
      }
      if ((act === 'orar' || act === 'pray') && S.good) glow(ctx, fig.head[0] + F * 0.1, fig.head[1], F * 0.4, AMBER, 0.25 + 0.15 * Math.sin(t * 1.5));
      if (can && NEUTRAL < 0.5) {
        const h = fig.fh;
        setLine(ctx, F, 0.95, 0.8);
        ctx.save();
        ctx.translate(h[0], h[1]);
        ctx.rotate((S._pour || 0) * 0.6);
        ctx.strokeRect(-F * 0.02, -F * 0.01, F * 0.09, F * 0.08);
        line(ctx, F * 0.07, F * 0.01, F * 0.16, -F * 0.04);
        ctx.restore();
        if ((S._pour || 0) > 0.5) {
          ctx.save(); ctx.fillStyle = WHITE;
          const sx = h[0] + F * 0.17, sy = h[1] + F * 0.02;
          for (let d = 0; d < 6; d++) {
            const q = frac(t * 2.2 + d / 6);
            ctx.globalAlpha = 0.7 * (1 - q);
            ctx.beginPath(); ctx.arc(sx + q * F * 0.1, sy + q * (-sy), F * 0.008, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      }
    });
  },
};

// ---------------- ALCANCÍA ----------------
SCENES.alcancia = {
  events(S) {
    const ev = [];
    const act = S.people[0]?.act;
    for (let k = 0; k < S.C; k++) {
      if (act === 'gastar' || act === 'spend') ev.push({ p: (k + 0.35) / S.C, type: 'coinOut' }, { p: (k + 0.72) / S.C, type: 'bag' });
      else ev.push({ p: (k + 0.7) / S.C, type: 'ting' });
    }
    if (S.good) ev.push({ r: 0.35, type: 'chime' });
    else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const jx = w * 0.12, jw = F * 0.36, jh = F * 0.48;
    const pe = S.people[0] || { kind: 'hombre', act: 'ahorrar' };
    const spend = pe.act === 'gastar' || pe.act === 'spend';
    const idle = pe.act === 'celular' || pe.act === 'descansar';
    const cy = cycle(S.p, S.C);
    let fill;
    if (spend) fill = 0.62 * (1 - Math.min(S.C, Math.floor(cy.c + 0.65)) / S.C);
    else if (idle) fill = 0.05;
    else fill = Math.min(S.C, Math.floor(cy.c + 0.3)) / S.C;
    if (!S.good && !spend && S.bad === 'decay') fill *= 1 - smooth(S.r);
    // brillo dorado si va bien
    if (S.good && S.r > 0) glow(ctx, jx, -jh * 0.5, F * 0.9 * smooth(S.r), GOLD, 0.7);
    // monedas dentro
    ctx.save();
    ctx.beginPath(); ctx.rect(jx - jw / 2 + 3, -jh, jw - 6, jh); ctx.clip();
    const rows = Math.round(fill * 13);
    setLine(ctx, F, 0.85, 0.6);
    for (let rI = 0; rI < rows; rI++) {
      for (let c = 0; c < 3; c++) {
        const cx = jx - jw * 0.3 + c * jw * 0.3 + ((rI % 2) * jw * 0.15) - jw * 0.07;
        const cyy = -F * 0.03 - rI * jh * 0.068;
        ctx.beginPath(); ctx.ellipse(cx, cyy, jw * 0.13, F * 0.016, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
    // frasco
    setLine(ctx, F, 0.95, 0.9);
    ctx.beginPath();
    ctx.moveTo(jx - jw * 0.38, -jh); ctx.lineTo(jx - jw * 0.38, -jh * 0.94);
    ctx.quadraticCurveTo(jx - jw * 0.52, -jh * 0.88, jx - jw * 0.5, -jh * 0.7);
    ctx.lineTo(jx - jw * 0.5, -F * 0.02); ctx.quadraticCurveTo(jx - jw * 0.5, 0, jx - jw * 0.42, 0);
    ctx.lineTo(jx + jw * 0.42, 0); ctx.quadraticCurveTo(jx + jw * 0.5, 0, jx + jw * 0.5, -F * 0.02);
    ctx.lineTo(jx + jw * 0.5, -jh * 0.7); ctx.quadraticCurveTo(jx + jw * 0.52, -jh * 0.88, jx + jw * 0.38, -jh * 0.94);
    ctx.lineTo(jx + jw * 0.38, -jh);
    ctx.stroke();
    line(ctx, jx - jw * 0.42, -jh, jx + jw * 0.42, -jh);
    // brote dorado del ahorro
    if (S.good && S.r > 0.2) {
      const k = smooth((S.r - 0.2) / 0.5);
      setLine(ctx, F, 0.95, 0.8);
      const top = -jh - F * 0.32 * k;
      S.focus = [jx, top - F * 0.3];
      line(ctx, jx, -jh + F * 0.02, jx, top);
      ctx.save(); ctx.fillStyle = WHITE;
      ctx.beginPath(); ctx.ellipse(jx - F * 0.05, top + F * 0.08, F * 0.05 * k, F * 0.02 * k, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(jx + F * 0.05, top + F * 0.12, F * 0.05 * k, F * 0.02 * k, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      glow(ctx, jx, top, F * 0.25 * k, GOLD, 1);
      ctx.save(); ctx.fillStyle = GOLD; ctx.globalAlpha = k;
      ctx.beginPath(); ctx.arc(jx, top, F * 0.035 * k, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // bolsas de compras (gastar)
    const px = jx - F * 0.5;
    if (spend) {
      const nb = Math.min(S.C, Math.floor(cy.c + 0.28));
      const fade = S.r > 0 ? 1 - smooth(S.r / 0.7) : 1;
      setLine(ctx, F, 0.75 * fade, 0.7);
      for (let i = 0; i < Math.min(nb, 6); i++) {
        const bx = px - F * 0.35 - (i % 3) * F * 0.15, by = -Math.floor(i / 3) * F * 0.16;
        ctx.strokeRect(bx - F * 0.06, by - F * 0.14, F * 0.12, F * 0.14);
        ctx.beginPath(); ctx.arc(bx, by - F * 0.14, F * 0.03, Math.PI, 0); ctx.stroke();
      }
    }
    // persona
    let pose, coin = null;
    if (idle) pose = breathe(POSES.phone, t);
    else if (!cy.done) {
      if (!spend) {
        const up = smooth(cy.ph / 0.4) * (1 - smooth((cy.ph - 0.62) / 0.3));
        pose = lerpPose(breathe(POSES.stand, t), POSES.drop, up);
        if (cy.ph < 0.5) coin = 'hand';
        else if (cy.ph < 0.7) coin = 'fall';
      } else {
        const up = smooth(cy.ph / 0.25) * (1 - smooth((cy.ph - 0.35) / 0.2));
        pose = lerpPose(breathe(POSES.stand, t), POSES.drop, up);
        if (cy.ph > 0.35 && cy.ph < 0.72) coin = 'toss';
      }
    } else pose = breathe(POSES.stand, t);
    if (S.r > 0) pose = S.good ? lerpPose(pose, POSES.look, resultBlend(S)) : lerpPose(pose, POSES.slump, resultBlend(S));
    const fig = drawFigure(ctx, { x: px, pose, F, facing: 1, kind: pe.kind, pe: pe, alpha: personDim(S) });
    S.people.slice(1, 3).forEach((p2, j) => companion(ctx, S, p2, jx + F * (0.45 + j * 0.4), -1, { kind: p2.act === 'gastar' ? 'stand' : 'drop', phase: 0.5 }));
    if (S.good) S.focus = S.focus || [jx, -jh - F * 0.6];
    if (NEUTRAL > 0.5) coin = null;
    if (S.object && idle) S.objSpot = [jx, -jh - F * 0.02];
    if (idle && S.r < 0.5) phoneAt(ctx, fig.fh, F);
    if (coin) {
      setLine(ctx, F, 1, 0.8);
      let cx = fig.fh[0], cyy = fig.fh[1];
      if (coin === 'fall') {
        const k = (cy.ph - 0.5) / 0.2;
        cx = lerp(fig.fh[0], jx, 0.7);
        cyy = lerp(-jh - F * 0.05, -F * 0.03 - Math.max(0, Math.round(fill * 13) - 1) * jh * 0.068, k * k);
      } else if (coin === 'toss') {
        const k = (cy.ph - 0.35) / 0.37;
        cx = lerp(fig.fh[0], px - F * 0.4, k);
        cyy = lerp(fig.fh[1], -F * 0.1, k) - Math.sin(k * Math.PI) * F * 0.35;
      }
      if (S.object) obj(ctx, S, cx, cyy + F * 0.06, F * 0.13);
      else { ctx.beginPath(); ctx.ellipse(cx, cyy, F * 0.03, F * 0.03, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
  },
};

// ---------------- CASA (ladrillos) ----------------
SCENES.casa = {
  plan(S) {
    const bpc = Math.max(1, Math.round(12 / S.C));
    const total = bpc * S.C;
    return { bpc, total, cols: 3, rows: Math.ceil(total / 3) };
  },
  built(S, pe) {
    const act = pe.act;
    if (BUILD.has(act)) return 1;
    if (act === 'descansar' || act === 'rest') return 0.3;
    return 0.1;
  },
  events(S) {
    const { bpc } = this.plan(S);
    const pe = S.people[0] || { act: 'construir' };
    const frac0 = this.built(S, pe);
    const ev = [];
    const n = Math.round(S.C * frac0);
    for (let k = 0; k < n; k++) for (let j = 0; j < bpc; j++) ev.push({ p: (k + 0.62 + j * 0.08) / S.C, type: 'tock', detune: 1 + j * 0.06 });
    if (S.good) ev.push({ r: 0.5, type: 'chime' });
    else if (S.bad === 'fall') ev.push({ r: 0.08, type: 'crash' });
    else ev.push({ r: 0.35, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const { bpc, total, cols, rows } = this.plan(S);
    const bw = F * 0.19, bh = Math.min(F * 0.1, (F * 0.75) / rows);
    const wx = w * (S.people.length > 1 ? 0.02 : 0.14), wl = wx - (cols * bw) / 2;
    const pe = S.people[0] || { kind: 'hombre', act: 'construir' };
    const share = this.built(S, pe);
    const C = S.C;
    const workC = Math.round(C * share);
    const cy = cycle(S.p * (C / Math.max(1, workC)), workC);
    const working = share >= 0.3 && !cy.done && workC > 0;
    let placed = Math.min(workC * bpc, cy.done ? workC * bpc : cy.k * bpc + Math.max(0, Math.min(bpc, Math.floor((cy.ph - 0.62) / 0.08) + 1)));
    if (!(share >= 0.3)) placed = Math.min(placed, 2);
    const R = rng(S.seed + 11);
    const fallK = S.bad === 'fall' ? S.r : 0;
    setLine(ctx, F, 0.92, 0.75);
    for (let i = 0; i < placed; i++) {
      const row = Math.floor(i / cols), col = i % cols;
      const off = row % 2 ? bw * 0.25 : 0;
      let bx = wl + col * bw + off, by = -(row + 1) * bh;
      const dx = (R() - 0.3) * F * 0.9, rot = (R() - 0.5) * 2.5, dl = R() * 0.15 + row * 0.03;
      ctx.save();
      if (fallK > 0) {
        const k = clamp((fallK - dl) / 0.45);
        const lie = -bh * 0.5 - Math.floor(R() * 2) * bh;
        bx += dx * k;
        by = lerp(by, lie, k * k);
        ctx.translate(bx + bw / 2, by + bh / 2);
        ctx.rotate(rot * k);
        ctx.translate(-(bx + bw / 2), -(by + bh / 2));
      }
      if (!S.good && S.bad !== 'tired') {
        // ladrillos rectos pero desalineados: unos un poco más arriba y otros más abajo,
        // cada vez más desparejos (la diferencia crece) hasta que la pared se cae
        const q = (i / Math.max(1, total - 1)) * smooth(S.r / 0.35);
        const dir = (i + row) % 2 ? 1 : -1;
        ctx.translate(0, dir * q * bh * (0.18 + 0.17 * R()));
      }
      ctx.strokeRect(bx + 1.5, by + 1.5, bw - 3, bh - 3);
      ctx.restore();
    }
    const wallTop = -Math.ceil(placed / cols) * bh;
    // techo, puerta y ventana cálida
    if (S.good && S.r > 0) {
      const k = smooth(S.r / 0.4);
      const left = wl - bw * 0.25, right = wl + cols * bw + bw * 0.5;
      const top = -rows * bh;
      const peak = top - F * 0.3;
      const mid = (left + right) / 2;
      S.focus = [mid, peak - F * 0.3];
      setLine(ctx, F, 0.95, 0.9);
      ctx.beginPath();
      ctx.moveTo(left, top); ctx.lineTo(lerp(left, mid, k), lerp(top, peak, k));
      ctx.moveTo(right, top); ctx.lineTo(lerp(right, mid, k), lerp(top, peak, k));
      ctx.stroke();
      const wk = smooth((S.r - 0.35) / 0.4);
      if (wk > 0) {
        const wxx = mid, wyy = top * 0.55;
        glow(ctx, wxx, wyy, F * 0.6 * wk, AMBER, 0.9);
        ctx.save(); ctx.globalAlpha = wk; ctx.fillStyle = AMBER;
        ctx.fillRect(wxx - F * 0.045, wyy - F * 0.045, F * 0.09, F * 0.09);
        ctx.restore();
      }
    }
    // persona
    let x = wl - F * 0.3, pose, holding = false;
    if (working) {
      const nextRow = Math.floor((cy.k * bpc) / cols);
      const high = -(nextRow + 1) * bh < -F * 0.33;
      pose = workPose(cy.ph, t, high);
      holding = cy.ph < 0.62 || cy.ph > 0.93;
    } else if (share >= 1) pose = breathe(POSES.stand, t);
    else if (pe.act === 'descansar' || pe.act === 'rest') { pose = breathe(POSES.floorPhone, t); x = wl - F * 0.55; }
    else pose = breathe(POSES.phone, t);
    if (S.r > 0) {
      if (S.good) pose = lerpPose(pose, S.r > 0.6 ? POSES.armsUp : POSES.look, resultBlend(S, 0, 0.6));
      else if (pe.act === 'descansar' || pe.act === 'rest') pose = lerpPose(pose, { ...POSES.floor, hd: 0.9 }, resultBlend(S));
      else pose = lerpPose(pose, POSES.slump, resultBlend(S));
    }
    const wr = wl + cols * bw + bw * 0.25;
    S.objSpot = [wl - F * 0.66, 0];
    S.people.slice(1, 3).forEach((p2, j) => companion(ctx, S, p2, wr + F * (0.32 + j * 0.42), -1, { kind: BUILD.has(p2.act) && (share >= 1 || !S.good) ? 'work' : 'stand' }));
    const fig = drawFigure(ctx, { x, pose, F, facing: 1, kind: pe.kind, pe: pe, alpha: personDim(S) });
    if (holding && NEUTRAL < 0.5) { setLine(ctx, F, 1, 0.75); ctx.strokeRect(fig.fh[0] - bw / 2 + F * 0.03, fig.fh[1] - bh * 0.6, bw - 3, bh - 3); }
    if ((pe.act === 'celular' || pe.act === 'descansar' || pe.act === 'gastar') && !working && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    void wallTop;
  },
};

// ---------------- ESCALERA ----------------
SCENES.escalera = {
  K: 7,
  events(S) {
    const ev = [];
    const climbs = S.people.some((p) => p.act === 'subir' || p.act === 'climb');
    const maxS = this.K;
    const steps = climbs ? Math.floor(maxS) : 0;
    for (let k = 0; k < steps; k++) ev.push({ p: (k + 0.75) / maxS, type: 'step' });
    if (S.good) ev.push({ r: 0.3, type: 'chime' });
    else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    const K = this.K;
    const x0 = -w * 0.3, sw = (w * 0.62) / K, sh = F * 0.08;
    groundMass(ctx, F, 0, 0, () => {
      ctx.moveTo(-w / 2, 0); ctx.lineTo(x0, 0);
      for (let i = 1; i <= K; i++) { ctx.lineTo(x0 + (i - 1) * sw, -i * sh); ctx.lineTo(x0 + i * sw, -i * sh); }
      ctx.lineTo(x0 + K * sw, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, F * 1.4); ctx.lineTo(-w / 2, F * 1.4);
    });
    groundLine(ctx, F, -w / 2, x0, 0.55, false);
    setLine(ctx, F, 0.85, 0.85);
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    for (let i = 1; i <= K; i++) { ctx.lineTo(x0 + (i - 1) * sw, -i * sh); ctx.lineTo(x0 + i * sw, -i * sh); }
    ctx.lineTo(x0 + K * sw, 0);
    ctx.stroke();
    groundLine(ctx, F, x0 + K * sw, w / 2, 0.4, false);
    // estrella en lo alto
    const sx = x0 + K * sw + sw * 0.2, sy = -K * sh - F * 1.0;
    const shine = S.good ? 0.45 + 0.55 * smooth(S.r / 0.5) : 0.45 * (1 - 0.6 * smooth(S.r / 0.6));
    if (S.good) S.focus = [sx, sy];
    glow(ctx, sx, sy, F * (0.35 + 0.5 * shine), GOLD, shine);
    if (S.object) obj(ctx, S, sx, sy + F * 0.2, F * 0.36, { always: true });
    else if (!(S.good && S.r > 0.5)) star(ctx, sx, sy, F * (0.05 + 0.03 * shine) * (1 + 0.04 * Math.sin(t * 2)), shine > 0.3 ? GOLD : '#8a7a4a', 0.5 + 0.5 * shine);

    S.people.forEach((pe, i) => {
      const act = pe.act;
      let pose, x, y = 0, facing = 1;
      if (act === 'subir' || act === 'climb') {
        const maxS = K;
        const s = smooth(S.p) * 0 + S.p * maxS;
        const k = Math.floor(s), ph = s - k;
        const off = i * Math.max(sw * 0.9, F * 0.3);
        x = x0 + (s - 0.5) * sw - off;
        const sNow = Math.max(0, (x - x0) / sw + 0.5);
        const kk = Math.min(K, Math.floor(sNow));
        y = -sh * (kk + smooth((frac(sNow) - 0.55) / 0.35));
        if (sNow >= K) y = -K * sh;
        if (x < x0) y = 0;
        pose = S.p >= 1 ? breathe(POSES.stand, t) : walkPose(s * Math.PI);
        void ph;
        if (S.r > 0) pose = S.good ? lerpPose(POSES.stand, POSES.armsUp, resultBlend(S, 0.1, 0.5)) : lerpPose(POSES.stand, S.r > 0.5 ? POSES.slump : POSES.lookBack, resultBlend(S));
        if (!S.good && S.r > 0.3) facing = -1;
      } else {
        x = Math.max(-w / 2 + F * 0.22, x0 - F * 0.42 - i * F * 0.4);
        pose = breathe(POSES.floorPhone, t);
        if (S.r > 0.3) pose = lerpPose(pose, { ...POSES.floor, hd: -0.2 }, resultBlend(S, 0.3, 0.6));
      }
      const fig = drawFigure(ctx, { x, y, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if (!(act === 'subir' || act === 'climb') && S.r < 0.35) phoneAt(ctx, fig.fh, F);
    });
  },
};

// ---------------- MESA ----------------
SCENES.mesa = {
  events(S) {
    const ev = [];
    const phones = S.people.some((p) => p.act === 'celular' || p.act === 'phone');
    for (let k = 0; k < S.C; k++) if (phones) ev.push({ p: (k + 0.5) / S.C, type: 'blip' });
    if (S.good) ev.push({ r: 0.35, type: 'chime' }, { r: 0.35, type: 'heartbeat' });
    else ev.push({ r: 0.15, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const n = S.people.length;
    const scale = n > 2 ? 0.88 : 1;
    const FF = F * scale;
    const tw = FF * 1.0, th = FF * 0.36;
    const apart = !S.good ? smooth(S.r / 0.8) * FF * 0.22 : 0;
    // lámpara
    const lampOn = (0.35 + 0.5 * smooth(S.p)) * (S.good ? 1 + 0.15 * S.r : 1 - smooth(S.r / 0.4));
    const ly = -FF * 1.25;
    setLine(ctx, F, 0.5, 0.6);
    line(ctx, 0, ly - FF * 0.6, 0, ly);
    setLine(ctx, F, 0.9, 0.8);
    ctx.beginPath(); ctx.moveTo(-FF * 0.09, ly + FF * 0.07); ctx.lineTo(-FF * 0.04, ly); ctx.lineTo(FF * 0.04, ly); ctx.lineTo(FF * 0.09, ly + FF * 0.07); ctx.closePath(); ctx.stroke();
    glow(ctx, 0, ly + FF * 0.25, FF * 1.1, AMBER, lampOn * 0.8);
    // mesa (se parte si se alejan)
    setLine(ctx, F, 0.95, 1);
    const gapM = apart * 0.5;
    line(ctx, -tw / 2 - apart * 0.5, -th, -gapM, -th);
    line(ctx, gapM, -th, tw / 2 + apart * 0.5, -th);
    line(ctx, -tw / 2 + FF * 0.08 - apart * 0.5, -th, -tw / 2 + FF * 0.08 - apart * 0.5, 0);
    line(ctx, tw / 2 - FF * 0.08 + apart * 0.5, -th, tw / 2 - FF * 0.08 + apart * 0.5, 0);
    const seats = [];
    S.people.forEach((pe, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const slot = Math.floor(i / 2);
      seats.push({ pe, side, x: side * (tw / 2 + FF * 0.24 + slot * FF * 0.48) + side * apart });
    });
    for (const s of seats) {
      const { pe, side } = s;
      const H = figureSize(pe.kind, FF);
      const seatY = -0.245 * H * 0.98;
      // silla
      setLine(ctx, F, 0.6, 0.7);
      const cx = s.x + side * H * 0.02;
      line(ctx, cx - FF * 0.12, seatY, cx + FF * 0.12, seatY);
      line(ctx, cx + side * FF * 0.12, seatY, cx + side * FF * 0.12, seatY - FF * 0.32);
      line(ctx, cx - FF * 0.1, seatY, cx - FF * 0.1, 0);
      line(ctx, cx + FF * 0.1, seatY, cx + FF * 0.1, 0);
      let pose;
      const act = pe.act;
      if (act === 'celular' || act === 'phone') pose = breathe(POSES.sitPhone, t + s.x);
      else {
        const g = 0.5 + 0.5 * Math.sin(t * 2.2 + s.x * 0.05);
        pose = { ...POSES.sitTalk, fa1: 0.5 + 0.45 * g, fa2: 1.5 + 0.5 * g, hd: -0.05 + 0.1 * Math.sin(t * 1.3 + s.x) };
      }
      if (S.r > 0) pose = S.good ? lerpPose(pose, POSES.sitReach, resultBlend(S, 0.1, 0.5)) : lerpPose(pose, POSES.sitSlump, resultBlend(S));
      const fig = drawFigure(ctx, { x: s.x, pose, F: FF, facing: -side, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if ((act === 'celular' || act === 'phone') && S.r < 0.6) phoneAt(ctx, fig.fh, FF);
    }
    if (S.good) S.focus = [0, -th - FF * 0.55];
    S.objSpot = [0, -th - F * 0.005];
  },
};

// ---------------- FOGATA ----------------
function flame(ctx, x, y, size, F, t, a = 1) {
  if (size <= 0.01) return;
  const h = F * 0.55 * size, wd = F * 0.2 * Math.sqrt(size);
  glow(ctx, x, y - h * 0.4, F * (0.4 + 1.1 * size), FLAME, 0.7 * a);
  const layers = [[FLAME, 1, 0.85], ['#FFB25C', 0.7, 0.9], ['#FFE3A6', 0.4, 0.95]];
  for (const [col, sc, al] of layers) {
    const fl = 1 + 0.08 * Math.sin(t * 9 + sc * 3) + 0.05 * Math.sin(t * 13.7 + sc);
    const hh = h * sc * fl, ww = wd * sc;
    const sway = Math.sin(t * 3.1 + sc * 2) * ww * 0.25;
    ctx.save();
    ctx.globalAlpha = al * a;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - ww, y);
    ctx.bezierCurveTo(x - ww * 1.05, y - hh * 0.45, x - ww * 0.2 + sway, y - hh * 0.7, x + sway, y - hh);
    ctx.bezierCurveTo(x + ww * 0.2 + sway, y - hh * 0.7, x + ww * 1.05, y - hh * 0.45, x + ww, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
SCENES.fogata = {
  events(S) {
    const ev = [];
    const tends = S.people.filter((p) => p.act === 'cuidar').length;
    for (let k = 0; k < S.C && tends; k++) ev.push({ p: (k + 0.6) / S.C, type: 'crackle' });
    if (S.good) ev.push({ r: 0.3, type: 'chime' });
    else ev.push({ r: 0.05, type: 'wind' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const fx = 0;
    const cy = cycle(S.p, S.C);
    const tends = S.people.filter((p) => p.act === 'cuidar').length;
    let size = 0.4 + 0.5 * smooth(S.p);
    if (S.good) size += 0.12 * S.r;
    else size *= 1 - smooth(S.r / 0.6);
    if (tends && !cy.done && cy.ph > 0.6) size += 0.1 * (1 - smooth((cy.ph - 0.6) / 0.35));
    // leña
    setLine(ctx, F, 0.9, 1.1);
    line(ctx, fx - F * 0.17, -F * 0.01, fx + F * 0.14, -F * 0.07);
    line(ctx, fx + F * 0.17, -F * 0.01, fx - F * 0.14, -F * 0.07);
    const sticks = tends ? Math.min(S.C, Math.floor(cy.c + 0.4)) : 0;
    setLine(ctx, F, 0.55, 0.7);
    for (let i = 0; i < Math.min(sticks, 8); i++) {
      const a = -0.6 + i * 0.17;
      line(ctx, fx + Math.sin(a) * F * 0.2, -F * 0.005, fx + Math.sin(a) * F * 0.06, -F * 0.08);
    }
    flame(ctx, fx, -F * 0.05, size, F, t);
    if (S.good) S.focus = [fx, -F * 1.0];
    S.objSpot = [fx - F * 0.34, 0];
    // chispas o humo
    if (S.good || S.r === 0) {
      ctx.save(); ctx.fillStyle = '#FFD08A';
      for (let i = 0; i < 9; i++) {
        const q = frac(t * 0.35 + i / 9);
        ctx.globalAlpha = (1 - q) * 0.8 * size;
        ctx.beginPath();
        ctx.arc(fx + Math.sin(i * 7.3 + q * 6) * F * 0.12, -F * 0.15 - q * F * 1.0, F * 0.008, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      const sm = smooth(S.r);
      setLine(ctx, F, 0.25 * sm, 0.6);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let k = 0; k <= 20; k++) {
          const yy = -F * 0.1 - k * F * 0.04;
          const xx = fx + Math.sin(k * 0.45 + t * 1.2 + i * 2) * F * 0.06 * (1 + k * 0.05) + i * F * 0.03;
          k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      if (size < 0.05) {
        const em = 0.5 + 0.5 * Math.sin(t * 2);
        glow(ctx, fx, -F * 0.03, F * 0.15, FLAME, 0.4 * em * (1 - S.r * 0.6));
      }
    }
    // personas
    S.people.forEach((pe, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const facing = -side;
      let x = fx + side * F * (0.6 + Math.floor(i / 2) * 0.45);
      let pose, holding = false, phone = false;
      const act = pe.act;
      if (act === 'cuidar') {
        if (!cy.done) {
          const work = bump(cy.ph, 0.3, 0.72, 0.15);
          pose = lerpPose(breathe(POSES.sit, t), POSES.crouch, work);
          holding = cy.ph < 0.6;
          x = fx + side * F * (0.6 - 0.12 * work);
        } else pose = breathe(POSES.sit, t);
        if (S.r > 0) pose = S.good ? lerpPose(pose, POSES.sitReach, resultBlend(S)) : lerpPose(pose, POSES.sitSlump, resultBlend(S));
      } else if (act === 'alejarse') {
        x = fx + side * (F * 0.6 + smooth(S.p) * (w * 0.5 - F * 0.75));
        pose = S.p < 1 ? walkDist(smooth(S.p) * (w * 0.5 - F * 0.75), F) : POSES.stand;
        if (S.r > 0) pose = lerpPose(POSES.stand, POSES.cold, resultBlend(S));
        drawFigure(ctx, { x, pose, F, facing: side, kind: pe.kind, pe: pe, alpha: personDim(S) * (1 - 0.35 * smooth(S.p)) });
        return;
      } else {
        pose = breathe(POSES.sitPhone, t + i);
        phone = S.r < 0.5;
        if (S.r > 0.3) pose = lerpPose(pose, { ...POSES.cold, ...{ fl1: POSES.sit.fl1, fl2: POSES.sit.fl2, bl1: POSES.sit.bl1, bl2: POSES.sit.bl2 } }, resultBlend(S, 0.3, 0.7));
      }
      const sitting = pose.fl1 > 0.8;
      if (sitting) {
        // tronco para sentarse
        const H = figureSize(pe.kind, F);
        setLine(ctx, F, 0.55, 0.8);
        ctx.strokeRect(x - F * 0.13, -0.24 * H, F * 0.26, 0.24 * H);
      }
      const fig = drawFigure(ctx, { x, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if (holding && NEUTRAL < 0.5) { setLine(ctx, F, 1, 0.9); line(ctx, fig.fh[0] - F * 0.08, fig.fh[1], fig.fh[0] + F * 0.08, fig.fh[1] - F * 0.03); }
      if (phone) phoneAt(ctx, fig.fh, F);
    });
  },
};

// ---------------- CAMINO (colina) ----------------
SCENES.camino = {
  events(S) {
    const ev = [];
    const pe = S.people[0] || { act: 'caminar' };
    if (pe.act !== 'sentarse') for (let k = 0; k < S.C * 2; k++) ev.push({ p: (k + 0.5) / (S.C * 2), type: 'step', vol: 0.6 });
    if (pe.act === 'levantarse' || pe.act === 'caer') ev.push({ p: 0.45, type: 'thud' });
    if (S.good) ev.push({ r: 0.35, type: 'chime' });
    else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    const xs = -w * 0.12, xe = w * 0.3, Hh = F * 0.5;
    const hill = (x) => (x <= xs ? 0 : x >= xe ? -Hh : -Hh * smooth((x - xs) / (xe - xs)));
    // sol que amanece tras la cima
    const sunK = S.good ? smooth(S.r / 0.7) : 0;
    if (sunK > 0) {
      const sx = xe + w * 0.08, sy = -Hh + F * 0.15 - sunK * F * 0.45;
      glow(ctx, sx, sy, F * 1.3 * sunK, GOLD, 0.8);
      ctx.save(); ctx.fillStyle = GOLD; ctx.globalAlpha = 0.9 * sunK;
      ctx.beginPath(); ctx.arc(sx, sy, F * 0.13, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // colina (rellena de negro para ocultar el sol)
    ctx.save();
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    for (let x = -w / 2; x <= w / 2; x += 6) ctx.lineTo(x, hill(x));
    ctx.lineTo(w / 2, F * 0.6); ctx.lineTo(-w / 2, F * 0.6);
    ctx.closePath(); ctx.fill(); ctx.restore();
    groundMass(ctx, F, 0, 0, () => { ctx.moveTo(-w / 2, 0); for (let x = -w / 2; x <= w / 2; x += 6) ctx.lineTo(x, hill(x)); ctx.lineTo(w / 2, F * 1.4); ctx.lineTo(-w / 2, F * 1.4); });
    setLine(ctx, F, 0.6, 0.8);
    ctx.beginPath();
    for (let x = -w / 2; x <= w / 2; x += 6) x === -w / 2 ? ctx.moveTo(x, hill(x)) : ctx.lineTo(x, hill(x));
    ctx.stroke();
    // bandera en la cima
    const fxp = xe + w * 0.1;
    if (S.good) S.focus = [xe + w * 0.03, -Hh - F * 1.3];
    S.objSpot = [Math.min(xe + w * 0.1 + F * 0.22, w / 2 - F * 0.13), -Hh];
    setLine(ctx, F, 0.85, 0.8);
    line(ctx, fxp, -Hh, fxp, -Hh - F * 0.4);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(fxp, -Hh - F * 0.4); ctx.lineTo(fxp + F * 0.15 * (1 + 0.04 * Math.sin(t * 3)), -Hh - F * 0.34); ctx.lineTo(fxp, -Hh - F * 0.28); ctx.closePath();
    if (S.good && S.r > 0.3) { ctx.fillStyle = RED; ctx.globalAlpha = smooth((S.r - 0.3) / 0.3); ctx.fill(); }
    ctx.restore();
    ctx.stroke();
    // caminantes (el segundo va un poco detrás)
    const list = S.people.length ? S.people.slice(0, 3) : [{ kind: 'hombre', act: 'caminar' }];
    for (let j = list.length - 1; j >= 0; j--) this.walker(ctx, S, list[j], j, hill, xe);
  },
  walker(ctx, S, pe, j, hill, xe) {
    const { w, F, t } = S;
    // bici: «montar-bici», o caer/levantarse cuando el guion habla de bicicleta (o caer-bici / levantarse-bici)
    let act = pe.act;
    const bike = act === 'montar-bici' || act === 'caer-bici' || act === 'levantarse-bici' || ((act === 'caer' || act === 'levantarse') && S.object === 'bicicleta');
    if (act === 'caer-bici') act = 'caer';
    if (act === 'levantarse-bici') act = 'levantarse';
    // con el arco de los dos caminos, la caída es la común: el resto del camino se recorre igual
    if (S.arc) act = bike ? 'montar-bici' : act === 'levantarse' || act === 'caer' ? 'correr' : act;
    if (bike) S.objHand = true;
    const run = act === 'correr' || act === 'levantarse' || act === 'caer' || bike;
    const lag = j * F * 0.38;
    const start = -w * 0.42 + (j ? F * 0.05 : 0), end = xe + w * 0.03 - lag;
    let x, pose;
    if (act === 'sentarse' || act === 'descansar' || act === 'celular') {
      x = start + F * 0.1 + j * F * 0.3;
      pose = breathe(POSES.floorPhone, t);
      if (S.r > 0.3) pose = lerpPose(pose, { ...POSES.floor, hd: 0.9 }, resultBlend(S, 0.3, 0.7));
      const fig = drawFigure(ctx, { x, y: 0, pose, F, facing: 1, kind: pe.kind, pe: pe, alpha: personDim(S) });
      if (S.r < 0.3) phoneAt(ctx, fig.fh, F);
      return;
    }
    let prog = S.p;
    let fallen = 0;
    if (act === 'levantarse') {
      // cae a mitad del camino y se levanta
      if (S.p < 0.42) prog = S.p;
      else if (S.p < 0.58) { prog = 0.42; fallen = bump(S.p, 0.43, 0.56, 0.04); }
      else prog = 0.42 + (S.p - 0.58) * (0.58 / 0.42);
    } else if (act === 'caer') {
      prog = Math.min(S.p, 0.42);
      fallen = smooth((S.p - 0.42) / 0.05);
    }
    const dist = prog * (end - start);
    x = start + dist;
    pose = walkPose((dist / (F * (run ? 0.55 : 0.4))) * Math.PI, run);
    if (S.p >= 1 && act !== 'caer') pose = POSES.stand;
    if (fallen > 0) pose = lerpPose(pose, { ...POSES.floor, hd: 0.5 }, fallen);
    if (bike) {
      const y = hill(x);
      const A = S.arc;
      const down = A ? (A.role === 'good' ? A.fall * (1 - A.rise) : A.fall) : fallen > 0.5 || (act === 'caer' && S.p > 0.45) ? 1 : 0;
      if (down > 0.5) {
        // se cayó de la bici: la bici queda tumbada al lado y el personaje en el suelo.
        // El lado malo intenta levantar la bici, no puede y se sienta con la cabeza baja.
        const lift = A && A.role === 'bad' ? A.tryK * (1 - A.quit) : 0;
        drawObject(ctx, 'bicicleta', x + F * 0.42, y, F * 0.42, { ...objState(S), fall: 1 - 0.6 * lift, hot: 0, fade: A && A.role === 'bad' ? 0.5 * A.quit : objState(S).fade });
        let q = { ...POSES.floor, tr: 0.3, hd: 0.45 };
        if (A && A.role === 'bad') {
          q = lerpPose(q, { ...POSES.crouch, tr: 0.7, hd: 0.1, fa1: 0.9, fa2: 0.7, ba1: 0.8, ba2: 0.6 }, lift > 0 ? smooth(A.tryK) * (1 - A.quit) : 0);
          q = lerpPose(q, { ...POSES.floor, tr: 0.46, hd: 1.0, fa1: 0.35, fa2: 0.22, ba1: 0.3, ba2: 0.18 }, A.quit);
        } else if (S.r > 0) q = lerpPose(q, { ...POSES.floor, hd: 0.9 }, resultBlend(S, 0, 0.6));
        drawFigure(ctx, { x: x - F * 0.05, y, pose: q, F, facing: 1, kind: pe.kind, alpha: personDim(S), noArc: true });
      } else {
        // montado en la bici: las dos ruedas apoyadas en la colina (la bici se inclina con la pendiente)
        // y los pedales giran según lo que avanza
        const H = figureSize(pe.kind, F);
        const xr = x - H * 0.33, xf = x + H * 0.42;
        const yr = hill(xr), yf = hill(xf);
        const ang = Math.atan2(yf - yr, xf - xr);
        const yHip = yr + (yf - yr) * (0.33 / 0.75);
        const rider = { ...pe, act: 'montar-bici' };
        ctx.save();
        ctx.translate(x, yHip); ctx.rotate(ang); ctx.translate(-x, -yHip);
        drawFigure(ctx, { x, y: yHip, pose: POSES.stand, F, facing: 1, kind: pe.kind, pe: rider, alpha: personDim(S), travel: dist, noArc: true });
        ctx.restore();
      }
      return;
    }
    if (S.r > 0) {
      if (S.good) pose = lerpPose(POSES.stand, POSES.armsUp, resultBlend(S, 0.1, 0.5));
      else pose = lerpPose(fallen > 0.5 ? { ...POSES.floor, hd: 0.5 } : POSES.stand, { ...POSES.floor, hd: 0.9 }, resultBlend(S, 0, 0.6));
    }
    drawFigure(ctx, { x, y: hill(x), pose, F, facing: 1, kind: pe.kind, pe: pe, alpha: personDim(S) });
  },
};

// ---------------- LIBROS ----------------
SCENES.libros = {
  events(S) {
    const ev = [];
    const pe = S.people[0] || { act: 'leer' };
    if (pe.act === 'leer') for (let k = 0; k < S.C; k++) ev.push({ p: (k + 0.8) / S.C, type: 'page' });
    else for (let k = 0; k < S.C; k++) ev.push({ p: (k + 0.4) / S.C, type: 'blip' });
    if (S.good) ev.push({ r: 0.6, type: 'chime' });
    else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const pe = S.people[0] || { kind: 'mujer', act: 'leer' };
    const reads = pe.act === 'leer' || pe.act === 'read' || pe.act === 'estudiar';
    const cx = -w * 0.2, sx = w * 0.14;
    const cy = cycle(S.p, S.C);
    const n = reads ? Math.min(S.C, Math.floor(cy.c + 0.2)) : 1;
    const bh = Math.min(F * 0.055, (F * 0.36) / Math.max(1, S.C));
    const R = rng(S.seed + 5);
    setLine(ctx, F, 0.9, 0.75);
    const stackH = n * bh;
    for (let i = 0; i < n; i++) {
      const bw = F * (0.26 + R() * 0.06), off = (R() - 0.5) * F * 0.04;
      ctx.strokeRect(sx - bw / 2 + off, -(i + 1) * bh + 1, bw, bh - 2);
    }
    // estrella al final
    if (S.good) {
      const k = smooth((S.r - 0.45) / 0.4);
      if (k > 0) {
        const yy = -stackH - F * 1.15;
        S.focus = [sx + F * 0.15, yy];
        glow(ctx, sx + F * 0.15, yy, F * 0.6 * k, GOLD, 0.9);
        star(ctx, sx + F * 0.15, yy, F * 0.07 * k, GOLD, k);
      }
    }
    // silla
    const H = figureSize(pe.kind, F);
    const seatY = -0.245 * H * 0.98;
    let x = cx, y = 0, pose;
    let showChair = true;
    if (reads) {
      const flip = cy.done ? 0 : bump(cy.ph, 0.45, 0.6, 0.05);
      pose = { ...breathe(POSES.read, t), fa2: POSES.read.fa2 + 0.25 * flip };
      if (S.r > 0) {
        if (S.good) {
          if (S.r < 0.22) pose = lerpPose(pose, POSES.stand, smooth(S.r / 0.22));
          else if (S.r < 0.5) {
            const k = smooth((S.r - 0.22) / 0.28);
            x = lerp(cx, sx, k);
            y = -stackH * smooth((x - (sx - F * 0.3)) / (F * 0.15));
            pose = walkPose(k * 10);
          } else {
            x = sx; y = -stackH;
            pose = lerpPose(POSES.stand, POSES.reachUp, smooth((S.r - 0.5) / 0.3));
          }
        }
      }
    } else {
      pose = breathe(POSES.sitPhone, t);
      if (S.r > 0) pose = lerpPose(pose, POSES.sitSlump, resultBlend(S));
    }
    if (showChair) {
      setLine(ctx, F, 0.6, 0.7);
      line(ctx, cx - F * 0.12, seatY, cx + F * 0.12, seatY);
      line(ctx, cx - F * 0.12, seatY, cx - F * 0.12, seatY - F * 0.32);
      line(ctx, cx - F * 0.1, seatY, cx - F * 0.1, 0);
      line(ctx, cx + F * 0.1, seatY, cx + F * 0.1, 0);
    }
    S.people.slice(1, 3).forEach((p2, j) => {
      const r2 = p2.act === 'leer' || p2.act === 'read' || p2.act === 'estudiar';
      companion(ctx, S, p2, sx + F * (0.5 + j * 0.45), -1, { kind: r2 ? 'read' : 'stand', sit: true });
    });
    const fig = drawFigure(ctx, { x, y, pose, F, facing: 1, kind: pe.kind, pe: pe, alpha: personDim(S) });
    if (reads && NEUTRAL < 0.5 && !(S.good && S.r > 0.1)) {
      // libro abierto en las manos, o volando a la pila
      const flying = !cy.done && cy.ph > 0.75;
      setLine(ctx, F, 1, 0.75);
      if (flying) {
        const k = (cy.ph - 0.75) / 0.25;
        const bx = lerp(fig.fh[0], sx, k), by = lerp(fig.fh[1], -stackH - bh, k) - Math.sin(k * Math.PI) * F * 0.25;
        if (S.object) obj(ctx, S, bx, by + F * 0.07, F * 0.14);
        else ctx.strokeRect(bx - F * 0.12, by - bh / 2, F * 0.24, bh - 2);
      } else {
        const h = fig.fh;
        if (S.object) obj(ctx, S, h[0], h[1] + F * 0.05, F * 0.15);
        else {
          ctx.beginPath();
          ctx.moveTo(h[0] - F * 0.07, h[1] - F * 0.04); ctx.lineTo(h[0], h[1]); ctx.lineTo(h[0] + F * 0.07, h[1] - F * 0.04);
          ctx.stroke();
        }
      }
    } else if (!reads && S.r < 0.5) phoneAt(ctx, fig.fh, F);
    if (S.object && (!reads || (S.good && S.r > 0.1))) { S.objHand = false; S.objSpot = [sx, -stackH]; }
  },
};

// ---------------- ABRAZO (distancia) ----------------
SCENES.abrazo = {
  events(S) {
    const ev = [];
    for (let k = 0; k < S.C; k++) ev.push({ p: (k + 0.6) / S.C, type: 'step', vol: 0.7 });
    if (S.good) ev.push({ r: 0.3, type: 'heartbeat' }, { r: 0.35, type: 'chime' });
    else ev.push({ r: 0.2, type: 'crack' }, { r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    const crack = !S.good ? smooth(S.r * 0.9) * F * 0.18 : 0;
    groundLine(ctx, F, -w / 2, -crack);
    groundLine(ctx, F, crack, w / 2);
    if (crack > 1) {
      setLine(ctx, F, 0.4, 0.6);
      ctx.beginPath();
      ctx.moveTo(-crack, 0); ctx.lineTo(-crack * 0.4, F * 0.1); ctx.lineTo(-crack * 0.7, F * 0.2);
      ctx.moveTo(crack, 0); ctx.lineTo(crack * 0.5, F * 0.1); ctx.lineTo(crack * 0.8, F * 0.2);
      ctx.stroke();
    }
    const startX = w * 0.36;
    const cy = cycle(S.p, S.C);
    const xs = [];
    S.people.slice(0, 2).forEach((pe, i) => {
      const side = i === 0 ? -1 : 1;
      const act = pe.act;
      let x, pose, facing = -side;
      const stepK = cy.done ? S.C : cy.k + smooth((cy.ph - 0.3) / 0.6);
      const walking = !cy.done && cy.ph > 0.3 && cy.ph < 0.9;
      if (act === 'acercarse' || act === 'perdonar') {
        const endX = F * 0.12;
        x = side * lerp(startX, endX, stepK / S.C);
        pose = walking ? walkDist(startX - Math.abs(x), F) : breathe(POSES.stand, t);
        if (S.r > 0) {
          if (S.good) pose = lerpPose(POSES.stand, POSES.hug, resultBlend(S, 0.05, 0.3));
          else pose = lerpPose(POSES.stand, POSES.slump, resultBlend(S));
        }
      } else if (act === 'alejarse' || act === 'espalda') {
        facing = NEUTRAL > 0.5 ? -side : side;
        x = side * lerp(startX, w * 0.47, stepK / S.C);
        pose = walking ? walkDist(Math.abs(x) - startX, F) : breathe(POSES.stand, t);
        if (S.r > 0) pose = lerpPose(POSES.stand, POSES.slump, resultBlend(S));
      } else {
        x = side * startX;
        pose = breathe(POSES.stand, t);
        if (S.r > 0) pose = lerpPose(pose, POSES.slump, resultBlend(S));
      }
      xs.push(x);
      drawFigure(ctx, { x, pose, F, facing, kind: pe.kind, pe: pe, alpha: personDim(S) });
    });
    // corazón entre los dos
    const hy = -F * 1.15;
    if (S.object) {
      obj(ctx, S, 0, hy + F * 0.38 + (!S.good ? smooth((S.r - 0.15) / 0.6) * F * 0.4 : 0), F * 0.34, { always: true, fall: !S.good ? smooth((S.r - 0.15) / 0.5) : 0 });
      if (S.good) S.focus = [0, hy - F * 0.15];
      return;
    }
    if (S.good) {
      S.focus = [0, hy - F * 0.15];
      if (S.r > 0.7) return;
      const k = (0.55 + 0.45 * smooth(S.p) + 0.25 * smooth(S.r / 0.5)) * (1 - smooth((S.r - 0.45) / 0.25));
      glow(ctx, 0, hy - S.r * F * 0.15, F * 0.55 * k, RED, 0.5 + 0.4 * S.r);
      heart(ctx, 0, hy - S.r * F * 0.15, F * 0.16 * k * (1 + 0.05 * Math.sin(t * 4)), RED, 1);
    } else {
      const shrink = 1 - 0.35 * smooth(S.r);
      const sp = smooth((S.r - 0.15) / 0.6);
      const col = sp > 0.3 ? '#7A3638' : RED;
      glow(ctx, 0, hy, F * 0.4 * shrink * (1 - sp), RED, 0.5);
      heart(ctx, 0, hy + sp * F * 0.2, F * 0.16 * shrink, col, 1 - sp * 0.5, 0, sp);
    }
  },
};

export const SCENE_NAMES = Object.keys(SCENES);
// herramientas compartidas con las escenas nuevas (scenes2.js)
export const kit = { obj, objState, walkMove, walkDist, stepPhase, setLine, line, groundLine, groundMass, phoneAt, cycle, workPose, resultBlend, bump, frac, rng, personDim, drawFigure, flame, getNeutral: () => NEUTRAL, BUILD };
