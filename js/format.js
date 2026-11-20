// Instrucciones para pedirle guiones a Claude (se copian desde Ajustes). Mantener igual que MAESTRO.md.
export const CLAUDE_PROMPT = `Escribe guiones para mi app "Dos Caminos" (canal en inglés: "Two Paths Stories"). Son videos verticales sin voz: la pantalla se divide en dos y cada lado muestra una forma de vivir y su resultado.

REGLA DE ORO
Antes de escribir, busca en la web qué temas y formatos de reels son virales ahora (historias, ganchos y comparaciones que se están compartiendo esta semana) y úsalos como inspiración dentro de este formato. Escribe cada guion como el video del puente:
1. Gancho en los primeros 2 segundos: GANCHO corto que intrigue.
2. Conflicto claro: dos formas de vivir que se entienden de un vistazo y empiezan iguales.
3. Diferencia que crece: cada segundo se nota más en el dibujo.
4. Final con sorpresa: un desenlace que emocione y no sea obvio desde el principio, y una pregunta que invite a verlo otra vez.

Usa EXACTAMENTE este formato, un guion tras otro, separados por una línea con tres guiones (---). No añadas nada más.

TITULO: título corto (distinto en cada guion)
FRASE: frase final que aparece grande al terminar el video, tal cual (opcional; pon *una palabra clave* entre asteriscos para que salga en rojo)
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados | tiempo
GANCHO: frase de 3 a 6 palabras para los primeros 2 segundos
A: TÍTULO DEL CAMINO A | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
B: TÍTULO DEL CAMINO B | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
PREGUNTA: pregunta final corta
TITULO_EN: short title
GANCHO_EN: hook, natural US English
A_EN: PATH A TITLE | SUBTITLE WITH COUNTER
B_EN: PATH B TITLE | SUBTITLE WITH COUNTER
FRASE_EN: closing line shown big at the end, natural US English (not a literal translation; *keyword* in red)
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
FRASE: Lo pequeño, repetido, se vuelve *grande*.
TEMA: dinero
EMOCION: inspiracional
DIVISION: tiempo
GANCHO: Solo cinco dólares.
A: AHORRA CADA SEMANA | {0-260} DÓLARES | alcancia | hombre | ahorrar | se llena
PREGUNTA: ¿Dónde quieres estar dentro de un año?
TITULO_EN: A little every week
GANCHO_EN: Just five dollars.
A_EN: SAVES EVERY WEEK | {0-260} DOLLARS
FRASE_EN: Small things, repeated, become *big* things.
PREGUNTA_EN: Where do you want to be a year from now?
---

REGLAS DE LA HISTORIA
0. REGLA FIJA DEL ARCO: los dos caminos empiezan exactamente iguales y hacen lo mismo; a los dos les llega a la vez un momento difícil (caerse, cansarse, un obstáculo); el bueno se levanta y sigue; el malo lo intenta un poco y se desanima. Escribe A y B con la misma escena y los mismos personajes; la acción de B dice cómo se queda al rendirse (por ejemplo celular, sentarse, esperar).
1. (En arriba-abajo y lados) Los dos caminos empiezan en igualdad de condiciones: misma escena, mismos personajes, mismo punto de partida.
2. En los primeros segundos se ve el momento en que cada uno elige distinto (uno toma la tabla, el otro saca el móvil).
3. Desde ahí la diferencia crece poco a poco hasta el final: uno crece o se une; el otro se seca, se queda atrás o se cae.
4. Un lado termina bien y el otro mal. Se cuenta con acciones y objetos, no con carteles.
5. Temas universales: pareja, familia, hijos, dinero, trabajo, amistad, salud, el móvil y la constancia. Fe solo de vez en cuando, sutil y con un mensaje que entienda cualquiera. Cada guion, de un tema distinto.

REGLAS DEL TEXTO
- Títulos de cada lado: máximo 5 palabras, en mayúsculas.
- Contador animado: {inicio-fin} dentro del subtítulo. Ej: DÍA {1-45}, AÑO {1-10}, SEMANA {1-52}.
- TITULO: máximo 10 palabras y nunca repetido entre guiones. FRASE (opcional): máximo 14 palabras; es la frase final del video y sale tal cual; si no hay FRASE, sale el TITULO. Marca como mucho una palabra clave entre *asteriscos* (sale en rojo). PREGUNTA: máximo 9 palabras.

VOCABULARIO (usa solo estas palabras)
- personajes: hombre, mujer, nino, nina (unidos con +; máximo 2, o 3 en mesa). Todos salen en pantalla.
- escena y sus acciones (una acción por personaje, unidas con +):
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
  cocina: cocinar, celular (el 2.º personaje puede hablar o esperar sentado)
  oficina: trabajar, dormir, celular
  parque: jugar, caminar, celular
  coche: conducir, celular (el 2.º va de copiloto: hablar o celular)
  gimnasio: entrenar, sentarse
  cama: dormir, celular, levantarse
  sofa: hablar, celular, abrazar
  huerto: sembrar, regar, descansar
  montana: escalar, sentarse, caer
  lluvia: paraguas, mojarse, compartir
  tienda: vender, esperar (el 2.º personaje es el cliente)
  carta: escribir, olvidar (el 2.º personaje espera la carta: esperar)
  reloj: aprovechar, perder
  telefono: llamar, ignorar
  regalo: dar, guardar (el 2.º personaje recibe: esperar)
- final bueno: crece, florece, se unen, se llena, llega, ganan, se abrazan, se despiertan, se secan (solo en lluvia)
- final malo: se seca, se apaga, se vacía, se mojan, pierden, se queda, se queda atrás, nunca se completa, se cae, se alejan
- Varía las escenas: que cada guion use una escena distinta para que los videos no se repitan.
- OBJETOS: si el TITULO o el título/subtítulo de un lado nombra uno de estos objetos, la escena lo dibuja en lugar del objeto genérico. Úsalos cuando le den sentido a la historia:
  flor, carta, pan, pelota, libro, dinero, moneda, llave, anillo, taza (café), bicicleta, regalo, maleta, guitarra, vela, mochila, zapatos (tenis), foto, estrella, globo, cometa, sombrero, gafas (lentes), botella (agua), plato (comida, cena), manzana, pastel (cumpleaños), osito (peluche, juguete), maceta (planta), martillo, lápiz, cuaderno, trofeo (medalla), cámara, auriculares, candado, semilla, corona.
  Ejemplo: «TITULO: Te regalo una flor» → la flor reemplaza al corazón de quien espera en el puente.
- ACCIONES CON OBJETOS (valen en cualquier escena; el personaje usa el objeto en la mano o en el cuerpo):
  tocar-guitarra, leer-libro, beber-cafe, dar-flor, lanzar-pelota, escribir-lapiz, llevar-mochila, ponerse-sombrero, hacer-foto, dar-carta, comer-pan, contar-dinero, contar-monedas, usar-llave, dar-anillo, montar-bici, dar-regalo, llevar-maleta, encender-vela, atarse-zapatos, mirar-foto, alcanzar-estrella, sostener-globo, volar-cometa, ponerse-gafas, beber-agua, servir-plato, comer-manzana, llevar-pastel, abrazar-osito, llevar-planta, martillar, escribir-cuaderno, levantar-trofeo, escuchar-musica, cerrar-candado, sembrar-semilla, ponerse-corona
  Más: caer-bici (se cae de la bici), levantarse-bici (se cae y se vuelve a montar). En el camino, si el título dice «bicicleta», caer y levantarse ya son con bici.
  Ejemplos: «sofa | hombre+mujer | tocar-guitarra+beber-cafe | se abrazan» · «camino | nina | montar-bici | llega» · «puente | hombre+mujer | construir+dar-flor | se unen».

EJEMPLO
TITULO: El puente
FRASE: El amor se construye desde los *dos* lados.
TEMA: pareja
EMOCION: romantica
DIVISION: arriba-abajo
GANCHO: Un mismo puente. Dos historias.
A: LOS DOS CONSTRUYEN | DÍA {1-90} | puente | hombre+mujer | construir+construir | se unen
B: UNO CONSTRUYE, EL OTRO ESPERA | DÍA {1-90} | puente | hombre+mujer | construir+esperar | nunca se completa
PREGUNTA: ¿Cuál de los dos eres tú?
TITULO_EN: The bridge
GANCHO_EN: Same bridge. Two stories.
A_EN: BOTH OF THEM BUILD | DAY {1-90}
B_EN: ONE BUILDS, ONE WAITS | DAY {1-90}
FRASE_EN: Love is built from *both* sides.
PREGUNTA_EN: Which one are you?
---

Escríbeme guiones nuevos, cada uno de un tema distinto, sobre: `;
