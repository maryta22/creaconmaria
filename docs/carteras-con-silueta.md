# Carteras con silueta

El motor sabía armar **cajas**: seis piezas rectangulares levantadas desde una
base. El [Modelo Corazón](../carteras%20diseños/carteras/corazon.md) fue la
primera que no lo es, y de ahí salió esto.

`MedidasCartera.forma` decide cómo se arma: `caja` (lo de siempre) o `corazon`.

## Qué cambió

**1. La grilla admite huecos.** `Rejilla` ya no ubica una cuenta con aritmética:
lleva una tabla `celda → índice`, e `indiceEn()` devuelve **-1 donde no va
cuenta**. Una cara del corazón es un rectángulo de 20 × 23 con las esquinas
vacías: 460 casilleros, 285 cuentas. Todo lo que recorre una pieza —el tejido,
el mapa, el forro del 3D— saltea los -1.

**2. Un borde nuevo: `contorno`.** Los bordes de una caja son sus cuatro lados
(`primeraFila`, `ultimaColumna`…). Una silueta se cose por el **perímetro**, que
no es ninguno de ellos. `contornoDe()` lo recorre en orden —bordeando de vecino
en vecino, trazado de Moore— y guarda esa vuelta en `Rejilla.contorno`. El orden
importa: la cuenta 5 de la tira va con la cuenta 5 del borde de la cara.

**2 bis. La boca: el perímetro no se cose entero.** Una cartera cerrada por los
cuatro costados no es una cartera. `bocaDeSilueta()` encuentra el tramo por
donde abre y lo saca del borde cosido: es **todo el borde de la cintura para
arriba**, tomando como cintura la fila más ancha de la silueta (si empatan, la
de más arriba).

En el corazón eso abre los dos lóbulos y la hendidura: 25 cuentas de las 59 del
borde, unos 22 cm. Lo pidió María así: *"tiene que ser toda la parte de arriba,
es una cartera"*. Antes de eso la boca era solo la hendidura entre los lóbulos
—4 cm—, que es un monedero, no una cartera: no entra la mano.

Las dos filas justo encima de la cintura (`FILAS_CERRADAS`) siguen cosidas.
Abierta hasta el ancho máximo, la boca terminaba en el punto más ancho, las
puntas quedaban descolgadas y por los dos extremos se veía el forro: *"un
poquito más cerrada en los extremos"*.

La definición sale de la forma y no de números escritos a mano, así que sirve
para la silueta que venga. Con la boca afuera, **la tira del contorno no es un
anillo**: va de una punta de la boca a la otra, y esas dos puntas son donde va
el broche. `Rejilla.contorno` es el tramo **cosido** y `Rejilla.boca` el que
queda abierto.

**3. Las costuras salen de la forma.** `COSTURAS` era una constante; ahora es
`costurasDeLayout(layout)`, que devuelve la lista de la caja o la del corazón.
Sigue siendo **la única fuente**: de ahí salen los hilos del 3D, los pasos de
armado y los corchetes del mapa, así que las tres cosas no pueden discrepar.

**4. El mapa imprime los huecos en blanco**, y el número de orden de cada cuenta
ya no se calcula con una fórmula: viene del layout (`PanelMapa.orden`), que es
el único que sabe dónde hay hueco y hacia dónde va cada fila.

**4 bis. Las asas también salen de la forma.** `asasDeLayout()` devuelve una
sola centrada (`asa`, en el plano del medio) para la caja, y **dos** para la que
abre por arriba: `asaFrente` y `asaEspalda`, cada una corrida al plano de su
cara. Una sola asa al medio le pasaría por encima de la boca. Lo pidió María:
*"en lugar de una correa central, mejor una de un lado y otra del otro"*. Cada
asa mide `asaCm` —son dos asas, no una partida— y `esAsa()` es lo que usa el
resto del código para tratarlas a las tres igual: tubo, sin serpentina y sin
forro.

**4 ter. La tira se reparte por largo, no cuenta por cuenta.** El borde de una
silueta va en escalera: donde sube en diagonal, dos cuentas del borde quedan a
1,41 pasos una de otra. La tira tenía una cuenta por cada cuenta del borde, así
que ahí se estiraba y **se veía el hilo** —3,3 mm al aire en 120 tramos—, y las
cuentas van siempre juntas.

Los números lo dicen solos: el tramo cosido del borde mide 37 cm de recorrido y
39 cuentas pegadas miden 30. Faltaban cuentas. Ahora la tira se reparte **por
largo de arco**, una cada `paso` (con `ceil`, para que nunca sobre), y cada
cuenta de la tira se cose a la cuenta del borde que le queda **enfrente** — en
los escalones, una del borde se lleva dos de la tira, que es lo que se hace
tejiendo. Por eso `Rejilla.contorno` puede repetir un índice.

**5. La silueta, en un solo lugar.** `siluetaCorazon()` marca los casilleros
cuyo centro cae adentro de la curva, estirada a las medidas de la pieza. Para
agregar otra forma alcanza con otra función así.

La curva es la **paramétrica clásica** —`x = 16 sen³t`, `y = 13 cos t − 5 cos 2t
− 2 cos 3t − cos 4t`— y su caja sale del mismo muestreo, no de números escritos
a mano. Se arrancó con la implícita `(x² + y² − 1)³ − x²y³ ≤ 0`, que sobre una
grilla de 20 × 23 **no se nota**: la hendidura entre los lóbulos ocupaba un solo
casillero y los hombros salían rectos, así que el corazón leía como un escudo.
Con la paramétrica la hendidura baja cinco filas y los lóbulos se redondean. Lo
pidió María mirando el 3D de la ficha: *"podemos mejorar la forma"*.

No tiene forma implícita simple, así que se muestrea una vez a polígono
(`MUESTRAS_CORAZON`) y se pregunta por cruces pares/impares. Alcanza y sobra:
la grilla más fina que se teje tiene decenas de columnas, no miles.

**Cambiar la curva corre el patrón guardado** —la cara pasó de 332 cuentas a
285, y la cartera de 1.208 a 1.096— así que hay que regenerar con `npm run db:seed`. Y mueve la boca: con la
hendidura más profunda, el tramo que queda abierto se lleva también la V del
medio, que es justo lo que dice el punto 2 bis.

## Cómo se armó el corazón

Tres piezas y dos asas, sin base ni solapa:

| Pieza | Grilla | Cuentas |
|---|---|---|
| Frente | 20 × 23 con silueta | 285 |
| Espalda | 20 × 23 con silueta | 285 |
| Contorno | 6 vueltas × 45 | 270 |
| Asa delantera | 32 vueltas × 4 | 128 |
| Asa trasera | 32 vueltas × 4 | 128 |
| **Total** | | **1.096** |

El borde de la cara son 59 cuentas; 25 son la boca. El contorno tiene 45
columnas —una cada 8 mm de recorrido, no una por cuenta del borde— y las dos
costuras calzan contra ese mismo reparto, así que las tres listas miden 45.

## Lo que se verificó

- **Las tres cajas quedaron idénticas**: se guardó el layout de la Perlada, la
  Violeta y la Rombo antes del cambio y se comparó después, cuenta por cuenta,
  hilo por hilo. Cero diferencias. Era la condición para no correr los patrones
  guardados.
- Las dos costuras del corazón calzan: 45 con 45 de cada lado, y las 25 cuentas
  de la boca quedan afuera de las dos.
- **El hilo, tramo por tramo.** Se midió cuánto queda al aire entre las dos
  cuentas que une cada tramo. Con la silueta nueva el tejido de la tira y las
  argollas siguen por debajo del diámetro; lo que asoma son los 26 de adentro de
  las asas (0,6 mm, lo mismo que traen las tres cajas desde antes) y **las dos
  costuras de la tira contra las caras**, 60 tramos de hasta 1,4 mm — eso no lo
  trae la silueta sino la tira corrida al canto, y pasa igual con la curva vieja
  (60 tramos, 1,5 mm). Ver *Lo que queda*.
- Cada asa se ata **a su propia cara**: las 8 argollas de la delantera caen en
  `frente` y las 8 de la trasera en `espalda`, todas en la fila de arriba.
- El mapa impreso dibuja un círculo por cuenta y ninguno en los huecos: 2.192
  entre las dos cuadrículas de las cinco piezas, y no 2.892, que es lo que daría
  si no los saltara.

## Lo que queda

- **1,4 mm en las costuras de la tira.** Corrida al canto, la tira queda a más
  de un diámetro de la cuenta del borde que tiene enfrente justo donde la
  silueta va en escalera: 60 tramos de los 2.143. Es de la tira, no de la
  curva —se midió con las dos y da lo mismo—, y con la silueta nueva da un
  poquito menos (1,36 mm contra 1,49).
- **0,6 mm dentro de las asas.** Las vueltas del tubo se reparten parejo sobre
  el arco del medio, pero la cuenta de afuera de la curva recorre más: arriba
  del todo quedan 0,6 mm de hilo al aire. Lo traen los cuatro modelos desde
  antes. Se arregla repartiendo las vueltas por el **borde de afuera**, que es
  el que se ve; no cambia ni el conteo ni el orden, así que no corre ningún
  patrón guardado, pero mueve el asa de las tres cajas y por eso no se tocó.
- La boca **no se marca en el mapa impreso**. El paso de armado la nombra y le
  dice cuántas cuentas son, pero en la cuadrícula de la cara no se ve dónde
  cae. Los corchetes dorados marcan lo que se cose; faltaría lo contrario.
- El **broche** no está en el modelo: se nombra en los pasos y nada más. En el
  3D la boca se ve como el hueco que es.
