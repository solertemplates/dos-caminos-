// Dos Caminos — textos listos para publicar en cada red.
const TAGS = {
  es: {
    base: ['#DosCaminos', '#reflexion', '#decisiones'],
    pareja: ['#pareja', '#amor', '#relaciones', '#matrimonio'],
    familia: ['#familia', '#padres', '#hijos', '#hogar'],
    dinero: ['#finanzas', '#ahorro', '#dinero', '#habitos'],
    trabajo: ['#trabajo', '#disciplina', '#constancia', '#exito'],
    superacion: ['#superacion', '#motivacion', '#crecimientopersonal', '#habitos'],
    fe: ['#fe', '#Dios', '#oracion', '#cristianos'],
  },
  en: {
    base: ['#TwoPaths', '#reflection', '#choices'],
    pareja: ['#relationships', '#love', '#marriage', '#couplegoals'],
    familia: ['#family', '#parenting', '#kids', '#home'],
    dinero: ['#finance', '#saving', '#money', '#habits'],
    trabajo: ['#work', '#discipline', '#consistency', '#success'],
    superacion: ['#selfimprovement', '#motivation', '#growth', '#habits'],
    fe: ['#faith', '#God', '#prayer', '#christian'],
  },
};
const NET = {
  facebook: { es: ['#reels'], en: ['#reels'] },
  instagram: { es: ['#reels', '#reelsinstagram', '#frases', '#mensajes'], en: ['#reels', '#reelsinstagram', '#quotes', '#inspiration'] },
  youtube: { es: ['#Shorts'], en: ['#Shorts'] },
  tiktok: { es: ['#parati', '#fyp'], en: ['#fyp', '#foryou'] },
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
  const follow = L === 'en' ? 'Follow for more.' : 'Sígueme para más.';
  const tags = [...TAGS[L].base.slice(0, net === 'instagram' ? 3 : 2), ...(TAGS[L][v.theme] || []).slice(0, net === 'instagram' ? 4 : 3), ...NET[net][L]];
  const uniq = [...new Set(tags)];
  const title = v.title;
  const lines = [];
  if (net === 'youtube') {
    lines.push(`${title} ${L === 'en' ? '| Two Paths' : '| Dos Caminos'}`, '', v.phrase, v.question, '', follow, '', uniq.join(' '));
  } else if (net === 'tiktok') {
    lines.push(`${title}. ${v.question}`, follow, uniq.join(' '));
  } else {
    lines.push(title, '', v.phrase, v.question, '', follow);
    if (net === 'facebook' && v.star) lines.push('', L === 'en' ? 'If this message touched you, you can support with a star. ⭐' : 'Si este mensaje te tocó, puedes apoyar con una estrellita. ⭐');
    lines.push('', uniq.join(' '));
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
