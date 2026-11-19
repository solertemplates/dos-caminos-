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
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
