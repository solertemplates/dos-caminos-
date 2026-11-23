// Dos Caminos — acciones de uso real de los objetos (ver MAESTRO.md «Acciones con objetos»).
// El personaje usa el objeto como una persona: en la mano, en la cabeza, en la espalda o en los pies.
// Cualquier escena las admite: la escena coloca al personaje y este módulo pone la pose y el objeto.
import { drawObject } from './objects.js';

const RED = '#E5484D', WHITE = '#F4F2EC';
const frac = (x) => x - Math.floor(x);
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const bump = (x, a, b, e = 0.08) => sm((x - a) / e) * (1 - sm((x - b) / e));
const wave = (t, sp = 1, ph = 0) => 0.5 + 0.5 * Math.sin(t * sp + ph);

// legs: 'keep' (las piernas que dé la escena), 'kneel', 'crouch', 'ride'
// pose(k): devuelve la parte de arriba { tr, hd, fa1, fa2, ba1, ba2 }; k = { t, p, F }
// prop: dónde va el objeto. size: tamaño relativo a F.
export const USES = {
  'tocar-guitarra': { obj: 'guitarra', es: 'Toca la guitarra', pose: ({ t }) => ({ tr: 0.05, hd: 0.25, fa1: 0.55, fa2: 1.15 + 0.3 * wave(t, 10), ba1: 1.1, ba2: 2.1 }), prop: 'guitar', size: 0.42 },
  'leer-libro': { obj: 'libro', es: 'Lee un libro con las dos manos', pose: () => ({ tr: 0.06, hd: 0.45, fa1: 0.55, fa2: 1.95, ba1: 0.5, ba2: 1.85 }), prop: 'hands', size: 0.15 },
  'beber-cafe': { obj: 'taza', tilt: 0.8, es: 'Bebe de su taza de café', pose: ({ t }) => { const k = bump(frac(t / 3), 0.3, 0.65); return { tr: 0.02, hd: 0.1 - 0.3 * k, fa1: 0.35 + 0.25 * k, fa2: 1.3 + 1.35 * k, ba1: -0.05, ba2: 0.05 }; }, prop: 'hand', size: 0.1 },
  'dar-flor': { obj: 'flor', es: 'Ofrece una flor con la mano', pose: ({ t }) => ({ tr: 0.08, hd: 0.05, fa1: 1.35 + 0.05 * Math.sin(t * 2), fa2: 1.55, ba1: 0.1, ba2: 0.2 }), prop: 'hand', size: 0.2, up: 0.7 },
  'lanzar-pelota': { obj: 'pelota', es: 'Lanza la pelota hacia arriba y la atrapa', pose: ({ t }) => { const ph = frac(t / 1.6); const k = ph < 0.25 ? ph / 0.25 : ph > 0.8 ? 1 - (ph - 0.8) / 0.2 : 1; return { tr: 0.03, hd: -0.3 * k, fa1: 0.4 + 2.0 * k, fa2: 0.9 + 1.9 * k, ba1: 0.1, ba2: 0.2 }; }, prop: 'throw', size: 0.13 },
  'escribir-lapiz': { obj: 'lapiz', es: 'Escribe con un lápiz en su libreta', pose: ({ t }) => ({ tr: 0.1, hd: 0.5, fa1: 0.75, fa2: 1.6 + 0.12 * Math.sin(t * 9), ba1: 0.6, ba2: 1.75 }), prop: 'write', size: 0.14 },
  'llevar-mochila': { obj: 'mochila', es: 'Lleva la mochila a la espalda', pose: ({ t }) => ({ tr: 0.08, hd: 0, fa1: 0.15 + 0.05 * Math.sin(t * 2), fa2: 0.3, ba1: -0.2, ba2: 0.4 }), prop: 'back', size: 0.3 },
  'ponerse-sombrero': { obj: 'sombrero', es: 'Se pone el sombrero', pose: ({ p }) => { const k = 1 - sm(p * 6); return { tr: 0, hd: -0.05, fa1: 0.15 + 2.5 * k, fa2: 0.2 + 2.8 * k, ba1: -0.05, ba2: 0.05 }; }, prop: 'hat', size: 0.2 },
  'hacer-foto': { obj: 'camara', es: 'Hace una foto con la cámara', pose: () => ({ tr: 0.02, hd: 0.05, fa1: 1.3, fa2: 2.6, ba1: 1.2, ba2: 2.5 }), prop: 'camera', size: 0.13 },
  'dar-carta': { obj: 'carta', es: 'Entrega una carta con la mano', pose: ({ t }) => ({ tr: 0.08, hd: 0.05, fa1: 1.35 + 0.05 * Math.sin(t * 2), fa2: 1.55, ba1: 0.1, ba2: 0.2 }), prop: 'hand', size: 0.14, up: 0.5 },
  'comer-pan': { obj: 'pan', es: 'Come un trozo de pan', pose: ({ t }) => { const k = bump(frac(t / 2.6), 0.3, 0.6); return { tr: 0.02, hd: 0.15 - 0.15 * k, fa1: 0.35 + 0.3 * k, fa2: 1.4 + 1.25 * k, ba1: 0, ba2: 0.1 }; }, prop: 'hand', size: 0.12 },
  'contar-dinero': { obj: 'dinero', es: 'Cuenta billetes en las manos', pose: ({ t }) => ({ tr: 0.06, hd: 0.45, fa1: 0.6, fa2: 1.7 + 0.15 * wave(t, 8), ba1: 0.55, ba2: 1.75 }), prop: 'hands', size: 0.16 },
  'contar-monedas': { obj: 'moneda', es: 'Lanza una moneda al aire y la recoge', pose: ({ t }) => ({ tr: 0.03, hd: -0.1, fa1: 0.7, fa2: 1.8 + 0.2 * bump(frac(t / 1.4), 0, 0.2), ba1: 0, ba2: 0.1 }), prop: 'coinflip', size: 0.12 },
  'usar-llave': { obj: 'llave', es: 'Abre con la llave (gira la mano)', pose: () => ({ tr: 0.06, hd: 0.1, fa1: 1.3, fa2: 1.45, ba1: 0.1, ba2: 0.2 }), prop: 'key', size: 0.13 },
  'dar-anillo': { obj: 'anillo', es: 'De rodillas, ofrece un anillo', pose: () => ({ tr: 0, hd: -0.15, fa1: 1.55, fa2: 1.9, ba1: 0.3, ba2: 0.6 }), legs: 'kneel', prop: 'hand', size: 0.12, up: 0.5 },
  'montar-bici': { obj: 'bicicleta', es: 'Va montado en bicicleta', pose: () => ({ tr: 0.3, hd: -0.1, fa1: 1.15, fa2: 1.35, ba1: 1.1, ba2: 1.3 }), legs: 'ride', prop: 'bike', size: 0 },
  'dar-regalo': { obj: 'regalo', es: 'Ofrece un regalo con las dos manos', pose: () => ({ tr: 0.06, hd: 0.05, fa1: 1.2, fa2: 1.55, ba1: 1.1, ba2: 1.5 }), prop: 'hands', size: 0.2, up: 0.3 },
  'llevar-maleta': { obj: 'maleta', es: 'Tira de su maleta con ruedas', pose: () => ({ tr: 0.05, hd: 0, fa1: -0.35, fa2: -0.45, ba1: 0.15, ba2: 0.25 }), prop: 'beside', size: 0.3 },
  'encender-vela': { obj: 'vela', es: 'Sostiene una vela encendida', pose: () => ({ tr: 0.03, hd: 0.3, fa1: 0.55, fa2: 1.85, ba1: 0.5, ba2: 1.8 }), prop: 'hands', size: 0.17, up: 0.2 },
  'atarse-zapatos': { obj: 'zapatos', es: 'Se ata los zapatos', pose: ({ t }) => ({ tr: 1.0, hd: 0.3, fa1: 0.25 + 0.08 * Math.sin(t * 6), fa2: 0.1, ba1: 0.2, ba2: 0.1 }), legs: 'crouch', prop: 'feet', size: 0.16 },
  'mirar-foto': { obj: 'foto', es: 'Mira una foto entre las manos', pose: () => ({ tr: 0.05, hd: 0.45, fa1: 0.75, fa2: 2.0, ba1: 0.7, ba2: 1.95 }), prop: 'hands', size: 0.18, up: 0.4 },
  'alcanzar-estrella': { obj: 'estrella', es: 'Alcanza una estrella con la mano', pose: () => ({ tr: -0.04, hd: -0.35, fa1: 2.75, fa2: 2.95, ba1: 0.2, ba2: 0.3 }), prop: 'hand', size: 0.16, up: 0.2 },
  'sostener-globo': { obj: 'globo', es: 'Sostiene un globo del hilo', pose: () => ({ tr: 0, hd: -0.25, fa1: 0.9, fa2: 1.4, ba1: 0, ba2: 0.1 }), prop: 'hand', size: 0.55, up: 0 },
  'volar-cometa': { obj: 'cometa', es: 'Vuela una cometa', pose: ({ t }) => ({ tr: -0.05, hd: -0.4, fa1: 2.1 + 0.08 * Math.sin(t * 1.5), fa2: 2.35, ba1: 0.1, ba2: 0.2 }), prop: 'kite', size: 0.28 },
  'ponerse-gafas': { obj: 'gafas', es: 'Lleva gafas puestas (y se las ajusta)', pose: ({ t }) => { const k = bump(frac(t / 4), 0.2, 0.4); return { tr: 0, hd: 0.05, fa1: 0.15 + 1.6 * k, fa2: 0.2 + 2.6 * k, ba1: -0.05, ba2: 0.05 }; }, prop: 'glasses', size: 0 },
  'beber-agua': { obj: 'botella', tilt: 1.6, es: 'Bebe agua de una botella', pose: ({ t }) => { const k = bump(frac(t / 3), 0.3, 0.65); return { tr: 0.02, hd: 0.1 - 0.4 * k, fa1: 0.35 + 0.3 * k, fa2: 1.3 + 1.5 * k, ba1: -0.05, ba2: 0.05 }; }, prop: 'hand', size: 0.16 },
  'servir-plato': { obj: 'plato', es: 'Lleva un plato de comida con las dos manos', pose: () => ({ tr: 0.05, hd: 0.25, fa1: 1.0, fa2: 1.55, ba1: 0.95, ba2: 1.5 }), prop: 'hands', size: 0.22, up: 0.1 },
  'comer-manzana': { obj: 'manzana', es: 'Come una manzana', pose: ({ t }) => { const k = bump(frac(t / 2.6), 0.3, 0.6); return { tr: 0.02, hd: 0.15 - 0.15 * k, fa1: 0.35 + 0.3 * k, fa2: 1.4 + 1.25 * k, ba1: 0, ba2: 0.1 }; }, prop: 'hand', size: 0.11 },
  'llevar-pastel': { obj: 'pastel', es: 'Lleva un pastel con la vela encendida', pose: () => ({ tr: 0.05, hd: 0.25, fa1: 1.0, fa2: 1.55, ba1: 0.95, ba2: 1.5 }), prop: 'hands', size: 0.22, up: 0.05 },
  'abrazar-osito': { obj: 'osito', es: 'Abraza un osito de peluche', pose: () => ({ tr: 0.05, hd: 0.35, fa1: 0.7, fa2: 2.25, ba1: 0.65, ba2: 2.2 }), prop: 'chest', size: 0.24 },
  'llevar-planta': { obj: 'maceta', es: 'Lleva una plantita en maceta', pose: () => ({ tr: 0.04, hd: 0.25, fa1: 0.8, fa2: 1.7, ba1: 0.75, ba2: 1.65 }), prop: 'hands', size: 0.24, up: 0.25 },
  martillar: { obj: 'martillo', es: 'Agachado, martilla un clavo en una tabla', pose: ({ t }) => { const k = Math.pow(wave(t, 5), 1.5); return { tr: 0.9, hd: 0.35, fa1: 0.25 + 1.5 * k, fa2: 0.15 + 1.9 * k, ba1: 0.35, ba2: 0.2 }; }, legs: 'crouch', prop: 'hammer', size: 0.22 },
  'escribir-cuaderno': { obj: 'cuaderno', es: 'Escribe en su cuaderno', pose: ({ t }) => ({ tr: 0.1, hd: 0.5, fa1: 0.75, fa2: 1.6 + 0.12 * Math.sin(t * 9), ba1: 0.6, ba2: 1.75 }), prop: 'notebook', size: 0.18 },
  'levantar-trofeo': { obj: 'trofeo', es: 'Levanta un trofeo con las dos manos', pose: () => ({ tr: -0.04, hd: -0.3, fa1: 2.75, fa2: 2.9, ba1: 2.6, ba2: 2.85 }), prop: 'hands', size: 0.22, up: 0.1 },
  'escuchar-musica': { obj: 'auriculares', es: 'Escucha música con auriculares', pose: ({ t }) => ({ tr: 0.02, hd: 0.1 * Math.sin(t * 6), fa1: 0.15, fa2: 0.3, ba1: -0.05, ba2: 0.1 }), prop: 'headphones', size: 0 },
  'cerrar-candado': { obj: 'candado', es: 'Cierra un candado con la mano', pose: () => ({ tr: 0.05, hd: 0.2, fa1: 1.2, fa2: 1.5, ba1: 1.0, ba2: 1.6 }), prop: 'hand', size: 0.14, up: 0.45 },
  'sembrar-semilla': { obj: 'semilla', es: 'Se agacha y siembra una semilla', pose: ({ t }) => ({ tr: 0.95, hd: 0.3, fa1: 0.3 + 0.1 * Math.sin(t * 3), fa2: 0.1, ba1: 0.25, ba2: 0.1 }), legs: 'crouch', prop: 'ground', size: 0.14 },
  'ponerse-corona': { obj: 'corona', es: 'Lleva una corona en la cabeza', pose: () => ({ tr: -0.03, hd: -0.15, fa1: 0.15, fa2: 0.25, ba1: -0.05, ba2: 0.05 }), prop: 'crown', size: 0 },
};

// sinónimos que Claude podría escribir
export const USE_ALIAS = {
  'montar-bicicleta': 'montar-bici', 'andar-en-bici': 'montar-bici', 'andar-en-bicicleta': 'montar-bici', pedalear: 'montar-bici', 'ride-bike': 'montar-bici',
  'tocar-la-guitarra': 'tocar-guitarra', 'beber-cafe': 'beber-cafe', 'tomar-cafe': 'beber-cafe', 'beber-taza': 'beber-cafe', 'tomar-agua': 'beber-agua',
  'regalar-flor': 'dar-flor', 'dar-flores': 'dar-flor', 'lanzar-balon': 'lanzar-pelota', 'tirar-pelota': 'lanzar-pelota',
  'escribir-con-lapiz': 'escribir-lapiz', 'hacer-fotos': 'hacer-foto', 'tomar-foto': 'hacer-foto', 'sacar-foto': 'hacer-foto',
  'pedir-matrimonio': 'dar-anillo', 'atar-zapatos': 'atarse-zapatos', 'volar-papalote': 'volar-cometa', 'usar-gafas': 'ponerse-gafas', 'ponerse-lentes': 'ponerse-gafas',
  'oir-musica': 'escuchar-musica', 'escuchar': 'escuchar-musica', 'sembrar-semillas': 'sembrar-semilla', 'dar-regalos': 'dar-regalo', 'llevar-maceta': 'llevar-planta',
};

// Bici: biela centrada un poco delante y por debajo de la cadera (en unidades de altura H).
export const CRANK = { u: 0.05, v: 0.38, r: 0.075, w: 7 };
// Pierna de dos segmentos desde la cadera hasta un punto (u adelante, v abajo): ángulos del muslo y la espinilla.
export function legIK(u, v) {
  const L1 = 0.245, L2 = 0.245;
  const d = Math.min(Math.hypot(u, v), L1 + L2 - 1e-4);
  const phi = Math.atan2(u, v);
  const A = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const a1 = phi + A; // la rodilla apunta hacia delante, como en la vida real
  const kx = Math.sin(a1) * L1, ky = Math.cos(a1) * L1;
  return [a1, Math.atan2(u - kx, v - ky)];
}
// ángulo de la biela: crece con el tiempo = pedales hacia delante (arriba avanza en el sentido de la marcha)
export const crankAngle = (travel, H) => travel / (H * 0.2) / 2;
function pedal(theta) { return [CRANK.u + CRANK.r * Math.cos(theta), CRANK.v + CRANK.r * Math.sin(theta)]; }

const KNEEL = { fl1: 0.12, fl2: -1.5, bl1: 0.0, bl2: -1.6 };
const CROUCH = { fl1: 1.25, fl2: -0.2, bl1: 1.05, bl2: -0.35 };
const STAND = { fl1: 0.06, fl2: 0.02, bl1: -0.06, bl2: -0.05 };
const SLUMP_ARMS = { tr: 0.2, hd: 0.7, fa1: 0.12, fa2: 0.1, ba1: 0.08, ba2: 0.05 };

// Pose completa para una acción de uso. base = pose que dio la escena (se conservan sus piernas si legs = keep).
// k = { t, p, r, good, F }
export function usePose(use, base, k) {
  let legs;
  if (use.legs === 'kneel') legs = KNEEL;
  else if (use.legs === 'crouch') legs = CROUCH;
  else if (use.legs === 'ride') {
    // la biela gira según lo recorrido (rueda 0.2·H, desarrollo 2:1): si no avanza, no pedalea
    const th = k.travel != null ? crankAngle(k.travel, k.H) : 0.9;
    const [f1, f2] = legIK(...pedal(th));
    const [b1, b2] = legIK(...pedal(th + Math.PI));
    legs = { fl1: f1, fl2: f2, bl1: b1, bl2: b2, fixLow: CRANK.v + CRANK.r };
  } else {
    const seated = base.fl1 > 0.8 && base.fl2 > -0.1 && base.fl2 < 0.6;
    const onFloor = base.fl2 > 1;
    // si la escena lo hace caminar (camino, aeropuerto, parque…), conserva sus pasos: nunca se desliza con el objeto
    legs = seated || onFloor || base.walk ? { fl1: base.fl1, fl2: base.fl2, bl1: base.bl1, bl2: base.bl2 } : STAND;
  }
  let upper = use.pose(k);
  if (k.r > 0 && !k.good) {
    const b = sm(k.r / 0.5);
    for (const key in SLUMP_ARMS) upper[key] = upper[key] + (SLUMP_ARMS[key] - upper[key]) * b;
  } else if (k.r > 0 && k.good) upper = { ...upper, hd: upper.hd - 0.15 * sm(k.r / 0.5) };
  return { ...base, ...legs, ...upper };
}

// Altura extra para que los pies vayan sobre los pedales.
// Ruedas de radio 0.2·H con el eje a la altura de la biela; con fixLow la cadera queda fija.
export function useLift(use, H) { return use.legs === 'ride' ? H * (0.2 - CRANK.r) : 0; }

function bike(ctx, fig, F, facing, groundY, st, t) {
  const H = fig.H, wr = H * 0.2, cy = groundY - wr;
  const rx = fig.hip[0] - facing * H * 0.33, fx = fig.hip[0] + facing * H * 0.42;
  const crank = [fig.hip[0] + facing * H * CRANK.u, fig.hip[1] + H * CRANK.v];
  ctx.save();
  ctx.globalAlpha = 1 - 0.5 * (st.fade || 0);
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = Math.max(2, F * 0.018);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const L = (...p) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.stroke(); };
  for (const x of [rx, fx]) {
    ctx.beginPath(); ctx.arc(x, cy, wr, 0, Math.PI * 2); ctx.stroke();
    // radios: giran en el sentido de la marcha (horario si va a la derecha)
    const a = facing * (t.travel || 0) / wr;
    ctx.save(); ctx.globalAlpha *= 0.5; ctx.lineWidth = Math.max(1.2, F * 0.008);
    for (let i = 0; i < 3; i++) { const b = a + (i * Math.PI) / 3; L(x - Math.cos(b) * wr, cy - Math.sin(b) * wr, x + Math.cos(b) * wr, cy + Math.sin(b) * wr); }
    ctx.restore();
  }
  // bielas y pedales: cada pedal bajo su pie
  for (const ft of [fig.ff, fig.bf]) { L(crank[0], crank[1], ft[0], ft[1]); L(ft[0] - F * 0.03, ft[1], ft[0] + F * 0.03, ft[1]); }
  const seat = [fig.hip[0] - facing * F * 0.02, fig.hip[1] + F * 0.03];
  const bar = [fig.fh[0], fig.fh[1]];
  L(rx, cy, seat[0], seat[1], crank[0], crank[1], rx, cy);
  L(seat[0], seat[1], bar[0] - facing * F * 0.05, bar[1] + F * 0.06, fx, cy);
  L(crank[0], crank[1], bar[0] - facing * F * 0.05, bar[1] + F * 0.06);
  L(bar[0] - facing * F * 0.05, bar[1] + F * 0.06, bar[0], bar[1]);
  ctx.strokeStyle = (st.hot || 0) > 0.5 ? RED : WHITE;
  L(seat[0] - F * 0.06, seat[1], seat[0] + F * 0.06, seat[1]);
  ctx.restore();
}

// Dibuja el objeto en la mano / cuerpo. fig = puntos del muñequito; o = opciones de drawFigure; st = estado (hot/fade/fall)
export function drawUseProp(ctx, use, fig, o, k, st) {
  const F = o.F, f = o.facing || 1, s = F * use.size;
  const h = fig.fh, b = fig.bh, hd = fig.head, r = fig.r;
  const mid = [(h[0] + b[0]) / 2, (h[1] + b[1]) / 2];
  const at = (x, y, size = s, extra = {}) => drawObject(ctx, use.obj, x, y, size, { ...st, ...extra });
  const groundY = (o.y || 0);
  switch (use.prop) {
    case 'hand': {
      if (use.tilt) {
        const kk = bump(frac(k.t / 3), 0.3, 0.65);
        return at(h[0], h[1] + s * (use.up ?? 0.45), s, { rot: -f * use.tilt * kk });
      }
      return at(h[0], h[1] + s * (use.up ?? 0.45));
    }
    case 'hands': return at(mid[0], mid[1] + s * (use.up ?? 0.45));
    case 'guitar': {
      const base = [fig.hip[0] + f * F * 0.02, fig.hip[1] + F * 0.06];
      const dx = b[0] - base[0], dy = b[1] - base[1];
      return at(base[0], base[1], Math.hypot(dx, dy) * 0.95, { rot: Math.atan2(dy, dx) + Math.PI / 2, pivot: 'bottom' });
    }
    case 'throw': {
      const ph = frac(k.t / 1.6);
      const air = ph > 0.25 && ph < 0.8 ? Math.sin(((ph - 0.25) / 0.55) * Math.PI) : 0;
      return at(h[0], h[1] + s * 0.5 - air * F * 0.45);
    }
    case 'write': drawObject(ctx, 'cuaderno', b[0], b[1] + F * 0.07, F * 0.12, st); return at(h[0] + f * F * 0.01, h[1] + F * 0.03, s, { rot: f * 0.45, pivot: 'bottom' });
    case 'notebook': at(b[0], b[1] + s * 0.4); return drawObject(ctx, 'lapiz', h[0] + f * F * 0.01, h[1] + F * 0.03, F * 0.1, { ...st, rot: f * 0.45, pivot: 'bottom' });
    case 'back': return at(fig.shoulder[0] - f * r * 1.2, fig.shoulder[1] + s * 0.95);
    case 'hat': {
      const k2 = 1 - sm(k.p * 6);
      return at(hd[0] + (h[0] - hd[0]) * k2 * 0.4, hd[1] - r * 0.55 - k2 * F * 0.1);
    }
    case 'crown': return at(hd[0], hd[1] - r * 0.5, r * 2.0);
    case 'glasses': return at(hd[0] + f * r * 0.5, hd[1] + r * 0.62, r * 2.3);
    case 'headphones': return at(hd[0], hd[1] + r * 0.55, r * 2.6);
    case 'camera': {
      at(h[0] + f * F * 0.02, h[1] + s * 0.5);
      const fl = bump(frac(k.t / 2.2), 0.05, 0.12, 0.03);
      if (fl > 0.05) { ctx.save(); ctx.globalAlpha = fl * 0.8; ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(h[0] + f * F * 0.1, h[1] - s * 0.2, F * 0.05, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      return;
    }
    case 'coinflip': {
      const ph = frac(k.t / 1.4);
      const air = ph < 0.6 ? Math.sin((ph / 0.6) * Math.PI) : 0;
      return at(h[0], h[1] + s * 0.4 - air * F * 0.45);
    }
    case 'key': return at(h[0] + f * s * 0.3, h[1] + s * 0.45, s, { rot: Math.sin(k.t * 3) * 0.6 });
    case 'beside': {
      const mx = h[0] - f * F * 0.32;
      at(mx, groundY, s);
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(2, F * 0.014); ctx.globalAlpha = 1 - 0.5 * (st.fade || 0);
      ctx.beginPath(); ctx.moveTo(mx + f * s * 0.3, groundY - s * 0.62); ctx.lineTo(h[0], h[1]); ctx.stroke(); ctx.restore();
      return;
    }
    case 'feet': return at(fig.ff ? (fig.ff[0] + (fig.bf || fig.ff)[0]) / 2 : h[0], groundY, s);
    case 'kite': {
      const kx = h[0] + f * F * 0.55 + Math.sin(k.t * 1.3) * F * 0.05, ky = h[1] - F * 0.75 + Math.cos(k.t * 1.1) * F * 0.04;
      ctx.save(); ctx.strokeStyle = WHITE; ctx.globalAlpha = 0.6 * (1 - 0.5 * (st.fade || 0)); ctx.lineWidth = Math.max(1.5, F * 0.008);
      ctx.beginPath(); ctx.moveTo(h[0], h[1]); ctx.quadraticCurveTo(h[0] + f * F * 0.35, h[1] - F * 0.1, kx, ky - s * 0.35); ctx.stroke(); ctx.restore();
      return at(kx, ky);
    }
    case 'chest': return at(fig.shoulder[0] + f * r * 0.9, fig.shoulder[1] + s * 1.05);
    case 'hammer': {
      // tabla y clavo en el suelo, justo donde baja el golpe
      const nx = fig.hip[0] + f * fig.H * 0.42;
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(2, F * 0.014); ctx.globalAlpha = 0.8 * (1 - 0.5 * (st.fade || 0));
      ctx.strokeRect(nx - F * 0.14, groundY - F * 0.04, F * 0.28, F * 0.04);
      ctx.beginPath(); ctx.moveTo(nx, groundY - F * 0.04); ctx.lineTo(nx, groundY - F * 0.09); ctx.stroke(); ctx.restore();
      const el = fig.fe || fig.shoulder;
      const ang = Math.atan2(h[1] - el[1], h[0] - el[0]);
      return at(h[0], h[1], s, { rot: ang + Math.PI / 2, pivot: 'bottom' });
    }
    case 'ground': return at(h[0] + f * F * 0.04, groundY, s);
    case 'bike': return bike(ctx, fig, F, f, groundY, st, k);
  }
}
