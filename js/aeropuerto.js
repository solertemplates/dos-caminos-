// Dos Caminos — escena «aeropuerto»: la terminal, la pista, un avión con su escalerilla.
// Acciones: despedirse (dice adiós con la mano y mira cómo se va el avión), esperar (espera mirando al cielo),
// subir-avion (camina con la maleta, sube la escalerilla, el avión despega y se va haciendo pequeño en el cielo),
// llegar-avion (el avión aparece pequeño en el cielo, aterriza, baja con su maleta y camina hacia quien lo espera).
// Mismo sello: líneas blancas, ventanas con luz cálida, fondo de color con estrellas (lo pone render.js).
import { SCENES, AMBER, RED, smooth, lerp, glow, kit } from './scenes.js';
import { POSES, lerpPose, walkPose, breathe, figureSize, WHITE, BG } from './figure.js';
import { drawObject } from './objects.js';

const { setLine, line, groundLine, resultBlend, bump, personDim, drawFigure } = kit;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const TRAVEL = new Set(['subir-avion', 'llegar-avion']);

// avión de perfil; (x, y) = punto del suelo bajo el centro; L = largo; dir = hacia dónde mira el morro (-1 izquierda)
function plane(ctx, F, x, y, L, { dir = -1, pitch = 0, gear = 1, a = 1, door = 0 } = {}) {
  if (a <= 0.01 || L < 2) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.rotate(-pitch);
  ctx.globalAlpha *= a;
  ctx.strokeStyle = WHITE;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1, Math.min(F * 0.016, L * 0.012));
  const h = L * 0.15, cy = -L * 0.17; // alto y centro del fuselaje
  // fuselaje (relleno del color del fondo para tapar lo de detrás)
  ctx.beginPath();
  ctx.moveTo(-L * 0.42, cy + h / 2);
  ctx.lineTo(L * 0.36, cy + h / 2);
  ctx.quadraticCurveTo(L * 0.52, cy + h / 2, L * 0.5, cy + h * 0.05);
  ctx.quadraticCurveTo(L * 0.46, cy - h / 2, L * 0.34, cy - h / 2);
  ctx.lineTo(-L * 0.34, cy - h / 2);
  ctx.lineTo(-L * 0.5, cy - h * 0.62);
  ctx.lineTo(-L * 0.47, cy + h * 0.1);
  ctx.closePath();
  ctx.save(); ctx.fillStyle = BG; ctx.fill(); ctx.restore();
  ctx.stroke();
  // cola
  ctx.beginPath(); ctx.moveTo(-L * 0.33, cy - h / 2); ctx.lineTo(-L * 0.47, cy - h * 1.75); ctx.lineTo(-L * 0.5, cy - h * 0.62); ctx.stroke();
  // ala (en perspectiva, por debajo)
  ctx.beginPath(); ctx.moveTo(L * 0.1, cy + h * 0.2); ctx.lineTo(-L * 0.16, cy + h * 0.85); ctx.lineTo(-L * 0.25, cy + h * 0.85); ctx.lineTo(-L * 0.04, cy + h * 0.2); ctx.stroke();
  // cabina
  ctx.beginPath(); ctx.moveTo(L * 0.4, cy - h * 0.12); ctx.lineTo(L * 0.47, cy - h * 0.1); ctx.stroke();
  // ventanillas con luz cálida
  ctx.save(); ctx.fillStyle = AMBER; ctx.globalAlpha *= 0.85;
  for (let k = -0.28; k <= 0.3; k += 0.06) { ctx.beginPath(); ctx.arc(L * k, cy - h * 0.08, Math.max(0.8, L * 0.008), 0, 7); ctx.fill(); }
  ctx.restore();
  // puerta (detrás del ala, lejos de la cola para que la escalerilla no se cruce con ella)
  const dx = -L * 0.12;
  ctx.strokeRect(dx - L * 0.022, cy - h * 0.38, L * 0.044, h * 0.78);
  if (door > 0) { ctx.save(); ctx.fillStyle = AMBER; ctx.globalAlpha *= 0.55 * door; ctx.fillRect(dx - L * 0.02, cy - h * 0.36, L * 0.04, h * 0.74); ctx.restore(); }
  // tren de aterrizaje
  if (gear > 0.02) {
    ctx.save(); ctx.globalAlpha *= gear;
    for (const gx of [L * 0.34, -L * 0.24]) { ctx.beginPath(); ctx.moveTo(gx, cy + h / 2); ctx.lineTo(gx, -L * 0.025); ctx.stroke(); ctx.beginPath(); ctx.arc(gx, -L * 0.025, L * 0.022, 0, 7); ctx.stroke(); }
    ctx.restore();
  }
  // luz roja que parpadea (de noche se ve a lo lejos)
  ctx.restore();
  return { doorX: x + dir * dx, doorY: y + cy + h * 0.4 };
}

// escalerilla: de la puerta (dx, dy) al suelo, hacia el lado «side»
function stairs(ctx, F, dx, dy, side, a = 1) {
  if (a <= 0.01) return null;
  const run = Math.abs(dy) * 1.25, bx = dx + side * run;
  ctx.save(); ctx.globalAlpha *= a;
  setLine(ctx, F, 0.8 * a, 0.85);
  line(ctx, dx, dy, bx, 0);
  line(ctx, dx, dy - F * 0.22, bx, -F * 0.22);
  const n = 6;
  for (let i = 1; i < n; i++) { const k = i / n; line(ctx, lerp(dx, bx, k), lerp(dy, 0, k), lerp(dx, bx, k), lerp(dy, 0, k) - F * 0.025); }
  line(ctx, bx, 0, bx + side * F * 0.25, 0);
  line(ctx, bx + side * F * 0.25, 0, bx + side * F * 0.25, -F * 0.18);
  ctx.restore();
  return { bx, dx, dy, yAt: (x) => lerp(dy, 0, clamp((x - dx) / (bx - dx))) };
}

// maleta con ruedas: tirada detrás (en el suelo) o en la mano (al subir/bajar escaleras)
function suitcase(ctx, F, fig, x, y, facing, carried, a = 1) {
  const s = F * 0.26;
  if (carried) { drawObject(ctx, 'maleta', fig.bh[0], fig.bh[1] + s * 0.75, s * 0.9, { fade: 1 - a }); return; }
  const sx = x - facing * F * 0.34;
  drawObject(ctx, 'maleta', sx, y, s, { fade: 1 - a });
  ctx.save(); ctx.globalAlpha *= a; setLine(ctx, F, 0.8 * a, 0.7); line(ctx, fig.bh[0], fig.bh[1], sx + facing * s * 0.1, y - s * 0.78); ctx.restore();
}

SCENES.aeropuerto = {
  events(S) {
    const t = (S.people.find((p) => TRAVEL.has(p.act)) || {}).act;
    const ev = [];
    if (t === 'subir-avion') ev.push({ p: 0.1, type: 'step' }, { p: 0.2, type: 'step' }, { p: 0.38, type: 'step' }, { p: 0.6, type: 'whoosh', vol: 0.9 }, { p: 0.72, type: 'wind' }, { p: 0.85, type: 'wind' });
    if (t === 'llegar-avion') ev.push({ p: 0.05, type: 'wind' }, { p: 0.22, type: 'whoosh', vol: 0.8 }, { p: 0.4, type: 'thud', vol: 0.5 }, { p: 0.66, type: 'step' }, { p: 0.8, type: 'step' });
    if (S.good) ev.push({ r: 0.4, type: 'chime' }); else ev.push({ r: 0.3, type: 'low' });
    return ev;
  },
  draw(ctx, S) {
    const { w, F, t, p } = S;
    const narrow = w < 2.5 * F;
    const neutral = kit.getNeutral();
    groundLine(ctx, F, -w / 2, w / 2);
    // pista: rayas que pasan bajo el avión
    setLine(ctx, F, 0.35, 0.7);
    for (let x = -w / 2 + F * 0.1; x < w * 0.2; x += F * 0.42) line(ctx, x, F * 0.1, x + F * 0.2, F * 0.1);
    // terminal a la derecha: edificio con ventanal encendido y su puerta
    const tw = narrow ? F * 0.62 : F * 1.15, th = F * (narrow ? 1.05 : 1.25);
    const tx1 = w / 2 - F * 0.04, tx0 = tx1 - tw;
    setLine(ctx, F, 0.8, 0.9);
    ctx.strokeRect(tx0, -th, tw, th);
    line(ctx, tx0 - F * 0.06, -th, tx1, -th);
    ctx.save(); ctx.fillStyle = AMBER; ctx.globalAlpha = 0.18; ctx.fillRect(tx0 + tw * 0.12, -th * 0.86, tw * 0.76, th * 0.32); ctx.restore();
    setLine(ctx, F, 0.6, 0.7);
    ctx.strokeRect(tx0 + tw * 0.12, -th * 0.86, tw * 0.76, th * 0.32);
    for (let k = 1; k < 4; k++) line(ctx, tx0 + tw * (0.12 + 0.19 * k), -th * 0.86, tx0 + tw * (0.12 + 0.19 * k), -th * 0.54);
    const doorX = tx0 + tw * 0.3;
    ctx.strokeRect(doorX - F * 0.1, -F * 0.5, F * 0.2, F * 0.5);
    // torre de control pequeña
    if (!narrow) { setLine(ctx, F, 0.5, 0.7); line(ctx, tx0 + tw * 0.85, -th, tx0 + tw * 0.85, -th - F * 0.3); ctx.strokeRect(tx0 + tw * 0.74, -th - F * 0.46, tw * 0.22, F * 0.16); }

    const list = S.people.length ? S.people.slice(0, 2) : [{ kind: 'hombre', act: 'subir-avion' }];
    const trav = list.find((pe) => TRAVEL.has(pe.act));
    const mode = trav ? trav.act : null;
    // avión: aparcado en el centro, mirando a la izquierda (la pista sigue hacia la izquierda)
    const L = Math.min(F * 2.8, w * (narrow ? 0.7 : 0.72));
    const px = -w * 0.17;
    const vx = -w * 0.36, vy = Math.max(S.box ? S.box.top * 0.78 : -2.2 * F, -2.4 * F); // punto del cielo donde se pierde
    let pl = { x: px, y: 0, L, pitch: 0, gear: 1, a: 1, door: 0 };
    let stairsA = 1, trail = 0;
    const q = neutral > 0.5 ? 0 : p;
    if (mode === 'subir-avion') {
      pl.door = bump(q, 0.3, 0.5, 0.04);
      stairsA = 1 - smooth((q - 0.5) / 0.05);
      if (q > 0.55) {
        const roll = smooth(clamp((q - 0.55) / 0.15)), lift = clamp((q - 0.68) / 0.32);
        const rollD = F * (narrow ? 0.35 : 0.6);
        const xr = px - rollD * roll * roll;
        const e = smooth(lift);
        // despega: sube el morro, recoge las ruedas y se aleja haciéndose pequeño, siempre hacia delante (a la izquierda)
        const vxT = px - rollD - F * (narrow ? 0.4 : 0.75);
        pl.x = lerp(xr, vxT, e); pl.y = lerp(0, vy, e); pl.L = L * lerp(1, 0.07, Math.pow(e, 0.8));
        pl.pitch = 0.2 * smooth(lift / 0.25) * (1 - 0.6 * e); pl.gear = 1 - smooth(lift / 0.2);
        trail = e;
      }
    } else if (mode === 'llegar-avion') {
      // aparece pequeño en el cielo por la derecha (sobre la terminal) y baja hacia la izquierda, con el morro
      // por delante; toca tierra, frena y se para (un avión nunca va de cola)
      const land = clamp(q / 0.4), e = smooth(land);
      const xs = px + F * (narrow ? 0.45 : 0.9);
      const vxR = w * 0.3;
      if (q < 0.4) { pl.x = lerp(vxR, xs, e); pl.y = lerp(vy, 0, Math.pow(e, 1.4)); pl.L = L * lerp(0.07, 1, Math.pow(e, 1.2)); pl.pitch = -0.08 * (1 - e); pl.gear = smooth((land - 0.55) / 0.3); trail = 1 - e; }
      else { const k = smooth(clamp((q - 0.4) / 0.15)); pl.x = lerp(xs, px, k); }
      stairsA = smooth((q - 0.55) / 0.05);
      pl.door = bump(q, 0.58, 0.7, 0.04);
    } else stairsA = 1;
    // estela en el cielo
    if (trail > 0.02) {
      ctx.save(); ctx.globalAlpha = 0.25 * (mode === 'subir-avion' ? 1 : trail); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1, F * 0.006);
      ctx.beginPath(); ctx.moveTo(pl.x + pl.L * 0.45, pl.y - pl.L * 0.15); ctx.quadraticCurveTo(lerp(pl.x, px, 0.5), lerp(pl.y, 0, 0.3) - F * 0.2, mode === 'subir-avion' ? px - F * 0.9 : w * 0.45, mode === 'subir-avion' ? -F * 0.12 : vy * 1.05); ctx.stroke(); ctx.restore();
    }
    S._plane = { x: pl.x, y: pl.y };
    const tiny = pl.L < L * 0.14;
    const P = plane(ctx, F, pl.x, pl.y, pl.L, { dir: -1, pitch: pl.pitch, gear: pl.gear, a: 1, door: pl.door }) || { doorX: px + L * 0.3, doorY: -L * 0.14 };
    if (tiny && (mode === 'subir-avion' ? q > 0.9 : q < 0.15)) { const bl = 0.5 + 0.5 * Math.sin(t * 6); glow(ctx, pl.x, pl.y - pl.L * 0.15, F * 0.09, RED, 0.8 * bl); }
    // escalerilla hacia la terminal (derecha)
    const st = pl.x === px || mode !== 'subir-avion' ? stairs(ctx, F, P.doorX, P.doorY, 1, stairsA) : null;
    const stBx = st ? st.bx : P.doorX + Math.abs(P.doorY) * 1.25;

    // personas
    const waitX = doorX + (narrow ? -F * 0.05 : -F * 0.28);
    const figs = [];
    list.forEach((pe, i) => {
      const H = figureSize(pe.kind, F);
      let x, y = 0, pose, facing = -1, show = 1, carried = false, bag = false;
      if (TRAVEL.has(pe.act)) {
        bag = true;
        const startX = waitX - F * 0.42 * (list.length > 1 ? 1 : 0);
        if (pe.act === 'subir-avion') {
          if (q < 0.33) { // camina de la terminal a la escalerilla tirando de la maleta
            const k = smooth(q / 0.33); x = lerp(startX, stBx, k);
            facing = Math.sign(stBx - startX) || -1; // mira hacia donde camina
            const d = Math.abs(x - startX); pose = q > 0.01 ? walkPose(d / (F * 0.4) * Math.PI) : breathe(POSES.stand, t);
          } else if (q < 0.46) { // sube un escalón por paso, con la maleta en la mano
            const k = (q - 0.33) / 0.13; x = lerp(stBx, P.doorX + F * 0.05, k); y = st ? st.yAt(x) : 0; facing = -1; // sube hacia la puerta
            pose = walkPose(Math.abs(y) / (F * 0.09) * Math.PI); carried = true;
          } else { x = P.doorX; y = P.doorY; show = 1 - smooth((q - 0.46) / 0.04); pose = POSES.stand; carried = true; }
        } else { // llegar-avion
          if (q < 0.6) { show = 0; x = P.doorX; pose = POSES.stand; }
          else if (q < 0.72) { const k = (q - 0.6) / 0.12; x = lerp(P.doorX + F * 0.05, stBx, k); y = st ? st.yAt(x) : 0; pose = walkPose(Math.abs(P.doorY - y) / (F * 0.09) * Math.PI); facing = 1; carried = true; show = smooth((q - 0.6) / 0.03); }
          else { // camina hacia quien espera
            const goal = list.length > 1 ? waitX - F * 0.45 : waitX;
            const k = smooth(clamp((q - 0.72) / 0.25)); x = lerp(stBx, goal, k); facing = Math.sign(goal - stBx) || 1;
            const d = Math.abs(x - stBx); pose = k < 1 ? walkPose(d / (F * 0.4) * Math.PI) : breathe(POSES.stand, t);
            if (S.r > 0 && S.good && list.length > 1) pose = lerpPose(pose, POSES.hug, resultBlend(S, 0.05, 0.5));
          }
        }
        if (neutral > 0.5) { x = startX; y = 0; show = 1; pose = POSES.stand; carried = false; facing = -1; }
      } else {
        // quien se queda: despedirse (adiós con la mano, luego mira cómo se va) o esperar (mira al cielo)
        x = waitX + (i ? F * 0.05 : 0);
        const planeUp = pl.y < -F * 0.3;
        if (pe.act === 'despedirse' || pe.act === 'saludar') {
          const wave = bump(q, 0.3, 0.72, 0.05);
          pose = lerpPose(breathe(POSES.stand, t), { ...POSES.stand, fa1: 2.55, fa2: 2.75 + Math.sin(t * 10) * 0.35, hd: -0.15 }, wave);
          if (planeUp) pose = { ...pose, hd: -0.45 };
        } else {
          pose = breathe({ ...POSES.stand, fa1: 0.35, fa2: 1.9, ba1: 0.3, ba2: 1.85 }, t);
          if (planeUp || mode === 'llegar-avion' && q < 0.45) pose = { ...pose, hd: -0.4 };
          if (mode === 'llegar-avion' && q > 0.72) facing = -1;
        }
        if (S.r > 0) pose = S.good ? (list.length > 1 && mode === 'llegar-avion' ? lerpPose(pose, POSES.hug, resultBlend(S, 0.05, 0.5)) : lerpPose(pose, { ...POSES.stand, hd: -0.4, fa1: 0.4, fa2: 1.9 }, resultBlend(S))) : lerpPose(pose, POSES.slump, resultBlend(S));
      }
      if (show <= 0.01) return;
      const fig = drawFigure(ctx, { x, y, pose, F, facing, kind: pe.kind, pe, alpha: personDim(S) * show });
      if (bag && fig && neutral < 0.5) { S.objHand = true; suitcase(ctx, F, fig, x, y, facing, carried, show); }
      figs.push(fig);
    });
    if (S.good) S.focus = [waitX - F * 0.2, -F * 1.35];
    if (S.object && !S.objHand) S.objSpot = [tx0 - F * 0.2, 0];
  },
};
