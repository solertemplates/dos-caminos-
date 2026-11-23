// Dos Caminos — SUCESOS (REGLA FIJA DE RITMO): algo nuevo y visible cada 2–3 s, nunca más de 3 s
// de la misma acción repetida. Cada lado puede traer sus MOMENTOS (A-MOMENTOS / B-MOMENTOS:
// «llueve > se cubren juntos > ella tropieza > él la sujeta > se ríen»); si no, la app elige
// sucesos variados para la escena. Aquí está: la lista de sucesos que se saben dibujar,
// cómo se lee cada frase, el reparto en el tiempo y el dibujo (escenario, personajes y contador).
import { POSES, lerpPose, walkPose, drawFigure as rawFigure, figureSize, WHITE, BG } from './figure.js';
import { glow, heart, RED, AMBER, GOLD, smooth, clamp } from './scenes.js';
import { drawObject } from './objects.js';

const nrm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ---------------------------------------------------------------------------
// Lista de sucesos que la app sabe dibujar (también va en MAESTRO.md, §«Sucesos»).
// kind: 'world' = pasa en el escenario · 'fig' = lo hace un personaje · 'ui' = el contador.
// weather: queda puesto hasta que otro suceso de tiempo lo cambie. move: el personaje se queda donde llegó.
export const MOMENTS = {
  llueve:   { kind: 'world', weather: true, out: true, sfx: 'drip', words: ['llueve', 'lluvia', 'tormenta', 'chubasco', 'llover', 'empieza a llover', 'rain', 'raining'] },
  sol:      { kind: 'world', weather: true, out: true, sfx: 'shimmer', words: ['sale el sol', 'el sol', 'sol', 'amanece', 'despeja', 'deja de llover', 'escampa', 'sun', 'sunrise'] },
  noche:    { kind: 'world', weather: true, out: true, sfx: 'low', words: ['anochece', 'noche', 'oscurece', 'se hace de noche', 'night'] },
  nieva:    { kind: 'world', weather: true, out: true, sfx: 'wind', words: ['nieva', 'nieve', 'snow'] },
  viento:   { kind: 'world', out: true, sfx: 'wind', words: ['viento', 'sopla', 'brisa', 'wind'] },
  rayo:     { kind: 'world', out: true, sfx: 'crash', words: ['rayo', 'relampago', 'trueno', 'thunder', 'lightning'] },
  pajaro:   { kind: 'world', out: true, sfx: 'whoosh', words: ['pajaro', 'pajaros', 'ave', 'aves', 'mariposa', 'bird', 'birds'] },
  fugaz:    { kind: 'world', out: true, sfx: 'shimmer', words: ['estrella fugaz', 'pide un deseo', 'deseo', 'shooting star'] },
  cae:      { kind: 'world', sfx: 'thud', words: ['algo cae', 'se cae', 'cae', 'caen', 'se rompe', 'se le cae', 'tira', 'suelta', 'falls', 'drops'] },
  llega:    { kind: 'world', move: true, sfx: 'step', words: ['alguien llega', 'llega', 'llegan', 'aparece', 'viene', 'entra', 'visita', 'arrives', 'someone'] },
  enciende: { kind: 'world', sfx: 'chime', words: ['se enciende', 'enciende', 'brilla', 'ilumina', 'luz', 'se prende', 'chispa', 'lights up', 'glows'] },
  apaga:    { kind: 'world', sfx: 'low', words: ['se apaga', 'apaga', 'humo', 'se enfria', 'goes out'] },
  contador: { kind: 'ui', sfx: 'blip', words: ['el contador salta', 'contador', 'pasa el tiempo', 'el tiempo pasa', 'pasan los dias', 'pasan las semanas', 'pasan los meses', 'pasan los anos', 'dias despues', 'semanas despues', 'meses despues', 'anos despues', 'time passes'] },
  corazon:  { kind: 'fig', sfx: 'shimmer', words: ['corazon', 'amor', 'te quiero', 'beso', 'besa', 'se enamora', 'love', 'heart'] },
  tropieza: { kind: 'fig', legs: true, sfx: 'thud', words: ['tropieza', 'tropiezan', 'resbala', 'trastabilla', 'tambalea', 'trips', 'stumbles'] },
  caerse:   { kind: 'fig', legs: true, sfx: 'thud', words: ['se cae', 'se caen', 'cae al suelo', 'falls down'] },
  sujeta:   { kind: 'fig', sfx: 'ping', words: ['la sujeta', 'lo sujeta', 'sujeta', 'ayuda', 'agarra', 'sostiene', 'da la mano', 'tiende la mano', 'levanta a', 'rescata', 'salva', 'apoya', 'catches', 'helps'] },
  abraza:   { kind: 'fig', sfx: 'shimmer', words: ['se abrazan', 'abraza', 'abrazan', 'abrazo', 'hug', 'hugs'] },
  rie:      { kind: 'fig', sfx: 'ping', words: ['se rie', 'se rien', 'rie', 'rien', 'risa', 'sonrie', 'sonrien', 'carcajada', 'feliz', 'felices', 'laugh', 'laughs', 'smile'] },
  celebra:  { kind: 'fig', legs: true, sfx: 'chime', words: ['celebra', 'celebran', 'salta', 'saltan', 'festeja', 'festejan', 'gana', 'ganan', 'baila', 'bailan', 'lo logra', 'lo logran', 'celebrates', 'jumps', 'dances'] },
  saluda:   { kind: 'fig', sfx: 'blip', words: ['saluda', 'saludan', 'se despide', 'despide', 'hola', 'adios', 'waves'] },
  movil:    { kind: 'fig', sfx: 'blip', words: ['no lo ve', 'no la ve', 'no los ve', 'no las ve', 'no mira', 'no escucha', 'mira el movil', 'mira el celular', 'celular', 'movil', 'telefono', 'pantalla', 'phone', "doesn't see"] },
  mira:     { kind: 'fig', sfx: null, words: ['mira', 'miran', 'observa', 'busca', 'voltea', 'levanta la vista', 'contempla', 'looks', 'watches'] },
  llora:    { kind: 'fig', sfx: 'low', words: ['llora', 'lloran', 'lagrima', 'lagrimas', 'cries', 'sad'] },
  cansa:    { kind: 'fig', sfx: null, words: ['se cansa', 'se cansan', 'cansado', 'cansada', 'suspira', 'agotado', 'agotada', 'suda', 'no puede', 'tired', 'sighs'] },
  sorpresa: { kind: 'fig', sfx: 'ping', words: ['se sorprende', 'sorprende', 'asombra', 'descubre', 'se asusta', 'sorpresa', 'de repente', 'surprised'] },
  piensa:   { kind: 'fig', sfx: null, words: ['piensa', 'duda', 'recuerda', 'imagina', 'se pregunta', 'extrana', 'thinks', 'remembers'] },
  sienta:   { kind: 'fig', legs: true, sfx: null, words: ['se sienta', 'se sientan', 'sentado', 'sentada', 'descansa', 'descansan', 'sits'] },
  aleja:    { kind: 'fig', move: true, legs: true, sfx: 'step', words: ['se aleja', 'se alejan', 'se va', 'se van', 'se marcha', 'da la espalda', 'abandona', 'leaves', 'walks away'] },
  acerca:   { kind: 'fig', move: true, legs: true, sfx: 'step', words: ['se acerca', 'se acercan', 'vuelve', 'regresa', 'corre hacia', 'va hacia', 'comes back', 'comes closer'] },
  cubre:    { kind: 'fig', sfx: null, words: ['se cubre', 'se cubren', 'cubre', 'cubren', 'se tapa', 'se protege', 'paraguas', 'covers'] },
  duerme:   { kind: 'fig', sfx: null, words: ['duerme', 'duermen', 'bosteza', 'se duerme', 'dormido', 'sleeps', 'yawns'] },
  // REGLA FIJA DE EMOCIONES: gestos que cuentan la historia (cada uno con un significado claro)
  ansiedad:  { kind: 'fig', emo: true, legs: true, sfx: 'low', words: ['ansiedad', 'ansioso', 'ansiosa', 'nervioso', 'nerviosa', 'se agobia', 'agobiada', 'agobiado', 'se preocupa', 'preocupada', 'preocupado', 'anxious', 'worried'] },
  ilusion:   { kind: 'fig', emo: true, face: 'target', sfx: 'ping', words: ['espera con ilusion', 'esperar con ilusion', 'esperar-con-ilusion', 'con ilusion', 'ilusionada', 'ilusionado', 'ilusion', 'de puntillas', 'emocionada', 'emocionado', 'hopeful', 'excited'] },
  tristeza:  { kind: 'fig', emo: true, legs: true, sfx: 'low', words: ['tristeza', 'se pone triste', 'triste', 'baja la cabeza', 'se sienta despacio', 'hombros caidos', 'sadness'] },
  distraido: { kind: 'fig', emo: true, face: 'away', sfx: 'blip', words: ['distraido', 'distraida', 'esta en otra cosa', 'en otra cosa', 'se rie con la pantalla', 'de espaldas', 'mira a otro lado', 'no hace caso', 'ignora', 'no contesta', 'distracted', 'ignores'] },
  'dar-corazon':     { kind: 'fig', emo: true, face: 'target', approach: 0.62, sfx: 'shimmer', words: ['dar corazon', 'da un corazon', 'le da un corazon', 'le da su corazon', 'entrega un corazon', 'le entrega un corazon', 'pasa un corazon', 'le pasa un corazon', 'gives a heart'] },
  'recibir-corazon': { kind: 'fig', emo: true, face: 'target', sfx: 'chime', words: ['recibir corazon', 'recibe el corazon', 'recibe un corazon', 'coge el corazon', 'toma el corazon', 'guarda el corazon', 'lo guarda en el pecho', 'receives the heart'] },
  'estoy-contigo':   { kind: 'fig', emo: true, face: 'target', approach: 0.42, sfx: 'ping', words: ['estoy contigo', 'mano en el hombro', 'le pone la mano en el hombro', 'la acompana', 'lo acompana', 'le acompana', "i'm with you"] },
  pedir:     { kind: 'fig', emo: true, face: 'target', sfx: null, words: ['pedir', 'pide', 'le pide', 'pide atencion', 'pide con las manos', 'le tiende las manos', 'suplica', 'asks', 'begs'] },
  alegria:   { kind: 'fig', emo: true, legs: true, sfx: 'chime', words: ['alegria', 'con alegria', 'aplaude', 'aplauden', 'salta de alegria', 'se alegra', 'se alegran', 'joy', 'claps'] },
  'abrazo-largo':    { kind: 'fig', emo: true, face: 'target', approach: 'mid', sfx: 'shimmer', words: ['abrazo largo', 'un abrazo largo', 'se abrazan largo', 'abrazo-largo', 'se mecen', 'long hug'] },
  contraste: { kind: 'pair', words: [] }, // lado malo: uno pide o espera con ilusión y el otro está distraído
  reaccion: { kind: 'fig', sfx: 'ping', words: [] }, // frase que no se reconoce: el personaje reacciona (gira la cabeza y rayitas de atención)
  insiste:  { kind: 'fig', sfx: 'tock', words: ['sigue', 'siguen', 'insiste', 'lo intenta', 'otra vez', 'se esfuerza', 'trabaja', 'construye', 'keeps going', 'tries again'] },
};
// En MAESTRO.md: el nombre de cada suceso y una forma de escribirlo.
export const MOMENT_LIST = Object.keys(MOMENTS);

const PHRASES = Object.entries(MOMENTS).flatMap(([type, m]) => m.words.map((w) => [nrm(w), type])).sort((a, b) => b[0].length - a[0].length);
const PERSON_WORDS = [
  [/\b(nino|hijo|nene|chico|boy)\b/, 'nino'], [/\b(nina|hija|nena|chica|girl)\b/, 'nina'],
  [/\b(hombre|papa|padre|esposo|abuelo|novio|el hombre|man|he|him)\b/, 'hombre'], [/\b(mujer|mama|madre|esposa|abuela|novia|ella|woman|she|her)\b/, 'mujer'],
];
const PLURAL = /\b(juntos|juntas|los dos|las dos|ambos|ambas|todos|los tres|together|both|they)\b|\bse \w+(an|en)\b|^\w+(an|en)\b/;

// Lee una frase de MOMENTOS → { type, who: índice | 'all', target, text }
export function classifyMoment(text, people) {
  const raw = String(text || '').toLowerCase();
  const n = ' ' + nrm(text).replace(/[^a-z0-9ñ' ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  let best = null;
  for (const [w, type] of PHRASES) {
    const i = n.indexOf(' ' + w + ' ');
    if (i < 0) continue;
    if (!best || i < best.i || (i === best.i && w.length > best.w.length)) best = { i, w, type };
  }
  // sujeto: la primera persona que nombra la frase («él» con tilde, ella, el niño, mamá…)
  const kinds = (people || []).map((p) => p.kind);
  const cands = [];
  const el = raw.search(/(^|[^a-záéíóúñ])él([^a-záéíóúñ]|$)/);
  if (el >= 0) cands.push({ pos: el, kind: 'hombre' });
  for (const [re, k] of PERSON_WORDS) { const m = n.match(re); if (m) cands.push({ pos: m.index, kind: k }); }
  cands.sort((x, y) => x.pos - y.pos);
  const subj = cands.length ? cands[0].kind : null;
  const idxOf = (k) => {
    if (!k) return -1;
    let i = kinds.indexOf(k);
    if (i < 0) i = kinds.indexOf({ hombre: 'nino', mujer: 'nina', nino: 'hombre', nina: 'mujer' }[k]);
    return i;
  };
  let who = idxOf(subj);
  const plural = PLURAL.test(n.trim());
  let type = best ? best.type : 'reaccion';
  // «se cae» / «cae»: si lo hace una persona es caerse; si no, cae un objeto
  const thing = /algo|objeto|vaso|plato|hoja|manzana|libro|taza|ladrillo|tabla|maceta|pelota|cuadro|foto|carta|llave|moneda/.test(n);
  if ((type === 'cae' || type === 'caerse') && !thing) type = who >= 0 || plural || /\bse caen?\b/.test(n) ? 'caerse' : 'cae';
  if (type === 'caerse' && /algo|objeto|vaso|plato|hoja|manzana|libro|taza|ladrillo|tabla|maceta|pelota/.test(n) && who < 0) type = 'cae';
  // «él llega» con un personaje que ya está = se acerca; «llega alguien / su hijo» = alguien nuevo
  if (type === 'llega' && (kinds.includes(subj) || (plural && !subj)) && !/alguien|amigo|amiga|vecino|vecina|someone|friend/.test(n) && kinds.length) type = 'acerca';
  const M = MOMENTS[type];
  if (M && M.kind === 'fig' && who < 0) who = plural || ['abraza', 'rie', 'celebra', 'cubre', 'abrazo-largo', 'alegria'].includes(type) && kinds.length > 1 ? 'all' : 0;
  if (M && M.kind === 'fig' && plural && who !== 'all' && !/\b(la|lo|le|a ella|a el)\b/.test(n)) who = 'all';
  const target = typeof who === 'number' && kinds.length > 1 ? (who === 0 ? 1 : 0) : -1;
  // si llega alguien nuevo: de qué tipo (el que nombre la frase y no esté ya en escena)
  let newcomer = null;
  if (type === 'llega') {
    // solo llega alguien si la frase lo nombra (su hijo, un amigo, la abuela…); si no, nadie nuevo sale en pantalla
    for (const [re, k] of PERSON_WORDS) if (re.test(n)) { newcomer = k; break; }
    if (!newcomer && /\bamig[oa]s?\b|\bvecin[oa]\b|\bfriend\b|\bneighbou?r\b/.test(n)) newcomer = /amiga|vecina/.test(n) ? 'mujer' : 'hombre';
    if (!newcomer) return { type: 'sorpresa', who: kinds.length > 1 ? 'all' : 0, target: -1, newcomer: null, text: String(text || '').trim() };
  }
  return { type, who: who < 0 ? 0 : who, target, newcomer, text: String(text || '').trim() };
}

export function parseMomentList(v) {
  return String(v || '').split(/>|→|->|·/).map((s) => s.trim()).filter(Boolean).slice(0, 8);
}

// ---------------------------------------------------------------------------
// Reparto en el tiempo
const INDOOR = new Set(['mesa', 'cocina', 'oficina', 'sofa', 'cama', 'libros', 'reloj', 'regalo', 'gimnasio']);
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// «Nada de moverse por moverse»: la app solo elige sucesos con significado.
// Lado bueno: cuando no hay otro suceso se pasan corazoncitos. Lado malo: contraste (uno pide o espera, el otro distraído).
const POOL = {
  // (la app nunca añade por su cuenta a alguien que llega: solo salen los personajes del guion)
  good: ['dar-corazon', 'alegria', 'rie', 'corazon', 'enciende', 'contador', 'viento', 'fugaz', 'sol', 'celebra'],
  bad: ['contraste', 'tristeza', 'ansiedad', 'cansa', 'apaga', 'contador', 'viento', 'llueve', 'noche', 'cae', 'rayo'],
  goodLate: ['dar-corazon', 'abrazo-largo', 'alegria', 'corazon', 'celebra', 'enciende'],
  badLate: ['contraste', 'tristeza', 'llora', 'apaga', 'noche', 'cansa'],
  light: { good: ['dar-corazon', 'corazon', 'enciende', 'contador', 'rie'], bad: ['contraste', 'cansa', 'tristeza', 'apaga', 'contador'] },
  first: { good: ['dar-corazon', 'enciende', 'contador'], bad: ['contraste', 'contador', 'apaga'] },
};
const ONCE = new Set(['llega', 'sol', 'noche', 'llueve', 'nieva', 'fugaz', 'rayo', 'celebra', 'abraza', 'abrazo-largo']);
// quien está «en otra cosa» en el lado malo
const CONTRAST = new Set(['distraido', 'pedir', 'ilusion', 'contraste']);
const DISTRACT = new Set(['celular', 'phone', 'ignorar', 'olvidar', 'perder', 'guardar', 'dormir', 'ausente']);

function autoPick(R, pool, ctx) {
  const ok = pool.filter((t) => {
    const M = MOMENTS[t];
    if (!M) return false;
    if (t === ctx.prev || t === ctx.next) return false;
    if (ONCE.has(t) && ctx.used.has(t)) return false;
    if (M.out && ctx.indoor) return false;
    if ((M.kind === 'fig' || M.kind === 'pair') && ctx.noFig) return false;
    if ((t === 'abraza' || t === 'abrazo-largo' || t === 'dar-corazon') && ctx.n < 2) return false;
    if (t === 'contraste' && (!ctx.pair || CONTRAST.has(ctx.prev) || CONTRAST.has(ctx.next))) return false;
    if (t === 'llega' && ctx.n >= 2) return false;
    if (t === 'sol' && !ctx.used.has('llueve') && !ctx.used.has('noche') && R() < 0.5) return false;
    return true;
  });
  // el menos usado hasta ahora (variedad: nunca el mismo suceso una y otra vez)
  const cnt = (x) => ctx.count[x] || 0;
  const min = Math.min(...ok.map(cnt));
  const best = ok.filter((x) => cnt(x) === min);
  const t = best.length ? best[Math.floor(R() * best.length)] : 'contador';
  ctx.count[t] = cnt(t) + 1;
  ctx.used.add(t);
  ctx.prev = t;
  return t;
}

function autoMoment(type, R, people, ctx) {
  const n = people.length;
  const M = MOMENTS[type];
  // en el lado malo, la tristeza, la ansiedad o el cansancio son de quien pide o espera (no del distraído)
  if (ctx.pair && ['tristeza', 'ansiedad', 'cansa', 'llora', 'pedir', 'ilusion'].includes(type)) return { type, who: ctx.pair.ask, target: ctx.pair.dis, auto: true, x: R() };
  // si el otro está ausente, quien espera no le pide a nadie: espera con ilusión, se agobia o se pone triste
  if (type === 'contraste') return { type, ask: ctx.pair.ask, dis: ctx.pair.dis, askType: people[ctx.pair.dis]?.act === 'ausente' ? ['ilusion', 'ansiedad', 'tristeza'][Math.floor(R() * 3)] : R() < 0.5 ? 'pedir' : 'ilusion', auto: true };
  let who = 0;
  if (type === 'dar-corazon') {
    ctx.giver = ctx.giver == null ? (R() < 0.5 ? 0 : 1) : (ctx.giver + 1) % n;
    // si el siguiente suceso del guion es otro corazón, este lo da el otro (se lo devuelven)
    if (ctx.next === 'dar-corazon' && typeof ctx.nextWho === 'number' && ctx.giver === ctx.nextWho) ctx.giver = (ctx.giver + 1) % n;
    who = ctx.giver;
  }
  else if (M.kind === 'fig') who = n > 1 && ['rie', 'celebra', 'abraza', 'abrazo-largo', 'alegria'].includes(type) ? 'all' : Math.floor(R() * Math.max(1, n));
  return { type, who, target: typeof who === 'number' && n > 1 ? (who ? 0 : 1) : -1, newcomer: type === 'llega' ? (people.some((p) => /nin/.test(p.kind)) ? 'hombre' : 'nino') : null, auto: true, x: R() };
}

// plan de un lado: lista ordenada de { type, who, t0, t1, ... }
function sidePlan({ user, T0, T1, seed, role, people, scene, arcWin, late0 }) {
  const R = rng(seed);
  const di = people.findIndex((p) => DISTRACT.has(p.act));
  const ai = people.findIndex((p, i) => i !== di && !DISTRACT.has(p.act));
  const ctx = { prev: null, used: new Set(), count: {}, indoor: INDOOR.has(scene), n: people.length, noFig: false, pair: di >= 0 && ai >= 0 ? { ask: ai, dis: di } : null };
  const span = T1 - T0;
  const out = [];
  const roleKey = role === 'bad' ? 'bad' : 'good';
  const put = (m, t0, t1) => {
    const fig = MOMENTS[m.type]?.kind === 'fig';
    // durante el arco (caída común y rendirse) los personajes ya hacen lo suyo: el suceso se queda en un símbolo
    if (fig && arcWin && t1 > arcWin[0] && t0 < arcWin[1]) m = { ...m, iconOnly: true };
    if (m.type === 'llega') m = { ...m, fromLeft: R() < 0.5 };
    if (m.type === 'contraste') {
      // los dos a la vez: uno pide (o espera con ilusión) mirando al otro; el otro, distraído y de espaldas
      const inArc = !!(arcWin && t1 > arcWin[0] && t0 < arcWin[1]);
      out.push({ type: m.askType, who: m.ask, target: m.dis, auto: true, iconOnly: inArc, t0, t1 });
      out.push({ type: 'distraido', who: m.dis, target: m.ask, auto: true, iconOnly: inArc, t0, t1 });
      return;
    }
    out.push({ ...m, t0, t1 });
  };
  let list = user.slice();
  const maxN = Math.max(1, Math.floor(span / 1.6));
  if (list.length > maxN) { const step = (list.length - 1) / (maxN - 1); list = Array.from({ length: maxN }, (_, k) => list[Math.round(k * step)]); }
  if (list.length) {
    const slot = span / list.length;
    const parts = Math.max(1, Math.ceil(slot / 3 - 1e-6));
    const part = slot / parts;
    list.forEach((m, j) => {
      const s0 = T0 + j * slot;
      ctx.prev = m.type; ctx.used.add(m.type); ctx.next = list[j + 1]?.type; ctx.nextWho = list[j + 1]?.who;
      if (m.type === 'dar-corazon' && typeof m.who === 'number') ctx.giver = m.who; // el siguiente corazón lo da el otro
      put(m, s0, s0 + part);
      for (let q = 1; q < parts; q++) {
        const ts = s0 + q * part;
        ctx.noFig = !!(arcWin && ts + part > arcWin[0] && ts < arcWin[1]);
        // lado bueno: cuando no hay otro suceso se pasan corazoncitos; lado malo: el contraste
        const filler = !ctx.noFig && roleKey === 'good' && ctx.n >= 2 ? 'dar-corazon' : !ctx.noFig && roleKey === 'bad' && ctx.pair && !CONTRAST.has(ctx.prev) && !CONTRAST.has(ctx.next) ? 'contraste' : autoPick(R, POOL.light[roleKey], ctx);
        put(autoMoment(filler, R, people, ctx), ts, ts + part);
      }
    });
  } else {
    const n = Math.max(2, Math.round(span / 2.5));
    const slot = span / n;
    for (let j = 0; j < n; j++) {
      const ts = T0 + j * slot;
      const late = ts >= late0;
      ctx.noFig = !!(arcWin && ts + slot > arcWin[0] && ts < arcWin[1]);
      const pool = late ? POOL[roleKey + 'Late'] : POOL[roleKey];
      // uno de cada dos: corazoncitos (bueno) o contraste (malo), si hay dos personas
      const every = j % 2 === 1 && !ctx.noFig && (roleKey === 'good' ? (ctx.n >= 2 ? 'dar-corazon' : null) : ctx.pair ? 'contraste' : null);
      put(autoMoment(every || autoPick(R, j === 0 ? POOL.first[roleKey] : pool, ctx), R, people, ctx), ts, ts + slot);
    }
  }
  return out;
}

// plans[i] = sucesos del panel i. info: { roles, mode, tD, arcEnd }
export function planMoments(job, info) {
  const tl = job.tl;
  const T0 = tl.mainStart + 0.75, T1 = tl.endStart;
  const isTime = job.layout.kind === 'time';
  const roles = info.roles;
  const gi = roles ? roles.indexOf('good') : -1;
  const arcWin = roles ? [info.tD - 0.3, info.arcEnd] : null;
  const late0 = T0 + (T1 - T0) * 0.62;
  const drawn = (i) => (roles && roles[i] === 'bad' ? job.sides[gi] : job.sides[i]);
  const mk = (i, seedK) => {
    const side = job.sides[i], ds = drawn(i);
    const user = (side.moments || []).map((txt) => ({ ...classifyMoment(txt, ds.people) }));
    return sidePlan({ user, T0, T1, seed: job.seed * 7 + seedK, role: roles ? roles[i] : isTime ? 'good' : side.good ? 'good' : 'bad', people: ds.people, scene: ds.scene, arcWin, late0 });
  };
  if (isTime) {
    const one = mk(0, 1);
    // cada suceso va a la franja que se está revelando en ese momento
    const pAt = (t) => clamp((t - T0) / (tl.resStart - T0));
    for (const e of one) e.panel = Math.min(2, Math.floor(pAt((e.t0 + e.t1) / 2) * 3));
    return [0, 1, 2].map((i) => one.filter((e) => e.panel === i || (i === 2 && e.t0 >= tl.resStart)));
  }
  const plans = job.sides.map((s, i) => mk(i, (roles ? 1 : i + 1) * 31));
  // REGLA DEL ARCO: en «se rinde», antes del momento difícil los dos lados son idénticos (mismos sucesos)
  if (roles) {
    const bi = roles.indexOf('bad');
    const own = plans[bi].filter((e) => e.t0 >= info.tD);
    plans[bi] = plans[gi].filter((e) => e.t0 < info.tD).map((e) => ({ ...e, t1: Math.min(e.t1, info.tD + 0.35) })).concat(own); // se apaga después de tD (antes, idéntico)
    // y el bueno no cambia lo suyo antes de tD (su plan es la referencia)
  }
  return plans;
}

// ---------------------------------------------------------------------------
// Estado en el tiempo t para un panel: sucesos activos (con su intensidad), el tiempo atmosférico
// y los movimientos que se quedan (se aleja / se acerca).
export function momentsNow(plan, t) {
  const act = [];
  let weather = null, weatherPrev = null;
  const moves = [];
  const lastFig = {};
  for (const e of plan || []) {
    if (e.t0 > t) break;
    const M = MOMENTS[e.type] || {};
    if (M.kind === 'fig' && !M.move) { if (e.who === 'all') { for (const k in lastFig) lastFig[k] = null; lastFig.all = e; } else { lastFig[e.who] = e; } }
    if (M.weather) { weatherPrev = weather; weather = e; }
    if (M.move || M.approach) moves.push(e);
    if (t <= e.t1) {
      const k = clamp((t - e.t0) / (e.t1 - e.t0));
      const env = smooth((t - e.t0) / 0.3) * (1 - smooth((t - e.t1 + 0.32) / 0.32));
      act.push({ ...e, k, env, lt: t - e.t0, dur: e.t1 - e.t0 });
    }
  }
  // posiciones de cada personaje en el fotograma anterior (para mirar, acercarse o dar el corazón al otro)
  const pos = plan ? plan.pos || (plan.pos = {}) : {};
  // la tristeza se queda: sigue sentado y cabizbajo hasta su siguiente gesto
  const hold = Object.values(lastFig).filter((e) => e && e.type === 'tristeza' && t > e.t1 && !e.iconOnly);
  return { act, weather, weatherPrev, moves, t, pos, hold };
}

// ---------------------------------------------------------------------------
// Dibujo: escenario (antes de los textos). S: estado de la escena con S.box = { l, r, top, bot } y S.F.
const sR = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };

function drawRain(ctx, S, a, t, heavy = 1) {
  const { l, r, top } = S.box;
  ctx.save();
  ctx.strokeStyle = '#BFC6CF';
  ctx.lineWidth = Math.max(1, S.F * 0.006);
  ctx.globalAlpha = 0.45 * a;
  const n = Math.round(46 * heavy);
  const hgt = -top;
  for (let i = 0; i < n; i++) {
    const x = l + sR(i + 0.3) * (r - l);
    const y = top + ((sR(i + 7.1) * hgt + t * S.F * 2.6) % hgt);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - S.F * 0.02, y + S.F * 0.09); ctx.stroke();
  }
  // gotitas que salpican en el suelo
  ctx.globalAlpha = 0.35 * a;
  for (let i = 0; i < 8; i++) {
    const x = l + sR(i + 3.7) * (r - l), ph = (t * 1.7 + sR(i)) % 1;
    ctx.beginPath(); ctx.arc(x, -2, S.F * 0.03 * ph, Math.PI, 0); ctx.stroke();
  }
  ctx.restore();
}
function drawSnow(ctx, S, a, t) {
  const { l, r, top } = S.box;
  ctx.save(); ctx.fillStyle = WHITE; ctx.globalAlpha = 0.6 * a;
  const hgt = -top;
  for (let i = 0; i < 40; i++) {
    const y = top + ((sR(i + 2.2) * hgt + t * S.F * 0.35) % hgt);
    const x = l + sR(i + 9.9) * (r - l) + Math.sin(t * 1.3 + i) * S.F * 0.04;
    ctx.beginPath(); ctx.arc(x, y, S.F * (0.008 + 0.006 * sR(i)), 0, 7); ctx.fill();
  }
  ctx.restore();
}
// sitio del sol o la luna: arriba a la derecha, por debajo de los títulos
function skySpot(S) { const { r, top } = S.box; return [r - S.F * 0.5, top + Math.max(S.F * 0.85, -top * 0.38)]; }
function drawSun(ctx, S, a, k) {
  const [x, y0] = skySpot(S);
  const y = y0 + S.F * 0.25 * (1 - smooth(k * 1.5));
  glow(ctx, x, y, S.F * 0.75, AMBER, 0.35 * a);
  ctx.save(); ctx.globalAlpha = 0.9 * a; ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(x, y, S.F * 0.11, 0, 7); ctx.fill();
  ctx.strokeStyle = GOLD; ctx.lineWidth = S.F * 0.012;
  for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + k; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * S.F * 0.16, y + Math.sin(an) * S.F * 0.16); ctx.lineTo(x + Math.cos(an) * S.F * 0.22, y + Math.sin(an) * S.F * 0.22); ctx.stroke(); }
  ctx.restore();
}
function drawNight(ctx, S, a) {
  const { l, r, top, bot } = S.box;
  ctx.save(); ctx.globalAlpha = 0.26 * a; ctx.fillStyle = BG; ctx.fillRect(l, top, r - l, bot - top); ctx.restore();
  const [x, y] = skySpot(S);
  ctx.save(); ctx.globalAlpha = 0.85 * a; ctx.fillStyle = '#E9E4D6';
  ctx.beginPath(); ctx.arc(x, y, S.F * 0.1, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(x + S.F * 0.05, y - S.F * 0.03, S.F * 0.09, 0, 7); ctx.fill();
  ctx.restore();
}
function drawWind(ctx, S, a, k) {
  const { l, r, top } = S.box;
  ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1.2, S.F * 0.008); ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const y = top * (0.25 + 0.13 * i), x = l + (r - l) * ((k * 1.4 + i * 0.17) % 1.2 - 0.1);
    ctx.globalAlpha = 0.35 * a;
    ctx.beginPath(); ctx.moveTo(x - S.F * 0.5, y); ctx.quadraticCurveTo(x - S.F * 0.2, y - S.F * 0.05, x, y); ctx.arc(x, y - S.F * 0.04, S.F * 0.04, Math.PI / 2, -Math.PI / 2, true); ctx.stroke();
  }
  // hojitas que vuelan
  ctx.fillStyle = AMBER;
  for (let i = 0; i < 3; i++) {
    const x = l + (r - l) * ((k * 1.2 + i * 0.3) % 1.1), y = top * (0.3 + 0.15 * i) + Math.sin(k * 12 + i) * S.F * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9 + i); ctx.globalAlpha = 0.7 * a;
    ctx.beginPath(); ctx.ellipse(0, 0, S.F * 0.03, S.F * 0.014, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function drawBolt(ctx, S, a, lt) {
  const { l, r, top, bot } = S.box;
  const f = Math.max(0, 1 - lt / 0.25) + (lt > 0.35 && lt < 0.45 ? 0.6 : 0);
  if (f > 0) { ctx.save(); ctx.globalAlpha = 0.22 * f * a; ctx.fillStyle = WHITE; ctx.fillRect(l, top, r - l, bot - top); ctx.restore(); }
  const vis = lt < 0.7 ? 1 : 1 - smooth((lt - 0.7) / 0.4);
  if (vis <= 0) return;
  const x0 = l + (r - l) * 0.72;
  ctx.save(); ctx.strokeStyle = '#FFF4D6'; ctx.lineWidth = S.F * 0.016; ctx.globalAlpha = vis * a; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x0, top + S.F * 0.2);
  ctx.lineTo(x0 - S.F * 0.12, top * 0.6); ctx.lineTo(x0 + S.F * 0.02, top * 0.55); ctx.lineTo(x0 - S.F * 0.1, top * 0.25); ctx.stroke();
  ctx.restore();
}
function drawBirds(ctx, S, a, k) {
  const { l, r, top } = S.box;
  ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1.3, S.F * 0.01); ctx.globalAlpha = 0.75 * a; ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const x = l + (r - l) * (k * 1.15 - 0.08 - i * 0.07), y = top * (0.55 - 0.06 * i) + Math.sin(k * 6 + i) * S.F * 0.04;
    const fl = Math.sin(k * 40 + i * 2) * S.F * 0.035, s = S.F * 0.06;
    ctx.beginPath(); ctx.moveTo(x - s, y - fl); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - fl); ctx.stroke();
  }
  ctx.restore();
}
function drawShooting(ctx, S, a, k) {
  const { l, r, top } = S.box;
  const q = smooth(k / 0.5);
  if (k > 0.75) return;
  const x = l + (r - l) * (0.15 + 0.6 * q), y = top * (0.85 - 0.25 * q);
  const g = ctx.createLinearGradient(x - S.F * 0.5, y - S.F * 0.2, x, y);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,240,210,0.9)');
  ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = S.F * 0.012; ctx.globalAlpha = a * (1 - smooth((k - 0.5) / 0.25));
  ctx.beginPath(); ctx.moveTo(x - S.F * 0.5, y - S.F * 0.2); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
  glow(ctx, x, y, S.F * 0.12, '#FFF0D2', 0.8 * a * (1 - k));
}
function focusPoint(S) {
  if (S.focus) return S.focus;
  if (S.objSpot) return S.objSpot;
  return [0, -S.F * 1.1];
}
function drawFallingThing(ctx, S, e, a, k) {
  const { l, r, top } = S.box;
  const x = l + (r - l) * (0.25 + 0.5 * (e.x ?? 0.5));
  const fall = clamp(k / 0.42);
  const y0 = top * 0.8, yG = -S.F * 0.06;
  let y = y0 + (yG - y0) * fall * fall;
  if (k > 0.42) { const b = (k - 0.42) / 0.3; y = yG - S.F * 0.12 * Math.max(0, Math.sin(Math.min(1, b) * Math.PI)) * 0.6; }
  const name = S.object || 'manzana';
  drawObject(ctx, name, x, y, S.F * 0.22, { rot: k < 0.42 ? k * 6 : 0, fade: 0 });
  if (k > 0.42 && k < 0.6) { ctx.save(); ctx.strokeStyle = WHITE; ctx.globalAlpha = 0.5 * a; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(x + i * S.F * 0.08, -2); ctx.lineTo(x + i * S.F * 0.16, -S.F * 0.04); ctx.stroke(); } ctx.restore(); }
}
function drawNewcomer(ctx, S, e, t) {
  // alguien llega desde el borde (el más libre), camina con pasos que avanzan lo que se desplaza y saluda
  const side = e.fromLeft ? -1 : 1;
  const { l, r } = S.box;
  const edge = side > 0 ? r + S.F * 0.3 : l - S.F * 0.3;
  const stop = side > 0 ? r - S.F * 0.42 : l + S.F * 0.42;
  const lt = t - e.t0;
  const walkT = Math.min(1.4, (e.t1 - e.t0) * 0.55);
  const k = clamp(lt / walkT);
  const x = edge + (stop - edge) * smooth(k);
  const dist = Math.abs(stop - edge) * smooth(k);
  let pose = k < 1 ? walkPose(dist / (S.F * 0.4) * Math.PI) : POSES.stand;
  if (k >= 1) {
    const w = clamp((lt - walkT) / 0.3);
    pose = lerpPose(POSES.stand, { ...POSES.stand, fa1: 2.6, fa2: 2.7 + 0.35 * Math.sin(lt * 10) }, w * (1 - clamp((lt - walkT - 1.1) / 0.3)));
  }
  rawFigure(ctx, { x, pose, F: S.F, facing: -side, kind: e.newcomer || 'nino', alpha: clamp(lt / 0.2) });
}

// sucesos del escenario (se dibujan después de la escena y antes de los textos)
export function drawWorldMoments(ctx, S, now) {
  if (!now) return;
  const t = now.t;
  // tiempo atmosférico que se queda
  const wx = (e, a) => {
    if (!e) return;
    const k = clamp((t - e.t0) / Math.max(0.5, e.t1 - e.t0));
    if (e.type === 'llueve') drawRain(ctx, S, a, t);
    else if (e.type === 'nieva') drawSnow(ctx, S, a, t);
    else if (e.type === 'noche') drawNight(ctx, S, a);
    else if (e.type === 'sol') drawSun(ctx, S, a, k);
  };
  if (now.weather) {
    const inA = smooth((t - now.weather.t0) / 0.6);
    if (now.weatherPrev && inA < 1) wx(now.weatherPrev, 1 - inA);
    wx(now.weather, inA);
  }
  for (const e of now.moves) if (e.type === 'llega') drawNewcomer(ctx, S, e, t);
  for (const e of now.act) {
    const a = e.env;
    if (e.type === 'viento') drawWind(ctx, S, a, e.k);
    else if (e.type === 'rayo') drawBolt(ctx, S, a, e.lt);
    else if (e.type === 'pajaro') drawBirds(ctx, S, a, e.k);
    else if (e.type === 'fugaz') drawShooting(ctx, S, a, e.k);
    else if (e.type === 'cae') drawFallingThing(ctx, S, e, a, e.k);
    else if (e.type === 'enciende') {
      const [x, y] = focusPoint(S);
      const pulse = 0.7 + 0.3 * Math.sin(e.lt * 6);
      glow(ctx, x, y, S.F * 0.75 * a, AMBER, 0.55 * a * pulse);
      sparkles(ctx, x, y, S.F * 0.35, e.lt, a, GOLD);
    } else if (e.type === 'apaga') {
      const [x, y] = focusPoint(S);
      ctx.save(); ctx.strokeStyle = '#9A9A9A'; ctx.lineWidth = Math.max(1.4, S.F * 0.01);
      for (let i = 0; i < 3; i++) { const q = (e.k * 1.3 + i * 0.25) % 1; ctx.globalAlpha = 0.5 * a * (1 - q); ctx.beginPath(); ctx.arc(x + Math.sin(q * 7 + i) * S.F * 0.06, y - q * S.F * 0.6, S.F * (0.04 + 0.06 * q), 0, 7); ctx.stroke(); }
      ctx.restore();
    }
  }
}

function sparkles(ctx, x, y, rad, lt, a, color = WHITE) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.3, rad * 0.04); ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const an = i * Math.PI / 3 + lt * 0.8, q = (lt * 1.6 + i * 0.17) % 1;
    const d = rad * (0.6 + 0.5 * q), s = rad * 0.12 * (1 - q);
    const cx = x + Math.cos(an) * d, cy = y + Math.sin(an) * d;
    ctx.globalAlpha = a * (1 - q);
    ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Personajes: cada suceso de personaje cambia la pose como lo haría una persona (REGLA DE MOVIMIENTO)
// y deja un pequeño símbolo (corazón, gotitas, «!», puntitos…) para que se vea aunque esté sentado o acostado.
const UPPER = ['tr', 'hd', 'fa1', 'fa2', 'ba1', 'ba2'];
// acciones en las que la escena une una herramienta a la mano (cuchara, regadera, tabla, volante…):
// esos personajes reaccionan con la cabeza, el torso y el símbolo, sin soltar la herramienta
export const BUSY_ACTS = new Set(['construir', 'trabajar', 'build', 'work', 'regar', 'cuidar', 'cocinar', 'sembrar', 'escribir', 'vender', 'ahorrar', 'gastar', 'entrenar', 'conducir', 'escalar', 'aprovechar', 'dar', 'leer', 'subir', 'orar', 'orar-domingo']);
const upperOf = (base, p) => { const o = { ...base }; for (const k of UPPER) if (p[k] !== undefined) o[k] = p[k]; return o; };

function poseFor(type, base, lt, e, standing) {
  const sw = (f, a = 1) => Math.sin(lt * f) * a;
  const k = e.k ?? 0;
  switch (type) {
    case 'corazon': return { ...base, ...pick(POSES.heart) };
    case 'tropieza': {
      const q = clamp(lt / 0.45), back = clamp((lt - 0.7) / 0.6);
      const trip = { tr: 0.55, hd: -0.1, fa1: 1.5, fa2: 1.7, ba1: 1.1, ba2: 1.4, fl1: 0.75, fl2: -0.35, bl1: -0.35, bl2: -0.2 };
      return lerpPose(lerpPose(base, standing ? trip : upperOf(base, trip), smooth(q)), base, smooth(back));
    }
    case 'caerse': return standing ? { ...POSES.floor, tr: 0.3, hd: 0.45, fa1: 0.9, fa2: 0.6, ba1: -0.4, ba2: -0.2 } : { ...base, tr: (base.tr || 0) + 0.35, hd: 0.6 };
    case 'sujeta': return { ...base, ...pick(POSES.reach), tr: 0.15 };
    case 'abraza': return { ...base, ...pick(POSES.hug) };
    case 'rie': return { ...base, tr: -0.08 + sw(16, 0.03), hd: -0.32 + sw(16, 0.06), fa1: 0.5, fa2: 2.1, ba1: 0.45, ba2: 1.9 };
    case 'celebra': return { ...base, ...pick(POSES.armsUp) };
    case 'saluda': return { ...base, fa1: 2.55, fa2: 2.75 + sw(10, 0.35) };
    case 'movil': return { ...base, ...pick(POSES.phone) };
    case 'mira': return { ...base, tr: -0.03, hd: -0.38 };
    case 'llora': return { ...base, tr: 0.2, hd: 0.7, fa1: 0.9, fa2: 2.6, ba1: 0.85, ba2: 2.5 };
    case 'cansa': return { ...base, tr: 0.25, hd: 0.7, fa1: 0.12 + sw(2, 0.03), fa2: 0.08, ba1: 0.08, ba2: 0.05 };
    case 'sorpresa': return { ...base, tr: -0.08, hd: -0.25, fa1: 1.25, fa2: 2.2, ba1: 1.15, ba2: 2.1 };
    case 'piensa': return { ...base, hd: 0.05, fa1: 0.75, fa2: 2.75, ba1: 0.15, ba2: 1.4 };
    case 'sienta': return standing ? { ...POSES.floor } : { ...base, tr: (base.tr || 0) + 0.1 };
    case 'cubre': return { ...base, tr: 0.1, hd: 0.35, fa1: 2.35, fa2: 2.9, ba1: 2.2, ba2: 2.8 };
    case 'duerme': return { ...base, hd: 0.75, tr: (base.tr || 0) + 0.06 };
    case 'insiste': return { ...base, tr: 0.32 + sw(5, 0.08), hd: 0.2, fa1: 1.2 + sw(5, 0.2), fa2: 1.4, ba1: 1.05 + sw(5, 0.2), ba2: 1.3 };
    case 'reaccion': return { ...base, hd: (base.hd || 0) - 0.15 + sw(6, 0.05) };
    // ---- emociones ----
    case 'ansiedad': {
      // mano en la cabeza → vueltecita (la hace figureMoments) → mira el móvil → suspira
      const head = { tr: 0.12, hd: 0.35, fa1: 2.15, fa2: 3.75, ba1: 0.1, ba2: 0.15 };
      const phone = pick(POSES.phone);
      const sigh = { tr: 0.24 + 0.05 * Math.max(0, Math.sin(lt * 2.6)), hd: 0.72, fa1: 0.1, fa2: 0.05, ba1: 0.06, ba2: 0.03 };
      let q = lerpPose(base, { ...base, ...head }, smooth(k / 0.1));
      q = lerpPose(q, { ...base, ...phone }, smooth((k - 0.56) / 0.08));
      return lerpPose(q, { ...base, ...sigh }, smooth((k - 0.8) / 0.08));
    }
    case 'ilusion': return { ...base, tr: -0.03, hd: -0.2, fa1: 0.35, fa2: 1.9, ba1: 0.3, ba2: 1.85 };
    case 'tristeza': {
      const low = { ...base, tr: 0.24, hd: 0.85, fa1: 0.05, fa2: 0.03, ba1: 0.04, ba2: 0.02 };
      if (!standing) return { ...low, tr: (base.tr || 0) + 0.25 };
      // baja la cabeza, deja caer los hombros y se sienta despacio en el suelo
      return lerpPose(low, { ...POSES.floor, tr: 0.45, hd: 0.95, fa1: 0.4, fa2: 0.3, ba1: 0.35, ba2: 0.25 }, smooth((k - 0.3) / 0.45));
    }
    case 'distraido': { const b = Math.abs(Math.sin(lt * 13)); return { ...base, ...pick(POSES.phone), tr: 0.04 - 0.04 * b, hd: 0.5 - 0.1 * b }; }
    case 'dar-corazon': {
      const offer = { ...base, tr: 0.1, hd: 0.1, fa1: 1.2, fa2: 1.5, ba1: 1.1, ba2: 1.45 };
      return lerpPose(lerpPose(base, offer, smooth((k - 0.12) / 0.15)), base, smooth((k - 0.82) / 0.12));
    }
    case 'recibir-corazon': {
      const take = { ...base, ...pick(POSES.reach), tr: 0.08 };
      const keep = { ...base, ...pick(POSES.heart), hd: 0.18 };
      return lerpPose(lerpPose(base, take, smooth((k - 0.42) / 0.15)), keep, smooth((k - 0.7) / 0.1));
    }
    case 'estoy-contigo': return { ...base, tr: 0.05, hd: 0.15, fa1: e.lowShoulder ? 1.2 : 1.7, fa2: e.lowShoulder ? 1.35 : 1.8, ba1: 0.1, ba2: 0.15 };
    case 'pedir': return { ...base, tr: 0.14, hd: -0.04, fa1: 1.05 + sw(5, 0.12), fa2: 1.5, ba1: 0.95 + sw(5 + 0.5, 0.12), ba2: 1.45 };
    case 'alegria': { const q = 0.5 + 0.5 * Math.sin(lt * 13); return { ...base, tr: -0.02, hd: -0.2, fa1: 1.25, fa2: 1.75 + 0.35 * q, ba1: 1.2, ba2: 1.75 - 0.35 * q }; }
    case 'abrazo-largo': return { ...base, ...pick(POSES.hug), tr: 0.06 + 0.05 * Math.sin(lt * 2.4) };
    default: return null;
  }
}
const pick = (p) => { const o = {}; for (const k of UPPER) o[k] = p[k]; return o; };
// en qué momento del suceso se dibuja ya el corazón en el pecho de quien lo recibe
const HEART_ARRIVES = 0.72;

// o: opciones de la figura (x, pose, F, kind, facing…), idx: índice del personaje; devuelve { o, icons: [...] }
export function figureMoments(o, idx, now, info = {}) {
  if (!now) return { o, icons: [] };
  const icons = [];
  const lying = o.pose.tr > 1.2;
  const sitting = o.pose.fl1 > 0.8 || o.pose.bl1 > 0.8;
  const P0 = now.pos || {};
  // ¿lo está moviendo la escena (camina, corre, va en bici)? Entonces los gestos no lo giran ni lo desplazan:
  // si no, al mirar o acercarse a quien queda detrás, parecería que camina hacia atrás
  const prev = P0[idx];
  const dt = prev && prev.t != null ? Math.abs(now.t - prev.t) : 0;
  const movingNow = dt > 0 && dt < 0.5 && Math.abs(o.x - prev.bx) / dt > 0.03 * o.F;
  // también entre paso y paso (escenas que caminan a tramos): si la escena lo movió hace menos de 1,2 s, sigue «caminando»
  const lastMove = movingNow ? now.t : prev && prev.lastMove != null && now.t >= prev.lastMove ? prev.lastMove : -99;
  const walking = !!info.riding || !!info.walker || movingNow || now.t - lastMove < 1.2;
  o = { ...o, _lastMove: lastMove };
  const standing = !lying && !sitting && !info.riding && !walking && (o.pose.tr || 0) < 0.6;
  const hits = (e) => e.who === 'all' || e.who === idx;
  const partner = (e) => (e.target >= 0 && e.target !== idx ? e.target : idx === 0 ? 1 : 0);
  // solo posiciones de ahora (si alguien no se dibuja —dentro del avión, en otra escena—, su posición vieja no vale)
  const P = {};
  for (const [k, v] of Object.entries(now.pos || {})) if (v && v.t != null && now.t >= v.t && now.t - v.t < 0.2) P[k] = v;
  const walkLegs = (pose, d, kk) => lerpPose(pose, { ...pose, ...legsOf(walkPose(Math.abs(d) / (o.F * 0.4) * Math.PI)) }, smooth(Math.min(kk, 1 - kk) * 8));
  // movimientos que se quedan: se aleja / se acerca, y acercarse al otro para darle el corazón, la mano en el hombro o el abrazo
  for (const e of now.moves) {
    if (e.type === 'llega' || !hits(e) || !standing || e.iconOnly || info.busy || info.apart || e.t0 < (info.segT0 ?? -Infinity)) continue;
    const M = MOMENTS[e.type];
    if (M.approach) {
      const tp = P[partner(e)];
      if (!tp) continue;
      const me = P[idx];
      const gap = M.approach === 'mid' ? 0.13 : M.approach;
      let dest;
      // punto medio con las posiciones de ESTA escena (no las de una escena anterior)
      if (M.approach === 'mid') { const b0 = o.x, b1 = tp.t === now.t || (tp.t != null && Math.abs(now.t - tp.t) < 0.2) ? tp.bx : tp.x; dest = (b0 + b1) / 2 - Math.sign(b1 - b0) * gap * o.F; }
      else dest = tp.x - Math.sign(tp.x - o.x) * gap * o.F;
      let D = dest - o.x;
      // demasiado lejos (otra casa, otra orilla): no cruza paredes ni precipicios; el gesto se hace desde su sitio
      if (Math.abs(tp.x - o.x) > 1.7 * o.F || Math.sign(D) !== Math.sign(tp.x - o.x)) D = 0;
      // nunca se va detrás de alguien que está caminando (lo dejaría atrás o lo haría retroceder)
      if (tp.lastMove != null && now.t - tp.lastMove < 1.2) D = 0;
      // la distancia se fija una vez, al empezar el gesto (si no, al moverse el otro se arrastraría hacia atrás)
      const memo = now.pos.__moves || (now.pos.__moves = {});
      const key = `${e.t0.toFixed(3)}:${e.type}:${idx}`;
      if (memo[key] == null) memo[key] = D;
      D = memo[key];
      if (Math.abs(D) < 0.03 * o.F) continue;
      const kw = clamp((now.t - e.t0) / Math.min(1.2, (e.t1 - e.t0) * 0.38));
      const d = D * smooth(kw);
      o = { ...o, x: o.x + d, facing: kw < 1 ? Math.sign(D) : o.facing, pose: kw > 0 && kw < 1 ? walkLegs(o.pose, d, kw) : o.pose };
      continue;
    }
    const k = clamp((now.t - e.t0) / Math.max(0.8, (e.t1 - e.t0) * 0.85));
    const away = e.type === 'aleja';
    const dirOut = Math.sign(o.x) || (idx ? 1 : -1);
    const dir = away ? dirOut : -dirOut;
    const D = away ? o.F * 0.9 : Math.min(Math.abs(o.x) * 0.6, o.F * 0.45);
    const d = D * smooth(k);
    const walking = k > 0 && k < 1;
    o = { ...o, x: o.x + dir * d, facing: walking ? dir : away ? dir : o.facing, pose: walking ? lerpPose(o.pose, walkPose(d / (o.F * 0.4) * Math.PI), smooth(Math.min(k, 1 - k) * 8)) : o.pose, alpha: (o.alpha ?? 1) * (away ? 1 - 0.35 * smooth(k) : 1) };
  }
  for (const e of now.hold || []) {
    if (!hits(e) || lying || info.busy || e.t0 < (info.segT0 ?? -Infinity)) continue;
    let target = poseFor('tristeza', o.pose, now.t - e.t0, { ...e, k: 1 }, standing);
    if (!standing || info.riding) target = upperOf(o.pose, target);
    o = { ...o, pose: target };
  }
  for (const e0 of now.act) {
    const M = MOMENTS[e0.type];
    if (!M || M.kind !== 'fig' || M.move) continue;
    // quien recibe el corazón que le dan: lo coge y lo guarda en el pecho
    let e = e0, role = 'do';
    if (!hits(e0)) {
      if (e0.type === 'dar-corazon' && e0.target === idx) { e = { ...e0, type: 'recibir-corazon', target: e0.who }; role = 'recv'; }
      else continue;
    }
    let tp = P[partner(e)];
    // gestos que necesitan al otro en pantalla (abrazo, mano en el hombro, sujetarlo, darle el corazón):
    // si no está (dentro del avión, en otra escena…), se lleva las manos al pecho con un corazón (lo piensa desde lejos)
    if (!tp && ['abrazo-largo', 'abraza', 'estoy-contigo', 'sujeta', 'dar-corazon'].includes(e.type) && (now.pos || {})[partner(e)] !== undefined) { e = { ...e, type: 'corazon' }; }
    const face = role === 'recv' ? 'target' : M.face;
    // (también sentado: se gira en el asiento; acostado o en bici, no)
    if (face && tp && !lying && !info.riding && !walking && !info.busy && !e.iconOnly && Math.abs(tp.x - o.x) > 0.05 * o.F) {
      const dir = Math.sign(tp.x - o.x) * (face === 'away' ? -1 : 1);
      if (e.env > 0.5) o = { ...o, facing: dir };
    }
    if (e.type === 'estoy-contigo' && tp) e = { ...e, lowShoulder: tp.H < o.F * 0.8 };
    const allowPose = !lying && !e.iconOnly && !(info.riding && M.legs && e.type !== 'celebra');
    if (allowPose) {
      let target = poseFor(e.type, o.pose, e.lt, e, standing);
      if (target) {
        if (!standing || info.riding || walking) target = upperOf(o.pose, target);
        if (info.busy) target = { ...o.pose, tr: target.tr ?? o.pose.tr, hd: target.hd ?? o.pose.hd };
        o = { ...o, pose: lerpPose(o.pose, target, e.env) };
        const free = standing && !info.busy;
        if (e.type === 'celebra' && free) o = { ...o, y: (o.y || 0) - o.F * 0.07 * Math.abs(Math.sin(e.lt * 7)) * e.env };
        if (e.type === 'rie' && free) o = { ...o, y: (o.y || 0) - o.F * 0.01 * Math.abs(Math.sin(e.lt * 16)) * e.env };
        // de puntillas, ilusionado
        if (e.type === 'ilusion' && free) o = { ...o, y: (o.y || 0) - o.F * 0.03 * (0.55 + 0.45 * Math.sin(e.lt * 5)) * e.env };
        // saltitos de alegría
        if (e.type === 'alegria' && free) o = { ...o, y: (o.y || 0) - o.F * 0.04 * Math.abs(Math.sin(e.lt * 6.5)) * e.env };
        // abrazo largo: se mecen
        if (e.type === 'abrazo-largo' && free) o = { ...o, x: o.x + Math.sin(e.lt * 2.4) * o.F * 0.02 * e.env };
        // ansiedad: da una vueltecita (se gira, unos pasitos, y vuelve)
        if (e.type === 'ansiedad' && free && e.k > 0.32 && e.k < 0.56) {
          const q = (e.k - 0.32) / 0.24;
          o = { ...o, facing: q < 0.5 ? -(o.facing || 1) : (o.facing || 1), pose: { ...o.pose, ...legsOf(walkPose(q * Math.PI * 4)) } };
        }
      }
    }
    icons.push({ ...e, role, apart: !!info.apart });
  }
  return { o, icons };
}
// escenas en las que cada uno está en su sitio (otra casa, otra orilla): nadie cruza paredes ni el precipicio
export const APART_SCENES = new Set(['telefono', 'puente', 'carta']);
const legsOf = (p) => ({ fl1: p.fl1, fl2: p.fl2, bl1: p.bl1, bl2: p.bl2 });

// guarda dónde quedó cada personaje (para el siguiente fotograma)
export function recordFigure(now, idx, bx, o, fig) {
  if (!now || !now.pos) return;
  now.pos[idx] = { t: now.t, lastMove: o._lastMove, bx, x: o.x, facing: o.facing, H: fig.H, head: fig.head, chest: [fig.shoulder[0] * 0.7 + fig.hip[0] * 0.3, fig.shoulder[1] * 0.7 + fig.hip[1] * 0.3], hands: [(fig.fh[0] + fig.bh[0]) / 2, (fig.fh[1] + fig.bh[1]) / 2], feet: [fig.ff, fig.bf] };
}

// corazoncito rojo (el que se entregan)
function smallHeart(ctx, x, y, F, a, beat = 0) {
  glow(ctx, x, y, F * 0.26, RED, 0.6 * a);
  heart(ctx, x, y, F * 0.085 * (1 + 0.08 * beat), RED, a);
}

// símbolos sobre el personaje (después de dibujarlo)
export function drawFigureIcons(ctx, fig, o, icons, now) {
  const P = (now && now.pos) || {};
  for (const e of icons) {
    const a = e.env, F = o.F;
    const [hx, hy] = fig.head;
    const top = hy - F * 0.2;
    const hands = [(fig.fh[0] + fig.bh[0]) / 2, (fig.fh[1] + fig.bh[1]) / 2];
    const chest = [fig.shoulder[0] * 0.7 + fig.hip[0] * 0.3, fig.shoulder[1] * 0.7 + fig.hip[1] * 0.3];
    ctx.save();
    ctx.strokeStyle = WHITE; ctx.fillStyle = WHITE; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, F * 0.012);
    switch (e.type) {
      case 'corazon': case 'abraza': {
        const rise = e.k * F * 0.18;
        glow(ctx, hx, top - rise, F * 0.22, RED, 0.5 * a);
        heart(ctx, hx, top - rise, F * 0.07 * (0.8 + 0.2 * Math.sin(e.lt * 8)), RED, a);
        break;
      }
      case 'abrazo-largo': { if (e.who === 'all' && e.role === 'do' && e.who !== 1) { const k2 = smooth((e.k - 0.35) / 0.2); if (k2 > 0) { glow(ctx, hx, top, F * 0.25, RED, 0.5 * a * k2); heart(ctx, hx, top - F * 0.04 * Math.sin(e.lt * 2.4), F * 0.08 * k2, RED, a); } } break; }
      case 'dar-corazon': {
        // el corazón está en sus manos; cerca, pasa a las manos del otro; lejos (otra casa), vuela hasta su pecho
        const tp = P[e.target];
        const busy = Math.hypot(hands[0] - chest[0], hands[1] - chest[1]) < F * 0.12;
        const from = busy ? [chest[0], chest[1] - F * 0.15] : [hands[0], hands[1] - F * 0.03];
        if (e.k < 0.12) break;
        const appear = smooth((e.k - 0.12) / 0.1);
        if (!tp || e.k < 0.45) { smallHeart(ctx, from[0], from[1], F, a * appear, Math.sin(e.lt * 8)); break; }
        if (e.k >= HEART_ARRIVES) break; // ya lo tiene el otro
        const q = smooth((e.k - 0.45) / (HEART_ARRIVES - 0.45));
        const far = e.apart || Math.abs(tp.x - o.x) > 1.7 * F;
        const to = far ? tp.chest : tp.hands || tp.chest;
        const arc = (far ? F * 0.6 : F * 0.12) * Math.sin(q * Math.PI);
        smallHeart(ctx, from[0] + (to[0] - from[0]) * q, from[1] + (to[1] - from[1]) * q - arc, F, a);
        break;
      }
      case 'recibir-corazon': {
        // lo coge y lo guarda en el pecho: el corazón late en su pecho
        if (e.role === 'recv') { if (e.k >= HEART_ARRIVES) smallHeart(ctx, chest[0], chest[1], F, a, Math.sin(e.lt * 7)); break; }
        const tp = P[e.target];
        const from = tp ? [tp.chest[0], tp.chest[1] - F * 0.3] : [hx, top - F * 0.3];
        if (e.k < 0.3) break;
        if (e.k < HEART_ARRIVES) { const q = smooth((e.k - 0.3) / (HEART_ARRIVES - 0.3)); smallHeart(ctx, from[0] + (hands[0] - from[0]) * q, from[1] + (hands[1] - from[1]) * q - F * 0.25 * Math.sin(q * Math.PI), F, a * smooth((e.k - 0.3) / 0.1)); }
        else smallHeart(ctx, chest[0], chest[1], F, a, Math.sin(e.lt * 7));
        break;
      }
      case 'estoy-contigo': { if (e.k > 0.4) glow(ctx, fig.fh[0], fig.fh[1], F * 0.16, AMBER, 0.45 * a * smooth((e.k - 0.4) / 0.15)); break; }
      case 'ilusion': { ctx.fillStyle = AMBER; for (let i = 0; i < 2; i++) { const q = (e.lt * 0.9 + i * 0.5) % 1; ctx.globalAlpha = a * (1 - q) * 0.8; ctx.beginPath(); ctx.arc(hx + (o.facing || 1) * F * (0.1 + 0.05 * i), top - q * F * 0.2, F * 0.012, 0, 7); ctx.fill(); } break; }
      case 'pedir': { ctx.globalAlpha = 0.55 * a * (0.5 + 0.5 * Math.sin(e.lt * 5)); const s2 = o.facing || 1; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(hands[0] + s2 * F * 0.06, hands[1], F * (0.06 + i * 0.05), -0.5, 0.5); if (s2 < 0) { ctx.beginPath(); ctx.arc(hands[0] + s2 * F * 0.06, hands[1], F * (0.06 + i * 0.05), Math.PI - 0.5, Math.PI + 0.5); } ctx.stroke(); } break; }
      case 'alegria': { if (Math.sin(e.lt * 13) > 0.85) sparkles(ctx, hands[0], hands[1], F * 0.12, e.lt, a, GOLD); break; }
      case 'ansiedad': {
        if (e.k < 0.56) { ctx.globalAlpha = 0.6 * a; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const an = i * 0.55 + e.lt * 5, r2 = F * (0.015 + i * 0.0022); const x2 = hx + Math.cos(an) * r2, y2 = top - F * 0.06 + Math.sin(an) * r2 * 0.6; i ? ctx.lineTo(x2, y2) : ctx.moveTo(x2, y2); } ctx.stroke(); }
        else if (e.k < 0.8) { const ph = [(fig.fh[0] + fig.bh[0]) / 2, (fig.fh[1] + fig.bh[1]) / 2]; ctx.globalAlpha = a; ctx.fillStyle = '#9FB4C8'; ctx.fillRect(ph[0] - F * 0.025, ph[1] - F * 0.045, F * 0.05, F * 0.08); }
        else { const q = (e.k - 0.8) / 0.2; ctx.globalAlpha = 0.5 * a * (1 - q); ctx.strokeStyle = '#BFC6CF'; const s2 = o.facing || 1; ctx.beginPath(); ctx.arc(hx + s2 * F * (0.1 + q * 0.08), hy + F * 0.03, F * (0.02 + q * 0.03), 0, 7); ctx.stroke(); }
        break;
      }
      case 'distraido': { const ph = hands; ctx.globalAlpha = a; ctx.fillStyle = '#9FB4C8'; ctx.fillRect(ph[0] - F * 0.025, ph[1] - F * 0.045, F * 0.05, F * 0.08); glow(ctx, ph[0], ph[1], F * 0.12, '#9FB4C8', 0.4 * a); sparkles(ctx, ph[0], ph[1] - F * 0.06, F * 0.08, e.lt, 0.6 * a, WHITE); break; }
      case 'rie': case 'celebra': sparkles(ctx, hx, hy, F * 0.22, e.lt, a, e.type === 'celebra' ? GOLD : WHITE); break;
      case 'llora': for (let i = 0; i < 2; i++) { const q = (e.lt * 1.4 + i * 0.5) % 1; ctx.globalAlpha = a * (1 - q) * 0.9; ctx.fillStyle = '#AFC3D6'; ctx.beginPath(); ctx.arc(hx + (i ? 1 : -1) * F * 0.05, hy + F * 0.03 + q * F * 0.3, F * 0.014, 0, 7); ctx.fill(); } break;
      case 'cansa': { const q = (e.lt * 0.8) % 1; ctx.globalAlpha = a * (1 - q); ctx.fillStyle = '#AFC3D6'; ctx.beginPath(); ctx.arc(hx + F * 0.09, hy - F * 0.04 + q * F * 0.12, F * 0.016, 0, 7); ctx.fill(); break; }
      case 'sorpresa': { ctx.globalAlpha = a; ctx.strokeStyle = AMBER; ctx.lineWidth = F * 0.02; ctx.beginPath(); ctx.moveTo(hx, top - F * 0.16); ctx.lineTo(hx, top - F * 0.05); ctx.stroke(); ctx.fillStyle = AMBER; ctx.beginPath(); ctx.arc(hx, top, F * 0.012, 0, 7); ctx.fill(); break; }
      case 'piensa': for (let i = 0; i < 3; i++) { ctx.globalAlpha = a * clamp(e.lt * 2 - i * 0.4); ctx.beginPath(); ctx.arc(hx + F * (0.07 + i * 0.05), top - F * i * 0.06, F * (0.012 + i * 0.007), 0, 7); ctx.stroke(); } break;
      case 'duerme': { ctx.font = `300 ${Math.round(F * 0.09)}px system-ui, sans-serif`; for (let i = 0; i < 2; i++) { const q = (e.lt * 0.7 + i * 0.5) % 1; ctx.globalAlpha = a * (1 - q); ctx.fillText('z', hx + F * (0.08 + q * 0.1), top - q * F * 0.25); } break; }
      case 'saluda': case 'mira': case 'reaccion': case 'insiste': {
        ctx.globalAlpha = 0.7 * a * (0.6 + 0.4 * Math.sin(e.lt * 9));
        const s2 = (o.facing || 1);
        for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(hx + s2 * F * 0.1, hy + i * F * 0.05); ctx.lineTo(hx + s2 * F * 0.16, hy + i * F * 0.08); ctx.stroke(); }
        break;
      }
      case 'movil': { ctx.globalAlpha = a; ctx.fillStyle = '#9FB4C8'; ctx.fillRect(hands[0] - F * 0.025, hands[1] - F * 0.045, F * 0.05, F * 0.08); glow(ctx, hands[0], hands[1], F * 0.1, '#9FB4C8', 0.35 * a); break; }
      case 'tropieza': case 'caerse': case 'sienta': { const [fx, fy] = fig.ff; ctx.globalAlpha = 0.45 * a * (1 - e.k); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(fx + (i - 1) * F * 0.06, fy - F * 0.02, F * (0.025 + 0.02 * e.k), Math.PI, 0); ctx.stroke(); } break; }
      case 'sujeta': { const [px, py] = fig.fh; glow(ctx, px, py, F * 0.16, AMBER, 0.45 * a); break; }
      case 'cubre': { const q = (e.lt * 2) % 1; ctx.globalAlpha = 0.5 * a; ctx.strokeStyle = '#BFC6CF'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(hx + i * F * 0.08, top - F * 0.25 + q * F * 0.12); ctx.lineTo(hx + i * F * 0.08 - F * 0.01, top - F * 0.2 + q * F * 0.12); ctx.stroke(); } break; }
    }
    ctx.restore();
  }
}

// intensidad del «salto» del contador en un panel (0…1)
export function counterPulse(now) {
  if (!now) return 0;
  let v = 0;
  for (const e of now.act) if (e.type === 'contador') v = Math.max(v, Math.sin(clamp(e.lt / 0.6) * Math.PI) * e.env);
  return v;
}
export { figureSize };
