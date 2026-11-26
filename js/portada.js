// Dos Caminos — PORTADA / MINIATURA (fotograma 0 del MP4 y «Descargar portada»).
// Una miniatura que engancha:
//  · la escena en su MOMENTO MÁS EMOTIVO (llora, abrazo, el avión despegando, tristeza, el corazón…),
//    con el mismo plano (general o primer plano) que tiene el video en ese instante;
//  · un texto de 3 a 5 palabras MUY GRANDE, blanco con borde oscuro, con una palabra clave en rojo;
//  · un corazón grande, roto o entero según la historia;
//  · una fuente fuerte y moderna que va rotando entre videos (5 fuentes, licencia OFL, en /fonts);
//  · el mismo color de FONDO que el video.
import { renderFrame, W, H, tOfP, arcTime, ARC, rolesOf, momentsOf, veil, parseRich, segBoundsOf } from './render.js';
import { glow, heart, RED, smooth } from './scenes.js';
import { WHITE } from './figure.js';

// fuentes de la portada (rotan entre videos)
export const COVER_FONTS = [
  { family: 'DC Anton', file: 'fonts/anton.woff2', weight: '400', k: 1.0 },
  { family: 'DC Archivo Black', file: 'fonts/archivo-black.woff2', weight: '400', k: 0.82 },
  { family: 'DC Bebas Neue', file: 'fonts/bebas-neue.woff2', weight: '400', k: 1.12 },
  { family: 'DC Montserrat Black', file: 'fonts/montserrat-black.woff2', weight: '900', k: 0.8 },
  { family: 'DC Oswald', file: 'fonts/oswald-bold.woff2', weight: '700', k: 1.0 },
];
const FALLBACK = '"Helvetica Neue", "Arial Black", Impact, system-ui, sans-serif';
let fontsLoading = null;
// carga las fuentes una vez (antes de crear la portada); si alguna falla, se usa una letra gruesa del sistema
export function loadCoverFonts() {
  if (fontsLoading) return fontsLoading;
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') return (fontsLoading = Promise.resolve());
  const base = new URL('../', import.meta.url);
  fontsLoading = Promise.all(COVER_FONTS.map(async (f) => {
    try {
      const ff = new FontFace(f.family, `url(${new URL(f.file, base).href})`, { weight: f.weight });
      await ff.load();
      document.fonts.add(ff);
      f.ok = true;
    } catch (e) { f.ok = false; }
  }));
  return fontsLoading;
}
export function coverFontOf(job) {
  const n = COVER_FONTS.length;
  const i = job.fontIdx != null ? job.fontIdx : (job.seed || 0);
  return COVER_FONTS[((i % n) + n) % n];
}

// ---------------------------------------------------------------------------
// El momento más emotivo del video (el que va en la portada)
const SCORE = { llora: 10, 'abrazo-largo': 9, abraza: 9, tristeza: 8, 'recibir-corazon': 7, 'dar-corazon': 6, 'estoy-contigo': 6, ansiedad: 5, pedir: 5, ilusion: 4, distraido: 3, corazon: 3, cansa: 3 };
export function coverMoment(job) {
  const tl = job.tl;
  if (job.layout.kind === 'time') return { t: tl.resStart + tl.res * 0.7, type: 'final', side: 2 };
  const plans = momentsOf(job);
  let best = null;
  plans.forEach((pl, i) => {
    for (const e of pl || []) {
      const sc = SCORE[e.type];
      if (!sc || e.iconOnly || e.t0 < tl.mainStart + 2.2) continue;
      // un poco más de puntos si pasa tarde (cuando la diferencia ya se ve) y en el lado malo para el llanto
      const s = sc + (e.t0 - tl.mainStart) / tl.mainDur + (e.type === 'llora' && !job.sides[i].good ? 0.5 : 0);
      if (!best || s > best.s) best = { s, t: e.t0 + Math.min(1.6, (e.t1 - e.t0) * 0.6), type: e.type, side: i, who: typeof e.who === 'number' ? e.who : null };
    }
  });
  // el avión despegando: a media subida, ya en el cielo
  job.sides.forEach((sd, i) => {
    const segs = sd.segments && sd.segments.length > 1 ? sd.segments : [{ scene: sd.scene, people: sd.people }];
    segs.forEach((g, k) => {
      if (g.scene !== 'aeropuerto' || !g.people.some((p) => p.act === 'subir-avion')) return;
      const s = 10.2; // el avión despegando gana a casi todo (solo el llanto del lado malo, al final, puede más)
      const bd = segBoundsOf(sd, segs.length);
      if (!best || s > best.s) best = { s, t: tOfP(tl, bd[k] + 0.78 * (bd[k + 1] - bd[k])), type: 'avion', side: i };
    });
  });
  // el abrazo del final feliz
  const res = (sd) => String(sd.result || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  job.sides.forEach((sd, i) => {
    if (sd.good && /abraz/.test(res(sd)) && (!best || 8.8 > best.s)) best = { s: 8.8, t: tl.resStart + tl.res * 0.3, type: 'abraza', side: i };
  });
  if (best) return best;
  // sin sucesos emotivos: a mitad de la historia (ya se ve la diferencia); en «se rinde», después de rendirse
  const roles = rolesOf(job);
  if (roles) return { t: Math.min(tl.resStart - 0.2, arcTime(tl) + ARC.quit[1] + 1.2), type: 'rinde', side: roles.indexOf('bad') };
  return { t: tOfP(tl, 0.62), type: 'mitad', side: -1 };
}
export function coverTime(job) { return coverMoment(job).t; }

// ---------------------------------------------------------------------------
// Texto: PORTADA del guion (PORTADA_EN en inglés) o, si no hay, 3–5 palabras del GANCHO o del TITULO
const KEYWORDS = ['nunca', 'solo', 'sola', 'espera', 'esperó', 'esperando', 'mamá', 'papá', 'hijo', 'hija', 'tiempo', 'tarde', 'adiós', 'perdón', 'presente', 'siempre', 'nadie', 'vuelve', 'volvió', 'llamó', 'último', 'última', 'amor', 'nada', 'olvidó', 'abrazo', 'momento', 'casa',
  'never', 'alone', 'wait', 'waited', 'mom', 'dad', 'son', 'daughter', 'time', 'late', 'goodbye', 'sorry', 'always', 'nobody', 'last', 'love', 'home', 'forgot', 'hug'];
const strip = (s) => String(s || '').replace(/[¿?¡!.,;:«»"“”…]/g, '').trim();
export function coverText(job) {
  const spec = job.coverSpec;
  let raw = spec && spec.text ? spec.text : '';
  if (!raw) {
    const words = (s) => strip(s).split(/\s+/).filter(Boolean);
    const hook = words(job.texts.hook), title = words(String(job.title || '').replace(/\*/g, ''));
    raw = (hook.length >= 3 && hook.length <= 5 ? hook : title.length >= 3 ? title.slice(0, 5) : hook.length ? hook.slice(0, 5) : title.concat(words(job.texts.phrase.replace(/\*/g, ''))).slice(0, 5)).join(' ');
  }
  let words = parseRich(raw.toUpperCase()).map((o) => ({ ...o, w: o.red ? o.w : o.w }));
  words = words.filter((o) => strip(o.w));
  if (!words.some((o) => o.red) && words.length) {
    // palabra clave en rojo: una palabra con carga emocional; si no, la más larga
    const low = (o) => strip(o.w).toLowerCase();
    let k = words.findIndex((o) => KEYWORDS.includes(low(o)));
    if (k < 0) { k = 0; words.forEach((o, j) => { if (strip(o.w).length > strip(words[k].w).length) k = j; }); }
    words[k] = { ...words[k], red: true };
  }
  return words;
}
// corazón: roto o entero (PORTADA: … | roto); si no, según el momento de la portada
export function coverHeart(job, mom) {
  if (job.coverSpec && job.coverSpec.heart) return job.coverSpec.heart;
  if (mom && mom.side >= 0 && job.sides[mom.side] && job.layout.kind !== 'time') {
    if (['abraza', 'abrazo-largo', 'recibir-corazon', 'dar-corazon', 'estoy-contigo', 'avion'].includes(mom.type) && job.sides[mom.side].good) return 'entero';
    return 'roto';
  }
  return /triste|tension/.test(job.emotion || '') ? 'roto' : 'entero';
}

function brokenHeart(ctx, x, y, s) {
  // dos mitades separadas por una grieta en zigzag
  const crack = [[0, -s * 0.33], [-s * 0.07, -s * 0.17], [s * 0.07, -s * 0.03], [-s * 0.06, s * 0.12], [0, s * 0.36]];
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(x + side * s * 0.06, y + s * 0.02);
    ctx.rotate(side * 0.12);
    ctx.beginPath();
    ctx.moveTo(crack[0][0], crack[0][1]);
    for (const [cx, cy] of crack) ctx.lineTo(cx, cy);
    ctx.lineTo(0, s * 0.4); ctx.lineTo(side * s, s * 0.4); ctx.lineTo(side * s, -s * 0.7); ctx.lineTo(0, -s * 0.7);
    ctx.closePath();
    ctx.clip();
    heart(ctx, 0, 0, s, RED, 1);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
function drawCover(ctx, job) {
  const mom = coverMoment(job);
  // la escena sin los títulos de cada lado ni el gancho; los fotogramas anteriores se dibujan antes (fuera de la
  // imagen) para que los personajes y la cámara estén donde están en el video en ese instante
  const cj = { ...job, moments: undefined, roles: undefined, shots: undefined, camState: undefined, coverJob: undefined, _cover: undefined, voz: null, vozEn: null, texts: { ...job.texts, hook: '', sides: [] } };
  // el lado del momento emotivo, en primer plano (salvo el avión, que se ve de lejos)
  const solo = ['llora', 'tristeza', 'ansiedad', 'cansa', 'distraido'].includes(mom.type);
  if (mom.side >= 0 && mom.type !== 'avion' && job.layout.kind !== 'time') cj.coverShot = { i: mom.side, who: solo && mom.who != null ? [mom.who] : 'all', main: mom.who ?? null };
  const t = mom.t;
  for (let q = Math.max(0, t - 1.2); q < t - 1e-6; q += 1 / 30) renderFrame(ctx, cj, q, 0.05);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  renderFrame(ctx, cj, t, 1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;

  const kind = job.layout.kind;
  // el texto va sobre el otro lado (el momento emotivo se ve limpio)
  // (lados: arriba, sobre el cielo; las caras quedan debajo)
  const yC = kind === 'lr' ? 480 : kind === 'full' ? 470 : kind === 'time' ? 765 : mom.side === 1 ? 470 : mom.side === 0 ? 1075 : 760;
  const maxBlock = (kind === 'ab' && mom.side >= 0) || kind === 'lr' || kind === 'full' ? 330 : 430;
  const font = coverFontOf(job);
  const fam = font.ok === false ? FALLBACK : `"${font.family}", ${FALLBACK}`;
  const words = coverText(job);
  const fontAt = (fs) => `${font.weight} ${fs}px ${fam}`;
  // tamaño: lo más grande posible en 2 líneas (3 si hace falta), 940 px de ancho
  const lay = (fs) => {
    ctx.font = fontAt(fs);
    const sp = ctx.measureText(' ').width;
    const lines = [];
    let cur = [], cw = 0;
    for (const o of words) {
      const wd = ctx.measureText(o.w).width;
      const add = (cur.length ? sp : 0) + wd;
      if (cur.length && cw + add > 940) { lines.push({ cur, cw }); cur = [{ ...o, wd }]; cw = wd; } else { cur.push({ ...o, wd }); cw += add; }
    }
    if (cur.length) lines.push({ cur, cw });
    return { lines, sp, fs, maxW: Math.max(...lines.map((l) => l.cw)) };
  };
  const lhK = font.family.includes('Bebas') || font.family.includes('Anton') || font.family.includes('Oswald') ? 0.98 : 1.06;
  let L = null;
  for (let fs = Math.round(230 * font.k); fs >= 70; fs -= 6) {
    L = lay(fs);
    if (L.maxW <= 940 && L.lines.length <= (words.length > 3 ? 3 : 2) && L.lines.length * fs * lhK <= maxBlock) break;
  }
  const lh = L.fs * lhK;
  const blockH = L.lines.length * lh;
  const top = yC - blockH / 2;
  // velo del color del fondo detrás del texto para que se lea limpio (sin tapar del todo la escena)
  const g = ctx.createLinearGradient(0, top - 230, 0, top + blockH + 130);
  g.addColorStop(0, veil(job, 0)); g.addColorStop(0.3, veil(job, 0.6)); g.addColorStop(0.75, veil(job, 0.6)); g.addColorStop(1, veil(job, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, top - 230, W, blockH + 360);
  // corazón grande encima del texto: entero (late, brilla) o roto
  const hs = (kind === 'ab' && mom.side >= 0) || kind === 'lr' ? 100 : 120, hy = top - hs * 0.85;
  const hk = coverHeart(job, mom);
  glow(ctx, W / 2, hy, 260, RED, hk === 'roto' ? 0.7 : 1);
  if (hk === 'roto') brokenHeart(ctx, W / 2, hy, hs); else heart(ctx, W / 2, hy, hs, RED, 1);
  // texto: blanco con borde oscuro y sombra; la palabra clave en rojo
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.font = fontAt(L.fs);
  L.lines.forEach((ln, i) => {
    let x = W / 2 - ln.cw / 2;
    const y = top + lh * (i + 0.84);
    for (const o of ln.cur) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = L.fs * 0.12; ctx.shadowOffsetY = L.fs * 0.04;
      ctx.strokeStyle = '#0A0A0C'; ctx.lineWidth = Math.max(8, L.fs * 0.11);
      ctx.strokeText(o.w, x, y);
      ctx.restore();
      if (o.red) glow(ctx, x + o.wd / 2, y - L.fs * 0.35, L.fs * 1.1, RED, 0.5);
      ctx.fillStyle = o.red ? RED : WHITE;
      ctx.fillText(o.w, x, y);
      x += o.wd + L.sp;
    }
  });
  // nombre del canal, pequeño
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = WHITE;
  ctx.font = `600 26px ${FALLBACK}`;
  ctx.textAlign = 'center';
  ctx.fillText(job.lang === 'en' ? 'TWO PATHS STORIES' : 'DOS CAMINOS', W / 2, top + blockH + 62);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// Se dibuja una vez por video y se guarda (en el iPhone la portada se repinta muchas veces al empezar a grabar)
export function renderCover(ctx, job, scale = 1) {
  if (!job._cover || job._cover.scale !== scale) {
    const c = document.createElement('canvas');
    c.width = Math.round(W * scale); c.height = Math.round(H * scale);
    const x = c.getContext('2d');
    x.scale(scale, scale);
    // renderFrame fija su propia escala: se dibuja a 1 y se escala al copiar
    const big = scale === 1 ? c : document.createElement('canvas');
    if (big !== c) { big.width = W; big.height = H; }
    drawCover(big.getContext('2d'), job);
    if (big !== c) { x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(big, 0, 0, c.width, c.height); big.width = big.height = 1; }
    job._cover = { scale, c };
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(job._cover.c, 0, 0);
  ctx.restore();
}
