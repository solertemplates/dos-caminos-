// Dos Caminos — cambiar la música de un video ya creado SIN volver a dibujarlo:
// se leen las muestras de video del MP4 tal cual (sin recodificar) y se vuelve a empaquetar
// con una pista de audio nueva. Vale para MP4 normales (WebCodecs + mp4-muxer) y fragmentados (MediaRecorder).
import { Muxer, ArrayBufferTarget } from '../vendor/mp4-muxer.mjs';
import { boxes, find } from './mp4strip.js';

const str4 = (u8, p) => String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]);
const hex2 = (n) => n.toString(16).padStart(2, '0');

// Lee todas las pistas con sus muestras: { id, kind, codec, timescale, samples:[{off,size,dts,dur,cto,key}], config, width, height, sampleRate, channels }
export function demux(buffer) {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const tracks = [];
  const byId = {};
  const trex = {};
  for (const top of boxes(u8, dv, 0, u8.length)) {
    if (top.type === 'moov') {
      for (const b of boxes(u8, dv, top.body, top.end)) {
        if (b.type === 'mvex') for (const x of boxes(u8, dv, b.body, b.end)) if (x.type === 'trex') trex[dv.getUint32(x.body + 4)] = { dur: dv.getUint32(x.body + 12), size: dv.getUint32(x.body + 16), flags: dv.getUint32(x.body + 20) };
        if (b.type === 'trak') { const t = readTrak(u8, dv, b); if (t) { tracks.push(t); byId[t.id] = t; } }
      }
    }
    if (top.type === 'moof') readMoof(u8, dv, top, byId, trex);
  }
  for (const t of tracks) {
    t.samples.forEach((s) => { if (s.off + s.size > u8.length) s.bad = true; });
    t.samples = t.samples.filter((s) => !s.bad && s.size > 0);
  }
  return { u8, tracks, video: tracks.find((t) => t.kind === 'video') || null, audio: tracks.find((t) => t.kind === 'audio') || null };
}

function readTrak(u8, dv, trak) {
  const tkhd = find(u8, dv, trak, 'tkhd');
  const mdia = find(u8, dv, trak, 'mdia');
  if (!tkhd || !mdia) return null;
  const id = dv.getUint32(tkhd.body + (u8[tkhd.body] === 1 ? 20 : 12));
  const hdlr = find(u8, dv, mdia, 'hdlr');
  const mdhd = find(u8, dv, mdia, 'mdhd');
  const handler = hdlr ? str4(u8, hdlr.body + 8) : '';
  const t = { id, kind: handler === 'soun' ? 'audio' : handler === 'vide' ? 'video' : handler, codec: '', timescale: mdhd ? dv.getUint32(mdhd.body + (u8[mdhd.body] === 1 ? 20 : 12)) : 1000, samples: [], config: null };
  const minf = find(u8, dv, mdia, 'minf');
  const stbl = minf && find(u8, dv, minf, 'stbl');
  if (!stbl) return t;
  const stsd = find(u8, dv, stbl, 'stsd');
  if (stsd) {
    const e = stsd.body + 8, esize = dv.getUint32(e), eend = Math.min(e + esize, stsd.end);
    t.codec = str4(u8, e + 4);
    if (t.kind === 'video') {
      t.width = dv.getUint16(e + 32); t.height = dv.getUint16(e + 34);
      for (const c of boxes(u8, dv, e + 86, eend)) {
        if (c.type === 'avcC' || c.type === 'hvcC') t.config = u8.slice(c.body, c.end);
        if (c.type === 'vpcC') t.config = u8.slice(c.body + 4, c.end); // fullbox
      }
    } else if (t.kind === 'audio') {
      t.channels = dv.getUint16(e + 24); t.sampleRate = dv.getUint16(e + 32);
      for (const c of boxes(u8, dv, e + 36, eend)) {
        if (c.type === 'esds') t.config = ascFromEsds(u8, c.body + 4, c.end);
        if (c.type === 'dOps') t.config = opusHeadFromDOps(u8.slice(c.body, c.end));
      }
    }
  }
  // tablas de muestras (MP4 normal)
  const box = (n) => find(u8, dv, stbl, n);
  const stsz = box('stsz'), stco = box('stco'), co64 = box('co64'), stsc = box('stsc'), stts = box('stts'), ctts = box('ctts'), stss = box('stss');
  if (!stsz) return t;
  const n = dv.getUint32(stsz.body + 8), fixed = dv.getUint32(stsz.body + 4);
  if (!n) return t;
  const sizes = Array.from({ length: n }, (_, i) => fixed || dv.getUint32(stsz.body + 12 + i * 4));
  const offs = [];
  if (stco || co64) {
    const cb = stco || co64, cn = dv.getUint32(cb.body + 4);
    const chunkOff = Array.from({ length: cn }, (_, i) => (co64 ? Number(dv.getBigUint64(cb.body + 8 + i * 8)) : dv.getUint32(cb.body + 8 + i * 4)));
    const runs = stsc ? Array.from({ length: dv.getUint32(stsc.body + 4) }, (_, i) => ({ first: dv.getUint32(stsc.body + 8 + i * 12), per: dv.getUint32(stsc.body + 12 + i * 12) })) : [{ first: 1, per: n }];
    let si = 0;
    for (let c = 0; c < cn && si < n; c++) {
      let per = runs[0].per;
      for (const r of runs) if (c + 1 >= r.first) per = r.per;
      let o = chunkOff[c];
      for (let k = 0; k < per && si < n; k++, si++) { offs[si] = o; o += sizes[si]; }
    }
  }
  const durs = [];
  if (stts) { let p = stts.body + 8; for (let i = 0, en = dv.getUint32(stts.body + 4); i < en; i++, p += 8) for (let c = dv.getUint32(p); c > 0; c--) durs.push(dv.getUint32(p + 4)); }
  const ctos = [];
  if (ctts) { const v1 = u8[ctts.body] === 1; let p = ctts.body + 8; for (let i = 0, en = dv.getUint32(ctts.body + 4); i < en; i++, p += 8) { const off = v1 ? dv.getInt32(p + 4) : dv.getUint32(p + 4); for (let c = dv.getUint32(p); c > 0; c--) ctos.push(off); } }
  const keys = stss ? new Set(Array.from({ length: dv.getUint32(stss.body + 4) }, (_, i) => dv.getUint32(stss.body + 8 + i * 4) - 1)) : null;
  let dts = 0;
  for (let i = 0; i < n; i++) {
    const dur = durs[i] ?? durs[durs.length - 1] ?? 0;
    if (offs[i] != null) t.samples.push({ off: offs[i], size: sizes[i], dts, dur, cto: ctos[i] || 0, key: keys ? keys.has(i) : true });
    dts += dur;
  }
  return t;
}

// 'dOps' (big-endian, en el MP4) → OpusHead (little-endian, 19 bytes) que pide el empaquetador
function opusHeadFromDOps(d) {
  if (d.length < 11) return undefined;
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const h = new Uint8Array(19), o = new DataView(h.buffer);
  h.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0); // «OpusHead»
  h[8] = 1; h[9] = d[1];
  o.setUint16(10, v.getUint16(2), true);
  o.setUint32(12, v.getUint32(4), true);
  o.setInt16(16, v.getInt16(8), true);
  h[18] = d[10];
  return h;
}

// DecoderSpecificInfo (tag 0x05) dentro de 'esds': la configuración AAC
function ascFromEsds(u8, p, end) {
  for (let k = p; k < end - 2; k++) {
    if (u8[k] !== 0x05) continue;
    let n = 0, j = k + 1, by;
    do { by = u8[j++]; n = (n << 7) | (by & 0x7f); } while (by & 0x80 && j < end);
    if (n > 0 && n < 64 && j + n <= end) return u8.slice(j, j + n);
  }
  return null;
}

function readMoof(u8, dv, moof, byId, trex) {
  for (const traf of boxes(u8, dv, moof.body, moof.end)) {
    if (traf.type !== 'traf') continue;
    const tfhd = find(u8, dv, traf, 'tfhd');
    if (!tfhd) continue;
    const t = byId[dv.getUint32(tfhd.body + 4)];
    if (!t) continue;
    const tf = dv.getUint32(tfhd.body) & 0xffffff;
    let q = tfhd.body + 8, base = moof.p;
    if (tf & 0x01) { base = Number(dv.getBigUint64(q)); q += 8; }
    if (tf & 0x02) q += 4;
    const dx = trex[t.id] || { dur: 0, size: 0, flags: 0 };
    const defDur = tf & 0x08 ? dv.getUint32((q += 4) - 4) : dx.dur;
    const defSize = tf & 0x10 ? dv.getUint32((q += 4) - 4) : dx.size;
    const defFlags = tf & 0x20 ? dv.getUint32((q += 4) - 4) : dx.flags;
    const tfdt = find(u8, dv, traf, 'tfdt');
    let dts = tfdt ? (u8[tfdt.body] === 1 ? Number(dv.getBigUint64(tfdt.body + 4)) : dv.getUint32(tfdt.body + 4)) : (t._next || 0);
    let pos = base;
    for (const tr of boxes(u8, dv, traf.body, traf.end)) {
      if (tr.type !== 'trun') continue;
      const fl = dv.getUint32(tr.body) & 0xffffff, n = dv.getUint32(tr.body + 4), v1 = u8[tr.body] === 1;
      let k = tr.body + 8;
      if (fl & 0x01) { pos = base + dv.getInt32(k); k += 4; }
      let firstFlags = null;
      if (fl & 0x04) { firstFlags = dv.getUint32(k); k += 4; }
      for (let i = 0; i < n; i++) {
        const dur = fl & 0x100 ? dv.getUint32((k += 4) - 4) : defDur;
        const size = fl & 0x200 ? dv.getUint32((k += 4) - 4) : defSize;
        let flags = fl & 0x400 ? dv.getUint32((k += 4) - 4) : i === 0 && firstFlags != null ? firstFlags : defFlags;
        if (i === 0 && firstFlags != null) flags = firstFlags;
        const cto = fl & 0x800 ? (v1 ? dv.getInt32((k += 4) - 4) : dv.getUint32((k += 4) - 4)) : 0;
        t.samples.push({ off: pos, size, dts, dur, cto, key: t.kind !== 'video' || !(flags & 0x10000) });
        pos += size; dts += dur;
      }
    }
    t._next = dts;
  }
}

function videoDecoderConfig(v) {
  if (v.codec === 'avc1' || v.codec === 'avc3') {
    const c = v.config;
    return { muxCodec: 'avc', decoderConfig: { codec: c ? `avc1.${hex2(c[1])}${hex2(c[2])}${hex2(c[3])}` : 'avc1.42001f', codedWidth: v.width, codedHeight: v.height, description: c } };
  }
  if (v.codec === 'hvc1' || v.codec === 'hev1') return { muxCodec: 'hevc', decoderConfig: { codec: 'hvc1.1.6.L93.B0', codedWidth: v.width, codedHeight: v.height, description: v.config } };
  if (v.codec === 'vp09') {
    const c = v.config || new Uint8Array([0, 10, 0x80]);
    return { muxCodec: 'vp9', decoderConfig: { codec: `vp09.${String(c[0]).padStart(2, '0')}.${String(c[1]).padStart(2, '0')}.${String(c[2] >> 4).padStart(2, '0')}`, codedWidth: v.width, codedHeight: v.height, colorSpace: { fullRange: !!(c[2] & 1) } } };
  }
  if (v.codec === 'av01') return { muxCodec: 'av1', decoderConfig: { codec: 'av01.0.08M.08', codedWidth: v.width, codedHeight: v.height } };
  throw new Error(`códec de video no admitido (${v.codec})`);
}

// Vuelve a empaquetar el video del MP4 con un audio nuevo:
// audio = { codec: 'aac' | 'opus', sampleRate, channels, description, chunks: [{ data, ts, dur }] } (ts y dur en microsegundos)
export function remuxWithAudio(buffer, audio) {
  const d = demux(buffer);
  const v = d.video;
  if (!v || !v.samples.length) throw new Error('no encontré la pista de video del MP4');
  const { muxCodec, decoderConfig } = videoDecoderConfig(v);
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: muxCodec, width: v.width, height: v.height },
    audio: { codec: audio.codec, numberOfChannels: audio.channels, sampleRate: audio.sampleRate },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });
  const us = (x) => Math.round((x / v.timescale) * 1e6);
  const t0 = v.samples[0].dts;
  v.samples.forEach((s, i) => {
    const data = d.u8.subarray(s.off, s.off + s.size);
    const meta = i === 0 ? { decoderConfig } : undefined;
    muxer.addVideoChunkRaw(data, s.key || i === 0 ? 'key' : 'delta', us(s.dts - t0 + s.cto), us(s.dur), meta, us(s.cto));
  });
  audio.chunks.forEach((c, i) => {
    const meta = i === 0 ? { decoderConfig: { codec: audio.codec === 'aac' ? 'mp4a.40.2' : 'opus', sampleRate: audio.sampleRate, numberOfChannels: audio.channels, ...(audio.description ? { description: audio.description } : {}) } } : undefined;
    muxer.addAudioChunkRaw(c.data, 'key', c.ts, c.dur, meta);
  });
  muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}

// Las muestras de audio de un MP4/M4A (las que graba MediaRecorder en iPhone) como chunks para remuxWithAudio
export function audioChunksFromMp4(buffer) {
  const d = demux(buffer);
  const a = d.audio;
  if (!a || !a.samples.length) throw new Error('la grabación no tiene audio');
  const us = (x) => Math.round((x / a.timescale) * 1e6);
  const t0 = a.samples[0].dts;
  const codec = a.codec === 'mp4a' ? 'aac' : a.codec === 'Opus' ? 'opus' : null;
  if (!codec) throw new Error(`códec de audio no admitido (${a.codec})`);
  return {
    codec, sampleRate: a.sampleRate || a.timescale, channels: a.channels || 2, description: a.config || undefined,
    chunks: a.samples.map((s) => ({ data: d.u8.slice(s.off, s.off + s.size), ts: us(s.dts - t0), dur: us(s.dur) })),
  };
}
