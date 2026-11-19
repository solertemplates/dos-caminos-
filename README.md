# Dos Caminos

Web app para iPhone que crea videos verticales 9:16 en MP4, sin voces, comparando dos formas de vivir y sus resultados.

- Todo se genera en el teléfono (Canvas + WebCodecs/MediaRecorder). Sin API, sin imágenes de IA, sin costes.
- Guiones en formato de texto sencillo (ver *Ajustes → Formato de guion* o `js/format.js`). Incluye 30 ejemplos (`js/examples.js`).
- Banco de música y banco de frases guardados solo en el teléfono (IndexedDB / localStorage).
- Efectos de sonido sintetizados por código, dedicados al dominio público (CC0).
- MP4 con [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) (MIT, en `vendor/`).

Para instalarla en el iPhone: abrir el enlace en Safari → Compartir → «Añadir a pantalla de inicio».
