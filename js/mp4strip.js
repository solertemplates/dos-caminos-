// Quita la pista de audio de un MP4 sin volver a codificar nada.
// Las cajas del audio (su 'trak' en 'moov', su 'trex' en 'mvex', sus 'traf' en cada 'moof' y su 'tfra')
// se convierten en cajas 'free' del mismo tamaño: así ningún desplazamiento cambia y el video queda intacto.
// Funciona con MP4 normales (WebCodecs + mp4-muxer) y fragmentados (MediaRecorder).

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'mvex', 'moof', 'traf', 'mfra', 'edts', 'minf', 'stbl']);

function* boxes(u8, dv, start, end) {
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
const find = (u8, dv, b, type) => { for (const c of boxes(u8, dv, b.body, b.end)) if (c.type === type) return c; return null; };

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
