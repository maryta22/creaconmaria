# Diseños de carteras

Especificaciones ya extraídas de los pliegos de patrón. **Leé el `.md`, no la
imagen** — cada `.md` tiene el mismo nombre que su `.jpg`/`.png`. Abrí la imagen
solo si hace falta ver el dibujo (posición exacta de un motivo, un detalle
visual que el texto no cubre) o si María lo pide.

| Modelo | Ancho | Alto | Prof. | Asa | Cierre | Cuentas | Ficha |
|---|---|---|---|---|---|---|---|
| Básico | 18 cm | 14 cm | 7 cm | 24 cm | magnético | ~1.900 | [ficha](carteras/basico.md) |
| Corazón | 18 cm | 16 cm | 5 cm | 24 cm | magnético | ~1.100 | [ficha](carteras/corazon.md) |
| Cuadrada | 18 cm | 18 cm | 6 cm | cadena 60 cm | dos aros de acero | 1.610 | [ficha](carteras/cuadrada.md) |
| Violeta | 20 cm | 14 cm | 8 cm | 16 cm | magnético | ~460 | [ficha](carteras/30690106-70df-4d06-a93c-f415262cf890.md) |
| Rombo | 22 cm | 13 cm | 7 cm | 30 cm | broche metálico | ~560 | [ficha](carteras/632c9813-d6e8-4e55-b7b3-4ba71baf307f.md) |
| Guía de armado | 18 cm | 14 cm | 7 cm | 16 cm | magnético | — | [ficha](carteras/be0b70ee-6b8d-4121-859e-617fb8c3856e.md) |

El punto con el que se tejen está aparte, en
[cruzado 2/](cruzado%202/README.md).

La mayoría son la misma construcción: base rectangular + frente + espalda +
2 laterales + solapa + asa tubular, todo en **tejido en cruz** con hilo nylon
0,6–0,7 mm doble. Cambian medidas, paleta y tamaño de cuenta. Las dos que no
son así están documentadas aparte: el Corazón, que son dos caras con silueta y
una tira de contorno ([doc](../docs/carteras-con-silueta.md)), y la Cuadrada,
que no lleva solapa ni asa: se cierra juntando las esquinas de arriba en dos
aros de acero —ahí el fuelle se dobla para adentro— y cuelga de una cadena
([doc](../docs/cartera-cuadrada.md)). El despiece
completo está en la [guía de armado](carteras/be0b70ee-6b8d-4121-859e-617fb8c3856e.md).

## Cómo está ordenado

- `carteras/` — un pliego por modelo, con su ficha.
- `patrones/` — el punto con el que se tejen, sin medidas ni modelo.

## Al agregar un diseño nuevo

Dejá la imagen en la subcarpeta que corresponda y pedile a Claude que extraiga
la ficha: genera el `.md` con el mismo nombre base y agrega la fila a esta
tabla.
