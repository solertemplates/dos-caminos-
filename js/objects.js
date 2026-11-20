// Dos Caminos — biblioteca de objetos concretos (ver MAESTRO.md §6 «Objetos»).
// Si el TÍTULO o el SUBTÍTULO de un guion nombran uno de estos objetos, la escena lo dibuja
// en lugar de su objeto genérico. Mismo sello: líneas blancas; el rojo o naranja solo aparece
// en el momento importante (final feliz).

const RED = '#E5484D', ORANGE = '#F4A259', WHITE = '#F4F2EC';
const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// nombre → palabras (español e inglés) que lo activan. Se buscan como palabras completas, con plural.
export const OBJECTS = {
  flor: ['flor', 'flores', 'rosa', 'rosas', 'flower', 'flowers', 'rose', 'roses'],
  carta: ['carta', 'cartas', 'letter', 'letters', 'envelope'],
  pan: ['pan', 'panes', 'bread', 'loaf'],
  pelota: ['pelota', 'pelotas', 'balon', 'ball'],
  libro: ['libro', 'libros', 'biblia', 'book', 'books', 'bible'],
  dinero: ['dinero', 'billete', 'billetes', 'plata', 'money', 'cash', 'dollar', 'dollars', 'dolar', 'dolares'],
  moneda: ['moneda', 'monedas', 'coin', 'coins'],
  llave: ['llave', 'llaves', 'key', 'keys'],
  anillo: ['anillo', 'anillos', 'ring', 'rings', 'alianza'],
  taza: ['taza', 'tazas', 'cafe', 'cup', 'mug', 'coffee', 'tea'],
  bicicleta: ['bicicleta', 'bici', 'bicycle', 'bike'],
  regalo: ['regalo', 'regalos', 'gift', 'present'],
  maleta: ['maleta', 'maletas', 'equipaje', 'suitcase', 'luggage'],
  guitarra: ['guitarra', 'guitar'],
  vela: ['vela', 'velas', 'candle', 'candles'],
  mochila: ['mochila', 'backpack'],
  zapatos: ['zapato', 'zapatos', 'tenis', 'zapatillas', 'shoe', 'shoes', 'sneakers'],
  foto: ['foto', 'fotos', 'retrato', 'photo', 'picture', 'portrait'],
  estrella: ['estrella', 'estrellas', 'estrellita', 'star', 'stars'],
  globo: ['globo', 'globos', 'balloon', 'balloons'],
  cometa: ['cometa', 'papalote', 'barrilete', 'kite'],
  sombrero: ['sombrero', 'gorra', 'hat', 'cap'],
  gafas: ['gafas', 'lentes', 'anteojos', 'glasses'],
  botella: ['botella', 'agua', 'bottle', 'water'],
  plato: ['plato', 'platos', 'comida', 'cena', 'plate', 'meal', 'dinner'],
  manzana: ['manzana', 'manzanas', 'fruta', 'apple', 'apples', 'fruit'],
  pastel: ['pastel', 'torta', 'tarta', 'cumpleanos', 'cake', 'birthday'],
  osito: ['osito', 'peluche', 'juguete', 'teddy', 'toy'],
  maceta: ['maceta', 'planta', 'plantita', 'pot', 'plant'],
  martillo: ['martillo', 'herramienta', 'hammer', 'tool'],
  lapiz: ['lapiz', 'lapices', 'pencil', 'pen'],
  cuaderno: ['cuaderno', 'libreta', 'notebook', 'journal', 'diary'],
  trofeo: ['trofeo', 'medalla', 'premio', 'trophy', 'medal', 'prize'],
  camara: ['camara', 'camera'],
  auriculares: ['auriculares', 'audifonos', 'cascos', 'headphones'],
  candado: ['candado', 'lock', 'padlock'],
  semilla: ['semilla', 'semillas', 'seed', 'seeds'],
  corona: ['corona', 'crown'],
};

// Detecta el primer objeto nombrado en un texto (título, subtítulo…). Devuelve el nombre o null.
const INDEX = [];
for (const [name, words] of Object.entries(OBJECTS)) for (const w of words) INDEX.push([w, name]);
INDEX.sort((a, b) => b[0].length - a[0].length);
export function findObject(...texts) {
  const t = ' ' + norm(texts.filter(Boolean).join(' ')).replace(/[^a-z0-9ñ]+/g, ' ') + ' ';
  // gana el objeto que va tras un artículo («una flor», «el pan», «su bicicleta»); si no, el primero que aparece
  const ART = /(?:^| )(un|una|unos|unas|el|la|los|las|su|sus|mi|mis|tu|tus|nuestro|nuestra|este|esta|ese|esa|del|al|a|an|the|his|her|my|your|their|our)$/;
  let best = null, score = -Infinity;
  for (const [w, name] of INDEX) {
    const i = t.indexOf(' ' + w + ' ');
    if (i < 0) continue;
    const sc = (ART.test(t.slice(0, i)) ? 1000 : 0) - i;
    if (sc > score) { score = sc; best = name; }
  }
  return best;
}

// --- dibujo ---------------------------------------------------------------
// Cada función dibuja con origen en la base del objeto (x centrado, y = 0 abajo, y negativo hacia arriba)
// y altura aproximada s. a(color) devuelve el color de acento si está «encendido», si no blanco.
function L(c, ...p) { c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); }
function C(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); fill ? c.fill() : c.stroke(); }
function E(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); fill ? c.fill() : c.stroke(); }
function R(c, x, y, w, h) { c.strokeRect(x, y, w, h); }
function fillWith(c, col, fn) { c.save(); c.fillStyle = col; fn(); c.restore(); }
function strokeWith(c, col, fn) { c.save(); c.strokeStyle = col; fn(); c.restore(); }
function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 0.05, y + s * 0.25, x - s * 0.55, y - s * 0.05, x - s * 0.5, y - s * 0.3);
  c.bezierCurveTo(x - s * 0.45, y - s * 0.6, x - s * 0.08, y - s * 0.62, x, y - s * 0.32);
  c.bezierCurveTo(x + s * 0.08, y - s * 0.62, x + s * 0.45, y - s * 0.6, x + s * 0.5, y - s * 0.3);
  c.bezierCurveTo(x + s * 0.55, y - s * 0.05, x + s * 0.05, y + s * 0.25, x, y + s * 0.35);
}

const DRAW = {
  flor(c, s, a) { L(c, 0, 0, 0, -s * 0.6); E(c, -s * 0.12, -s * 0.3, s * 0.1, s * 0.04); fillWith(c, a(RED), () => { for (let i = 0; i < 5; i++) { const an = (i * Math.PI * 2) / 5; C(c, Math.cos(an) * s * 0.12, -s * 0.78 + Math.sin(an) * s * 0.12, s * 0.09, true); } }); fillWith(c, a(ORANGE), () => C(c, 0, -s * 0.78, s * 0.06, true)); },
  carta(c, s, a) { R(c, -s * 0.5, -s * 0.66, s, s * 0.66); L(c, -s * 0.5, -s * 0.66, 0, -s * 0.28, s * 0.5, -s * 0.66); fillWith(c, a(RED), () => C(c, 0, -s * 0.28, s * 0.07, true)); },
  pan(c, s, a) { c.beginPath(); c.moveTo(-s * 0.55, 0); c.quadraticCurveTo(-s * 0.6, -s * 0.5, 0, -s * 0.5); c.quadraticCurveTo(s * 0.6, -s * 0.5, s * 0.55, 0); c.closePath(); c.stroke(); strokeWith(c, a(ORANGE), () => { for (const o of [-0.25, 0, 0.25]) L(c, s * (o - 0.08), -s * 0.3, s * (o + 0.08), -s * 0.4); }); },
  pelota(c, s, a) { C(c, 0, -s * 0.45, s * 0.45); strokeWith(c, a(RED), () => { c.beginPath(); c.arc(0, -s * 0.45, s * 0.45, -0.5, 0.5); c.stroke(); c.beginPath(); c.arc(0, -s * 0.45, s * 0.45, Math.PI - 0.5, Math.PI + 0.5); c.stroke(); L(c, -s * 0.45, -s * 0.45, s * 0.45, -s * 0.45); }); },
  libro(c, s, a) { R(c, -s * 0.38, -s * 0.85, s * 0.76, s * 0.85); L(c, -s * 0.28, -s * 0.85, -s * 0.28, 0); L(c, -s * 0.1, -s * 0.6, s * 0.25, -s * 0.6); strokeWith(c, a(RED), () => L(c, s * 0.15, -s * 0.85, s * 0.15, -s * 0.98, s * 0.2, -s * 0.93)); },
  dinero(c, s, a) { for (let i = 0; i < 3; i++) R(c, -s * 0.5 + i * s * 0.04, -s * 0.12 - i * s * 0.14, s, s * 0.12); strokeWith(c, a(ORANGE), () => C(c, s * 0.02 + s * 0.08, -s * 0.12 - 2 * s * 0.14 + s * 0.06, s * 0.05)); fillWith(c, a(ORANGE), () => C(c, s * 0.45, -s * 0.1, s * 0.12, true)); },
  moneda(c, s, a) { for (let i = 0; i < 3; i++) E(c, 0, -s * 0.06 - i * s * 0.1, s * 0.35, s * 0.08); fillWith(c, a(ORANGE), () => C(c, s * 0.05, -s * 0.62, s * 0.22, true)); C(c, s * 0.05, -s * 0.62, s * 0.22); },
  llave(c, s, a) { strokeWith(c, a(ORANGE), () => { C(c, -s * 0.3, -s * 0.45, s * 0.2); L(c, -s * 0.1, -s * 0.45, s * 0.5, -s * 0.45); L(c, s * 0.3, -s * 0.45, s * 0.3, -s * 0.32); L(c, s * 0.45, -s * 0.45, s * 0.45, -s * 0.3); }); },
  anillo(c, s, a) { E(c, 0, -s * 0.35, s * 0.32, s * 0.3); fillWith(c, a(RED), () => { c.beginPath(); c.moveTo(0, -s * 0.66); c.lineTo(-s * 0.12, -s * 0.8); c.lineTo(0, -s * 0.94); c.lineTo(s * 0.12, -s * 0.8); c.closePath(); c.fill(); }); },
  taza(c, s, a) { c.beginPath(); c.moveTo(-s * 0.35, -s * 0.6); c.lineTo(-s * 0.3, 0); c.lineTo(s * 0.3, 0); c.lineTo(s * 0.35, -s * 0.6); c.stroke(); c.beginPath(); c.arc(s * 0.38, -s * 0.33, s * 0.14, -1.3, 1.3); c.stroke(); strokeWith(c, a(ORANGE), () => { for (const o of [-0.12, 0.08]) { c.beginPath(); c.moveTo(s * o, -s * 0.7); c.quadraticCurveTo(s * (o + 0.1), -s * 0.82, s * o, -s * 0.95); c.stroke(); } }); },
  bicicleta(c, s, a) { C(c, -s * 0.45, -s * 0.25, s * 0.25); C(c, s * 0.45, -s * 0.25, s * 0.25); L(c, -s * 0.45, -s * 0.25, -s * 0.1, -s * 0.62, s * 0.3, -s * 0.62, s * 0.45, -s * 0.25); L(c, -s * 0.1, -s * 0.62, 0, -s * 0.25, s * 0.3, -s * 0.62); L(c, s * 0.3, -s * 0.62, s * 0.32, -s * 0.78); strokeWith(c, a(RED), () => L(c, -s * 0.22, -s * 0.7, -s * 0.02, -s * 0.7)); },
  regalo(c, s, a) { R(c, -s * 0.4, -s * 0.66, s * 0.8, s * 0.66); R(c, -s * 0.46, -s * 0.8, s * 0.92, s * 0.14); strokeWith(c, a(RED), () => { L(c, 0, -s * 0.8, 0, 0); c.beginPath(); c.ellipse(-s * 0.12, -s * 0.9, s * 0.12, s * 0.07, 0.4, 0, Math.PI * 2); c.ellipse(s * 0.12, -s * 0.9, s * 0.12, s * 0.07, -0.4, 0, Math.PI * 2); c.stroke(); }); },
  maleta(c, s, a) { R(c, -s * 0.45, -s * 0.65, s * 0.9, s * 0.62); L(c, -s * 0.15, -s * 0.65, -s * 0.15, -s * 0.78, s * 0.15, -s * 0.78, s * 0.15, -s * 0.65); C(c, -s * 0.3, -s * 0.02, s * 0.03); C(c, s * 0.3, -s * 0.02, s * 0.03); strokeWith(c, a(ORANGE), () => R(c, s * 0.18, -s * 0.5, s * 0.16, s * 0.1)); },
  guitarra(c, s, a) { strokeWith(c, a(ORANGE), () => { C(c, 0, -s * 0.2, s * 0.2); C(c, 0, -s * 0.48, s * 0.15); }); fillWith(c, '#000', () => C(c, 0, -s * 0.3, s * 0.05, true)); C(c, 0, -s * 0.3, s * 0.05); L(c, 0, -s * 0.6, 0, -s); R(c, -s * 0.05, -s * 1.08, s * 0.1, s * 0.1); },
  vela(c, s, a) { R(c, -s * 0.13, -s * 0.6, s * 0.26, s * 0.6); L(c, 0, -s * 0.6, 0, -s * 0.68); fillWith(c, a(ORANGE), () => { c.beginPath(); c.moveTo(0, -s * 0.66); c.quadraticCurveTo(-s * 0.1, -s * 0.78, 0, -s * 0.95); c.quadraticCurveTo(s * 0.1, -s * 0.78, 0, -s * 0.66); c.fill(); }); },
  mochila(c, s, a) { c.beginPath(); c.moveTo(-s * 0.32, 0); c.lineTo(-s * 0.32, -s * 0.6); c.quadraticCurveTo(0, -s * 0.85, s * 0.32, -s * 0.6); c.lineTo(s * 0.32, 0); c.closePath(); c.stroke(); R(c, -s * 0.2, -s * 0.32, s * 0.4, s * 0.22); strokeWith(c, a(ORANGE), () => L(c, -s * 0.2, -s * 0.22, s * 0.2, -s * 0.22)); },
  zapatos(c, s, a) { for (const o of [-0.3, 0.35]) { c.beginPath(); c.moveTo(s * (o - 0.3), 0); c.lineTo(s * (o - 0.3), -s * 0.3); c.lineTo(s * (o - 0.05), -s * 0.3); c.quadraticCurveTo(s * o, -s * 0.12, s * (o + 0.28), -s * 0.1); c.lineTo(s * (o + 0.28), 0); c.closePath(); c.stroke(); strokeWith(c, a(RED), () => L(c, s * (o - 0.22), -s * 0.22, s * (o - 0.08), -s * 0.22)); } },
  foto(c, s, a) { R(c, -s * 0.42, -s * 0.82, s * 0.84, s * 0.72); R(c, -s * 0.34, -s * 0.74, s * 0.68, s * 0.56); L(c, -s * 0.15, -s * 0.1, -s * 0.25, 0); L(c, s * 0.15, -s * 0.1, s * 0.25, 0); fillWith(c, a(RED), () => { heartPath(c, 0, -s * 0.46, s * 0.3); c.fill(); }); },
  estrella(c, s, a) { const g = () => { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.2 : s * 0.48, an = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(Math.cos(an) * r, -s * 0.5 + Math.sin(an) * r); } c.closePath(); }; g(); c.stroke(); if (a(ORANGE) !== WHITE) fillWith(c, ORANGE, () => { g(); c.fill(); }); },
  globo(c, s, a) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 0.1, -s * 0.25, 0, -s * 0.45); c.stroke(); const g = () => E(c, 0, -s * 0.72, s * 0.22, s * 0.27); g(); if (a(RED) !== WHITE) fillWith(c, RED, () => E(c, 0, -s * 0.72, s * 0.22, s * 0.27, true)); },
  cometa(c, s, a) { const g = () => { c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.28, -s * 0.72); c.lineTo(0, -s * 0.35); c.lineTo(-s * 0.28, -s * 0.72); c.closePath(); }; g(); c.stroke(); if (a(RED) !== WHITE) fillWith(c, RED, () => { g(); c.fill(); }); c.beginPath(); c.moveTo(0, -s * 0.35); c.quadraticCurveTo(-s * 0.2, -s * 0.15, s * 0.05, 0); c.stroke(); },
  sombrero(c, s, a) { L(c, -s * 0.5, 0, s * 0.5, 0); R(c, -s * 0.28, -s * 0.5, s * 0.56, s * 0.5); strokeWith(c, a(RED), () => L(c, -s * 0.28, -s * 0.12, s * 0.28, -s * 0.12)); },
  gafas(c, s, a) { C(c, -s * 0.25, -s * 0.25, s * 0.18); C(c, s * 0.25, -s * 0.25, s * 0.18); L(c, -s * 0.07, -s * 0.28, s * 0.07, -s * 0.28); L(c, -s * 0.43, -s * 0.28, -s * 0.5, -s * 0.35); L(c, s * 0.43, -s * 0.28, s * 0.5, -s * 0.35); strokeWith(c, a(ORANGE), () => { L(c, -s * 0.32, -s * 0.3, -s * 0.24, -s * 0.38); L(c, s * 0.18, -s * 0.3, s * 0.26, -s * 0.38); }); },
  botella(c, s, a) { c.beginPath(); c.moveTo(-s * 0.16, 0); c.lineTo(-s * 0.16, -s * 0.6); c.lineTo(-s * 0.07, -s * 0.75); c.lineTo(-s * 0.07, -s * 0.85); c.lineTo(s * 0.07, -s * 0.85); c.lineTo(s * 0.07, -s * 0.75); c.lineTo(s * 0.16, -s * 0.6); c.lineTo(s * 0.16, 0); c.closePath(); c.stroke(); strokeWith(c, a(ORANGE), () => R(c, -s * 0.08, -s * 0.92, s * 0.16, s * 0.07)); L(c, -s * 0.16, -s * 0.35, s * 0.16, -s * 0.35); },
  plato(c, s, a) { E(c, 0, -s * 0.06, s * 0.5, s * 0.08); fillWith(c, a(ORANGE), () => { c.beginPath(); c.arc(0, -s * 0.12, s * 0.28, Math.PI, 0); c.fill(); }); c.beginPath(); c.arc(0, -s * 0.12, s * 0.28, Math.PI, 0); c.stroke(); strokeWith(c, a(ORANGE), () => { L(c, -s * 0.1, -s * 0.48, -s * 0.06, -s * 0.62); L(c, s * 0.08, -s * 0.48, s * 0.12, -s * 0.62); }); },
  manzana(c, s, a) { const g = () => { c.beginPath(); c.moveTo(0, -s * 0.62); c.bezierCurveTo(-s * 0.55, -s * 0.85, -s * 0.5, s * 0.02, 0, -s * 0.05); c.bezierCurveTo(s * 0.5, s * 0.02, s * 0.55, -s * 0.85, 0, -s * 0.62); }; g(); c.stroke(); if (a(RED) !== WHITE) fillWith(c, RED, () => { g(); c.fill(); }); L(c, 0, -s * 0.62, s * 0.05, -s * 0.8); E(c, s * 0.15, -s * 0.76, s * 0.1, s * 0.04); },
  pastel(c, s, a) { R(c, -s * 0.45, -s * 0.38, s * 0.9, s * 0.38); L(c, -s * 0.45, -s * 0.2, s * 0.45, -s * 0.2); L(c, 0, -s * 0.38, 0, -s * 0.6); fillWith(c, a(ORANGE), () => { c.beginPath(); c.moveTo(0, -s * 0.6); c.quadraticCurveTo(-s * 0.07, -s * 0.68, 0, -s * 0.8); c.quadraticCurveTo(s * 0.07, -s * 0.68, 0, -s * 0.6); c.fill(); }); },
  osito(c, s, a) { C(c, 0, -s * 0.28, s * 0.26); C(c, 0, -s * 0.7, s * 0.18); C(c, -s * 0.15, -s * 0.86, s * 0.06); C(c, s * 0.15, -s * 0.86, s * 0.06); fillWith(c, a(RED), () => { heartPath(c, 0, -s * 0.3, s * 0.18); c.fill(); }); },
  maceta(c, s, a) { c.beginPath(); c.moveTo(-s * 0.3, -s * 0.4); c.lineTo(-s * 0.22, 0); c.lineTo(s * 0.22, 0); c.lineTo(s * 0.3, -s * 0.4); c.closePath(); c.stroke(); L(c, 0, -s * 0.4, 0, -s * 0.8); E(c, -s * 0.12, -s * 0.6, s * 0.12, s * 0.05); E(c, s * 0.12, -s * 0.7, s * 0.12, s * 0.05); fillWith(c, a(RED), () => C(c, 0, -s * 0.85, s * 0.07, true)); },
  martillo(c, s, a) { L(c, 0, 0, 0, -s * 0.75); strokeWith(c, a(ORANGE), () => R(c, -s * 0.3, -s * 0.92, s * 0.6, s * 0.17)); },
  lapiz(c, s, a) { R(c, -s * 0.08, -s * 0.75, s * 0.16, s * 0.6); L(c, -s * 0.08, -s * 0.15, 0, 0, s * 0.08, -s * 0.15); strokeWith(c, a(RED), () => R(c, -s * 0.08, -s * 0.88, s * 0.16, s * 0.13)); },
  cuaderno(c, s, a) { R(c, -s * 0.36, -s * 0.85, s * 0.72, s * 0.85); for (let i = 1; i < 6; i++) C(c, -s * 0.36, -s * 0.85 + i * s * 0.14, s * 0.03); L(c, -s * 0.15, -s * 0.55, s * 0.22, -s * 0.55); L(c, -s * 0.15, -s * 0.4, s * 0.22, -s * 0.4); fillWith(c, a(RED), () => { heartPath(c, s * 0.04, -s * 0.68, s * 0.14); c.fill(); }); },
  trofeo(c, s, a) { const g = () => { c.beginPath(); c.moveTo(-s * 0.3, -s * 0.9); c.lineTo(s * 0.3, -s * 0.9); c.quadraticCurveTo(s * 0.3, -s * 0.45, 0, -s * 0.42); c.quadraticCurveTo(-s * 0.3, -s * 0.45, -s * 0.3, -s * 0.9); }; g(); c.stroke(); if (a(ORANGE) !== WHITE) fillWith(c, ORANGE, () => { g(); c.fill(); }); L(c, 0, -s * 0.42, 0, -s * 0.15); R(c, -s * 0.22, -s * 0.15, s * 0.44, s * 0.15); c.beginPath(); c.arc(-s * 0.32, -s * 0.75, s * 0.1, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(s * 0.32, -s * 0.75, s * 0.1, -Math.PI * 0.5, Math.PI * 0.5); c.stroke(); },
  camara(c, s, a) { R(c, -s * 0.45, -s * 0.55, s * 0.9, s * 0.5); R(c, -s * 0.15, -s * 0.65, s * 0.25, s * 0.1); C(c, 0, -s * 0.3, s * 0.16); fillWith(c, a(ORANGE), () => C(c, s * 0.3, -s * 0.45, s * 0.05, true)); },
  auriculares(c, s, a) { c.beginPath(); c.arc(0, -s * 0.45, s * 0.38, Math.PI, 0); c.stroke(); strokeWith(c, a(ORANGE), () => { R(c, -s * 0.46, -s * 0.5, s * 0.16, s * 0.3); R(c, s * 0.3, -s * 0.5, s * 0.16, s * 0.3); }); },
  candado(c, s, a) { R(c, -s * 0.3, -s * 0.5, s * 0.6, s * 0.5); c.beginPath(); c.arc(0, -s * 0.5, s * 0.2, Math.PI, 0); c.stroke(); fillWith(c, a(RED), () => { heartPath(c, 0, -s * 0.27, s * 0.18); c.fill(); }); },
  semilla(c, s, a) { E(c, 0, -s * 0.12, s * 0.3, s * 0.12); strokeWith(c, a(ORANGE), () => { c.beginPath(); c.moveTo(0, -s * 0.22); c.quadraticCurveTo(-s * 0.05, -s * 0.45, 0, -s * 0.6); c.stroke(); E(c, -s * 0.12, -s * 0.55, s * 0.12, s * 0.05); E(c, s * 0.12, -s * 0.6, s * 0.12, s * 0.05); }); },
  corona(c, s, a) { const g = () => { c.beginPath(); c.moveTo(-s * 0.45, 0); c.lineTo(-s * 0.45, -s * 0.55); c.lineTo(-s * 0.22, -s * 0.3); c.lineTo(0, -s * 0.65); c.lineTo(s * 0.22, -s * 0.3); c.lineTo(s * 0.45, -s * 0.55); c.lineTo(s * 0.45, 0); c.closePath(); }; g(); c.stroke(); if (a(ORANGE) !== WHITE) fillWith(c, ORANGE, () => { g(); c.fill(); }); },
};
export const OBJECT_NAMES = Object.keys(DRAW);

// Dibuja un objeto. st = { hot (0–1: acento y brillo cálido), fade (0–1: se apaga), fall (0–1: se cae) }.
export function drawObject(ctx, name, x, y, s, st = {}) {
  const fn = DRAW[name];
  if (!fn || s <= 0) return false;
  const hot = st.hot || 0, fade = st.fade || 0, fall = st.fall || 0;
  ctx.save();
  ctx.translate(x, y);
  if (hot > 0.01) {
    const g = ctx.createRadialGradient(0, -s * 0.5, 0, 0, -s * 0.5, s * 1.3);
    g.addColorStop(0, `rgba(244,162,89,${0.4 * hot})`);
    g.addColorStop(1, 'rgba(244,162,89,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 1;
    ctx.fillRect(-s * 1.3, -s * 1.8, s * 2.6, s * 2.6);
  }
  if (fall > 0) { ctx.translate(s * 0.4, 0); ctx.rotate(fall * 1.25); ctx.translate(-s * 0.4, 0); }
  ctx.globalAlpha = 1 - 0.55 * fade;
  ctx.strokeStyle = WHITE;
  ctx.fillStyle = WHITE;
  ctx.lineWidth = Math.max(2, s * 0.06);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  fn(ctx, s, (col) => (hot > 0.5 ? col : WHITE));
  ctx.restore();
  return true;
}
