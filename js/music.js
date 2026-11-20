// Dos Caminos — banco de música: categoría automática y elección según la emoción.
import { songs } from './storage.js';
import { norm } from './parser.js';

export const CATS = ['romantica', 'tension', 'triste', 'emotiva', 'inspiracional', 'alegre'];
export const CAT_LABEL = {
  es: { romantica: 'Romántica', tension: 'Tensión', triste: 'Triste', emotiva: 'Emotiva', inspiracional: 'Inspiracional', alegre: 'Alegre' },
  en: { romantica: 'Romantic', tension: 'Tension', triste: 'Sad', emotiva: 'Emotional', inspiracional: 'Inspiring', alegre: 'Happy' },
};

// Intensidad de cada canción (se cambia en Ajustes). En modo aleatorio nunca se usan las «fuertes».
export const INTENSITY = ['suave', 'emotiva', 'fuerte'];
export const INTENSITY_LABEL = { suave: 'Suave', emotiva: 'Emotiva', fuerte: 'Fuerte' };
// si la canción aún no tiene etiqueta: por su análisis o, si no, por su categoría
export function intensityOf(s) {
  if (s.intensity) return s.intensity;
  if (s.category === 'tension') return 'fuerte';
  if (s.category === 'triste' || s.category === 'romantica') return 'suave';
  return 'emotiva';
}
function intensityByFeatures(f) {
  if (f.energy > 0.2 && f.rate > 1.4) return 'fuerte';
  if (f.energy < 0.1) return 'suave';
  return 'emotiva';
}

const WORDS = {
  romantica: ['love', 'amor', 'romant', 'heart', 'corazon', 'kiss', 'beso', 'wedding', 'boda', 'together', 'juntos', 'valentine', 'tender'],
  tension: ['tension', 'suspense', 'dark', 'oscur', 'thriller', 'epic', 'battle', 'storm', 'tormenta', 'drama', 'intense', 'danger', 'cinematic'],
  triste: ['sad', 'triste', 'melanch', 'lonely', 'soledad', 'tears', 'lagrima', 'rain', 'lluvia', 'goodbye', 'adios', 'sorrow', 'grief'],
  emotiva: ['emotional', 'emotiv', 'piano', 'memories', 'recuerdo', 'nostalg', 'touching', 'feel', 'soft', 'ambient'],
  inspiracional: ['inspir', 'hope', 'esperanza', 'rise', 'motiv', 'uplift', 'faith', 'fe ', 'worship', 'adoracion', 'gloria', 'dream', 'sueno', 'victory', 'victoria', 'journey'],
  alegre: ['happy', 'alegr', 'feliz', 'fun', 'joy', 'gozo', 'summer', 'ukulele', 'upbeat', 'dance', 'baila', 'sunny', 'positive'],
};

function byName(name) {
  const n = norm(name).replace(/[_\-.]+/g, ' ');
  for (const c of CATS) if (WORDS[c].some((w) => n.includes(w))) return c;
  return null;
}

// Análisis sencillo: energía, brillo y densidad de golpes.
async function analyze(buf) {
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new AC(1, 44100, 44100);
  const audio = await ac.decodeAudioData(buf.slice(0));
  const ch = audio.getChannelData(0);
  const sr = audio.sampleRate;
  const start = Math.floor(Math.min(audio.duration * 0.15, 20) * sr);
  const end = Math.min(ch.length, start + 45 * sr);
  const win = 1024;
  let sum = 0, zc = 0, n = 0, prev = 0, onsets = 0;
  const rmsArr = [];
  for (let i = start; i + win < end; i += win) {
    let s = 0, z = 0;
    for (let j = i; j < i + win; j++) { s += ch[j] * ch[j]; if ((ch[j] >= 0) !== (ch[j - 1] >= 0)) z++; }
    const rms = Math.sqrt(s / win);
    rmsArr.push(rms);
    sum += rms; zc += z / win; n++;
  }
  const mean = sum / Math.max(1, n);
  for (let i = 1; i < rmsArr.length; i++) {
    const avg = rmsArr.slice(Math.max(0, i - 8), i).reduce((a, b) => a + b, 0) / Math.min(8, i);
    if (rmsArr[i] > avg * 1.35 && rmsArr[i] - prev > mean * 0.12) onsets++;
    prev = rmsArr[i];
  }
  const secs = (n * win) / sr || 1;
  return { energy: mean, bright: zc / Math.max(1, n), rate: onsets / secs, duration: audio.duration };
}

function byFeatures(f) {
  const calm = f.energy < 0.11, fast = f.rate > 1.6, bright = f.bright > 0.07;
  if (calm && !fast && !bright) return 'triste';
  if (calm && bright && !fast) return 'romantica';
  if (calm && fast) return 'emotiva';
  if (!calm && fast && bright) return 'alegre';
  if (!calm && fast) return 'tension';
  if (!calm) return 'inspiracional';
  return 'emotiva';
}

export async function addSongFiles(files, onEach) {
  const added = [];
  for (const file of files) {
    const data = await file.arrayBuffer();
    let cat = byName(file.name), feat = null;
    try { feat = await analyze(data); if (!cat) cat = byFeatures(feat); } catch (e) { console.warn('análisis', e); }
    const song = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: file.name.replace(/\.(mp3|m4a|aac|mp4|wav)$/i, ''),
      type: file.type || 'audio/mpeg',
      category: cat || 'emotiva',
      auto: true,
      intensity: feat ? intensityByFeatures(feat) : (cat === 'tension' ? 'fuerte' : cat === 'triste' || cat === 'romantica' ? 'suave' : 'emotiva'),
      duration: feat?.duration || 0,
      added: Date.now(),
      lastUsed: 0,
      uses: 0,
      data,
    };
    await songs.put(song);
    added.push(song);
    onEach?.(song);
  }
  return added;
}

const NEAR = {
  romantica: ['emotiva', 'alegre'], tension: ['triste', 'emotiva'], triste: ['emotiva', 'tension'],
  emotiva: ['inspiracional', 'triste', 'romantica'], inspiracional: ['emotiva', 'alegre'], alegre: ['inspiracional', 'romantica'],
};

// Elige la canción: choice = id de una canción concreta, o 'random' (la menos usada de la emoción o de una cercana,
// NUNCA una «fuerte»). Devuelve {id, name, category, intensity, data} o null (= música propia de la app).
export async function pickSong(emotion, choice = 'random') {
  if (choice && choice !== 'random') {
    const full = await songs.get(choice);
    if (full) {
      await songs.update(full.id, { lastUsed: Date.now(), uses: (full.uses || 0) + 1 });
      return { id: full.id, name: full.name, category: full.category, intensity: intensityOf(full), data: full.data, chosen: true };
    }
  }
  const meta = (await songs.meta()).filter((s) => intensityOf(s) !== 'fuerte');
  if (!meta.length) return null;
  const tiers = [[emotion], NEAR[emotion] || [], CATS];
  for (const cats of tiers) {
    const pool = meta.filter((s) => cats.includes(s.category));
    if (!pool.length) continue;
    pool.sort((a, b) => a.lastUsed - b.lastUsed || Math.random() - 0.5);
    const choice2 = pool[0];
    await songs.update(choice2.id, { lastUsed: Date.now(), uses: (choice2.uses || 0) + 1 });
    const full = await songs.get(choice2.id);
    return { id: full.id, name: full.name, category: full.category, intensity: intensityOf(full), data: full.data };
  }
  return null;
}

// desde qué segundo suena la canción en un video de D segundos (igual que en audio.js)
export function songOffset(duration, D = 30) {
  if (duration > D + 25) return Math.min(12, duration * 0.08);
  return 0;
}
