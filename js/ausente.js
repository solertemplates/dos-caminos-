// Dos Caminos — acción «ausente»: el personaje NO está en la escena principal.
// Se dibuja pequeño en una esquina, en otro lugar (fiesta con luces, amigos apagados de fondo,
// se ríe con el móvil, baila, se ríe con ellos), lejos de quien lo espera.
// Los amigos son siluetas apagadas del decorado, no personajes: los únicos personajes son los del guion.
import { drawFigure as rawFigure, POSES, lerpPose, breathe, WHITE } from './figure.js';
import { kit, glow, AMBER, clamp, smooth } from './scenes.js';

// caja de la esquina «otro lugar» si la escena no dice dónde (S.vignette)
function defaultBox(S) {
  const { F, box } = S;
  const tall = -box.top > 2.6 * F; // pantalla dividida a los lados: hay sitio arriba, bajo el título
  // en la esquina contraria a quien se queda en la escena
  const pos = S.moments?.pos || {};
  const xs = Object.entries(pos).filter(([k]) => S.allPeople?.[k] && S.allPeople[k].act !== 'ausente').map(([, v]) => v.x);
  const right = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length < 0 : true;
  if (tall) { const w = Math.min(1.35 * F, box.r - box.l - 0.2 * F); return { x: right ? box.r - w - 0.08 * F : box.l + 0.08 * F, y: -2.05 * F, w, h: 0.72 * F }; }
  const w = 0.95 * F;
  return { x: right ? box.r - w - 0.06 * F : box.l + 0.06 * F, y: -1.25 * F, w, h: 0.66 * F };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// lo que hace en el otro lugar: se ríe con el móvil → se ríe con los amigos → baila (cada ~2,6 s, con transición suave)
function absentPose(t, j) {
  const T = 2.6, q = t / T + j * 0.37, ph = Math.floor(q) % 3, k = q - Math.floor(q);
  const bounce = Math.abs(Math.sin(t * 13));
  const poses = [
    { ...POSES.phone, tr: 0.02 - 0.04 * bounce, hd: 0.45 - 0.1 * bounce }, // se ríe con la pantalla
    { ...POSES.stand, tr: -0.08 + 0.03 * Math.sin(t * 16), hd: -0.32 + 0.06 * Math.sin(t * 16), fa1: 0.5, fa2: 2.1, ba1: 0.45, ba2: 1.9 }, // carcajada con los amigos
    { ...POSES.armsUp, tr: 0.06 * Math.sin(t * 6), fa2: 2.85 + 0.2 * Math.sin(t * 6), ba2: 2.75 - 0.2 * Math.sin(t * 6) }, // baila
  ];
  const a = poses[ph], b = poses[(ph + 1) % 3];
  return { pose: lerpPose(a, b, smooth((k - 0.85) / 0.15)), phone: ph === 0 && k < 0.9, dance: ph === 2 };
}

export function drawAbsent(ctx, S, list) {
  if (!list.length) return;
  const { F, t } = S;
  const b = S.vignette || defaultBox(S);
  ctx.save();
  // marco del «otro lugar»
  ctx.globalAlpha = 0.94; // fondo casi opaco: se lee como otro lugar, no se transparenta la escena
  ctx.fillStyle = '#050505';
  roundRect(ctx, b.x, b.y, b.w, b.h, F * 0.06);
  ctx.fill();
  ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1.2, F * 0.007); ctx.globalAlpha = 0.45;
  ctx.stroke();
  ctx.save();
  roundRect(ctx, b.x, b.y, b.w, b.h, F * 0.06);
  ctx.clip();
  // luces de fiesta que parpadean
  for (let i = 0; i < 7; i++) {
    const x = b.x + b.w * (0.08 + i * 0.14), y = b.y + b.h * 0.12 + Math.sin((i / 6) * Math.PI) * b.h * 0.08;
    const on = 0.55 + 0.45 * Math.sin(t * 4 + i * 1.7);
    glow(ctx, x, y, F * 0.07, i % 2 ? AMBER : '#FF7A45', 0.5 * on);
    ctx.globalAlpha = 0.9 * on; ctx.fillStyle = i % 2 ? AMBER : '#FF7A45';
    ctx.beginPath(); ctx.arc(x, y, F * 0.012, 0, 7); ctx.fill();
  }
  const gy = b.y + b.h * 0.93;
  ctx.globalAlpha = 0.35; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1, F * 0.006);
  ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.04, gy); ctx.lineTo(b.x + b.w * 0.96, gy); ctx.stroke();
  const Fv = clamp(b.h * 0.95, F * 0.3, F * 0.6);
  // amigos de la fiesta: siluetas apagadas que bailan (decorado, no personajes)
  for (let i = 0; i < 2; i++) {
    const sway = Math.sin(t * 5 + i * 2);
    rawFigure(ctx, { x: b.x + b.w * (0.66 + i * 0.18), y: gy, pose: { ...POSES.armsUp, tr: 0.08 * sway, fa2: 2.8 + 0.25 * sway }, F: Fv * 0.92, facing: -1, kind: i ? 'mujer' : 'hombre', alpha: 0.22 });
  }
  // notas de música
  ctx.globalAlpha = 0.5; ctx.fillStyle = WHITE; ctx.font = `${Math.round(F * 0.08)}px system-ui, sans-serif`;
  for (let i = 0; i < 2; i++) { const q = (t * 0.5 + i * 0.5) % 1; ctx.globalAlpha = 0.5 * (1 - q); ctx.fillText('♪', b.x + b.w * (0.5 + i * 0.12), b.y + b.h * (0.62 - q * 0.35)); }
  ctx.restore();
  // la persona ausente (con su pe: los sucesos de la historia, p. ej. «distraído», también le pasan aquí)
  list.forEach((pe, j) => {
    const { pose, phone, dance } = absentPose(t, j);
    const x = b.x + b.w * (0.3 + 0.16 * j) + (dance ? Math.sin(t * 3) * Fv * 0.05 : 0);
    const fig = kit.drawFigure(ctx, { x, y: gy, pose: breathe(pose, t), F: Fv, facing: 1, kind: pe.kind, pe, alpha: 1, neutral: 'none', noArc: true });
    if (phone && fig) kit.phoneAt(ctx, fig.fh, Fv);
  });
  ctx.restore();
}
