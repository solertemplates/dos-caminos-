// Dos Caminos — acción «ausente»: el personaje NO está con quien lo espera.
// Está en OTRO lugar, en el mismo suelo de la escena pero al fondo y al otro lado, más pequeño por la distancia:
// en la calle, junto a una farola (y un banco si cabe), riéndose con el móvil o con dos siluetas grises de amigos.
// Entre los dos, la pared de la casa con la puerta cerrada. Los amigos son siluetas del decorado, no personajes.
import { drawFigure as rawFigure, POSES, lerpPose, breathe, WHITE, BG } from './figure.js';
import { kit, glow, AMBER, smooth } from './scenes.js';

// dónde está la pared y hacia qué lado queda la calle (la escena «mesa» lo fija en S.outside)
function outsideOf(S) {
  if (S.outside) return S.outside;
  const { F, w } = S;
  const pos = S.moments?.pos || {};
  const xs = Object.entries(pos).filter(([k]) => S.allPeople?.[k] && S.allPeople[k].act !== 'ausente').map(([, v]) => v.x);
  const side = xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length < 0 ? 1 : -1) : 1;
  const narrow = w < 2.5 * F;
  return { side, wallX: side * (w / 2 - (narrow ? 0.62 : 1.25) * F) };
}

// lo que hace fuera: se ríe con el móvil → se ríe con los amigos (cada ~2,8 s, con transición suave)
function absentPose(t, j) {
  const T = 2.8, q = t / T + j * 0.37, ph = Math.floor(q) % 2, k = q - Math.floor(q);
  const b = Math.abs(Math.sin(t * 13));
  const poses = [
    { ...POSES.phone, tr: 0.02 - 0.04 * b, hd: 0.45 - 0.1 * b },
    { ...POSES.stand, tr: -0.08 + 0.03 * Math.sin(t * 16), hd: -0.32 + 0.06 * Math.sin(t * 16), fa1: 0.5, fa2: 2.1, ba1: 0.45, ba2: 1.9 },
  ];
  return { pose: lerpPose(poses[ph], poses[(ph + 1) % 2], smooth((k - 0.86) / 0.14)), phone: ph === 0 && k < 0.9 };
}

export function drawAbsent(ctx, S, list) {
  if (!list.length) return;
  const { F, t, w } = S;
  const { side, wallX } = outsideOf(S);
  const narrow = w < 2.5 * F;
  const edge = side * w / 2;
  const room = Math.abs(edge - wallX); // espacio de la calle
  const k = narrow ? 0.5 : 0.6; // más pequeño por la distancia
  const Fv = F * k;
  // si la escena se dibujó más pequeña para dejar sitio, la calle lleva su propio suelo (el mismo suelo, a ras)
  if (S.sceneTx && S.sceneTx.s !== 1) kit.groundLine(ctx, F, Math.min(wallX, edge), Math.max(wallX, edge));
  ctx.save();
  // pared de la casa con la puerta cerrada (separa a quien espera de quien no viene)
  const wh = F * 1.35, dw = F * (narrow ? 0.22 : 0.3), dh = F * 1.02;
  ctx.strokeStyle = WHITE; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(2, F * 0.016);
  ctx.beginPath(); ctx.moveTo(wallX, 0); ctx.lineTo(wallX, -wh); ctx.stroke();
  ctx.globalAlpha = 0.95; ctx.fillStyle = BG;
  ctx.fillRect(wallX - dw / 2, -dh, dw, dh);
  ctx.lineWidth = Math.max(1.6, F * 0.012);
  ctx.strokeRect(wallX - dw / 2, -dh, dw, dh);
  ctx.globalAlpha = 0.5; ctx.strokeRect(wallX - dw / 2 + dw * 0.14, -dh + dh * 0.08, dw * 0.72, dh * 0.38);
  ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(wallX - side * dw * 0.3, -dh * 0.48, F * 0.014, 0, 7); ctx.stroke();
  // la calle: farola con luz cálida (y un banco si cabe)
  const at = (f) => wallX + side * room * f;
  const lx = at(0.2), lh = F * 1.25 * k + F * 0.35;
  ctx.globalAlpha = 0.7; ctx.lineWidth = Math.max(1.4, F * 0.01);
  ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, -lh); ctx.lineTo(lx + side * F * 0.12 * k, -lh); ctx.stroke();
  glow(ctx, lx + side * F * 0.12 * k, -lh + F * 0.04, F * 0.45 * k + F * 0.1, AMBER, 0.55);
  ctx.globalAlpha = 0.95; ctx.fillStyle = AMBER;
  ctx.beginPath(); ctx.arc(lx + side * F * 0.12 * k, -lh + F * 0.035, F * 0.028, 0, 7); ctx.fill();
  if (!narrow && room > 1.2 * F) {
    const bx = at(0.8), bw = F * 0.36 * k;
    ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(1.2, F * 0.008);
    ctx.beginPath(); ctx.moveTo(bx - bw, -F * 0.2 * k); ctx.lineTo(bx + bw, -F * 0.2 * k);
    ctx.moveTo(bx - bw * 0.8, -F * 0.2 * k); ctx.lineTo(bx - bw * 0.8, 0); ctx.moveTo(bx + bw * 0.8, -F * 0.2 * k); ctx.lineTo(bx + bw * 0.8, 0);
    ctx.moveTo(bx - bw, -F * 0.42 * k); ctx.lineTo(bx + bw, -F * 0.42 * k); ctx.stroke();
  }
  ctx.restore();
  // dos amigos: siluetas grises que se ríen, mirándolo
  for (let i = 0; i < 2; i++) {
    const sh = Math.sin(t * 15 + i * 2);
    rawFigure(ctx, { x: at(narrow ? 0.72 + i * 0.2 : 0.58 + i * 0.16), pose: { ...POSES.stand, tr: -0.06 + 0.03 * sh, hd: -0.25 + 0.05 * sh, fa1: 0.45, fa2: 2.0, ba1: 0.4, ba2: 1.9 }, F: Fv * 0.95, facing: -side, kind: i ? 'mujer' : 'hombre', alpha: 0.5, color: '#8C8C8C' });
  }
  // el ausente (con su pe: los sucesos de la historia, p. ej. «distraído», también le pasan aquí)
  list.forEach((pe, j) => {
    const { pose, phone } = absentPose(t, j);
    const fig = kit.drawFigure(ctx, { x: at(narrow ? 0.48 : 0.4) - side * j * Fv * 0.3, pose: breathe(pose, t), F: Fv, facing: side, kind: pe.kind, pe, alpha: 0.95, neutral: 'none', noArc: true });
    if (phone && fig) kit.phoneAt(ctx, fig.fh, Fv);
  });
}
