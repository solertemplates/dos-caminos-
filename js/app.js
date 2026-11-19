// Dos Caminos — interfaz.
import { parseScripts } from './parser.js';
import { EXAMPLES } from './examples.js';
import { makeTimeline, layoutFor, makeStars } from './render.js';
import { renderAudio } from './audio.js';
import { encodeVideo } from './encoder.js';
import { settings, phrases, draft, counters, songs, persist } from './storage.js';
import { addSongFiles, pickSong, CATS, CAT_LABEL } from './music.js';
import { postText, NETWORKS } from './publish.js';
import { makeZip } from './zip.js';
import { CLAUDE_PROMPT } from './format.js';

const $ = (s) => document.querySelector(s);
let S = settings.get();
let results = [];
let abort = null;

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
    for (const s of stars) { x.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t / 1000 * s.s + s.p)); x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), ms);
}
function open(id) { $(id).hidden = false; document.body.style.overflow = 'hidden'; }
function close(id) { $(id).hidden = true; document.body.style.overflow = ''; }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { close('#' + b.closest('.sheet').id); refreshCount(); }));

// ---------- pantalla principal ----------
function seg(id, key, cast = (v) => v) {
  const el = $(id);
  const paint = () => el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(S[key]) === b.dataset.v));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    S = settings.set({ [key]: cast(b.dataset.v) });
    paint();
  });
  paint();
}
seg('#durSeg', 'duration', Number);
seg('#langSeg', 'lang');

function currentScripts() {
  const txt = draft.get();
  return txt.trim() ? parseScripts(txt) : { scripts: [], errors: [] };
}
function refreshCount() {
  const { scripts } = currentScripts();
  $('#scriptCount').textContent = scripts.length
    ? `${scripts.length} ${scripts.length === 1 ? 'guion listo' : 'guiones listos'}`
    : 'Aún no hay guiones';
  $('#homeNote').textContent = scripts.length ? `Se crearán ${scripts.length} ${scripts.length === 1 ? 'video' : 'videos'} de ${S.duration} s.` : '';
}
refreshCount();

// ---------- pegar guiones ----------
const ta = $('#scriptsText');
function showParse() {
  const { scripts, errors } = parseScripts(ta.value);
  const info = $('#parseInfo');
  info.className = 'hint' + (errors.length ? ' err' : '');
  info.textContent = (scripts.length ? `${scripts.length} ${scripts.length === 1 ? 'guion reconocido' : 'guiones reconocidos'}.` : ta.value.trim() ? 'No reconozco ningún guion. Revisa el formato en Ajustes.' : 'Pega aquí los guiones que te escribió Claude.') + (errors.length ? ' ' + errors.slice(0, 3).join(' ') : '');
}
$('#openPaste').addEventListener('click', () => { ta.value = draft.get(); showParse(); open('#pasteSheet'); });
ta.addEventListener('input', () => { draft.set(ta.value); showParse(); });
$('#pasteClip').addEventListener('click', async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (!t.trim()) return toast('El portapapeles está vacío.');
    ta.value = ta.value.trim() ? ta.value.trim() + '\n---\n' + t : t;
    draft.set(ta.value);
    showParse();
  } catch (e) { toast('Mantén pulsado el cuadro y elige «Pegar».'); ta.focus(); }
});
$('#loadExamples').addEventListener('click', () => { ta.value = EXAMPLES; draft.set(ta.value); showParse(); toast('30 guiones de ejemplo cargados. Borra los que no quieras.'); });
$('#clearScripts').addEventListener('click', () => { if (!ta.value || confirm('¿Borrar todos los guiones pegados?')) { ta.value = ''; draft.set(''); showParse(); } });

// ---------- creación ----------
const SPANISH = /[áéíóúñ¿¡]|\b(el|la|los|las|que|de|y|en|un|una|es|no|se|tu|su|con|por|para)\b/gi;
const ENGLISH = /\b(the|and|you|is|of|to|your|it|in|that|what|with|for|are|be|who)\b/gi;
function phraseLang(t) {
  const es = (t.match(SPANISH) || []).length, en = (t.match(ENGLISH) || []).length;
  return en > es ? 'en' : 'es';
}
function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
}

function buildJob(script, idx, lang) {
  const en = lang === 'en';
  const E = script.en || {};
  const defQ = en ? 'Which one are you?' : '¿Cuál de los dos eres tú?';
  let phrase = (en && E.phrase) || script.phrase || (en ? 'Small choices, repeated, become your life.' : 'Las pequeñas decisiones, repetidas, se vuelven tu vida.');
  let signature = '';
  const bank = phrases.list().filter((p) => phraseLang(p.text) === lang);
  if (bank.length && Math.random() < S.phraseChance) {
    const used = new Set(JSON.parse(sessionStorage.getItem('dc.usedPhrases') || '[]'));
    let pool = bank.filter((p) => !used.has(p.id));
    if (!pool.length) { pool = bank; used.clear(); }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    used.add(pick.id);
    sessionStorage.setItem('dc.usedPhrases', JSON.stringify([...used]));
    phrase = pick.text;
    if (S.signPhrases) signature = '— René Soler Rasua';
  }
  const sideTexts = script.sides.map((sd, i) => (en && E.sides?.[i]) || { title: sd.title, sub: sd.sub });
  const layoutKind = S.layout === 'auto' ? script.layout || (idx % 3 === 2 ? 'lr' : 'ab') : S.layout;
  const tl = makeTimeline(S.duration);
  const seed = (Date.now() + idx * 977) % 100000;
  return {
    tl, seed,
    layout: layoutFor(layoutKind),
    stars: makeStars(seed),
    sides: script.sides,
    emotion: script.emotion,
    texts: {
      hook: (en && E.hook) || script.hook,
      phrase,
      question: (en && E.question) || script.question || defQ,
      signature,
      sides: sideTexts,
    },
    title: (en && E.title) || script.title,
  };
}

$('#create').addEventListener('click', async () => {
  let { scripts } = currentScripts();
  if (!scripts.length) {
    if (!confirm('No hay guiones pegados. ¿Crear un video de prueba con el ejemplo del puente?')) return;
    scripts = parseScripts(EXAMPLES).scripts.slice(0, 1);
  }
  persist();
  results.forEach((r) => URL.revokeObjectURL(r.url));
  results = [];
  abort = new AbortController();
  open('#progressSheet');
  const canvas = $('#stage');
  const D = S.duration;
  const lang = S.lang;
  let failed = 0;
  for (let i = 0; i < scripts.length; i++) {
    if (abort.signal.aborted) break;
    const sc = scripts[i];
    const job = buildJob(sc, i, lang);
    const label = `Video ${i + 1} de ${scripts.length} · ${job.title}`;
    $('#progText').textContent = label;
    $('#progBar').style.width = `${(i / scripts.length) * 100}%`;
    try {
      const song = await pickSong(sc.emotion);
      const audio = await renderAudio({ job, D, musicData: song?.data, sfxOn: S.sfx, sfxVol: S.sfxVol, musicVol: S.musicVol });
      const out = await encodeVideo({
        canvas, job, audio, D, scale: S.quality, signal: abort.signal,
        onProgress: (k) => { $('#progBar').style.width = `${((i + k) / scripts.length) * 100}%`; },
      });
      const n = counters.next('videos');
      const star = S.starNote && n % 4 === 0;
      const v = { title: job.title, phrase: job.texts.phrase, question: job.texts.question, theme: sc.theme, lang, star };
      const texts = Object.fromEntries(NETWORKS.map((nw) => [nw.id, postText(nw.id, v)]));
      const name = `dos-caminos-${String(i + 1).padStart(2, '0')}-${slug(job.title)}.${out.ext}`;
      const file = new File([out.blob], name, { type: out.mime });
      results.push({ title: job.title, file, url: URL.createObjectURL(out.blob), texts, song: song?.name });
    } catch (e) {
      if (e.name === 'AbortError') break;
      console.error(e);
      failed++;
      toast(`No pude crear «${job.title}»: ${e.message}`, 4000);
    }
  }
  close('#progressSheet');
  if (results.length) showResults();
  else if (!abort.signal.aborted) toast('No se creó ningún video.' + (failed ? ' Revisa que Safari esté actualizado.' : ''));
});
$('#cancel').addEventListener('click', () => abort?.abort());

// ---------- resultados y compartir ----------
async function shareFiles(files, text) {
  if (text) { try { navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {} }
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return true; } catch (e) { if (e.name === 'AbortError') return false; }
  }
  for (const f of files) download(f, f.name);
  return true;
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

function showResults() {
  const list = $('#resultList');
  list.innerHTML = '';
  $('#batchBtns').hidden = results.length < 2;
  results.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'result';
    card.innerHTML = `<video playsinline controls preload="metadata" src="${r.url}#t=0.6"></video><h3></h3><div class="nets"></div>
      <details><summary>Ver textos para publicar</summary><pre></pre></details>`;
    card.querySelector('h3').textContent = r.title + (r.song ? ` · ♪ ${r.song}` : '');
    card.querySelector('pre').textContent = NETWORKS.map((n) => `— ${n.label} —\n${r.texts[n.id]}`).join('\n\n');
    const nets = card.querySelector('.nets');
    for (const n of NETWORKS) {
      const b = document.createElement('button');
      b.textContent = n.label;
      b.addEventListener('click', async () => {
        // copiar primero (mismo toque) y abrir el menú de compartir
        let copied = false;
        try { navigator.clipboard.writeText(r.texts[n.id]).then(() => (copied = true)); } catch (e) {}
        const ok = await shareFiles([r.file]);
        toast(ok || copied ? `Texto de ${n.label} copiado. Pégalo al publicar.` : 'Texto copiado.');
      });
      nets.appendChild(b);
    }
    list.appendChild(card);
  });
  open('#resultsSheet');
}

$('#saveAll').addEventListener('click', async () => {
  const all = results.map((r) => r.file);
  const txt = results.map((r, i) => `#${i + 1} ${r.title}\n\n` + NETWORKS.map((n) => `— ${n.label} —\n${r.texts[n.id]}`).join('\n\n')).join('\n\n==========\n\n');
  await shareFiles(all, txt);
  toast('Textos de todos los videos copiados.');
});
$('#zipAll').addEventListener('click', async () => {
  toast('Preparando ZIP…');
  const txt = results.map((r, i) => `#${i + 1} ${r.title} (${r.file.name})\n\n` + NETWORKS.map((n) => `— ${n.label} —\n${r.texts[n.id]}`).join('\n\n')).join('\n\n==========\n\n');
  const zip = await makeZip([
    ...results.map((r) => ({ name: r.file.name, data: r.file })),
    { name: 'textos-para-publicar.txt', data: new TextEncoder().encode(txt) },
  ]);
  const f = new File([zip], `dos-caminos-${new Date().toISOString().slice(0, 10)}.zip`, { type: 'application/zip' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f] }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  download(f, f.name);
});

// ---------- ajustes ----------
$('#openSettings').addEventListener('click', () => { paintSettings(); open('#settingsSheet'); });
$('#formatPre').textContent = CLAUDE_PROMPT + '[tema]';
$('#copyPrompt').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(CLAUDE_PROMPT); toast('Instrucciones copiadas. Pégalas en Claude y añade el tema.'); } catch (e) { toast('No pude copiar. Selecciona el texto y cópialo.'); }
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
  ul.innerHTML = l.length ? '' : '<li class="hint">Sin canciones. Los videos usarán una música suave generada por la app.</li>';
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
