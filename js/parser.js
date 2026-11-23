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
};
function resolveAct(raw, scene) {
  const a = raw.replace(/\s+/g, '-');
  // acciones de uso real de objetos (tocar-guitarra, beber-cafe, montar-bici…) valen en cualquier escena
  if (USES[a]) return a;
  if (USE_ALIAS[a]) return USE_ALIAS[a];
  if (a === 'caer-bici' || a === 'levantarse-bici') return a;
  // «ausente»: no está en la escena; se dibuja pequeño en otro lugar (vale en cualquier escena)
  if (['ausente', 'no-viene', 'no-esta', 'no-llega', 'se-fue', 'absent', 'away', 'not-there'].includes(a)) return 'ausente';
  // «bailar»: bailan juntos (vale en cualquier escena)
  if (['bailar', 'baila', 'bailan', 'dance', 'dancing'].includes(a)) return 'bailar';
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
  let kinds = splitPeople(peopleRaw).map((p) => PERSON_ALIAS[p] || (p.startsWith('muj') ? 'mujer' : p.startsWith('ni') ? 'nino' : 'hombre'));
  // nunca se inventan personajes: si el lado no nombra a nadie, una sola persona
  if (!kinds.length) kinds = ['hombre'];
  kinds = kinds.slice(0, 4);
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
  if (segs.length > 4) { errs.push(`${label}: como mucho 4 escenas por lado; uso las 4 primeras.`); segs.length = 4; }
  // sin escena válida: se deduce de las acciones; si no, la del tema (nunca el puente con una sola persona)
  if (!segs.length) {
    const firstActs = norm(actGroups[0] || '').split(/\s*[+,]\s*/).filter(Boolean);
    let scene = Object.keys(SCENE_ACTS).find((sc) => firstActs.some((a) => SCENE_ACTS[sc].includes(a.replace(/\s+/g, '-'))));
    if (!scene) scene = THEME_SCENE[theme] || 'camino';
    if (kinds.length < 2 && (scene === 'puente' || scene === 'abrazo')) scene = 'camino';
    segs.push({ scene, actsRaw: actGroups[0] || '', guessed: sceneRaw ? `escena «${sceneRaw}» no existe` : 'falta la escena' });
  }
  const mkPeople = (scene, raw) => {
    let acts = norm(raw).split(/\s*[+,]\s*/).filter(Boolean).map((a) => resolveAct(a, scene));
    if (!acts.length) acts = ['construir'];
    return kinds.map((kind, i) => ({ kind, act: acts[Math.min(i, acts.length - 1)] }));
  };
  const segments = segs.map((g) => ({ scene: g.scene, people: mkPeople(g.scene, g.actsRaw) }));
  const scene = segments[0].scene, people = segments[0].people;
  // REGLA: lo que se ve coincide con lo que dice el texto. Si dice que alguien no viene / no está / se fue, va con «ausente».
  const said = norm(`${title} ${sub}`);
  if (/\b(no viene|no vino|no llega|nunca llega|nunca viene|no esta|no estan|se fue|se va de casa|no aparece|doesn'?t come|never comes|isn'?t there|not there|never shows)\b/.test(said) && !segments.some((g) => g.people.some((p) => p.act === 'ausente')) && people.length > 1)
    errs.push(`${label}: el texto dice que alguien no viene o no está, pero sale en la escena. Pon «ausente» en la acción de esa persona (ej.: esperar+ausente).`);
  const cls = classifyResult(resRaw, segments[segments.length - 1].scene);
  return { title, sub, scene, people, segments: segments.length > 1 ? segments : null, result: resRaw, guessed: segs[0].guessed || null, ...cls };
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
      // A-MOMENTOS: / B-MOMENTOS: (también MOMENTOS_A, A MOMENTOS…): sucesos de cada lado separados por «>»
      const mm = raw.match(/^\s*[#*\-\s]*(?:([AaBb])[\s_\-]*MOMENTOS|MOMENTOS[\s_\-]*([AaBb]))\s*:\s*(.*)$/i);
      if (mm) { f[`mom${(mm[1] || mm[2]).toUpperCase()}`] = mm[3].replace(/\*\*/g, '').trim(); continue; }
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
      question: f.question || '',
      sides: isTime ? [A, A, A] : [A, B],
      stages: isTime ? stagesOf(f.stages, ['HOY', 'EN UN MES', 'EN UN AÑO']) : null,
      en: {
        title: f.en.title, hook: f.en.hook, phrase: f.en.phrase, question: f.en.question,
        sides: [enSide(f.en.A, A), enSide(f.en.B, B)],
        stages: isTime ? stagesOf(f.en.stages, ['TODAY', 'IN A MONTH', 'IN A YEAR']) : null,
      },
    });
    errors.push(...errs);
  });
  return { scripts, errors };
}

export const SCENES_LIST = SCENE_NAMES;
