// Quita la pista de audio de un MP4 sin volver a codificar nada.
// Las cajas del audio (su 'trak' en 'moov', su 'trex' en 'mvex', sus 'traf' en cada 'moof' y su 'tfra')
// se convierten en cajas 'free' del mismo tamaño: así ningún desplazamiento cambia y el video queda intacto.
// Funciona con MP4 normales (WebCodecs + mp4-muxer) y fragmentados (MediaRecorder).

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'mvex', 'moof', 'traf', 'mfra', 'edts', 'minf', 'stbl']);

export function* boxes(u8, dv, start, end) {
  let p = start;
  while (p + 8 <= end) {
    let size = dv.getUint32(p);
    const type = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]);
    let header = 8;
    if (size === 1) { size = Number(dv.getBigUint64(p + 8)); header = 16; }
    else if (size === 0) size = end - p;
    if (size < header || p + size > end) return;
    yield { p, size, type, body: p + header, end: p + size };
    p += size;
  }
}
const markFree = (u8, b) => { u8[b.p + 4] = 0x66; u8[b.p + 5] = 0x72; u8[b.p + 6] = 0x65; u8[b.p + 7] = 0x65; }; // 'free'
export const find = (u8, dv, b, type) => { for (const c of boxes(u8, dv, b.body, b.end)) if (c.type === type) return c; return null; };

function trackInfo(u8, dv, trak) {
  const tkhd = find(u8, dv, trak, 'tkhd');
  const mdia = find(u8, dv, trak, 'mdia');
  const hdlr = mdia && find(u8, dv, mdia, 'hdlr');
  if (!tkhd || !hdlr) return null;
  const v = u8[tkhd.body];
  const id = dv.getUint32(tkhd.body + (v === 1 ? 20 : 12));
  const handler = String.fromCharCode(...u8.subarray(hdlr.body + 8, hdlr.body + 12));
  return { id, handler };
}

// Devuelve { data: Uint8Array (copia), removed: número de pistas de audio quitadas }
export function stripAudio(buffer) {
  const u8 = new Uint8Array(buffer.slice ? buffer.slice(0) : buffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const audioIds = new Set();
  // 1) pistas de audio en moov
  for (const top of boxes(u8, dv, 0, u8.length)) {
    if (top.type !== 'moov') continue;
    for (const b of boxes(u8, dv, top.body, top.end)) {
      if (b.type === 'trak') {
        const info = trackInfo(u8, dv, b);
        if (info && info.handler === 'soun') { audioIds.add(info.id); markFree(u8, b); }
      }
    }
  }
  if (!audioIds.size) return { data: u8, removed: 0 };
  // 2) referencias a esas pistas en mvex (trex), en cada moof (traf) y en mfra (tfra)
  const walk = (start, end) => {
    for (const b of boxes(u8, dv, start, end)) {
      if (b.type === 'trex' || b.type === 'tfra') { if (audioIds.has(dv.getUint32(b.body + 4))) markFree(u8, b); }
      else if (b.type === 'traf') {
        const tfhd = find(u8, dv, b, 'tfhd');
        if (tfhd && audioIds.has(dv.getUint32(tfhd.body + 4))) markFree(u8, b);
      } else if (CONTAINERS.has(b.type) && b.type !== 'trak') walk(b.body, b.end);
    }
  };
  walk(0, u8.length);
  return { data: u8, removed: audioIds.size };
}

// ---------------------------------------------------------------------------
// Inspección de un MP4 (para el Diagnóstico y para comprobar que la música quedó dentro):
// pistas, códec, duración, número de muestras y si el AAC trae su configuración (esds).
export function inspectMp4(buffer) {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const out = { size: u8.length, brand: '', fragmented: false, tracks: [] };
  const byId = {};
  const trexDur = {};
  for (const top of boxes(u8, dv, 0, u8.length)) {
    if (top.type === 'ftyp') out.brand = String.fromCharCode(...u8.subarray(top.body, top.body + 4));
    if (top.type === 'moov') {
      for (const b of boxes(u8, dv, top.body, top.end)) {
        if (b.type === 'mvex') {
          out.fragmented = true;
          for (const x of boxes(u8, dv, b.body, b.end)) if (x.type === 'trex') trexDur[dv.getUint32(x.body + 4)] = dv.getUint32(x.body + 12);
        }
        if (b.type !== 'trak') continue;
        const info = trackInfo(u8, dv, b);
        if (!info) continue;
        const t = { id: info.id, kind: info.handler === 'soun' ? 'audio' : info.handler === 'vide' ? 'video' : info.handler, codec: '', timescale: 0, seconds: 0, samples: 0, bytes: 0, esds: null, fragTicks: 0 };
        const mdia = find(u8, dv, b, 'mdia');
        const mdhd = mdia && find(u8, dv, mdia, 'mdhd');
        if (mdhd) {
          const v = u8[mdhd.body];
          t.timescale = dv.getUint32(mdhd.body + (v === 1 ? 20 : 12));
          const dur = v === 1 ? Number(dv.getBigUint64(mdhd.body + 24)) : dv.getUint32(mdhd.body + 16);
          t.seconds = t.timescale ? dur / t.timescale : 0;
        }
        const minf = mdia && find(u8, dv, mdia, 'minf');
        const stbl = minf && find(u8, dv, minf, 'stbl');
        if (stbl) {
          const stsd = find(u8, dv, stbl, 'stsd');
          if (stsd) {
            const e = stsd.body + 8;
            t.codec = String.fromCharCode(...u8.subarray(e + 4, e + 8));
            if (t.codec === 'mp4a') {
              const esize = dv.getUint32(e);
              for (const c of boxes(u8, dv, e + 36, Math.min(e + esize, stsd.end))) {
                if (c.type === 'esds') {
                  // busca el DecoderSpecificInfo (tag 0x05): la configuración AAC
                  let k = c.body + 4, cfg = 0;
                  while (k < c.end - 2) { if (u8[k] === 0x05) { let n = 0, j = k + 1, by; do { by = u8[j++]; n = (n << 7) | (by & 0x7f); } while (by & 0x80 && j < c.end); cfg = n; k = j; break; } k++; }
                  t.esds = { configBytes: cfg, config: cfg ? [...u8.subarray(k, k + Math.min(cfg, 24))].map((x) => x.toString(16).padStart(2, '0')).join(' ') : '' };
                }
              }
            }
          }
          const stsz = find(u8, dv, stbl, 'stsz');
          if (stsz) {
            t.samples = dv.getUint32(stsz.body + 8);
            const fixed = dv.getUint32(stsz.body + 4);
            if (fixed) t.bytes = fixed * t.samples;
            else for (let i = 0; i < t.samples && stsz.body + 12 + i * 4 + 4 <= stsz.end; i++) t.bytes += dv.getUint32(stsz.body + 12 + i * 4);
          }
        }
        out.tracks.push(t);
        byId[t.id] = t;
      }
    }
    if (top.type === 'moof') {
      for (const traf of boxes(u8, dv, top.body, top.end)) {
        if (traf.type !== 'traf') continue;
        const tfhd = find(u8, dv, traf, 'tfhd');
        const t = tfhd && byId[dv.getUint32(tfhd.body + 4)];
        if (!t) continue;
        // duración por defecto: tfhd (0x08) o trex
        const tf = dv.getUint32(tfhd.body) & 0xffffff;
        let q = tfhd.body + 8;
        if (tf & 0x01) q += 8;
        if (tf & 0x02) q += 4;
        const defDur = tf & 0x08 ? dv.getUint32(q) : trexDur[t.id] || 0;
        for (const c of boxes(u8, dv, traf.body, traf.end)) {
          if (c.type !== 'trun') continue;
          const fl = dv.getUint32(c.body) & 0xffffff, n = dv.getUint32(c.body + 4);
          t.samples += n;
          let k = c.body + 8 + (fl & 0x01 ? 4 : 0) + (fl & 0x04 ? 4 : 0);
          const per = ((fl & 0x100 ? 1 : 0) + (fl & 0x200 ? 1 : 0) + (fl & 0x400 ? 1 : 0) + (fl & 0x800 ? 1 : 0)) * 4;
          const k0 = k;
          if (fl & 0x100) for (let i = 0; i < n && k + 4 <= c.end; i++, k += per) t.fragTicks += dv.getUint32(k);
          else t.fragTicks += n * defDur;
          if (fl & 0x200) { const off = fl & 0x100 ? 4 : 0; for (let i = 0, q2 = k0 + off; i < n && q2 + 4 <= c.end; i++, q2 += per) t.bytes += dv.getUint32(q2); }
        }
      }
    }
  }
  // en MP4 fragmentados la duración sale de los fragmentos (moof/trun)
  for (const t of out.tracks) {
    if (out.fragmented && t.fragTicks && t.timescale) t.seconds = Math.max(t.seconds, t.fragTicks / t.timescale);
    delete t.fragTicks;
  }
  out.video = out.tracks.find((t) => t.kind === 'video') || null;
  out.audio = out.tracks.find((t) => t.kind === 'audio') || null;
  return out;
}
