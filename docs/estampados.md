# Estampados: una cartera llana y un dibujo encima

`/admin/estampados`. Se elige una **cartera llana**, un **estampado** y los
**colores**, y sale un patrón nuevo en el diseñador: editable cuenta por cuenta,
con su mapa para imprimir y listo para publicar en el catálogo.

**Está de los dos lados**, con la misma pantalla (`ElectorEstampado`, con
`modo`):

- `/admin/estampados` — María arma el modelo y sale un patrón en el diseñador,
  con su mapa. De ahí lo publica.
- `/disenar/cartera` — el cliente arma la suya, la ve girar y se lleva un
  **código de seis letras**; queda guardada en `DisenoCartera` y se vuelve a
  ver en `/disenar/cartera/ver/ABC123`.

**Lo único que el cliente no tiene es el mapa de cuentas.** Lo dijo María: el
cliente elige, María teje. El mapa vive en `/admin/disenador/[slug]/mapa`,
detrás de la sesión; ni la pantalla de la tienda ni `POST /api/disenos-cartera`
lo devuelven, lo guardan ni linkean a él. Un diseño de cliente guarda el patrón
—que es lo que hace falta para dibujarlo— pero nunca la cuadrícula de armado.

## Las tres piezas, separadas a propósito

- **`estampados.ts` no sabe de carteras.** Un estampado solo contesta, para la
  celda (fila, col) de una pared de `filas × cols`, qué tono le toca: `0` es el
  fondo. No sabe de paneles, ni de paletas, ni de qué modelo es.
- **`llanas.ts` sí.** Tiene las medidas de cada cartera llana y es quien sabe
  que el dibujo va en el frente y la espalda, que en la espalda se espeja y que
  todo lo demás va de fondo.
- **`figuras.ts` son dibujos, no código.** Se corrige una cuenta cambiando un
  caracter, y se lee igual en el editor que en la ficha impresa.

Por eso el mismo catálogo va a servir igual si algún día la sección se abre al
cliente: lo único que cambia es quién elige.

## Dos familias

**Geométrico** (53): cubre la pared entera y se repite. Sale de una cuenta sobre
(fila, col), así que la misma raya se ve igual en la cartera chica y en la
grande. Rayas, diagonales, damero, lunares, rombos, zigzag, espiga, escamas,
olas, ladrillos, cuadros, escocés, triángulos, greca, flechas, cruces, semilla.

**Figura** (47): un dibujo centrado sobre el fondo, como la orca. Mar, flores,
frutas, animales y símbolos.

### Las figuras se agrandan hasta llenar la pared

Están dibujadas a 13 × 11 —lo que entra con margen en la pared más chica de la
línea— pero **no se usan a ese tamaño**. Con cuenta de 4 mm una pared de 18 cm
tiene 45 columnas, y ahí un dibujo de 13 es una mancha que no se distingue: se
vio en el 3D la primera vez que se creó una.

Se agrandan hasta ocupar `CUANTO_OCUPA` del ancho, y **de a números enteros**:
cada cuenta del dibujo pasa a ser un cuadrado de 2 × 2, de 3 × 3… Agrandar con
decimales le come filas al dibujo y lo deforma. Con eso una figura ocupa el
57–58 % del ancho en cualquier medida de cartera y con cualquier cuenta.

## El dibujo va solo en el frente y la espalda

La base, los laterales, la solapa y las asas van del color de fondo. Son las que
no se miran, y llenarlas de dibujo hace que la cartera se lea sucia. Es lo mismo
que hace la Orca del catálogo.

**En la espalda se espeja.** Mirando la cartera de atrás el dibujo se ve al
revés, así que sin espejar la orca nada para el otro lado. A un geométrico no le
cambia nada; a una figura, todo.

## Del navegador solo se aceptan elecciones

Las dos rutas reciben **qué** llana, **qué** estampado y **qué** cuentas del
stock — nunca celdas. El patrón se calcula en el servidor con las medidas de la
llana y la cuadrícula del estampado, así que no hay forma de mandar un patrón
que no salga del catálogo.

- `POST /api/estampados` pide sesión, como el resto del panel.
- `POST /api/disenos-cartera` **es público**, igual que `/api/disenos`: la
  paleta y las medidas se guardan **como copia** adentro del diseño, así una
  cartera que un cliente mandó sigue viéndose igual aunque María borre esa
  cuenta del inventario o le cambie el precio. El precio se recalcula acá con
  los precios reales y se muestra siempre como **estimado**.

Los colores salen de `CuentaStock`, o sea de lo que María tiene de verdad. **El
primero es el fondo** —es el que pone casi todas las cuentas— y la cuenta de la
cartera es la de ese fondo.

### Solo cuentas de 8 mm o más

`CUENTA_MINIMA_MM`. La pantalla **no ofrece** las más chicas —así no hay que
explicar por qué una que está en el stock no anda— y la API las rechaza igual,
porque es el servidor el que decide.

Se vio en la primera prueba: el stock de María es todo de 4 mm, y la cartera
salió de 45 × 45 con 6.075 cuentas y la tela blanda. Una cartera se sostiene
sola; las cuentas chicas son para pulseras y collares.

## Las carteras llanas

Cuatro, en `llanas.ts`: Básica (caja con solapa y un asa), Abierta (la misma sin
solapa, con dos asas), Cuadrada (aros y cadena) y Corazón. Son medidas y nada
más: una llana no es un modelo del catálogo, es el punto de partida de uno.

Las formas nuevas que aparezcan en el motor no entran solas — hay que agregarlas
acá, a propósito: qué formas se ofrecen para estampar es una decisión de
producto, no una consecuencia de que exista el código.

## Lo que queda

- **Las miniaturas son planas.** La grilla de la pantalla no muestra cómo cae el
  dibujo sobre la solapa ni sobre la silueta del corazón; para eso hay que
  crearlo y mirarlo en el 3D.
- **Un geométrico no se adapta al tamaño de la cuenta.** Con cuenta de 4 mm una
  raya de 2 mide la mitad que con 8. Es lo honesto —son cuentas, no
  centímetros— pero al elegir conviene mirarlo.
- **El diseño del cliente no entra al carrito.** Se guarda con su código y se
  comparte por link; sumarlo al carrito con el resto del pedido queda pendiente.
- **El precio del cliente da $0** mientras `CuentaStock.precioUnidad` esté en 0,
  que es como está hoy casi todo el inventario.
- `/disenar` todavía no linkea a `/disenar/cartera`: hay que agregar la cartera
  a esa portada.
- El nombre del patrón sale de juntar los dos nombres (`Cuadrada Orca`). Se
  puede cambiar después en el diseñador.
