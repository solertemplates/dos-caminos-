// Dos Caminos — creación del MP4 en el propio teléfono.
// Vía rápida: WebCodecs (H.264 + AAC) + mp4-muxer. Respaldo: MediaRecorder en tiempo real.
import { Muxer, ArrayBufferTarget } from '../vendor/mp4-muxer.mjs';
import { renderFrame, renderCover, FPS, W, H } from './render.js';
import { audioChunksFromMp4 } from './remux.js';

const VCODECS = ['avc1.640028', 'avc1.4d0028', 'avc1.42002a', 'avc1.640033', 'avc1.42e01f'];
let support = null;

export async function detectSupport(width, height) {
  if (support && support.w === width) return support;
  const s = { w: width, webcodecs: false, vcodec: null, mr: null };
  try {
    if (typeof VideoEncoder !== 'undefined' && typeof AudioEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
      for (const codec of VCODECS) {
        const r = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 6_000_000, framerate: FPS });
        if (r.supported) { s.vcodec = codec; break; }
      }
      const a = await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 128000 });
      s.webcodecs = !!(s.vcodec && a.supported);
    }
  } catch (e) { console.warn(e); }
  if (typeof MediaRecorder !== 'undefined') {
    for (const m of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs="avc1,mp4a"', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']) {
      try { if (MediaRecorder.isTypeSupported(m)) { s.mr = m; break; } } catch (e) {}
    }
  }
  support = s;
  return s;
}

// iPhone / iPad (también iPad que se presenta como Mac)
export function isIOS() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
const hex = (b, n = 24) => [...new Uint8Array(b.buffer ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) : b)].slice(0, n).map((x) => x.toString(16).padStart(2, '0')).join(' ');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// iOS solo deja sonar el audio de un AudioContext creado/activado en un toque del usuario:
// se crea uno al pulsar «Crear» (o «Continuar») y se reutiliza para todas las grabaciones en tiempo real.
let sharedAC = null;
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!sharedAC || sharedAC.state === 'closed') sharedAC = new AC({ sampleRate: 48000 });
    sharedAC.resume();
    // un sonido inaudible en el mismo toque termina de desbloquearlo en iPhone
    const b = sharedAC.createBuffer(1, 1, 48000), s = sharedAC.createBufferSource();
    s.buffer = b; s.connect(sharedAC.destination); s.start(0);
  } catch (e) { console.warn('audio', e); }
}

export function audioCtx() { return sharedAC && sharedAC.state !== 'closed' ? sharedAC : null; }

// Configuración AAC-LC (AudioSpecificConfig) para el MP4, por si el navegador no la da.
function aacConfig(sampleRate, channels) {
  const idx = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000].indexOf(sampleRate);
  const i = idx < 0 ? 3 : idx;
  return new Uint8Array([(2 << 3) | (i >> 1), ((i & 1) << 7) | (channels << 3)]);
}

export async function encodeVideo({ canvas, job, audio, D, scale, onProgress, signal, force }) {
  const width = Math.round(W * scale), height = Math.round(H * scale);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const sup = await detectSupport(width, height);
  const diag = { support: { webcodecs: sup.webcodecs, videoCodec: sup.vcodec, mediaRecorder: sup.mr }, tried: [] };
  if (sup.webcodecs && force !== 'realtime') {
    try {
      const out = await encodeWebCodecs({ canvas, ctx, job, audio, D, scale, width, height, codec: sup.vcodec, onProgress, signal });
      diag.tried.push({ method: 'rápido (WebCodecs)', ok: true, ...out.diag });
      return { ...out, method: 'webcodecs', diag };
    } catch (e) {
      if (signal?.aborted) throw e;
      diag.tried.push({ method: 'rápido (WebCodecs)', ok: false, error: `${e.name}: ${e.message}` });
      console.warn('WebCodecs falló, uso MediaRecorder', e);
    }
  }
  if (!sup.mr) throw new Error('Este navegador no puede crear video. Actualiza iOS/Safari.');
  const out = await encodeRealtime({ canvas, ctx, job, audio, D, scale, mime: sup.mr, onProgress, signal });
  diag.tried.push({ method: 'tiempo real (MediaRecorder)', ok: true, ...out.diag });
  return { ...out, method: 'realtime', diag };
}

async function encodeWebCodecs({ canvas, ctx, job, audio, D, scale, width, height, codec, onProgress, signal }) {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: FPS },
    audio: { codec: 'aac', numberOfChannels: 2, sampleRate: audio.sampleRate },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });
  let err = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (err = e) });
  venc.configure({ codec, width, height, bitrate: scale >= 1 ? 7_000_000 : 4_000_000, framerate: FPS, avc: { format: 'avc' } });
  // AAC: Safari puede entregarlo con cabeceras ADTS y sin configuración; se normaliza para el MP4
  // (sin esto el MP4 sale con la pista de audio vacía o ilegible = video sin música)
  let audioChunks = 0, audioUs = 0, sentConfig = false, adts = 0, descFromEncoder = null, safariDesc = '', aBytes = 0, aMin = Infinity, aMax = 0;
  const asc = aacConfig(audio.sampleRate, 2);
  const aenc = new AudioEncoder({
    output: (c, m) => {
      let data = new Uint8Array(c.byteLength);
      c.copyTo(data);
      if (data.length > 7 && data[0] === 0xff && (data[1] & 0xf6) === 0xf0) { data = data.subarray(data[1] & 1 ? 7 : 9); adts++; }
      if (!data.length) return;
      let meta;
      if (!sentConfig) {
        const dc = m && m.decoderConfig;
        descFromEncoder = !!(dc && dc.description && dc.description.byteLength);
        if (descFromEncoder) safariDesc = `${dc.description.byteLength} bytes: ${hex(dc.description)}`;
        // Siempre la configuración AAC-LC propia (2 bytes). La de Safari puede venir en otro formato
        // (p. ej. un «magic cookie»/esds completo) y, metida tal cual en el MP4, el audio no suena.
        meta = { decoderConfig: { codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, description: asc } };
        sentConfig = true;
      }
      const dur = c.duration || Math.round((1024 / audio.sampleRate) * 1e6);
      muxer.addAudioChunkRaw(data, 'key', c.timestamp, dur, meta);
      audioChunks++;
      aBytes += data.length; aMin = Math.min(aMin, data.length); aMax = Math.max(aMax, data.length);
      audioUs += dur;
    },
    error: (e) => (err = e),
  });
  const acfg = { codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 160000 };
  try { aenc.configure({ ...acfg, aac: { format: 'aac' } }); } catch (e) { aenc.configure(acfg); }

  // audio primero (rápido)
  const L = audio.getChannelData(0), R = audio.getChannelData(1);
  const chunk = 1024 * 4;
  for (let i = 0; i < audio.length; i += chunk) {
    const n = Math.min(chunk, audio.length - i);
    const data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0);
    data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / audio.sampleRate) * 1e6), data });
    aenc.encode(ad);
    ad.close();
  }

  const frames = Math.round(D * FPS);
  for (let i = 0; i < frames; i++) {
    if (signal?.aborted) { try { venc.close(); aenc.close(); } catch (e) {} throw new DOMException('cancelado', 'AbortError'); }
    if (err) throw err;
    // fotograma 0 = portada (la miniatura del video); la historia empieza en el fotograma 1
    if (i === 0) renderCover(ctx, job, scale); else renderFrame(ctx, job, i / FPS, scale);
    const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    venc.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
    vf.close();
    while (venc.encodeQueueSize > 6) await sleep(2);
    if (i % 6 === 0) { onProgress?.(i / frames); await sleep(0); }
  }
  await venc.flush();
  await aenc.flush();
  if (err) throw err;
  // comprobación: la música tiene que estar dentro del MP4 de principio a fin
  if (audioChunks === 0 || audioUs < D * 1e6 * 0.9) throw new Error(`audio incompleto (${(audioUs / 1e6).toFixed(1)} s de ${D} s)`);
  muxer.finalize();
  venc.close();
  aenc.close();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', mime: 'video/mp4', diag: { videoCodec: codec, aacChunks: audioChunks, aacSeconds: +(audioUs / 1e6).toFixed(2), adtsHeadersRemoved: adts, aacConfigFromSafari: descFromEncoder ? safariDesc : 'no', aacConfigUsed: hex(asc), aacBytesPerBlock: `media ${Math.round(aBytes / Math.max(1, audioChunks))}, mín ${aMin === Infinity ? 0 : aMin}, máx ${aMax}` } };
}

async function encodeRealtime({ canvas, ctx, job, audio, D, scale, mime, onProgress, signal }) {
  const own = !(sharedAC && sharedAC.state !== 'closed');
  const ac = own ? new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audio.sampleRate }) : sharedAC;
  const acBefore = ac.state;
  await ac.resume();
  const dest = ac.createMediaStreamDestination();
  const src = ac.createBufferSource();
  src.buffer = audio;
  src.connect(dest);
  renderCover(ctx, job, scale); // primer fotograma = portada (la miniatura del video)
  const vstream = canvas.captureStream(FPS);
  const stream = new MediaStream([...vstream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: scale >= 1 ? 7_000_000 : 4_000_000, audioBitsPerSecond: 160000 });
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(500);
  await sleep(150); // la portada queda grabada como primer fotograma
  const t0 = ac.currentTime + 0.05;
  src.start(t0);
  await new Promise((resolve) => {
    const tick = () => {
      const t = ac.currentTime - t0;
      if (signal?.aborted || t >= D) return resolve();
      renderFrame(ctx, job, Math.max(0, t), scale);
      onProgress?.(t / D);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  renderFrame(ctx, job, D - 0.01, scale);
  await sleep(150);
  rec.stop();
  await done;
  try { src.stop(); } catch (e) {}
  if (own) ac.close();
  if (signal?.aborted) throw new DOMException('cancelado', 'AbortError');
  const type = mime.split(';')[0];
  return { blob: new Blob(parts, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm', mime: type, realtime: true, diag: { recorderMime: mime, audioContext: own ? 'nuevo' : 'desbloqueado al tocar', audioStateBefore: acBefore, audioTracks: dest.stream.getAudioTracks().length } };
}

// ---------------------------------------------------------------------------
// Solo audio (para «Cambiar música» en Mis videos): devuelve chunks listos para remuxWithAudio.
// En iPhone (salvo «Rápido» en Ajustes) se graba en tiempo real con MediaRecorder, el método que suena en Fotos.
export async function encodeAudioOnly(audio, { realtime = false, onProgress } = {}) {
  if (realtime) {
    const mime = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4'].find((m) => { try { return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
    if (mime) return { ...(await recordAudio(audio, mime, onProgress)), method: 'tiempo real' };
  }
  const tries = [
    { codec: 'aac', cfg: { codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 160000 } },
    { codec: 'opus', cfg: { codec: 'opus', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 128000 } },
  ];
  if (typeof AudioEncoder !== 'undefined') {
    for (const tr of tries) {
      try { if (!(await AudioEncoder.isConfigSupported(tr.cfg)).supported) continue; } catch (e) { continue; }
      return { ...(await encodeAudioWC(audio, tr.codec, tr.cfg, onProgress)), method: 'rápido' };
    }
  }
  const mime = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4'].find((m) => { try { return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
  if (mime) return { ...(await recordAudio(audio, mime, onProgress)), method: 'tiempo real' };
  throw new Error('este navegador no puede crear audio para MP4');
}

async function encodeAudioWC(audio, codec, cfg, onProgress) {
  const chunks = [];
  let err = null, description = codec === 'aac' ? aacConfig(audio.sampleRate, 2) : undefined;
  const enc = new AudioEncoder({
    output: (c, m) => {
      let data = new Uint8Array(c.byteLength);
      c.copyTo(data);
      if (codec === 'aac' && data.length > 7 && data[0] === 0xff && (data[1] & 0xf6) === 0xf0) data = data.slice(data[1] & 1 ? 7 : 9);
      if (codec === 'opus' && !chunks.length && m?.decoderConfig?.description) description = new Uint8Array(m.decoderConfig.description);
      if (data.length) chunks.push({ data, ts: c.timestamp, dur: c.duration || Math.round((1024 / audio.sampleRate) * 1e6) });
    },
    error: (e) => (err = e),
  });
  try { enc.configure(codec === 'aac' ? { ...cfg, aac: { format: 'aac' } } : cfg); } catch (e) { enc.configure(cfg); }
  const L = audio.getChannelData(0), R = audio.getChannelData(1), step = 4096;
  for (let i = 0; i < audio.length; i += step) {
    const n = Math.min(step, audio.length - i), data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / audio.sampleRate) * 1e6), data });
    enc.encode(ad); ad.close();
    if (i % (step * 40) === 0) { onProgress?.(i / audio.length); await sleep(0); }
  }
  await enc.flush(); enc.close();
  if (err) throw err;
  if (!chunks.length) throw new Error('el codificador no dio audio');
  return { codec, sampleRate: audio.sampleRate, channels: 2, description: description && description.byteLength >= (codec === 'opus' ? 18 : 2) ? description : codec === 'aac' ? aacConfig(audio.sampleRate, 2) : undefined, chunks };
}

async function recordAudio(audio, mime, onProgress) {
  const own = !(sharedAC && sharedAC.state !== 'closed');
  const ac = own ? new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audio.sampleRate }) : sharedAC;
  await ac.resume();
  const dest = ac.createMediaStreamDestination();
  const src = ac.createBufferSource();
  src.buffer = audio;
  src.connect(dest);
  const rec = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 160000 });
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(500);
  const t0 = ac.currentTime + 0.05;
  src.start(t0);
  const D = audio.duration;
  while (ac.currentTime - t0 < D) { onProgress?.((ac.currentTime - t0) / D); await sleep(200); }
  await sleep(150);
  rec.stop();
  await done;
  try { src.stop(); } catch (e) {}
  if (own) ac.close();
  return audioChunksFromMp4(await new Blob(parts).arrayBuffer());
}
