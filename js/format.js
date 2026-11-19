// Instrucciones para pedirle guiones a Claude (se copian desde Ajustes).
export const CLAUDE_PROMPT = `Escribe guiones para mi app "Dos Caminos" (videos verticales sin voz que comparan dos formas de vivir). Usa EXACTAMENTE este formato, un guion tras otro, separados por una línea con tres guiones (---). No añadas nada más.

TITULO: título corto
TEMA: pareja | familia | dinero | trabajo | superacion | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados
GANCHO: frase de 3 a 6 palabras para los primeros 2 segundos
A: TÍTULO DEL CAMINO A | SUBTÍTULO O CONTADOR | escena | personajes | acciones | resultado
B: TÍTULO DEL CAMINO B | SUBTÍTULO O CONTADOR | escena | personajes | acciones | resultado
FRASE: reflexión final corta
PREGUNTA: pregunta final corta
TITULO_EN: short title
GANCHO_EN: hook in US English
A_EN: PATH A TITLE | SUBTITLE OR COUNTER
B_EN: PATH B TITLE | SUBTITLE OR COUNTER
FRASE_EN: closing reflection in US English
PREGUNTA_EN: closing question in US English
---

Reglas:
- Títulos de cada lado: máximo 5 palabras, en mayúsculas.
- Contador animado: escribe {inicio-fin} dentro del subtítulo. Ej: DÍA {1-45}, AÑO {1-10}, SEMANA {1-52}.
- escena (una): puente, arbol, alcancia, casa, escalera, mesa, fogata, camino, libros, abrazo.
- personajes: hombre, mujer, nino, nina, unidos con +. Ej: hombre+mujer. Máximo 3 (mesa) y 2 en las demás.
- acciones (una por personaje, unidas con +):
  puente: construir, esperar, celular
  arbol: orar, orar-domingo, regar, celular, dormir
  alcancia: ahorrar, gastar, celular
  casa: construir, descansar, celular
  escalera: subir, sentarse
  mesa: hablar, celular
  fogata: cuidar, celular, alejarse
  camino: caminar, correr, levantarse (se cae y se levanta), caer (se cae y se queda), sentarse
  libros: leer, celular
  abrazo: acercarse, alejarse
- resultado: bueno = crece, se unen, llega, se llena, florece. Malo = se seca, se apaga, se vacía, se queda, se queda atrás, nunca se completa, se cae, se alejan.
- Un lado termina bien y el otro mal. La historia se cuenta con acciones, no con texto.
- FRASE: máximo 14 palabras. PREGUNTA: máximo 9 palabras.
- Que cada guion sea distinto: cambia tema, escena, personajes, contador y frase.

Ejemplo:
TITULO: El puente
TEMA: pareja
EMOCION: romantica
DIVISION: arriba-abajo
GANCHO: Un mismo puente. Dos historias.
A: LOS DOS CONSTRUYEN | DÍA {1-90} | puente | hombre+mujer | construir+construir | se unen
B: UNO CONSTRUYE, EL OTRO ESPERA | DÍA {1-90} | puente | hombre+mujer | construir+esperar | nunca se completa
FRASE: El amor se construye desde los dos lados.
PREGUNTA: ¿Cuál de los dos eres tú?
TITULO_EN: The bridge
GANCHO_EN: One bridge. Two stories.
A_EN: BOTH OF THEM BUILD | DAY {1-90}
B_EN: ONE BUILDS, ONE WAITS | DAY {1-90}
FRASE_EN: Love is built from both sides.
PREGUNTA_EN: Which one are you?
---

Escríbeme 10 guiones nuevos sobre: `;
