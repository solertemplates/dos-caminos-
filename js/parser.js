// Dos Caminos — lectura de guiones en formato sencillo.
import { SCENE_NAMES } from './scenes.js';

export const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const KEY = {
  titulo: 'title', title: 'title',
  tema: 'theme', topic: 'theme', theme: 'theme',
  emocion: 'emotion', emotion: 'emotion', musica: 'emotion',
  division: 'layout', layout: 'layout', pantalla: 'layout',
  gancho: 'hook', hook: 'hook',
  a: 'A', b: 'B',
  frase: 'phrase', reflexion: 'phrase', phrase: 'phrase',
  pregunta: 'question', question: 'question',
};

const SCENE_ALIAS = {
  puente: 'puente', bridge: 'puente',
  arbol: 'arbol', arbolito: 'arbol', planta: 'arbol', tree: 'arbol', semilla: 'arbol',
  alcancia: 'alcancia', frasco: 'alcancia', ahorro: 'alcancia', jar: 'alcancia', monedas: 'alcancia',
  casa: 'casa', ladrillos: 'casa', muro: 'casa', pared: 'casa', house: 'casa', wall: 'casa',
  escalera: 'escalera', escalones: 'escalera', stairs: 'escalera',
  mesa: 'mesa', cena: 'mesa', table: 'mesa',
  fogata: 'fogata', fuego: 'fogata', hoguera: 'fogata', fire: 'fogata', vela: 'fogata',
  camino: 'camino', colina: 'camino', montana: 'camino', path: 'camino', hill: 'camino',
  libros: 'libros', libro: 'libros', biblia: 'libros', books: 'libros', estudio: 'libros',
  abrazo: 'abrazo', distancia: 'abrazo', hug: 'abrazo', encuentro: 'abrazo',
};

const PERSON_ALIAS = {
  hombre: 'hombre', el: 'hombre', papa: 'hombre', padre: 'hombre', esposo: 'hombre', man: 'hombre', abuelo: 'hombre',
  mujer: 'mujer', ella: 'mujer', mama: 'mujer', madre: 'mujer', esposa: 'mujer', woman: 'mujer', abuela: 'mujer',
  nino: 'nino', hijo: 'nino', boy: 'nino', child: 'nino', nene: 'nino',
  nina: 'nina', hija: 'nina', girl: 'nina',
};

const ACT_ALIAS = {
  construir: 'construir', build: 'construir', trabajar: 'construir', work: 'construir', poner: 'construir',
  esperar: 'esperar', wait: 'esperar',
  orar: 'orar', pray: 'orar', rezar: 'orar',
  'orar-domingo': 'orar-domingo', 'solo-domingo': 'orar-domingo', domingo: 'orar-domingo', sunday: 'orar-domingo',
  regar: 'regar', water: 'regar', cuidar: 'cuidar', care: 'cuidar', sembrar: 'regar',
  celular: 'celular', phone: 'celular', telefono: 'celular', pantalla: 'celular', ignorar: 'celular',
  dormir: 'dormir', sleep: 'dormir',
  ahorrar: 'ahorrar', save: 'ahorrar', gastar: 'gastar', spend: 'gastar',
  descansar: 'descansar', rest: 'descansar', abandonar: 'descansar',
  subir: 'subir', climb: 'subir',
  sentarse: 'sentarse', sit: 'sentarse', quedarse: 'sentarse',
  hablar: 'hablar', talk: 'hablar', conversar: 'hablar',
  acercarse: 'acercarse', perdonar: 'acercarse', approach: 'acercarse', forgive: 'acercarse',
  alejarse: 'alejarse', espalda: 'alejarse', leave: 'alejarse', irse: 'alejarse',
  leer: 'leer', read: 'leer', estudiar: 'leer', study: 'leer',
  caminar: 'caminar', walk: 'caminar', correr: 'correr', run: 'correr',
  levantarse: 'levantarse', 'get-up': 'levantarse', caer: 'caer', fall: 'caer',
};

const GOOD = ['crece', 'une', 'unen', 'florece', 'llena', 'llega', 'brilla', 'completa', 'fuerte', 'sube', 'gana', 'enciende', 'arde', 'abraza', 'grow', 'join', 'meet', 'full', 'reach', 'shine', 'complete', 'strong', 'win', 'bloom'];
const BAD = {
  decay: ['seca', 'apaga', 'vacia', 'enfria', 'marchita', 'muere', 'pierde', 'dry', 'fade', 'empty', 'cold', 'die', 'wither', 'out'],
  fall: ['cae', 'rompe', 'derrumba', 'fall', 'break', 'collapse', 'crumble'],
  apart: ['aleja', 'separa', 'distancia', 'apart', 'drift'],
  stall: ['queda', 'atras', 'nunca', 'incompleto', 'detiene', 'stuck', 'behind', 'never', 'stays', 'stops'],
};

export function classifyResult(res) {
  const r = norm(res);
  for (const k of ['fall', 'apart', 'decay', 'stall']) if (BAD[k].some((w) => r.includes(w))) return { good: false, bad: k };
  if (GOOD.some((w) => r.includes(w))) return { good: true, bad: null };
  if (/\bno\b|\bnot\b/.test(r)) return { good: false, bad: 'stall' };
  return { good: true, bad: null };
}

const THEMES = { pareja: 'pareja', amor: 'pareja', couple: 'pareja', love: 'pareja', familia: 'familia', family: 'familia', dinero: 'dinero', money: 'dinero', finanzas: 'dinero', trabajo: 'trabajo', work: 'trabajo', superacion: 'superacion', 'self-improvement': 'superacion', growth: 'superacion', fe: 'fe', faith: 'fe', dios: 'fe' };
export const EMOTIONS = ['romantica', 'tension', 'triste', 'emotiva', 'inspiracional', 'alegre'];
const EMO_ALIAS = { romantica: 'romantica', romantic: 'romantica', tension: 'tension', suspenso: 'tension', triste: 'triste', sad: 'triste', emotiva: 'emotiva', emotional: 'emotiva', emocionante: 'emotiva', inspiracional: 'inspiracional', inspiradora: 'inspiracional', inspiring: 'inspiracional', alegre: 'alegre', happy: 'alegre', feliz: 'alegre' };
const THEME_EMO = { pareja: 'romantica', familia: 'emotiva', dinero: 'inspiracional', trabajo: 'inspiracional', superacion: 'inspiracional', fe: 'emotiva' };
const THEME_SCENE = { pareja: 'puente', familia: 'mesa', dinero: 'alcancia', trabajo: 'casa', superacion: 'escalera', fe: 'arbol' };

function splitPeople(s) {
  return norm(s).split(/\s*(?:\+|,|\by\b|\band\b|&)\s*/).filter(Boolean);
}

function parseSide(val, theme, errs, label) {
  const parts = val.split('|').map((x) => x.trim());
  const [title = '', sub = '', sceneRaw = '', peopleRaw = '', actsRaw = '', resRaw = ''] = parts;
  let scene = SCENE_ALIAS[norm(sceneRaw)] || null;
  if (!scene) {
    if (sceneRaw) errs.push(`${label}: escena «${sceneRaw}» no existe; uso «${THEME_SCENE[theme] || 'arbol'}».`);
    scene = THEME_SCENE[theme] || 'arbol';
  }
  let kinds = splitPeople(peopleRaw).map((p) => PERSON_ALIAS[p] || (p.startsWith('muj') ? 'mujer' : p.startsWith('ni') ? 'nino' : 'hombre'));
  if (!kinds.length) kinds = scene === 'puente' || scene === 'abrazo' ? ['hombre', 'mujer'] : ['hombre'];
  let acts = norm(actsRaw).split(/\s*[+,]\s*/).filter(Boolean).map((a) => ACT_ALIAS[a] || ACT_ALIAS[a.replace(/\s+/g, '-')] || a);
  if (!acts.length) acts = ['construir'];
  const people = kinds.slice(0, 4).map((kind, i) => ({ kind, act: acts[Math.min(i, acts.length - 1)] }));
  const cls = classifyResult(resRaw);
  return { title, sub, scene, people, result: resRaw, ...cls };
}

function splitBlocks(text) {
  const clean = text.replace(/\r/g, '').replace(/^```.*$/gm, '');
  const blocks = clean.split(/^\s*(?:-{3,}|={3,}|\*{3,})\s*$/m);
  // si no hay separadores, cada TITULO: abre un guion nuevo
  const out = [];
  for (const b of blocks) {
    const lines = b.split('\n');
    let cur = [];
    for (const ln of lines) {
      const k = norm(ln.split(':')[0]);
      if ((k === 'titulo' || k === 'title') && cur.some((l) => /^\s*(titulo|título|title)\s*:/i.test(l))) { out.push(cur.join('\n')); cur = []; }
      cur.push(ln);
    }
    if (cur.join('').trim()) out.push(cur.join('\n'));
  }
  return out;
}

export function parseScripts(text) {
  const scripts = [];
  const errors = [];
  splitBlocks(text).forEach((block, bi) => {
    const f = { en: {} };
    for (const raw of block.split('\n')) {
      const m = raw.match(/^\s*[#*\-\s]*([A-Za-zÁÉÍÓÚáéíóúÑñ]+)(?:[_ ]?(EN|en))?\s*:\s*(.*)$/);
      if (!m) continue;
      const key = KEY[norm(m[1])];
      if (!key) continue;
      const val = m[3].trim().replace(/^\*+\s*/, '').replace(/\*+$/, '').trim();
      if (m[2]) f.en[key] = val; else f[key] = val;
    }
    if (!f.A || !f.B) {
      if (block.trim().length > 10) errors.push(`Guion ${bi + 1}: faltan las líneas A: y B:.`);
      return;
    }
    const errs = [];
    const theme = THEMES[norm(f.theme)] || 'superacion';
    const label = `Guion ${scripts.length + 1}`;
    const A = parseSide(f.A, theme, errs, label + ' A');
    const B = parseSide(f.B, theme, errs, label + ' B');
    const lay = norm(f.layout);
    const layout = /lado|side|izq|vert/.test(lay) ? 'lr' : /arriba|abajo|top|bottom|horiz/.test(lay) ? 'ab' : null;
    const enSide = (v, base) => {
      if (!v) return null;
      const [title = base.title, sub = base.sub] = v.split('|').map((x) => x.trim());
      return { title, sub };
    };
    scripts.push({
      id: `${Date.now().toString(36)}-${scripts.length}`,
      title: f.title || A.title,
      theme,
      emotion: EMO_ALIAS[norm(f.emotion)] || THEME_EMO[theme],
      layout,
      hook: f.hook || '',
      phrase: f.phrase || '',
      question: f.question || '',
      sides: [A, B],
      en: {
        title: f.en.title, hook: f.en.hook, phrase: f.en.phrase, question: f.en.question,
        sides: [enSide(f.en.A, A), enSide(f.en.B, B)],
      },
    });
    errors.push(...errs);
  });
  return { scripts, errors };
}

export const SCENES_LIST = SCENE_NAMES;
