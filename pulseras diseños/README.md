# Diseños de pulseras

Esta carpeta se ordena igual que `carteras diseños/`: cada pieza tiene una ficha
Markdown y el catálogo sale de esas fichas.

- [`modelos/`](modelos/README.md) — los modelos vendibles, con paleta, conteo y
  medida. **Los escribe `npm run fichas:pulseras`**, no se editan a mano.
- [`patrones/`](patrones/README.md) — los pliegos de punto: cómo se teje, sin
  medidas ni cantidades. Es donde vive el video de cada técnica.

Misma regla que en el resto: **leé el `.md`, no la imagen**, salvo que necesites
ver el dibujo o que María lo pida.

## Las dos construcciones

Una pulsera no se arma siempre igual, y la diferencia no es de estilo: es de
geometría. Está en `src/lib/pulsera/geometria.ts`.

| Armado | Qué es | Tamaño de cuenta |
|---|---|---|
| `trama` | Una banda tejida sobre una cuadrícula: filas a lo ancho de la muñeca, columnas dando la vuelta. | **Todas iguales.** El paso de la grilla es el diámetro; una más grande se mete adentro de sus vecinas y una más chica deja hueco. |
| `flores` | Una cadena de flores ensartadas en un hilo, que se recorre por largo de arco. | **Mezclados a propósito.** No hay grilla: cada cuenta se acomoda a continuación de la anterior por su propio diámetro. |

Por eso la margarita puede tener el cristal de 8 mm entre pétalos de 4 y la
trama no. No es que a una se le permita y a la otra no: es que sobre una
cuadrícula, sencillamente, no entra.

**El pliego es un punto, no un modelo.** Con la misma flor de dos extremos salen
la Margarita, la Margarita menuda y el Rosetón: lo que cambia es el tramo de
unión y el tamaño del centro. Cuántos pétalos lleva cada una no se elige, se
cuenta: los que entren tocándose alrededor del centro.

**El largo lo decide la pieza, no al revés.** Las dos redondean —la trama a la
columna entera, la cadena de flores a la flor entera— así que el largo de la ficha es
el que sale, no el que se pidió. Una margarita cortada al medio no es una
pulsera.

## Los modelos van en gris

Un modelo no tiene color: se muestra con la **escala de grises** de
`src/lib/cuentas-base.ts`, en el diámetro que le toca a cada papel. No son
stock —no se compran ni tienen precio— y **una pieza con cuentas base no se
puede pedir**: hay que elegir una cuenta del inventario, del mismo diámetro,
para cada parte del modelo.

Por eso una técnica declara `medidas` y no `paleta`. Las fichas de `modelos/`
listan esos grises con su medida: es la lista de qué comprar, no de qué color.

## El cierre

Todas llevan **broche de mosquetón** de un lado y **cadena de extensión** del
otro, en dorado o plateado. No sale del stock de cuentas: va en el armado, y lo
único que elige la clienta es el metal. Vive en `src/lib/pulsera/cierre.ts`.

De ahí sale algo que se nota en el 3D: **el aro no cierra con cuentas**. La
vuelta es la tira más el hueco del cierre, y en ese hueco van el broche y los
eslabones que lo cruzan. Por eso el largo se muestra como un rango: la cadena
solo acorta, así que la pieza se arma pasando apenas el largo pedido y se cierra
donde haga falta.

## Lo que ve María y lo que ve la clienta

Las indicaciones para tejer —los pasos del punto, el video y cuántas cuentas de
cada color sacar del stock— están en `/admin/pulseras`, detrás de la sesión. En
la tienda la clienta elige modelo, largo y colores; el mapa de cuentas no sale
de ahí. Misma regla que con las carteras: la clienta elige, María teje.

## Al agregar un modelo

1. Agregar la técnica o la colección en `src/lib/pulsera/modelos.ts`.
2. Si trae un punto nuevo, cargar sus pasos en `src/lib/pulsera/punto.ts` y su
   pliego en `patrones/`.
3. Correr `npm run fichas:pulseras`.

El catálogo, el visor 3D, la pantalla de colores y las indicaciones lo toman
solos: las tres miran la misma geometría.
