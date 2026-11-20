// Dos Caminos — textos listos para publicar en cada red.
const TAGS = {
  es: {
    base: ['#DosCaminos', '#reflexion', '#decisiones'],
    pareja: ['#pareja', '#amor', '#relaciones', '#matrimonio'],
    familia: ['#familia', '#hogar', '#padres', '#valores'],
    hijos: ['#hijos', '#padres', '#crianza', '#familia'],
    dinero: ['#finanzas', '#ahorro', '#dinero', '#habitos'],
    trabajo: ['#trabajo', '#disciplina', '#exito', '#emprender'],
    amistad: ['#amistad', '#amigos', '#lealtad', '#vida'],
    salud: ['#salud', '#bienestar', '#ejercicio', '#habitos'],
    movil: ['#celular', '#pantallas', '#desconectar', '#tiempo'],
    constancia: ['#constancia', '#disciplina', '#motivacion', '#habitos'],
    fe: ['#fe', '#esperanza', '#gratitud', '#vida'],
  },
  en: {
    base: ['#TwoPathsStories', '#lifelessons', '#choices'],
    pareja: ['#relationships', '#love', '#marriage', '#couples'],
    familia: ['#family', '#home', '#parents', '#values'],
    hijos: ['#parenting', '#kids', '#momlife', '#dadlife'],
    dinero: ['#personalfinance', '#saving', '#money', '#habits'],
    trabajo: ['#work', '#discipline', '#success', '#career'],
    amistad: ['#friendship', '#friends', '#loyalty', '#life'],
    salud: ['#health', '#wellness', '#fitness', '#habits'],
    movil: ['#screentime', '#digitaldetox', '#phone', '#time'],
    constancia: ['#consistency', '#discipline', '#motivation', '#habits'],
    fe: ['#faith', '#hope', '#gratitude', '#life'],
  },
};
const NET = {
  facebook: { es: ['#reels'], en: ['#reels'] },
  instagram: { es: ['#reels', '#reelsinstagram', '#frases', '#mensajes'], en: ['#reels', '#explorepage', '#quotes', '#inspiration'] },
  youtube: { es: ['#Shorts'], en: ['#Shorts'] },
  tiktok: { es: ['#parati', '#fyp'], en: ['#fyp', '#foryoupage'] },
};
export const NETWORKS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
];

// v = { title, phrase, question, theme, lang, star (bool) }
export function postText(net, v) {
  const L = v.lang === 'en' ? 'en' : 'es';
  const follow = L === 'en' ? 'Follow Two Paths Stories for more.' : 'Sígueme para más.';
  const tags = [...TAGS[L].base.slice(0, net === 'instagram' ? 3 : 2), ...(TAGS[L][v.theme] || []).slice(0, net === 'instagram' ? 4 : 3), ...NET[net][L]];
  const uniq = [...new Set(tags)];
  const title = v.title;
  const lines = [];
  if (net === 'youtube') {
    lines.push(`${title} ${L === 'en' ? '| Two Paths Stories' : '| Dos Caminos'}`, '', v.phrase, v.question, '', follow, '', uniq.join(' '));
  } else if (net === 'tiktok') {
    lines.push(`${title}. ${v.question}`, follow, uniq.join(' '));
  } else {
    lines.push(title, '', v.phrase, v.question, '', follow);
    if (net === 'facebook' && v.star) lines.push('', L === 'en' ? 'If this one touched you, you can support the page with a Star. ⭐' : 'Si este mensaje te tocó, puedes apoyar con una estrellita. ⭐');
    lines.push('', uniq.join(' '));
  }
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------------------
// PRIMER COMENTARIO: 10 comentarios distintos por red y por video (frases preparadas + TITULO + FRASE del guion).
// Cada red con su estilo: Facebook = preguntas personales · Instagram = etiquetar · YouTube = A o B · TikTok = frases cortas que piquen.
// v = { title, phrase, question, lang }
export function commentsFor(net, v) {
  const en = v.lang === 'en';
  const t = String(v.title || '').replace(/\*/g, '').trim();
  const f = String(v.phrase || '').replace(/\*/g, '').trim();
  const q = String(v.question || '').trim() || (en ? 'Which one are you?' : '¿Cuál de los dos eres tú?');
  const ph = f || t; // si el guion no tiene FRASE, se usa el TITULO
  const E = en ? {
    facebook: [
      `"${t}". Has this ever happened to you? Tell me below 👇`,
      `${ph} Have you lived this? I'm reading every comment 👇`,
      'Which path did you see yourself in? Be honest 👇',
      'Who did this video remind you of? Tell me in the comments 👇',
      'If you could go back, what would you do differently? 👇',
      `"${ph}" Do you agree? 👇`,
      'Which path are you choosing today? 👇',
      `"${t}" made me think of my family. What about you? 👇`,
      'Have you ever been the one waiting… or the one who wasn\'t there? 👇',
      'Type "me" if this one hit your heart ❤️',
    ],
    instagram: [
      'Tag someone who needs to see this ❤️',
      `"${ph}" Tag the person this reminds you of 👇`,
      'Send this to the person you want to choose the right path with ❤️',
      `Tag your favorite person and tell them: "${t}" 🤍`,
      'Save it for when you need it, and tag someone who needs it too 📌',
      'Tag someone who is always there for you ❤️',
      `${ph} — tag who needs to read this 👀`,
      'Tag the one who taught you to choose well ✨',
      'If this made you think of someone, tag them. No need to say anything else ❤️',
      'Tag 2 people who should see this ending 💔',
    ],
    youtube: [
      'Are you path A or path B? Reply A or B 👇',
      `"${t}": A or B? Be honest 👇`,
      `${ph} Path A or path B? Answer with one letter 👇`,
      'Reply A if you\'ve been the good path, B if you\'ve been the other one 👇',
      'Which path did your family choose? A or B 👇',
      'A = I do this. B = I need to change. What\'s your answer? 👇',
      'Comment A or B, then watch it again and look at the ending 👀',
      `${q} Reply A or B 👇`,
      'Did you see the difference? Type B if the ending of B hurt 💔',
      `A or B: which one do you want to be after watching "${t}"? 👇`,
    ],
    tiktok: [
      'That ending hurt… did it hurt you too?',
      'This happens more than you think 💔',
      `"${t}"… I went quiet.`,
      'Watch it again and look at the ending 👀',
      f || 'Nobody talks about this…',
      'I used to be path B 😶',
      'Why does this hurt so much? 💔',
      'Watched it 3 times 🥲',
      'This one is for you. Yes, you.',
      'Don\'t wait until it\'s too late.',
    ],
  } : {
    facebook: [
      `«${t}». ¿Te ha pasado algo así? Cuéntamelo abajo 👇`,
      `${ph} ¿Lo has vivido? Leo todos los comentarios 👇`,
      '¿En cuál de los dos caminos te viste? Sé sincero 👇',
      '¿A quién te recordó este video? Cuéntamelo en los comentarios 👇',
      'Si pudieras volver atrás, ¿qué harías distinto? 👇',
      `«${ph}» ¿Estás de acuerdo? 👇`,
      '¿Qué camino estás eligiendo hoy? 👇',
      `«${t}» me hizo pensar en mi familia. ¿Y a ti? 👇`,
      '¿Alguna vez fuiste el que esperaba… o el que no estaba? 👇',
      'Escribe «yo» si este video te tocó el corazón ❤️',
    ],
    instagram: [
      'Etiqueta a alguien que necesita ver esto ❤️',
      `«${ph}» Etiqueta a quien te lo recuerda 👇`,
      'Manda este video a esa persona con la que quieres elegir el camino bueno ❤️',
      `Etiqueta a tu persona favorita y dile: «${t}» 🤍`,
      'Guárdalo para cuando lo necesites y etiqueta a alguien que también lo necesite 📌',
      'Etiqueta a alguien que siempre está ahí para ti ❤️',
      `${ph} — etiqueta a quien tiene que leer esto 👀`,
      'Etiqueta a quien te enseñó a elegir bien ✨',
      'Si esto te hizo pensar en alguien, etiquétalo. No hace falta decir nada más ❤️',
      'Etiqueta a 2 personas que deberían ver este final 💔',
    ],
    youtube: [
      '¿Tú eres del camino A o del B? Responde A o B 👇',
      `«${t}»: ¿A o B? Sé sincero 👇`,
      `${ph} ¿Camino A o camino B? Responde con una letra 👇`,
      'Responde A si alguna vez fuiste el camino bueno, B si fuiste el otro 👇',
      '¿Qué camino eligió tu familia? A o B 👇',
      'A = lo hago. B = tengo que cambiar. ¿Cuál es tu respuesta? 👇',
      'Comenta A o B y vuelve a verlo fijándote en el final 👀',
      `${q} Responde A o B 👇`,
      '¿Viste la diferencia? Escribe B si te dolió el final del camino B 💔',
      `A o B: ¿cuál quieres ser después de ver «${t}»? 👇`,
    ],
    tiktok: [
      'El final me dolió… ¿y a ti?',
      'Esto pasa más de lo que crees 💔',
      `«${t}»… me quedé callado.`,
      'Míralo otra vez y fíjate en el final 👀',
      f || 'Nadie habla de esto…',
      'Yo era el del camino B 😶',
      '¿Por qué duele tanto? 💔',
      'Lo vi 3 veces 🥲',
      'Esto es para ti, sí, para ti.',
      'No esperes a que sea tarde.',
    ],
  };
  // siempre 10 distintos (si TITULO y FRASE coinciden y repiten una frase, se completa con otra de reserva)
  const spare = en ? ['This one stays with you…', 'Read the ending twice ❤️', 'Some choices change everything.'] : ['Este se queda contigo…', 'El final dice mucho ❤️', 'Hay decisiones que lo cambian todo.'];
  const out = [...new Set((E[net] || E.facebook).map((s) => s.replace(/\s+/g, ' ').trim()))];
  for (const s of spare) if (out.length < 10 && !out.includes(s)) out.push(s);
  return out.slice(0, 10);
}
