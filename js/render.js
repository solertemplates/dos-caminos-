// Dos Caminos — composición del video: fondo de estrellas, división, textos, escenas y línea de tiempo.
import { SCENES, clamp, smooth, lerp, glow, heart, RED, AMBER, setNeutral, setCurrent, objState } from './scenes.js';
import { drawObject } from './objects.js';
import { USES } from './uses.js';
import { WHITE } from './figure.js';
import './scenes2.js';
import { planMoments, momentsNow, drawWorldMoments, counterPulse } from './moments.js';
import { drawAbsent } from './ausente.js';

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
  if (sides.some((s) => s.people.some((p) => FALL_ACTS.has(p.act)))) return 'rinde';
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
  if (kind === 'lr') {
    return {
      kind,
      panels: [
        { cx: 270, groundY: 1000, stageW: 510, F: 255, titleY: 305, tw: 470, clip: [0, 150, 538, 1230], size: 36, sub: 26, align: 'center' },
        { cx: 800, groundY: 1000, stageW: 500, F: 255, titleY: 305, tw: 460, clip: [542, 150, 538, 1230], size: 36, sub: 26, align: 'center' },
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
    job.moments = planMoments(job, { roles, tD, arcEnd: tD + ARC.quit[1] + 0.25 });
  }
  return job.moments;
}

export function renderFrame(ctx, job, t, scale = 1) {
  if (job.roles === undefined) job.roles = rolesOf(job);
  const plans = momentsOf(job);
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

  const endDim = st.phase === 'end' ? 1 - 0.55 * smooth(st.endK * 2.5) : 1;
  const hookIn = smooth(t / 0.35);

  job.sides.forEach((side0, i) => {
    const pn = layout.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(...pn.clip);
    ctx.clip();
    ctx.translate(pn.cx, pn.groundY);
    const ps = panelState(layout, i, st, tl.C);
    // el lado malo dibuja la MISMA escena y las mismas acciones que el bueno (empiezan iguales);
    // sus propias acciones solo deciden cómo se queda al rendirse
    const role = job.roles ? job.roles[i] : null;
    const gSide = job.roles ? job.sides[job.roles.indexOf('good')] : null;
    const side = role === 'bad' ? { ...side0, scene: gSide.scene, people: gSide.people.map((p, j) => ({ ...p, badAct: (side0.people[j] || side0.people[0] || p).act })) } : side0;
    const sp = role ? pathP(tl, ps.p, role) : ps.p;
    const S = {
      // «ausente»: no está en la escena principal (solo salen los presentes); se dibuja aparte, pequeño, en otro lugar
      w: pn.stageW, F: pn.F, people: side.people.filter((p) => p.act !== 'ausente'), allPeople: side.people, absent: side.people.filter((p) => p.act === 'ausente'), good: role === 'bad' ? ps.r > 0 ? false : true : side.good, bad: side.bad,
      p: sp, r: ps.r, t, C: tl.C, seed: isTime || job.roles ? job.seed : job.seed + i * 13, arc: arcState(tl, t, st, role), role, sceneName: side.scene,
      dimmed: !side0.good && ps.r > 0.4, focus: null,
      // si alguien usa ese objeto (tocar-guitarra…), va en su mano y no se dibuja aparte
      object: side.object && !side.people.some((p) => USES[p.act]?.obj === side.object) ? side.object : null,
      // la misma caja en todos los paneles: así un suceso igual se dibuja igual en los dos lados (regla del arco)
      box: { l: -Math.min(...layout.panels.map((q) => q.stageW)) / 2, r: Math.min(...layout.panels.map((q) => q.stageW)) / 2, top: Math.max(...layout.panels.map((q) => q.clip[1] - q.groundY)), bot: Math.min(...layout.panels.map((q) => q.clip[1] + q.clip[3] - q.groundY)) },
      moments: st.phase === 'hook' ? null : momentsNow(plans[i], t),
    };
    let a = endDim * hookIn * ps.show;
    if (isTime && st.phase === 'end' && i < 2) a *= 1 - 0.5 * smooth(st.endK * 2.5);
    if (!side0.good && st.phase !== 'main') a *= 1 - 0.25 * ps.r;
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
    withAlpha(ctx, sceneAlpha, () => { scene.draw(ctx, S); if (S.absent.length) drawAbsent(ctx, S, S.absent); });
    if (job.countFigs) job.countFigs[i] = Math.max(job.countFigs[i] || 0, S._figs || 0);
    setNeutral(0);
    setCurrent(null);
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
  });

  // textos de cada lado
  const titleA = st.phase === 'hook' || st.phase === 'rewind' ? smooth((t - 1.35) / 0.45) : st.phase === 'end' ? 1 - smooth(st.endK * 4) : 1;
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
      g.addColorStop(0, `rgba(0,0,0,${0.85 * v})`);
      g.addColorStop(0.45, `rgba(0,0,0,${0.78 * v})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
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

// ---------------------------------------------------------------------------
// PORTADA (fotograma 0 del MP4 y imagen «Descargar portada»): los dos lados de la escena ya dibujados
// a mitad de la historia (se ve la diferencia), el TITULO grande y el corazón rojo.
// No cuenta como inicio de la historia: desde el fotograma 1 el video empieza como siempre.
export function coverTime(job) {
  const tl = job.tl;
  if (job.layout.kind === 'time') return tl.resStart + tl.res * 0.7;
  const roles = rolesOf(job);
  if (roles) return Math.min(tl.resStart - 0.2, arcTime(tl) + ARC.quit[1] + 1.2);
  return tOfP(tl, 0.62);
}
export function renderCover(ctx, job, scale = 1) {
  // la escena sin los títulos de cada lado ni el gancho (la portada lleva solo el TITULO)
  if (!job.coverJob) job.coverJob = { ...job, moments: undefined, roles: undefined, coverJob: undefined, texts: { ...job.texts, hook: '', sides: [] } };
  renderFrame(ctx, job.coverJob, coverTime(job), scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.globalAlpha = 1;
  const yC = job.layout.kind === 'lr' ? 1150 : job.layout.kind === 'time' ? 765 : 905;
  const title = String(job.title || job.texts.phrase || '').replace(/\*/g, '').trim();
  ctx.font = `500 88px ${FONT}`;
  let fs = 88, lines = wrap(ctx, title, 940, 2);
  while (lines.length > 3 && fs > 56) { fs -= 8; ctx.font = `500 ${fs}px ${FONT}`; lines = wrap(ctx, title, 940, 2); }
  lines = lines.slice(0, 3);
  const lh = fs * 1.12, blockH = lines.length * lh;
  const top = yC - blockH / 2;
  // velo negro suave detrás del título para que se lea limpio
  const g = ctx.createLinearGradient(0, top - 190, 0, top + blockH + 120);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.28, 'rgba(0,0,0,0.82)'); g.addColorStop(0.8, 'rgba(0,0,0,0.82)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, top - 190, W, blockH + 310);
  // corazón rojo encima del título
  const hy = top - 78;
  glow(ctx, W / 2, hy, 150, RED, 0.85);
  heart(ctx, W / 2, hy, 46, RED, 1);
  ctx.fillStyle = WHITE;
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${fs}px ${FONT}`;
  lines.forEach((ln, i) => spaced(ctx, ln, W / 2, top + fs * 0.92 + i * lh, 2));
  // nombre del canal, pequeño
  ctx.globalAlpha = 0.6;
  ctx.font = `400 24px ${FONT}`;
  spaced(ctx, job.lang === 'en' ? 'TWO PATHS STORIES' : 'DOS CAMINOS', W / 2, top + blockH + 52, 6);
  ctx.globalAlpha = 1;
}
