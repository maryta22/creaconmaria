# La cuadrada: el pliegue de bolsa de papel

El motor sabía armar **cajas** (base + cuatro paredes + solapa + asa tejida) y
**siluetas** (dos caras y una tira de contorno, ver
[Carteras con silueta](carteras-con-silueta.md)). La
[Cuadrada](../carteras%20diseños/carteras/cuadrada.md) es la tercera: una caja
**sin solapa y sin asa**, que se cierra juntando las dos esquinas de arriba con
un aro de acero en cada una, y cuelga de una cadena.

`MedidasCartera.forma` decide: `caja`, `corazon` o `cuadrada`.

## Se dobla, no se angosta

Es **la** decisión de este modelo y la que hay que no volver a romper.

Arriba la cartera es más angosta que abajo, pero **ninguna pieza pierde
cuentas**: las cinco son rectángulos enteros y el fuelle lleva sus ocho cuentas
en las veintitrés filas. Lo que angosta la boca es que las dos esquinas de
arriba se unen en el aro, y el fuelle que sobra **se dobla hacia adentro**, como
la esquina de una bolsa de papel. Lo dijo María: *"el ancho no debe encogerse
por menos cuentas, sino que son las mismas pero unes las esquinas superiores y
eso hace que se doble para adentro"*.

La primera versión disminuía —una cuenta de cada lado cada cuatro filas— y está
mal: eso **angosta el fuelle** en vez de doblarlo, y le saca 32 cuentas que sí
van. Si alguna vez vuelve a aparecer una máscara con huecos en el lateral de la
cuadrada, es este error otra vez.

## El pliegue, en `fuelleDoblado()`

El recorrido del fuelle a una altura dada es una **V con la punta redondeada**:
dos tramos rectos y una vuelta de radio `paso/2`, que es lo más cerrado que se
puede doblar una tela de cuentas — de una capa del doblez a la otra tiene que
entrar una cuenta.

El recorrido **siempre mide lo mismo**, `(filasBase − 1) · paso`, porque las
cuentas son siempre las mismas y van siempre pegadas. Cuánto se mete la punta no
se elige: es lo que hace que el recorrido siga midiendo eso, así que se busca
partiendo al medio. Las cuentas se reparten después **por largo de recorrido**,
que es como se ensartan.

## Por qué la rampa entra al cuadrado

`separacionEn(f)` da la media separación entre las dos puntas del fuelle, fila
por fila: todo el fuelle desplegado abajo, una sola cuenta arriba. Entra **al
cuadrado**, y eso no es decoración.

El doblez sale de una raíz: cuando las dos puntas recién empiezan a juntarse, un
pelo de acercarse mete muchísimo el doblez. Con una rampa derecha, la primera
fila del cuello pandea de golpe —de 0 a 1,3 cm de una fila a la otra— y ahí se
abre el hilo 3,3 mm. Entrando al cuadrado, esa raíz se compensa y el doblez
crece parejo, que es exactamente lo que dicen las diagonales rectas del pliegue
de una bolsa.

**Se probó al revés** —rampar el doblez y despejar la separación— y sale peor:
arriba, cerca del doblez máximo, esa inversa queda mal condicionada (una
separación de cero y una de una cuenta dan casi el mismo doblez), el solver se
va al borde y las dos paredes saltan 3 cm en una fila. La dirección buena es
esta: **la separación manda, el doblez es la consecuencia**.

### Cuántas filas dura el cuello

`filasBase + 2`. El ancho del fuelle es el pliegue propiamente dicho —en una
bolsa de papel las diagonales van a 45°, y eso es lo que sale cuando el alto del
cuello iguala al ancho del fuelle— y las dos filas de más son la **entrada**:
sin ellas la primera fila del pliegue pandea de golpe y el hilo se abre casi un
milímetro. Con ellas, 0,6 mm.

### Las paredes se reparten por largo de tejido

En el cuello la pared va inclinada: una fila y la de arriba están a un paso
*sobre la pared* pero a menos de un paso de altura. Por eso la altura se acumula
con `√(paso² − loQueSeCierra²)` y no sumando un paso por fila. Repartiendo por
altura, en el cuello las cuentas quedaban separadas.

## Los aros y la cadena no son cuentas

Son piezas compradas, como el broche magnético: no entran en el conteo ni en el
patrón. Pero sí se dibujan, así que `armarLayout()` devuelve además
`herrajes: Herraje[]` — un anillo con su centro, su eje, su radio y el grosor
del alambre. `Cartera3D` los planta y nada más: **dónde va cada aro y por dónde
pasa la cadena es geometría, no dibujo.**

- **El aro** va con el eje en z, que es la dirección en la que corre el borde de
  arriba del lateral: así lo encierra, que es lo que hace de verdad. Su tamaño
  ya no decide nada del tejido — tiene que ser lo bastante grande para que entre
  el paquete de las dos paredes más el doblez, y nada más.
- **La cadena** usa el mismo `recorridoAsa()` que el asa tejida, con el largo de
  la cadena en vez del del asa. Cada eslabón está **cruzado con el anterior**:
  los dos ejes son perpendiculares al recorrido y se alternan. Todos iguales es
  una tira de anillos, no una cadena.
- Se ponen **al final**, como en los pasos de armado: durante la reproducción
  del tejido no están.

La cadena sube más que la última cuenta —60 cm de aro a aro sobre 18 de ancho
son 27 cm de arco—, así que entra en `altoTotal`. Si no, la cámara la recorta.

## Los bordes saltean huecos

`cuentasDelBorde()` devolvía la columna 0 y la última columna, secas. Ahora
devuelve **la primera cuenta que hay** en cada fila o columna. En un rectángulo
lleno da exactamente lo mismo que antes —las tres cajas y el corazón no se
movieron—, y deja la puerta abierta a piezas con huecos. La cuadrada de hoy no
los tiene, pero la primera versión sí y el cambio se quedó porque es más
robusto.

## Las medidas, en un solo lugar

Cinco vistas armaban `MedidasCartera` campo por campo desde la base: la ficha
del cliente, la tarjeta del catálogo, el diseñador, su lista y el mapa. Cada
medida nueva —el aro, la cadena— se olvidaba en alguna, y esa vista quedaba
dibujando otra cartera. Ahora salen todas de `medidasDePatron()`.

## Lo que se verificó

- Las ocho costuras calzan cuenta a cuenta: 23 con 23 y 8 con 8.
- **Hilo a la vista: 0,6 mm**, lo mismo que las otras cuatro carteras traen
  desde siempre adentro del asa.
- **Cuentas encimadas: 2,3 mm**, en la punta del pliegue. Ahí las cuentas se
  aprietan unas contra otras, que es lo que pasa de verdad al doblar la tela.
- Las tres cajas y el corazón no cambiaron.

## Lo que queda

- **No tiene cierre.** Se junta en los aros y nada más. Si hace falta que
  cierre, va un broche entre las dos paredes o un imán en la boca — no está
  modelado.
- **El pliegue no cuelga.** En una cartera de verdad el triángulo que sobra se
  mete para adentro *y hacia abajo*; acá entra derecho, en el plano de su fila.
  Hacerlo colgar es inclinar las filas del cuello, y eso desalinea las cuentas
  de una fila con las de la de arriba.
- **La cadena se dibuja como un arco tieso**, igual que el asa tejida. Una
  cadena de verdad cae; para la foto de catálogo el arco es lo que se quiere,
  pero girando la cartera se nota.
- El mapa impreso no marca el pliegue: las cuadrículas del lateral son
  rectángulos llenos, y dónde se dobla lo dice solo el paso de armado.
