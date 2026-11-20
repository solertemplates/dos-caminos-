// Dos Caminos — interfaz. Reglas en MAESTRO.md.
import { parseScripts } from './parser.js';
import { EXAMPLES } from './examples.js';
import { makeTimeline, layoutFor, makeStars } from './render.js';
import { renderAudio } from './audio.js';
import { encodeVideo } from './encoder.js';
import { settings, phrases, draft, counters, songs, videos, queue, persist } from './storage.js';
import { addSongFiles, pickSong, CATS, CAT_LABEL } from './music.js';
import { postText, NETWORKS } from './publish.js';
import { makeZip } from './zip.js';
import { CLAUDE_PROMPT } from './format.js';
import { pickFinal } from './finals.js';

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
  if (!ownTitle.trim() && !opts.finals[idx]) opts.finals[idx] = pickFinal(lang, opts.usedFinals);
  const phrase = ownTitle.trim() || opts.finals[idx];
  const signature = '';
  const sideTexts = isTime
    ? (en ? E.stages : script.stages).map((lbl) => ({ title: lbl, sub: (en && E.sides?.[0]?.sub) || script.sides[0].sub }))
    : script.sides.map((sd, i) => (en && E.sides?.[i]) || { title: sd.title, sub: sd.sub });
  const layoutKind = isTime ? 'time' : S.layout === 'auto' ? script.layout || (idx % 3 === 2 ? 'lr' : 'ab') : S.layout;
  const tl = makeTimeline(opts.duration);
  const seed = (Date.now() + idx * 977) % 100000;
  return {
    tl, seed,
    layout: layoutFor(layoutKind),
    stars: makeStars(seed),
    sides: script.sides,
    emotion: script.emotion,
    texts: {
      hook: (en ? E.hook : script.hook) || '',
      phrase,
      postPhrase: (en ? E.phrase : script.phrase) || '',
      question: (en ? E.question : script.question) || defQ,
      signature,
      sides: sideTexts,
    },
    title: ownTitle.trim() || phrase,
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
  const song = await pickSong(sc.emotion);
  const audio = await renderAudio({ job, D, musicData: song?.data, sfxOn: S.sfx, sfxVol: S.sfxVol, musicVol: S.musicVol });
  const out = await encodeVideo({
    canvas: $('#stage'), job, audio, D, scale: S.quality, signal: abort.signal,
    onProgress: (k) => { $('#progBar').style.width = `${((idx + k) / opts.total) * 100}%`; },
  });
  const n = counters.next('videos');
  const v = { title: job.title, phrase: job.texts.postPhrase, question: job.texts.question, theme: sc.theme, lang: opts.lang, star: S.starNote && n % 4 === 0 };
  const texts = Object.fromEntries(NETWORKS.map((nw) => [nw.id, postText(nw.id, v)]));
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    id, created: Date.now(), title: job.title, theme: sc.theme, lang: opts.lang, duration: D,
    name: `${opts.lang === 'en' ? 'two-paths' : 'dos-caminos'}-${slug(job.title)}-${id.slice(-4)}.${out.ext}`,
    mime: out.mime, ext: out.ext, blob: out.blob, realtime: !!out.realtime, size: out.blob.size, song: song?.name || '', texts, posted: {},
  };
}

async function saveVideo(rec) {
  try { await videos.put(rec); }
  catch (e) {
    // algunos Safari antiguos no guardan Blob en IndexedDB: se guarda como ArrayBuffer
    const buf = await rec.blob.arrayBuffer();
    await videos.put({ ...rec, blob: null, buf });
  }
}

function startBatch(scripts) {
  const q = queue.get();
  if (q && q.idx < q.items.length && !confirm('Hay una tanda sin terminar. ¿Empezar una nueva y descartarla?')) return;
  queue.set({ items: scripts, idx: 0, opts: { duration: S.duration, lang: S.lang, total: scripts.length }, ids: [] });
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
$('#resumeGo').addEventListener('click', () => runQueue());
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
async function shareFiles(files, text) {
  if (text) { try { navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {} }
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  for (const f of files) download(f, f.name);
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
  $('#videosInfo').textContent = list.length ? `${list.length} ${list.length === 1 ? 'video guardado' : 'videos guardados'} en este teléfono. Cada botón de red copia el texto y abre el menú para publicar; el ✓ marca dónde ya lo publicaste.` : 'Aún no hay videos. Pega guiones y pulsa «Crear videos».';
  $('#batchBtns').hidden = list.length < 2;
  for (const rec of list) {
    const file = fileOf(rec);
    const card = document.createElement('div');
    card.className = 'result' + (highlight.has(rec.id) ? ' new' : '');
    const thumb = document.createElement('button');
    thumb.className = 'vthumb';
    thumb.textContent = '▶  Ver video';
    thumb.addEventListener('click', () => {
      const v = document.createElement('video');
      v.playsInline = true; v.controls = true; v.autoplay = true;
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
        const ok = await shareFiles([file], rec.texts[n.id]);
        if (ok) {
          rec.posted = { ...(rec.posted || {}), [n.id]: true };
          b.classList.add('done');
          videos.update(rec.id, { posted: rec.posted });
          toast(`Texto de ${n.label} copiado. Pégalo al publicar.`);
        }
      });
      nets.appendChild(b);
    }
    const acts = document.createElement('div');
    acts.className = 'vacts';
    const dl = document.createElement('button'); dl.textContent = 'Descargar';
    dl.addEventListener('click', () => shareFiles([file]));
    const del = document.createElement('button'); del.textContent = 'Borrar';
    del.addEventListener('click', async () => { if (confirm(`¿Borrar «${rec.title}» del teléfono?`)) { await videos.del(rec.id); picked.delete(rec.id); showVideos(); refreshHome(); } });
    acts.append(dl, del);
    const det = document.createElement('details');
    det.innerHTML = '<summary>Ver textos para publicar</summary><pre></pre>';
    det.querySelector('pre').textContent = NETWORKS.map((n) => `— ${n.label} —\n${rec.texts[n.id]}`).join('\n\n');
    const un = document.createElement('button');
    un.className = 'text-btn small';
    un.textContent = 'Quitar las marcas ✓';
    un.addEventListener('click', () => { rec.posted = {}; videos.update(rec.id, { posted: {} }); nets.querySelectorAll('button').forEach((x) => x.classList.remove('done')); });
    det.appendChild(un);
    card.append(thumb, head, meta, nets, acts, det);
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
  await shareFiles(shown.map(fileOf), allTexts(shown));
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
    del.addEventListener('click', async () => { if (confirm(`¿Borrar «${s.name}»?`)) { await songs.del(s.id); paintSongs(); } });
    acts.append(sel, play, del);
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
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
