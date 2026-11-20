// Dos Caminos — interfaz. Reglas en MAESTRO.md.
import { parseScripts } from './parser.js';
import { EXAMPLES } from './examples.js';
import { makeTimeline, layoutFor, makeStars, renderCover } from './render.js';
import { renderAudio } from './audio.js';
import { encodeVideo, unlockAudio, isIOS, audioCtx, encodeAudioOnly } from './encoder.js';
import { remuxWithAudio } from './remux.js';
import { settings, phrases, draft, counters, songs, videos, queue, persist } from './storage.js';
import { addSongFiles, pickSong, CATS, CAT_LABEL, INTENSITY, INTENSITY_LABEL, intensityOf, songOffset } from './music.js';
import { postText, NETWORKS } from './publish.js';
import { makeZip } from './zip.js';
import { CLAUDE_PROMPT } from './format.js';
import { pickFinal } from './finals.js';
import { stripAudio, inspectMp4 } from './mp4strip.js';

const $ = (s) => document.querySelector(s);
let S = settings.get();
let abort = null;
let running = false;
let wasHidden = false;

// ---------- cielo de estrellas de la interfaz ----------
(function sky() {
  const c = $('#sky'), x = c.getContext('2d');
  let stars = [];
  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * d; c.height = innerHeight * d;
    stars = Array.from({ length: 90 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: (0.4 + Math.random() * 1.1) * d, p: Math.random() * 6, s: 0.3 + Math.random() }));
  };
  size();
  addEventListener('resize', size);
  const draw = (t) => {
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = '#f4f2ec';
    for (const s of stars) { const k = 0.5 + 0.5 * Math.sin(t / 1000 * s.s + s.p); x.globalAlpha = 0.5 * k * k; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();

function toast(msg, ms = 2800) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), ms);
}
function open(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function close(id) { $(id).hidden = true; document.body.style.overflow = ''; }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { close('#' + b.closest('.sheet').id); refreshHome(); }));

// ---------- pantalla principal ----------
function seg(id, key, cast = (v) => v) {
  const el = $(id);
  const paint = () => el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(S[key]) === b.dataset.v));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S = settings.set({ [key]: cast(b.dataset.v) });
    paint();
    refreshHome();
  });
  paint();
}
seg('#durSeg', 'duration', Number);
seg('#langSeg', 'lang');

let parsed = { scripts: [], errors: [] };
let selected = new Set();
function reparse(keepSel = false) {
  const txt = draft.get();
  parsed = txt.trim() ? parseScripts(txt) : { scripts: [], errors: [] };
  if (!keepSel || selected.size > parsed.scripts.length) selected = new Set(parsed.scripts.map((_, i) => i));
}
reparse();

async function refreshHome() {
  const n = parsed.scripts.length, k = [...selected].filter((i) => i < n).length;
  $('#scriptCount').textContent = n ? (k === n ? `${n} ${n === 1 ? 'guion listo' : 'guiones listos'}` : `${k} de ${n} guiones seleccionados`) : 'Aún no hay guiones';
  $('#homeNote').textContent = k ? `Se crearán ${k} ${k === 1 ? 'video' : 'videos'} de ${S.duration} s en ${S.lang === 'en' ? 'inglés (Two Paths Stories)' : 'español'}.` : '';
  const q = queue.get();
  if (q && q.idx < q.items.length && !running) {
    $('#resumeText').textContent = `Quedaron ${q.items.length - q.idx} ${q.items.length - q.idx === 1 ? 'video' : 'videos'} por crear de la última tanda (${q.idx} ya ${q.idx === 1 ? 'está guardado' : 'están guardados'}).`;
    $('#resumeBox').hidden = false;
  } else $('#resumeBox').hidden = true;
  try {
    const c = await videos.count();
    $('#videoBadge').hidden = !c;
    $('#videoBadge').textContent = c > 99 ? '99+' : c;
  } catch (e) {}
}
refreshHome();

// ---------- Música: elegir canción y escuchar unos segundos ----------
async function fillSongSelect(sel, value) {
  const l = await songs.meta();
  sel.innerHTML = '';
  const add = (v, txt) => { const o = document.createElement('option'); o.value = v; o.textContent = txt; sel.appendChild(o); };
  add('random', l.length ? 'Aleatoria (nunca las fuertes)' : 'Aleatoria (música de la app)');
  for (const s of l) add(s.id, `${s.name} · ${INTENSITY_LABEL[intensityOf(s)]}`);
  sel.value = l.some((s) => s.id === value) ? value : 'random';
  return l;
}
async function paintMusicPick() {
  const l = await fillSongSelect($('#musicSel'), S.music);
  const v = $('#musicSel').value;
  const s = l.find((x) => x.id === v);
  $('#musicNote').textContent = !l.length ? 'Sin canciones en el banco: los videos llevan una música suave de la app. Súbelas en Ajustes → Banco de música.'
    : v === 'random' ? 'Aleatoria: elige según la emoción de cada guion y nunca usa las canciones «fuertes».'
    : s && intensityOf(s) === 'fuerte' ? 'Canción fuerte: se usa solo porque la elegiste. Todos los videos de la tanda la llevarán.'
    : 'Todos los videos de la tanda llevarán esta canción.';
}
$('#musicSel').addEventListener('change', () => { stopPreview(); S = settings.set({ music: $('#musicSel').value }); paintMusicPick(); });
paintMusicPick();

// ▶ escuchar ~10 s de la canción, desde donde empezaría en el video (Web Audio: suena también en iPhone tras leer el banco)
let preview = null;
function stopPreview() {
  if (!preview) return;
  try { preview.src.stop(); } catch (e) {}
  preview.btn.textContent = '▶'; preview.btn.classList.remove('on');
  preview = null;
}
async function playPreview(id, btn) {
  const same = preview && preview.btn === btn;
  stopPreview();
  if (same) return;
  if (!id || id === 'random') { toast('Elige una canción de la lista para escucharla.'); return; }
  unlockAudio(); // en el mismo toque
  const ac = audioCtx();
  if (!ac) return;
  btn.textContent = '…';
  try {
    const full = await songs.get(id);
    const buf = await ac.decodeAudioData(full.data.slice(0));
    const src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf; src.connect(g).connect(ac.destination);
    const t = ac.currentTime + 0.05, len = Math.min(10, buf.duration);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9, t + 0.3);
    g.gain.setValueAtTime(0.9, t + len - 0.8); g.gain.linearRampToValueAtTime(0.0001, t + len);
    src.start(t, songOffset(buf.duration, S.duration), len);
    preview = { src, btn };
    btn.textContent = '■'; btn.classList.add('on');
    src.onended = () => { if (preview && preview.src === src) stopPreview(); };
  } catch (e) { btn.textContent = '▶'; toast('No pude leer esa canción.'); }
}
$('#musicPlay').addEventListener('click', () => playPreview($('#musicSel').value, $('#musicPlay')));
$('#remusicPlay').addEventListener('click', () => playPreview($('#remusicSel').value, $('#remusicPlay')));
$('#remusicSel').addEventListener('change', stopPreview);

// ---------- pegar y elegir guiones ----------
const ta = $('#scriptsText');
const THEME_ES = { pareja: 'Pareja', familia: 'Familia', hijos: 'Hijos', dinero: 'Dinero', trabajo: 'Trabajo', amistad: 'Amistad', salud: 'Salud', movil: 'Móvil', constancia: 'Constancia', fe: 'Fe' };
function paintPicks() {
  const { scripts, errors } = parsed;
  const info = $('#parseInfo');
  info.className = 'hint' + (errors.length ? ' err' : '');
  info.textContent = (scripts.length ? `${scripts.length} ${scripts.length === 1 ? 'guion reconocido' : 'guiones reconocidos'}.` : ta.value.trim() ? 'No reconozco ningún guion. Revisa el formato en Ajustes.' : 'Pega aquí los guiones que te escribió Claude.') + (errors.length ? ' ' + errors.slice(0, 3).join(' ') : '');
  const ul = $('#scriptList');
  ul.innerHTML = '';
  scripts.forEach((sc, i) => {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selected.has(i);
    cb.addEventListener('change', () => { cb.checked ? selected.add(i) : selected.delete(i); paintCount(); });
    const tx = document.createElement('label');
    tx.className = 'pt';
    tx.innerHTML = '<b></b><span></span>';
    tx.querySelector('b').textContent = `${i + 1}. ${sc.title}`;
    tx.querySelector('span').textContent = `${THEME_ES[sc.theme] || sc.theme} · ` + (sc.layout === 'time' ? `${sc.stages.join(' → ')} · ${sc.sides[0].scene}` : `${sc.sides[0].title} / ${sc.sides[1].title}`);
    tx.addEventListener('click', () => { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
    li.append(cb, tx);
    ul.appendChild(li);
  });
  $('#pickHead').hidden = scripts.length < 2;
  $('#createBtns').hidden = !scripts.length;
  paintCount();
}
function paintCount() {
  const k = [...selected].filter((i) => i < parsed.scripts.length).length;
  $('#createSelected').textContent = `Crear seleccionados (${k})`;
  $('#createSelected').disabled = !k;
  $('#createAll').textContent = `Crear todos (${parsed.scripts.length})`;
}
function setText(v) { ta.value = v; draft.set(v); reparse(); paintPicks(); }
$('#openPaste').addEventListener('click', () => { ta.value = draft.get(); paintPicks(); open('#pasteSheet'); });
ta.addEventListener('input', () => { draft.set(ta.value); reparse(); paintPicks(); });
$('#pasteClip').addEventListener('click', async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (!t.trim()) return toast('El portapapeles está vacío.');
    setText(ta.value.trim() ? ta.value.trim() + '\n---\n' + t : t);
  } catch (e) { toast('Mantén pulsado el cuadro y elige «Pegar».'); ta.focus(); }
});
$('#loadExamples').addEventListener('click', () => { setText(ta.value.trim() ? ta.value.trim() + '\n---\n' + EXAMPLES : EXAMPLES); toast('Guion de ejemplo del puente añadido.'); });
$('#clearScripts').addEventListener('click', () => { if (!ta.value || confirm('¿Borrar todos los guiones pegados?')) setText(''); });
$('#pickAll').addEventListener('click', () => { selected = new Set(parsed.scripts.map((_, i) => i)); paintPicks(); });
$('#pickNone').addEventListener('click', () => { selected = new Set(); paintPicks(); });
$('#createSelected').addEventListener('click', () => { const l = parsed.scripts.filter((_, i) => selected.has(i)); if (l.length) { close('#pasteSheet'); startBatch(l); } });
$('#createAll').addEventListener('click', () => { if (parsed.scripts.length) { close('#pasteSheet'); startBatch(parsed.scripts); } });
$('#create').addEventListener('click', () => {
  const l = parsed.scripts.filter((_, i) => selected.has(i));
  if (!l.length) {
    if (!confirm('No hay guiones seleccionados. ¿Crear un video de prueba con el ejemplo del puente?')) return;
    return startBatch(parseScripts(EXAMPLES).scripts.slice(0, 1));
  }
  startBatch(l);
});

// ---------- creación (con tanda que se retoma) ----------
function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
}

function buildJob(script, idx, opts) {
  const lang = opts.lang;
  const en = lang === 'en';
  const E = script.en || {};
  const isTime = script.layout === 'time';
  const defQ = isTime ? (en ? 'Where do you want to be a year from now?' : '¿Dónde quieres estar dentro de un año?') : en ? 'Which one are you?' : '¿Cuál de los dos eres tú?';
  // Frase final = el TITULO del guion (TITULO_EN en inglés), para que nunca se repita.
  // Sin título: una frase de reserva que no se repite dentro del lote (se guarda con el lote).
  const hasTitle = script.hasTitle ?? !!script.title;
  const ownTitle = (en ? E.title : hasTitle ? script.title : '') || '';
  opts.finals = opts.finals || {};
  opts.usedFinals = opts.usedFinals || [];
  if (!((en ? E.phrase : script.phrase) || '').trim() && !ownTitle.trim() && !opts.finals[idx]) opts.finals[idx] = pickFinal(lang, opts.usedFinals);
  // FRASE (tal cual, con sus *palabras en rojo*) > TITULO > frase de reserva
  const frase = ((en ? E.phrase : script.phrase) || '').trim();
  const phrase = frase || ownTitle.trim() || opts.finals[idx];
  const signature = '';
  const sideTexts = isTime
    ? (en ? E.stages : script.stages).map((lbl) => ({ title: lbl, sub: (en && E.sides?.[0]?.sub) || script.sides[0].sub }))
    : script.sides.map((sd, i) => (en && E.sides?.[i]) || { title: sd.title, sub: sd.sub });
  const layoutKind = opts.layoutKind || (isTime ? 'time' : S.layout === 'auto' ? script.layout || (idx % 3 === 2 ? 'lr' : 'ab') : S.layout);
  const tl = makeTimeline(opts.duration);
  const seed = opts.seed ?? (Date.now() + idx * 977) % 100000;
  return {
    tl, seed, layoutKind, lang,
    layout: layoutFor(layoutKind),
    stars: makeStars(seed),
    sides: script.sides,
    emotion: script.emotion,
    texts: {
      hook: (en ? E.hook : script.hook) || '',
      phrase,
      postPhrase: frase.replace(/\*/g, ''),
      question: (en ? E.question : script.question) || defQ,
      signature,
      sides: sideTexts,
    },
    title: ownTitle.trim() || phrase.replace(/\*/g, ''),
  };
}

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => (wakeLock = null)); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) wasHidden = true;
  else if (running) keepAwake(true);
});

async function makeOne(sc, idx, opts) {
  const job = buildJob(sc, idx, opts);
  const D = opts.duration;
  const song = await pickSong(sc.emotion, opts.music || 'random');
  const audio = await renderAudio({ job, D, musicData: song?.data, sfxOn: S.sfx, sfxVol: S.sfxVol, musicVol: S.musicVol });
  const enc = (force) => encodeVideo({
    canvas: $('#stage'), job, audio, D, scale: S.quality, signal: abort.signal, force,
    onProgress: (k) => { $('#progBar').style.width = `${((idx + k) / opts.total) * 100}%`; },
  });
  // En iPhone se graba en tiempo real mientras se investiga por qué el método rápido sale mudo
  // (Ajustes → Diagnóstico → «Método en iPhone» permite probar el rápido).
  const iosForced = isIOS() && S.iosMethod !== 'fast';
  let out = await enc(iosForced ? 'realtime' : undefined);
  let mp4 = await inspectOut(out);
  let heard = await hearMp4(out);
  const encDiag = [...out.diag.tried];
  // comprobación final dentro del archivo: si el MP4 no trae la música entera, se rehace en tiempo real
  const mixLoud = (audio.__info?.whole?.rms || 0) > 0.01;
  const mute = (h) => h && h.decoded && mixLoud && h.whole.rms < 0.002;
  if (out.method === 'webcodecs' && (!audioOk(mp4, D) || mute(heard)) && out.diag.support.mediaRecorder) {
    encDiag.push({ method: 'comprobación del MP4', ok: false, error: !audioOk(mp4, D) ? (mp4 ? `audio en el MP4: ${mp4.tracks.find((t) => t.kind === 'audio') ? 'incompleto' : 'ninguno'}` : 'no se pudo leer el MP4') : 'el audio del MP4 se oye en silencio' });
    const out2 = await enc('realtime');
    encDiag.push(...out2.diag.tried);
    out = out2; mp4 = await inspectOut(out2); heard = await hearMp4(out2);
  }
  saveDiag({
    when: new Date().toISOString(), title: job.title, duration: D, lang: opts.lang,
    device: deviceInfo(), support: out.diag.support, method: out.method, iosForced, tries: encDiag, heard,
    song: song ? { name: song.name, category: song.category || '', ...(audio.__info?.song || {}) } : { name: '(ninguna en el banco: música propia de la app)' },
    mix: audio.__info ? { firstSecond: audio.__info.firstSecond, whole: audio.__info.whole } : null,
    file: { mime: out.mime, ext: out.ext, size: out.blob.size, mp4 },
    audioOk: audioOk(mp4, D) && !mute(heard), retried: wasHidden && !!out.realtime,
  });
  if ((mp4 && !audioOk(mp4, D)) || mute(heard)) toast('Aviso: este video salió sin música completa. Mira Ajustes → Diagnóstico.', 5000);
  // portada (la misma imagen que el fotograma 0 del MP4) para la tarjeta y «Descargar portada»
  let cover = null;
  try { cover = await coverImage(job); } catch (e) { console.warn('portada', e); }
  const n = counters.next('videos');
  const v = { title: job.title, phrase: job.texts.postPhrase, question: job.texts.question, theme: sc.theme, lang: opts.lang, star: S.starNote && n % 4 === 0 };
  const texts = Object.fromEntries(NETWORKS.map((nw) => [nw.id, postText(nw.id, v)]));
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    id, created: Date.now(), title: job.title, theme: sc.theme, lang: opts.lang, duration: D,
    name: `${opts.lang === 'en' ? 'two-paths' : 'dos-caminos'}-${slug(job.title)}-${id.slice(-4)}.${out.ext}`,
    mime: out.mime, ext: out.ext, blob: out.blob, realtime: !!out.realtime, size: out.blob.size, song: song?.name || '', songId: song?.id || '', texts, posted: {},
    coverBuf: cover ? await cover.arrayBuffer() : null, coverType: 'image/jpeg',
    // receta para rehacer el audio (música + efectos) sin volver a dibujar el video
    recipe: { script: sc, idx, opts: { duration: D, lang: opts.lang, total: opts.total, finals: opts.finals || {} }, seed: job.seed, layoutKind: job.layoutKind },
  };
}

// ---------- Portada ----------
// Se guarda como ArrayBuffer (algunos Safari no guardan Blob en IndexedDB).
async function coverImage(job) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1920;
  renderCover(c.getContext('2d', { alpha: false }), job, 1);
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  c.width = c.height = 1; // libera memoria en iPhone
  if (!blob) throw new Error('no se pudo crear la imagen');
  return blob;
}
// videos de antes sin portada: si guardaron su receta, se dibuja ahora
async function ensureCover(rec) {
  if (rec.coverBuf || !rec.recipe) return rec.coverBuf || null;
  const job = buildJob(rec.recipe.script, rec.recipe.idx, { ...rec.recipe.opts, seed: rec.recipe.seed, layoutKind: rec.recipe.layoutKind });
  const buf = await (await coverImage(job)).arrayBuffer();
  rec.coverBuf = buf; rec.coverType = 'image/jpeg';
  await videos.update(rec.id, { coverBuf: buf, coverType: 'image/jpeg' });
  return buf;
}
const coverFileOf = (rec) => new File([rec.coverBuf], rec.name.replace(/\.\w+$/, '-portada.jpg'), { type: rec.coverType || 'image/jpeg' });

// ---------- Mis videos: cambiar la música sin volver a crear el video ----------
let remusicRec = null;
async function openRemusic(rec) {
  remusicRec = rec;
  stopPreview();
  $('#remusicTitle').textContent = `«${rec.title}» · ahora: ${rec.song ? '♪ ' + rec.song : 'música de la app'}`;
  await fillSongSelect($('#remusicSel'), rec.songId || 'random');
  $('#remusicStatus').textContent = rec.ext !== 'mp4' ? 'Este video no es MP4: no se le puede cambiar la música.'
    : rec.recipe ? 'Solo cambia el audio: el dibujo queda igual. Los efectos de sonido se mantienen.'
    : 'Este video se creó antes de esta función: la música nueva irá sin efectos de sonido.';
  $('#remusicGo').disabled = rec.ext !== 'mp4';
  open('#remusicSheet');
}
$('#remusicGo').addEventListener('click', async () => {
  const rec = remusicRec;
  if (!rec) return;
  unlockAudio(); // en el mismo toque (iPhone graba la música nueva en tiempo real)
  stopPreview();
  const btn = $('#remusicGo'), st = $('#remusicStatus');
  btn.disabled = true;
  keepAwake(true);
  const info = { when: new Date().toISOString(), title: rec.title };
  try {
    const D = rec.duration;
    const job = rec.recipe ? buildJob(rec.recipe.script, rec.recipe.idx, { ...rec.recipe.opts, seed: rec.recipe.seed, layoutKind: rec.recipe.layoutKind }) : { emotion: 'emotiva' };
    const song = await pickSong(rec.recipe?.script?.emotion || 'emotiva', $('#remusicSel').value);
    st.textContent = 'Preparando la música nueva…';
    const audio = await renderAudio({ job, D, musicData: song?.data, sfxOn: !!rec.recipe && S.sfx, sfxVol: S.sfxVol, musicVol: S.musicVol });
    const realtime = isIOS() && S.iosMethod !== 'fast';
    if (realtime) st.textContent = `Grabando la música nueva (${D} s)… deja la pantalla encendida.`;
    const a = await encodeAudioOnly(audio, { realtime, onProgress: (k) => { if (realtime) st.textContent = `Grabando la música nueva… ${Math.round(k * 100)} %`; } });
    info.audio = { method: a.method, codec: a.codec, chunks: a.chunks.length };
    st.textContent = 'Uniendo la música al video…';
    const src = rec.blob || new Blob([rec.buf], { type: rec.mime });
    const blob = remuxWithAudio(await src.arrayBuffer(), a);
    // comprobación: la música nueva está dentro y suena
    const out = { blob, ext: 'mp4' };
    const mp4 = await inspectOut(out), heard = await hearMp4(out);
    info.mp4 = mp4; info.heard = heard; info.song = song?.name || '(música de la app)';
    const silent = heard && heard.decoded && heard.whole.rms < 0.002 && (audio.__info?.whole?.rms || 0) > 0.01;
    if (!audioOk(mp4, D) || silent) throw new Error(silent ? 'la música nueva sale en silencio' : 'la música nueva no quedó completa en el MP4');
    const name = rec.name.replace(/\.\w+$/, '.mp4');
    await saveVideo({ ...rec, blob, buf: null, size: blob.size, mime: 'video/mp4', ext: 'mp4', name, song: song?.name || '', songId: song?.id || '', saved: false, savedMute: false });
    info.ok = true;
    close('#remusicSheet');
    toast('Música cambiada. Descárgalo otra vez para guardarlo en Fotos.', 4000);
    showVideos(new Set([rec.id]));
  } catch (e) {
    console.error(e);
    info.ok = false; info.error = `${e.name}: ${e.message}`;
    st.textContent = `No pude cambiar la música: ${e.message}. El video sigue como estaba.`;
  } finally {
    try { localStorage.setItem('dc.diagRemusic', JSON.stringify(info)); } catch (e) {}
    btn.disabled = false;
    if (!running) keepAwake(false);
  }
});

// ---------- Diagnóstico ----------
async function inspectOut(out) {
  if (out.ext !== 'mp4') return null;
  try { const m = inspectMp4(await out.blob.arrayBuffer()); return { brand: m.brand, fragmented: m.fragmented, tracks: m.tracks }; }
  catch (e) { return { error: `${e.name}: ${e.message}`, tracks: [] }; }
}
// Escucha el MP4 terminado: lo decodifica como lo haría Fotos y mide si de verdad suena.
async function hearMp4(out) {
  try {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ac = new OAC(2, 48000, 48000);
    const buf = await ac.decodeAudioData(await out.blob.arrayBuffer());
    const ch = buf.getChannelData(0), sr = buf.sampleRate;
    const lvl = (a, b) => { let s = 0, pk = 0; const i0 = Math.floor(a * sr), i1 = Math.min(ch.length, Math.floor(b * sr)); for (let i = i0; i < i1; i++) { s += ch[i] * ch[i]; pk = Math.max(pk, Math.abs(ch[i])); } return { rms: +Math.sqrt(s / Math.max(1, i1 - i0)).toFixed(3), peak: +pk.toFixed(3) }; };
    return { decoded: true, seconds: +buf.duration.toFixed(1), firstSecond: lvl(0, 1), whole: lvl(0, buf.duration) };
  } catch (e) { return { decoded: false, error: `${e.name}: ${e.message}` }; }
}
function audioOk(mp4, D) {
  if (!mp4) return null; // webm: no se puede comprobar
  const a = (mp4.tracks || []).find((t) => t.kind === 'audio');
  return !!(a && a.samples > 0 && a.seconds >= D * 0.9);
}
function deviceInfo() {
  const ua = navigator.userAgent;
  const ios = (ua.match(/OS (\d+)[_.](\d+)(?:[_.](\d+))? like Mac OS X/) || []).slice(1).filter(Boolean).join('.');
  const safari = (ua.match(/Version\/([\d.]+)/) || [])[1] || '';
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return { ios: ios || (ipad ? 'iPadOS (ver Safari)' : ''), safari, standalone: !!(navigator.standalone || matchMedia('(display-mode: standalone)').matches), ua, canShareFiles: !!(navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([new Uint8Array(8)], 'x.mp4', { type: 'video/mp4' })] }); } catch (e) { return false; } })()) };
}
function saveDiag(d) { try { localStorage.setItem('dc.diag', JSON.stringify(d)); } catch (e) {} }
function logShare(kind, file, result, copied) {
  try {
    let prev = {};
    try { prev = JSON.parse(localStorage.getItem('dc.diagShare') || '{}'); } catch (e) {}
    localStorage.setItem('dc.diagShare', JSON.stringify({ when: new Date().toISOString(), kind, name: file?.name, type: file?.type, size: file?.size,
      canShare: !!(navigator.canShare && file && navigator.canShare({ files: [file] })), result, copied, copies: prev.copies || [] }));
  } catch (e) {}
}
const yes = (b) => (b === null || b === undefined ? '—' : b ? 'sí' : 'NO');
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
function diagText() {
  let d = null, s = null;
  try { d = JSON.parse(localStorage.getItem('dc.diag') || 'null'); s = JSON.parse(localStorage.getItem('dc.diagShare') || 'null'); } catch (e) {}
  const L = [];
  const dev = d?.device || deviceInfo();
  L.push('DOS CAMINOS — DIAGNÓSTICO', `App: ${APP_VERSION}`);
  L.push(`iOS: ${dev.ios || '(no es iPhone)'} · Safari: ${dev.safari || '—'} · ${dev.standalone ? 'app en pantalla de inicio' : 'en Safari'}`);
  L.push(`Menú compartir con archivos: ${yes(dev.canShareFiles)}`);
  if (!d) { L.push('', 'Todavía no hay datos: crea un video y vuelve aquí.'); }
  else {
    const f = d.file || {}, m = f.mp4;
    const a = m?.tracks?.find((t) => t.kind === 'audio'), v = m?.tracks?.find((t) => t.kind === 'video');
    L.push('', `ÚLTIMO VIDEO: «${d.title}» (${d.duration} s) · ${new Date(d.when).toLocaleString()}`);
    L.push(`¿Tiene música dentro?: ${d.audioOk === null ? 'no se puede comprobar (WebM)' : d.audioOk ? 'SÍ' : 'NO'}`);
    const h = d.heard;
    if (h) L.push(h.decoded ? `¿Suena al reproducirlo?: ${h.whole.rms < 0.002 ? 'NO, SILENCIO' : 'SÍ'} (volumen leído del MP4: primer segundo ${h.firstSecond.rms}, pico ${h.firstSecond.peak} · todo ${h.whole.rms} · ${h.seconds} s)` : `¿Suena al reproducirlo?: no se pudo leer el audio del MP4 (${h.error})`);
    if (d.iosForced) L.push('Método en iPhone: tiempo real (prueba segura, puesto en Ajustes)');
    L.push(`Formato: ${f.mime} · ${mb(f.size || 0)}${m ? ` · ${m.fragmented ? 'MP4 fragmentado' : 'MP4 normal'} (${m.brand})` : ''}`);
    if (v) L.push(`Pista de video: ${v.codec} · ${v.seconds.toFixed(1)} s · ${v.samples} fotogramas`);
    L.push(a ? `Pista de audio: ${a.codec} · ${a.seconds.toFixed(1)} s · ${a.samples} bloques${a.bytes ? ` · ${Math.round(a.bytes / 1024)} KB (${Math.round(a.bytes / Math.max(1, a.samples))} bytes por bloque)` : ''}${a.esds ? ` · configuración AAC: ${a.esds.configBytes ? `${a.esds.configBytes} bytes [${a.esds.config}]` : 'FALTA'}` : ''}` : 'Pista de audio: NINGUNA');
    if (m?.error) L.push(`Error al leer el MP4: ${m.error}`);
    L.push(`Método usado: ${d.method === 'webcodecs' ? 'rápido (WebCodecs)' : 'tiempo real (MediaRecorder)'}`);
    for (const t of d.tries || []) {
      const extra = Object.entries(t).filter(([k]) => !['method', 'ok', 'error'].includes(k)).map(([k, x]) => `${k}=${x}`).join(', ');
      L.push(` · ${t.method}: ${t.ok ? 'bien' : 'falló'}${t.error ? ` — ${t.error}` : ''}${extra ? ` (${extra})` : ''}`);
    }
    const sp = d.support || {};
    L.push(`Soporte: WebCodecs ${yes(sp.webcodecs)} (${sp.videoCodec || '—'}) · MediaRecorder ${sp.mediaRecorder || 'NO'}`);
    const sg = d.song || {};
    L.push(`Canción: ${sg.name || '—'}${sg.category ? ` [${sg.category}]` : ''}${sg.decoded === false ? ` · NO SE PUDO LEER: ${sg.error}` : sg.decoded ? ` · leída (${sg.seconds} s, empieza en ${sg.startAt} s)` : ''}`);
    if (d.mix) L.push(`Volumen de la mezcla: primer segundo ${d.mix.firstSecond.rms} (pico ${d.mix.firstSecond.peak}) · todo ${d.mix.whole.rms}${d.mix.whole.peak < 0.01 ? ' · ¡MEZCLA EN SILENCIO!' : ''}`);
  }
  if (s) {
    L.push('', `ÚLTIMO «DESCARGAR»: ${s.kind} · ${new Date(s.when).toLocaleString()}`);
    L.push(`Archivo: ${s.name} · ${s.type} · ${mb(s.size || 0)} · menú compartir disponible: ${yes(s.canShare)}`);
    L.push(`Resultado: ${s.result}`);
    if (s.copied !== undefined && s.copied !== null) L.push(`Texto copiado antes del menú: ${yes(s.copied)}`);
    for (const c of s.copies || []) L.push(` · ${c}`);
  }
  let rmx = null;
  try { rmx = JSON.parse(localStorage.getItem('dc.diagRemusic') || 'null'); } catch (e) {}
  if (rmx) {
    const ra = rmx.mp4?.tracks?.find((t) => t.kind === 'audio');
    L.push('', `ÚLTIMO «CAMBIAR MÚSICA»: «${rmx.title}» · ${new Date(rmx.when).toLocaleString()} · ${rmx.ok ? 'bien' : 'falló'}`);
    if (rmx.song) L.push(`Canción: ${rmx.song} · audio ${rmx.audio ? `${rmx.audio.method} (${rmx.audio.codec}, ${rmx.audio.chunks} bloques)` : '—'}`);
    if (ra) L.push(`Pista de audio nueva: ${ra.codec} · ${ra.seconds.toFixed(1)} s${rmx.heard?.decoded ? ` · suena: ${rmx.heard.whole.rms < 0.002 ? 'NO' : 'SÍ'} (${rmx.heard.whole.rms})` : ''}`);
    if (rmx.error) L.push(`Error: ${rmx.error}`);
  }
  L.push('', `Navegador: ${dev.ua}`);
  return L.join('\n');
}
const APP_VERSION = 'v26';
$('#diagShow').addEventListener('click', () => { const p = $('#diagOut'); p.textContent = diagText(); p.hidden = false; $('#diagCopy').hidden = false; });
$('#diagCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(diagText()); toast('Diagnóstico copiado. Pégalo en el chat.'); }
  catch (e) { toast('No pude copiar. Mantén pulsado el texto para seleccionarlo.'); }
});

async function saveVideo(rec) {
  try { await videos.put(rec); }
  catch (e) {
    // algunos Safari antiguos no guardan Blob en IndexedDB: se guarda como ArrayBuffer
    const buf = await rec.blob.arrayBuffer();
    await videos.put({ ...rec, blob: null, buf });
  }
}

function startBatch(scripts) {
  unlockAudio(); // en el mismo toque, para que iPhone deje grabar la música
  const q = queue.get();
  if (q && q.idx < q.items.length && !confirm('Hay una tanda sin terminar. ¿Empezar una nueva y descartarla?')) return;
  queue.set({ items: scripts, idx: 0, opts: { duration: S.duration, lang: S.lang, total: scripts.length, music: S.music || 'random' }, ids: [] });
  runQueue();
}

async function runQueue() {
  const q = queue.get();
  if (!q || running) return;
  running = true;
  persist();
  keepAwake(true);
  abort = new AbortController();
  $('#resumeBox').hidden = true;
  open('#progressSheet');
  let failed = 0, tries = 0;
  while (q.idx < q.items.length && !abort.signal.aborted) {
    const sc = q.items[q.idx];
    $('#progText').textContent = `Video ${q.idx + 1} de ${q.items.length} · ${sc.title}`;
    $('#progBar').style.width = `${(q.idx / q.items.length) * 100}%`;
    wasHidden = false;
    try {
      const rec = await makeOne(sc, q.idx, q.opts);
      // si la pantalla se bloqueó durante una grabación en tiempo real, el video puede salir cortado: se repite
      if (wasHidden && rec.realtime && tries < 2) { tries++; continue; }
      await saveVideo(rec);
      q.ids.push(rec.id);
    } catch (e) {
      if (e.name === 'AbortError' || abort.signal.aborted) break;
      console.error(e);
      if (tries < 2) { tries++; continue; }
      failed++;
      toast(`No pude crear «${sc.title}»: ${e.message}`, 4000);
    }
    tries = 0;
    q.idx++;
    queue.set(q);
    refreshHome();
  }
  running = false;
  keepAwake(false);
  close('#progressSheet');
  const done = q.idx >= q.items.length;
  if (done || abort.signal.aborted) queue.clear();
  if (q.ids.length) showVideos(new Set(q.ids));
  else if (!abort.signal.aborted) toast('No se creó ningún video.' + (failed ? ' Revisa que Safari esté actualizado.' : ''));
  refreshHome();
}
$('#cancel').addEventListener('click', () => { if (confirm('¿Detener la tanda? Los videos ya terminados quedan guardados en «Mis videos».')) abort?.abort(); });
$('#resumeGo').addEventListener('click', () => { unlockAudio(); runQueue(); });
$('#resumeDrop').addEventListener('click', () => { if (confirm('¿Descartar los videos que faltaban por crear?')) { queue.clear(); refreshHome(); } });

// ---------- Mis videos ----------
function fileOf(rec) {
  const blob = rec.blob || new Blob([rec.buf], { type: rec.mime });
  return new File([blob], rec.name, { type: rec.mime });
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
// Comparte sin esperas previas, para que iPhone no pierda el permiso del toque.
// ---------- Copiar el texto para publicar (pensado para Safari de iPhone) ----------
// En iPhone el portapapeles solo se puede escribir dentro de un toque. navigator.clipboard.writeText es asíncrono
// y se puede perder si justo después se abre el menú compartir; por eso primero se copia de forma SÍNCRONA
// (textarea + execCommand('copy')) en el mismo toque, y además con writeText.
function copySync(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  const sel = document.getSelection();
  const prev = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (prev && sel) { sel.removeAllRanges(); sel.addRange(prev); }
  return ok;
}
const copiedMsg = (label) => `Texto copiado. En ${label || 'la app'}, mantén el dedo en el cuadro y toca Pegar.`;
// copia en el mismo toque (no esperar nada antes de llamarla)
function copyNow(text) {
  const ok = copySync(text);
  let p = Promise.resolve(false);
  try { if (navigator.clipboard?.writeText) p = navigator.clipboard.writeText(text).then(() => true, () => false); } catch (e) {}
  return { ok, later: p };
}
// texto pendiente: se vuelve a copiar después de cerrar el menú compartir y al volver a la app
let pendingCopy = null;
function rememberCopy(text, label) { pendingCopy = { text, label, until: Date.now() + 15 * 60e3, need: false }; }
async function recopy(reason) {
  const pc = pendingCopy;
  if (!pc || Date.now() > pc.until) { pendingCopy = null; hideCopyBanner(); return; }
  let ok = false;
  try { await navigator.clipboard.writeText(pc.text); ok = true; } catch (e) {}
  logCopy(reason, ok);
  if (ok) { pc.need = false; hideCopyBanner(); if (reason === 'al volver') toast(copiedMsg(pc.label), 4500); }
  else { pc.need = true; showCopyBanner(pc.label); } // iPhone no deja copiar sin un toque: el siguiente toque lo copia
}
function showCopyBanner(label) {
  let b = document.getElementById('copyBanner');
  if (!b) {
    b = document.createElement('button');
    b.id = 'copyBanner';
    b.type = 'button';
    document.body.appendChild(b);
  }
  b.textContent = `Toca aquí para copiar otra vez el texto de ${label || 'la publicación'}`;
  b.hidden = false;
  const t = document.getElementById('toast'); if (t) t.hidden = true; // que no diga «copiado» a la vez
}
function hideCopyBanner() { const b = document.getElementById('copyBanner'); if (b) b.hidden = true; }
// el siguiente toque en cualquier sitio de la app vuelve a copiar el texto (iPhone sí lo permite dentro de un toque)
document.addEventListener('touchend', onAnyTap, true);
document.addEventListener('click', onAnyTap, true);
function onAnyTap() {
  const pc = pendingCopy;
  if (!pc || !pc.need) return;
  if (Date.now() > pc.until) { pendingCopy = null; hideCopyBanner(); return; }
  const r = copyNow(pc.text);
  pc.need = false;
  hideCopyBanner();
  logCopy('toque al volver', r.ok);
  toast(copiedMsg(pc.label), 4500);
}
// al volver a la app (desde Facebook, Instagram…): se copia otra vez
document.addEventListener('visibilitychange', () => { if (!document.hidden && pendingCopy) recopy('al volver'); });
window.addEventListener('pageshow', () => { if (pendingCopy) recopy('al volver'); });
function logCopy(when, ok) {
  try {
    const d = JSON.parse(localStorage.getItem('dc.diagShare') || '{}');
    d.copies = [...(d.copies || []).slice(-5), `${new Date().toLocaleTimeString()} ${when}: ${ok ? 'copiado' : 'iPhone no dejó copiar (se copia con el siguiente toque)'}`];
    localStorage.setItem('dc.diagShare', JSON.stringify(d));
  } catch (e) {}
}

async function shareFiles(files, text, label) {
  // 1) copiar el texto ANTES, en el mismo toque y de forma síncrona
  let copied = null;
  if (text) { copied = copyNow(text); rememberCopy(text, label); }
  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({ files });
      logShare('compartir', files[0], 'menú abierto y elegido', copied?.ok);
      if (text) recopy('después del menú'); // 2) y otra vez DESPUÉS de cerrar el menú compartir
      return true;
    } catch (e) {
      logShare('compartir', files[0], `${e.name}: ${e.message}`, copied?.ok);
      if (text) recopy('después del menú');
      if (e.name === 'AbortError') return false;
    }
  } else logShare('compartir', files[0], 'el menú compartir no acepta el archivo: se descargó', copied?.ok);
  for (const f of files) download(f, f.name);
  return true;
}
// Guardar en Fotos: abre el menú compartir del iPhone solo con el MP4 (sin texto),
// así aparece «Guardar video». Se llama sin esperas previas para no perder el permiso del toque.
async function saveToPhotos(file, kind = 'video') {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    toast(kind === 'imagen' ? 'En el menú, elige «Guardar imagen» para guardarla en Fotos.' : 'En el menú, elige «Guardar video» para guardarlo en Fotos.', 4500);
    try { await navigator.share({ files: [file] }); logShare('guardar en Fotos', file, 'menú abierto y se eligió una opción'); return true; }
    catch (e) {
      logShare('guardar en Fotos', file, e.name === 'AbortError' ? 'menú cerrado sin elegir (o iOS lo canceló)' : `${e.name}: ${e.message}`);
      if (e.name === 'AbortError') return false; if (e.name === 'NotAllowedError') throw e;
    }
  } else logShare('guardar en Fotos', file, 'el menú compartir no acepta el archivo: se descargó a Archivos');
  download(file, file.name);
  toast(kind === 'imagen' ? 'Portada descargada.' : 'Video descargado.');
  return true;
}
const allTexts = (list) => list.map((r, i) => `#${i + 1} ${r.title} (${r.name})\n\n` + NETWORKS.map((n) => `— ${n.label} —\n${r.texts[n.id]}`).join('\n\n')).join('\n\n==========\n\n');

let shown = [];
let urls = [];
let picked = new Set();
function paintDelBar() {
  const n = [...picked].filter((id) => shown.some((r) => r.id === id)).length;
  $('#delBar').hidden = !shown.length;
  $('#delSelected').disabled = !n;
  $('#delSelected').textContent = n ? `Borrar seleccionados (${n})` : 'Borrar seleccionados';
}
async function showVideos(highlight = new Set()) {
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls = [];
  const list = await videos.all();
  shown = list;
  picked = new Set([...picked].filter((id) => list.some((r) => r.id === id)));
  const box = $('#videoList');
  box.innerHTML = '';
  $('#videosInfo').textContent = list.length ? `${list.length} ${list.length === 1 ? 'video guardado' : 'videos guardados'} en este teléfono. Cada botón de red copia el texto y abre el menú para publicar (el ✓ marca dónde ya lo publicaste). «Copiar texto» solo copia el texto de esa red: en la app, mantén el dedo en el cuadro y toca Pegar.` : 'Aún no hay videos. Pega guiones y pulsa «Crear videos».';
  $('#batchBtns').hidden = list.length < 2;
  for (const rec of list) {
    const file = fileOf(rec);
    const card = document.createElement('div');
    card.className = 'result' + (highlight.has(rec.id) ? ' new' : '');
    const thumb = document.createElement('button');
    thumb.className = 'vthumb';
    thumb.innerHTML = '<span class="vplay">▶  Ver video</span>';
    const showCover = (buf) => {
      if (!buf) return;
      const cu = URL.createObjectURL(new Blob([buf], { type: rec.coverType || 'image/jpeg' })); urls.push(cu);
      thumb.style.backgroundImage = `url("${cu}")`;
      thumb.classList.add('has-cover');
    };
    if (rec.coverBuf) showCover(rec.coverBuf);
    else if (rec.recipe) ensureCover(rec).then((b) => { showCover(b); dc.hidden = !b; }).catch((e) => console.warn('portada', e));
    thumb.addEventListener('click', () => {
      const v = document.createElement('video');
      v.playsInline = true; v.controls = true; v.autoplay = true; v.muted = false;
      const u = URL.createObjectURL(file); urls.push(u);
      v.src = u;
      v.className = 'vthumb';
      thumb.replaceWith(v);
    });
    const head = document.createElement('label');
    head.className = 'vhead';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = picked.has(rec.id);
    card.classList.toggle('sel', cb.checked);
    cb.addEventListener('change', () => { cb.checked ? picked.add(rec.id) : picked.delete(rec.id); card.classList.toggle('sel', cb.checked); paintDelBar(); });
    const h = document.createElement('h3');
    h.textContent = rec.title;
    head.append(cb, h);
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${new Date(rec.created).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${rec.duration} s · ${rec.lang === 'en' ? 'English' : 'Español'}${rec.song ? ' · ♪ ' + rec.song : ' · ♪ música de la app'}`;
    const nets = document.createElement('div');
    nets.className = 'nets';
    for (const n of NETWORKS) {
      const b = document.createElement('button');
      b.textContent = n.label;
      b.classList.toggle('done', !!rec.posted?.[n.id]);
      b.addEventListener('click', async () => {
        toast(copiedMsg(n.label), 4500);
        const ok = await shareFiles([file], rec.texts[n.id], n.label);
        if (ok) {
          rec.posted = { ...(rec.posted || {}), [n.id]: true };
          b.classList.add('done');
          videos.update(rec.id, { posted: rec.posted });
          toast(copiedMsg(n.label), 4500);
        }
      });
      nets.appendChild(b);
    }
    // botones grandes «Copiar texto» de cada red (aparte de compartir)
    const copies = document.createElement('div');
    copies.className = 'copies';
    for (const n of NETWORKS) {
      const c = document.createElement('button');
      c.type = 'button';
      c.innerHTML = `Copiar texto<small>${n.label}</small>`;
      c.addEventListener('click', () => {
        const r = copyNow(rec.texts[n.id]);
        rememberCopy(rec.texts[n.id], n.label);
        logCopy(`botón Copiar texto ${n.label}`, r.ok);
        r.later.then((ok2) => { if (!r.ok && !ok2) toast('No pude copiar. Abre «Ver textos para publicar» y copia a mano.', 4500); });
        toast(copiedMsg(n.label), 4500);
        c.classList.add('copied');
        setTimeout(() => c.classList.remove('copied'), 1500);
      });
      copies.appendChild(c);
    }
    const acts = document.createElement('div');
    acts.className = 'vacts';
    // Descargar con música: el MP4 tal cual (la canción va dentro)
    const dl = document.createElement('button');
    dl.className = 'dlv' + (rec.saved ? ' done' : '');
    dl.textContent = 'Descargar con música';
    dl.addEventListener('click', async () => {
      try { if (await saveToPhotos(file)) { rec.saved = true; dl.classList.add('done'); videos.update(rec.id, { saved: true }); } }
      catch (e) { toast('Toca otra vez para guardar el video.'); }
    });
    // Descargar sin música: el mismo MP4 sin pista de audio (para poner música en Instagram, TikTok o YouTube)
    const dlm = document.createElement('button');
    dlm.className = 'dlv mute' + (rec.savedMute ? ' done' : '');
    dlm.textContent = 'Descargar sin música';
    let muteFile = null;
    dlm.addEventListener('click', async () => {
      try {
        if (!muteFile) {
          const { data } = stripAudio(await file.arrayBuffer());
          muteFile = new File([data], rec.name.replace(/(\.\w+)$/, '-sin-musica$1'), { type: rec.mime });
        }
        if (await saveToPhotos(muteFile)) { rec.savedMute = true; dlm.classList.add('done'); dlm.textContent = 'Descargar sin música'; videos.update(rec.id, { savedMute: true }); }
      } catch (e) {
        // iPhone puede no abrir el menú si pasó tiempo desde el toque: el archivo ya está listo, basta tocar otra vez
        if (muteFile) { dlm.textContent = 'Sin música lista · toca para guardar'; toast('El video sin música está listo. Toca otra vez para guardarlo.'); }
        else toast('No pude preparar el video sin música.');
      }
    });
    const del = document.createElement('button'); del.textContent = 'Borrar';
    del.addEventListener('click', async () => { if (confirm(`¿Borrar «${rec.title}» del teléfono?`)) { await videos.del(rec.id); picked.delete(rec.id); showVideos(); refreshHome(); } });
    // Descargar portada: la imagen del fotograma 0, para subirla como miniatura (abre «Guardar imagen»)
    const dc = document.createElement('button');
    dc.className = 'dlv cover' + (rec.savedCover ? ' done' : '');
    dc.textContent = 'Descargar portada';
    dc.hidden = !rec.coverBuf && !rec.recipe;
    dc.addEventListener('click', async () => {
      if (!rec.coverBuf) { toast('Preparando la portada… toca otra vez en un momento.'); ensureCover(rec).catch(() => toast('No pude crear la portada.')); return; }
      try { if (await saveToPhotos(coverFileOf(rec), 'imagen')) { rec.savedCover = true; dc.classList.add('done'); videos.update(rec.id, { savedCover: true }); } }
      catch (e) { toast('Toca otra vez para guardar la portada.'); }
    });
    const rm = document.createElement('button'); rm.textContent = 'Cambiar música';
    rm.addEventListener('click', () => openRemusic(rec));
    acts.append(dl, dlm, dc, rm, del);
    const det = document.createElement('details');
    det.innerHTML = '<summary>Ver textos para publicar</summary><pre></pre>';
    det.querySelector('pre').textContent = NETWORKS.map((n) => `— ${n.label} —\n${rec.texts[n.id]}`).join('\n\n');
    const un = document.createElement('button');
    un.className = 'text-btn small';
    un.textContent = 'Quitar las marcas ✓';
    un.addEventListener('click', () => { rec.posted = {}; videos.update(rec.id, { posted: {} }); nets.querySelectorAll('button').forEach((x) => x.classList.remove('done')); });
    det.appendChild(un);
    card.append(thumb, head, meta, nets, copies, acts, det);
    box.appendChild(card);
  }
  paintDelBar();
  open('#videosSheet');
}
$('#delSelected').addEventListener('click', async () => {
  const ids = [...picked].filter((id) => shown.some((r) => r.id === id));
  if (!ids.length) return;
  if (!confirm(`¿Borrar ${ids.length} ${ids.length === 1 ? 'video' : 'videos'} del teléfono? No se puede deshacer.`)) return;
  for (const id of ids) await videos.del(id);
  picked.clear();
  toast(`${ids.length} ${ids.length === 1 ? 'video borrado' : 'videos borrados'}.`);
  await showVideos();
  refreshHome();
});
$('#delAll').addEventListener('click', async () => {
  if (!shown.length) return;
  if (!confirm(`¿Borrar TODOS los videos (${shown.length}) de «Mis videos»? No se puede deshacer.`)) return;
  await videos.clear();
  picked.clear();
  toast('Se borraron todos los videos.');
  await showVideos();
  refreshHome();
});
$('#openVideos').addEventListener('click', () => showVideos());
$('#saveAll').addEventListener('click', async () => {
  await shareFiles(shown.map(fileOf), allTexts(shown), 'cada red');
  toast('Textos de todos los videos copiados.');
});
$('#zipAll').addEventListener('click', async () => {
  toast('Preparando ZIP…');
  const zip = await makeZip([
    ...shown.map((r) => ({ name: r.name, data: fileOf(r) })),
    { name: 'textos-para-publicar.txt', data: new TextEncoder().encode(allTexts(shown)) },
  ]);
  const f = new File([zip], `dos-caminos-${new Date().toISOString().slice(0, 10)}.zip`, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(f, f.name);
});

// ---------- ajustes ----------
$('#openSettings').addEventListener('click', () => { paintSettings(); open('#settingsSheet'); });
$('#formatPre').textContent = CLAUDE_PROMPT + '[temas]';
$('#copyPrompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(CLAUDE_PROMPT); toast('Instrucciones copiadas. Pégalas en Claude y añade los temas.'); } catch (e) { toast('No pude copiar. Selecciona el texto y cópialo.'); }
});

function bindSetting(sel, key, read, write) {
  const el = $(sel);
  write(el, S[key]);
  el.addEventListener('change', () => { S = settings.set({ [key]: read(el) }); });
}
bindSetting('#phraseChance', 'phraseChance', (e) => Number(e.value), (e, v) => (e.value = String(v)));
bindSetting('#signPhrases', 'signPhrases', (e) => e.checked, (e, v) => (e.checked = v));
bindSetting('#musicVol', 'musicVol', (e) => Number(e.value), (e, v) => (e.value = v));
bindSetting('#layoutSel', 'layout', (e) => e.value, (e, v) => (e.value = v));
bindSetting('#qualitySel', 'quality', (e) => Number(e.value), (e, v) => (e.value = String(v)));
bindSetting('#sfxOn', 'sfx', (e) => e.checked, (e, v) => (e.checked = v));
bindSetting('#iosMethod', 'iosMethod', (e) => e.value, (e, v) => (e.value = v));
bindSetting('#starNote', 'starNote', (e) => e.checked, (e, v) => (e.checked = v));

function paintSettings() { paintPhrases(); paintSongs(); }

function paintPhrases() {
  const ul = $('#phraseList');
  const l = phrases.list();
  ul.innerHTML = l.length ? '' : '<li class="hint">Aún no hay frases guardadas.</li>';
  l.slice().reverse().forEach((p) => {
    const li = document.createElement('li');
    const txt = document.createElement('div');
    txt.textContent = p.text;
    const acts = document.createElement('div');
    acts.className = 'acts';
    const ed = document.createElement('button'); ed.textContent = 'Editar';
    const del = document.createElement('button'); del.textContent = 'Borrar';
    acts.append(ed, del);
    li.append(txt, acts);
    ed.addEventListener('click', () => {
      const area = document.createElement('textarea');
      area.value = p.text;
      const save = document.createElement('button'); save.textContent = 'Guardar';
      txt.replaceWith(area);
      acts.replaceChildren(save);
      area.focus();
      save.addEventListener('click', () => { if (area.value.trim()) phrases.update(p.id, area.value.trim()); paintPhrases(); });
    });
    del.addEventListener('click', () => { if (confirm('¿Borrar esta frase?')) { phrases.del(p.id); paintPhrases(); } });
    ul.appendChild(li);
  });
}
$('#addPhrases').addEventListener('click', () => {
  const v = $('#phraseInput').value;
  const n = phrases.add(v.split(/\n+/));
  $('#phraseInput').value = '';
  paintPhrases();
  toast(n ? `${n} ${n === 1 ? 'frase guardada' : 'frases guardadas'}.` : 'No había frases nuevas.');
});

let audioEl = null;
async function paintSongs() {
  const ul = $('#songList');
  const l = await songs.meta();
  ul.innerHTML = l.length ? '' : '<li class="hint">Sin canciones. Los videos llevarán una música suave generada por la app.</li>';
  for (const s of l) {
    const li = document.createElement('li');
    const name = document.createElement('div');
    name.textContent = `♪ ${s.name}` + (s.duration ? ` · ${Math.floor(s.duration / 60)}:${String(Math.round(s.duration % 60)).padStart(2, '0')}` : '');
    const acts = document.createElement('div');
    acts.className = 'acts';
    const sel = document.createElement('select');
    for (const c of CATS) { const o = document.createElement('option'); o.value = c; o.textContent = CAT_LABEL.es[c]; sel.appendChild(o); }
    sel.value = s.category;
    sel.addEventListener('change', () => songs.update(s.id, { category: sel.value, auto: false }));
    // suave / emotiva / fuerte (en modo aleatorio nunca se usan las fuertes)
    const isel = document.createElement('select');
    isel.setAttribute('aria-label', 'Intensidad');
    for (const c of INTENSITY) { const o = document.createElement('option'); o.value = c; o.textContent = INTENSITY_LABEL[c]; isel.appendChild(o); }
    isel.value = intensityOf(s);
    isel.addEventListener('change', async () => { await songs.update(s.id, { intensity: isel.value }); paintMusicPick(); });
    const play = document.createElement('button'); play.textContent = 'Escuchar';
    play.addEventListener('click', async () => {
      if (audioEl) { audioEl.pause(); URL.revokeObjectURL(audioEl.src); if (audioEl._id === s.id) { audioEl = null; play.textContent = 'Escuchar'; return; } }
      const full = await songs.get(s.id);
      audioEl = new Audio(URL.createObjectURL(new Blob([full.data], { type: full.type })));
      audioEl._id = s.id;
      audioEl.play();
      play.textContent = 'Parar';
    });
    const del = document.createElement('button'); del.textContent = 'Borrar';
    del.addEventListener('click', async () => { if (confirm(`¿Borrar «${s.name}»?`)) { await songs.del(s.id); paintSongs(); paintMusicPick(); } });
    acts.append(sel, isel, play, del);
    li.append(name, acts);
    ul.appendChild(li);
  }
}
$('#musicInput').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  if (!files.length) return;
  persist();
  const st = $('#musicStatus');
  let n = 0;
  st.textContent = `Analizando ${files.length} ${files.length === 1 ? 'canción' : 'canciones'}…`;
  await addSongFiles(files, (s) => { n++; st.textContent = `${n} de ${files.length}: «${s.name}» → ${CAT_LABEL.es[s.category]}`; });
  st.textContent = `${n} ${n === 1 ? 'canción guardada' : 'canciones guardadas'} en el teléfono.`;
  paintSongs();
  paintMusicPick();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
