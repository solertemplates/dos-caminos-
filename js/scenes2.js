// Dos Caminos — 15 escenas nuevas con el mismo sello (ver MAESTRO.md).
// Coordenadas de escenario: x de -w/2 a w/2, y = 0 es el suelo, y negativo hacia arriba.
// Cada escena tiene un decorado propio, reconocible desde el primer segundo.
import { SCENES, RED, GOLD, AMBER, FLAME, COLD, clamp, smooth, lerp, glow, heart, star, kit } from './scenes.js';
import { POSES, lerpPose, walkPose, breathe, figureSize, WHITE, BG } from './figure.js';

const { obj, setLine, line, groundLine, groundMass, phoneAt, cycle, workPose, resultBlend, bump, frac, rng, personDim, drawFigure, flame, getNeutral } = kit;
const ORANGE = '#F4A259';
const THROWABLE = new Set(['pelota', 'manzana', 'osito', 'flor', 'globo', 'pan', 'llave', 'moneda', 'carta', 'libro', 'sombrero', 'zapatos', 'regalo']);
const isPhone = (a) => a === 'celular' || a === 'phone' || a === 'ignorar';
const P = (S, i, def) => S.people[i] || (i === 0 ? def : null);

// pose final según el resultado
function fin(S, pose, goodPose = POSES.look, badPose = POSES.slump, a = 0, b = 0.5) {
  if (S.r <= 0) return pose;
  return lerpPose(pose, S.good ? goodPose : badPose, resultBlend(S, a, b));
}
function chair(ctx, F, x, H, facing) {
  const seatY = -0.245 * H * 0.98;
  setLine(ctx, F, 0.6, 0.7);
  line(ctx, x - F * 0.11, seatY, x + F * 0.11, seatY);
  line(ctx, x - facing * F * 0.11, seatY, x - facing * F * 0.11, seatY - F * 0.3);
  line(ctx, x - F * 0.09, seatY, x - F * 0.09, 0);
  line(ctx, x + F * 0.09, seatY, x + F * 0.09, 0);
}
function rect(ctx, x, y, w, h) { ctx.strokeRect(x, y, w, h); }
function circle(ctx, x, y, r, fill = false) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); fill ? ctx.fill() : ctx.stroke(); }
function smoke(ctx, F, x, y, amt, t, gray = true) {
  if (amt <= 0.02) return;
  setLine(ctx, F, (gray ? 0.3 : 0.4) * amt, 0.6);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const yy = y - k * F * 0.035 * (0.6 + amt);
      const xx = x + Math.sin(k * 0.5 + t * 1.4 + i * 2) * F * 0.04 * (1 + k * 0.06) + (i - 1) * F * 0.03;
      k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    }
    ctx.stroke();
  }
}
function std(S, extra = []) {
  const ev = [...extra];
  if (S.good) ev.push({ r: 0.4, type: 'chime' });
  else ev.push({ r: 0.3, type: 'low' });
  return ev;
}
const perCycle = (S, type, at = 0.6, extra = {}) => Array.from({ length: S.C }, (_, k) => ({ p: (k + at) / S.C, type, ...extra }));

// ---------------- COCINA ----------------
SCENES.cocina = {
  events(S) { const a = P(S, 0, { act: 'cocinar' }).act; return std(S, a === 'cocinar' ? perCycle(S, 'ting', 0.5, {}).filter((_, i) => i % 2 === 0) : perCycle(S, 'blip')); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const cx = w * 0.08, cw = F * 0.85, ch = F * 0.42;
    // repisa con utensilios colgados
    setLine(ctx, F, 0.6, 0.7);
    line(ctx, cx - cw * 0.55, -F * 1.15, cx + cw * 0.55, -F * 1.15);
    [[-0.3, 'ladle'], [-0.05, 'pan'], [0.22, 'spoon']].forEach(([o, k]) => {
      const x = cx + cw * o;
      line(ctx, x, -F * 1.15, x, -F * 1.0);
      if (k === 'pan') circle(ctx, x, -F * 0.95, F * 0.05);
      else if (k === 'ladle') { ctx.beginPath(); ctx.arc(x, -F * 0.97, F * 0.03, 0, Math.PI); ctx.stroke(); }
      else line(ctx, x - F * 0.02, -F * 0.98, x + F * 0.02, -F * 0.98);
    });
    // mueble y fogones
    setLine(ctx, F, 0.9, 0.85);
    rect(ctx, cx - cw / 2, -ch, cw, ch);
    line(ctx, cx, -ch, cx, 0);
    setLine(ctx, F, 0.6, 0.6);
    circle(ctx, cx - cw * 0.08, -ch * 0.5, F * 0.012, true);
    circle(ctx, cx + cw * 0.08, -ch * 0.5, F * 0.012, true);
    const pe = P(S, 0, { kind: 'mujer', act: 'cocinar' });
    const cooks = pe.act === 'cocinar' || pe.act === 'cook';
    const px = cx - cw * 0.18, pt = -ch - F * 0.14;
    // olla
    setLine(ctx, F, 0.95, 0.85);
    rect(ctx, px - F * 0.11, pt, F * 0.22, F * 0.14);
    line(ctx, px - F * 0.15, pt + F * 0.03, px - F * 0.11, pt + F * 0.03);
    line(ctx, px + F * 0.11, pt + F * 0.03, px + F * 0.15, pt + F * 0.03);
    line(ctx, px - F * 0.12, pt, px + F * 0.12, pt);
    const neutral = getNeutral();
    S.objSpot = [cx + cw * 0.3, -ch];
    if (cooks) {
      // vapor que crece y platos servidos
      smoke(ctx, F, px, pt, (0.3 + 0.7 * smooth(S.p)) * (1 - neutral), t, false);
      const plates = S.object ? 0 : Math.min(4, Math.floor(S.p * 4.99));
      setLine(ctx, F, 0.85, 0.7);
      for (let i = 0; i < plates; i++) { ctx.beginPath(); ctx.ellipse(cx + cw * 0.28, -ch - F * 0.012 - i * F * 0.022, F * 0.1, F * 0.012, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (S.good && S.r > 0) glow(ctx, px, pt - F * 0.2, F * 0.8 * smooth(S.r), AMBER, 0.6);
      if (S.good) S.focus = [px, pt - F * 0.62];
    } else {
      // la olla se quema: humo gris y una llamita naranja
      const burn = smooth(S.p) * (1 - neutral);
      flame(ctx, px, -ch - 0.002, 0.12 * burn * (1 - 0.8 * smooth(S.r)), F * 0.6, t);
      smoke(ctx, F, px, pt, burn + S.r, t);
    }
    // cocinero
    let x = cx - cw / 2 - F * 0.2, pose;
    if (cooks) {
      pose = { ...breathe(POSES.stand, t), tr: 0.1, hd: 0.35, fa1: 1.1 + 0.15 * Math.sin(t * 4), fa2: 1.7 + 0.25 * Math.cos(t * 4), ba1: 0.2 };
      pose = fin(S, pose, POSES.look, POSES.slump);
    } else pose = fin(S, breathe(POSES.phone, t), POSES.look, POSES.slump);
    const fig = drawFigure(ctx, { x, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (cooks && S.r < 0.3 && neutral < 0.5) { setLine(ctx, F, 1, 0.6); line(ctx, fig.fh[0], fig.fh[1], px - F * 0.02, pt + F * 0.06); }
    if (!cooks && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    // quien espera para comer
    const p2 = S.people[1];
    if (p2) {
      const x2 = cx + cw / 2 + F * 0.38, H = figureSize(p2.kind, F);
      chair(ctx, F, x2, H, -1);
      let pose2 = isPhone(p2.act) ? breathe(POSES.sitPhone, t + 1) : { ...breathe(POSES.sitTalk, t + 1), fa1: 0.5 + 0.2 * Math.sin(t * 2), fa2: 1.6 };
      pose2 = fin(S, pose2, POSES.sitReach, POSES.sitSlump);
      const f2 = drawFigure(ctx, { x: x2, pose: pose2, F, facing: -1, kind: p2.kind, alpha: personDim(S) });
      if (isPhone(p2.act) && S.r < 0.4) phoneAt(ctx, f2.fh, F);
    }
  },
};

// ---------------- OFICINA ----------------
SCENES.oficina = {
  events(S) { const a = P(S, 0, { act: 'trabajar' }).act; return std(S, a === 'trabajar' ? perCycle(S, 'tock', 0.5, { detune: 2.4 }) : perCycle(S, 'blip')); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const dx = -w * 0.02, dw = F * 0.75, dh = F * 0.38;
    const pe = P(S, 0, { kind: 'hombre', act: 'trabajar' });
    const works = pe.act === 'trabajar' || pe.act === 'construir' || pe.act === 'work';
    const neutral = getNeutral();
    // gráfica en la pared
    const gx = w * 0.3, gy = -F * 1.25, gw = F * 0.52, gh = F * 0.42;
    setLine(ctx, F, 0.7, 0.7);
    rect(ctx, gx - gw / 2, gy, gw, gh);
    const lvl = works && S.good ? 0.25 + 0.75 * smooth(S.p) : works ? 0.4 : 0.6 - 0.45 * smooth(S.p) - 0.1 * S.r;
    const bars = [0.35, 0.55, 0.75, 1].map((b, i) => (works && S.good ? b * lvl : (1 - i * 0.22) * lvl));
    bars.forEach((b, i) => { const bx = gx - gw * 0.38 + i * gw * 0.22; const bh = (gh - F * 0.06) * clamp(b * (1 - neutral) + 0.2 * neutral, 0.05, 1); setLine(ctx, F, 0.85, 0.7); rect(ctx, bx, gy + gh - F * 0.03 - bh, gw * 0.13, bh); });
    if (S.good && S.r > 0.2) {
      const k = smooth((S.r - 0.2) / 0.4);
      ctx.save(); ctx.strokeStyle = ORANGE; ctx.lineWidth = Math.max(2, F * 0.016); ctx.globalAlpha = k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(gx - gw * 0.4, gy + gh * 0.8); ctx.lineTo(lerp(gx - gw * 0.4, gx + gw * 0.42, k), lerp(gy + gh * 0.8, gy + gh * 0.1, k)); ctx.stroke(); ctx.restore();
      S.focus = [gx, gy - F * 0.25];
    }
    // mesa, pantalla y teclado
    setLine(ctx, F, 0.9, 0.9);
    line(ctx, dx - dw / 2, -dh, dx + dw / 2, -dh);
    line(ctx, dx - dw / 2 + F * 0.05, -dh, dx - dw / 2 + F * 0.05, 0);
    line(ctx, dx + dw / 2 - F * 0.05, -dh, dx + dw / 2 - F * 0.05, 0);
    rect(ctx, dx - F * 0.08, -dh - F * 0.3, F * 0.3, F * 0.2);
    line(ctx, dx + F * 0.07, -dh - F * 0.1, dx + F * 0.07, -dh);
    if (works && S.r < 0.5) glow(ctx, dx + F * 0.07, -dh - F * 0.2, F * 0.3, WHITE, 0.25 * (1 - neutral));
    // pila de hojas terminadas
    const papers = S.object ? 0 : works ? Math.min(8, Math.floor(S.p * (S.good ? 8.9 : 3))) : 1;
    S.objSpot = [dx + dw * 0.38, -dh];
    setLine(ctx, F, 0.7, 0.6);
    for (let i = 0; i < papers; i++) line(ctx, dx + dw * 0.3, -dh - F * 0.012 * (i + 1), dx + dw * 0.45, -dh - F * 0.012 * (i + 1));
    // trabajador
    const x = dx - dw / 2 - F * 0.06, H = figureSize(pe.kind, F);
    chair(ctx, F, x, H, 1);
    let pose;
    if (works) pose = { ...POSES.typing, fa2: 1.5 + 0.12 * Math.sin(t * 12), ba2: 1.45 + 0.12 * Math.sin(t * 12 + 1.5) };
    else if (pe.act === 'dormir') pose = breathe({ ...POSES.sitSlump, tr: 0.75, hd: 0.9, fa1: 1.2, fa2: 1.8 }, t * 0.6, 2);
    else pose = breathe(POSES.sitPhone, t);
    pose = fin(S, pose, { ...POSES.sitReach, fa1: 2.6, fa2: 2.8, hd: -0.2 }, POSES.sitSlump);
    const fig = drawFigure(ctx, { x, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (isPhone(pe.act) && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    // compañero al otro lado de la mesa
    const p2 = S.people[1];
    if (p2) {
      const x2 = dx + dw / 2 + F * 0.1, H2 = figureSize(p2.kind, F);
      chair(ctx, F, x2, H2, -1);
      const w2 = p2.act === 'trabajar' || p2.act === 'construir';
      let pose2 = w2 ? { ...POSES.typing, fa2: 1.5 + 0.12 * Math.sin(t * 11 + 2) } : p2.act === 'dormir' ? { ...POSES.sitSlump, tr: 0.75, hd: 0.9 } : breathe(POSES.sitPhone, t + 1);
      pose2 = fin(S, pose2, POSES.sitReach, POSES.sitSlump);
      const f2 = drawFigure(ctx, { x: x2, pose: pose2, F, facing: -1, kind: p2.kind, alpha: personDim(S) });
      if (isPhone(p2.act) && S.r < 0.4) phoneAt(ctx, f2.fh, F);
    }
  },
};

// ---------------- PARQUE ----------------
SCENES.parque = {
  events(S) { return std(S, perCycle(S, 'step', 0.5, { vol: 0.5 })); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // árbol redondo al fondo
    setLine(ctx, F, 0.45, 0.8);
    line(ctx, -w * 0.4, 0, -w * 0.4, -F * 0.75);
    circle(ctx, -w * 0.4, -F * 0.95, F * 0.24);
    // columpio
    const sx = w * 0.32, sh = F * 0.95;
    setLine(ctx, F, 0.75, 0.85);
    line(ctx, sx - F * 0.3, 0, sx - F * 0.2, -sh); line(ctx, sx + F * 0.3, 0, sx + F * 0.2, -sh);
    line(ctx, sx - F * 0.24, -sh, sx + F * 0.24, -sh);
    const swingAmp = S.good ? 0.35 : 0.35 * (1 - smooth(S.p)) + 0.05;
    const sa = Math.sin(t * 2.2) * swingAmp;
    const seatX = sx + Math.sin(sa) * F * 0.62, seatY = -sh + Math.cos(sa) * F * 0.62;
    setLine(ctx, F, 0.6, 0.6);
    line(ctx, sx - F * 0.06, -sh, seatX - F * 0.06, seatY); line(ctx, sx + F * 0.06, -sh, seatX + F * 0.06, seatY);
    setLine(ctx, F, 0.85, 0.9); line(ctx, seatX - F * 0.09, seatY, seatX + F * 0.09, seatY);
    // banco
    const bx = -w * 0.12, bs = -F * 0.22;
    setLine(ctx, F, 0.7, 0.85);
    line(ctx, bx - F * 0.3, bs, bx + F * 0.3, bs); line(ctx, bx - F * 0.3, bs - F * 0.22, bx + F * 0.3, bs - F * 0.22);
    line(ctx, bx - F * 0.25, bs, bx - F * 0.25, 0); line(ctx, bx + F * 0.25, bs, bx + F * 0.25, 0);
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'jugar' }];
    const neutral = getNeutral();
    const xs = [-w * 0.25, w * 0.08];
    const figs = [];
    const playing = list.filter((p) => p.act === 'jugar').length;
    list.forEach((pe, i) => {
      let x = xs[i], pose, facing = i ? -1 : 1, y = 0;
      if (pe.act === 'jugar') {
        const ph = frac(t / 1.3 + i * 0.5);
        pose = lerpPose(breathe(POSES.stand, t), POSES.reach, bump(ph, 0.35, 0.65, 0.12));
      } else if (pe.act === 'caminar') {
        x = xs[i] + Math.sin(S.p * Math.PI * 2) * F * 0.25;
        pose = walkPose(S.p * 40 + i);
      } else if (isPhone(pe.act)) {
        x = bx + (i ? 0.12 : -0.12) * F; facing = 1;
        pose = breathe(POSES.sitPhone, t + i);
      } else pose = breathe(POSES.stand, t);
      if (S.r > 0) {
        if (S.good) { x = lerp(x, (i ? 1 : -1) * F * 0.12 - w * 0.08, smooth(S.r / 0.4)); facing = i ? -1 : 1; pose = S.r < 0.4 ? walkPose(S.r * 20) : lerpPose(POSES.stand, POSES.hug, smooth((S.r - 0.4) / 0.2)); }
        else pose = isPhone(pe.act) ? lerpPose(pose, POSES.sitSlump, resultBlend(S)) : lerpPose(pose, { ...POSES.floor, hd: 0.8 }, resultBlend(S));
      }
      const fig = drawFigure(ctx, { x, y, pose, F, facing, kind: pe.kind, alpha: personDim(S) });
      figs.push(fig);
      if (isPhone(pe.act) && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    });
    // la pelota: entre los dos si juegan juntos, sola si no
    if (neutral < 0.5 && S.r < 0.4) {
      setLine(ctx, F, 0.95, 0.8);
      if (playing === 2 && figs.length === 2) {
        const ph = frac(t / 1.3), from = figs[ph < 0.5 ? 0 : 1].fh, to = figs[ph < 0.5 ? 1 : 0].fh;
        const k = (ph % 0.5) * 2;
        const bx2 = lerp(from[0], to[0], k), by2 = lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * F * 0.45;
        if (S.object && THROWABLE.has(S.object)) obj(ctx, S, bx2, by2 + F * 0.07, F * 0.14); else circle(ctx, bx2, by2, F * 0.045);
      } else {
        const who = list.findIndex((p) => p.act === 'jugar');
        const bxp = (who >= 0 ? xs[who] : xs[1]) + F * 0.25;
        const by2 = -Math.abs(Math.sin(t * 3)) * F * 0.25 * (who >= 0 ? 1 : 0);
        if (S.object && THROWABLE.has(S.object)) obj(ctx, S, bxp, by2, F * 0.16); else circle(ctx, bxp, by2 - F * 0.045, F * 0.045);
      }
    }
    if (S.good) S.focus = [-w * 0.08, -F * 1.35];
    if (S.object && !S.objHand) S.objSpot = [w * 0.32 + F * 0.42, 0];
  },
};

// ---------------- COCHE ----------------
SCENES.coche = {
  events(S) { return std(S, P(S, 0, { act: 'conducir' }).act === 'conducir' ? [] : perCycle(S, 'blip').concat(S.good ? [] : [{ r: 0.08, type: 'crash' }])); },
  draw(ctx, S) {
    const { w, F, t } = S;
    const pe = P(S, 0, { kind: 'hombre', act: 'conducir' });
    const drives = pe.act === 'conducir';
    const neutral = getNeutral();
    const stop = S.r > 0 ? smooth(S.r / 0.5) : 0;
    const speed = (1 - neutral) * (1 - stop);
    // carretera con rayas que pasan
    groundLine(ctx, F, -w / 2, w / 2);
    setLine(ctx, F, 0.45, 0.8);
    const off = ((t * F * 1.4 * speed) % (F * 0.6) + F * 0.6) % (F * 0.6);
    for (let x = -w / 2 - off; x < w / 2; x += F * 0.6) line(ctx, x, F * 0.12, x + F * 0.28, F * 0.12);
    // postes al borde
    setLine(ctx, F, 0.35, 0.6);
    const off2 = ((t * F * 0.9 * speed) % (F * 1.4) + F * 1.4) % (F * 1.4);
    for (let x = -w / 2 - off2; x < w / 2; x += F * 1.4) { line(ctx, x, 0, x, -F * 0.5); circle(ctx, x, -F * 0.55, F * 0.04); }
    // destino (casa con luz) o barrera
    const cx = -w * 0.08;
    if (S.good && S.r > 0) {
      const hx = lerp(w * 0.7, w * 0.3, smooth(S.r / 0.5)), hw = F * 0.5;
      setLine(ctx, F, 0.9, 0.9);
      rect(ctx, hx - hw / 2, -F * 0.5, hw, F * 0.5);
      ctx.beginPath(); ctx.moveTo(hx - hw * 0.6, -F * 0.5); ctx.lineTo(hx, -F * 0.85); ctx.lineTo(hx + hw * 0.6, -F * 0.5); ctx.stroke();
      glow(ctx, hx, -F * 0.3, F * 0.5, AMBER, 0.8);
      ctx.save(); ctx.fillStyle = AMBER; ctx.fillRect(hx - F * 0.05, -F * 0.36, F * 0.1, F * 0.1); ctx.restore();
      S.focus = [hx, -F * 1.15];
    }
    let crash = 0;
    if (!S.good) {
      crash = smooth(S.r / 0.25);
      const bxp = cx + F * 0.95;
      ctx.save(); ctx.beginPath(); ctx.moveTo(bxp, -F * 0.3); ctx.lineTo(bxp - F * 0.1, 0); ctx.lineTo(bxp + F * 0.1, 0); ctx.closePath();
      if (S.r > 0.05) { ctx.fillStyle = ORANGE; ctx.globalAlpha = 0.85 * smooth((S.r - 0.05) / 0.2); ctx.fill(); }
      ctx.restore(); setLine(ctx, F, 0.8, 0.8); ctx.beginPath(); ctx.moveTo(bxp, -F * 0.3); ctx.lineTo(bxp - F * 0.1, 0); ctx.lineTo(bxp + F * 0.1, 0); ctx.closePath(); ctx.stroke();
    }
    // el coche (se tambalea si conduce mirando el móvil)
    const sway = drives ? 0 : Math.sin(t * 3) * 0.05 * smooth(S.p) * (1 - crash);
    ctx.save();
    ctx.translate(cx + crash * F * 0.25, 0);
    ctx.rotate(sway + crash * 0.08);
    const L = F * 1.15, by = -F * 0.12;
    setLine(ctx, F, 0.95, 1);
    ctx.beginPath();
    ctx.moveTo(-L / 2, by); ctx.lineTo(-L / 2, by - F * 0.22); ctx.lineTo(-L * 0.25, by - F * 0.24);
    ctx.lineTo(-L * 0.12, by - F * 0.5); ctx.lineTo(L * 0.2, by - F * 0.5); ctx.lineTo(L * 0.32, by - F * 0.24);
    ctx.lineTo(L / 2, by - F * 0.2); ctx.lineTo(L / 2, by); ctx.stroke();
    line(ctx, -L * 0.36, by, L * 0.36, by);
    if (S.object) { line(ctx, -L * 0.1, by - F * 0.5, L * 0.18, by - F * 0.5); obj(ctx, S, L * 0.04, by - F * 0.51, F * 0.2, { always: true }); }
    for (const wx of [-L * 0.3, L * 0.3]) {
      circle(ctx, wx, -F * 0.1, F * 0.1);
      const a = t * 8 * speed;
      line(ctx, wx + Math.cos(a) * F * 0.06, -F * 0.1 + Math.sin(a) * F * 0.06, wx - Math.cos(a) * F * 0.06, -F * 0.1 - Math.sin(a) * F * 0.06);
    }
    // conductor
    let pose = drives ? breathe(POSES.drive, t) : breathe({ ...POSES.sitPhone, tr: 0.1 }, t);
    pose = fin(S, pose, { ...POSES.drive, hd: -0.15 }, POSES.sitSlump);
    const fig = drawFigure(ctx, { x: -L * 0.05, y: by - F * 0.02, pose, F: F * 0.78, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (drives) { setLine(ctx, F, 0.8, 0.6); circle(ctx, fig.fh[0] + F * 0.03, fig.fh[1], F * 0.05); }
    else if (S.r < 0.5) phoneAt(ctx, fig.fh, F * 0.8);
    const p2 = S.people[1];
    if (p2) {
      let pose2 = isPhone(p2.act) ? breathe(POSES.sitPhone, t + 1) : { ...breathe(POSES.sitTalk, t + 1), fa1: 0.5 + 0.2 * Math.sin(t * 2) };
      pose2 = fin(S, pose2, POSES.sitReach, POSES.sitSlump);
      const f2 = drawFigure(ctx, { x: -L * 0.32, y: by - F * 0.02, pose: pose2, F: F * 0.78, facing: 1, kind: p2.kind, alpha: personDim(S) });
      if (isPhone(p2.act) && S.r < 0.5) phoneAt(ctx, f2.fh, F * 0.8);
    }
    ctx.restore();
    if (crash > 0) smoke(ctx, F, cx + F * 0.7, -F * 0.3, crash, t);
  },
};

// ---------------- GIMNASIO ----------------
SCENES.gimnasio = {
  events(S) { return std(S, P(S, 0, { act: 'entrenar' }).act === 'entrenar' ? perCycle(S, 'tock', 0.5, { detune: 0.7 }) : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // estante con pesas
    const rx = -w * 0.38;
    setLine(ctx, F, 0.55, 0.8);
    line(ctx, rx - F * 0.18, 0, rx - F * 0.18, -F * 0.75); line(ctx, rx + F * 0.18, 0, rx + F * 0.18, -F * 0.75);
    [-0.25, -0.5, -0.72].forEach((y) => { line(ctx, rx - F * 0.18, y * F, rx + F * 0.18, y * F); for (const o of [-0.09, 0.09]) circle(ctx, rx + o * F, y * F - F * 0.035, F * 0.03); });
    // banco y barra
    const bx = w * 0.22;
    S.objSpot = [bx, 0];
    setLine(ctx, F, 0.8, 0.9);
    line(ctx, bx - F * 0.35, -F * 0.2, bx + F * 0.35, -F * 0.2); line(ctx, bx - F * 0.28, -F * 0.2, bx - F * 0.28, 0); line(ctx, bx + F * 0.28, -F * 0.2, bx + F * 0.28, 0);
    line(ctx, bx + F * 0.3, -F * 0.2, bx + F * 0.3, -F * 0.62); line(ctx, bx + F * 0.38, -F * 0.2, bx + F * 0.38, -F * 0.62);
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'entrenar' }];
    const neutral = getNeutral();
    list.forEach((pe, i) => {
      const trains = pe.act === 'entrenar';
      const x = i ? -w * 0.02 : -w * 0.18;
      const plates = trains ? 1 + Math.floor(smooth(S.p) * 3) : 1;
      let pose, bar = false;
      if (trains) {
        const c = 0.5 - 0.5 * Math.cos(t * 3.2 + i);
        pose = { ...breathe(POSES.stand, t), tr: 0.02 - 0.04 * smooth(S.p), fa1: 0.25, fa2: 0.3 + 2.2 * c, ba1: 0.2, ba2: 0.3 + 2.2 * c };
        if (S.r > 0 && S.good) { pose = lerpPose(pose, { ...POSES.armsUp, fa1: 2.9, fa2: 3.0, ba1: 2.9, ba2: 3.0 }, resultBlend(S, 0.05, 0.4)); bar = true; }
        else if (S.r > 0) pose = lerpPose(pose, POSES.slump, resultBlend(S));
      } else {
        pose = breathe(POSES.sitPhone, t + i);
        if (S.r > 0) pose = lerpPose(pose, POSES.sitSlump, resultBlend(S));
      }
      const xx = trains ? x : bx - F * 0.1 + i * F * 0.25;
      const fig = drawFigure(ctx, { x: xx, y: 0, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S), neutral: 'stand' });
      if (neutral < 0.5 && trains) {
        setLine(ctx, F, 0.95, 0.8);
        if (bar) {
          const y = (fig.fh[1] + fig.bh[1]) / 2;
          line(ctx, fig.fh[0] - F * 0.38, y, fig.fh[0] + F * 0.38, y);
          for (let k = 0; k < plates + 1; k++) for (const sd of [-1, 1]) rect(ctx, fig.fh[0] + sd * (F * 0.3 + k * F * 0.035) - F * 0.015, y - F * 0.08, F * 0.03, F * 0.16);
          if (S.good) S.focus = [fig.fh[0], y - F * 0.45];
        } else for (const h of [fig.fh]) {
          line(ctx, h[0] - F * 0.08, h[1], h[0] + F * 0.08, h[1]);
          for (let k = 0; k < plates; k++) for (const sd of [-1, 1]) rect(ctx, h[0] + sd * (F * 0.06 + k * F * 0.025) - F * 0.01, h[1] - F * 0.04, F * 0.02, F * 0.08);
        }
      }
      if (!trains && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    });
    if (S.good && !S.focus) S.focus = [0, -F * 1.4];
  },
};

// ---------------- CAMA ----------------
SCENES.cama = {
  events(S) { return std(S, [{ r: 0.05, type: 'ping' }]); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // ventana: luna de noche, sol al despertar
    const wx = w * 0.3, wy = -F * 1.2, ww = F * 0.5, wh = F * 0.42;
    const morning = S.good ? smooth(S.r / 0.5) : smooth((S.r - 0.2) / 0.6) * 0.7;
    setLine(ctx, F, 0.6, 0.7);
    rect(ctx, wx - ww / 2, wy, ww, wh); line(ctx, wx, wy, wx, wy + wh); line(ctx, wx - ww / 2, wy + wh / 2, wx + ww / 2, wy + wh / 2);
    ctx.save(); ctx.beginPath(); ctx.rect(wx - ww / 2, wy, ww, wh); ctx.clip();
    ctx.fillStyle = WHITE; ctx.globalAlpha = 0.85 * (1 - morning);
    circle(ctx, wx - ww * 0.22, wy + wh * 0.3, F * 0.05, true);
    ctx.fillStyle = BG; circle(ctx, wx - ww * 0.19, wy + wh * 0.27, F * 0.045, true);
    if (morning > 0) { glow(ctx, wx + ww * 0.15, wy + wh * (0.9 - 0.5 * morning), F * 0.5, ORANGE, morning); ctx.globalAlpha = morning; ctx.fillStyle = ORANGE; circle(ctx, wx + ww * 0.15, wy + wh * (0.9 - 0.5 * morning), F * 0.07, true); }
    ctx.restore();
    const beds = S.people.length > 1 ? [[-w * 0.18, 1], [w * 0.2, 0.75]] : [[-w * 0.08, 1]];
    S.objSpot = [beds[0][0] - F * 0.55 - F * 0.16, 0];
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'dormir' }];
    list.forEach((pe, i) => {
      const [bx, sc] = beds[i];
      const bl = F * 1.1 * sc, top = -F * 0.26;
      // cama: cabecera, colchón, patas, almohada, manta
      setLine(ctx, F, 0.85, 0.9);
      line(ctx, bx - bl / 2, 0, bx - bl / 2, top - F * 0.3);
      rect(ctx, bx - bl / 2, top, bl, F * 0.1);
      line(ctx, bx + bl / 2, top + F * 0.1, bx + bl / 2, 0);
      setLine(ctx, F, 0.7, 0.7);
      ctx.beginPath(); ctx.ellipse(bx - bl / 2 + F * 0.13, top - F * 0.04, F * 0.1, F * 0.04, 0, 0, Math.PI * 2); ctx.stroke();
      const act = pe.act;
      let pose, x = bx + F * 0.12 * sc, y = top, facing = -1, phone = false;
      const up = act === 'levantarse' ? smooth((S.p - 0.02) / 0.2) : S.good ? smooth(S.r / 0.4) : 0;
      if (act === 'levantarse' || S.good) {
        if (up < 0.5) pose = lerpPose(POSES.lie, POSES.floor, up * 2);
        else { pose = lerpPose({ ...POSES.floor, tr: 0.1 }, POSES.stretch, (up - 0.5) * 2); }
        facing = up > 0.3 ? 1 : -1;
        if (act === 'levantarse' && up >= 1) {
          // ya levantado: estira y se prepara junto a la cama
          x = bx + bl / 2 + F * 0.3; y = 0;
          pose = lerpPose(breathe(POSES.stand, t), POSES.armsUp, 0.5 + 0.5 * Math.sin(t * 2));
          if (S.r > 0) pose = lerpPose(pose, POSES.armsUp, resultBlend(S));
        } else if (up > 0.3) x = bx - bl * 0.1;
      } else if (isPhone(act)) { pose = breathe(POSES.liePhone, t); phone = S.r < 0.6; if (S.r > 0.4) { pose = lerpPose(POSES.lie, { ...POSES.floor, hd: 0.9, tr: 0.5 }, resultBlend(S, 0.4, 0.8)); x = bx - bl * 0.1; facing = 1; } }
      else { pose = breathe(POSES.lie, t * 0.5, 2); if (S.r > 0.4) { pose = lerpPose(POSES.lie, { ...POSES.floor, hd: 0.9, tr: 0.5 }, resultBlend(S, 0.4, 0.8)); x = bx - bl * 0.1; facing = 1; } }
      const fig = drawFigure(ctx, { x, y, pose, F: F * sc, facing, kind: pe.kind, alpha: personDim(S), neutral: 'none' });
      if (phone) phoneAt(ctx, fig.fh, F);
      // manta sobre las piernas mientras está acostado
      if (pose.tr > 1 && y < 0) { setLine(ctx, F, 0.7, 0.7); ctx.beginPath(); ctx.moveTo(bx - bl * 0.05, top - F * 0.01); ctx.quadraticCurveTo(bx + bl * 0.2, top - F * 0.1, bx + bl / 2, top - F * 0.02); ctx.stroke(); }
    });
    if (S.good) S.focus = [wx, wy - F * 0.3];
  },
};

// ---------------- SOFÁ ----------------
SCENES.sofa = {
  events(S) { const ph = S.people.some((p) => isPhone(p.act)); return std(S, ph ? perCycle(S, 'blip') : []).concat(S.good ? [{ r: 0.4, type: 'heartbeat' }] : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // alfombra y lámpara de pie
    setLine(ctx, F, 0.35, 0.6);
    ctx.beginPath(); ctx.ellipse(0, F * 0.03, F * 0.9, F * 0.04, 0, 0, Math.PI * 2); ctx.stroke();
    const lx = -w * 0.38;
    const lamp = S.good ? 0.5 + 0.4 * S.r : 0.6 * (1 - 0.6 * smooth(S.p)) * (1 - smooth(S.r / 0.5));
    setLine(ctx, F, 0.7, 0.7); line(ctx, lx, 0, lx, -F * 1.0);
    ctx.beginPath(); ctx.moveTo(lx - F * 0.12, -F * 0.95); ctx.lineTo(lx - F * 0.07, -F * 1.12); ctx.lineTo(lx + F * 0.07, -F * 1.12); ctx.lineTo(lx + F * 0.12, -F * 0.95); ctx.closePath(); ctx.stroke();
    glow(ctx, lx, -F * 0.9, F * 0.9, AMBER, lamp);
    // sofá
    const sw = F * 1.25, seat = -F * 0.23;
    setLine(ctx, F, 0.9, 1);
    ctx.beginPath();
    ctx.moveTo(-sw / 2, seat); ctx.lineTo(-sw / 2, -F * 0.6); ctx.lineTo(sw / 2, -F * 0.6); ctx.lineTo(sw / 2, seat); ctx.stroke();
    rect(ctx, -sw / 2 - F * 0.1, -F * 0.38, F * 0.12, F * 0.38); rect(ctx, sw / 2 - F * 0.02, -F * 0.38, F * 0.12, F * 0.38);
    line(ctx, -sw / 2, seat, sw / 2, seat);
    line(ctx, -sw / 2 + F * 0.05, seat, -sw / 2 + F * 0.05, 0); line(ctx, sw / 2 - F * 0.05, seat, sw / 2 - F * 0.05, 0);
    if (S.object) { const tx = sw / 2 + F * 0.28; setLine(ctx, F, 0.7, 0.8); line(ctx, tx - F * 0.12, -F * 0.3, tx + F * 0.12, -F * 0.3); line(ctx, tx, -F * 0.3, tx, 0); line(ctx, tx - F * 0.08, 0, tx + F * 0.08, 0); S.objSpot = [tx, -F * 0.3]; }
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'hablar' }];
    const phones = list.filter((p) => isPhone(p.act)).length;
    const apart = !S.good ? (0.3 * smooth(S.p) + 0.7 * smooth(S.r / 0.6)) : 0;
    const close = S.good ? smooth(S.r / 0.4) : 0;
    list.forEach((pe, i) => {
      const side = list.length === 1 ? 0 : i ? 1 : -1;
      let x = side * F * lerp(0.28, 0.12, close) + side * F * 0.16 * apart;
      if (pe.act === 'abrazar') x = side * F * 0.14;
      let facing = side ? -side : 1;
      let pose;
      if (isPhone(pe.act)) { pose = breathe(POSES.sitPhone, t + i); facing = phones === 2 ? side || 1 : facing; }
      else if (pe.act === 'abrazar') pose = { ...POSES.sitReach, fa1: 1.4, fa2: 2.2, hd: 0.1 };
      else pose = { ...POSES.sitTalk, fa1: 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.3 + i * 2)), fa2: 1.6, hd: -0.05 + 0.1 * Math.sin(t * 1.4 + i) };
      if (S.r > 0) { if (S.good) { pose = lerpPose(pose, { ...POSES.sitReach, fa1: 1.3, fa2: 2.3 }, resultBlend(S, 0.1, 0.45)); facing = side ? -side : 1; } else pose = lerpPose(pose, POSES.sitSlump, resultBlend(S)); }
      const H = figureSize(pe.kind, F);
      const fig = drawFigure(ctx, { x, y: seat + 0.245 * H * 0.98, pose, F, facing, kind: pe.kind, alpha: personDim(S) });
      if (isPhone(pe.act) && S.r < 0.5) phoneAt(ctx, fig.fh, F);
    });
    if (S.good) S.focus = [0, -F * 1.25];
  },
};

// ---------------- HUERTO ----------------
SCENES.huerto = {
  events(S) { const a = P(S, 0, { act: 'sembrar' }).act; return std(S, a === 'regar' ? perCycle(S, 'drip', 0.5) : a === 'sembrar' ? perCycle(S, 'tock', 0.62, { detune: 0.6 }) : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // cerca al fondo
    setLine(ctx, F, 0.3, 0.6);
    for (let x = -w / 2 + F * 0.1; x < w / 2; x += F * 0.3) line(ctx, x, 0, x, -F * 0.35);
    line(ctx, -w / 2, -F * 0.28, w / 2, -F * 0.28);
    const pe = P(S, 0, { kind: 'mujer', act: 'sembrar' });
    S.objSpot = [-w * 0.42, -F * 0.28];
    const N = 5, x0 = -w * 0.02, gap = Math.min(F * 0.42, (w * 0.46) / (N - 1));
    const tends = pe.act === 'sembrar' || pe.act === 'regar';
    const planted = pe.act === 'regar' ? N : tends ? Math.min(N, Math.floor(S.p * N * 1.25 + 0.3)) : 1;
    const neutral = getNeutral();
    for (let i = 0; i < N; i++) {
      const mx = x0 + i * gap;
      setLine(ctx, F, 0.7, 0.8);
      ctx.beginPath(); ctx.ellipse(mx, 0, F * 0.15, F * 0.06, 0, Math.PI, 0); ctx.stroke();
      if (i >= planted) continue;
      let g = tends && S.good ? clamp((S.p - i / (N * 1.25)) * 1.6 + S.r * 0.3) : clamp(S.p * 0.6) * 0.5;
      g *= 1 - neutral;
      const dry = !S.good ? smooth(S.p * 0.5 + S.r) : 0;
      const hgt = F * (0.08 + 0.5 * g) * (1 - 0.3 * dry);
      setLine(ctx, F, 0.9 - 0.4 * dry, 0.8);
      ctx.beginPath(); ctx.moveTo(mx, -F * 0.05); ctx.quadraticCurveTo(mx + dry * F * 0.1, -F * 0.05 - hgt * 0.6, mx + dry * F * 0.15, -F * 0.05 - hgt); ctx.stroke();
      for (let k = 1; k <= Math.floor(1 + g * 3); k++) {
        const ly = -F * 0.05 - hgt * (k / 4.2);
        ctx.save(); ctx.globalAlpha = 0.85 - 0.5 * dry; ctx.fillStyle = WHITE;
        ctx.beginPath(); ctx.ellipse(mx - F * 0.04, ly + dry * F * 0.03, F * 0.04, F * 0.015, -0.5 + dry, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(mx + F * 0.04, ly + dry * F * 0.03, F * 0.04, F * 0.015, 0.5 - dry, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      if (S.good && S.r > 0.25) { const k = smooth((S.r - 0.25) / 0.4); glow(ctx, mx, -F * 0.12, F * 0.2 * k, ORANGE, 0.7); ctx.save(); ctx.fillStyle = ORANGE; ctx.globalAlpha = k; circle(ctx, mx + F * 0.06, -F * 0.1, F * 0.04 * k, true); ctx.restore(); }
    }
    if (S.good) S.focus = [x0 + gap * 2, -F * 1.05];
    // persona: siembra mound a mound, riega o descansa
    const cy = cycle(S.p, S.C);
    let x, pose, can = false;
    if (pe.act === 'sembrar') {
      const idx = Math.min(N - 1, Math.floor(S.p * N * 1.25));
      x = x0 + idx * gap - F * 0.28;
      pose = cy.done ? breathe(POSES.stand, t) : workPose(cy.ph, t);
    } else if (pe.act === 'regar') {
      x = x0 + ((S.p * 2) % 1) * gap * (N - 1) - F * 0.45;
      const pour = cy.done ? 0 : bump(cy.ph, 0.3, 0.75, 0.12);
      pose = lerpPose(POSES.water, { ...POSES.water, fa1: 1.25, fa2: 1.9 }, pour); can = true;
    } else { x = -w * 0.33; pose = breathe(isPhone(pe.act) ? POSES.floorPhone : { ...POSES.floor, hd: 0.8 }, t); }
    pose = fin(S, pose, POSES.look, pe.act === 'descansar' || isPhone(pe.act) ? { ...POSES.floor, hd: 0.9 } : POSES.slump);
    const fig = drawFigure(ctx, { x, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (can && neutral < 0.5 && S.r < 0.3) { setLine(ctx, F, 0.95, 0.8); rect(ctx, fig.fh[0] - F * 0.02, fig.fh[1] - F * 0.01, F * 0.09, F * 0.08); line(ctx, fig.fh[0] + F * 0.07, fig.fh[1] + F * 0.01, fig.fh[0] + F * 0.16, fig.fh[1] - F * 0.04); }
    if (pe.act !== 'sembrar' && pe.act !== 'regar' && isPhone(pe.act) && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    const p2 = S.people[1];
    if (p2) this._c(ctx, S, p2, x0 - F * 0.75);
  },
  _c(ctx, S, p2, x) {
    const { F, t } = S;
    let pose = p2.act === 'sembrar' || p2.act === 'regar' ? lerpPose(breathe(POSES.stand, t + 1), POSES.crouch, 0.5 + 0.5 * Math.sin(t * 2)) : breathe(isPhone(p2.act) ? POSES.phone : POSES.stand, t + 1);
    pose = fin(S, pose, POSES.armsUp, POSES.slump);
    const f = drawFigure(ctx, { x, pose, F, facing: 1, kind: p2.kind, alpha: personDim(S) });
    if (isPhone(p2.act) && S.r < 0.4) phoneAt(ctx, f.fh, F);
  },
};

// ---------------- MONTAÑA ----------------
SCENES.montana = {
  events(S) { const a = P(S, 0, { act: 'escalar' }).act; return std(S, a === 'escalar' || a === 'caer' ? perCycle(S, 'step', 0.5, { vol: 0.7 }) : []).concat(a === 'caer' ? [{ p: 0.5, type: 'thud' }] : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    const bx = -w * 0.12, px = w * 0.24, ph = F * 0.85, ex = w * 0.48;
    const pts = [[bx, 0], [bx + (px - bx) * 0.3, -ph * 0.32], [bx + (px - bx) * 0.45, -ph * 0.4], [bx + (px - bx) * 0.7, -ph * 0.7], [px, -ph], [px + (ex - px) * 0.4, -ph * 0.6], [ex, 0]];
    const slopeY = (x) => { for (let i = 0; i < 4; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; if (x <= x2) return y1 + (y2 - y1) * clamp((x - x1) / (x2 - x1)); } return -ph; };
    // pico lejano
    setLine(ctx, F, 0.25, 0.7);
    ctx.beginPath(); ctx.moveTo(-w * 0.45, 0); ctx.lineTo(-w * 0.3, -ph * 0.55); ctx.lineTo(-w * 0.15, 0); ctx.stroke();
    groundMass(ctx, F, 0, 0, () => { ctx.moveTo(-w / 2, 0); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2, F * 1.4); ctx.lineTo(-w / 2, F * 1.4); });
    groundLine(ctx, F, -w / 2, bx, 0.55, false);
    groundLine(ctx, F, ex, w / 2, 0.55, false);
    setLine(ctx, F, 0.85, 0.9);
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    // nieve en la cima
    setLine(ctx, F, 0.6, 0.6);
    ctx.beginPath(); ctx.moveTo(pts[3][0] + (px - pts[3][0]) * 0.5, -ph * 0.85); ctx.lineTo(px - F * 0.03, -ph * 0.8); ctx.lineTo(px + F * 0.05, -ph * 0.86); ctx.lineTo(pts[5][0] - F * 0.05, -ph * 0.78); ctx.stroke();
    // campamento: tienda
    const tx = -w * 0.38;
    setLine(ctx, F, 0.7, 0.8);
    ctx.beginPath(); ctx.moveTo(tx - F * 0.22, 0); ctx.lineTo(tx, -F * 0.3); ctx.lineTo(tx + F * 0.22, 0); ctx.moveTo(tx, -F * 0.3); ctx.lineTo(tx + F * 0.05, 0); ctx.stroke();
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'escalar' }];
    list.forEach((pe, i) => {
      const act = pe.act;
      let x, y, pose, facing = 1;
      if (act === 'escalar' || act === 'caer') {
        let prog = act === 'caer' ? (S.p < 0.45 ? S.p / 0.45 * 0.45 : lerp(0.45, 0, smooth((S.p - 0.45) / 0.12))) : S.good ? S.p : S.p * 0.55;
        prog = Math.max(0, prog - i * 0.08);
        x = lerp(bx - F * 0.25, px - F * 0.04, prog);
        y = x < bx ? 0 : slopeY(x);
        const fell = act === 'caer' && S.p > 0.45;
        pose = fell ? lerpPose(walkPose(0), { ...POSES.floor, hd: 0.6 }, smooth((S.p - 0.45) / 0.1)) : lerpPose(walkPose(prog * 50), { ...POSES.reachUp, tr: 0.35 }, 0.35 + 0.25 * Math.sin(prog * 50));
        if (S.p >= 1 && !fell) pose = breathe(POSES.stand, t);
        if (S.r > 0) pose = S.good && !fell ? lerpPose(POSES.stand, POSES.armsUp, resultBlend(S, 0.1, 0.5)) : lerpPose(pose, { ...POSES.floor, hd: 0.9 }, resultBlend(S));
        // cuerda desde la base
        if (prog > 0.05 && !fell) { setLine(ctx, F, 0.35, 0.5); ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo((bx + x) / 2, y * 0.3, x - F * 0.05, y - F * 0.4); ctx.stroke(); }
      } else {
        x = tx + F * (0.4 + i * 0.3); y = 0;
        pose = breathe(isPhone(act) ? POSES.floorPhone : POSES.floor, t + i);
        if (S.r > 0.3) pose = lerpPose(pose, { ...POSES.floor, hd: -0.25 }, resultBlend(S, 0.3, 0.7));
      }
      const fig = drawFigure(ctx, { x, y, pose, F, facing, kind: pe.kind, alpha: personDim(S) });
      if (!(act === 'escalar' || act === 'caer') && S.r < 0.3) phoneAt(ctx, fig.fh, F);
    });
    // bandera naranja en la cima al llegar (o el objeto del guion, que espera allí desde el principio)
    if (S.object) { obj(ctx, S, px + F * 0.16, -ph * 0.93, F * 0.22, { always: true }); if (S.good) S.focus = [px - F * 0.25, -ph - F * 1.35]; }
    else if (S.good && S.r > 0.2) {
      const k = smooth((S.r - 0.2) / 0.3);
      setLine(ctx, F, 0.9, 0.8); line(ctx, px + F * 0.12, -ph, px + F * 0.12, -ph - F * 0.4 * k);
      ctx.save(); ctx.fillStyle = ORANGE; ctx.globalAlpha = k; ctx.beginPath(); ctx.moveTo(px + F * 0.12, -ph - F * 0.4 * k); ctx.lineTo(px + F * 0.28, -ph - F * 0.34 * k); ctx.lineTo(px + F * 0.12, -ph - F * 0.28 * k); ctx.fill(); ctx.restore();
      S.focus = [px - F * 0.25, -ph - F * 1.35];
    }
  },
};

// ---------------- LLUVIA ----------------
SCENES.lluvia = {
  events(S) { return std(S, [{ p: 0.02, type: 'wind' }, { p: 0.5, type: 'wind' }]); },
  draw(ctx, S) {
    const { w, F, t } = S;
    const rainK = S.good ? 1 - smooth(S.r / 0.5) : 1;
    const puddle = !S.good ? smooth(S.p * 0.7 + S.r * 0.6) : 0;
    groundLine(ctx, F, -w / 2, w / 2);
    // nubes
    const cloud = (cx, cy, s, a) => { setLine(ctx, F, a, 0.8); ctx.beginPath(); ctx.arc(cx - s * 0.35, cy, s * 0.25, Math.PI * 0.9, Math.PI * 1.9); ctx.arc(cx, cy - s * 0.12, s * 0.33, Math.PI * 1.1, Math.PI * 1.95); ctx.arc(cx + s * 0.38, cy, s * 0.22, Math.PI * 1.2, Math.PI * 2.1); ctx.lineTo(cx - s * 0.6, cy + s * 0.22); ctx.closePath(); ctx.stroke(); };
    const drift = S.good ? smooth(S.r / 0.7) * w * 0.6 : 0;
    cloud(-w * 0.22 - drift, -F * 1.55, F * 0.7, 0.6);
    cloud(w * 0.2 + drift, -F * 1.45, F * 0.55, 0.45);
    // sol al escampar
    if (S.good && S.r > 0.3) { const k = smooth((S.r - 0.3) / 0.4); glow(ctx, w * 0.3, -F * 1.45, F * 0.8 * k, ORANGE, 0.9); ctx.save(); ctx.fillStyle = ORANGE; ctx.globalAlpha = k; circle(ctx, w * 0.3, -F * 1.45, F * 0.1, true); ctx.restore(); }
    // lluvia
    if (rainK > 0.02) {
      const R = rng(7);
      setLine(ctx, F, 0.4 * rainK * (1 + 0.4 * puddle), 0.45);
      for (let i = 0; i < 70; i++) {
        const x = -w / 2 + R() * w, sp = 0.8 + R() * 0.4, ph0 = R();
        const y = -F * 1.4 + frac(t * sp * 0.9 + ph0) * F * 1.45;
        line(ctx, x, y, x - F * 0.02, y + F * 0.07);
      }
    }
    // charco
    if (puddle > 0) { setLine(ctx, F, 0.45, 0.6); ctx.beginPath(); ctx.ellipse(0, F * 0.02, F * (0.3 + 0.5 * puddle), F * 0.03, 0, 0, Math.PI * 2); ctx.stroke(); }
    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'mujer', act: 'paraguas' }];
    const shares = list.some((p) => p.act === 'compartir');
    const close = shares ? 1 : 0;
    const xs = list.length === 1 ? [0] : shares ? [-F * 0.16, F * 0.2] : [-w * 0.2, w * 0.18];
    list.forEach((pe, i) => {
      const act = pe.act;
      let pose, umb = 0;
      const covered = act === 'paraguas' || act === 'compartir' || (shares && i > 0 && list[0].act === 'compartir') || (shares && i === 0 && list[1]?.act === 'compartir');
      if (act === 'paraguas' || act === 'compartir') { pose = breathe(POSES.umbrella, t + i); umb = act === 'compartir' ? 1.5 : 1; }
      else if (covered) pose = breathe(POSES.stand, t + i);
      else pose = { ...breathe(POSES.cold, t * 3 + i, 1.5), tr: 0.15 + 0.02 * Math.sin(t * 20) };
      if (S.r > 0) pose = S.good ? lerpPose(pose, umb ? { ...POSES.umbrella, hd: -0.25 } : POSES.look, resultBlend(S)) : lerpPose(pose, covered ? POSES.stand : POSES.cold, resultBlend(S));
      const fig = drawFigure(ctx, { x: xs[i], pose, F, facing: list.length > 1 ? (i ? -1 : 1) : 1, kind: pe.kind, alpha: personDim(S) });
      if (umb && getNeutral() < 0.5) {
        const h = fig.fh, top = h[1] - F * 0.22, rr = F * 0.32 * umb;
        const cxu = umb > 1 ? (xs[0] + xs[1]) / 2 : h[0];
        setLine(ctx, F, 0.95, 0.9);
        line(ctx, h[0], h[1] + F * 0.05, cxu, top);
        ctx.beginPath(); ctx.arc(cxu, top, rr, Math.PI, 0); ctx.closePath(); ctx.stroke();
        void close;
      } else if (!covered && rainK > 0.3) {
        ctx.save(); ctx.fillStyle = WHITE; ctx.globalAlpha = 0.7;
        for (let d = 0; d < 3; d++) { const q = frac(t * 1.5 + d / 3); circle(ctx, fig.head[0] + (d - 1) * F * 0.05, fig.head[1] + fig.r + q * F * 0.3, F * 0.008, true); }
        ctx.restore();
      }
    });
    if (S.good) S.focus = [0, -F * 1.25];
    S.objSpot = [w * 0.38, 0];
  },
};

// ---------------- TIENDA ----------------
SCENES.tienda = {
  events(S) { return std(S, P(S, 0, { act: 'vender' }).act === 'vender' ? perCycle(S, 'ting', 0.7) : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const sx = w * 0.0, sw = F * 0.95, ch = F * 0.4, top = -F * 1.05;
    const pe = P(S, 0, { kind: 'hombre', act: 'vender' });
    const sells = pe.act === 'vender';
    const dust = sells ? 0 : smooth(S.p * 0.8 + S.r);
    // toldo a rayas con festón
    setLine(ctx, F, 0.9, 0.9);
    line(ctx, sx - sw / 2, top, sx + sw / 2, top);
    ctx.beginPath(); ctx.moveTo(sx - sw / 2, top);
    for (let i = 0; i < 6; i++) { const a = sx - sw / 2 + (i * sw) / 6; ctx.quadraticCurveTo(a + sw / 12, top + F * 0.12 + (sells ? 0 : dust * F * 0.05), a + sw / 6, top); }
    ctx.stroke();
    setLine(ctx, F, 0.45, 0.6);
    for (let i = 1; i < 6; i++) line(ctx, sx - sw / 2 + (i * sw) / 6, top - F * 0.12, sx - sw / 2 + (i * sw) / 6, top);
    setLine(ctx, F, 0.9, 0.9);
    line(ctx, sx - sw / 2, top - F * 0.12, sx + sw / 2, top - F * 0.12);
    line(ctx, sx - sw / 2, top - F * 0.12, sx - sw / 2, 0); line(ctx, sx + sw / 2, top - F * 0.12, sx + sw / 2, 0);
    // mostrador con productos
    rect(ctx, sx - sw * 0.42, -ch, sw * 0.84, ch);
    const R = rng(3);
    for (let i = 0; i < 6; i++) {
      const fx = sx - sw * 0.34 + i * sw * 0.13, fy = -ch - F * 0.04;
      ctx.save(); ctx.globalAlpha = 0.9 - 0.55 * dust; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1.5, F * 0.012);
      if (S.object) { ctx.restore(); obj(ctx, S, fx, -ch, F * 0.11, { always: true, fade: dust }); continue; }
      if (i % 2) circle(ctx, fx, fy, F * 0.035 + R() * F * 0.01); else rect(ctx, fx - F * 0.035, fy - F * 0.03, F * 0.07, F * 0.07);
      ctx.restore();
    }
    // monedas ganadas
    const coins = sells ? Math.min(10, Math.floor(S.p * 10.9)) : 0;
    setLine(ctx, F, 0.85, 0.6);
    for (let i = 0; i < coins; i++) { ctx.beginPath(); ctx.ellipse(sx + sw * 0.32, -ch - F * 0.012 - i * F * 0.018, F * 0.045, F * 0.012, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (S.good && S.r > 0) { glow(ctx, sx + sw * 0.32, -ch - F * 0.1, F * 0.5 * smooth(S.r), GOLD, 0.8); S.focus = [sx, top - F * 0.45]; }
    // vendedor junto al puesto
    const vx = sx - sw / 2 - F * 0.22;
    let pose;
    if (sells) pose = lerpPose(breathe(POSES.stand, t), POSES.reach, bump(frac(S.p * S.C), 0.45, 0.8, 0.1));
    else pose = breathe({ ...POSES.floorPhone }, t);
    pose = fin(S, pose, POSES.armsUp, { ...POSES.floor, hd: 0.9 });
    const fig = drawFigure(ctx, { x: vx, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (!sells && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    // cliente: viene a comprar, o pasa de largo
    const p2 = S.people[1];
    if (p2) {
      const ph = frac(S.p * S.C);
      let x2, pose2, facing2 = -1;
      if (sells && !getNeutral()) {
        const k = ph < 0.4 ? ph / 0.4 : ph < 0.7 ? 1 : 1 - (ph - 0.7) / 0.3;
        x2 = lerp(w * 0.46, sx + sw / 2 + F * 0.1, smooth(k));
        facing2 = ph < 0.7 ? -1 : 1;
        pose2 = ph > 0.4 && ph < 0.7 ? lerpPose(POSES.stand, POSES.reach, bump(ph, 0.45, 0.65, 0.05)) : walkPose(S.p * 60);
      } else {
        x2 = lerp(w * 0.46, -w * 0.46, frac(S.p * 2 + 0.2));
        pose2 = walkPose(S.p * 60);
      }
      if (S.r > 0) { x2 = sx + sw / 2 + F * 0.2; facing2 = -1; pose2 = S.good ? lerpPose(POSES.stand, POSES.look, resultBlend(S)) : POSES.stand; if (!S.good) x2 = w * 0.47; }
      const f2 = drawFigure(ctx, { x: x2, pose: pose2, F, facing: facing2, kind: p2.kind, alpha: personDim(S) });
      if (sells && ph > 0.6 && ph < 1 && !getNeutral()) { setLine(ctx, F, 0.85, 0.6); rect(ctx, f2.fh[0] - F * 0.05, f2.fh[1] - F * 0.02, F * 0.1, F * 0.11); }
    }
  },
};

// ---------------- CARTA ----------------
SCENES.carta = {
  events(S) { return std(S, P(S, 0, { act: 'escribir' }).act === 'escribir' ? perCycle(S, 'page', 0.8) : []); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const pe = P(S, 0, { kind: 'mujer', act: 'escribir' });
    const writes = pe.act === 'escribir';
    // mesita y silla del que escribe
    const dx = -w * 0.3, dh = F * 0.36;
    setLine(ctx, F, 0.85, 0.85);
    line(ctx, dx - F * 0.05, -dh, dx + F * 0.35, -dh); line(ctx, dx + F * 0.3, -dh, dx + F * 0.3, 0); line(ctx, dx, -dh, dx, 0);
    setLine(ctx, F, 0.7, 0.6); rect(ctx, dx + F * 0.08, -dh - F * 0.015, F * 0.14, F * 0.012);
    // buzón
    const mx = w * 0.05;
    setLine(ctx, F, 0.85, 0.85);
    line(ctx, mx, 0, mx, -F * 0.5);
    ctx.beginPath(); ctx.moveTo(mx - F * 0.12, -F * 0.5); ctx.lineTo(mx - F * 0.12, -F * 0.68); ctx.arc(mx, -F * 0.68, F * 0.12, Math.PI, 0); ctx.lineTo(mx + F * 0.12, -F * 0.5); ctx.closePath(); ctx.stroke();
    const flag = writes ? 1 : 0;
    ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(2, F * 0.016); ctx.globalAlpha = flag ? 0.9 : 0.5;
    line(ctx, mx + F * 0.12, -F * 0.6, mx + F * 0.12 + F * 0.1, -F * 0.6 - flag * F * 0.12); ctx.restore();
    // puerta del que recibe
    const rx = w * 0.36;
    setLine(ctx, F, 0.6, 0.8); rect(ctx, rx - F * 0.17, -F * 0.85, F * 0.34, F * 0.85);
    const cy = cycle(S.p, S.C);
    const received = writes ? Math.min(S.C, Math.floor(cy.c + 0.15)) : 0;
    // escritor
    const H = figureSize(pe.kind, F);
    chair(ctx, F, dx - F * 0.1, H, 1);
    let pose = writes ? { ...POSES.typing, fa1: 1.05 + 0.08 * Math.sin(t * 6), fa2: 1.5 + 0.1 * Math.cos(t * 6), hd: 0.45 } : breathe(POSES.sitPhone, t);
    pose = fin(S, pose, POSES.sitReach, POSES.sitSlump);
    const fig = drawFigure(ctx, { x: dx - F * 0.1, pose, F, facing: 1, kind: pe.kind, alpha: personDim(S) });
    if (!writes && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    // carta en vuelo: de la mesa al buzón
    if (writes && !cy.done && getNeutral() < 0.5 && cy.ph > 0.55) {
      const k = (cy.ph - 0.55) / 0.45;
      const ex = lerp(dx + F * 0.15, mx, k), ey = lerp(-dh - F * 0.05, -F * 0.62, k) - Math.sin(k * Math.PI) * F * 0.35;
      if (S.object) obj(ctx, S, ex, ey + F * 0.06, F * 0.14);
      else {
        setLine(ctx, F, 0.95, 0.7); rect(ctx, ex - F * 0.07, ey - F * 0.045, F * 0.14, F * 0.09);
        ctx.beginPath(); ctx.moveTo(ex - F * 0.07, ey - F * 0.045); ctx.lineTo(ex, ey); ctx.lineTo(ex + F * 0.07, ey - F * 0.045); ctx.stroke();
      }
    }
    // quien recibe
    const p2 = S.people[1] || { kind: 'hombre', act: 'esperar' };
    let x2 = rx - F * 0.42, pose2, facing2 = -1;
    if (writes) { pose2 = received > 0 ? { ...breathe(POSES.heart, t), fa2: 2.0 } : breathe(POSES.stand, t); }
    else { const look = bump(frac(S.p * 3), 0.2, 0.6, 0.1); x2 = lerp(rx - F * 0.3, mx + F * 0.3, look); pose2 = lerpPose(breathe(POSES.stand, t), POSES.reach, look * 0.6); }
    if (S.r > 0) { if (S.good) pose2 = lerpPose(pose2, POSES.heart, resultBlend(S)); else { facing2 = 1; x2 = lerp(x2, rx + F * 0.05, resultBlend(S)); pose2 = lerpPose(pose2, POSES.slump, resultBlend(S)); } }
    const f2 = S.people[1] ? drawFigure(ctx, { x: x2, pose: pose2, F, facing: facing2, kind: p2.kind, alpha: personDim(S) }) : null;
    if (f2 && writes && received > 0 && getNeutral() < 0.5) {
      const hx = (f2.fh[0] + f2.bh[0]) / 2, hy = (f2.fh[1] + f2.bh[1]) / 2;
      if (S.object) obj(ctx, S, hx, hy + F * 0.07, F * 0.15);
      else {
        setLine(ctx, F, 0.95, 0.7); rect(ctx, hx - F * 0.07, hy - F * 0.045, F * 0.14, F * 0.09);
        ctx.save(); ctx.fillStyle = RED; circle(ctx, hx, hy, F * 0.015, true); ctx.restore();
      }
      setLine(ctx, F, 0.6, 0.6);
      for (let i = 1; i < Math.min(received, 6); i++) rect(ctx, rx + F * 0.22, -F * 0.03 - i * F * 0.025, F * 0.14, F * 0.02);
    }
    if (S.good) S.focus = [lerp(mx, rx, 0.5), -F * 1.3];
    if (S.object && !writes) { S.objHand = false; S.objSpot = [dx + F * 0.15, -dh]; }
  },
};

// ---------------- RELOJ ----------------
SCENES.reloj = {
  events(S) { return std(S, perCycle(S, 'tock', 0.62, { detune: 1.6 })); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    const pe = P(S, 0, { kind: 'hombre', act: 'aprovechar' });
    const uses = pe.act === 'aprovechar';
    // reloj grande en la pared
    const cx = 0, cyy = -F * 1.2, R = F * 0.34;
    const speed = uses ? 1 : 1 + 6 * smooth(S.p);
    const ang = t * 0.9 * speed;
    if (S.good && S.r > 0) glow(ctx, cx, cyy, F * 0.9 * smooth(S.r), ORANGE, 0.7);
    setLine(ctx, F, 0.9, 1); circle(ctx, cx, cyy, R);
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; const r1 = i % 3 ? R * 0.88 : R * 0.8; line(ctx, cx + Math.cos(a) * r1, cyy + Math.sin(a) * r1, cx + Math.cos(a) * R * 0.95, cyy + Math.sin(a) * R * 0.95); }
    setLine(ctx, F, 1, 1.1);
    line(ctx, cx, cyy, cx + Math.sin(ang / 12) * R * 0.5, cyy - Math.cos(ang / 12) * R * 0.5);
    setLine(ctx, F, 1, 0.7);
    line(ctx, cx, cyy, cx + Math.sin(ang) * R * 0.78, cyy - Math.cos(ang) * R * 0.78);
    ctx.save(); ctx.fillStyle = WHITE; circle(ctx, cx, cyy, F * 0.015, true); ctx.restore();
    // grietas si se pierde el tiempo
    if (!S.good && S.r > 0.2) { setLine(ctx, F, 0.5 * smooth((S.r - 0.2) / 0.3), 0.6); ctx.beginPath(); ctx.moveTo(cx + R * 0.2, cyy - R * 0.9); ctx.lineTo(cx + R * 0.05, cyy - R * 0.4); ctx.lineTo(cx + R * 0.25, cyy - R * 0.1); ctx.stroke(); }
    // tareas: cajas que pasan de la pila izquierda a la torre derecha
    const N = 6, done = uses ? Math.min(N, Math.floor(S.p * N + 0.3)) : 0;
    const lx = -w * 0.36, rx2 = w * 0.3, bs = F * 0.16;
    setLine(ctx, F, 0.8, 0.8);
    for (let i = 0; i < N - done; i++) rect(ctx, lx - bs / 2 + (i % 2) * bs * 0.05, -(i + 1) * bs, bs, bs * 0.92);
    for (let i = 0; i < done; i++) rect(ctx, rx2 - bs / 2, -(i + 1) * bs, bs, bs * 0.92);
    if (S.good) S.focus = [cx, cyy];
    const cy = cycle(S.p, S.C);
    let x, pose, facing = 1;
    if (uses && !cy.done) {
      const k = cy.ph;
      x = lerp(lx + F * 0.25, rx2 - F * 0.3, k < 0.5 ? smooth(k * 2) : 1 - smooth((k - 0.5) * 2));
      facing = k < 0.5 ? 1 : -1;
      pose = k < 0.45 ? lerpPose(walkPose(k * 20), POSES.carry, 0.6) : walkPose(k * 20);
    } else if (uses) { x = rx2 - F * 0.35; pose = breathe(POSES.stand, t); }
    else { x = -w * 0.12; pose = breathe(POSES.floorPhone, t); }
    pose = fin(S, pose, POSES.armsUp, { ...POSES.floor, hd: -0.3 });
    const fig = drawFigure(ctx, { x, pose, F, facing, kind: pe.kind, alpha: personDim(S) });
    if (uses && !cy.done && cy.ph < 0.45 && getNeutral() < 0.5) { if (S.object) { drawObjectHeld(ctx, S, fig.fh, F); } else { setLine(ctx, F, 1, 0.8); rect(ctx, fig.fh[0] - bs / 2, fig.fh[1] - bs * 0.7, bs, bs * 0.9); } }
    S.objSpot = [rx2, -done * bs];
    if (!uses && S.r < 0.4) phoneAt(ctx, fig.fh, F);
    const p2 = S.people[1];
    if (p2) {
      let pose2 = p2.act === 'aprovechar' ? lerpPose(breathe(POSES.stand, t + 1), POSES.crouch, 0.5 + 0.5 * Math.sin(t * 2.4)) : breathe(POSES.floorPhone, t + 1);
      pose2 = fin(S, pose2, POSES.armsUp, { ...POSES.floor, hd: 0.9 });
      const f2 = drawFigure(ctx, { x: p2.act === 'aprovechar' ? rx2 + F * 0.32 : -w * 0.3, pose: pose2, F, facing: -1, kind: p2.kind, alpha: personDim(S) });
      if (p2.act !== 'aprovechar' && S.r < 0.4) phoneAt(ctx, f2.fh, F);
    }
  },
};

function drawObjectHeld(ctx, S, h, F) { obj(ctx, S, h[0], h[1] + F * 0.06, F * 0.15); S.objHand = false; }

// ---------------- TELÉFONO ----------------
SCENES.telefono = {
  events(S) { return std(S, perCycle(S, 'blip', 0.3)); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // dos casas: marco de ventana con techo, una a cada lado
    const rooms = [-w * 0.27, w * 0.27];
    S.objSpot = [rooms[0] + F * 0.27, 0];
    for (const rx of rooms) {
      setLine(ctx, F, 0.55, 0.8);
      rect(ctx, rx - F * 0.42, -F * 1.15, F * 0.84, F * 1.15);
      ctx.beginPath(); ctx.moveTo(rx - F * 0.5, -F * 1.15); ctx.lineTo(rx, -F * 1.42); ctx.lineTo(rx + F * 0.5, -F * 1.15); ctx.stroke();
    }
    const a = P(S, 0, { kind: 'mujer', act: 'llamar' });
    const b = S.people[1];
    const answers = b ? b.act === 'llamar' : S.good;
    const neutral = getNeutral();
    // ondas de la llamada viajando de una casa a la otra
    if (neutral < 0.5 && S.r < 0.5) {
      for (let k = 0; k < 4; k++) {
        const q = frac(t * 0.6 + k / 4);
        const x = lerp(rooms[0] + F * 0.2, rooms[1] - F * 0.2, q);
        setLine(ctx, F, (answers ? 0.6 : 0.6 * (1 - q * (0.5 + 0.5 * smooth(S.p)))), 0.6);
        ctx.beginPath(); ctx.arc(x, -F * 0.85, F * 0.08, -0.6, 0.6); ctx.stroke();
      }
    }
    // al final: línea cálida que une las dos casas
    if (S.good && S.r > 0.2) {
      const k = smooth((S.r - 0.2) / 0.4);
      ctx.save(); ctx.strokeStyle = ORANGE; ctx.globalAlpha = 0.9 * k; ctx.lineWidth = Math.max(2, F * 0.016);
      ctx.beginPath(); ctx.moveTo(rooms[0] + F * 0.15, -F * 0.85); ctx.quadraticCurveTo(0, -F * 1.15, rooms[1] - F * 0.15, -F * 0.85); ctx.stroke(); ctx.restore();
      S.focus = [0, -F * 1.45];
    }
    // quien llama
    let poseA = a.act === 'llamar' ? breathe(POSES.phoneEar, t) : breathe(POSES.phone, t);
    poseA = fin(S, poseA, { ...POSES.phoneEar, hd: -0.15 }, POSES.slump, 0.1, 0.6);
    drawFigure(ctx, { x: rooms[0], pose: poseA, F, facing: 1, kind: a.kind, alpha: personDim(S) });
    if (b) {
      let poseB, facing = -1;
      const ring = bump(frac(S.p * S.C), 0.1, 0.5, 0.1) * (1 - neutral);
      if (b.act === 'llamar') poseB = breathe(POSES.phoneEar, t + 1);
      else { poseB = breathe(POSES.phone, t + 1); facing = 1; }
      poseB = fin(S, poseB, { ...POSES.phoneEar, hd: -0.15 }, POSES.phone);
      const fb = drawFigure(ctx, { x: rooms[1], pose: poseB, F, facing, kind: b.kind, alpha: personDim(S) });
      if (b.act !== 'llamar') {
        phoneAt(ctx, fb.fh, F);
        // el teléfono de la mesa vibra y nadie contesta
        const tx = rooms[1] - F * 0.3;
        setLine(ctx, F, 0.6, 0.7); line(ctx, tx - F * 0.12, -F * 0.36, tx + F * 0.12, -F * 0.36); line(ctx, tx, -F * 0.36, tx, 0);
        setLine(ctx, F, 0.9, 0.6); rect(ctx, tx - F * 0.03 + Math.sin(t * 40) * F * 0.006 * ring, -F * 0.43, F * 0.06, F * 0.06);
        if (ring > 0.1) { setLine(ctx, F, 0.5 * ring, 0.5); ctx.beginPath(); ctx.arc(tx, -F * 0.4, F * 0.09, -2.3, -0.8); ctx.stroke(); }
      }
    }
  },
};

// ---------------- REGALO ----------------
function gift(ctx, F, x, y, s, open = 0, hot = false) {
  setLine(ctx, F, 0.95, 0.8);
  rect(ctx, x - s / 2, y - s, s, s);
  ctx.save(); ctx.strokeStyle = hot ? RED : WHITE; ctx.lineWidth = Math.max(2, F * 0.014); ctx.globalAlpha = hot ? 0.9 : 0.6;
  line(ctx, x, y - s, x, y);
  line(ctx, x - s / 2, y - s / 2, x + s / 2, y - s / 2);
  ctx.restore();
  ctx.save(); ctx.translate(x, y - s - open * F * 0.2); ctx.rotate(-open * 0.5);
  setLine(ctx, F, 0.95, 0.8); ctx.strokeRect(-s * 0.56, -s * 0.18, s * 1.12, s * 0.18);
  ctx.strokeStyle = hot ? RED : WHITE; ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.28, s * 0.12, s * 0.07, 0.4, 0, Math.PI * 2); ctx.ellipse(s * 0.12, -s * 0.28, s * 0.12, s * 0.07, -0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
SCENES.regalo = {
  events(S) { return std(S, P(S, 0, { act: 'dar' }).act === 'dar' ? perCycle(S, 'step', 0.6, { vol: 0.6 }) : perCycle(S, 'bag', 0.6)); },
  draw(ctx, S) {
    const { w, F, t } = S;
    groundLine(ctx, F, -w / 2, w / 2);
    // estante con regalos guardados
    const shx = -w * 0.38;
    setLine(ctx, F, 0.55, 0.8);
    line(ctx, shx - F * 0.2, -F * 0.75, shx + F * 0.2, -F * 0.75); line(ctx, shx - F * 0.2, -F * 0.38, shx + F * 0.2, -F * 0.38);
    line(ctx, shx - F * 0.2, 0, shx - F * 0.2, -F * 0.8); line(ctx, shx + F * 0.2, 0, shx + F * 0.2, -F * 0.8);
    const a = P(S, 0, { kind: 'hombre', act: 'dar' });
    const gives = a.act === 'dar';
    const neutral = getNeutral();
    const stored = !gives ? Math.min(4, Math.floor(S.p * 4.9)) : 0;
    for (let i = 0; i < stored; i++) { const gx = shx - F * 0.1 + (i % 2) * F * 0.2, gy = i < 2 ? -F * 0.38 : -F * 0.75; if (S.object) obj(ctx, S, gx, gy, F * 0.13, { always: true }); else gift(ctx, F, gx, gy, F * 0.12); }
    const recX = w * 0.3;
    const b = S.people[1];
    let x, pose, facing = 1, holding = gives;
    if (gives) {
      x = lerp(-w * 0.2, recX - F * 0.45, smooth(S.p));
      pose = S.p < 1 ? lerpPose(walkPose(S.p * 30), POSES.carry, 0.7) : POSES.carry;
      if (S.r > 0) { pose = lerpPose(POSES.carry, POSES.reach, resultBlend(S, 0, 0.3)); holding = S.r < 0.3; }
    } else {
      const k = frac(S.p * S.C);
      x = lerp(-w * 0.2, shx + F * 0.35, bump(k, 0.15, 0.7, 0.15));
      facing = k > 0.15 && k < 0.45 ? -1 : 1;
      pose = lerpPose(walkPose(S.p * 40), POSES.carry, 0.6);
      holding = k < 0.5 && neutral < 0.5;
      if (S.r > 0) { pose = lerpPose(POSES.stand, POSES.slump, resultBlend(S)); holding = false; facing = 1; }
    }
    const fa = drawFigure(ctx, { x, pose, F, facing, kind: a.kind, alpha: personDim(S) });
    if (holding && neutral < 0.5) { if (S.object) obj(ctx, S, fa.fh[0], fa.fh[1] + F * 0.08, F * 0.18); else gift(ctx, F, fa.fh[0], fa.fh[1] + F * 0.06, F * 0.18); }
    if (b) {
      let pb = breathe(POSES.stand, t + 1), fb = -1;
      if (gives) pb = lerpPose(pb, POSES.reach, smooth(S.p) * 0.4);
      else pb = lerpPose(pb, POSES.heart, 0.3 * (1 - smooth(S.p)));
      if (S.r > 0) { if (S.good) pb = lerpPose(POSES.reach, POSES.heart, resultBlend(S, 0.3, 0.6)); else { pb = lerpPose(pb, POSES.slump, resultBlend(S)); fb = 1; } }
      const fbf = drawFigure(ctx, { x: recX, pose: pb, F, facing: fb, kind: b.kind, alpha: personDim(S) });
      if (gives && S.r >= 0.3) { const k = smooth((S.r - 0.3) / 0.4); if (S.object) obj(ctx, S, recX - F * 0.2, 0, F * 0.22, { hot: k }); else gift(ctx, F, recX - F * 0.2, 0, F * 0.2, k, true); glow(ctx, recX - F * 0.2, -F * 0.25, F * 0.5 * k, ORANGE, 0.8); }
      void fbf;
    }
    if (S.good) S.focus = [recX - F * 0.2, -F * 1.3];
  },
};

export const NEW_SCENES = ['cocina', 'oficina', 'parque', 'coche', 'gimnasio', 'cama', 'sofa', 'huerto', 'montana', 'lluvia', 'tienda', 'carta', 'reloj', 'telefono', 'regalo'];
