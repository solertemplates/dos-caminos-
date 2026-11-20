// Instrucciones para pedirle guiones a Claude (se copian desde Ajustes). Mantener igual que MAESTRO.md.
export const CLAUDE_PROMPT = `Escribe guiones para mi app "Dos Caminos" (canal en inglés: "Two Paths Stories"). Son videos verticales sin voz: la pantalla se divide en dos y cada lado muestra una forma de vivir y su resultado.

REGLA DE ORO
Antes de escribir, busca en la web qué temas y formatos de reels son virales ahora (historias, ganchos y comparaciones que se están compartiendo esta semana) y úsalos como inspiración dentro de este formato. Escribe cada guion como el video del puente:
1. Gancho en los primeros 2 segundos: GANCHO corto que intrigue.
2. Conflicto claro: dos formas de vivir que se entienden de un vistazo y empiezan iguales.
3. Diferencia que crece: cada segundo se nota más en el dibujo.
4. Final con sorpresa: un desenlace que emocione y no sea obvio desde el principio, y una pregunta que invite a verlo otra vez.

REGLA DE ORO DE GUIONES (cómo tiene que doler)
1. El error del lado malo se ve desde el primer segundo (ej.: papá mira el móvil mientras su hijo quiere jugar). Misma escena y personajes en los dos lados; en cuanto cada uno elige, el error ya está en pantalla.
2. Dolor real entre dos personas: pareja, padres e hijos, amistad, familia.
3. Alguien carga solo, espera o es ignorado, como en el video del puente.
4. Final que duele y hace pensar «esto me pasa a mí».
5. Siempre con FRASE fuerte y con A-MOMENTOS y B-MOMENTOS de 8 sucesos, para que funcione en 15, 30 y 45 segundos.
Ejemplo modelo:
TITULO: Espera, hijo, un momento
FRASE: Tu hijo no necesita un papá perfecto. Necesita un papá *presente*.
TEMA: hijos
EMOCION: emotiva
DIVISION: arriba-abajo
GANCHO: Papá, ¿juegas conmigo?
A: DEJA EL MÓVIL Y JUEGA | TARDE {1-30} | parque | hombre+nino | jugar+jugar | se abrazan
B: ESPERA, HIJO, UN MOMENTO | TARDE {1-30} | parque | hombre+nino | celular+jugar | se alejan
A-MOMENTOS: el niño saluda > él lo mira > se ríen > el niño salta > él lo sujeta > el contador salta > celebran juntos > se abrazan
B-MOMENTOS: él mira el móvil > el niño saluda > él no lo ve > el niño lo mira > el contador salta > el niño se cansa > anochece > el niño llora
PREGUNTA: ¿Cuántas veces le dijiste «un momento»?
TITULO_EN: Hold on, buddy, one minute
GANCHO_EN: Dad, will you play with me?
A_EN: PUTS THE PHONE DOWN | AFTERNOON {1-30}
B_EN: HOLD ON, BUDDY | AFTERNOON {1-30}
FRASE_EN: Your kid doesn't need a perfect dad. Just a *present* one.
PREGUNTA_EN: How many times have you said "one minute"?
---

Usa EXACTAMENTE este formato, un guion tras otro, separados por una línea con tres guiones (---). No añadas nada más.

TITULO: título corto (distinto en cada guion)
FRASE: frase final fuerte que aparece grande al terminar el video, tal cual (siempre; pon *una palabra clave* entre asteriscos para que salga en rojo)
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados | tiempo
GANCHO: frase de 3 a 6 palabras para los primeros 2 segundos
A: TÍTULO DEL CAMINO A | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
B: TÍTULO DEL CAMINO B | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
A-MOMENTOS: 8 sucesos del camino A separados por >
B-MOMENTOS: 8 sucesos del camino B separados por >
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
0. DOS TIPOS DE LADO MALO:
   · «Se rinde»: úsalo con caer, levantarse, caer-bici o levantarse-bici, o con el final «se queda». Los dos empiezan iguales y hacen lo mismo; el momento difícil les llega a la vez; el bueno se levanta y sigue; el malo lo intenta un poco y se desanima. A y B con la misma escena y personajes; la acción de B dice cómo se queda al rendirse (celular, sentarse, esperar).
   · «Luchar solo» (como el puente): en B uno trabaja y el otro espera o mira el móvil desde el principio; el que trabaja lucha solo y llega agotado. Final: llega-agotado. Ej: B: UNO CONSTRUYE, EL OTRO ESPERA | DÍA {1-90} | puente | hombre+mujer | construir+esperar | llega-agotado
1. (En arriba-abajo y lados) Los dos caminos empiezan en igualdad de condiciones: misma escena, mismos personajes, mismo punto de partida.
2. En los primeros segundos se ve el momento en que cada uno elige distinto (uno toma la tabla, el otro saca el móvil).
3. Desde ahí la diferencia crece poco a poco hasta el final: uno crece o se une; el otro se seca, se queda atrás o se cae.
4. Un lado termina bien y el otro mal. Se cuenta con acciones y objetos, no con carteles.
5. Temas universales: pareja, familia, hijos, dinero, trabajo, amistad, salud, el móvil y la constancia. Fe solo de vez en cuando, sutil y con un mensaje que entienda cualquiera. Cada guion, de un tema distinto.

REGLA FIJA DE RITMO
En todos los videos (15, 30, 45 o 60 s) pasa algo nuevo y visible cada 2 o 3 segundos; nunca más de 3 segundos de la misma acción repetida. Para eso escribe en cada lado A-MOMENTOS y B-MOMENTOS: 8 sucesos cortos separados por «>» que cuenten la historia paso a paso (cada uno dura lo mismo; no salen escritos, se dibujan). Ejemplo:
A-MOMENTOS: llueve > se cubren juntos > ella tropieza > él la sujeta > se ríen
B-MOMENTOS: llueve > él se cubre solo > ella tropieza > él no lo ve > ella se aleja
En «se rinde», los sucesos de A y B antes de la caída deben ser los mismos. Escribe siempre 8: en 15 s la app usa 5 de ellos (el primero, el último y tres de en medio), en 30 y 45 s los usa todos.
SUCESOS QUE LA APP SABE DIBUJAR (usa estas palabras; di quién: él, ella, el niño, la niña, juntos):
- tiempo y escenario: llueve, sale el sol, anochece, nieva, sopla el viento, trueno, pasa un pájaro, estrella fugaz, algo cae (cae una manzana…), llega alguien (llega su hijo…), se enciende, se apaga, el contador salta
- personajes: corazón, tropieza, se cae, la sujeta / le da la mano, se abrazan, se ríen, celebra / salta / baila, saluda, no lo ve / mira el móvil, mira, llora, se cansa / suspira, se sorprende, piensa / recuerda, se sienta, se aleja, se acerca / vuelve, se cubre(n), duerme, sigue / lo intenta otra vez
- gestos de emoción: tiene ansiedad (mano en la cabeza, vueltecita, mira el móvil y suspira), espera con ilusión (de puntillas mirando al otro), se pone triste (cabeza baja y se sienta despacio), está distraído / no contesta / se ríe con la pantalla (de espaldas al otro), le da un corazón (se lo entrega con las dos manos), recibe el corazón (lo guarda en el pecho), estoy contigo (mano en el hombro), le pide (estira las manos pidiendo atención), aplaude / con alegría (saltitos y aplausos), un abrazo largo (se abrazan y se mecen)
Si no escribes MOMENTOS, la app elige sucesos con significado por su cuenta: en el lado bueno se pasan corazoncitos; en el malo, uno pide o espera y el otro está distraído.

REGLA FIJA DE EMOCIONES
Los personajes ACTÚAN con gestos que cuentan la historia. Cada gesto tiene un significado claro y es un gancho para quien mira. Nada de moverse por moverse. Usa los gestos de emoción en A-MOMENTOS y B-MOMENTOS: en el lado bueno, corazones que se dan y se guardan, alegría, abrazo largo; en el malo, el contraste: uno pide o espera con ilusión y el otro está distraído, y después ansiedad y tristeza.

REGLAS DEL TEXTO
- Títulos de cada lado: máximo 5 palabras, en mayúsculas.
- Contador animado: {inicio-fin} dentro del subtítulo. Ej: DÍA {1-45}, AÑO {1-10}, SEMANA {1-52}.
- TITULO: máximo 10 palabras y nunca repetido entre guiones. FRASE (siempre, fuerte): máximo 14 palabras; es la frase final del video y sale tal cual. Marca como mucho una palabra clave entre *asteriscos* (sale en rojo). PREGUNTA: máximo 9 palabras.

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
- final malo: se seca, se apaga, se vacía, se mojan, pierden, se queda, se queda atrás, nunca se completa, se cae, se alejan, llega-agotado
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
B: UNO CONSTRUYE, EL OTRO ESPERA | DÍA {1-90} | puente | hombre+mujer | construir+esperar | llega-agotado
PREGUNTA: ¿Cuál de los dos eres tú?
TITULO_EN: The bridge
GANCHO_EN: Same bridge. Two stories.
A_EN: BOTH OF THEM BUILD | DAY {1-90}
B_EN: ONE BUILDS, ONE WAITS | DAY {1-90}
FRASE_EN: Love is built from *both* sides.
PREGUNTA_EN: Which one are you?
---

Escríbeme guiones nuevos, cada uno de un tema distinto, sobre: `;
