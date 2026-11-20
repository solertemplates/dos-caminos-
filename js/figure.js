// Dos Caminos — personajes de líneas blancas (rig de palitos con poses interpoladas)
// Ángulos en radianes. Extremidades: 0 = hacia abajo, positivo = hacia donde mira.
// Torso: 0 = vertical, positivo = inclinado hacia delante.

export const WHITE = '#F4F2EC';
export const BG = '#000000';

const LEGS_STAND = { fl1: 0.06, fl2: 0.02, bl1: -0.06, bl2: -0.05 };
const LEGS_SIT = { fl1: 1.5, fl2: 0.05, bl1: 1.45, bl2: -0.02 };
const LEGS_KNEEL = { fl1: 0.12, fl2: -1.5, bl1: 0.0, bl2: -1.6 };
const LEGS_CROUCH = { fl1: 1.25, fl2: -0.2, bl1: 1.05, bl2: -0.35 };
const LEGS_FLOOR = { fl1: 1.55, fl2: 1.5, bl1: 1.5, bl2: 1.3 };

export const POSES = {
  stand:   { tr: 0.03, hd: 0.05, fa1: 0.12, fa2: 0.22, ba1: -0.08, ba2: 0.0, ...LEGS_STAND },
  look:    { tr: 0.0, hd: -0.28, fa1: 0.1, fa2: 0.18, ba1: -0.06, ba2: 0.0, ...LEGS_STAND },
  lookBack:{ tr: -0.04, hd: -0.1, fa1: 0.15, fa2: 0.25, ba1: -0.1, ba2: 0.0, ...LEGS_STAND },
  slump:   { tr: 0.22, hd: 0.72, fa1: 0.1, fa2: 0.06, ba1: 0.06, ba2: 0.03, ...LEGS_STAND },
  cold:    { tr: 0.12, hd: 0.5, fa1: 0.75, fa2: 2.45, ba1: 0.65, ba2: 2.35, ...LEGS_STAND },
  heart:   { tr: 0.02, hd: 0.08, fa1: 0.3, fa2: 1.85, ba1: 0.25, ba2: 1.8, ...LEGS_STAND },
  heartLow:{ tr: 0.12, hd: 0.6, fa1: 0.15, fa2: 0.55, ba1: 0.1, ba2: 0.5, ...LEGS_STAND },
  phone:   { tr: 0.07, hd: 0.62, fa1: 0.28, fa2: 2.15, ba1: 0.22, ba2: 2.0, ...LEGS_STAND },
  carry:   { tr: 0.05, hd: 0.1, fa1: 0.75, fa2: 1.45, ba1: 0.7, ba2: 1.4, ...LEGS_STAND },
  reach:   { tr: 0.08, hd: 0.05, fa1: 1.35, fa2: 1.75, ba1: 1.25, ba2: 1.6, ...LEGS_STAND },
  hug:     { tr: 0.06, hd: 0.15, fa1: 1.2, fa2: 2.35, ba1: 1.1, ba2: 2.25, ...LEGS_STAND },
  reachUp: { tr: 0.0, hd: -0.25, fa1: 1.9, fa2: 1.75, ba1: 1.6, ba2: 1.5, ...LEGS_STAND },
  armsUp:  { tr: -0.04, hd: -0.32, fa1: 2.65, fa2: 2.85, ba1: 2.45, ba2: 2.75, ...LEGS_STAND },
  warm:    { tr: 0.1, hd: 0.15, fa1: 1.15, fa2: 1.35, ba1: 1.05, ba2: 1.25, ...LEGS_STAND },
  water:   { tr: 0.1, hd: 0.38, fa1: 1.05, fa2: 1.25, ba1: 0.1, ba2: 0.2, ...LEGS_STAND },
  drop:    { tr: 0.06, hd: 0.3, fa1: 1.55, fa2: 1.6, ba1: 0.05, ba2: 0.1, ...LEGS_STAND },
  pray:    { tr: 0.0, hd: 0.38, fa1: 0.55, fa2: 2.65, ba1: 0.5, ba2: 2.7, ...LEGS_KNEEL },
  praiseK: { tr: -0.05, hd: -0.3, fa1: 2.5, fa2: 2.75, ba1: 2.35, ba2: 2.65, ...LEGS_KNEEL },
  crouch:  { tr: 0.95, hd: 0.25, fa1: 0.35, fa2: 0.12, ba1: 0.3, ba2: 0.1, ...LEGS_CROUCH },
  sit:     { tr: -0.04, hd: 0.1, fa1: 0.35, fa2: 1.25, ba1: 0.3, ba2: 1.2, ...LEGS_SIT },
  sitTalk: { tr: 0.02, hd: -0.02, fa1: 0.6, fa2: 1.75, ba1: 0.3, ba2: 1.2, ...LEGS_SIT },
  sitReach:{ tr: 0.12, hd: 0.0, fa1: 1.35, fa2: 1.45, ba1: 1.2, ba2: 1.35, ...LEGS_SIT },
  sitPhone:{ tr: 0.16, hd: 0.68, fa1: 0.4, fa2: 2.1, ba1: 0.35, ba2: 2.0, ...LEGS_SIT },
  sitSlump:{ tr: 0.34, hd: 0.75, fa1: 0.45, fa2: 0.55, ba1: 0.4, ba2: 0.5, ...LEGS_SIT },
  read:    { tr: 0.06, hd: 0.45, fa1: 0.55, fa2: 1.95, ba1: 0.5, ba2: 1.85, ...LEGS_SIT },
  floor:   { tr: 0.38, hd: 0.65, fa1: 0.45, fa2: 0.5, ba1: 0.35, ba2: 0.4, ...LEGS_FLOOR },
  lie:     { tr: 1.57, hd: -0.05, fa1: -1.3, fa2: -1.45, ba1: -1.25, ba2: -1.4, fl1: -1.52, fl2: -1.55, bl1: -1.5, bl2: -1.5 },
  liePhone:{ tr: 1.5, hd: -0.25, fa1: 0.2, fa2: 1.6, ba1: 0.1, ba2: 1.5, fl1: -1.52, fl2: -1.55, bl1: -1.5, bl2: -1.5 },
  phoneEar:{ tr: 0.02, hd: 0.1, fa1: 1.6, fa2: 3.4, ba1: -0.05, ba2: 0.05, ...LEGS_STAND },
  umbrella:{ tr: 0.0, hd: 0.0, fa1: 2.5, fa2: 2.9, ba1: -0.05, ba2: 0.05, ...LEGS_STAND },
  typing:  { tr: 0.1, hd: 0.3, fa1: 1.0, fa2: 1.5, ba1: 0.95, ba2: 1.45, ...LEGS_SIT },
  drive:   { tr: -0.05, hd: 0.0, fa1: 1.0, fa2: 1.65, ba1: 0.95, ba2: 1.6, ...LEGS_SIT },
  stretch: { tr: -0.05, hd: -0.2, fa1: 2.8, fa2: 3.0, ba1: 2.7, ba2: 2.95, ...LEGS_FLOOR },
  floorPhone:{ tr: 0.3, hd: 0.7, fa1: 0.5, fa2: 2.0, ba1: 0.45, ba2: 1.9, ...LEGS_FLOOR },
};

export function lerpPose(a, b, k) {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const o = {};
  for (const key in a) {
    if (b[key] === undefined) { if (k < 0.5) o[key] = a[key]; continue; } // p. ej. fixLow de la bici
    o[key] = a[key] + (b[key] - a[key]) * k;
  }
  for (const key in b) if (a[key] === undefined && k >= 0.5) o[key] = b[key];
  return o;
}

export function walkPose(phase, run = false) {
  const amp = run ? 0.62 : 0.38;
  const s = Math.sin(phase);
  const s2 = Math.sin(phase + Math.PI);
  const bend = (x) => (run ? 0.9 : 0.55) * Math.max(0, Math.sin(x + Math.PI * 0.5));
  return {
    tr: run ? 0.22 : 0.06,
    hd: run ? 0.0 : 0.06,
    fa1: -0.32 * s * (run ? 1.6 : 1),
    fa2: -0.32 * s * (run ? 1.6 : 1) + (run ? 1.3 : 0.3),
    ba1: -0.32 * s2 * (run ? 1.6 : 1),
    ba2: -0.32 * s2 * (run ? 1.6 : 1) + (run ? 1.3 : 0.3),
    fl1: amp * s,
    fl2: amp * s - bend(phase),
    bl1: amp * s2,
    bl2: amp * s2 - bend(phase + Math.PI),
  };
}

export function breathe(p, t, amt = 1) {
  const o = { ...p };
  o.tr += 0.012 * amt * Math.sin(t * 1.7);
  o.hd += 0.02 * amt * Math.sin(t * 1.7 + 0.6);
  o.fa1 += 0.015 * amt * Math.sin(t * 1.7 + 1.1);
  o.ba1 += 0.015 * amt * Math.sin(t * 1.7 + 1.4);
  return o;
}

// kind: hombre | mujer | nino | nina
export function figureSize(kind, F) {
  return kind === 'nino' || kind === 'nina' ? F * 0.64 : kind === 'mujer' ? F * 0.95 : F;
}

export function solveFigure(pose, H, facing, kind) {
  const child = kind === 'nino' || kind === 'nina';
  const L = {
    th: 0.245 * H, sh: 0.245 * H, tor: child ? 0.27 * H : 0.3 * H,
    ua: 0.18 * H, fa: 0.17 * H, neck: 0.045 * H, r: child ? 0.115 * H : 0.095 * H,
  };
  const d = (a, len) => [facing * Math.sin(a) * len, Math.cos(a) * len];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const hip = [0, 0];
  const fk = add(hip, d(pose.fl1, L.th));
  const ff = add(fk, d(pose.fl2, L.sh));
  const bk = add(hip, d(pose.bl1, L.th));
  const bf = add(bk, d(pose.bl2, L.sh));
  const shoulder = [facing * Math.sin(pose.tr) * L.tor, -Math.cos(pose.tr) * L.tor];
  const ha = pose.tr + pose.hd * 0.6;
  const head = [shoulder[0] + facing * Math.sin(ha) * (L.neck + L.r), shoulder[1] - Math.cos(ha) * (L.neck + L.r)];
  const fe = add(shoulder, d(pose.fa1, L.ua));
  const fh = add(fe, d(pose.fa2, L.fa));
  const be = add(shoulder, d(pose.ba1, L.ua));
  const bh = add(be, d(pose.ba2, L.fa));
  // fixLow: altura fija de la cadera (p. ej. en bici, para que no rebote al pedalear)
  const low = pose.fixLow != null ? pose.fixLow * H : Math.max(hip[1] + 0.02 * H, fk[1], ff[1], bk[1], bf[1]);
  const pts = { hip, fk, ff, bk, bf, shoulder, head, fe, fh, be, bh };
  for (const k in pts) pts[k] = [pts[k][0], pts[k][1] - low];
  pts.r = L.r;
  pts.H = H;
  return pts;
}

// Dibuja la figura con los pies (o rodillas) sobre groundY. Devuelve puntos en coordenadas del escenario.
export function drawFigure(ctx, o) {
  const { x, y = 0, pose, F, facing = 1, kind = 'hombre', alpha = 1 } = o;
  const H = figureSize(kind, F);
  const P = solveFigure(pose, H, facing, kind);
  const female = kind === 'mujer' || kind === 'nina';
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = o.color || WHITE;
  ctx.fillStyle = o.color || WHITE;
  ctx.lineWidth = Math.max(2, 0.03 * F);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const seg = (...ps) => {
    ctx.beginPath();
    ctx.moveTo(ps[0][0], ps[0][1]);
    for (let i = 1; i < ps.length; i++) ctx.lineTo(ps[i][0], ps[i][1]);
    ctx.stroke();
  };
  // piernas
  seg(P.hip, P.bk, P.bf);
  seg(P.hip, P.fk, P.ff);
  // pies (pequeño trazo hacia delante)
  const foot = 0.05 * H;
  seg(P.bf, [P.bf[0] + facing * foot, P.bf[1]]);
  seg(P.ff, [P.ff[0] + facing * foot, P.ff[1]]);
  if (female) {
    // saya sencilla
    const tv = [P.shoulder[0] - P.hip[0], P.shoulder[1] - P.hip[1]];
    const tl = Math.hypot(tv[0], tv[1]) || 1;
    const waist = [P.hip[0] + (tv[0] / tl) * 0.06 * H, P.hip[1] + (tv[1] / tl) * 0.06 * H];
    const km = [(P.fk[0] + P.bk[0]) / 2, (P.fk[1] + P.bk[1]) / 2];
    const dv = [km[0] - P.hip[0], km[1] - P.hip[1]];
    const dl = Math.hypot(dv[0], dv[1]) || 1;
    const c = [P.hip[0] + dv[0] * 1.02, P.hip[1] + dv[1] * 1.02];
    const perp = [-dv[1] / dl, dv[0] / dl];
    const spread = Math.hypot(P.fk[0] - P.bk[0], P.fk[1] - P.bk[1]);
    const hw = Math.max(0.12 * H, spread / 2 + 0.05 * H);
    const ww = 0.045 * H;
    const tp = [-tv[1] / tl, tv[0] / tl];
    ctx.beginPath();
    ctx.moveTo(waist[0] + tp[0] * ww, waist[1] + tp[1] * ww);
    ctx.lineTo(c[0] + perp[0] * hw, c[1] + perp[1] * hw);
    ctx.lineTo(c[0] - perp[0] * hw, c[1] - perp[1] * hw);
    ctx.lineTo(waist[0] - tp[0] * ww, waist[1] - tp[1] * ww);
    ctx.closePath();
    ctx.save();
    ctx.fillStyle = BG;
    ctx.fill();
    ctx.restore();
    ctx.stroke();
  }
  // torso y cuello
  seg(P.hip, P.shoulder);
  // brazos
  seg(P.shoulder, P.be, P.bh);
  seg(P.shoulder, P.fe, P.fh);
  // cabeza
  ctx.beginPath();
  ctx.arc(P.head[0], P.head[1], P.r, 0, Math.PI * 2);
  ctx.fill();
  if (female) {
    // pelo recogido (moño)
    const ang = pose.tr + pose.hd * 0.6;
    const bx = P.head[0] - facing * Math.cos(ang) * P.r * 0.78 - facing * Math.sin(ang) * P.r * 0.35;
    const by = P.head[1] - Math.cos(ang) * P.r * 0.42 + Math.sin(ang) * P.r * 0.2;
    ctx.beginPath();
    ctx.arc(bx, by, P.r * 0.44, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  const w = (p) => [p[0] + x, p[1] + y];
  return { fh: w(P.fh), bh: w(P.bh), head: w(P.head), hip: w(P.hip), shoulder: w(P.shoulder), ff: w(P.ff), bf: w(P.bf), fe: w(P.fe), r: P.r, H };
}
