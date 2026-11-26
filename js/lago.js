// Dos Caminos — escena «lago» (también: barco, bote): la orilla, el agua con olas y la otra orilla.
// arreglar-barco: arregla su barca en la orilla, tabla a tabla (agachado, golpea con el martillo).
// Final bueno: empuja la barca al agua, sube, rema (los remos van y vienen), cruza y en la otra orilla celebra con
// los brazos arriba (corazón grande). Final malo: se queda arreglándola, nunca sale y se desanima (se sienta, cabeza baja).
import { SCENES, smooth, lerp, glow, kit, AMBER } from './scenes.js';
import { POSES, lerpPose, breathe, WHITE, BG } from './figure.js';

const { setLine, line, groundMass, resultBlend, personDim, drawFigure } = kit;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// barca de perfil: (x, y) = centro del fondo; q = cuánto está arreglada (0–1); oars: ángulo de los remos (o null)
function boat(ctx, F, x, y, L, q, oars) {
  const h = F * 0.15;
  ctx.save();
  setLine(ctx, F, 0.95, 1);
  // casco: borde de arriba recto y fondo curvo
  ctx.beginPath();
  ctx.moveTo(x - L / 2, y - h);
  ctx.lineTo(x + L / 2, y - h * 1.15);
  ctx.quadraticCurveTo(x + L * 0.42, y, x + L * 0.2, y);
  ctx.lineTo(x - L * 0.25, y);
  ctx.quadraticCurveTo(x - L * 0.45, y, x - L / 2, y - h);
  ctx.closePath();
  ctx.save(); ctx.fillStyle = BG; ctx.fill(); ctx.restore();
  ctx.stroke();
  // tablas: las arregladas, líneas enteras; las que faltan, a trozos
  const n = 5;
  for (let k = 1; k <= n; k++) {
    const yy = y - h + (k * h) / (n + 1);
    const done = q >= k / n - 0.02;
    setLine(ctx, F, done ? 0.75 : 0.35, 0.7);
    if (done) line(ctx, x - L * 0.42 + k * 2, yy, x + L * 0.42 - k * 2, yy);
    else { ctx.setLineDash([F * 0.03, F * 0.05]); line(ctx, x - L * 0.4, yy, x + L * 0.4, yy); ctx.setLineDash([]); }
  }
  // remos
  setLine(ctx, F, 0.85, 0.8);
  if (oars == null) { line(ctx, x - L * 0.35, y - h * 1.25, x + L * 0.3, y - h * 1.45); }
  else {
    const a = oars;
    for (const s of [0, 1]) { const ox = x - L * 0.05 + s * 3; line(ctx, ox, y - h * 1.1, ox - Math.cos(a) * L * 0.55, y - h * 1.1 + Math.sin(a) * L * 0.35 + F * 0.05); }
  }
  ctx.restore();
}

function water(ctx, F, x1, x2, t) {
  ctx.save();
  ctx.fillStyle = BG;
  ctx.fillRect(x1, F * 0.03, x2 - x1, F * 1.6);
  setLine(ctx, F, 0.5, 0.8);
  for (let r = 0; r < 4; r++) {
    const y = F * (0.05 + r * 0.12);
    ctx.globalAlpha = 0.45 - r * 0.08;
    ctx.beginPath();
    for (let x = x1; x <= x2; x += 6) { const yy = y + Math.sin(x * 0.045 + t * 2.2 + r * 1.7) * F * 0.012; x === x1 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke();
  }
  ctx.restore();
}

SCENES.lago = {
  events(S) {
    const ev = [];
    for (let k = 0; k < S.C * 2; k++) ev.push({ p: (k + 0.5) / (S.C * 2), type: 'tock', vol: 0.5 });
    if (S.good) ev.push({ r: 0.12, type: 'drip' }, { r: 0.35, type: 'drip' }, { r: 0.7, type: 'chime' });
    else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t } = S;
    const xs = -w * 0.06, xo = w * 0.26; // orilla de aquí (hasta xs), agua, la otra orilla (desde xo)
    // orillas y agua
    groundMass(ctx, F, -w / 2, xs, () => { ctx.moveTo(-w / 2, 0); ctx.lineTo(xs, 0); ctx.lineTo(xs + F * 0.06, F * 0.05); ctx.lineTo(xs + F * 0.06, F * 1.4); ctx.lineTo(-w / 2, F * 1.4); });
    groundMass(ctx, F, xo, w / 2, () => { ctx.moveTo(xo - F * 0.06, F * 0.05); ctx.lineTo(xo, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, F * 1.4); ctx.lineTo(xo - F * 0.06, F * 1.4); });
    water(ctx, F, xs + F * 0.06, xo - F * 0.06, t);
    setLine(ctx, F, 0.6, 0.8);
    line(ctx, -w / 2, 0, xs, 0); line(ctx, xs, 0, xs + F * 0.06, F * 0.05);
    line(ctx, xo - F * 0.06, F * 0.05, xo, 0); line(ctx, xo, 0, w / 2, 0);
    // bandera pequeña en la otra orilla (la meta)
    const fx = xo + Math.min(F * 0.45, (w / 2 - xo) * 0.6);
    setLine(ctx, F, 0.75, 0.8); line(ctx, fx, 0, fx, -F * 0.45);
    ctx.save(); ctx.beginPath(); ctx.moveTo(fx, -F * 0.45); ctx.lineTo(fx + F * 0.14, -F * 0.4); ctx.lineTo(fx, -F * 0.35); ctx.closePath();
    if (S.good && S.r > 0.6) { ctx.fillStyle = '#E5484D'; ctx.globalAlpha = smooth((S.r - 0.6) / 0.3); ctx.fill(); }
    ctx.restore(); ctx.stroke();
    const L = F * 0.7, bx0 = xs - L / 2 - F * 0.08;
    // cuánto está arreglada: el que sale la termina; el que no, nunca la acaba (siempre le falta un detalle)
    const q = S.good ? smooth(S.p * 1.25) : 0.82 * smooth(S.p);
    const pe = S.people[0] || { kind: 'hombre', act: 'arreglar-barco' };
    const r = S.r;
    const k1 = S.good ? smooth(r / 0.15) : 0, k2 = S.good ? smooth((r - 0.15) / 0.47) : 0, land = S.good ? smooth((r - 0.64) / 0.12) : 0;
    // la barca: en la orilla → al agua → cruza → varada en la otra orilla
    const bxWater = xs + L / 2 + F * 0.06, bxFar = xo - L / 2 - F * 0.02;
    const bx = k2 > 0 ? lerp(bxWater, bxFar, k2) : lerp(bx0, bxWater, k1);
    const by = k1 > 0.5 ? F * 0.06 + Math.sin(t * 3) * F * 0.008 : 0;
    const rowing = k1 > 0.5 && land < 0.5;
    boat(ctx, F, bx, by, L, q, rowing ? 0.5 + 0.45 * Math.sin(t * 6) : null);
    S.objHand = true;
    if (S.good) S.focus = [fx - F * 0.2, -F * 1.35];
    let x, y = 0, pose, facing = 1;
    if (land > 0.5) {
      // en la otra orilla: brazos arriba de victoria, con saltitos
      x = xo + F * 0.18;
      const b = Math.abs(Math.sin(t * 6));
      pose = { ...POSES.armsUp, tr: -0.04, hd: -0.3 };
      y = -F * 0.03 * b * smooth((r - 0.76) / 0.1);
    } else if (k1 > 0.5) {
      // sentado en la barca, remando
      x = bx - L * 0.05; y = by - F * 0.15;
      const a = Math.sin(t * 6);
      pose = { ...POSES.sit, tr: -0.05 + 0.15 * a, hd: -0.05, fa1: 1.2 + 0.4 * a, fa2: 1.5 + 0.3 * a, ba1: 1.15 + 0.4 * a, ba2: 1.45 + 0.3 * a };
    } else {
      // agachado junto a la barca, arreglándola (golpea con el martillo)
      x = bx0 - L / 2 - F * 0.12 + k1 * F * 0.4;
      const hit = Math.pow(0.5 + 0.5 * Math.sin(t * 5), 1.5);
      pose = { ...POSES.crouch, tr: 0.75, hd: 0.3, fa1: 0.45 + 1.1 * hit, fa2: 0.3 + 1.4 * hit, ba1: 0.5, ba2: 0.3 };
      if (k1 > 0) pose = lerpPose(pose, { ...POSES.stand, tr: 0.3, fa1: 1.2, fa2: 1.4, ba1: 1.1, ba2: 1.3 }, smooth(k1 * 2)); // empuja la barca
      if (!S.good && r > 0) pose = lerpPose(pose, { ...POSES.floor, hd: 1.0, tr: 0.45, fa1: 0.35, fa2: 0.2, ba1: 0.3, ba2: 0.18 }, resultBlend(S, 0.1, 0.6)); // se desanima
    }
    drawFigure(ctx, { x, y, pose: breathe(pose, t, 0.5), F, facing, kind: pe.kind, pe, alpha: personDim(S), neutral: k1 > 0.5 ? 'none' : undefined });
    // el segundo (si lo hay) espera en la orilla
    if (S.people[1]) drawFigure(ctx, { x: bx0 - L / 2 - F * 0.55, pose: breathe(POSES.stand, t + 1), F, facing: 1, kind: S.people[1].kind, pe: S.people[1], alpha: personDim(S) });
    if (S.good && land > 0.5) glow(ctx, xo + F * 0.18, -F * 0.9, F * 0.6, AMBER, 0.4 * land);
  },
};
