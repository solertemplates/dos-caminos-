// Dos Caminos — composición del video: fondo de estrellas, división, textos, escenas y línea de tiempo.
import { SCENES, clamp, smooth, lerp, glow, RED } from './scenes.js';
import { WHITE } from './figure.js';

export const W = 1080, H = 1920, FPS = 30;
const FONT = '"Helvetica Neue", "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif';

export function makeTimeline(D) {
  const end = D <= 15 ? 3.6 : D <= 30 ? 5 : 6.5;
  const res = D <= 15 ? 2.2 : 3.0;
  const mainStart = 1.8;
  const endStart = D - end;
  const resStart = endStart - res;
  const mainDur = resStart - mainStart;
  const C = Math.max(4, Math.min(22, Math.round(mainDur / 1.6)));
  return { D, hookHold: 1.2, mainStart, resStart, endStart, mainDur, res, end, C };
}

export function stateAt(tl, t) {
  if (t < tl.hookHold) return { phase: 'hook', p: 1, r: 1, hookK: t / tl.hookHold, endK: 0 };
  if (t < tl.mainStart) {
    const k = smooth((t - tl.hookHold) / (tl.mainStart - tl.hookHold));
    return { phase: 'rewind', p: 1 - k, r: 1 - k, rewK: k, endK: 0 };
  }
  if (t < tl.resStart) return { phase: 'main', p: (t - tl.mainStart) / tl.mainDur, r: 0, endK: 0 };
  if (t < tl.endStart) return { phase: 'result', p: 1, r: (t - tl.resStart) / tl.res, endK: 0 };
  return { phase: 'end', p: 1, r: 1, endK: (t - tl.endStart) / tl.end };
}

// Zona segura de reels: arriba ~130 px y abajo desde ~1380 px los tapan los textos y botones
// de Instagram/Facebook/TikTok; a la derecha, la columna de botones. Todo lo importante va dentro.
export function layoutFor(kind) {
  if (kind === 'lr') {
    return {
      kind,
      panels: [
        { cx: 270, groundY: 960, stageW: 510, F: 255, titleY: 235, tw: 470, clip: [0, 130, 538, 1250], size: 36, sub: 26, align: 'center' },
        { cx: 800, groundY: 960, stageW: 500, F: 255, titleY: 235, tw: 460, clip: [542, 130, 538, 1250], size: 36, sub: 26, align: 'center' },
      ],
      divider: [540, 180, 540, 1300],
      endY: 230,
    };
  }
  return {
    kind: 'ab',
    panels: [
      { cx: 520, groundY: 640, stageW: 940, F: 245, titleY: 205, tx: 50, tw: 900, clip: [0, 130, 1080, 612], size: 44, sub: 28, align: 'left' },
      { cx: 520, groundY: 1262, stageW: 940, F: 245, titleY: 827, tx: 50, tw: 900, clip: [0, 748, 1080, 612], size: 44, sub: 28, align: 'left' },
    ],
    divider: [40, 745, 1040, 745],
    endY: 205,
  };
}

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

export function makeStars(seed) {
  const R = rng(seed * 7 + 1);
  const stars = [];
  for (let i = 0; i < 170; i++) {
    stars.push({ x: R() * W, y: R() * H, r: 0.6 + R() * R() * 2.2, ph: R() * 6.28, sp: 0.4 + R() * 1.4, a: 0.25 + R() * 0.55 });
  }
  return stars;
}

function drawStars(ctx, stars, t) {
  ctx.fillStyle = WHITE;
  for (const s of stars) {
    const y = (s.y + t * 3 * s.sp) % H;
    ctx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph));
    ctx.beginPath();
    ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// texto espaciado y centrado (no depende de ctx.letterSpacing)
function spaced(ctx, text, x, y, sp, left = false) {
  const chars = [...text];
  let total = 0;
  const ws = chars.map((c) => { const m = ctx.measureText(c).width; total += m; return m; });
  total += sp * (chars.length - 1);
  let cx = left ? x : x - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += ws[i] + sp; });
  return total;
}
function spacedWidth(ctx, text, sp) {
  return [...text].reduce((a, c) => a + ctx.measureText(c).width, 0) + sp * Math.max(0, [...text].length - 1);
}
function wrap(ctx, text, maxW, sp = 0) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (spacedWidth(ctx, test, sp) > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function counterText(tpl, p) {
  return (tpl || '').replace(/\{\s*(\d+)\s*[-–]\s*(\d+)\s*\}/g, (_, a, b) => {
    a = +a; b = +b;
    return String(Math.round(a + (b - a) * clamp(p)));
  });
}

function shootingStar(ctx, t) {
  const k = (t - 0.15) / 0.8;
  if (k < 0 || k > 1) return;
  const x = lerp(860, 260, k), y = lerp(110, 420, k);
  const g = ctx.createLinearGradient(x, y, x + 180, y - 95);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = Math.sin(k * Math.PI);
  ctx.strokeStyle = g;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180, y - 95); ctx.stroke();
  ctx.restore();
}

// job: { texts:{hook,phrase,question,signature,sides:[{title,sub}]}, sides:[{scene,people,good,bad}], layout, tl, seed, stars }
export function renderFrame(ctx, job, t, scale = 1) {
  const { tl, layout } = job;
  const st = stateAt(tl, t);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  drawStars(ctx, job.stars, t);
  if (t < 1.2) shootingStar(ctx, t);

  // línea divisoria: se dibuja desde el centro al inicio
  const dk = smooth(t / 0.5);
  const [x1, y1, x2, y2] = layout.divider;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  ctx.save();
  ctx.strokeStyle = WHITE;
  ctx.globalAlpha = 0.22 * (st.phase === 'end' ? 1 - smooth(st.endK * 4) : 1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lerp(mx, x1, dk), lerp(my, y1, dk));
  ctx.lineTo(lerp(mx, x2, dk), lerp(my, y2, dk));
  ctx.stroke();
  ctx.restore();

  const endDim = st.phase === 'end' ? 1 - 0.55 * smooth(st.endK * 2.5) : 1;
  const hookIn = smooth(t / 0.35);

  job.sides.forEach((side, i) => {
    const pn = layout.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(...pn.clip);
    ctx.clip();
    ctx.translate(pn.cx, pn.groundY);
    const S = {
      w: pn.stageW, F: pn.F, people: side.people, good: side.good, bad: side.bad,
      p: clamp(st.p), r: clamp(st.r), t, C: tl.C, seed: job.seed + i * 13,
      dimmed: !side.good && st.r > 0.4,
    };
    let a = endDim * hookIn;
    if (!side.good && st.phase !== 'main') a *= 1 - 0.25 * clamp(st.r);
    ctx.globalAlpha = a;
    const sceneAlpha = a;
    const scene = SCENES[side.scene] || SCENES.arbol;
    // las escenas fijan su propio globalAlpha; lo multiplicamos con un contenedor
    withAlpha(ctx, sceneAlpha, () => scene.draw(ctx, S));
    ctx.restore();
  });

  // textos de cada lado
  const titleA = st.phase === 'hook' || st.phase === 'rewind' ? smooth((t - 1.35) / 0.45) : st.phase === 'end' ? 1 - smooth(st.endK * 4) : 1;
  job.sides.forEach((side, i) => {
    const pn = layout.panels[i];
    const tx = job.texts.sides[i];
    if (titleA <= 0.001) return;
    ctx.save();
    ctx.fillStyle = WHITE;
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = titleA;
    const left = pn.align === 'left';
    const ax = left ? pn.tx : pn.cx;
    ctx.font = `400 ${pn.size}px ${FONT}`;
    const lines = wrap(ctx, tx.title.toUpperCase(), pn.tw, pn.size * 0.18);
    let y = pn.titleY;
    for (const ln of lines.slice(0, 3)) { spaced(ctx, ln, ax, y, pn.size * 0.18, left); y += pn.size * 1.2; }
    if (tx.sub) {
      ctx.font = `400 ${pn.sub}px ${FONT}`;
      ctx.globalAlpha = titleA * 0.6;
      const sub = counterText(tx.sub, st.p).toUpperCase();
      for (const ln of wrap(ctx, sub, pn.tw, pn.sub * 0.24).slice(0, 2)) { spaced(ctx, ln, ax, y + pn.sub * 0.25, pn.sub * 0.24, left); y += pn.sub * 1.3; }
    }
    ctx.restore();
  });

  // gancho (primeros 2 segundos)
  if (t < 1.75 && job.texts.hook) {
    const a = smooth(t / 0.25) * (1 - smooth((t - 1.2) / 0.45));
    ctx.save();
    ctx.fillStyle = WHITE;
    ctx.globalAlpha = a;
    ctx.font = `300 42px ${FONT}`;
    const lines = wrap(ctx, job.texts.hook, 900, 3);
    let y = layout.kind === 'lr' ? 230 : 200;
    for (const ln of lines.slice(0, 2)) { spaced(ctx, ln, W / 2, y, 3); y += 54; }
    ctx.restore();
  }

  // cierre: frase de reflexión + pregunta
  if (st.phase === 'end') {
    const e = st.endK * tl.end;
    ctx.save();
    ctx.fillStyle = WHITE;
    const topY = layout.endY;
    const pa = smooth((e - 0.35) / 0.8);
    ctx.globalAlpha = pa;
    const fs = job.texts.phrase.length > 70 ? 38 : 44;
    ctx.font = `300 ${fs}px ${FONT}`;
    const lines = wrap(ctx, job.texts.phrase, 920, 1);
    let y = topY;
    for (const ln of lines.slice(0, 4)) { spaced(ctx, ln, W / 2, y, 1); y += fs * 1.32; }
    if (job.texts.signature) {
      ctx.globalAlpha = pa * 0.55;
      ctx.font = `300 24px ${FONT}`;
      spaced(ctx, job.texts.signature, W / 2, y + 4, 3);
      y += 40;
    }
    const qa = smooth((e - 1.5) / 0.8);
    if (job.texts.question && qa > 0) {
      ctx.globalAlpha = qa;
      ctx.font = `400 36px ${FONT}`;
      y += 30;
      for (const ln of wrap(ctx, job.texts.question, 920, 1).slice(0, 2)) { spaced(ctx, ln, W / 2, y, 1); y += 48; }
      // pequeño corazón rojo como acento final
      const hk = smooth((e - 2.1) / 0.6);
      if (hk > 0) {
        glow(ctx, W / 2, y + 12, 50 * hk, RED, 0.7);
        ctx.globalAlpha = 1;
        drawMiniHeart(ctx, W / 2, y + 14, 22 * hk);
      }
    }
    ctx.restore();
  }
}

function drawMiniHeart(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = RED;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.05, s * 0.25, -s * 0.55, -s * 0.05, -s * 0.5, -s * 0.3);
  ctx.bezierCurveTo(-s * 0.45, -s * 0.6, -s * 0.08, -s * 0.62, 0, -s * 0.32);
  ctx.bezierCurveTo(s * 0.08, -s * 0.62, s * 0.45, -s * 0.6, s * 0.5, -s * 0.3);
  ctx.bezierCurveTo(s * 0.55, -s * 0.05, s * 0.05, s * 0.25, 0, s * 0.35);
  ctx.fill();
  ctx.restore();
}

// Las escenas asignan globalAlpha directamente; este envoltorio multiplica su opacidad.
function withAlpha(ctx, a, fn) {
  if (a >= 0.999) return fn();
  const desc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalAlpha');
  const proto = Object.getPrototypeOf(ctx);
  const d = Object.getOwnPropertyDescriptor(proto, 'globalAlpha') || desc;
  Object.defineProperty(ctx, 'globalAlpha', {
    configurable: true,
    get() { return d.get.call(ctx) / a; },
    set(v) { d.set.call(ctx, v * a); },
  });
  d.set.call(ctx, a);
  try { fn(); } finally { delete ctx.globalAlpha; }
}
