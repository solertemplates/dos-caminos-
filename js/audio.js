// Dos Caminos — audio. Efectos de sonido sintetizados por código (obra propia, dedicada CC0)
// y mezcla con la música del banco del usuario. Todo se genera en el teléfono, sin API.
import { SCENES } from './scenes.js';
import { tOfP, timeEventP, rolesOf, pathInv, arcTime, ARC, momentsOf } from './render.js';
import { MOMENTS } from './moments.js';

const SR = 48000;

function noiseBuffer(ctx, dur = 1) {
  const b = ctx.createBuffer(1, Math.ceil(dur * ctx.sampleRate), ctx.sampleRate);
  const d = b.getChannelData(0);
  let s = 12345;
  for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x7fffffff) * 2 - 1; }
  return b;
}

function env(g, t, a, peak, dec, hold = 0) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (hold) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + dec);
}

function tone(ctx, out, t, freq, type, peak, a, dec, freqEnd) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + a + dec);
  const g = ctx.createGain();
  env(g, t, a, peak, dec);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + a + dec + 0.05);
}

function noise(ctx, out, nb, t, peak, a, dec, ftype, f1, f2, q = 1) {
  const s = ctx.createBufferSource();
  s.buffer = nb;
  const f = ctx.createBiquadFilter();
  f.type = ftype;
  f.Q.value = q;
  f.frequency.setValueAtTime(f1, t);
  if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + a + dec);
  const g = ctx.createGain();
  env(g, t, a, peak, dec);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.5);
  s.stop(t + a + dec + 0.05);
}

export const SFX = {
  tock(c, o, nb, t, e) { const d = e.detune || 1; tone(c, o, t, 210 * d, 'sine', 0.35, 0.002, 0.12, 120 * d); noise(c, o, nb, t, 0.12, 0.001, 0.05, 'bandpass', 1100 * d, 0, 2); },
  ting(c, o, nb, t) { tone(c, o, t, 1870, 'sine', 0.09, 0.002, 0.7); tone(c, o, t + 0.004, 2810, 'sine', 0.05, 0.002, 0.45); },
  coinOut(c, o, nb, t) { tone(c, o, t, 1320, 'sine', 0.06, 0.002, 0.3); },
  bag(c, o, nb, t) { noise(c, o, nb, t, 0.08, 0.005, 0.12, 'lowpass', 900, 0, 0.7); },
  drip(c, o, nb, t) { tone(c, o, t, 700, 'sine', 0.12, 0.002, 0.09, 1500); tone(c, o, t + 0.16, 820, 'sine', 0.06, 0.002, 0.08, 1600); },
  ping(c, o, nb, t, e) { const v = e.vol ?? 1; tone(c, o, t, 1046.5, 'sine', 0.05 * v, 0.01, 1.4); tone(c, o, t, 1568, 'sine', 0.025 * v, 0.01, 1.0); },
  chime(c, o, nb, t) { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone(c, o, t + i * 0.11, f, 'sine', 0.07, 0.01, 2.2); tone(c, o, t + i * 0.11, f * 2.01, 'sine', 0.015, 0.01, 1.2); }); },
  heartbeat(c, o, nb, t) { tone(c, o, t, 62, 'sine', 0.55, 0.01, 0.16, 45); tone(c, o, t + 0.24, 58, 'sine', 0.4, 0.01, 0.18, 42); },
  low(c, o, nb, t) { tone(c, o, t, 98, 'sine', 0.16, 0.25, 2.4, 82); noise(c, o, nb, t, 0.05, 0.5, 2.0, 'lowpass', 420, 180, 0.5); },
  wind(c, o, nb, t) { noise(c, o, nb, t, 0.07, 0.8, 2.4, 'bandpass', 500, 1400, 0.8); },
  whoosh(c, o, nb, t) { noise(c, o, nb, t, 0.16, 0.3, 0.35, 'bandpass', 2600, 300, 1.2); },
  crash(c, o, nb, t) { noise(c, o, nb, t, 0.2, 0.005, 0.6, 'lowpass', 1500, 200, 0.8); for (let i = 0; i < 5; i++) tone(c, o, t + 0.06 * i + 0.05, 180 - i * 15, 'sine', 0.15, 0.002, 0.1, 90); },
  crack(c, o, nb, t) { noise(c, o, nb, t, 0.12, 0.001, 0.12, 'highpass', 1800, 0, 0.8); tone(c, o, t, 300, 'triangle', 0.06, 0.001, 0.2, 140); },
  page(c, o, nb, t) { noise(c, o, nb, t, 0.05, 0.03, 0.12, 'highpass', 2500, 4500, 0.6); },
  blip(c, o, nb, t) { tone(c, o, t, 1480, 'sine', 0.035, 0.003, 0.08); tone(c, o, t + 0.09, 1975, 'sine', 0.03, 0.003, 0.1); },
  step(c, o, nb, t, e) { noise(c, o, nb, t, 0.04 * (e.vol ?? 1), 0.003, 0.06, 'lowpass', 500, 0, 0.7); },
  thud(c, o, nb, t) { tone(c, o, t, 90, 'sine', 0.35, 0.003, 0.25, 50); noise(c, o, nb, t, 0.08, 0.002, 0.15, 'lowpass', 400, 0, 0.7); },
  crackle(c, o, nb, t) { for (let i = 0; i < 6; i++) noise(c, o, nb, t + i * 0.045 + Math.random() * 0.03, 0.05, 0.001, 0.02, 'highpass', 2000 + Math.random() * 2000, 0, 1); },
  // el momento en que cada uno elige: dos notas que se separan
  choice(c, o, nb, t) { tone(c, o, t, 659.25, 'sine', 0.06, 0.01, 0.9); tone(c, o, t + 0.18, 880, 'sine', 0.045, 0.01, 1.1); tone(c, o, t + 0.18, 587.33, 'sine', 0.045, 0.01, 1.1); },
  shimmer(c, o, nb, t) { [1318.5, 1760, 2093, 2637].forEach((f, i) => tone(c, o, t + i * 0.06, f, 'sine', 0.025, 0.01, 0.9)); },
};

// Música de respaldo generada por código, si el banco está vacío.
const CHORDS = {
  romantica: [[53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 60], [46, 50, 53, 57]],
  tension: [[45, 52, 57, 60], [45, 52, 56, 60], [46, 53, 58, 61], [44, 51, 56, 59]],
  triste: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 52, 55, 60], [43, 50, 55, 59]],
  emotiva: [[48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [41, 48, 53, 57]],
  inspiracional: [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 60]],
  alegre: [[43, 50, 55, 59], [50, 57, 62, 66], [52, 55, 59, 64], [48, 55, 60, 64]],
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function pad(ctx, out, emotion, D) {
  const chords = CHORDS[emotion] || CHORDS.emotiva;
  const bar = emotion === 'alegre' ? 2.4 : emotion === 'tension' ? 3.2 : 3.6;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  const bus = ctx.createGain();
  bus.gain.value = 0.9;
  lp.connect(bus).connect(out);
  for (let t = 0, i = 0; t < D; t += bar, i++) {
    const ch = chords[i % chords.length];
    ch.forEach((m, j) => {
      for (const det of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = j === 0 ? 'sine' : 'triangle';
        o.frequency.value = mtof(m + (j === 0 ? -12 : 0));
        o.detune.value = det;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(j === 0 ? 0.05 : 0.022, t + bar * 0.35);
        g.gain.linearRampToValueAtTime(0.0001, t + bar * 1.15);
        o.connect(g).connect(lp);
        o.start(t);
        o.stop(Math.min(D, t + bar * 1.2));
      }
    });
    // arpegio suave
    const step = emotion === 'alegre' ? bar / 8 : bar / 4;
    if (emotion !== 'triste') {
      for (let k = 0; k < bar / step; k++) {
        const tt = t + k * step;
        if (tt > D - 0.5) break;
        const m = ch[(k % 3) + 1] + 12;
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = mtof(m);
        const g = ctx.createGain();
        env(g, tt, 0.01, 0.03, Math.min(1.2, step * 2));
        o.connect(g).connect(out);
        o.start(tt);
        o.stop(tt + step * 2 + 0.1);
      }
    }
  }
}

// Construye toda la pista de audio del video con OfflineAudioContext.
export async function renderAudio({ job, D, musicData, sfxOn = true, sfxVol = 1, musicVol = 0.8 }) {
  const ctx = new OfflineAudioContext(2, Math.ceil(D * SR), SR);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);

  // música
  const mus = ctx.createGain();
  mus.gain.setValueAtTime(0.0001, 0);
  mus.gain.linearRampToValueAtTime(musicVol, 0.25);
  mus.gain.setValueAtTime(musicVol, Math.max(0.3, D - 1.8));
  mus.gain.linearRampToValueAtTime(0.0001, D);
  mus.connect(master);
  let usedSong = false, songInfo = { given: !!musicData };
  if (musicData) {
    try {
      const buf = await ctx.decodeAudioData(musicData.slice(0));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      let offset = 0;
      if (buf.duration > D + 25) offset = Math.min(12, buf.duration * 0.08);
      if (buf.duration < D + offset) { src.loop = true; offset = 0; }
      src.connect(mus);
      src.start(0, offset);
      usedSong = true;
      songInfo = { given: true, decoded: true, seconds: +buf.duration.toFixed(1), sampleRate: buf.sampleRate, startAt: +offset.toFixed(1), loop: src.loop };
    } catch (e) {
      songInfo = { given: true, decoded: false, error: `${e.name}: ${e.message}` };
      console.warn('No se pudo leer la canción', e);
    }
  }
  if (!usedSong) pad(ctx, mus, job.emotion, D);

  if (sfxOn) {
    const fx = ctx.createGain();
    fx.gain.value = sfxVol;
    fx.connect(master);
    const nb = noiseBuffer(ctx, 1.5);
    const tl = job.tl;
    const play = (type, t, e = {}, pan = 0) => {
      if (!SFX[type] || t < 0 || t > D - 0.05) return;
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      p.connect(fx);
      SFX[type](ctx, p, nb, t, e);
    };
    play('heartbeat', 0.05);
    play('shimmer', 0.2);
    const isTime = job.layout.kind === 'time';
    const roles = rolesOf(job);
    job.sides.forEach((side0, i) => {
      // el lado malo hace lo mismo que el bueno hasta que se rinde: suenan las mismas acciones
      const role = roles ? roles[i] : null;
      const side = role === 'bad' ? { ...side0, scene: job.sides[roles.indexOf('good')].scene, people: job.sides[roles.indexOf('good')].people, segments: job.sides[roles.indexOf('good')].segments } : side0;
      if (isTime && i > 0) return; // mismo camino: los sonidos se calculan una vez
      const pan = isTime ? 0 : job.layout.kind === 'lr' ? (i ? 0.35 : -0.35) : (i ? 0.15 : -0.15);
      // varias escenas por lado: los sonidos de cada escena suenan en su tramo
      const segs = !isTime && side.segments && side.segments.length > 1 ? side.segments : [{ scene: side.scene, people: side.people }];
      segs.forEach((g, k) => {
        const scene = SCENES[g.scene];
        if (!scene || !scene.events) return;
        const S = { people: g.people.filter((p) => p.act !== 'ausente'), good: side0.good, bad: side0.bad, C: tl.C, w: 1000, F: 250, seed: 1 };
        for (const e of scene.events(S)) {
          let t;
          if (e.p != null) {
            const pl = (k + e.p) / segs.length;
            const pg = isTime ? timeEventP(tl.C, pl) : role ? pathInv(tl, pl, role) : pl;
            if (pg == null) continue;
            t = tOfP(tl, pg);
          } else if (k === segs.length - 1) t = tl.resStart + e.r * tl.res;
          else continue;
          play(e.type, t, e, pan);
        }
      });
    });
    if (roles) {
      // el momento difícil llega a los dos a la vez; el bueno se levanta (nota suave); el malo suspira y se queda
      const tD = arcTime(tl);
      play('thud', tD + 0.25, {}, -0.2);
      play('thud', tD + 0.27, {}, 0.2);
      play('ping', tD + ARC.rise[1], { vol: 0.6 }, roles.indexOf('good') ? 0.25 : -0.25);
      play('wind', tD + ARC.quit[0], {}, roles.indexOf('bad') ? 0.25 : -0.25);
    } else if (isTime) [1, 2].forEach((k) => play('ping', tOfP(tl, k / 3), { vol: 0.7 }));
    play('ping', tl.endStart + 0.5, { vol: 0.8 });
    // sucesos (regla de ritmo): un sonido suave al empezar cada uno
    const heard = new Set();
    momentsOf(job).forEach((plan, i) => {
      const pan = isTime ? 0 : job.layout.kind === 'lr' ? (i ? 0.3 : -0.3) : (i ? 0.12 : -0.12);
      for (const e of plan) {
        const fx = MOMENTS[e.type]?.sfx;
        const key = `${e.type}@${e.t0.toFixed(2)}`;
        if (!fx || heard.has(key)) continue;
        heard.add(key);
        if (e.type === 'llueve') [0, 0.35, 0.8, 1.3].forEach((d) => play('drip', e.t0 + d, { vol: 0.45 }, pan));
        else play(fx, e.t0 + 0.05, { vol: 0.45 }, pan);
      }
    });
  }
  const rendered = await ctx.startRendering();
  // nivel de la mezcla (para el Diagnóstico)
  const ch = rendered.getChannelData(0);
  const lvl = (a, b) => { let s = 0, pk = 0; const i0 = Math.floor(a * SR), i1 = Math.min(ch.length, Math.floor(b * SR)); for (let i = i0; i < i1; i++) { s += ch[i] * ch[i]; pk = Math.max(pk, Math.abs(ch[i])); } return { rms: +Math.sqrt(s / Math.max(1, i1 - i0)).toFixed(3), peak: +pk.toFixed(3) }; };
  rendered.__info = { song: songInfo, usedSong, padMusic: !usedSong, firstSecond: lvl(0, 1), whole: lvl(0, D) };
  return rendered;
}
