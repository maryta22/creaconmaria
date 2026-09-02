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

## Modelo de datos

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

## Diseños de carteras

`carteras diseños/` tiene los pliegos de patrón como imagen **y su ficha `.md`
con el mismo nombre**. Leé el `.md`; abrí la imagen solo si necesitás ver el
dibujo o si María lo pide. Para cargar un diseño nuevo está la skill
`/ficha-diseno`.

## Carteras en 3D

`src/lib/cartera/` convierte medidas en cuentas y `src/components/Cartera3D.tsx`
las dibuja con three.js:

- `geometria.ts` — `armarLayout(medidas)` devuelve la posición de cada cuenta,
  agrupada en los siete paneles que se tejen por separado (base, frente,
  espalda, dos laterales, solapa y asa). El paso de la grilla es
  `diámetro × separación`; **`separacion: 1.3` es lo que hace que el conteo dé
  parecido al de los pliegos**, porque en tejido en cruz las cuentas no quedan
  pegadas. Tocá ese número y cambia el conteo de toda la app.
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
  pieza con sus bordes de costura marcados en oro. Cada cuenta lleva su letra adentro para que sirva impreso en blanco y
  negro, y el radio no escala desde cero para que una cuenta de 4 mm siga siendo
  legible. Vive en `/admin/disenador/[slug]/mapa` y se baja con Ctrl+P →
  *Guardar como PDF*; los estilos de impresión están al final de `globals.css`
  y todo lo que no va al papel lleva la clase `no-imprimir`.
- `Cartera3D.tsx` — una `InstancedMesh` por color de paleta, así cada uno lleva
  su tamaño en mm y su acabado (perla / metal / mate), más una de cilindros para
  el hilo. El entorno es `RoomEnvironment`: sin él las cuentas doradas salen
  negras. El hilo no es clickeable: pintar siempre acierta a la cuenta.

**Si cambiás el orden en que `armarLayout()` recorre los paneles, los patrones
guardados quedan corridos.** Regenerá con `npm run db:seed`.

- `punto.ts` + `PuntoCruzado.tsx` — qué punto lleva cada pieza y su diagrama,
  sacados de `carteras diseños/patrones/cruzado.md`. Muestra el recorrido paso a
  paso: dónde arranca el hilo (cuenta 1, doblado al medio), las cuentas
  numeradas en el orden en que se ensartan, y cada extremo con su color y su
  flecha de salida. **Al cruzarse en la cuenta que cierra, los dos extremos
  salen cambiados de lado** — por eso `ladoDe()` alterna por unidad. Dibujarlos
  como dos zigzags fijos, cada uno siempre de su lado, es incorrecto. Usa la
  paleta del modelo. Aparece durante la reproducción y en el mapa impreso.
- `ReproductorTejido.tsx` — reproduce el armado. **El orden en que
  `armarLayout()` genera las cuentas ya es el orden en que se tejen**, así que
  reproducir es mostrar solo las primeras N. `Cartera3D` recibe
  `cuentasVisibles` y no recalcula nada: las matrices están todas cargadas y
  solo se recorta el `count` de cada malla con una búsqueda binaria (los
  índices vienen ordenados, y el hilo se ordena por `apareceEn()`). Por eso se
  puede arrastrar la barra a 60 fps sin costo. El ritmo es **fijo**
  (`POR_SEGUNDO`), no una duración total: así 1× siempre significa lo mismo y
  una cartera más grande simplemente tarda más.

El editor vive en `/admin/disenador` y el mismo componente, en modo solo
lectura, aparece en la ficha pública de la pieza — ahí la pestaña *Cómo se
teje* usa el mismo reproductor en versión compacta.

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
