// Dos Caminos — acción «bailar» y «vida» de los personajes quietos.
// bailar: dos personas bailan juntas como una pareja real: se miran, se dan una mano (la otra en la cintura
// o el hombro), se mecen juntos de lado a lado con pasos que avanzan lo que se mueven, rebotan un poco a cada
// tiempo y, cada pocos segundos, ella (el segundo) gira bajo el brazo levantado de él (el primero).
// vida: ningún personaje se queda quieto como una estatua; pequeños gestos reales cada ~2,6 s.
import { POSES, lerpPose, walkPose, figureSize } from './figure.js';

const smooth = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const BEAT = 0.62; // segundos por paso (~97 pulsaciones por minuto)
const SPIN = 5.0, SPIN_LEN = 1.25; // un giro cada 5 s

const legsOf = (p) => ({ fl1: p.fl1, fl2: p.fl2, bl1: p.bl1, bl2: p.bl2 });

// o: opciones de la figura; S: estado de la escena (CUR); devuelve las opciones con la pose y el sitio de baile
export function dancePose(o, S, neutral = 0) {
  const everyone = S.allPeople || S.people || [];
  const dancers = everyone.filter((p) => p.act === 'bailar');
  const j = dancers.indexOf(o.pe);
  if (j < 0) return o;
  const t = S.t, F = o.F;
  // se mecen juntos de lado a lado: la pareja entera se desplaza y los pies dan un paso por cada tramo recorrido
  const sway = Math.sin((t / (BEAT * 2)) * Math.PI) * F * 0.09;
  const legPh = (sway / (F * 0.09)) * 1.2; // el paso sigue al desplazamiento (adelante y atrás)
  const bob = Math.abs(Math.sin((t / BEAT) * Math.PI));
  let x, facing, pose;
  if (dancers.length >= 2 && j < 2) {
    const c = S.danceX ?? 0;
    const other = dancers[1 - j];
    const gap = (figureSize(o.kind, F) + figureSize(other.kind, F)) * 0.19;
    facing = j === 0 ? 1 : -1;
    x = c + (j === 0 ? -gap : gap) + sway;
    // brazos de pareja: mano con mano por delante (a la altura del hombro) y el otro brazo en la cintura/hombro del otro
    pose = { tr: 0.03, hd: -0.05 + 0.04 * Math.sin(t * 1.3 + j), fa1: 1.2, fa2: 1.45, ba1: 0.95, ba2: 1.75, ...legsOf(walkPose(legPh * (j ? -1 : 1))) };
    // giro bajo el brazo: él levanta la mano unida y ella da una vuelta completa sobre sí misma
    const q = (t % SPIN) / SPIN_LEN;
    if (q < 1 && t > 2.6) {
      const up = smooth(q / 0.2) * (1 - smooth((q - 0.8) / 0.2));
      pose = { ...pose, fa1: pose.fa1 + (2.55 - pose.fa1) * up, fa2: pose.fa2 + (2.7 - pose.fa2) * up };
      if (j === 1) {
        if (q > 0.3 && q < 0.7) facing = -facing; // de espaldas a mitad del giro
        pose = { ...pose, ba1: 0.35, ba2: 0.6, ...legsOf(walkPose(q * Math.PI * 4)) }; // pasitos en el sitio mientras gira
      }
    }
  } else {
    // baila solo: se mece con los brazos arriba y abajo al compás
    x = o.x + sway;
    facing = o.facing;
    const arms = 0.5 + 0.5 * Math.sin((t / BEAT) * Math.PI);
    pose = { tr: 0.04 * Math.sin(t * 2), hd: -0.15, fa1: 1.4 + 1.1 * arms, fa2: 1.8 + 0.9 * arms, ba1: 1.3 + 1.0 * (1 - arms), ba2: 1.7 + 0.9 * (1 - arms), ...legsOf(walkPose(legPh)) };
  }
  // al final feliz se abrazan despacio
  if (S.r > 0 && S.good) { pose = lerpPose(pose, { ...POSES.hug, ...legsOf(POSES.stand) }, smooth(S.r / 0.5)); }
  const y = (o.y || 0) - F * 0.012 * bob;
  // al empezar (todos iguales y de pie) están en su sitio de la escena
  const k = 1 - neutral;
  return { ...o, x: o.x + (x - o.x) * k, y: (o.y || 0) + (y - (o.y || 0)) * k, facing: k > 0.5 ? facing : o.facing, pose: lerpPose(o.pose, pose, k) };
}

// vida: pequeños gestos reales cuando el personaje no hace ningún suceso (mira al otro, cambia el peso, mueve una mano)
export function lifePose(o, idx, t, { busy = false, standing = true, sitting = false } = {}) {
  if (o.pose.tr > 1.2) return o; // acostado
  const T = 2.6, q = t / T + idx * 0.43, ph = Math.floor(q) % 3, k = q - Math.floor(q);
  const env = smooth((k - 0.15) / 0.2) * (1 - smooth((k - 0.7) / 0.2));
  if (env <= 0) return o;
  const p = { ...o.pose };
  if (ph === 0 || busy) {
    // mira: levanta la cabeza y la gira un poco
    p.hd = (p.hd || 0) - 0.18 * env;
  } else if (ph === 1) {
    // cambia el peso de una pierna a otra (de pie) o se acomoda (sentado)
    p.tr = (p.tr || 0) + 0.05 * env;
    if (standing && !sitting) { p.fl1 = (p.fl1 || 0) + 0.07 * env; p.bl1 = (p.bl1 || 0) - 0.05 * env; }
    p.hd = (p.hd || 0) + 0.08 * env;
  } else {
    // mueve una mano (como quien habla o se toca la cara)
    p.fa2 = (p.fa2 || 0) + 0.45 * env;
    p.fa1 = (p.fa1 || 0) + 0.12 * env;
  }
  return { ...o, pose: p };
}

// «abrazar-hijo»: los padres (los adultos con abrazar-hijo) se agachan de rodillas a los lados del niño y lo abrazan;
// el niño en medio, con los brazos abiertos alrededor de ellos; se mecen un poco, contentos (corazoncitos que suben).
// Vale en cualquier escena: en las escenas con muebles en el centro, el abrazo va a un lado.
const FURNITURE = new Set(['sofa', 'mesa', 'cama', 'cocina', 'oficina', 'tienda', 'libros', 'gimnasio', 'regalo', 'carta', 'coche', 'alcancia', 'reloj', 'fogata', 'arbol', 'escalera', 'aeropuerto']);
const isKid = (p) => p && (p.kind === 'nino' || p.kind === 'nina');
export function familyMembers(S) {
  const all = (S.allPeople || S.people || []).filter((p) => p.act !== 'ausente');
  const adults = all.filter((p) => !isKid(p) && p.act === 'abrazar-hijo');
  if (!adults.length) return null;
  const kid = all.find(isKid);
  if (!kid) return null;
  return { adults: adults.slice(0, 2), kid };
}
export function familyPose(o, S, neutral = 0) {
  const fam = familyMembers(S);
  if (!fam || (!fam.adults.includes(o.pe) && o.pe !== fam.kid)) return o;
  const t = S.t, F = o.F;
  const c = S.familyX ?? (FURNITURE.has(S.sceneName) ? -S.w * 0.3 : 0);
  const sway = Math.sin(t * 1.6) * 0.05;
  const gap = F * 0.21;
  let x, facing, pose;
  if (o.pe === fam.kid) {
    x = c;
    facing = fam.adults.length > 1 ? 1 : 1;
    const bounce = 0.5 + 0.5 * Math.sin(t * 3.2);
    pose = { tr: 0.02 + sway * 0.4, hd: -0.25 + 0.05 * bounce, fa1: 1.85 + 0.1 * bounce, fa2: 2.25, ba1: 1.75 + 0.1 * bounce, ba2: 2.2, fl1: 0.06, fl2: 0.02, bl1: -0.06, bl2: -0.05 };
  } else {
    const j = fam.adults.indexOf(o.pe);
    const side = fam.adults.length === 1 ? -1 : j === 0 ? -1 : 1;
    x = c + side * gap;
    facing = -side;
    // de rodillas, inclinados hacia el niño, con los brazos rodeándolo
    pose = { tr: 0.22 + sway, hd: 0.15, fa1: 1.2, fa2: 1.85, ba1: 1.05, ba2: 1.7, fl1: 0.12, fl2: -1.5, bl1: 0.0, bl2: -1.6 };
  }
  const k = 1 - neutral;
  return { ...o, x: o.x + (x - o.x) * k, facing: k > 0.5 ? facing : o.facing, pose: lerpPose(o.pose, pose, k), familyHug: k, y: (o.y || 0) * (1 - k) };
}
