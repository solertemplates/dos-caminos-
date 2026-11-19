// Dos Caminos — creación del MP4 en el propio teléfono.
// Vía rápida: WebCodecs (H.264 + AAC) + mp4-muxer. Respaldo: MediaRecorder en tiempo real.
import { Muxer, ArrayBufferTarget } from '../vendor/mp4-muxer.mjs';
import { renderFrame, FPS, W, H } from './render.js';

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function encodeVideo({ canvas, job, audio, D, scale, onProgress, signal }) {
  const width = Math.round(W * scale), height = Math.round(H * scale);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const sup = await detectSupport(width, height);
  if (sup.webcodecs) {
    try {
      return await encodeWebCodecs({ canvas, ctx, job, audio, D, scale, width, height, codec: sup.vcodec, onProgress, signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      console.warn('WebCodecs falló, uso MediaRecorder', e);
    }
  }
  if (!sup.mr) throw new Error('Este navegador no puede crear video. Actualiza iOS/Safari.');
  return await encodeRealtime({ canvas, ctx, job, audio, D, scale, mime: sup.mr, onProgress, signal });
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
  const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (err = e) });
  aenc.configure({ codec: 'mp4a.40.2', sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 160000 });

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
    renderFrame(ctx, job, i / FPS, scale);
    const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    venc.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
    vf.close();
    while (venc.encodeQueueSize > 6) await sleep(2);
    if (i % 6 === 0) { onProgress?.(i / frames); await sleep(0); }
  }
  await venc.flush();
  await aenc.flush();
  if (err) throw err;
  muxer.finalize();
  venc.close();
  aenc.close();
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', mime: 'video/mp4' };
}

async function encodeRealtime({ canvas, ctx, job, audio, D, scale, mime, onProgress, signal }) {
  const ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audio.sampleRate });
  await ac.resume();
  const dest = ac.createMediaStreamDestination();
  const src = ac.createBufferSource();
  src.buffer = audio;
  src.connect(dest);
  renderFrame(ctx, job, 0, scale);
  const vstream = canvas.captureStream(FPS);
  const stream = new MediaStream([...vstream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: scale >= 1 ? 7_000_000 : 4_000_000, audioBitsPerSecond: 160000 });
  const parts = [];
  rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
  const done = new Promise((r) => (rec.onstop = r));
  rec.start(500);
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
  ac.close();
  if (signal?.aborted) throw new DOMException('cancelado', 'AbortError');
  const type = mime.split(';')[0];
  return { blob: new Blob(parts, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm', mime: type };
}
