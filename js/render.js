// Dos Caminos — composición del video: fondo de estrellas, división, textos, escenas y línea de tiempo.
import { SCENES, clamp, smooth, lerp, glow, heart, RED, AMBER, setNeutral, setCurrent, objState, drawExtras } from './scenes.js';
import { drawObject } from './objects.js';
import { USES } from './uses.js';
import { WHITE, setBG } from './figure.js';

// FONDOS: color oscuro sólido + degradado circular suave y opaco en el centro (el centro un poco más claro).
// Todos con el mismo contraste que el negro para los personajes blancos, el texto y el corazón rojo.
export const BACKGROUNDS = {
  negro: { edge: '#000000', center: '#0b0b0d' },
  azul: { edge: '#040814', center: '#0d1830' },
  marron: { edge: '#0c0704', center: '#1e130b' },
  vino: { edge: '#0e0408', center: '#22080f' },
  verde: { edge: '#030b08', center: '#0a1b14' },
};
export const BG_NAMES = Object.keys(BACKGROUNDS);
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mid = (a, b) => '#' + hexRgb(a).map((v, i) => Math.round((v + hexRgb(b)[i]) / 2).toString(16).padStart(2, '0')).join('');
export function bgOf(job) { return BACKGROUNDS[job.bg] || BACKGROUNDS.negro; }
// velos oscuros (detrás de la frase final, la portada, la noche): del color del fondo, no negro puro
export function veil(job, a) { const [r, g, b] = hexRgb(bgOf(job).edge); return `rgba(${r},${g},${b},${a})`; }
function paintBackground(ctx, job) {
  const P = bgOf(job);
  ctx.fillStyle = P.edge;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.47, 0, W / 2, H * 0.47, H * 0.62);
  g.addColorStop(0, P.center);
  g.addColorStop(1, P.edge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // lo que «tapa» líneas (la saya, la colina, la luna…) se pinta con el color medio del degradado: no se nota la mancha
  setBG(mid(P.edge, P.center));
}
import './scenes2.js';
import './aeropuerto.js';
import './lago.js';
import { planMoments, momentsNow, drawWorldMoments, counterPulse } from './moments.js';
import { drawAbsent } from './ausente.js';
import { cameraAt, camBox } from './camara.js';
import { drawVoz, SPLIT_TRANS, vozOf, alignMomentsToVoz } from './voz.js';
import { viewAt, drawAerial, collectCtx, AERIAL_SCENES } from './angulos.js';

export const W = 1080, H = 1920, FPS = 30;
const FONT = '"Helvetica Neue", "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif';

// split: segundo en que la historia común (INICIO) se divide en los dos caminos; los caminos empiezan ahí
export function makeTimeline(D, split = null) {
  const end = D <= 15 ? 3.6 : D <= 30 ? 5 : 6.5;
  const res = D <= 15 ? 2.2 : 3.0;
  let mainStart = 1.8;
  if (split != null) mainStart = Math.max(1.8, Math.min(split - 0.2, D - end - res - 4));
  const endStart = D - end;
  const resStart = endStart - res;
  const mainDur = resStart - mainStart;
  const C = Math.max(4, Math.min(22, Math.round(mainDur / 1.6)));
  return { D, hookHold: 1.2, mainStart, resStart, endStart, mainDur, res, end, C };
}

// ESCENAS SEGÚN DURACIÓN: 15 s → hasta 3 escenas por lado, 30 s → 5, 45 s → 7, 60 s → 10.
// Si el guion trae más, se usan la primera, la última y las de en medio repartidas; nunca se añaden escenas
// de relleno ni se repite la misma escena dos veces seguidas.
export function maxScenes(D) { return D <= 15 ? 3 : D <= 30 ? 5 : D <= 45 ? 7 : 10; }
export function fitScenes(sides, D) {
  const n = maxScenes(D);
  return sides.map((sd) => {
    const g = sd.segments;
    if (!g || g.length <= 1) return sd;
    let pick = g;
    if (g.length > n) pick = Array.from({ length: n }, (_, k) => g[Math.round((k * (g.length - 1)) / (n - 1))]);
    const same = (a, b) => a.scene === b.scene && a.people.map((p) => p.act).join() === b.people.map((p) => p.act).join();
    pick = pick.filter((x, k) => k === 0 || !same(x, pick[k - 1])); // sin repetir la misma escena seguida
    if (pick.length === g.length) return sd;
    return { ...sd, segments: pick.length > 1 ? pick : null, scene: pick[0].scene, people: pick[0].people };
  });
}

// Inicio de cada escena de un lado, en progreso (0–1): iguales, o los que fija la VOZ (sd.segBounds)
export function segBoundsOf(sd, n) {
  const b = sd && sd.segBounds;
  return b && b.length === n + 1 ? b : Array.from({ length: n + 1 }, (_, k) => k / n);
}
export function segAtP(bounds, p) {
  let k = 0;
  while (k < bounds.length - 2 && p >= bounds[k + 1]) k++;
  const a = bounds[k], b = bounds[k + 1];
  return { k, local: b > a ? clamp((p - a) / (b - a)) : 0 };
}

// Regla de guion: los dos empiezan iguales (neutral = 1). En CHOICE segundos cada uno elige
// distinto y desde ahí la diferencia crece con el progreso p.
export const CHOICE = 0.75;
export function tOfP(tl, p) { return tl.mainStart + CHOICE + clamp(p) * (tl.mainDur - CHOICE); }
// REGLA FIJA: los dos lados empiezan exactamente iguales desde el primer fotograma (nadie empieza en su estado final).
export function stateAt(tl, t) {
  if (t < tl.mainStart) return { phase: 'hook', p: 0, r: 0, hookK: t / tl.mainStart, endK: 0, neutral: 1 };
  if (t < tl.resStart) {
    const tc = t - tl.mainStart;
    return { phase: 'main', p: clamp((tc - CHOICE) / (tl.mainDur - CHOICE)), r: 0, endK: 0, neutral: 1 - smooth((tc - 0.35) / 0.55) };
  }
  if (t < tl.endStart) return { phase: 'result', p: 1, r: (t - tl.resStart) / tl.res, endK: 0, neutral: 0 };
  return { phase: 'end', p: 1, r: 1, endK: (t - tl.endStart) / tl.end, neutral: 0 };
}

// ARCO DE LOS DOS CAMINOS (regla fija):
// 1) los dos hacen lo mismo hasta el momento difícil (pD); 2) a los dos les llega a la vez (caen, se cansan);
// 3) el lado bueno se levanta y sigue; 4) el malo lo intenta un poco y se desanima (baja la cabeza y se sienta).
export const ARC = { pD: 0.38, pause: 1.5, fall: 0.45, rise: [1.0, 1.75], tryT: [1.0, 1.8], quit: [2.15, 3.2] };
export function arcPause(tl) { return clamp(ARC.pause / (tl.mainDur - CHOICE), 0, 0.3); }
// progreso de la escena en cada lado: el bueno se para durante la caída y luego sigue; el malo se queda donde cayó
export function pathP(tl, p, role) {
  const pD = ARC.pD, dp = arcPause(tl);
  if (role === 'bad') return Math.min(p, pD);
  if (role !== 'good') return p;
  if (p < pD) return p;
  if (p < pD + dp) return pD;
  return pD + ((p - pD - dp) * (1 - pD)) / (1 - pD - dp);
}
// progreso global en que ocurre un progreso de escena (para los sonidos); null si nunca ocurre
export function pathInv(tl, pe, role) {
  const pD = ARC.pD, dp = arcPause(tl);
  if (role === 'bad') return pe <= pD ? pe : null;
  if (role !== 'good' || pe < pD) return pe;
  return pD + dp + ((pe - pD) * (1 - pD - dp)) / (1 - pD);
}
// papeles: en dos caminos con un final bueno y uno malo → 'good' / 'bad'; si no (tiempo, dos buenos…), sin arco
// Dos tipos de lado malo:
//  · «se rinde»: caída común y el malo se desanima. Solo si el guion tiene caer, levantarse, caer-bici,
//    levantarse-bici, o el final del lado malo es «se queda».
//  · «luchar solo» (resto, como el puente): cada lado hace lo suyo desde el principio; sin caída común.
const FALL_ACTS = new Set(['caer', 'levantarse', 'caer-bici', 'levantarse-bici']);
const nrm = (x) => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function arcModeOf(sides) {
  if (!sides || sides.length !== 2) return null;
  const bad = sides.find((s) => !s.good);
  if (!bad || sides.filter((s) => s.good).length !== 1) return null;
  const all = (s) => (s.segments || [s]).flatMap((g) => g.people);
  // con alguien «ausente» no hay arco común: el lado malo no puede copiar al bueno (el ausente saldría en la escena)
  if (sides.some((s) => all(s).some((p) => p.act === 'ausente'))) return 'solo';
  if (sides.some((s) => all(s).some((p) => FALL_ACTS.has(p.act)))) return 'rinde';
  if (/se queda/.test(nrm(bad.result))) return 'rinde';
  return 'solo';
}
export function rolesOf(job) {
  if (!job.sides || job.sides.length !== 2 || job.layout?.kind === 'time') return null;
  if (arcModeOf(job.sides) !== 'rinde') return null;
  return job.sides.map((s) => (s.good ? 'good' : 'bad'));
}
export function arcTime(tl) { return tOfP(tl, ARC.pD); }
// estado del arco en el tiempo t (fall, rise, tryK, quit entre 0 y 1)
export function arcState(tl, t, st, role) {
  if (role !== 'good' && role !== 'bad') return null;
  const tD = arcTime(tl), e = t - tD;
  const sm = (a, b) => smooth((e - a) / (b - a));
  if (st.phase === 'hook') return { role, fall: 0, rise: 0, tryK: 0, quit: 0 };
  const fall = sm(0, ARC.fall);
  if (role === 'good') return { role, fall, rise: sm(...ARC.rise), tryK: 0, quit: 0 };
  return { role, fall, rise: 0, tryK: sm(...ARC.tryT), quit: sm(...ARC.quit) };
}

// Zona segura de reels: arriba ~130 px y abajo desde ~1380 px los tapan los textos y botones
// de Instagram/Facebook/TikTok; a la derecha, la columna de botones. Todo lo importante va dentro.
// DIVISION: tiempo — tres franjas (HOY / EN UN MES / EN UN AÑO), mismo personaje y mismo camino.
// Cada franja muestra el avance hasta su momento; se van revelando una tras otra.
export function timeStages(C) {
  const snap = (x) => Math.max(1, Math.round(x * C)) / C;
  return [[0, snap(0.15)], [snap(0.15), snap(0.5)], [snap(0.5), 1]];
}
export function panelState(layout, i, st, C) {
  if (layout.kind !== 'time') return { p: clamp(st.p), r: clamp(st.r), show: 1, neutral: st.neutral || 0, cp: clamp(st.p) };
  const [a, b] = timeStages(C)[i];
  const w0 = i / 3;
  const p = a + (b - a) * clamp((st.p - w0) * 3);
  const show = st.phase === 'main' ? 0.28 + 0.72 * smooth((st.p - w0) * 12) : 1;
  // contador de cada franja: HOY = inicio, EN UN MES = 1/12 del total, EN UN AÑO = final
  const from = [0, 0, 1 / 12][i], to = [0, 1 / 12, 1][i];
  const cp = from + (to - from) * clamp((st.p - w0) * 3);
  return { p, r: i === 2 ? clamp(st.r) : 0, show, neutral: 0, cp };
}
// progreso global en que ocurre un evento de escena (para los sonidos)
export function timeEventP(C, pe) {
  const st = timeStages(C);
  for (let i = 0; i < 3; i++) {
    const [a, b] = st[i];
    if (pe >= a && (pe < b || (i === 2 && pe <= 1))) return (i + (pe - a) / (b - a)) / 3;
  }
  return null;
}

export function layoutFor(kind) {
  if (kind === 'time') {
    return {
      kind,
      panels: [0, 1, 2].map((i) => {
        const top = 175 + i * 395;
        return { cx: 520, groundY: top + 340, stageW: 940, F: 185, titleY: top + 72, tx: 50, tw: 900, clip: [0, top, 1080, 390], size: 34, sub: 24, align: 'left' };
      }),
      dividers: [[40, 567, 1040, 567], [40, 962, 1040, 962]],
      endY: 240,
    };
  }
  if (kind === 'full') {
    // UNA SOLA HISTORIA a pantalla completa (el inicio común, antes de dividirse)
    return {
      kind,
      panels: [{ cx: 540, groundY: 1120, stageW: 1000, F: 330, titleY: 300, tw: 900, clip: [0, 150, 1080, 1230], size: 40, sub: 26, align: 'center' }],
      dividers: [],
      endY: 300,
    };
  }
  if (kind === 'lr') {
    return {
      kind,
      panels: [
        // los dos paneles iguales y simétricos (mismo ancho, centros a 542 px): la misma escena sale igual en los dos (regla del arco)
        { cx: 269, groundY: 1000, stageW: 500, F: 255, titleY: 305, tw: 465, clip: [0, 150, 538, 1230], size: 36, sub: 26, align: 'center' },
        { cx: 811, groundY: 1000, stageW: 500, F: 255, titleY: 305, tw: 465, clip: [542, 150, 538, 1230], size: 36, sub: 26, align: 'center' },
      ],
      divider: [540, 250, 540, 1320],
      endY: 300,
    };
  }
  return {
    kind: 'ab',
    panels: [
      { cx: 520, groundY: 680, stageW: 940, F: 240, titleY: 290, tx: 50, tw: 900, clip: [0, 150, 1080, 602], size: 42, sub: 27, align: 'left' },
      { cx: 520, groundY: 1292, stageW: 940, F: 240, titleY: 850, tx: 50, tw: 900, clip: [0, 758, 1080, 602], size: 42, sub: 27, align: 'left' },
    ],
    divider: [40, 755, 1040, 755],
    endY: 290,
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
    const y = s.y;
    const tw = 0.5 + 0.5 * Math.sin(t * s.sp * 0.9 + s.ph);
    const a = s.a * tw * tw * (3 - 2 * tw);
    if (a < 0.01) continue;
    ctx.globalAlpha = a;
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
// SUCESOS (REGLA FIJA DE RITMO): un plan por panel, calculado una vez por video
export function momentsOf(job) {
  if (!job.moments) {
    const roles = rolesOf(job);
    const tD = arcTime(job.tl);
    const V = vozOf(job);
    job.moments = planMoments(job, { roles, tD, arcEnd: tD + ARC.quit[1] + 0.25, align: V ? (pl, T0, T1, typesIn) => alignMomentsToVoz(pl, V, T0, T1, typesIn) : null });
  }
  return job.moments;
}

// UNA SOLA HISTORIA Y LUEGO SE DIVIDE (INICIO / SEPARAR) y subtítulos de la VOZ: ver js/voz.js
export function renderFrame(ctx, job, t, scale = 1) {
  if (job.modo === 'juntos') return renderJuntos(ctx, job, t, scale);
  const I = !job.isIntro && job.intro;
  if (I && t < I.Ts) {
    // antes de dividirse: la historia común, a pantalla completa
    renderCore(ctx, I.job, t, scale);
  } else {
    renderCore(ctx, job, t, scale);
    if (I && t < I.Ts + SPLIT_TRANS) {
      // la división: la imagen común se funde con los dos caminos y una raya vertical crece desde el centro
      const k = smooth((t - I.Ts) / SPLIT_TRANS);
      if (!I.frozen || I.frozen.width !== Math.round(W * scale)) {
        I.frozen = typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(1, 1);
        I.frozen.width = Math.round(W * scale); I.frozen.height = Math.round(H * scale);
        renderCore(I.frozen.getContext('2d'), I.job, I.Ts - 0.001, scale);
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1 - k;
      ctx.drawImage(I.frozen, 0, 0);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const [x1, y1, x2, y2] = job.layout.divider || [540, 250, 540, 1320];
      const g = smooth((t - I.Ts) / (SPLIT_TRANS * 0.8)), my = (y1 + y2) / 2;
      ctx.globalAlpha = 0.85 * (1 - 0.6 * k);
      ctx.strokeStyle = WHITE; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x1, lerp(my, y1, g)); ctx.lineTo(x2, lerp(my, y2, g)); ctx.stroke();
      ctx.restore();
    }
  }
  if (!job.isIntro) drawVoz(ctx, job, t, scale);
}

function renderCore(ctx, job, t, scale = 1) {
  if (job.roles === undefined) job.roles = rolesOf(job);
  const plans = momentsOf(job);
  const { tl, layout } = job;
  const st = stateAt(tl, t);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  paintBackground(ctx, job); // color del fondo (FONDO del guion); estrellas, fugaces y efectos, igual que siempre
  drawStars(ctx, job.stars, t);
  if (t < 1.2) shootingStar(ctx, t);

  // línea divisoria: se dibuja desde el centro al inicio
  const dk = job.intro && !job.isIntro ? smooth((t - job.intro.Ts) / 0.5) : smooth(t / 0.5);
  const isTime = layout.kind === 'time';
  for (const [x1, y1, x2, y2] of layout.dividers || [layout.divider]) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.save();
    ctx.strokeStyle = WHITE;
    const pe = t - arcTime(tl);
    const pulse = !isTime && job.roles ? Math.max(0, Math.sin(clamp(pe / 0.9) * Math.PI)) : 0;
    ctx.globalAlpha = (0.22 + 0.45 * pulse) * (st.phase === 'end' ? 1 - smooth(st.endK * 4) : 1);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lerp(mx, x1, dk), lerp(my, y1, dk));
    ctx.lineTo(lerp(mx, x2, dk), lerp(my, y2, dk));
    ctx.stroke();
    ctx.restore();
  }

  // sin fotogramas negros: la escena está desde el primer fotograma y al final solo se atenúa un poco (el velo va detrás de la frase)
  const endDim = st.phase === 'end' ? 1 - 0.2 * smooth(st.endK * 2.5) : 1;
  const hookIn = 1;

  job.sides.forEach((side0, i) => {
    const pn = layout.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(...pn.clip);
    ctx.clip();
    ctx.translate(pn.cx, pn.groundY);
    // PLANO: general (cuerpo entero) o primer plano (cintura para arriba, cerca de la cámara)
    // ÁNGULO: lateral, de frente (yaw), desde arriba (top) o contrapicado (low); ver js/angulos.js
    let V = viewAt(job, i, t);
    // escenas sin vista desde arriba propia: «picado» suave (la escena un poco desde arriba, más baja y aplastada)
    const drawnSegs = ((job.roles && job.roles[i] === 'bad' ? job.sides[job.roles.indexOf('good')] : side0).segments) || [job.roles && job.roles[i] === 'bad' ? job.sides[job.roles.indexOf('good')] : side0];
    let pic = 0;
    // (v43: ya no hay «picado» de reserva: angulos.js solo pide la vista desde arriba en escenas con objetos)
    void drawnSegs;
    const cam0 = cameraAt(job, i, pn, t);
    // desde arriba o desde abajo no hay primer plano (se ve el sitio entero)
    const nz = Math.max(V.top, V.low);
    const cz = 1 + (cam0.z - 1) * (1 - nz);
    // contrapicado suave: los personajes más altos y el horizonte más bajo
    const nz2 = Math.max(nz, pic);
    const cz2 = 1 + (cam0.z - 1) * (1 - nz2);
    const cam = { zx: cz2 * (1 + 0.04 * V.low), zy: cz2 * (1 + 0.2 * V.low) * (1 - 0.24 * pic), ox: cam0.ox * (1 - nz2), oy: cam0.oy * (1 - nz2) + pn.F * 0.1 * V.low - pn.F * 0.12 * pic };
    const zoomed = cam.zx > 1.001 || cam.zy > 1.001;
    if (zoomed) { ctx.translate(cam.ox, cam.oy); ctx.scale(cam.zx, cam.zy); }
    const ps = panelState(layout, i, st, tl.C);
    // el lado malo dibuja la MISMA escena y las mismas acciones que el bueno (empiezan iguales);
    // sus propias acciones solo deciden cómo se queda al rendirse
    const role = job.roles ? job.roles[i] : null;
    const gSide = job.roles ? job.sides[job.roles.indexOf('good')] : null;
    const sp = role ? pathP(tl, ps.p, role) : ps.p;
    // VARIAS ESCENAS POR LADO: cada escena ocupa una parte igual del desarrollo; se pasa de una a otra
    // con un fundido rápido entre las dos (las dos dibujadas a la vez, nunca negro)
    const segOf = (sd) => (!isTime && sd.segments && sd.segments.length > 1 ? sd.segments : [{ scene: sd.scene, people: sd.people }]);
    const mySegs = segOf(side0);
    const segs = role === 'bad'
      ? segOf(gSide).map((g, k) => ({ scene: g.scene, people: g.people.map((p, j) => { const own = (mySegs[Math.min(k, mySegs.length - 1)].people); return { ...p, badAct: (own[j] || own[0] || p).act }; }) }))
      : mySegs;
    const nSeg = segs.length;
    // dónde empieza cada escena (iguales, o en los segundos de la VOZ): bounds = progreso de inicio de cada escena
    const bounds = segBoundsOf(role === 'bad' ? gSide : side0, nSeg);
    const { k: kSeg, local: local0 } = segAtP(bounds, clamp(sp));
    const local = nSeg === 1 ? sp : local0;
    const wl = Math.min(0.45, 0.3 / Math.max(0.5, (bounds[kSeg + 1] - bounds[kSeg]) * Math.max(1, tl.mainDur - CHOICE))); // ~0,3 s de fundido
    const draws = [{ seg: segs[kSeg], p: local, a: 1 }];
    if (kSeg < nSeg - 1 && local > 1 - wl && st.phase === 'main') {
      const f = (local - (1 - wl)) / wl;
      draws[0].a = Math.min(1, 2 * (1 - f));
      draws.push({ seg: segs[kSeg + 1], p: 0, a: Math.min(1, 2 * f) });
    }
    let S = null, mainS = null;
    for (const dr of draws) {
    const side = { ...side0, scene: dr.seg.scene, people: dr.seg.people };
    S = {
      // «ausente»: no está en la escena principal (solo salen los presentes); se dibuja aparte, pequeño, en otro lugar
      w: pn.stageW, F: pn.F, people: side.people.filter((p) => p.act !== 'ausente'), allPeople: side.people, absent: side.people.filter((p) => p.act === 'ausente'), good: role === 'bad' ? ps.r > 0 ? false : true : side.good, bad: side.bad,
      p: dr.p, r: ps.r, t, C: tl.C,
      // cuándo empezó esta escena (los desplazamientos de escenas anteriores no pasan a la nueva)
      segT0: dr.seg === segs[0] ? -Infinity : tOfP(tl, role ? pathInv(tl, bounds[segs.indexOf(dr.seg)], role) ?? 1 : bounds[segs.indexOf(dr.seg)]), seed: isTime || job.roles ? job.seed : job.seed + i * 13, arc: arcState(tl, t, st, role), role, sceneName: side.scene,
      dimmed: !side0.good && ps.r > 0.4, focus: null,
      // si alguien usa ese objeto (tocar-guitarra…), va en su mano y no se dibuja aparte
      object: side.object && !side.people.some((p) => USES[p.act]?.obj === side.object) ? side.object : null,
      // la misma caja en todos los paneles: así un suceso igual se dibuja igual en los dos lados (regla del arco)
      box: { l: -Math.min(...layout.panels.map((q) => q.stageW)) / 2, r: Math.min(...layout.panels.map((q) => q.stageW)) / 2, top: Math.max(...layout.panels.map((q) => q.clip[1] - q.groundY)), bot: Math.min(...layout.panels.map((q) => q.clip[1] + q.clip[3] - q.groundY)) },
      moments: st.phase === 'hook' ? null : momentsNow(plans[i], t),
    };
    // en primer plano, la lluvia, la noche y los demás sucesos llenan lo que se ve
    if (zoomed) S.box = { l: (S.box.l - cam.ox) / cam.zx, r: (S.box.r - cam.ox) / cam.zx, top: (S.box.top - cam.oy) / cam.zy, bot: (S.box.bot - cam.oy) / cam.zy };
    S.view = { yaw: V.yaw, top: 0.4 * pic };
    let a = endDim * hookIn * ps.show * dr.a;
    if (isTime && st.phase === 'end' && i < 2) a *= 1 - 0.2 * smooth(st.endK * 2.5);
    if (!side0.good && st.phase !== 'main') a *= 1 - 0.15 * ps.r;
    // EN UN AÑO: la franja se ilumina con luz cálida al final feliz
    if (isTime && i === 2 && side.good && ps.r > 0.3) {
      const k = smooth((ps.r - 0.3) / 0.5);
      glow(ctx, 0, -pn.F * 0.6, 620 * k, AMBER, 0.32 * Math.max(0.8, endDim));
    }
    ctx.globalAlpha = a;
    const sceneAlpha = a;
    const scene = SCENES[side.scene] || SCENES.arbol;
    // las escenas fijan su propio globalAlpha; lo multiplicamos con un contenedor
    setNeutral(ps.neutral);
    setCurrent(S);
    // desde arriba: se cruza la vista lateral con la aérea (fundido entre las dos, nunca negro)
    if (V.top < 0.999) withAlpha(ctx, sceneAlpha * (1 - V.top), () => {
      if (S.absent.length && side.scene !== 'mesa') {
        // «ausente» en cualquier escena: la escena se dibuja un poco más pequeña y corrida hacia quien se queda;
        // al otro lado queda sitio para la pared con la puerta y la calle donde está el ausente
        const ai = side.people.findIndex((p) => p.act === 'ausente');
        const st = ai % 2 === 0 ? -1 : 1, narrow = pn.stageW < 2.5 * pn.F;
        const s = narrow ? 0.7 : 0.75, d = -st * pn.stageW * (narrow ? 0.15 : 0.125);
        ctx.save(); ctx.translate(d, 0); ctx.scale(s, s);
        S._drawn = new Set(); scene.draw(ctx, S); drawExtras(ctx, S);
        ctx.restore();
        S.sceneTx = { d, s };
        S.outside = { side: st, wallX: st * (pn.stageW / 2 * s - Math.abs(d) + 0.06 * pn.F) };
        const g = (p) => (p ? [p[0] * s + d, p[1] * s] : p);
        S.focus = g(S.focus); S.objSpot = g(S.objSpot);
      } else { S._drawn = new Set(); scene.draw(ctx, S); drawExtras(ctx, S); }
      if (S.absent.length) { S.recInv = S.sceneTx || null; drawAbsent(ctx, S, S.absent); S.recInv = null; }
    });
    if (V.top > 0.001) {
      // vista aérea: la escena se «dibuja» aparte (sin verse) para saber dónde está y qué hace cada uno;
      // luego se dibujan el suelo, los muebles y los personajes desde arriba
      const lat = { focus: S.focus, objSpot: S.objSpot, sceneTx: S.sceneTx };
      S.collect = [];
      const cc = collectCtx();
      S._drawn = new Set(); scene.draw(cc, S); drawExtras(cc, S);
      if (V.top < 0.999) Object.assign(S, lat); // (el corazón final y el objeto siguen donde estaban)
      const figs = S.collect; S.collect = null;
      withAlpha(ctx, sceneAlpha * V.top, () => drawAerial(ctx, S, figs));
    }
    if (job.countFigs) job.countFigs[i] = Math.max(job.countFigs[i] || 0, S._figs || 0);
    if (job.planeLog && S._plane) job.planeLog[i] = S._plane; // (pruebas: dónde está el avión)
    setNeutral(0);
    setCurrent(null);
    S.sceneAlpha = sceneAlpha;
    // lo que va encima (sucesos, objeto, corazón) sigue a la escena que más se ve
    if (!mainS || dr.a > mainS._a) { mainS = S; mainS._a = dr.a; }
    }
    S = mainS;
    // para la cámara: dónde está la escena si va corrida («ausente») y quién es quién
    if (plans[i]) { plans[i].camTx = S.sceneTx || null; plans[i].camPeople = Object.fromEntries(S.allPeople.map((p, j) => [p.pid ?? j, p])); }
    const sceneAlpha = S.sceneAlpha;
    const side = { ...side0, scene: S.sceneName };
    // sucesos del escenario: lluvia, sol, alguien llega, algo cae, se enciende…
    if (S.moments) withAlpha(ctx, sceneAlpha, () => drawWorldMoments(ctx, S, S.moments));
    // objeto concreto del guion en su sitio fijo (si la escena no lo usó en una ranura propia)
    if (S.object && !S.objHand && S.objSpot) drawObject(ctx, S.object, S.objSpot[0], S.objSpot[1], pn.F * 0.3, { ...objState(S), fade: objState(S).fade * (ps.neutral > 0.5 ? 0 : 1) });
    // final feliz: corazón grande y brillante sobre el objeto principal de la escena
    if (side0.good && S.focus && ps.r > 0.45) {
      const k = smooth((ps.r - 0.45) / 0.4);
      const [fx, fy] = S.focus;
      const beat = 1 + 0.07 * Math.max(0, Math.sin(t * 5.2)) * Math.max(0, Math.sin(t * 5.2 + 0.6));
      ctx.globalAlpha = 1;
      glow(ctx, fx, fy, pn.F * 1.05 * k, RED, 0.95);
      glow(ctx, fx, fy, pn.F * 0.45 * k, '#FF8A5C', 0.6);
      heart(ctx, fx, fy, pn.F * 0.3 * k * beat, RED, Math.max(0.85, endDim) * k);
    }
    ctx.restore();
    // en primer plano, un velo suave del color del fondo bajo los títulos para que se lean limpios
    if (zoomed) {
      const vk = smooth((Math.max(cam.zx, cam.zy) - 1) / 0.6), [cx0, cy0, cw] = pn.clip;
      const yb = pn.groundY + camBox(layout).top + 30;
      const g = ctx.createLinearGradient(0, cy0, 0, yb);
      g.addColorStop(0, veil(job, 0.8 * vk)); g.addColorStop(0.7, veil(job, 0.6 * vk)); g.addColorStop(1, veil(job, 0));
      ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(cx0, cy0, cw, yb - cy0); ctx.restore();
    }
  });

  // textos de cada lado
  let titleA = st.phase === 'hook' || st.phase === 'rewind' ? smooth((t - 1.35) / 0.45) : st.phase === 'end' ? 1 - smooth(st.endK * 4) : 1;
  if (job.intro && !job.isIntro) titleA *= smooth((t - job.intro.Ts - 0.25) / 0.5); // los títulos de cada camino, al dividirse
  job.sides.forEach((side, i) => {
    const pn = layout.panels[i];
    const tx = job.texts.sides[i];
    if (titleA <= 0.001 || !tx) return;
    const ps = panelState(layout, i, st, tl.C);
    ctx.save();
    ctx.fillStyle = WHITE;
    ctx.textBaseline = 'alphabetic';
    ctx.globalAlpha = titleA * (isTime ? 0.45 + 0.55 * ps.show : 1);
    const left = pn.align === 'left';
    const ax = left ? pn.tx : pn.cx;
    ctx.font = `400 ${pn.size}px ${FONT}`;
    const lines = wrap(ctx, tx.title.toUpperCase(), pn.tw, pn.size * 0.18);
    let y = pn.titleY;
    for (const ln of lines.slice(0, 3)) { spaced(ctx, ln, ax, y, pn.size * 0.18, left); y += pn.size * 1.2; }
    if (tx.sub) {
      // «el contador salta»: el subtítulo late y se calienta un instante
      const jump = st.phase === 'hook' ? 0 : counterPulse(momentsNow(plans[i], t));
      ctx.font = `400 ${Math.round(pn.sub * (1 + 0.28 * jump))}px ${FONT}`;
      ctx.globalAlpha = titleA * (0.6 + 0.4 * jump);
      if (jump > 0.05) ctx.fillStyle = jump > 0.4 ? AMBER : WHITE;
      const sub = counterText(tx.sub, ps.cp).toUpperCase();
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
    let y = layout.kind === 'lr' ? 300 : layout.kind === 'time' ? 250 : 290;
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
    // frase final grande y centrada; las palabras entre *asteriscos* salen en rojo
    const plain = job.texts.phrase.replace(/\*/g, '');
    const fs = plain.length > 70 ? 46 : plain.length > 40 ? 54 : 64;
    // velo negro suave detrás del cierre para que la frase se lea limpia sobre la escena
    {
      const v = smooth((e - 0.1) / 0.6);
      const g = ctx.createLinearGradient(0, topY - 160, 0, topY + 430);
      g.addColorStop(0, veil(job, 0.85 * v));
      g.addColorStop(0.45, veil(job, 0.78 * v));
      g.addColorStop(1, veil(job, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(0, topY - 160, W, 590);
      ctx.fillStyle = WHITE;
      ctx.globalAlpha = pa;
    }
    let y = topY + fs * 0.25;
    y = richText(ctx, job.texts.phrase, W / 2, y, 940, fs, pa);
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
    // regla de ritmo en el cierre largo: una estrella fugaz como la del principio (el final se parece al inicio)
    const se = e - (tl.end - 2.4);
    if (tl.end > 4 && se > 0 && se < 1.2) shootingStar(ctx, se);
  }
}

// ---------------------------------------------------------------------------
// MODO: juntos — como una Y: UNA sola escena a pantalla completa, sin división. Al principio A y B están juntos en
// el centro; el camino se abre como una Y: A va a la izquierda, a SU objeto (su árbol, su barca, su computadora…),
// y B a la derecha, al suyo. Los dos hacen lo mismo a la vez y todo es igual hasta los últimos 3 segundos.
// Final: A se rinde y se desanima (se sienta, cabeza baja) y su objeto se apaga; B lo logra (su objeto florece,
// en el lago cruza a la otra orilla) y levanta los brazos de victoria. Sin títulos, frases, gancho ni subtítulos:
// solo los personajes, los objetos y, si el guion lo trae, un contador arriba en el centro.
// (Cada lado es la misma escena dibujada en su mitad; la de A en espejo, para que los dos queden hacia el centro.)
const JUNTOS_X = 0.6; // fundido (s) del objeto de A hacia su final
const JUNTOS_S = 0.7; // tamaño de cada mitad
// línea de tiempo: igual que siempre, pero el final (el resultado) son los últimos 3 s y no hay cierre con texto
// (en el lago, los últimos 4 s: el rápido empuja la barca, rema, cruza y celebra)
export function juntosTimeline(tl, sides = []) {
  const resStart = tl.D - (sides.some((sd) => sd && sd.scene === 'lago') ? 4 : 3);
  const mainDur = resStart - tl.mainStart;
  return { ...tl, resStart, res: tl.D - resStart, endStart: tl.D + 1, end: 1, mainDur, C: Math.max(4, Math.min(22, Math.round(mainDur / 1.6))) };
}
function renderJuntos(ctx, job, t, scale) {
  const { tl, layout } = job;
  const st = stateAt(tl, t);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  paintBackground(ctx, job);
  drawStars(ctx, job.stars, t);
  if (t < 1.2) shootingStar(ctx, t);
  const pn = layout.panels[0];
  const ps = panelState(layout, 0, st, tl.C);
  const r = st.phase === 'result' || st.phase === 'end' ? ps.r : 0;
  const rk = r > 0 ? smooth((t - tl.resStart) / JUNTOS_X) : 0;
  // la Y: salen juntos del centro y cada uno va a su sitio (de 1,4 s a 2,8 s)
  const arrive = smooth((t - 1.4) / 1.4);
  const s = JUNTOS_S, hw = W / 2;
  const half = (idx) => {
    const sd = job.sides[idx] || job.sides[0];
    const A = idx === 0, m = A ? -1 : 1, hx = A ? W / 4 : (3 * W) / 4;
    const sceneName = sd.scene;
    const scene = SCENES[sceneName] || SCENES.arbol;
    const people = sd.people;
    // dónde está el centro de la pantalla en las coordenadas de esta mitad (de ahí salen al principio)
    const lx = (W / 2 + (A ? -1 : 1) * pn.F * 0.13 * s - hx) / (m * s);
    // dos estados del objeto de A al final (el común y el suyo); B, siempre el bueno
    // lago: A es el perfeccionista y B el rápido desde el principio (cada uno lo suyo; la escena se encarga del final)
    const lago = sceneName === 'lago';
    const states = lago ? [{ good: !A, a: 1 }] : A && r > 0 ? [{ good: true, a: 1 - rk }, { good: false, a: rk }] : [{ good: true, a: 1 }];
    for (const stt of states) {
      if (stt.a <= 0.001) continue;
      const S = {
        w: hw / s, F: pn.F, people: people.filter((p) => p.act !== 'ausente'), allPeople: people, absent: [], good: stt.good, bad: stt.good ? null : sd.bad || 'decay',
        p: ps.p, r: lago ? r : stt.good ? (A ? 0 : r) : r, t, lagoStyle: lago ? (A ? 'perfeccionista' : 'rapido') : null, C: tl.C, segT0: -Infinity, seed: job.seed, arc: null, role: null, sceneName,
        dimmed: false, focus: null, object: null, moments: null, view: { yaw: 0 },
        arrive: arrive < 1 ? { k: arrive, x: lx } : null,
        giveUp: A ? (lago ? smooth((r - 0.72) / 0.22) : smooth(r / 0.5)) : 0, victory: !A && !lago ? smooth(r / 0.4) : 0,
        box: { l: -hw / s / 2, r: hw / s / 2, top: (pn.clip[1] - pn.groundY) / s, bot: (pn.clip[1] + pn.clip[3] - pn.groundY) / s },
      };
      ctx.save();
      ctx.translate(hx, pn.groundY);
      ctx.scale(m * s, s);
      setNeutral(ps.neutral);
      setCurrent(S);
      withAlpha(ctx, stt.a, () => { S._drawn = new Set(); scene.draw(ctx, S); drawExtras(ctx, S); });
      setNeutral(0);
      setCurrent(null);
      ctx.restore();
      if (!A && S.focus && r > 0.45) {
        // B lo logra: corazón grande sobre su objeto
        const k = smooth((r - 0.45) / 0.4);
        const fx = hx + m * s * S.focus[0], fy = pn.groundY + s * S.focus[1];
        const beat = 1 + 0.07 * Math.max(0, Math.sin(t * 5.2)) * Math.max(0, Math.sin(t * 5.2 + 0.6));
        glow(ctx, fx, fy, pn.F * s * 1.05 * k, RED, 0.95);
        heart(ctx, fx, fy, pn.F * s * 0.3 * k * beat, RED, k);
      }
    }
  };
  half(0);
  half(1);
  // el camino en forma de Y sobre el suelo: viene del centro de abajo y se abre hacia cada uno
  ctx.save();
  ctx.strokeStyle = WHITE; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.28; ctx.lineWidth = 3;
  const gy = pn.groundY, jy = gy + 95;
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(W / 2 + d * 26, 1360); ctx.lineTo(W / 2 + d * 26, jy + 20);
    ctx.quadraticCurveTo(W / 2 + d * 30, jy - 10, W / 2 + d * W * 0.24, gy + 14); ctx.stroke();
  }
  ctx.globalAlpha = 0.16;
  ctx.beginPath(); ctx.moveTo(W / 2 - 1, jy + 30); ctx.quadraticCurveTo(W / 2, jy + 5, W / 2 - W * 0.2, gy + 24); ctx.moveTo(W / 2 + 1, jy + 30); ctx.quadraticCurveTo(W / 2, jy + 5, W / 2 + W * 0.2, gy + 24); ctx.stroke();
  ctx.restore();
  // un solo contador arriba en el centro (si el guion lo trae); ningún otro texto
  const sub = (job.texts.sides[1] || job.texts.sides[0] || {}).sub;
  if (sub) {
    const a = smooth((t - 1.2) / 0.5);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = WHITE;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `400 46px ${FONT}`;
    spaced(ctx, counterText(sub, ps.cp).toUpperCase(), W / 2, 300, 9);
    ctx.restore();
  }
}

// Texto con palabras clave en rojo: «El tiempo no *vuelve*». Centrado, con salto de línea por palabras.
export function parseRich(text) {
  const words = [];
  let red = false;
  for (const part of String(text).split(/(\*)/)) {
    if (part === '*') { red = !red; continue; }
    for (const w of part.split(/\s+/)) if (w) words.push({ w, red });
  }
  return words;
}
function richText(ctx, text, cx, y, maxW, fs, alpha) {
  ctx.save();
  ctx.font = `400 ${fs}px ${FONT}`;
  ctx.textAlign = 'left';
  const space = ctx.measureText(' ').width;
  const words = parseRich(text).map((o) => ({ ...o, wd: ctx.measureText(o.w).width }));
  const lines = [];
  let cur = [], cw = 0;
  for (const o of words) {
    const add = (cur.length ? space : 0) + o.wd;
    if (cur.length && cw + add > maxW) { lines.push({ cur, cw }); cur = [o]; cw = o.wd; } else { cur.push(o); cw += add; }
  }
  if (cur.length) lines.push({ cur, cw });
  for (const { cur: ln, cw: lw } of lines.slice(0, 4)) {
    let x = cx - lw / 2;
    for (const o of ln) {
      if (o.red) {
        glow(ctx, x + o.wd / 2, y - fs * 0.33, fs * 1.1, RED, 0.45 * alpha);
        ctx.fillStyle = RED;
      } else ctx.fillStyle = WHITE;
      ctx.globalAlpha = alpha;
      ctx.fillText(o.w, x, y);
      x += o.wd + space;
    }
    y += fs * 1.22;
  }
  ctx.restore();
  return y;
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

// PORTADA (fotograma 0 del MP4 y «Descargar portada»): ver js/portada.js
export { renderCover, coverTime, loadCoverFonts } from './portada.js';
