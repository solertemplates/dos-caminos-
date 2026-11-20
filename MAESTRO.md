# DOS CAMINOS — Documento maestro

> **Leer completo antes de tocar nada.** Este documento manda sobre cualquier otra decisión.
> Cada vez que cambie algo importante de la app, se actualiza aquí en el mismo cambio.

Última actualización: 20 nov 2026 (REGLA DE ORO para escribir guiones).

---

## ⭐ REGLA DE ORO (para escribir guiones)

**Antes de escribir guiones, Claude debe buscar en la web qué temas y formatos de reels son virales ahora** (qué historias, ganchos y comparaciones se están compartiendo esta semana) y usar eso como inspiración, siempre dentro del formato y el sello de Dos Caminos.

Cada guion debe tener, como el video del puente:

1. **Gancho en los primeros 2 segundos:** una frase GANCHO corta y una imagen que intrigue («Un mismo puente. Dos historias.»).
2. **Conflicto claro:** dos formas de vivir fáciles de entender de un vistazo, en igualdad al principio.
3. **Diferencia que crece:** cada segundo la distancia entre los dos caminos se nota más en el dibujo.
4. **Final con sorpresa:** un desenlace que emocione y no sea obvio desde el principio (el puente que por fin se une, la carta que llega, la llave que se enciende arriba), y una pregunta que invite a verlo otra vez.

El botón «Copiar instrucciones para Claude» (`js/format.js`) empieza con esta misma regla.

---

## 1. Qué es

Web app para iPhone (GitHub Pages, se instala con «Añadir a pantalla de inicio») que crea **videos verticales 9:16 en MP4, sin voces**. Cada video compara **dos formas de vivir y sus resultados**. Público: jóvenes y adultos que pasan reels sin parar.

- Canal en español: **Dos Caminos**. Canal en inglés: **Two Paths Stories** (inglés natural de EE. UU.).
- Todo se crea en el teléfono: **sin voces, sin imágenes de IA, sin costes de API**.
- Enlace: https://solertemplates.github.io/dos-caminos-/

## 2. Sello fijo de «Dos Caminos» (no cambiar nunca)

1. **Fondo negro con estrellitas** que aparecen y desaparecen suavemente, como en el universo (no se desplazan).
2. **Muñequitos blancos** con la misma simetría y proporciones del video del puente: cabeza redonda blanca rellena, cuerpo y extremidades de palitos blancos, siempre **dos brazos y dos piernas** y siempre **pisando el suelo** (o de rodillas / sentados, apoyados). Movimientos suaves.
   - La **muñequita** lleva **moñito atrás** y **sayita** sencilla.
   - Sin nombres, sin caras, sin protagonista fijo.
3. **Objetos simples, limpios y ordenados**, como las pilas de tablas del puente. Si el guion nombra un objeto concreto (flor, carta, pan, llave…), se dibuja ese objeto (ver §6 «Objetos concretos»). Suelo y orillas como masas sólidas gris muy oscuro que se funden con el negro.
4. **Pocos toques de color cálido** (rojo o naranja: corazones brillantes, fogatas, una ventana encendida), solo en los momentos importantes. Nada de colores chillones ni azules fríos ni efectos de videojuego antiguo.
5. **Final feliz = corazón grande y brillante** sobre el lado que termina bien.
6. **Títulos de arriba bajados** para que no los tapen la flecha ni los botones de YouTube/Instagram/TikTok. Todo lo importante va dentro de la zona segura (ver §7).
7. Texto en pantalla: pocas palabras, letras pequeñas y elegantes, arriba, nunca encima de los personajes. Se cuenta con acciones, no con carteles.

Código: `js/figure.js` (muñequitos), `js/scenes.js` (escenas), `js/render.js` (composición, estrellas, textos, zona segura).

## 3. Regla de los guiones (historia)

1. **Igualdad al inicio:** los dos caminos empiezan iguales (misma escena, mismos personajes, de pie, sin objetos, contador en 1).
2. **Momento de la elección** en los primeros segundos (≈ 2,2–2,6 s): cada uno elige distinto y se nota (uno toma la tabla, el otro saca el móvil). La línea divisoria late y suena una nota que se separa en dos.
3. **La diferencia crece poco a poco** en el dibujo: pared bien alineada frente a pared de ladrillos desalineados (siempre rectos y limpios, nunca torcidos: unos un poco más arriba y otros más abajo, cada vez más desparejos) hasta que se cae; árbol verde frente a árbol que pierde hojas; corazón que se va apagando; mesa que se separa.
4. Al final uno **crece / se une / llega** y el otro **se seca / se queda atrás / se cae**.
5. **Temas:** universales — pareja, familia, hijos, dinero, trabajo, amistad, salud, el móvil, la constancia. **Fe casi nunca**: como mucho un guion de vez en cuando, sutil, con un mensaje que entienda cualquiera. **Cada guion, de un tema distinto.**
6. **Tipo «tiempo»** (`DIVISION: tiempo`): un solo camino visto en tres momentos — HOY, EN UN MES, EN UN AÑO. Mismo personaje y mismo camino en las tres franjas; lo que cambia es el resultado (el árbol crece, la alcancía se llena, la escalera se sube, la casa se completa). Las franjas se revelan una tras otra y al final **EN UN AÑO se ilumina** con luz cálida y el **corazón grande**. Aquí no hay momento de elección (es un solo camino).
7. Los guiones los escribe el usuario (con Claude). La app **no inventa guiones con plantillas**. El único ejemplo incluido es el del puente.

## 4. Estructura del video (15 / 30 / 45 s)

| Momento | Qué pasa |
|---|---|
| 0 – 1,2 s | **Gancho:** se ve el final de las dos historias + frase GANCHO + estrella fugaz + latido. |
| 1,2 – 1,8 s | Rebobinado rápido (sonido suave) hasta el inicio. |
| 1,8 – 2,6 s | **Igualdad y elección**: los dos iguales, «DÍA 1»; cada uno elige distinto. |
| hasta el resultado | La diferencia crece; contador animado. |
| resultado (2–3 s) | Uno florece (corazón grande y brillante), el otro se apaga. |
| cierre (3,5–6,5 s) | **Frase final = el TITULO del guion** (TITULO_EN en inglés) + pregunta («¿Cuál de los dos eres tú?») + pequeño corazón rojo. El final se parece al inicio para que den ganas de verlo otra vez. |

## 5. Formato de guion

Un guion tras otro, separados por una línea `---`:

```
TITULO: título corto (es también la FRASE FINAL del video; distinto en cada guion)
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados | tiempo
GANCHO: frase de 3 a 6 palabras
A: TÍTULO A | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
B: TÍTULO B | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
FRASE: reflexión final corta
PREGUNTA: pregunta final corta
TITULO_EN: short title
GANCHO_EN: hook in natural US English
A_EN: PATH A TITLE | SUBTITLE WITH COUNTER
B_EN: PATH B TITLE | SUBTITLE WITH COUNTER
FRASE_EN: closing line in natural US English
PREGUNTA_EN: closing question in natural US English
---
```

- **Frase final del video = `TITULO`** (y `TITULO_EN` en inglés), para que ningún video termine igual que otro. Si el guion no tiene `TITULO`, se usa una frase de una lista de 60 (`js/finals.js`, español e inglés) que **no se repite dentro del mismo lote**. `FRASE` ya no sale en el video: solo se usa en los textos para publicar.
- Títulos de cada lado: máximo 5 palabras, en mayúsculas. TITULO ≤ 10 palabras. FRASE ≤ 14 palabras. PREGUNTA ≤ 9 palabras.
- **Contador animado:** `{inicio-fin}` dentro del subtítulo → `DÍA {1-45}` va de «DÍA 1» a «DÍA 45».
- Si falta `TEMA`, se usa `constancia`. Si falta `EMOCION`, la del tema. Si falta `PREGUNTA`, «¿Cuál de los dos eres tú?» / «Which one are you?».
- Los campos `_EN` se usan cuando en la app se elige *English (US)*. Deben ser inglés natural, no traducción literal.
### Tipo «tiempo» (`DIVISION: tiempo`)

Se escribe con **una sola línea `A:`** (sin `B:`). El contador se reparte solo: HOY = inicio, EN UN MES = 1/12 del total, EN UN AÑO = final. Escenas recomendadas: `arbol` (regar), `alcancia` (ahorrar), `escalera` (subir), `casa` (construir). Opcional: `ETAPAS: HOY | EN UN MES | EN UN AÑO` y `ETAPAS_EN: TODAY | IN A MONTH | IN A YEAR`. Si falta `PREGUNTA`: «¿Dónde quieres estar dentro de un año?» / «Where do you want to be a year from now?».

```
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
```

- Las instrucciones completas para Claude están en `js/format.js` (botón *Ajustes → Copiar instrucciones para Claude*). **Mantenerlas iguales a este documento.**

## 6. Vocabulario completo que entiende el formato

Regla: **todas las escenas dibujan a todos los personajes del guion** (máximo 2; 3 en `mesa`), bien colocados y con el mismo sello. Cada escena tiene un decorado propio que se reconoce desde el primer segundo, para que los videos no parezcan repetidos.

### Escenas (25)

| Escena | Qué se ve | Acciones | Ejemplo de línea |
|---|---|---|---|
| `puente` | Dos orillas, un precipicio y pilas de tablas | construir, esperar, celular, descansar | `A: LOS DOS CONSTRUYEN \| DÍA {1-90} \| puente \| hombre+mujer \| construir+construir \| se unen` |
| `arbol` | Un arbolito que crece con frutos rojos o pierde las hojas | regar, cuidar, celular, dormir, orar, orar-domingo | `A: RIEGA SU SUEÑO \| DÍA {1-100} \| arbol \| mujer+nina \| regar+regar \| crece` |
| `alcancia` | Frasco de monedas que se llena o se vacía en bolsas | ahorrar, gastar, celular | `B: GASTA TODO \| SEMANA {1-52} \| alcancia \| hombre \| gastar \| se vacía` |
| `casa` | Muro de ladrillos rectos: alineado con techo y ventana, o desalineado hasta caerse | construir, descansar, celular | `B: SIN BASE \| MES {1-24} \| casa \| hombre+nino \| construir+construir \| se cae` |
| `escalera` | Siete escalones y una luz arriba | subir, sentarse | `A: UN ESCALÓN AL DÍA \| DÍA {1-60} \| escalera \| mujer \| subir \| llega` |
| `mesa` | Mesa con lámpara; conversan o miran el móvil y se separan | hablar, celular | `B: CADA UNO EN SU PANTALLA \| NOCHE {1-200} \| mesa \| hombre+mujer+nino \| celular+celular+celular \| se aleja` |
| `fogata` | Un fuego que se alimenta o se apaga en humo | cuidar, celular, alejarse | `A: LO CUIDAN \| AÑO {1-10} \| fogata \| hombre+mujer \| cuidar+cuidar \| crece` |
| `camino` | Una colina con bandera; al llegar sale el sol | caminar, correr, levantarse, caer, sentarse | `A: SE LEVANTA \| INTENTO {1-30} \| camino \| mujer \| levantarse \| llega` |
| `libros` | Lee y la pila de libros crece hasta subirse en ella | leer, celular | `A: LEEN JUNTOS \| NOCHE {1-100} \| libros \| mujer+nina \| leer+leer \| crece` |
| `abrazo` | Dos personas con un corazón en medio | acercarse, alejarse | `B: SE OLVIDAN \| AÑO {1-5} \| abrazo \| hombre+hombre \| alejarse+alejarse \| se alejan` |
| `cocina` | Mueble con fogones, olla y utensilios colgados; vapor o humo de comida quemada | cocinar, celular (2.º personaje: espera sentado para comer) | `A: COCINA CON CALMA \| CENA {1-30} \| cocina \| mujer+nino \| cocinar+hablar \| crece` |
| `oficina` | Escritorio con pantalla y una gráfica en la pared que sube o baja | trabajar, dormir, celular | `B: SE DUERME EN LA MESA \| SEMANA {1-12} \| oficina \| hombre \| dormir \| pierden` |
| `parque` | Árbol redondo, banco y columpio; juegan con una pelota | jugar, caminar, celular | `A: JUEGA CON SU HIJA \| TARDE {1-50} \| parque \| hombre+nina \| jugar+jugar \| se abrazan` |
| `coche` | Coche en la carretera: llega a casa o se choca con un cono | conducir, celular (2.º: hablar o celular) | `B: MIRA EL MÓVIL \| KM {1-90} \| coche \| hombre \| celular \| se cae` |
| `gimnasio` | Estante de pesas, banco y barra que acaba sobre la cabeza | entrenar, sentarse | `A: ENTRENA CADA DÍA \| DÍA {1-90} \| gimnasio \| mujer \| entrenar \| crece` |
| `cama` | Cama y ventana con luna que se vuelve sol | dormir, celular, levantarse | `A: SE ACUESTA TEMPRANO \| NOCHE {1-30} \| cama \| hombre \| dormir \| se despiertan` |
| `sofa` | Sofá, alfombra y lámpara de pie cálida | hablar, celular, abrazar | `A: SE CUENTAN EL DÍA \| NOCHE {1-100} \| sofa \| hombre+mujer \| hablar+abrazar \| se abrazan` |
| `huerto` | Cerca, surcos y plantas que dan frutos naranjas | sembrar, regar, descansar, celular | `A: SIEMBRA CADA MAÑANA \| DÍA {1-60} \| huerto \| mujer+nina \| sembrar+sembrar \| crece` |
| `montana` | Montaña escarpada con nieve, tienda de campaña y bandera naranja en la cima | escalar, sentarse, caer | `B: SE RINDE ABAJO \| DÍA {1-20} \| montana \| hombre \| sentarse \| se queda` |
| `lluvia` | Nubes y lluvia; paraguas; al final sale el sol o crece el charco | paraguas, mojarse, compartir | `A: COMPARTE SU PARAGUAS \| DÍA {1-7} \| lluvia \| mujer+nino \| compartir+paraguas \| se secan` |
| `tienda` | Puesto con toldo a rayas, productos y monedas | vender, esperar (2.º: el cliente) | `A: ATIENDE CON GANAS \| MES {1-12} \| tienda \| hombre+mujer \| vender+vender \| ganan` |
| `carta` | Mesita para escribir, buzón y la puerta de quien recibe | escribir, olvidar (2.º: esperar) | `A: LE ESCRIBE \| SEMANA {1-20} \| carta \| mujer+hombre \| escribir+esperar \| se unen` |
| `reloj` | Reloj grande en la pared; tareas que pasan de una pila a otra | aprovechar, perder | `B: DEJA PASAR LAS HORAS \| HORA {1-24} \| reloj \| hombre \| perder \| pierden` |
| `telefono` | Dos casas; ondas de una llamada; al final una línea naranja las une | llamar, ignorar | `B: NO CONTESTA \| LLAMADA {1-15} \| telefono \| mujer+hombre \| llamar+ignorar \| pierden` |
| `regalo` | Caja con lazo (rojo solo al abrirla) y estante de regalos guardados | dar, guardar (2.º: esperar) | `A: LO DA A TIEMPO \| DÍA {1-30} \| regalo \| hombre+nina \| dar+esperar \| se unen` |

### Objetos concretos (38)

**Regla para todas las escenas:** si el `TITULO` o el título/subtítulo de un lado (`A:` / `B:`, también `_EN`) nombra uno de estos objetos, la escena dibuja **ese objeto** en lugar de su objeto genérico, con el mismo sello: líneas blancas; en el lado que termina bien se enciende en **rojo o naranja** al final, y en el lado malo se va apagando (y se cae si el final es `se cae` o `se alejan`). Si el objeto no está en la lista, se usa el genérico de la escena.

- Si un lado nombra su propio objeto, ese lado lo usa; si no, se usa el del `TITULO`.
- Si hay varios, gana el que va tras un artículo («Te regalo **una flor**» → flor; «**Un regalo** para mamá» → regalo); si no, el primero.
- Dónde aparece: reemplaza lo que la escena tiene en la mano o en juego (corazón de quien espera en el puente, moneda en la alcancía, libro en las manos, pelota del parque, carta, regalo, productos de la tienda, luz de la escalera, cima de la montaña, corazón del abrazo, techo del coche); en las demás escenas aparece en un sitio fijo junto al personaje (sobre la mesa, el escritorio o el mueble de cocina, junto al árbol, en la cima del camino, bajo el columpio, en una mesita junto al sofá, etc.).
- En el parque solo se lanzan objetos pequeños (pelota, manzana, flor, globo…); los grandes, como la bicicleta, esperan bajo el columpio.

| Objeto | Palabras que lo activan (también en inglés: flower, letter, bread, ball, book, money, coin, key, ring, cup, bike, gift…) | Ejemplo |
|---|---|---|
| `flor` | flor, flores, rosa | `TITULO: Te regalo una flor` |
| `carta` | carta, cartas | `A: UNA CARTA CADA SEMANA | SEMANA {1-20} | carta | …` |
| `pan` | pan | `TITULO: El pan de cada día` |
| `pelota` | pelota, balón | `A: SU PELOTA FAVORITA | TARDE {1-50} | parque | …` |
| `libro` | libro, libros, biblia | `A: UN LIBRO CADA NOCHE | NOCHE {1-90} | libros | …` |
| `dinero` | dinero, billete, dólares | `A: AHORRA {0-500} DÓLARES | … (subtítulo)` |
| `moneda` | moneda, monedas | `TITULO: Moneda a moneda` |
| `llave` | llave, llaves | `TITULO: La llave del éxito` |
| `anillo` | anillo, alianza | `TITULO: Un anillo para siempre` |
| `taza` | taza, café | `TITULO: Un café en la oficina` |
| `bicicleta` | bicicleta, bici | `TITULO: Su primera bicicleta` |
| `regalo` | regalo, regalos | `TITULO: Un regalo a tiempo` |
| `maleta` | maleta, equipaje | `TITULO: La maleta lista` |
| `guitarra` | guitarra | `A: PRACTICA LA GUITARRA | DÍA {1-100} | …` |
| `vela` | vela, velas | `TITULO: Una vela encendida` |
| `mochila` | mochila | `TITULO: Su mochila del colegio` |
| `zapatos` | zapatos, tenis, zapatillas | `TITULO: Los tenis de correr` |
| `foto` | foto, fotos, retrato | `TITULO: La foto de la familia` |
| `estrella` | estrella, estrellita | `TITULO: Tu estrella` |
| `globo` | globo, globos | `TITULO: Un globo rojo` |
| `cometa` | cometa, papalote | `TITULO: La cometa de papá` |
| `sombrero` | sombrero, gorra | `TITULO: El sombrero del abuelo` |
| `gafas` | gafas, lentes | `TITULO: Sus lentes nuevos` |
| `botella` | botella, agua | `A: TOMA AGUA | DÍA {1-30} | gimnasio | …` |
| `plato` | plato, comida, cena | `TITULO: La cena en casa` |
| `manzana` | manzana, fruta | `TITULO: Una manzana al día` |
| `pastel` | pastel, torta, tarta, cumpleaños | `TITULO: Su pastel de cumpleaños` |
| `osito` | osito, peluche, juguete | `TITULO: El osito de peluche` |
| `maceta` | maceta, planta, plantita | `TITULO: La plantita de la ventana` |
| `martillo` | martillo, herramienta | `TITULO: El martillo del abuelo` |
| `lapiz` | lápiz, lápices | `TITULO: Un lápiz y un sueño` |
| `cuaderno` | cuaderno, libreta | `TITULO: El cuaderno de metas` |
| `trofeo` | trofeo, medalla, premio | `TITULO: La medalla llegó` |
| `camara` | cámara | `TITULO: La cámara de fotos` |
| `auriculares` | auriculares, audífonos | `A: CON AUDÍFONOS | NOCHE {1-30} | sofa | …` |
| `candado` | candado | `TITULO: El candado del amor` |
| `semilla` | semilla, semillas | `TITULO: Una semilla cada día` |
| `corona` | corona | `TITULO: La corona de mamá` |

### Personajes

| Palabra | Quién | Ejemplo |
|---|---|---|
| `hombre` | adulto (también: papa, padre, esposo, abuelo) | `hombre` |
| `mujer` | adulta con moñito y sayita (también: mama, madre, esposa, abuela) | `hombre+mujer` |
| `nino` | niño, más pequeño (también: hijo) | `hombre+nino` |
| `nina` | niña, con moñito y sayita (también: hija) | `mujer+nina` |

Se unen con `+`. Máximo 2 personajes (3 en `mesa`). Las acciones van en el mismo orden que los personajes: `hombre+mujer | construir+esperar`. Si hay menos acciones que personajes, se repite la última.

### Acciones

| Acción | Qué hace | Ejemplo |
|---|---|---|
| `construir` | Pone tablas o ladrillos, uno por uno | `puente \| hombre+mujer \| construir+construir` |
| `esperar` | Espera de pie (en el puente, con un corazón rojo; en la carta, junto a su puerta; en la tienda, sentado) | `puente \| hombre+mujer \| construir+esperar` |
| `celular` | Mira el móvil con la cabeza baja | `mesa \| hombre+mujer \| celular+celular` |
| `descansar` | Empieza un poco y lo deja; se sienta | `huerto \| mujer \| descansar` |
| `regar` / `cuidar` | Riega (en la fogata, cuidar = echar leña) | `arbol \| hombre+nino \| regar+regar` |
| `dormir` | Duerme (en la cama, acostado; en la oficina, sobre la mesa) | `cama \| hombre \| dormir` |
| `ahorrar` / `gastar` | Echa monedas al frasco / las gasta en bolsas | `alcancia \| hombre \| ahorrar` |
| `subir` / `sentarse` | Sube escalones / se sienta en el suelo con el móvil | `escalera \| mujer \| subir` |
| `hablar` | Conversa sentado | `sofa \| hombre+mujer \| hablar+hablar` |
| `acercarse` / `alejarse` | Da pasos hacia el otro / le da la espalda y se va | `abrazo \| mujer+nina \| acercarse+acercarse` |
| `leer` | Lee sentado; cada libro va a la pila | `libros \| hombre \| leer` |
| `caminar` / `correr` | Sube la colina o pasea | `camino \| hombre \| correr` |
| `levantarse` | En el camino: se cae y se levanta. En la cama: se levanta temprano | `cama \| mujer \| levantarse` |
| `caer` | Se cae y se queda en el suelo (camino, montaña) | `montana \| hombre \| caer` |
| `cocinar` | Remueve la olla; salen vapor y platos | `cocina \| mujer \| cocinar` |
| `trabajar` | Teclea en el escritorio (en casa y puente, = construir) | `oficina \| hombre \| trabajar` |
| `jugar` | Se pasan una pelota | `parque \| hombre+nina \| jugar+jugar` |
| `conducir` | Maneja con las manos en el volante | `coche \| hombre \| conducir` |
| `entrenar` | Levanta pesas; cada vez más discos | `gimnasio \| mujer \| entrenar` |
| `abrazar` | Sentado, rodea al otro con el brazo | `sofa \| hombre+mujer \| hablar+abrazar` |
| `sembrar` | Se agacha y planta surco por surco | `huerto \| mujer+nina \| sembrar+sembrar` |
| `escalar` | Trepa la montaña con cuerda | `montana \| hombre+nino \| escalar+escalar` |
| `paraguas` | Se cubre con su paraguas | `lluvia \| mujer \| paraguas` |
| `mojarse` | Sin paraguas, tiembla bajo la lluvia | `lluvia \| mujer+nino \| paraguas+mojarse` |
| `compartir` | Cubre a los dos con un solo paraguas | `lluvia \| mujer+nino \| compartir+paraguas` |
| `vender` | Atiende el puesto; el cliente compra | `tienda \| hombre+mujer \| vender+vender` |
| `escribir` / `olvidar` | Escribe cartas que llegan / deja la carta sin escribir | `carta \| mujer+hombre \| escribir+esperar` |
| `aprovechar` / `perder` | Termina tareas una a una / mira el móvil mientras el reloj corre | `reloj \| hombre \| aprovechar` |
| `llamar` / `ignorar` | Llama o contesta / deja sonar el teléfono | `telefono \| mujer+hombre \| llamar+llamar` |
| `dar` / `guardar` | Lleva el regalo y lo entrega / lo guarda en el estante | `regalo \| hombre+nina \| dar+esperar` |
| `orar` / `orar-domingo` | (Solo fe, con moderación) ora cada día / solo el domingo | `arbol \| hombre \| orar` |

### Finales

| Tipo | Palabras | Qué se ve | Ejemplo |
|---|---|---|---|
| Bueno | `crece`, `florece`, `se unen`, `se llena`, `llega`, `ganan`, `se abrazan`, `se despiertan`, `se secan` (solo en `lluvia`) | Lo construido se completa + **corazón grande y brillante** | `... \| sofa \| hombre+mujer \| hablar+abrazar \| se abrazan` |
| Se apaga | `se seca`, `se apaga`, `se vacía`, `se mojan`, `pierden` | Hojas que caen, humo, frasco vacío, charco, gráfica que baja | `... \| oficina \| hombre \| dormir \| pierden` |
| Se queda | `se queda`, `se queda atrás`, `nunca se completa` | Queda a medias; el personaje se sienta, abatido | `... \| montana \| hombre \| sentarse \| se queda` |
| Se cae | `se cae` | Ladrillos o tablas se vienen abajo; el coche choca | `... \| coche \| hombre \| celular \| se cae` |
| Se alejan | `se alejan` | La distancia crece y el otro se va | `... \| carta \| mujer+hombre \| olvidar+esperar \| se alejan` |

Ejemplos de cada final nuevo:
- `se mojan` → `B: SIN PARAGUAS \| DÍA {1-7} \| lluvia \| mujer+nino \| paraguas+mojarse \| se mojan`
- `se secan` → `A: COMPARTE SU PARAGUAS \| DÍA {1-7} \| lluvia \| mujer+nino \| compartir+paraguas \| se secan`
- `se abrazan` → `A: JUEGA CON ELLA \| TARDE {1-50} \| parque \| hombre+nina \| jugar+jugar \| se abrazan`
- `ganan` → `A: ATIENDE CON GANAS \| MES {1-12} \| tienda \| hombre+mujer \| vender+vender \| ganan`
- `pierden` → `B: DEJA PASAR LAS HORAS \| HORA {1-24} \| reloj \| hombre \| perder \| pierden`
- `se despiertan` → `A: SE ACUESTA TEMPRANO \| NOCHE {1-30} \| cama \| hombre \| dormir \| se despiertan`

## 7. Pantalla y zona segura

- Lienzo 1080 × 1920, 30 fps, H.264 + AAC.
- **Arriba-abajo:** títulos a la izquierda en y≈290 (panel A) y y≈850 (panel B); suelos en y≈680 y y≈1292.
- **Lados:** títulos centrados en y≈305; suelo en y≈1000.
- **Tiempo:** tres franjas de 390 px desde y≈175 (HOY, EN UN MES, EN UN AÑO); etiqueta a la izquierda y suelo a 340 px del borde superior de cada franja; termina en y≈1355.
- Nada importante por debajo de y≈1360 (ahí van el nombre de la cuenta y la descripción) ni pegado al borde derecho en la mitad de abajo (columna de botones).

## 8. App (pocos botones)

- **Pantalla principal:** Pegar guiones · Duración (15/30/45) · Idioma (Español / English US) · Crear videos. Arriba: «Mis videos» y Ajustes.
- **Pegar guiones:** cada guion aparece con su casilla; botones **Crear seleccionados** y **Crear todos**.
- **Creación en tanda:** cada video se guarda en el teléfono (IndexedDB) **en cuanto termina**. La tanda se guarda; si la app se cierra o el teléfono se bloquea, al volver aparece «Continuar» y sigue donde se quedó. Se pide mantener la pantalla encendida (y se usa Wake Lock cuando el iPhone lo permite).
- **Mis videos:** todos los videos guardados; ver, borrar; cada uno tiene **Descargar video**, que abre el menú compartir del iPhone solo con el MP4 para elegir **«Guardar video»** y guardarlo en Fotos (queda marcado con ✓). El MP4 lleva siempre la música dentro (H.264 + AAC); **Guardar todos** y **ZIP** (con los textos). Cada video tiene una **casilla**; abajo del todo, **Borrar seleccionados** y **Borrar todo** (los dos piden confirmación). Cada video tiene **Facebook, Instagram, YouTube, TikTok**: copian el texto de esa red y abren el menú de compartir con el video. Se marca con **✓** cada red donde ya se publicó (en cualquier orden).
- **Música:** cada video sale **con la música ya metida en el MP4** (sirve para Facebook). Banco de música en el teléfono (MP3/M4A), categoría automática editable (romántica, tensión, triste, emotiva, inspiracional, alegre); se elige según la emoción y sin repetir siempre la misma. Sin canciones, la app genera una música suave propia.
- **Efectos de sonido:** pocos, suaves, sincronizados con lo que pasa; generados por código y publicados bajo **CC0**.
- **Ajustes:** formato de guion (copiar instrucciones para Claude), banco de frases, banco de música, video (división, calidad, efectos, estrellita), acerca de.
- **Banco de frases de René Soler Rasua:** pegar una o muchas, ver, editar, borrar. Quedan guardadas, pero **ya no reemplazan la frase final** (que es siempre el TITULO del guion).
- **Textos para publicar:** título corto, frase, pregunta, «Sígueme para más» / «Follow Two Paths Stories for more.», hashtags por tema y red. En Facebook, 1 de cada 4 videos: «Si este mensaje te tocó, puedes apoyar con una estrellita.» / «If this one touched you, you can support the page with a Star.»

## 9. Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html`, `styles.css` | Interfaz |
| `js/app.js` | Lógica de la interfaz, tanda que se retoma, Mis videos |
| `js/parser.js` | Lectura de guiones y vocabulario |
| `js/examples.js` | Solo el guion de ejemplo del puente |
| `js/format.js` | Instrucciones para Claude |
| `js/figure.js` | Muñequitos y poses |
| `js/scenes.js` | Las 10 primeras escenas y herramientas comunes |
| `js/scenes2.js` | Las 15 escenas nuevas |
| `js/objects.js` | Los 38 objetos concretos y las palabras que los activan |
| `js/render.js` | Composición, estrellas, textos, línea de tiempo, zona segura |
| `js/audio.js` | Efectos CC0 y mezcla de música |
| `js/encoder.js` | MP4 (WebCodecs + mp4-muxer; respaldo MediaRecorder) |
| `js/storage.js` | IndexedDB / localStorage |
| `js/music.js` | Banco de música |
| `js/publish.js` | Textos para cada red |
| `vendor/mp4-muxer.mjs` | Librería MIT |
