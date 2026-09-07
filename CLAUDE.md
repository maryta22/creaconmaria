# Crea con María — tienda + panel

Bisutería hecha a mano. Una sola app Next.js con dos caras:

- **Cliente** (`src/app/(tienda)/`): catálogo público con medidas, sin login.
- **Vendedora** (`src/app/admin/`): carga de stock, costos y márgenes. Protegido
  por `CLAVE_VENDEDORA` (cookie firmada, ver `src/lib/sesion.ts`).

## Stack

Next.js 15 (App Router) · Prisma + SQLite · Tailwind v4. Todo el código y la
UI están **en español**, incluidos nombres de variables y de rutas.

**No levantes un segundo `next dev` sobre este repo.** Los dos procesos comparten
`.next` y se corrompen entre sí (manifiestos y chunks que desaparecen a mitad de
una request). Si ya hay uno corriendo, usalo; si quedó roto, `rm -rf .next` y
arrancá uno solo.

```
npm run dev       # servidor local
npm run db:push   # aplicar cambios del schema
npm run db:seed   # piezas de ejemplo (precios inventados)
```

## Ritmo de trabajo

Se commitea **cuando María da un requerimiento por terminado**, no antes ni por
archivo suelto: un requerimiento, un commit, y va derecho a `main`
(`maryta22/creaconmaria`). El procedimiento — verificar con `npx tsc --noEmit`,
revisar el diff, mensaje en español — está en la skill `/cerrar-requerimiento`.

## Modelo de datos

**En una cartera no entran cuentas de menos de 8 mm.** Lo dijo María: *"para
bolsos solo de 8 mm y 10 mm o más"*. No es capricho de tamaño: con cuentas más
chicas la tela queda blanda y el bolso se cae sobre sí mismo, y además la misma
cartera de 18 cm pasa de 23 columnas a 45 —de 1.900 cuentas a más de 6.000—. Las
chicas son para pulseras y collares, donde el hilo es el que manda. La regla es
`CUENTA_MINIMA_MM` en `src/lib/cartera/geometria.ts` y vale **para la cuenta de
la grilla y para cada color de la paleta**: una cuenta más chica que el paso no
llena su lugar y deja el hilo a la vista.

`Producto` es **una pieza terminada**, no un modelo a pedido: `stock` son
unidades reales que María tiene en la mano. Si llega a 0 se muestra "Agotada"
pero la ficha sigue online. `costo` y `notaInterna` son internos — nunca los
mandes al cliente.

Las cuatro líneas viven en `src/lib/categorias.ts` (`PULSERA`, `COLGADOR`,
`COLLAR`, `CARTERA`). Cada una declara qué campos de medida usa, y de ahí sale
tanto el formulario del panel como lo que se muestra en la ficha. **Para agregar
una línea nueva alcanza con agregar una entrada a ese array.**

Medidas: carteras van en ancho × alto × profundidad (+ largo del asa); el resto
en largo (+ extensión si es regulable). El formateo está centralizado en
`medidaCorta()` y `medidasDetalladas()` de `src/lib/formato.ts` — no formatees
medidas a mano en un componente.

## Cuentas base

`src/lib/cuentas-base.ts` — la **escala de grises** con la que se muestran todos
los modelos, en todos los diámetros. No son stock: no se compran, no se
descuentan y no tienen precio. Lo pidió María: *"crea unas cuentas standard de
todos los mm, blancos… aparte del stock… estas solo se usarán para armar los
modelos base, no se podrá pedir hasta seleccionar la cuenta en stock
respectivo"*.

Un modelo pintado con perlas de verdad se lee como una pieza terminada, y no lo
es: es la forma esperando que alguien elija las cuentas. Cuando la Margarita
salía en celeste y rosa, esos colores parecían parte del modelo. En gris se
entiende de una.

- **El tono 0 es blanco** y la escala **está ordenada por contraste, no de claro
  a oscuro**: el 1 es el más oscuro de todos. La mayoría de los modelos usan dos
  tonos y esos dos tienen que distinguirse; con la escala en orden, la Perla
  alternada salía blanca contra gris casi blanco y parecía lisa.
- Todas son `mate`, para que ninguna se confunda con una cuenta del inventario.
- **Una pieza con cuentas base no se puede pedir.** El diseñador arranca sin
  nada elegido, muestra el modelo en gris y tiene el botón apagado hasta que hay
  una cuenta de `CuentaStock` para cada papel. Vale igual para las pulseras
  (`DisenadorPulseraTejida`) y para las carteras (`ElectorEstampado`).
- **Los modelos base van en gris; los que tienen dibujo, no.** Vale para las
  llanas de `llanas.ts` —con `paletaDeLlana()`— y para las carteras del catálogo
  que son formas lisas, que están listadas en **`CARTERAS_BASE`**. Las que
  tienen dibujo —Fresa, Tulipán, Orca— conservan su paleta: ahí el color es
  parte del diseño. Lo pidió María: *"las que ya tienen colores las dejás con
  colores y hacés colores estándares"*.
- **Cuáles son básicas va a mano.** Se probó deducirlo —"un solo color quiere
  decir que no hay dibujo"— y deja afuera la Cuadrada, que es lisa y lleva dos
  tonos: el cuerpo y la banda de arriba. Es una decisión de producto, como qué
  llanas se ofrecen para estampar.
- **La medida de la cuenta la elige la clienta**, entre las de
  `MEDIDAS_CARTERA` (8 y 10 mm, la regla de `CUENTA_MINIMA_MM`), y la lista de
  colores la sigue: ofrecer un color que no existe en esa medida es ofrecer algo
  que no se puede tejer. Cambiarla **cambia el conteo de toda la pieza** —la
  misma cartera de 18 cm lleva 23 columnas en 8 mm y 18 en 10— así que el dibujo
  se **migra** con `celdasEnOtraMedida()`, por proporción dentro de cada pieza,
  igual que cuando se toca el orden de `armarLayout()`. Reusar las celdas
  guardadas las dejaría corridas. El dibujo se redondea al cambiar de
  resolución, que es lo que pasa al tejerlo de verdad en otra medida.
- **El gris hay que bajarlo más de lo que uno escribiría.** El visor tiene luz
  de entorno y tono ACES, que levantan los claros: un gris apenas insinuado sale
  blanco igual en pantalla, y sobre la tarjeta blanca del catálogo la cartera
  desaparecía. También el forro va un paso más oscuro que la cuenta, para que se
  note que hay tela adentro.
- **Cada papel solo acepta cuentas de su diámetro**, y eso lo revisa también el
  servidor: `POST /api/disenos-pulsera` rechaza un pétalo de 8 mm donde va uno
  de 4. La pantalla filtra, pero lo que entra por la red se valida aparte.

Por eso una técnica de pulsera **no declara paleta**: declara `medidas` —el
diámetro de cada papel— y de ahí sale su paleta base.

## Diseños

`carteras diseños/` y `pulseras diseños/` tienen los pliegos de patrón como
imagen **y su ficha `.md` con el mismo nombre**. Leé el `.md`; abrí la imagen
solo si necesitás ver el dibujo o si María lo pide. Para cargar un diseño nuevo
está la skill `/ficha-diseno`.

Cada carpeta separa dos cosas: los **modelos** (con medidas y conteos) van en la
raíz, y los pliegos de **punto** — cómo se teje, sin medidas — en `patrones/`.
Las fichas de punto no traen medidas ni cantidades, y eso está dicho en la ficha
misma: no las inventes.

## Carteras en 3D

`src/lib/cartera/` convierte medidas en cuentas y `src/components/Cartera3D.tsx`
las dibuja con three.js:

- `geometria.ts` — `armarLayout(medidas)` devuelve la posición de cada cuenta,
  agrupada en los siete paneles que se tejen por separado (base, frente,
  espalda, dos laterales, solapa y asa). El paso de la grilla es
  `diámetro × separación`, y **`separacion: 1` — las cuentas se tocan**. Lo dijo
  María, que es la que las teje: *"las cuentas juntas, no separadas… se las
  aprieta"*. Antes valía 1.3, con la idea de que en tejido en cruz quedaban
  separadas y de que así el conteo se parecía al de los pliegos; era falso lo
  primero, y lo segundo no se sostenía. **Tocar ese número cambia el conteo de
  toda la app** (la Perlada pasó de 718 cuentas a 1154) y corre los patrones
  guardados: hay que regenerar con `npm run db:seed`.

  Consecuencia buscada: **con las cuentas pegadas el hilo no se ve**, y está
  bien que no se vea. Lo único que asoma es el hilo de las costuras entre
  piezas y el de las argollas del asa, que salvan distancias más largas.

  **No todas las carteras son cajas.** `MedidasCartera.forma` elige: `caja` son
  los siete paneles de siempre; `corazon` son dos caras con silueta más una
  tira de contorno cosida alrededor del borde; `cuadrada` es la caja sin solapa
  ni asa que se cierra **juntando las dos esquinas de arriba** en sendos aros de
  acero y cuelga de una cadena (`docs/cartera-cuadrada.md`). Ahí arriba la
  cartera es más angosta, pero **ninguna pieza pierde cuentas**: lo que angosta
  es el fuelle doblándose para adentro, como la esquina de una bolsa de papel.
  Lo dijo María: *"son las mismas pero unes las esquinas superiores"*. Lo que no es cuenta —los aros, los
  eslabones— sale de `armarLayout()` en `layout.herrajes`: dónde va cada uno es
  geometría, y `Cartera3D` solo los planta. **Las medidas guardadas en la base
  se arman con `medidasDePatron()`**, nunca campo por campo: son cinco vistas y
  cada medida nueva se olvidaba en alguna. Por eso `Rejilla` ubica cada
  cuenta con una **tabla** y no con aritmética: `indiceEn()` devuelve **-1
  donde no va cuenta**, y todo lo que recorre una pieza tiene que saltear esos
  huecos. Las costuras salen de `costurasDeLayout(layout)`, que depende de la
  forma. Todo está en `docs/carteras-con-silueta.md`. **Si tocás esto, compará
  el layout de las cajas antes y después cuenta por cuenta**: si se mueve una,
  los patrones guardados se corren.

  **Las piezas planas se tejen en serpentina: una fila va y la siguiente
  vuelve.** Se teje con un hilo solo: al llegar al borde dobla y sigue ahí
  mismo. Terminar una fila a la derecha y arrancar la siguiente a la izquierda
  es un salto que con hilo no existe. El asa **no** serpentea: es un tubo y
  cada vuelta gira para el mismo lado (`carteras diseños/patrones/cruzado.md`).
  Lo decide `Rejilla.serpentea` y la fórmula vive una sola vez en
  `pasoEnPieza()`. **Nunca traduzcas (fila, columna) a índice a mano** — el
  array ya no se lee siempre de izquierda a derecha; usá `indiceEn(rejilla, f, c)`.
- `modelos.ts` — los tres modelos de las fichas, con su paleta y una función
  `motivo()` que decide el color de cada cuenta. De ahí sale el patrón inicial;
  después se guarda editado en `PatronCartera.celdas` (un caracter base36 por
  cuenta, en el orden en que `armarLayout()` genera la lista).
- `COSTURAS` — **la única fuente sobre qué borde va cosido con qué borde.** De
  esta lista salen los hilos de unión del 3D, los pasos de armado y los
  corchetes dorados del mapa, así que las tres cosas no pueden decir algo
  distinto. Si agregás o cambiás una costura, tocá solo esa lista. Los dos
  bordes de cada costura se recorren en el mismo sentido, cuenta contra cuenta.
- `armarHilos(layout)` — el recorrido del hilo. Teje cada pieza (cada cuenta con
  la de su derecha y la de abajo, cerrando el anillo en el asa, que es tubular),
  cose las piezas siguiendo `COSTURAS` y ata las puntas del asa a la cuenta del
  cuerpo más cercana. Sin las costuras la solapa flota sobre el cuerpo. Se
  dibuja más grueso y más oscuro que el nylon real a propósito: fiel a la escala
  desaparece contra las perlas y no se ve el tejido.
- `mapa.ts` + `MapaTejido.tsx` — el mismo patrón como cuadrículas planas para
  tejer con el papel al lado: lista de compras, orden de armado y una grilla por
  pieza **por partida doble**: una cuadrícula de colores (con los bordes de
  costura marcados en oro) y otra con el orden en que se ensartan las cuentas,
  con una flecha al costado de cada fila que dice para qué lado va: la fila que
  vuelve tiene el 1 a la derecha.
  Es el mismo componente con `modo="color" | "orden"`. Cada cuenta lleva su letra adentro para que sirva impreso en blanco y
  negro, y el radio no escala desde cero para que una cuenta de 4 mm siga siendo
  legible. Vive en `/admin/disenador/[slug]/mapa` y se baja con Ctrl+P →
  *Guardar como PDF*; los estilos de impresión están al final de `globals.css`
  y todo lo que no va al papel lleva la clase `no-imprimir`.
- **El forro** (`mostrarForro`) es una tela por dentro del cuerpo y debajo de la
  solapa. Se arma desde la **misma grilla de cada pieza**, corrida hacia adentro
  medio diámetro, así sigue la forma real —incluida la curva de la solapa, que
  no es un plano— sin describirla dos veces. Se asoma por los huecos que dejan
  las cuentas al tocarse, como el forro de verdad. El asa no lleva. En el
  diseñador se prende y se apaga con los dos botones sobre el visor, junto con
  el del hilo: pintar cuenta por cuenta se hace mejor sin nada encima. **En la
  ficha del cliente van los dos puestos y sin interruptor** (`GaleriaPieza`):
  ahí se muestra la pieza terminada, no la mesa de trabajo.
- `Cartera3D.tsx` — una `InstancedMesh` por color de paleta, así cada uno lleva
  su tamaño en mm y su acabado (perla / metal / mate), más una de cilindros para
  el hilo. El entorno es `RoomEnvironment`: sin él las cuentas doradas salen
  negras. El hilo no es clickeable: pintar siempre acierta a la cuenta.

**Si cambiás el orden en que `armarLayout()` recorre las cuentas, los patrones
guardados quedan corridos** — `PatronCartera.celdas` está indexado por ese
orden. Si el patrón se puede regenerar, `npm run db:seed`; si María ya lo editó
a mano hay que migrarlo, moviendo cada color al lugar nuevo de su (fila,
columna). Es lo que se hizo al pasar el tejido a serpentina.

- `punto.ts` + `PuntoCruzado.tsx` — qué punto lleva cada pieza y su diagrama,
  sacados de `carteras diseños/patrones/cruzado.md`. Son **seis cuadros, un movimiento cada
  uno**: el hilo doblado, una cuenta con un extremo, otra con el otro, las dos
  cruzando en la que cierra (la ✕ del pliego), la salida cambiada de lado y la
  unidad siguiente. **Cada cuadro dibuja solo lo que ya está hecho, y el
  recorrido de cada extremo termina en la cuenta que tiene en la mano**: así se
  ve cuál de los dos se movió y cuál está esperando. Dibujar los dos caminos
  enteros de una vez no muestra eso, que es justo lo que hay que entender. **Al cruzarse en la cuenta que cierra, los dos extremos
  salen cambiados de lado** — por eso `ladoDe()` alterna por unidad. Dibujarlos
  como dos zigzags fijos, cada uno siempre de su lado, es incorrecto. Usa la
  paleta del modelo. Aparece durante la reproducción y en el mapa impreso.

  Los extremos llevan los mismos colores que el hilo del 3D (oro = I, tinta =
  II) a propósito: es lo único que une las dos vistas. **El 3D es una grilla**
  —sabe dónde queda cada cuenta, no por qué agujero pasa cada hilo—, así que
  marca dónde está la labor y el diagrama explica qué hace cada extremo. No le
  pidas al 3D lo que le toca al diagrama.
- `ReproductorTejido.tsx` — reproduce el armado. **El orden en que
  `armarLayout()` genera las cuentas ya es el orden en que se tejen**, así que
  reproducir es mostrar solo las primeras N. `Cartera3D` recibe
  `cuentasVisibles` y no recalcula nada: las matrices están todas cargadas y
  solo se recorta el `count` de cada malla con una búsqueda binaria (los
  índices vienen ordenados, y el hilo se ordena por `apareceEn()`). Por eso se
  puede arrastrar la barra a 60 fps sin costo. El ritmo es **fijo**
  (`POR_SEGUNDO`), no una duración total: así 1× siempre significa lo mismo y
  una cartera más grande simplemente tarda más.

  **El avance lleva decimales** (7,4 cuentas) y se dibujan las de índice
  **menor que** ese número: con 7,4 hay *ocho* puestas y la última es la 7. Por
  eso todo lo que señale dónde está la labor —los dos extremos del hilo, el
  cartel, el contador— pasa por `ultimaPuesta(n)` = `ceil(n) - 1`. Redondear con
  `floor` deja los hilos colgando de la cuenta anterior a la que se acaba de
  poner, que es justo lo que se ve mal.

El editor vive en `/admin/disenador` y el mismo componente, en modo solo
lectura, aparece en la ficha pública de la pieza — ahí la pestaña *Cómo se
teje* usa el mismo reproductor en versión compacta.

## En persona

`src/lib/cartera/maniqui.ts` — un maniquí de **1,60 m** sosteniendo la cartera.
Es la tercera vista de la ficha, junto a *Fotos* y *Ver en 3D*. Lo pidió María:
*"que el maniquí sea de una altura de 1,60 que es lo promedio"*.

Está para una sola cosa: **una cartera sola en el aire no tiene tamaño.** Un
bolso de 18 cm y uno de 30 se ven iguales si no hay nada al lado, y las medidas
escritas en la ficha no se comparan con el cuerpo de uno.

- Es un **maniquí, no una persona**: una chica con vestido —lo pidió María—
  pero sin cara, en yeso mate. La pieza que se vende es la cartera; esto es la
  regla. Los rasgos le robarían atención; el vestido no, porque es lo que hace
  que se lea como una persona y no como un muñeco de palitos.
- **La falda y el corpiño son conos, no tubos.** Un tubo del mismo grosor de
  arriba abajo no es un vestido, es una funda.
- **Los tres tonos —piel, vestido, pelo— van bien separados.** Con la luz del
  visor dos grises parecidos se lavan hasta el mismo blanco y el vestido
  desaparecía contra el cuerpo; es lo mismo que pasó con las cuentas base.
- La silueta es de mujer: hombros y cadera casi iguales con la cintura marcada.
  Con los hombros más anchos se leía como un hombre por más vestido que llevara.
- Las proporciones salen del **canon de siete cabezas y media**, escritas como
  fracción de la altura, así siguen siendo correctas si la altura cambia.
- **Los huesos se encadenan**: cada uno arranca donde termina el anterior.
  Puestos por altura suelta quedaban huecos y la cabeza flotaba sobre los
  hombros.
- **El maniquí se mueve, no la cartera.** La cartera ya está armada en el origen
  y sus mallas se agregan sueltas a la escena; correrlas sería tocar cada una.
  Se traslada el maniquí hasta que su mano cae en la parte de arriba del asa.
- **La cámara mira a la cartera, no a la persona.** Encuadrando la figura entera
  la cartera quedaba del tamaño de una uña: se entendía la escala y no se veía
  la pieza. Lo dijo María: *"que haga zoom a la parte de la cartera"*. Se abre
  lo justo para que entren la mano, el brazo y un tramo de falda — alcanza para
  medirla contra un cuerpo, que es para lo que está la vista. Para ver a la
  persona entera, se aleja con la rueda.
- **El vestido cierra en los hombros y sube al cuello**, con mangas cortas y el
  ruedo a media pantorrilla. Con escote y hombros al aire quedaban tres tubos de
  piel a la vista que no aportaban nada.
- **El brazo se abre contando la cartera, no solo la falda.** `armarManiqui()`
  recibe media cartera y separa el brazo lo que haga falta para dejarle 3 cm de
  aire al ruedo. Calculado solo con el ruedo, un bolso ancho se incrustaba en la
  falda: la mano quedaba libre pero la pieza no.
- Con maniquí **no gira sola**: la gracia es comparar con el cuerpo, y girando
  cuesta medirla de un vistazo.

## Estampados

`/admin/estampados` — María elige una **cartera llana**, un **estampado** y los
colores, y sale un patrón nuevo en el diseñador. Las decisiones están en
[`docs/estampados.md`](docs/estampados.md). Lo que no se rediscute:

- `estampados.ts` **no sabe de carteras**: un estampado solo dice qué tono le
  toca a la celda (fila, col) de una pared. Quién lo pinta y sobre qué modelo es
  problema de `llanas.ts`.
- Las **figuras** (`figuras.ts`) son dibujos de 13 × 11 y se agrandan **de a
  números enteros** hasta ocupar el 70 % del ancho de la pared. Con cuenta de
  4 mm la pared tiene 45 columnas y un dibujo de 13 no se distingue; agrandar
  con decimales le come filas al dibujo.
- El dibujo va **solo en el frente y la espalda**, y en la espalda **espejado**.
  Lo demás va de fondo, como en la Orca.
- **`POST /api/estampados` solo acepta elecciones**, nunca celdas: qué llana,
  qué estampado y qué cuentas del stock. El patrón se calcula en el servidor.
- Las **llanas** se agregan a mano a `llanas.ts`. Que exista una forma nueva en
  el motor no la pone en la lista: qué se ofrece para estampar es decisión de
  producto.
- **Está de los dos lados, con la misma pantalla** (`ElectorEstampado`, prop
  `modo`): `/admin/estampados` crea un patrón en el diseñador y
  `/disenar/cartera` guarda un `DisenoCartera` con un código de seis letras.
  **Lo único que el cliente no tiene es el mapa de cuentas**: el cliente elige,
  María teje. El mapa vive detrás de la sesión y ninguna ruta pública lo
  devuelve ni linkea.

## Pulseras

`src/lib/pulsera/` y `/admin/pulseras`. **Hay un modelo por tejido y se muestra
en la escala de grises de [`cuentas-base.ts`](src/lib/cuentas-base.ts).** Eran técnica × colección —treinta tarjetas para cinco piezas
distintas— y lo cortó María: *"solo quiero 1 de cada modelo, porque si quiere
otros colores solo tiene que editarla"*. El color no hace modelo aparte: es lo
primero que se cambia en la pantalla de al lado, y hasta que se cambia la pieza
no se puede pedir. Para agregar un tejido alcanza con agregar una entrada a
`TECNICAS` —con sus `medidas`, no con una paleta—, igual que en
`categorias.ts`.

**Hay dos construcciones y no se parecen en nada.** Lo decide `armado` y la
diferencia vive entera en `geometria.ts`:

- `trama` — una banda tejida sobre una cuadrícula: filas a lo ancho de la
  muñeca, columnas dando la vuelta. **Todas las cuentas miden lo mismo**,
  porque el paso de la grilla es el diámetro: una más grande se mete adentro de
  sus vecinas —se ven fusionadas y con hilo de verdad no entran— y una más
  chica deja hueco. Lo vio María: *"ni tiene forma y las cuentas no se
  fusionan"*.
- `flores` — una cadena de flores ensartadas en un hilo, recorrido por largo de
  arco como en `src/lib/hilo/geometria.ts`. Acá **sí se mezclan tamaños**, y hay
  que mezclarlos: no hay grilla, cada cuenta se acomoda a continuación de la
  anterior por su propio diámetro. Sale del pliego
  `pulseras diseños/patrones/patron pulsera flor.md`, pero **el pliego es un
  punto, no un modelo**: con el mismo punto salen la Margarita (unión con
  acento: rondela, cristal, rondela), la Margarita menuda (una sola rondela) y
  el Rosetón (centro del doble). Lo dijo María: *"no quiero que sigas siempre el
  patrón que está guardado, podemos crear otros"*. Cada técnica declara su
  `flor`: qué lleva el tramo de unión y cuáles de esas cuentas son rondelas.

Las dos devuelven **lo mismo** —dónde va cada cuenta, de qué tamaño y el hilo
que se ve— y por eso `Pulsera3D` no calcula ninguna posición: solo planta lo que
le dan, igual que `Cartera3D` con `armarLayout()`. `MuestraPulsera`, la vista
vectorial de la tarjeta, proyecta ese mismo layout desde el ángulo de la cámara,
así que lo que se ve antes y después de que monte el 3D es la misma pieza. **Sus
coordenadas van redondeadas a cuatro decimales**: `Math.sin` no da el mismo
último bit en Node y en el navegador, y con eso React tira el árbol hidratado.

**Cuántos pétalos lleva una flor no se elige: se cuenta.** Alrededor de un
centro de diámetro `c`, los pétalos de diámetro `p` caen en un círculo de radio
`(c + p) / 2` —que es lo que los hace tocar el centro— y entran los que quepan
tocándose: `n = ⌊π / arcsen(p / 2r)⌋`. Con centro y pétalo de 4 mm dan **seis**,
que es la margarita del pliego; con un centro de 8 mm y pétalos de 4, **nueve**,
y eso ya es otra flor. Escrito a mano se pone en siete y el anillo queda flojo.
(El `+ 1e-9` de `anilloDeFlor()` no sobra: `asin(0,5)` devuelve un pelo más que
π/6 y sin él la margarita salía de cinco pétalos.)

Por eso el tamaño de cada papel de la paleta lo fija la técnica (`medidas`) y
**la clienta elige el color, nunca la medida** — cada papel solo ofrece las
cuentas de su tamaño.

**Todas llevan cierre: broche de mosquetón de un lado y cadena de extensión del
otro**, en dorado o plateado — es lo único del cierre que elige la clienta, y no
sale del stock de cuentas. Lo dijo María: *"todas las pulseras tienen un
ganchito y se conectan a una cadena al final, para que se pueda ajustar"*.
`cierre.ts` es la única fuente sobre eso, y de ahí sale una consecuencia
geométrica: **el aro ya no cierra con cuentas.** La circunferencia es la tira
más `CIERRE_CM`, y en ese hueco van el broche y los eslabones que cruzan. La
cola que sobra **cuelga**, no da la vuelta: seguirla por el contorno la montaba
encima de las cuentas.

**El largo lo decide la pieza, no al revés.** Las dos construcciones redondean
—la trama a la columna entera, la cadena a la flor entera— y el largo que se
muestra y se guarda es el que sale (`layout.largoCm`), no el que se pidió. Una
margarita cortada al medio no es una pulsera. **Se redondea para arriba**: la
cadena de extensión solo acorta, así que una pulsera que sobra se cierra un
eslabón más adentro y una que queda corta no tiene arreglo. Por eso el largo se
muestra como un **rango** —de `largoCm − ajusteCm` a `largoCm`— y no como un
número solo.

Las **indicaciones para tejer** están en `/admin/pulseras/[slug]`, detrás de la
sesión: los pasos del punto, los tips, el video de la técnica y cuántas cuentas
de cada color sacar del stock. Es lo que el mapa de tejido es para una cartera.
Los pasos y el video salen de `src/lib/pulsera/punto.ts`, que copia el pliego
`.md`; **si cambia el pliego, cambia eso**. En la tienda la clienta elige modelo,
largo y colores y nada más: la clienta elige, María teje.

Las fichas de `pulseras diseños/modelos/` —incluido su README— **las escribe
`npm run fichas:pulseras`**, con los conteos sacados del mismo motor que dibuja
el 3D. No se editan a mano: escritas a mano se desincronizan, y ya pasó —
quedaron cincuenta fichas describiendo diez técnicas que ya no existían.

## El cliente diseña su pieza

`/disenar` — el cliente arma su propia pulsera, collar o colgador cuenta por
cuenta, sin login, y lo manda al carrito. **Las decisiones ya tomadas están en
[`docs/disenador-cliente.md`](docs/disenador-cliente.md): leelo antes de tocar
nada acá.** Lo que no se rediscute:

- Una pieza es **una secuencia de cuentas**, y nada más. El largo, el precio y
  la lista de materiales se **calculan** de esa secuencia — no son campos que
  alguien edite ni haya que mantener sincronizados.
- Los tres tipos viven en `src/lib/hilo/tipos.ts` con su forma, sus largos y su
  precio de armado. **Para agregar un tipo alcanza con agregar una entrada**,
  igual que en `categorias.ts`; la `categoria` es la misma de ahí a propósito.
- `src/lib/hilo/geometria.ts` dobla esa secuencia en el espacio: recorre el
  hilo por largo de arco y cada forma dice cómo se acomoda. Cambiar la forma no
  cambia el orden ni el conteo.
- **`POST /api/disenos` es público**: del navegador solo se aceptan qué cuentas
  y en qué orden. El largo y el precio se recalculan en el servidor con los
  precios reales de `CuentaStock`, y la paleta se guarda como **copia** adentro
  del diseño — un diseño mandado tiene que seguir viéndose igual aunque María
  borre esa cuenta del inventario.
- El código de 6 caracteres **es** el link (`/disenar/ver/ABC123`): no hay
  cuentas de usuario ni "mis diseños".
- Los precios de armado y los de `CuentaStock.precioUnidad` son inventados,
  como los del seed. Por eso el total siempre se muestra como **estimado**.

El visor 3D es `Hilo3D.tsx`, hermano de `Cartera3D.tsx`: misma idea de una
`InstancedMesh` por color de paleta y el mismo `RoomEnvironment`. El material de
la cuenta (perla / metal / mate) lo comparten los dos desde `src/lib/cuenta3d.ts`
— una perla marfil tiene que verse igual de los dos lados. **Siempre se importa
por `Hilo3DCliente.tsx`**, que lo carga solo en el navegador: three.js en el
módulo del servidor se paga en cada request y no dibuja nada.

## Escala

`html { font-size: 112.5% }` en `globals.css`: la base es **18 px, no 16**. Como
todo el sitio mide en `rem`, ese único número gobierna el tamaño del texto, los
botones, los campos y los espaciados. Si algo se ve chico, subilo ahí antes de
agrandar clases sueltas. En `@media print` vuelve a 100 %, para que las
cuadrículas del mapa entren en la hoja.

Lo único que no sigue esa escala son los SVG de `MapaTejido.tsx`, que están en
px (`CELDA`, `MARGEN_IZQ`, `MARGEN_SUP`) porque tienen que medir lo mismo en
pantalla y en papel.

## Estilo visual

Negro (`--color-tinta`) como color de acción, oro (`--color-oro`) solo como
acento — filetes, chips activos, estados. Serif editorial para títulos, formas
rectas, mucho aire. Nada de rosas ni de píldoras redondeadas: la marca apunta a
lujo, no a "tierno". Los tokens y las clases reutilizables (`.btn`, `.chip`,
`.campo`, `.sobretitulo`, `.filete`, `.tarjeta`, `.precio`) están en
`src/app/globals.css`.
