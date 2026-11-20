# DOS CAMINOS — Documento maestro

> **Leer completo antes de tocar nada.** Este documento manda sobre cualquier otra decisión.
> Cada vez que cambie algo importante de la app, se actualiza aquí en el mismo cambio.

Última actualización: 20 nov 2026 (dos tipos de lado malo: «se rinde» y «luchar solo» con el final llega-agotado).

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

8. **REGLA FIJA DE MOVIMIENTO: todos los movimientos son como los de una persona real.** Piernas, brazos, manos y objetos se mueven coordinados y en la dirección correcta (ver «Movimiento real» abajo). **Toda acción nueva debe cumplir esta regla y probarse en los dos lados de la división antes de subirla.**

Código: `js/figure.js` (muñequitos), `js/scenes.js` (escenas), `js/render.js` (composición, estrellas, textos, zona segura).

### Movimiento real (cómo está hecho y qué hay que comprobar)

| Movimiento | Cómo debe verse | Cómo lo cumple la app |
|---|---|---|
| Caminar / correr | Brazo contrario a la pierna; la rodilla se dobla al adelantar la pierna; mira hacia donde va; los pies no patinan | La zancada depende de la **distancia recorrida** (medio paso ≈ 0,4·F caminando, 0,55·F corriendo); si no avanza, queda quieto; mira en la dirección del movimiento (`walkMove`, `walkDist`) |
| Subir escaleras | Un pie por escalón | Medio paso por escalón |
| Escalar | Pasos cortos y brazos que alternan hacia arriba | Zancada según lo que sube, brazos al ritmo de los pasos |
| Montar en bici | **Pedalea hacia delante**; cada pie sigue su pedal; rodillas hacia delante; ruedas apoyadas en el suelo; si no avanza, no pedalea | Piernas calculadas desde la cadera hasta el pedal (cinemática inversa); la biela gira según lo recorrido; radios que giran en el sentido de la marcha; la bici se inclina con la pendiente |
| Caer de la bici | Se cae al lado y la bici queda tumbada | — |
| Construir / sembrar | Lleva la pieza, se agacha, la coloca y avanza **lo que mide** la pieza | El paso tras colocar mide lo mismo que la tabla o el ladrillo |
| Lanzar y atrapar | Estira los brazos al soltar y al recibir, cuando la pelota sale o llega | Cada uno estira los brazos solo cuando la pelota está en sus manos |
| Beber / comer | Lleva el recipiente a la boca, inclina la cabeza y la taza o botella hacia la cara | Taza y botella se inclinan al beber |
| Tocar la guitarra | El mástil apunta a la mano que pisa las cuerdas; la otra rasguea sobre la caja | El mástil se orienta hacia esa mano |
| Martillar | Agachado, golpea un clavo en una tabla; el mango sale de la mano siguiendo el antebrazo | Tabla y clavo bajo el golpe; martillo alineado con el antebrazo |
| Escribir | La punta del lápiz sobre la libreta | Lápiz apoyado e inclinado hacia delante |
| Llevar la maleta | Va detrás, tirada del asa extendida | Maleta con ruedas detrás y asa hasta la mano |
| Conducir | Manos en el volante; las ruedas giran en el sentido de la marcha; la carretera pasa hacia atrás | Sí |
| Regar | Inclina la regadera hacia la planta y el agua cae delante | Sí; al regar varias plantas camina de una a otra |

**Antes de subir una acción nueva:** comprobarla en imágenes en el lado de arriba y el de abajo (arriba-abajo) y en el izquierdo y el derecho (lados), con un adulto y con un niño, al principio, a la mitad y al final del video.

## 3. Regla de los guiones (historia)

### ⭐ DOS TIPOS DE LADO MALO

| Tipo | Cuándo se usa | Cómo se ve |
|---|---|---|
| **«Se rinde»** | Solo si el guion tiene `caer`, `levantarse`, `caer-bici` o `levantarse-bici`, o el final del lado malo es «se queda» (también «se queda atrás») | Los dos lados empiezan iguales y hacen lo mismo; el momento difícil les llega a la vez; el bueno se levanta y sigue; el malo lo intenta un poco y se desanima (regla del arco, abajo). |
| **«Luchar solo»** | Todos los demás guiones (como el puente) | Cada lado hace lo suyo desde los primeros segundos: en el malo uno trabaja y el otro espera o mira el móvil. El que trabaja lucha tanto como en el lado bueno, pero solo. Con el final **`llega-agotado`** llega sin fuerzas: se tambalea, hombros caídos, cabeza baja y brazos colgando, y no puede recibir el corazón o el abrazo que le ofrecen (el que esperaba se lo tiende; el corazón se va apagando). |

Ejemplo «luchar solo» (el puente, como siempre):
```
A: LOS DOS CONSTRUYEN | DÍA {1-90} | puente | hombre+mujer | construir+construir | se unen
B: UNO CONSTRUYE, EL OTRO ESPERA | DÍA {1-90} | puente | hombre+mujer | construir+esperar | llega-agotado
```
Él pone tablas solo desde el principio y llega hasta la mitad; ella espera en la otra orilla con el corazón rojo. Al final él se tambalea agotado en la punta de su mitad, ella le tiende el corazón y él no tiene fuerzas para tomarlo.

Ejemplo «se rinde» (la bici):
```
A: SE VUELVE A MONTAR | INTENTO {1-20} | camino | nina | montar-bici | llega
B: SE RINDE | INTENTO {1-20} | camino | nina | caer-bici | se queda
```

### ⭐ REGLA FIJA DEL ARCO (tipo «se rinde»)

1. **Los dos lados empiezan exactamente iguales y hacen lo mismo durante los primeros segundos.** Ningún personaje empieza en su estado final (el video ya no empieza mostrando el final: desde el primer fotograma los dos lados son idénticos).
2. **El momento difícil les llega a los dos a la vez** (caerse, cansarse, un obstáculo, un problema). La línea divisoria late y suena un golpe suave en los dos lados.
3. **Lado bueno:** se levanta, insiste y sigue hasta el final bueno.
4. **Lado malo:** también lo intenta un poco (se pone de rodillas, mira hacia arriba, estira el brazo, intenta levantar la bici…), pero se desanima: **baja la cabeza, deja caer los brazos y se queda sentado o quieto**. Que se note el desánimo, no que nunca lo intentó. Si su acción era el móvil, acaba sentado mirándolo.
5. Después, cada lado llega a su final: el bueno crece/llega con el corazón grande; en el malo lo que dejó a medias se queda así y llega su final (se seca, se apaga, se cae, se alejan…).

Ejemplo bici: los dos pedalean igual, los dos se caen de la bici a la vez; uno se vuelve a montar y llega a la cima; el otro se agacha a levantar la bici, no puede, y se queda sentado a su lado con la cabeza baja.

**Cómo lo hace la app (en los guiones de tipo «se rinde»):**
- El lado malo dibuja **la misma escena y las mismas acciones que el bueno** hasta el momento difícil; sus propias acciones (`B:`) solo deciden cómo se queda al rendirse.
- Momento difícil al **38 %** del desarrollo (≈ 9,9 s en un video de 30 s). Los dos caen (o, sentados, se desploman de cansancio) en 0,45 s.
- Bueno: en el suelo ~1 s, se levanta (1,0–1,75 s después) y sigue; su avance se pausa mientras está caído.
- Malo: intenta (1,0–1,8 s después) y se rinde (2,15–3,2 s después); su escena se queda congelada donde cayó.
- Las escenas no muestran diferencias entre los dos lados antes del final: el final malo de cada escena empieza al terminar el desarrollo.
- Comprobación obligatoria antes de subir cambios: las escenas de los dos lados deben ser **idénticas píxel a píxel antes del momento difícil**, y revisar fotograma a fotograma el arco (caída común, el bueno se levanta, el malo intenta y se rinde) en los dos lados de la división.

3. **La diferencia crece después del momento difícil:** el bueno sigue construyendo, regando o subiendo; el malo se queda a medias y al final su obra se viene abajo (ladrillos rectos que se desalinean y caen, árbol que pierde las hojas, fuego que se apaga, mesa que se separa).
4. Al final uno **crece / se une / llega** y el otro **se seca / se queda atrás / se cae**.
5. **Temas:** universales — pareja, familia, hijos, dinero, trabajo, amistad, salud, el móvil, la constancia. **Fe casi nunca**: como mucho un guion de vez en cuando, sutil, con un mensaje que entienda cualquiera. **Cada guion, de un tema distinto.**
6. **Tipo «tiempo»** (`DIVISION: tiempo`): un solo camino visto en tres momentos — HOY, EN UN MES, EN UN AÑO. Mismo personaje y mismo camino en las tres franjas; lo que cambia es el resultado (el árbol crece, la alcancía se llena, la escalera se sube, la casa se completa). Las franjas se revelan una tras otra y al final **EN UN AÑO se ilumina** con luz cálida y el **corazón grande**. Aquí no hay momento de elección (es un solo camino).
7. Los guiones los escribe el usuario (con Claude). La app **no inventa guiones con plantillas**. El único ejemplo incluido es el del puente.

## 4. Estructura del video (15 / 30 / 45 s)

| Momento | Qué pasa |
|---|---|
| 0 – 1,8 s | **Gancho:** los dos lados iguales desde el primer fotograma + frase GANCHO + estrella fugaz + latido. |
| 1,8 – momento difícil | Los dos hacen exactamente lo mismo; contador animado. |
| momento difícil (38 % del desarrollo) | A los dos les pasa a la vez: caen o se cansan. |
| después | El bueno se levanta y sigue; el malo lo intenta, se desanima y se queda sentado. |
| resultado (2–3 s) | Uno florece (corazón grande y brillante), el otro se apaga. |
| cierre (3,5–6,5 s) | **Frase final** (FRASE tal cual; si no hay, el TITULO), grande, centrada y en blanco, con las palabras entre *asteriscos* en rojo + pregunta («¿Cuál de los dos eres tú?») + pequeño corazón rojo. El final se parece al inicio para que den ganas de verlo otra vez. |

## 5. Formato de guion

Un guion tras otro, separados por una línea `---`:

```
TITULO: título corto (distinto en cada guion)
FRASE: frase final del video, tal cual (opcional; *palabra* en rojo)
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados | tiempo
GANCHO: frase de 3 a 6 palabras
A: TÍTULO A | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
B: TÍTULO B | SUBTÍTULO CON CONTADOR | escena | personajes | acciones | final
PREGUNTA: pregunta final corta
TITULO_EN: short title
GANCHO_EN: hook in natural US English
A_EN: PATH A TITLE | SUBTITLE WITH COUNTER
B_EN: PATH B TITLE | SUBTITLE WITH COUNTER
FRASE_EN: closing line in natural US English
PREGUNTA_EN: closing question in natural US English
---
```

- **Frase final del video** (la que aparece después de los dos caminos), en este orden:
  1. **`FRASE`** (línea opcional, justo debajo de `TITULO`): se muestra **tal cual, sin cambiarla**. En inglés, `FRASE_EN`.
  2. Si no hay `FRASE`: el **`TITULO`** (`TITULO_EN` en inglés).
  3. Si tampoco hay `TITULO`: una frase de una lista de 60 (`js/finals.js`) que **no se repite dentro del mismo lote**.
- La frase final sale **grande, centrada y en blanco**, sobre un velo negro suave para que se lea limpia. Las palabras entre **asteriscos** salen en **rojo** con un brillo suave:

  ```
  TITULO: El tiempo
  FRASE: El tiempo no *vuelve*
  FRASE_EN: Time never comes *back*
  ```
  → en el video: «El tiempo no **vuelve**» con «vuelve» en rojo. En los textos para publicar la frase va sin asteriscos.
- Títulos de cada lado: máximo 5 palabras, en mayúsculas. TITULO ≤ 10 palabras. FRASE ≤ 14 palabras. PREGUNTA ≤ 9 palabras.
- **Contador animado:** `{inicio-fin}` dentro del subtítulo → `DÍA {1-45}` va de «DÍA 1» a «DÍA 45».
- Si falta `TEMA`, se usa `constancia`. Si falta `EMOCION`, la del tema. Si falta `PREGUNTA`, «¿Cuál de los dos eres tú?» / «Which one are you?».
- Los campos `_EN` se usan cuando en la app se elige *English (US)*. Deben ser inglés natural, no traducción literal.
### Tipo «tiempo» (`DIVISION: tiempo`)

Se escribe con **una sola línea `A:`** (sin `B:`). El contador se reparte solo: HOY = inicio, EN UN MES = 1/12 del total, EN UN AÑO = final. Escenas recomendadas: `arbol` (regar), `alcancia` (ahorrar), `escalera` (subir), `casa` (construir). Opcional: `ETAPAS: HOY | EN UN MES | EN UN AÑO` y `ETAPAS_EN: TODAY | IN A MONTH | IN A YEAR`. Si falta `PREGUNTA`: «¿Dónde quieres estar dentro de un año?» / «Where do you want to be a year from now?».

```
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

### Acciones con objetos (38, valen en cualquier escena)

El personaje **usa el objeto como lo haría una persona**: el objeto va **en su mano o en su cuerpo** (cabeza, espalda, pies), no en un sitio fijo lejos de él. Cualquier escena las acepta: la escena coloca al personaje y él hace la acción. En el lado bueno el objeto se enciende en rojo o naranja al final; en el malo se apaga, el personaje baja los brazos y, si el final es `se cae` o `se alejan`, el objeto se cae.

- Si un personaje usa el objeto que nombra el título (por ejemplo «Su primera bicicleta» con `montar-bici`), el objeto va solo con él y no se repite en otro sitio de la escena.
- **Bicicleta en el camino:** `montar-bici` va montado todo el camino. Si el título o subtítulo dice «bicicleta», `caer` = **se cae de la bici** (la bici queda tumbada al lado) y `levantarse` = **se cae y se vuelve a montar**. También se puede escribir directamente `caer-bici` o `levantarse-bici`.

| Acción | Objeto | Qué hace | Ejemplo |
|---|---|---|---|
| `tocar-guitarra` | guitarra | Toca la guitarra | `sofa \| hombre+mujer \| tocar-guitarra+beber-cafe \| se abrazan` |
| `leer-libro` | libro | Lee un libro con las dos manos | `parque \| mujer+nina \| leer-libro+leer-libro \| crece` |
| `beber-cafe` | taza | Bebe de su taza de café | `mesa \| hombre+mujer \| beber-cafe+hablar \| crece` |
| `dar-flor` | flor | Ofrece una flor con la mano | `puente \| hombre+mujer \| construir+dar-flor \| se unen` |
| `lanzar-pelota` | pelota | Lanza la pelota hacia arriba y la atrapa | `parque \| hombre+nino \| lanzar-pelota+jugar \| se abrazan` |
| `escribir-lapiz` | lapiz | Escribe con un lápiz en su libreta | `casa \| mujer+nina \| construir+escribir-lapiz \| crece` |
| `llevar-mochila` | mochila | Lleva la mochila a la espalda | `camino \| nino \| llevar-mochila \| llega` |
| `ponerse-sombrero` | sombrero | Se pone el sombrero | `tienda \| hombre \| ponerse-sombrero \| ganan` |
| `hacer-foto` | camara | Hace una foto con la cámara | `parque \| mujer+nina \| hacer-foto+jugar \| se abrazan` |
| `dar-carta` | carta | Entrega una carta con la mano | `abrazo \| hombre+mujer \| dar-carta+acercarse \| se unen` |
| `comer-pan` | pan | Come un trozo de pan | `cocina \| mujer+nino \| cocinar+comer-pan \| crece` |
| `contar-dinero` | dinero | Cuenta billetes en las manos | `alcancia \| hombre \| contar-dinero \| se llena` |
| `contar-monedas` | moneda | Lanza una moneda al aire y la recoge | `alcancia \| nina \| contar-monedas \| se llena` |
| `usar-llave` | llave | Abre con la llave (gira la mano) | `casa \| hombre \| usar-llave \| crece` |
| `dar-anillo` | anillo | De rodillas, ofrece un anillo | `abrazo \| hombre+mujer \| dar-anillo+acercarse \| se unen` |
| `montar-bici` | bicicleta | Va montado en bicicleta, pedaleando hacia delante (solo pedalea mientras avanza, como en el camino) | `camino \| nina \| montar-bici \| llega` |
| `dar-regalo` | regalo | Ofrece un regalo con las dos manos | `regalo \| hombre+nina \| dar-regalo+esperar \| se unen` |
| `llevar-maleta` | maleta | Lleva la maleta de la mano | `camino \| mujer \| llevar-maleta \| llega` |
| `encender-vela` | vela | Sostiene una vela encendida | `mesa \| hombre+mujer \| encender-vela+hablar \| crece` |
| `atarse-zapatos` | zapatos | Se ata los zapatos | `gimnasio \| mujer \| atarse-zapatos \| crece` |
| `mirar-foto` | foto | Mira una foto entre las manos | `sofa \| mujer \| mirar-foto \| se queda` |
| `alcanzar-estrella` | estrella | Alcanza una estrella con la mano | `escalera \| nino \| alcanzar-estrella \| llega` |
| `sostener-globo` | globo | Sostiene un globo del hilo | `parque \| hombre+nina \| jugar+sostener-globo \| se abrazan` |
| `volar-cometa` | cometa | Vuela una cometa | `parque \| hombre+nino \| volar-cometa+jugar \| se abrazan` |
| `ponerse-gafas` | gafas | Lleva gafas puestas (y se las ajusta) | `libros \| hombre \| ponerse-gafas \| crece` |
| `beber-agua` | botella | Bebe agua de una botella | `gimnasio \| hombre \| beber-agua \| crece` |
| `servir-plato` | plato | Lleva un plato de comida con las dos manos | `mesa \| mujer+nino \| servir-plato+hablar \| crece` |
| `comer-manzana` | manzana | Come una manzana | `arbol \| nina \| comer-manzana \| crece` |
| `llevar-pastel` | pastel | Lleva un pastel con la vela encendida | `mesa \| mujer+nina \| llevar-pastel+hablar \| crece` |
| `abrazar-osito` | osito | Abraza un osito de peluche | `cama \| nina \| abrazar-osito \| se despiertan` |
| `llevar-planta` | maceta | Lleva una plantita en maceta | `huerto \| mujer \| llevar-planta \| crece` |
| `martillar` | martillo | Martilla un clavo | `casa \| hombre \| martillar \| crece` |
| `escribir-cuaderno` | cuaderno | Escribe en su cuaderno | `oficina \| mujer \| escribir-cuaderno \| ganan` |
| `levantar-trofeo` | trofeo | Levanta un trofeo con las dos manos | `gimnasio \| mujer \| levantar-trofeo \| ganan` |
| `escuchar-musica` | auriculares | Escucha música con auriculares | `sofa \| nino \| escuchar-musica \| se queda` |
| `cerrar-candado` | candado | Cierra un candado con la mano | `puente \| hombre+mujer \| construir+cerrar-candado \| se unen` |
| `sembrar-semilla` | semilla | Se agacha y siembra una semilla | `huerto \| hombre+nino \| sembrar-semilla+sembrar-semilla \| crece` |
| `ponerse-corona` | corona | Lleva una corona en la cabeza | `regalo \| nina+mujer \| ponerse-corona+esperar \| se unen` |
| `caer-bici` | bicicleta | Va en bici por el camino, se cae de la bici y se queda en el suelo | `camino \| nina \| caer-bici \| se queda` |
| `levantarse-bici` | bicicleta | Va en bici, se cae a mitad del camino y se vuelve a montar | `camino \| nina \| levantarse-bici \| llega` |

### Finales

| Tipo | Palabras | Qué se ve | Ejemplo |
|---|---|---|---|
| Bueno | `crece`, `florece`, `se unen`, `se llena`, `llega`, `ganan`, `se abrazan`, `se despiertan`, `se secan` (solo en `lluvia`) | Lo construido se completa + **corazón grande y brillante** | `... \| sofa \| hombre+mujer \| hablar+abrazar \| se abrazan` |
| Se apaga | `se seca`, `se apaga`, `se vacía`, `se mojan`, `pierden` | Hojas que caen, humo, frasco vacío, charco, gráfica que baja | `... \| oficina \| hombre \| dormir \| pierden` |
| Se queda | `se queda`, `se queda atrás`, `nunca se completa` | Queda a medias; el personaje se sienta, abatido | `... \| montana \| hombre \| sentarse \| se queda` |
| Se cae | `se cae` | Ladrillos o tablas se vienen abajo; el coche choca | `... \| coche \| hombre \| celular \| se cae` |
| Se alejan | `se alejan` | La distancia crece y el otro se va | `... \| carta \| mujer+hombre \| olvidar+esperar \| se alejan` |
| Llega agotado | `llega-agotado` | (luchar solo) El que trabajó solo llega tambaleándose, hombros caídos, y no puede recibir el corazón o el abrazo que le ofrecen | `... \| puente \| hombre+mujer \| construir+esperar \| llega-agotado` |

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
| `js/uses.js` | Las acciones con objetos (pose y dónde va el objeto) |
| `js/render.js` | Composición, estrellas, textos, línea de tiempo, zona segura |
| `js/audio.js` | Efectos CC0 y mezcla de música |
| `js/encoder.js` | MP4 (WebCodecs + mp4-muxer; respaldo MediaRecorder) |
| `js/storage.js` | IndexedDB / localStorage |
| `js/music.js` | Banco de música |
| `js/publish.js` | Textos para cada red |
| `vendor/mp4-muxer.mjs` | Librería MIT |
