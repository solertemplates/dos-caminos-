// Dos Caminos — escena «lago» (también: barco, bote): la orilla, el agua con olas y la otra orilla.
// arreglar-barco: arregla su barca en la orilla, tabla a tabla (agachado, golpea con el martillo).
// Final bueno: empuja la barca al agua, sube, rema (los remos van y vienen), cruza y en la otra orilla celebra con
// los brazos arriba (corazón grande). Final malo: se queda arreglándola, nunca sale y se desanima (se sienta, cabeza baja).
import { SCENES, smooth, lerp, glow, kit, AMBER } from './scenes.js';
import { POSES, lerpPose, breathe, WHITE, BG } from './figure.js';

const { setLine, line, groundMass, resultBlend, personDim, drawFigure } = kit;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// barca de perfil: (x, y) = centro del fondo; q = cuánto está arreglada (0–1); oars: ángulo de los remos (o null)
// opts.crooked: tablas torcidas (el rápido); opts.shiny: tablas brillantes con destellos (el perfeccionista);
// opts.lifted: la tabla que el perfeccionista tiene quitada (no se dibuja en la barca)
function boat(ctx, F, x, y, L, q, oars, opts = {}) {
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
    if (done && opts.lifted === k) continue; // la tabla que tiene en las manos
    setLine(ctx, F, done ? (opts.shiny ? 1 : 0.75) : 0.35, opts.shiny && done ? 0.9 : 0.7);
    if (done) {
      // el rápido las clava torcidas; el perfeccionista, perfectas y brillantes
      const tilt = opts.crooked ? Math.sin(k * 7.3) * h * 0.18 : 0, sh = opts.crooked ? Math.sin(k * 3.1) * L * 0.04 : 0;
      line(ctx, x - L * 0.42 + k * 2 + sh, yy - tilt, x + L * 0.42 - k * 2 + sh, yy + tilt);
      if (opts.shiny) {
        const gx = x - L * 0.38 + ((opts.t * 0.35 + k * 0.23) % 1) * L * 0.76;
        ctx.save(); ctx.fillStyle = AMBER; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(gx, yy, F * 0.012, 0, 7); ctx.fill();
        ctx.strokeStyle = AMBER; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; line(ctx, gx - F * 0.03, yy, gx + F * 0.03, yy); line(ctx, gx, yy - F * 0.03, gx, yy + F * 0.03); ctx.restore();
      }
    } else { ctx.setLineDash([F * 0.03, F * 0.05]); line(ctx, x - L * 0.4, yy, x + L * 0.4, yy); ctx.setLineDash([]); }
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
    // MODO juntos: el perfeccionista (A) y el rápido (B) trabajan distinto desde el principio
    const perf = S.lagoStyle === 'perfeccionista', fast = S.lagoStyle === 'rapido';
    let q = S.good ? smooth(S.p * 1.25) : 0.82 * smooth(S.p);
    if (perf) q = Math.min(0.42, 0.42 * smooth(S.p * 1.4)); // casi no avanza: dos tablas, brillantes
    if (fast) q = smooth(S.p * 2.05); // a mitad del video ya está terminada (fea, pero entera)
    const pe = S.people[0] || { kind: 'hombre', act: 'arreglar-barco' };
    const r = S.r;
    // el perfeccionista repite con la misma tabla: lija y pule → la mide con la regla → la quita y la vuelve a poner
    const cyc = perf ? (t % 6) / 6 : 0;
    const topPlank = Math.max(1, Math.round(q * 5));
    const lifted = perf && cyc > 0.74 && cyc < 0.96 && r < 0.55 ? topPlank : null;
    const k1 = S.good ? smooth(r / 0.15) : 0, k2 = S.good ? smooth((r - 0.15) / 0.47) : 0, land = S.good ? smooth((r - 0.64) / 0.12) : 0;
    // la barca: en la orilla → al agua → cruza → varada en la otra orilla
    const bxWater = xs + L / 2 + F * 0.06, bxFar = xo - L / 2 - F * 0.02;
    const bx = k2 > 0 ? lerp(bxWater, bxFar, k2) : lerp(bx0, bxWater, k1);
    const by = k1 > 0.5 ? F * 0.06 + Math.sin(t * 3) * F * 0.008 : 0;
    const rowing = k1 > 0.5 && land < 0.5;
    boat(ctx, F, bx, by, L, q, rowing ? 0.5 + 0.45 * Math.sin(t * 6) : null, { crooked: fast, shiny: perf, lifted, t });
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
    } else if (perf) {
      // el perfeccionista: lija y pule, mide con la regla, quita la tabla y la vuelve a poner… una y otra vez.
      // Al final se queda puliendo, mira cómo se aleja el otro y se sienta desanimado (lo hace render.js con giveUp)
      x = bx0 - L / 2 - F * 0.12;
      const look = smooth((r - 0.5) / 0.15);
      let tool = null;
      if (cyc < 0.5 || r >= 0.55) {
        const rub = Math.sin(t * 11);
        pose = { ...POSES.crouch, tr: 0.62, hd: 0.45, fa1: 1.0 + 0.32 * rub, fa2: 1.25 + 0.3 * rub, ba1: 0.85, ba2: 1.1 };
        tool = 'lija';
      } else if (cyc < 0.74) {
        pose = { ...POSES.crouch, tr: 0.55, hd: 0.6, fa1: 1.15, fa2: 1.4, ba1: 1.05, ba2: 1.35 };
        tool = 'regla';
      } else {
        const up = Math.sin(((cyc - 0.74) / 0.22) * Math.PI);
        pose = { ...POSES.crouch, tr: 0.45 - 0.25 * up, hd: 0.2 - 0.3 * up, fa1: 1.2 + 0.9 * up, fa2: 1.4 + 0.9 * up, ba1: 1.1 + 0.9 * up, ba2: 1.35 + 0.9 * up };
        tool = 'tabla';
      }
      if (look > 0) { pose = lerpPose(pose, { ...pose, hd: -0.15, tr: 0.35 }, look); facing = look > 0.5 ? -1 : 1; } // mira hacia el otro, que se va
      const fig = drawFigure(ctx, { x, y, pose: breathe(pose, t, 0.5), F, facing, kind: pe.kind, pe, alpha: personDim(S) });
      if (fig && tool && S.giveUp < 0.3) {
        const hx = (fig.fh[0] + fig.bh[0]) / 2, hy = (fig.fh[1] + fig.bh[1]) / 2;
        ctx.save(); setLine(ctx, F, 0.9, 0.8);
        if (tool === 'lija') { ctx.strokeRect(hx - F * 0.04, hy - F * 0.02, F * 0.08, F * 0.04); }
        else if (tool === 'regla') { line(ctx, hx - F * 0.18, hy, hx + F * 0.18, hy); for (let k = -3; k <= 3; k++) line(ctx, hx + k * F * 0.05, hy, hx + k * F * 0.05, hy - F * 0.025); }
        else { setLine(ctx, F, 1, 0.9); line(ctx, hx - F * 0.2, hy - F * 0.01, hx + F * 0.2, hy + F * 0.01); }
        ctx.restore();
      }
      return;
    } else if (fast && q >= 1 && k1 <= 0) {
      // el rápido: la barca ya está (fea, pero entera); mira el agua con la mano en la barca, listo para salir
      x = bx0 - L / 2 - F * 0.1;
      pose = { ...POSES.stand, tr: 0.05, hd: -0.15 + 0.08 * Math.sin(t * 1.3), fa1: 1.25, fa2: 1.3, ba1: 0.15, ba2: 0.3 };
    } else {
      // agachado junto a la barca, arreglándola (golpea con el martillo; el rápido, mucho más deprisa)
      x = bx0 - L / 2 - F * 0.12 + k1 * F * 0.4;
      const hit = Math.pow(0.5 + 0.5 * Math.sin(t * (fast ? 11 : 5)), 1.5);
      pose = { ...POSES.crouch, tr: 0.75, hd: 0.3, fa1: 0.45 + 1.1 * hit, fa2: 0.3 + 1.4 * hit, ba1: 0.5, ba2: 0.3 };
      if (k1 > 0) pose = lerpPose(pose, { ...POSES.stand, tr: 0.3, fa1: 1.2, fa2: 1.4, ba1: 1.1, ba2: 1.3 }, smooth(k1 * 2)); // empuja la barca
      if (!S.good && r > 0 && !perf) pose = lerpPose(pose, { ...POSES.floor, hd: 1.0, tr: 0.45, fa1: 0.35, fa2: 0.2, ba1: 0.3, ba2: 0.18 }, resultBlend(S, 0.1, 0.6)); // se desanima
    }
    drawFigure(ctx, { x, y, pose: breathe(pose, t, 0.5), F, facing, kind: pe.kind, pe, alpha: personDim(S), neutral: k1 > 0.5 ? 'none' : undefined });
    // el segundo (si lo hay) espera en la orilla
    if (S.people[1]) drawFigure(ctx, { x: bx0 - L / 2 - F * 0.55, pose: breathe(POSES.stand, t + 1), F, facing: 1, kind: S.people[1].kind, pe: S.people[1], alpha: personDim(S) });
    if (S.good && land > 0.5) glow(ctx, xo + F * 0.18, -F * 0.9, F * 0.6, AMBER, 0.4 * land);
  },
};
