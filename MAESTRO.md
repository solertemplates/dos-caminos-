# DOS CAMINOS — Documento maestro

> **Leer completo antes de tocar nada.** Este documento manda sobre cualquier otra decisión.
> Cada vez que cambie algo importante de la app, se actualiza aquí en el mismo cambio.

Última actualización: 19 nov 2026 (ladrillos de la casa sin base: rectos y desalineados, no torcidos).

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
3. **Objetos simples, limpios y ordenados**, como las pilas de tablas del puente. Suelo y orillas como masas sólidas gris muy oscuro que se funden con el negro.
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
6. Los guiones los escribe el usuario (con Claude). La app **no inventa guiones con plantillas**. El único ejemplo incluido es el del puente.

## 4. Estructura del video (15 / 30 / 45 s)

| Momento | Qué pasa |
|---|---|
| 0 – 1,2 s | **Gancho:** se ve el final de las dos historias + frase GANCHO + estrella fugaz + latido. |
| 1,2 – 1,8 s | Rebobinado rápido (sonido suave) hasta el inicio. |
| 1,8 – 2,6 s | **Igualdad y elección**: los dos iguales, «DÍA 1»; cada uno elige distinto. |
| hasta el resultado | La diferencia crece; contador animado. |
| resultado (2–3 s) | Uno florece (corazón grande y brillante), el otro se apaga. |
| cierre (3,5–6,5 s) | Frase de reflexión + pregunta («¿Cuál de los dos eres tú?») + pequeño corazón rojo. El final se parece al inicio para que den ganas de verlo otra vez. |

## 5. Formato de guion

Un guion tras otro, separados por una línea `---`:

```
TITULO: título corto
TEMA: pareja | familia | hijos | dinero | trabajo | amistad | salud | movil | constancia | fe
EMOCION: romantica | tension | triste | emotiva | inspiracional | alegre
DIVISION: arriba-abajo | lados
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

- Títulos de cada lado: máximo 5 palabras, en mayúsculas. FRASE ≤ 14 palabras. PREGUNTA ≤ 9 palabras.
- **Contador animado:** `{inicio-fin}` dentro del subtítulo → `DÍA {1-45}` va de «DÍA 1» a «DÍA 45».
- Si falta `TEMA`, se usa `constancia`. Si falta `EMOCION`, la del tema. Si falta `PREGUNTA`, «¿Cuál de los dos eres tú?» / «Which one are you?».
- Los campos `_EN` se usan cuando en la app se elige *English (US)*. Deben ser inglés natural, no traducción literal.
- Las instrucciones completas para Claude están en `js/format.js` (botón *Ajustes → Copiar instrucciones para Claude*). **Mantenerlas iguales a este documento.**

## 6. Vocabulario completo que entiende el formato

### Escenas (lugares)

| Escena | Qué se ve | Acciones que entiende | Ejemplo de línea |
|---|---|---|---|
| `puente` | Dos orillas con un precipicio; pilas de tablas; ponen tablas hasta encontrarse | construir, esperar, celular, descansar | `A: LOS DOS CONSTRUYEN \| DÍA {1-90} \| puente \| hombre+mujer \| construir+construir \| se unen` |
| `arbol` | Un arbolito que se riega o se cuida; crece y da frutos rojos o pierde las hojas | regar, cuidar, celular, dormir, orar, orar-domingo | `B: RIEGA SU SUEÑO \| DÍA {1-100} \| arbol \| mujer \| regar \| crece` |
| `alcancia` | Un frasco de monedas que se llena (brote naranja) o se vacía en bolsas de compras | ahorrar, gastar, celular | `A: GASTA TODO EL VIERNES \| SEMANA {1-52} \| alcancia \| hombre \| gastar \| se vacía` |
| `casa` | Muro de ladrillos: bien alineado, con techo y ventana encendida; o con ladrillos rectos pero cada vez más desalineados (arriba/abajo) hasta caerse | construir, descansar, celular | `B: SIN BASE \| MES {1-24} \| casa \| hombre \| construir \| se cae` |
| `escalera` | Siete escalones y una luz arriba | subir, sentarse | `A: UN ESCALÓN AL DÍA \| DÍA {1-60} \| escalera \| mujer \| subir \| llega` |
| `mesa` | Mesa con lámpara cálida; conversan o miran el móvil y se van separando | hablar, celular | `B: CADA UNO EN SU PANTALLA \| NOCHE {1-200} \| mesa \| hombre+mujer+nino \| celular+celular+celular \| se aleja` |
| `fogata` | Un fuego que se alimenta o se apaga hasta quedar en humo | cuidar, celular, alejarse | `A: LO CUIDAN CADA DÍA \| AÑO {1-10} \| fogata \| hombre+mujer \| cuidar+cuidar \| crece` |
| `camino` | Una colina con bandera en la cima; al llegar sale el sol | caminar, correr, levantarse, caer, sentarse | `B: SE CAE Y SE LEVANTA \| INTENTO {1-30} \| camino \| mujer \| levantarse \| llega` |
| `libros` | Lee y la pila de libros crece hasta subirse en ella | leer, celular | `A: APAGA EL MÓVIL \| HORAS {1-500} \| libros \| mujer \| leer \| crece` |
| `abrazo` | Dos personas separadas con un corazón en medio: se acercan o se dan la espalda | acercarse, alejarse | `B: SE OLVIDAN \| AÑO {1-5} \| abrazo \| hombre+hombre \| alejarse+alejarse \| se alejan` |

### Personajes

| Palabra | Quién | Ejemplo |
|---|---|---|
| `hombre` | adulto (también entiende: papa, padre, esposo, abuelo) | `hombre` |
| `mujer` | adulta con moñito y sayita (también: mama, madre, esposa, abuela) | `hombre+mujer` |
| `nino` | niño, más pequeño (también: hijo) | `hombre+nino` |
| `nina` | niña, con moñito y sayita (también: hija) | `mujer+nina` |

Se unen con `+`. Máximo 2 personajes (3 en `mesa`). Las acciones van en el mismo orden que los personajes: `hombre+mujer | construir+esperar`.

### Acciones

| Acción | Qué hace | Ejemplo |
|---|---|---|
| `construir` | Pone tablas o ladrillos, uno por uno | `puente \| hombre+mujer \| construir+construir` |
| `esperar` | Espera de pie con un corazón rojo en las manos | `puente \| hombre+mujer \| construir+esperar` |
| `celular` | Mira el móvil con la cabeza baja | `mesa \| hombre+mujer \| celular+celular` |
| `descansar` | Empieza un poco y lo deja; se sienta | `casa \| mujer \| descansar` |
| `regar` / `cuidar` | Riega el árbol (cuidar en la fogata: echa leña) | `arbol \| hombre+nino \| regar+regar` |
| `dormir` | Se queda sentado dormido | `arbol \| mujer \| dormir` |
| `ahorrar` | Echa una moneda al frasco | `alcancia \| hombre \| ahorrar` |
| `gastar` | Saca monedas y llena bolsas de compras | `alcancia \| hombre \| gastar` |
| `subir` | Sube escalón por escalón | `escalera \| mujer \| subir` |
| `sentarse` | Se sienta en el suelo con el móvil | `escalera \| hombre \| sentarse` |
| `hablar` | Conversa sentado a la mesa | `mesa \| hombre+mujer \| hablar+hablar` |
| `alejarse` | Da la espalda y se va | `abrazo \| hombre+hombre \| alejarse+alejarse` |
| `acercarse` | Da pasos hacia el otro | `abrazo \| mujer+nina \| acercarse+acercarse` |
| `leer` | Lee sentado; cada libro va a la pila | `libros \| hombre \| leer` |
| `caminar` / `correr` | Sube la colina caminando o corriendo | `camino \| hombre \| correr` |
| `levantarse` | Corre, se cae a mitad y se levanta | `camino \| mujer \| levantarse` |
| `caer` | Corre, se cae y se queda en el suelo | `camino \| mujer \| caer` |
| `orar` / `orar-domingo` | (Solo fe, con moderación) ora cada día / solo el domingo | `arbol \| hombre \| orar` |

### Finales

| Tipo | Palabras | Qué se ve | Ejemplo |
|---|---|---|---|
| Bueno | `crece`, `florece`, `se unen`, `se llena`, `llega` | Lo construido se completa + **corazón grande y brillante** | `... \| construir+construir \| se unen` |
| Se apaga | `se seca`, `se apaga`, `se vacía` | Hojas que caen, fuego en humo, frasco vacío | `... \| celular \| se seca` |
| Se queda | `se queda`, `se queda atrás`, `nunca se completa` | Queda a medias; el personaje se sienta, abatido | `... \| construir+esperar \| nunca se completa` |
| Se cae | `se cae` | Ladrillos o tablas se vienen abajo | `... \| construir \| se cae` |
| Se alejan | `se alejan` | La distancia crece, el suelo se parte, el corazón se rompe | `... \| alejarse+alejarse \| se alejan` |

## 7. Pantalla y zona segura

- Lienzo 1080 × 1920, 30 fps, H.264 + AAC.
- **Arriba-abajo:** títulos a la izquierda en y≈290 (panel A) y y≈850 (panel B); suelos en y≈680 y y≈1292.
- **Lados:** títulos centrados en y≈305; suelo en y≈1000.
- Nada importante por debajo de y≈1360 (ahí van el nombre de la cuenta y la descripción) ni pegado al borde derecho en la mitad de abajo (columna de botones).

## 8. App (pocos botones)

- **Pantalla principal:** Pegar guiones · Duración (15/30/45) · Idioma (Español / English US) · Crear videos. Arriba: «Mis videos» y Ajustes.
- **Pegar guiones:** cada guion aparece con su casilla; botones **Crear seleccionados** y **Crear todos**.
- **Creación en tanda:** cada video se guarda en el teléfono (IndexedDB) **en cuanto termina**. La tanda se guarda; si la app se cierra o el teléfono se bloquea, al volver aparece «Continuar» y sigue donde se quedó. Se pide mantener la pantalla encendida (y se usa Wake Lock cuando el iPhone lo permite).
- **Mis videos:** todos los videos guardados; ver, descargar uno por uno, borrar; **Guardar todos** y **ZIP** (con los textos). Cada video tiene **Facebook, Instagram, YouTube, TikTok**: copian el texto de esa red y abren el menú de compartir con el video. Se marca con **✓** cada red donde ya se publicó (en cualquier orden).
- **Música:** cada video sale **con la música ya metida en el MP4** (sirve para Facebook). Banco de música en el teléfono (MP3/M4A), categoría automática editable (romántica, tensión, triste, emotiva, inspiracional, alegre); se elige según la emoción y sin repetir siempre la misma. Sin canciones, la app genera una música suave propia.
- **Efectos de sonido:** pocos, suaves, sincronizados con lo que pasa; generados por código y publicados bajo **CC0**.
- **Ajustes:** formato de guion (copiar instrucciones para Claude), banco de frases, banco de música, video (división, calidad, efectos, estrellita), acerca de.
- **Banco de frases de René Soler Rasua:** pegar una o muchas, ver, editar, borrar. A veces se usan como reflexión final (firmadas «— René Soler Rasua»), solo en el idioma del video.
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
| `js/scenes.js` | Las 10 escenas |
| `js/render.js` | Composición, estrellas, textos, línea de tiempo, zona segura |
| `js/audio.js` | Efectos CC0 y mezcla de música |
| `js/encoder.js` | MP4 (WebCodecs + mp4-muxer; respaldo MediaRecorder) |
| `js/storage.js` | IndexedDB / localStorage |
| `js/music.js` | Banco de música |
| `js/publish.js` | Textos para cada red |
| `vendor/mp4-muxer.mjs` | Librería MIT |
