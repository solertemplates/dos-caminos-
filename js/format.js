// Instrucciones para pedirle guiones a Claude (se copian desde Ajustes). Mantener igual que MAESTRO.md.
export const CLAUDE_PROMPT = `Escribe guiones para mi app "Dos Caminos" (canal en inglés: "Two Paths Stories"). Son videos verticales sin voz: la pantalla se divide en dos y cada lado muestra una forma de vivir y su resultado.

Usa EXACTAMENTE este formato, un guion tras otro, separados por una línea con tres guiones (---). No añadas nada más.

TITULO: título corto
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados | tiempo
GANCHO: frase de 3 a 6 palabras para los primeros 2 segundos
A: TÍTULO DEL CAMINO A | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
B: TÍTULO DEL CAMINO B | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
FRASE: reflexión final corta
PREGUNTA: pregunta final corta
TITULO_EN: short title
GANCHO_EN: hook, natural US English
A_EN: PATH A TITLE | SUBTITLE WITH COUNTER
B_EN: PATH B TITLE | SUBTITLE WITH COUNTER
FRASE_EN: closing line, natural US English (not a literal translation)
PREGUNTA_EN: closing question, natural US English
---

TIPO «TIEMPO» (DIVISION: tiempo)
Tres franjas de arriba abajo: HOY, EN UN MES y EN UN AÑO. Es el mismo personaje y el mismo camino en las tres; lo que cambia es el resultado con el tiempo, y al final la franja EN UN AÑO se ilumina con un corazón grande. Se escribe con UNA sola línea A (sin B):
A: NOMBRE DEL HÁBITO | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final bueno
- El contador se reparte solo: HOY muestra el inicio, EN UN MES 1/12 del total y EN UN AÑO el final.
- Escenas que mejor funcionan: arbol (regar), alcancia (ahorrar), escalera (subir), casa (construir).
- Opcional: ETAPAS: HOY | EN UN MES | EN UN AÑO (y ETAPAS_EN: TODAY | IN A MONTH | IN A YEAR) para cambiar los nombres.
Ejemplo:
TITULO: Un poco cada semana
TEMA: dinero
EMOCION: inspiracional
DIVISION: tiempo
GANCHO: Solo cinco dólares.
A: AHORRA CADA SEMANA | {0-260} DÓLARES | alcancia | hombre | ahorrar | se llena
FRASE: Lo pequeño, repetido, se vuelve grande.
PREGUNTA: ¿Dónde quieres estar dentro de un año?
TITULO_EN: A little every week
GANCHO_EN: Just five dollars.
A_EN: SAVES EVERY WEEK | {0-260} DOLLARS
FRASE_EN: Small things, repeated, become big things.
PREGUNTA_EN: Where do you want to be a year from now?
---

REGLAS DE LA HISTORIA
1. (En arriba-abajo y lados) Los dos caminos empiezan en igualdad de condiciones: misma escena, mismos personajes, mismo punto de partida.
2. En los primeros segundos se ve el momento en que cada uno elige distinto (uno toma la tabla, el otro saca el móvil).
3. Desde ahí la diferencia crece poco a poco hasta el final: uno crece o se une; el otro se seca, se queda atrás o se cae.
4. Un lado termina bien y el otro mal. Se cuenta con acciones y objetos, no con carteles.
5. Temas universales: pareja, familia, hijos, dinero, trabajo, amistad, salud, el móvil y la constancia. Fe solo de vez en cuando, sutil y con un mensaje que entienda cualquiera. Cada guion, de un tema distinto.

REGLAS DEL TEXTO
- Títulos de cada lado: máximo 5 palabras, en mayúsculas.
- Contador animado: {inicio-fin} dentro del subtítulo. Ej: DÍA {1-45}, AÑO {1-10}, SEMANA {1-52}.
- FRASE: máximo 14 palabras. PREGUNTA: máximo 9 palabras.

VOCABULARIO (usa solo estas palabras)
- escena: puente, arbol, alcancia, casa, escalera, mesa, fogata, camino, libros, abrazo
- personajes: hombre, mujer, nino, nina (unidos con +; máximo 2, o 3 en mesa)
- acciones, una por personaje, unidas con +:
  puente: construir, esperar, celular, descansar
  arbol: regar, cuidar, celular, dormir, orar, orar-domingo
  alcancia: ahorrar, gastar, celular
  casa: construir, descansar, celular
  escalera: subir, sentarse
  mesa: hablar, celular
  fogata: cuidar, celular, alejarse
  camino: caminar, correr, levantarse, caer, sentarse
  libros: leer, celular
  abrazo: acercarse, alejarse
- final bueno: crece, florece, se unen, se llena, llega
- final malo: se seca, se apaga, se vacía, se queda, se queda atrás, nunca se completa, se cae, se alejan

EJEMPLO
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
GANCHO_EN: Same bridge. Two stories.
A_EN: BOTH OF THEM BUILD | DAY {1-90}
B_EN: ONE BUILDS, ONE WAITS | DAY {1-90}
FRASE_EN: Love is built from both sides.
PREGUNTA_EN: Which one are you?
---

Escríbeme guiones nuevos, cada uno de un tema distinto, sobre: `;
