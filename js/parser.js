// Dos Caminos — lectura de guiones en formato sencillo.
import { SCENE_NAMES } from './scenes.js';
import { findObject } from './objects.js';
import { USES, USE_ALIAS } from './uses.js';
import { parseMomentList } from './moments.js';

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
  etapas: 'stages', stages: 'stages', momentos: 'stages',
  fondo: 'bg', background: 'bg', color: 'bg',
  plano: 'plano', planos: 'plano', camara: 'plano', shot: 'plano', shots: 'plano', camera: 'plano',
  angulo: 'angulo', angulos: 'angulo', angle: 'angulo', vista: 'angulo', view: 'angulo',
  inicio: 'intro', comun: 'intro', intro: 'intro', start: 'intro',
  separar: 'split', dividir: 'split', split: 'split',
  voz: 'voz', voice: 'voz', narracion: 'voz',
  subtitulos: 'subs', subtitles: 'subs', subs: 'subs',
  portada: 'cover', miniatura: 'cover', cover: 'cover', thumbnail: 'cover',
  inspiracion: 'inspiration', inspiration: 'inspiration', // de qué video viral sale la idea (no se dibuja)
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
  cocina: 'cocina', kitchen: 'cocina', cocinar: 'cocina',
  oficina: 'oficina', office: 'oficina', escritorio: 'oficina',
  parque: 'parque', park: 'parque', columpio: 'parque',
  coche: 'coche', carro: 'coche', auto: 'coche', car: 'coche', manejar: 'coche',
  gimnasio: 'gimnasio', gym: 'gimnasio', pesas: 'gimnasio',
  cama: 'cama', bed: 'cama', dormitorio: 'cama', habitacion: 'cama',
  sofa: 'sofa', couch: 'sofa', sillon: 'sofa', salon: 'sofa',
  huerto: 'huerto', garden: 'huerto', jardin: 'huerto', siembra: 'huerto',
  montana: 'montana', mountain: 'montana', cumbre: 'montana', pico: 'montana',
  lluvia: 'lluvia', rain: 'lluvia', tormenta: 'lluvia', paraguas: 'lluvia',
  tienda: 'tienda', shop: 'tienda', store: 'tienda', puesto: 'tienda', negocio: 'tienda',
  carta: 'carta', letter: 'carta', cartas: 'carta', buzon: 'carta',
  reloj: 'reloj', clock: 'reloj', tiempo: 'reloj',
  telefono: 'telefono', llamada: 'telefono', call: 'telefono',
  regalo: 'regalo', gift: 'regalo', present: 'regalo',
  aeropuerto: 'aeropuerto', avion: 'aeropuerto', airport: 'aeropuerto', plane: 'aeropuerto', vuelo: 'aeropuerto'
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
  cocinar: 'cocinar', cook: 'cocinar',
  jugar: 'jugar', play: 'jugar',
  conducir: 'conducir', manejar: 'conducir', drive: 'conducir',
  entrenar: 'entrenar', train: 'entrenar', ejercitarse: 'entrenar',
  abrazar: 'abrazar',
  escalar: 'escalar', climb: 'escalar',
  paraguas: 'paraguas', umbrella: 'paraguas', mojarse: 'mojarse', 'get-wet': 'mojarse', compartir: 'compartir', share: 'compartir',
  vender: 'vender', sell: 'vender',
  escribir: 'escribir', write: 'escribir', olvidar: 'olvidar', forget: 'olvidar',
  aprovechar: 'aprovechar', perder: 'perder', waste: 'perder',
  llamar: 'llamar', 'call': 'llamar',
  dar: 'dar', give: 'dar', regalar: 'dar', guardar: 'guardar', keep: 'guardar',
};

const SCENE_ACTS = {
  oficina: ['trabajar', 'dormir', 'celular'],
  telefono: ['llamar', 'ignorar'],
  huerto: ['sembrar', 'regar', 'descansar', 'celular'],
  montana: ['escalar', 'sentarse', 'caer'],
  cama: ['dormir', 'celular', 'levantarse'],
  sofa: ['hablar', 'celular', 'abrazar'],
  parque: ['jugar', 'caminar', 'celular'],
  aeropuerto: ['despedirse', 'subir-avion', 'llegar-avion', 'esperar'],
};
function resolveAct(raw, scene) {
  const a = raw.replace(/\s+/g, '-');
  // acciones de uso real de objetos (tocar-guitarra, beber-cafe, montar-bici…) valen en cualquier escena
  if (USES[a]) return a;
  if (USE_ALIAS[a]) return USE_ALIAS[a];
  if (a === 'caer-bici' || a === 'levantarse-bici') return a;
  // «ausente»: no está en la escena; se dibuja pequeño en otro lugar (vale en cualquier escena)
  if (['ausente', 'no-viene', 'no-esta', 'no-llega', 'se-fue', 'absent', 'away', 'not-there'].includes(a)) return 'ausente';
  // aeropuerto: despedirse, subir-avion, llegar-avion
  if (['despedirse', 'despedir', 'se-despide', 'decir-adios', 'adios', 'say-goodbye', 'goodbye'].includes(a)) return 'despedirse';
  if (['subir-avion', 'subir-al-avion', 'embarcar', 'despegar', 'irse-en-avion', 'board', 'take-off'].includes(a)) return 'subir-avion';
  if (['llegar-avion', 'llegar-en-avion', 'aterrizar', 'bajar-del-avion', 'volver-en-avion', 'land', 'arrive-by-plane'].includes(a)) return 'llegar-avion';
  // «bailar»: bailan juntos (vale en cualquier escena)
  if (['bailar', 'baila', 'bailan', 'dance', 'dancing'].includes(a)) return 'bailar';
  // «abrazar-hijo»: los padres se agachan y abrazan al niño, contentos (vale en cualquier escena)
  if (['abrazar-hijo', 'abrazar-hija', 'abrazar-al-hijo', 'abrazar-a-la-hija', 'abrazar-nino', 'abrazar-nina', 'abrazo-familiar', 'abrazar-al-nino', 'hug-child', 'hug-kid', 'family-hug'].includes(a)) return 'abrazar-hijo';
  if (SCENE_ACTS[scene]?.includes(a)) return a;
  return ACT_ALIAS[a] || ACT_ALIAS[raw] || a;
}

const GOOD = ['crece', 'une', 'unen', 'florece', 'llena', 'llega', 'brilla', 'completa', 'fuerte', 'sube', 'gana', 'enciende', 'arde', 'abraza', 'grow', 'join', 'meet', 'full', 'reach', 'shine', 'complete', 'strong', 'win', 'bloom', 'despierta', 'wake', 'abrazan', 'hug', 'dry'];
const BAD = {
  decay: ['moja', 'wet', 'pierde', 'lose', 'seca', 'apaga', 'vacia', 'enfria', 'marchita', 'muere', 'pierde', 'dry', 'fade', 'empty', 'cold', 'die', 'wither', 'out'],
  fall: ['cae', 'rompe', 'derrumba', 'fall', 'break', 'collapse', 'crumble'],
  apart: ['aleja', 'separa', 'distancia', 'apart', 'drift'],
  stall: ['queda', 'atras', 'nunca', 'incompleto', 'detiene', 'stuck', 'behind', 'never', 'stays', 'stops'],
};

export function classifyResult(res, scene) {
  const r = norm(res);
  // en la lluvia, «se secan» es el final feliz
  if (scene === 'lluvia' && /seca|dry/.test(r)) return { good: true, bad: null };
  // «llega-agotado»: lucha solo, llega sin fuerzas y no puede recibir el corazón o el abrazo
  if (/agotad|exhaust|sin fuerzas/.test(r)) return { good: false, bad: 'tired' };
  for (const k of ['fall', 'apart', 'decay', 'stall']) if (BAD[k].some((w) => r.includes(w))) return { good: false, bad: k };
  if (GOOD.some((w) => r.includes(w))) return { good: true, bad: null };
  if (/\bno\b|\bnot\b/.test(r)) return { good: false, bad: 'stall' };
  return { good: true, bad: null };
}

const THEMES = {
  pareja: 'pareja', amor: 'pareja', couple: 'pareja', love: 'pareja', relationships: 'pareja',
  familia: 'familia', family: 'familia', hogar: 'familia',
  hijos: 'hijos', hijo: 'hijos', crianza: 'hijos', kids: 'hijos', parenting: 'hijos', children: 'hijos',
  dinero: 'dinero', money: 'dinero', finanzas: 'dinero', ahorro: 'dinero', finance: 'dinero',
  trabajo: 'trabajo', work: 'trabajo', career: 'trabajo', empleo: 'trabajo',
  amistad: 'amistad', amigos: 'amistad', friendship: 'amistad', friends: 'amistad',
  salud: 'salud', health: 'salud', ejercicio: 'salud', fitness: 'salud',
  movil: 'movil', celular: 'movil', telefono: 'movil', pantallas: 'movil', phone: 'movil', screens: 'movil',
  constancia: 'constancia', habitos: 'constancia', disciplina: 'constancia', consistency: 'constancia', habits: 'constancia',
  superacion: 'constancia', 'self-improvement': 'constancia', growth: 'constancia',
  fe: 'fe', faith: 'fe', dios: 'fe',
};
export const EMOTIONS = ['romantica', 'tension', 'triste', 'emotiva', 'inspiracional', 'alegre'];
const EMO_ALIAS = { romantica: 'romantica', romantic: 'romantica', tension: 'tension', suspenso: 'tension', triste: 'triste', sad: 'triste', emotiva: 'emotiva', emotional: 'emotiva', emocionante: 'emotiva', inspiracional: 'inspiracional', inspiradora: 'inspiracional', inspiring: 'inspiracional', alegre: 'alegre', happy: 'alegre', feliz: 'alegre' };
const THEME_EMO = { pareja: 'romantica', familia: 'emotiva', hijos: 'emotiva', dinero: 'inspiracional', trabajo: 'inspiracional', amistad: 'alegre', salud: 'inspiracional', movil: 'tension', constancia: 'inspiracional', fe: 'emotiva' };
const THEME_SCENE = { pareja: 'puente', familia: 'mesa', hijos: 'arbol', dinero: 'alcancia', trabajo: 'casa', amistad: 'abrazo', salud: 'camino', movil: 'mesa', constancia: 'escalera', fe: 'arbol' };

function splitPeople(s) {
  return norm(s).split(/\s*(?:\+|,|\by\b|\band\b|&)\s*/).filter(Boolean);
}

const RESULT_HINT = /(crece|florece|se une|se unen|se llena|llega|ganan|se abrazan|se despiertan|se secan|se seca|se apaga|se vacia|se mojan|pierden|se queda|nunca se completa|se cae|se alejan|agotad)/;
const isScene = (x) => !!SCENE_ALIAS[norm(x).replace(/\s*\(.*$/, '')];
const isPeople = (x) => splitPeople(x).length > 0 && splitPeople(x).every((p) => PERSON_ALIAS[p] || /^(muj|ni|hom)/.test(p));

// Un lado: TEXTO | CONTADOR | escena(s) | personajes | acciones | final
// Varias escenas seguidas (de 2 a 4): «casa>camino>telefono>casa» y acciones por escena con «>»
// («abrazar+abrazar>llevar-maleta>llamar>abrazar»), o «casa(abrazar) > camino(llevar-maleta) > …».
function parseSide(val, theme, errs, label) {
  let parts = val.split('|').map((x) => x.trim());
  // si falta la escena (p. ej. «TEXTO | CONTADOR | mujer | gastar | se vacía»), los campos se corren: se detecta
  if (parts.length >= 3 && !isScene(parts[2]) && !/[>(]/.test(parts[2]) && isPeople(parts[2])) parts = [parts[0], parts[1], '', ...parts.slice(2)];
  const [title = '', sub = '', sceneRaw = '', peopleRaw = '', actsRaw = '', resRaw0 = ''] = parts;
  let resRaw = resRaw0;
  // PERSONAJES POR ESCENA: «hombre+mujer+nino>hombre+mujer» = los de cada escena (en orden); sin «>», los mismos en todas.
  // Hasta 3 por escena: como mucho 2 adultos y 1 niño o niña.
  const kindOf = (p) => PERSON_ALIAS[p] || (p.startsWith('muj') ? 'mujer' : p.startsWith('ni') ? 'nino' : 'hombre');
  const kindGroups = (peopleRaw.includes('>') ? peopleRaw.split(/\s*>\s*/) : [peopleRaw]).map((g) => {
    let ks = splitPeople(g).map(kindOf);
    // nunca se inventan personajes: si no nombra a nadie, una sola persona
    if (!ks.length) ks = ['hombre'];
    const adults = ks.filter((k) => k === 'hombre' || k === 'mujer'), kids = ks.filter((k) => k === 'nino' || k === 'nina');
    if (ks.length > 3 || adults.length > 2 || kids.length > 2) {
      errs.push(`${label}: como mucho 3 personajes por escena (2 adultos y un niño o una niña); uso los 3 primeros.`);
      ks = ks.slice(0, 3);
    }
    return ks;
  });
  let kinds = kindGroups[0];
  // escenas y acciones por escena
  const scItems = sceneRaw ? sceneRaw.split(/\s*>\s*/).filter(Boolean) : [];
  const actGroups = actsRaw ? actsRaw.split(/\s*>\s*/) : [];
  const segs = [];
  const parenMode = scItems.some((x) => /\(/.test(x));
  scItems.forEach((item, k) => {
    const m = item.match(/^([^()]+?)\s*(?:\((.*)\))?$/);
    const name = norm(m ? m[1] : item);
    let inner = m && m[2] ? m[2].trim() : '';
    let scene = SCENE_ALIAS[name] || null;
    if (!scene) { errs.push(`${label}: escena «${m ? m[1] : item}» no existe.`); return; }
    // «casa(se abrazan)» en la última escena = el final
    if (inner && k === scItems.length - 1 && RESULT_HINT.test(norm(inner))) { if (!resRaw) resRaw = inner; inner = ''; }
    const fromList = actGroups[Math.min(k, actGroups.length - 1)] || actGroups[0] || '';
    // sin acciones entre paréntesis: las del campo de acciones; si no hay, las de la escena anterior
    segs.push({ scene, actsRaw: inner || (actsRaw.trim() ? fromList : parenMode && segs.length ? segs[segs.length - 1].actsRaw : fromList) });
  });
  if (segs.length > 10) { errs.push(`${label}: como mucho 10 escenas por lado; uso las 10 primeras.`); segs.length = 10; }
  // sin escena válida: se deduce de las acciones; si no, la del tema (nunca el puente con una sola persona)
  if (!segs.length) {
    const firstActs = norm(actGroups[0] || '').split(/\s*[+,]\s*/).filter(Boolean);
    let scene = Object.keys(SCENE_ACTS).find((sc) => firstActs.some((a) => SCENE_ACTS[sc].includes(a.replace(/\s+/g, '-'))));
    if (!scene) scene = THEME_SCENE[theme] || 'camino';
    if (kinds.length < 2 && (scene === 'puente' || scene === 'abrazo')) scene = 'camino';
    segs.push({ scene, actsRaw: actGroups[0] || '', guessed: sceneRaw ? `escena «${sceneRaw}» no existe` : 'falta la escena' });
  }
  // cada persona tiene un número fijo (pid) en todo el guion: el mismo «él», «ella» o «el niño» en todas las escenas
  const cast = [];
  const pidOf = (ks) => { const seen = {}; return ks.map((k) => { const n = (seen[k] = (seen[k] || 0) + 1); let j = cast.findIndex((c) => c.kind === k && c.n === n); if (j < 0) { cast.push({ kind: k, n }); j = cast.length - 1; } return j; }); };
  const mkPeople = (scene, raw, ks) => {
    let acts = norm(raw).split(/\s*[+,]\s*/).filter(Boolean).map((a) => resolveAct(a, scene));
    if (!acts.length) acts = ['construir'];
    const pids = pidOf(ks);
    return ks.map((kind, i) => ({ kind, act: acts[Math.min(i, acts.length - 1)], pid: pids[i] }));
  };
  const segments = segs.map((g, k) => ({ scene: g.scene, people: mkPeople(g.scene, g.actsRaw, kindGroups[Math.min(k, kindGroups.length - 1)]) }));
  if (kindGroups.length > 1 && kindGroups.length !== segments.length) errs.push(`${label}: ${kindGroups.length} grupos de personajes para ${segments.length} escenas; los que faltan repiten el último.`);
  // el reparto completo (para los sucesos: «el niño», «ella»…), con la acción de su primera escena
  const castPeople = cast.map((c, j) => { for (const g of segments) { const p = g.people.find((q) => q.pid === j); if (p) return { kind: c.kind, act: p.act, pid: j }; } return { kind: c.kind, act: 'esperar', pid: j }; });
  const scene = segments[0].scene, people = segments[0].people;
  // REGLA: lo que se ve coincide con lo que dice el texto. Si dice que alguien no viene / no está / se fue, va con «ausente».
  const said = norm(`${title} ${sub}`);
  if (/\b(no viene|no vino|no llega|nunca llega|nunca viene|no esta|no estan|se fue|se va de casa|no aparece|doesn'?t come|never comes|isn'?t there|not there|never shows)\b/.test(said) && !segments.some((g) => g.people.some((p) => p.act === 'ausente')) && people.length > 1)
    errs.push(`${label}: el texto dice que alguien no viene o no está, pero sale en la escena. Pon «ausente» en la acción de esa persona (ej.: esperar+ausente).`);
  const cls = classifyResult(resRaw, segments[segments.length - 1].scene);
  return { title, sub, scene, people, cast: castPeople, segments: segments.length > 1 ? segments : null, result: resRaw, guessed: segs[0].guessed || null, ...cls };
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

// FONDO: azul / marron / vino / verde / negro / aleatorio (sin línea = aleatorio)
const BG_ALIAS = { negro: 'negro', black: 'negro', azul: 'azul', 'azul marino': 'azul', marino: 'azul', 'azul noche': 'azul', navy: 'azul', blue: 'azul', marron: 'marron', cafe: 'marron', brown: 'marron', vino: 'vino', granate: 'vino', burdeos: 'vino', wine: 'vino', verde: 'verde', green: 'verde', aleatorio: 'aleatorio', random: 'aleatorio' };
function bgName(v) { const n = norm(v || '').replace(/[^a-z ]/g, '').trim(); return BG_ALIAS[n] || BG_ALIAS[n.split(' ')[0]] || 'aleatorio'; }

// PLANO: general | cerca | mixto (por defecto mixto)
function planoName(v) {
  const n = norm(v || '');
  if (/general|lejos|amplio|entero|wide/.test(n)) return 'general';
  if (/cerca|primer|close|grande/.test(n)) return 'cerca';
  return 'mixto';
}
// ANGULO: lateral | frente | aereo | mixto (por defecto mixto)
function anguloName(v) {
  const n = norm(v || '');
  if (/contra/.test(n)) return 'mixto'; // el contrapicado va dentro de mixto
  if (/lateral|lado|side|perfil/.test(n)) return 'lateral';
  if (/frente|frontal|front|cara/.test(n)) return 'frente';
  if (/aere|arriba|cenital|top|above|aerial|picado/.test(n)) return 'aereo';
  return 'mixto';
}
// PORTADA: texto de 3 a 5 palabras (*palabra* en rojo) | roto o entero
export function coverSpec(v) {
  if (!v) return null;
  const [txt, h = ''] = String(v).split('|').map((x) => x.trim());
  const hn = norm(h);
  return { text: txt || '', heart: /rot|broken/.test(hn) ? 'roto' : /enter|whole|full|sano/.test(hn) ? 'entero' : null };
}

// VOZ: «0-4 texto > 4-9 texto > 9-15 texto» → [{ a, b, text }] (segundos del video)
export function parseVoz(v, errs = [], label = '') {
  if (!v) return null;
  const out = [];
  for (const part of String(v).split(/\s*>\s*/)) {
    const m = part.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:s\b)?\s*[-–—a]\s*(\d+(?:[.,]\d+)?)\s*(?:s\b)?\s*[:.)-]?\s*(.*)$/);
    if (!m) { if (part.trim()) errs.push(`${label}: tramo de VOZ sin segundos («${part.trim().slice(0, 30)}»); usa «0-4 texto».`); continue; }
    const a = parseFloat(m[1].replace(',', '.')), b = parseFloat(m[2].replace(',', '.'));
    if (b > a && m[3].trim()) out.push({ a, b, text: m[3].trim().replace(/^["«“]|["»”]$/g, '') });
  }
  return out.length ? out.sort((x, y) => x.a - y.a) : null;
}
export { SCENE_ALIAS };

export function parseScripts(text) {
  const scripts = [];
  const errors = [];
  splitBlocks(text).forEach((block, bi) => {
    const f = { en: {} };
    for (const raw of block.split('\n')) {
      // A-MOMENTOS: / B-MOMENTOS: (también MOMENTOS_A, A MOMENTOS…): sucesos de cada lado separados por «>»
      const mm = raw.match(/^\s*[#*\-\s]*(?:([AaBb])[\s_\-]*MOMENTOS|MOMENTOS[\s_\-]*([AaBb]))\s*:\s*(.*)$/i);
      if (mm) { f[`mom${(mm[1] || mm[2]).toUpperCase()}`] = mm[3].replace(/\*\*/g, '').trim(); continue; }
      // INICIO-MOMENTOS: sucesos de la parte común (antes de dividirse)
      const mi = raw.match(/^\s*[#*\-\s]*(?:INICIO[\s_\-]*MOMENTOS|MOMENTOS[\s_\-]*INICIO)\s*:\s*(.*)$/i);
      if (mi) { f.momI = mi[1].replace(/\*\*/g, '').trim(); continue; }
      const m = raw.match(/^\s*[#*\-\s]*([A-Za-zÁÉÍÓÚáéíóúÑñ]+)(?:[_ ]?(EN|en))?\s*:\s*(.*)$/);
      if (!m) continue;
      const key = KEY[norm(m[1])];
      if (!key) continue;
      // solo se limpian las negritas de Markdown (**…**); los *asteriscos* sueltos marcan palabras en rojo
      const val = m[3].trim().replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '').trim();
      if (m[2]) f.en[key] = val; else f[key] = val;
    }
    const isTime = /tiempo|time/.test(norm(f.layout));
    if (!f.A || (!f.B && !isTime)) {
      if (block.trim().length > 10) errors.push(`Guion ${bi + 1}: faltan las líneas A: y B:.`);
      return;
    }
    const errs = [];
    const theme = THEMES[norm(f.theme)] || 'constancia';
    const label = `Guion ${scripts.length + 1}`;
    const A = parseSide(f.A, theme, errs, label + ' A');
    const B = isTime ? A : parseSide(f.B, theme, errs, label + ' B');
    // si un lado no trae escena, usa la del otro lado (los dos caminos comparten escena)
    for (const [X, Y, n] of [[A, B, 'A'], [B, A, 'B']]) {
      if (!X.guessed) continue;
      if (Y && Y !== X && !Y.guessed) { X.scene = Y.scene; X.people = X.people.map((p) => ({ ...p, act: resolveAct(p.act, Y.scene) })); }
      errs.push(`${label} ${n}: ${X.guessed}; uso «${X.scene}».`);
    }
    const lay = norm(f.layout);
    const layout = isTime ? 'time' : /lado|side|izq|vert/.test(lay) ? 'lr' : /arriba|abajo|top|bottom|horiz/.test(lay) ? 'ab' : null;
    // objeto concreto: el que nombre el título o subtítulo de cada lado; si no, el del TITULO del guion
    const enA = (f.en.A || '').split('|'), enB = (f.en.B || '').split('|');
    const general = findObject(f.title, f.en.title);
    A.object = findObject(A.title, A.sub, enA[0], enA[1]) || general;
    if (B !== A) B.object = findObject(B.title, B.sub, enB[0], enB[1]) || general;
    // MOMENTOS: con «>» (sin A/B) = los sucesos del lado A (o del único camino en «tiempo»)
    if (!f.momA && f.stages && />/.test(f.stages)) { f.momA = f.stages; f.stages = ''; }
    A.moments = parseMomentList(f.momA);
    if (B !== A) B.moments = parseMomentList(f.momB);
    // UNA SOLA HISTORIA Y LUEGO SE DIVIDE: INICIO (escenas | personajes | acciones) y SEPARAR (segundo)
    let intro = null;
    const splitRaw = f.split ? parseFloat(String(f.split).replace(',', '.').replace(/[^0-9.]/g, '')) : NaN;
    if (!isTime && (f.intro || f.split)) {
      if (f.intro) {
        const [isc = '', ipe = '', iac = ''] = f.intro.split('|').map((x) => x.trim());
        intro = parseSide(` |  | ${isc} | ${ipe || 'hombre'} | ${iac} | crece`, theme, errs, label + ' INICIO');
      } else intro = { ...A, segments: A.segments ? [A.segments[0]] : null };
      intro = { ...intro, title: '', sub: '', good: true, bad: null, result: 'crece', object: null, moments: parseMomentList(f.momI) };
    }
    if (isTime && (f.intro || f.split)) errs.push(`${label}: INICIO y SEPARAR no valen en el tipo «tiempo».`);
    const stagesOf = (v, def) => { const l = (v || '').split('|').map((x) => x.trim()).filter(Boolean); return l.length === 3 ? l : def; };
    const enSide = (v, base) => {
      if (!v) return null;
      const [title = base.title, sub = base.sub] = v.split('|').map((x) => x.trim());
      return { title, sub };
    };
    scripts.push({
      id: `${Date.now().toString(36)}-${scripts.length}`,
      title: f.title || A.title,
      hasTitle: !!(f.title && f.title.trim()),
      theme,
      emotion: EMO_ALIAS[norm(f.emotion)] || THEME_EMO[theme],
      layout,
      hook: f.hook || '',
      phrase: f.phrase || '',
      bg: bgName(f.bg),
      plano: planoName(f.plano),
      intro, split: Number.isFinite(splitRaw) ? splitRaw : null,
      voz: parseVoz(f.voz, errs, label), subs: f.subs ? !/^(no|off|false|sin)/.test(norm(f.subs)) : true,
      angulo: anguloName(f.angulo),
      cover: coverSpec(f.cover),
      question: f.question || '',
      sides: isTime ? [A, A, A] : [A, B],
      stages: isTime ? stagesOf(f.stages, ['HOY', 'EN UN MES', 'EN UN AÑO']) : null,
      en: {
        title: f.en.title, cover: coverSpec(f.en.cover), voz: parseVoz(f.en.voz, errs, label + ' (EN)'), hook: f.en.hook, phrase: f.en.phrase, question: f.en.question,
        sides: [enSide(f.en.A, A), enSide(f.en.B, B)],
        stages: isTime ? stagesOf(f.en.stages, ['TODAY', 'IN A MONTH', 'IN A YEAR']) : null,
      },
    });
    errors.push(...errs);
  });
  return { scripts, errors };
}

export const SCENES_LIST = SCENE_NAMES;
