# Diseñador del cliente

El cliente entra a `/disenar` y arma su propia pieza: elige el tipo, el largo y
va poniendo cuentas del inventario real de María. Cuando le gusta, lo guarda y
lo manda al carrito como una línea más.

**v1 (esto) = un hilo con cuentas en orden.** Pulsera, collar y colgador de
mochila o cartera. La cartera del cliente queda para después: es una grilla de
siete paneles, no un hilo, y ya tiene su propio diseñador en el panel.

---

## La regla que gobierna todo

Una pieza de hilo es **una secuencia de cuentas**. Nada más. De esa secuencia
salen, calculados, el largo, el precio y la lista de materiales:

```
largo  = Σ (diámetro de cada cuenta) + el cierre del tipo
precio = precio de armado del tipo + Σ (precio unitario de cada cuenta)
```

No hay "casilleros" de largo fijo que el cliente rellena. El largo es
consecuencia de lo que puso, igual que en la mesa de trabajo: si cambiás una
cuenta de 8 mm por una de 10, la pulsera queda 2 mm más larga y el número se
mueve solo. Por eso el diseñador siempre muestra **largo actual vs. largo
objetivo**, y tiene un botón para completar hasta el objetivo.

Consecuencia práctica: no hace falta guardar el largo como dato editable ni
mantenerlo sincronizado. El objetivo sí se guarda, pero solo como referencia de
lo que el cliente quería.

## Los tres tipos y sus formas

Viven en [`src/lib/hilo/tipos.ts`](../src/lib/hilo/tipos.ts). **Para agregar un
tipo alcanza con agregar una entrada a ese array**, igual que con
`src/lib/categorias.ts`.

| Tipo | Categoría | Forma | Largos sugeridos | Cierre | Armado |
|---|---|---|---|---|---|
| Pulsera | `PULSERA` | `aro` — anillo apoyado en la mesa | 15 / 17 / 19 cm | broche, 1,5 cm | 3,00 |
| Collar | `COLLAR` | `curva` — el mismo anillo, colgando | 38 / 45 / 55 cm | broche, 2 cm | 5,00 |
| Colgador | `COLGADOR` | `tira` — vertical, con argolla arriba | 10 / 12 / 15 cm | argolla, 2,5 cm | 3,50 |

**`aro` y `curva` son el mismo anillo**, cambiado de plano: uno acostado y el
otro parado. En los dos, las cuentas quedan centradas en la parte que se mira
y **el cierre ocupa el hueco que sobra** — atrás en la pulsera, en la nuca en
el collar. Por eso el cierre suma cm de verdad: no es un adorno, es un pedazo
del perímetro. La `tira` no cierra nada: cuelga de la argolla.

La `categoria` es la misma de `src/lib/categorias.ts` a propósito: el día que
María quiera publicar un diseño del cliente como pieza del catálogo, ya cae en
la línea correcta sin traducir nada.

**Los precios de armado y los precios por cuenta son inventados**, igual que los
del seed. Salen de `TIPOS_HILO` (armado) y de `CuentaStock.precioUnidad` (cada
cuenta, editable en `/admin/cuentas`). Si una cuenta tiene precio 0 suma 0: por
eso el total se muestra siempre como **estimado** y el pedido queda sujeto a
confirmación de María.

## Cómo se guarda un diseño

Modelo `DisenoCliente` en `prisma/schema.prisma`. Dos decisiones que importan:

1. **`celdas` es un caracter base36 por cuenta**, en orden desde el cierre.
   Mismo formato que `PatronCartera.celdas`, misma función `comprimir()` /
   `descomprimir()` — ahora compartidas en `src/lib/celdas.ts`.
2. **La paleta se guarda adentro del diseño**, como copia (id, nombre, color,
   mm, acabado y precio del momento). No son referencias vivas a
   `CuentaStock`: si María borra una cuenta del inventario o le cambia el
   precio, el diseño que el cliente ya mandó **tiene que seguir viéndose igual**.
   El `id` queda adentro solo para poder reponer stock, no para leer el color.
3. **Se guarda solo lo que la pieza usa.** `compactar()` deja en la paleta las
   cuentas que aparecen de verdad, en orden de aparición, y corre los índices.
   El inventario puede tener treinta colores; una pulsera de tres queda
   guardada con tres, y la lista de materiales del pedido es exactamente lo
   que lleva. De ahí sale el único tope real: **36 colores distintos por
   pieza**, porque el patrón es un caracter base36 por cuenta. No es un tope
   de cuántas cuentas ofrecerle al cliente.

Cada diseño tiene un `codigo` de 6 caracteres. Ese código es el link:
`/disenar/ver/ABC123`, público, de solo lectura. Es lo que viaja en el WhatsApp.

## Cómo se edita

Decisiones de la pantalla, para no rediscutirlas:

- **El hilo arranca lleno** hasta el largo sugerido, con la primera cuenta del
  inventario. Es más fácil cambiar cuentas de algo que ya existe que armar una
  pieza desde el vacío.
- **Tres modos explícitos: pintar, insertar y quitar.** Un solo gesto —tocar
  una cuenta— y el modo dice qué pasa. Nada de hover, botoncitos al costado ni
  arrastrar: en el teléfono no existen, y ahí es donde se va a usar.
- **Tocar funciona igual en la tira y en el 3D.** La tira es el hilo estirado
  y en orden; el 3D es la pieza. Son la misma lista.
- **La cámara se encuadra con el largo *objetivo*, no con el real.** Si se
  reencuadrara con el largo que hay puesto, saltaría en cada cuenta que se
  agrega. Se mueve solo cuando el cliente cambia el largo que quiere.
- **"Ajustar el hilo" agrega o saca del final** hasta llegar al objetivo, con
  media cuenta de tolerancia: es lo más cerca que se puede quedar sin partir
  una al medio.
- **El 3D no se renderiza en el servidor** (`Hilo3DCliente.tsx`). Sin DOM no
  hay canvas, así que SSR-earlo solo mete todo three.js en el módulo del
  servidor y lo cobra en cada request.

## Cómo le llega el pedido a María

1. El cliente toca **Guardar y agregar al carrito** → `POST /api/disenos`
   guarda el diseño y devuelve el código.
2. Se agrega al carrito una línea normal, con `enlace` al `/disenar/ver/...`
   en vez de a `/pieza/...`. El carrito no necesitó saber nada más.
3. El carrito arma el WhatsApp de siempre, y el link del diseño va en el texto.
4. María lo ve en `/admin/disenos` o abriendo el link.

`DisenoCliente` tiene `contacto` y `nota`, pero **el diseñador no los pide**:
esos datos ya se cargan en el carrito, que es donde se arma el WhatsApp. Los
campos quedan para el día que un diseño se mande sin pasar por el carrito.

El endpoint es público (el cliente no tiene login). Se limita a lo básico:
máximo 200 cuentas, la paleta tiene que venir bien formada, y el largo y el
precio se **recalculan en el servidor** — nunca se confía en lo que manda el
navegador.

## Stock: avisa, no bloquea

Si el diseño usa más cuentas de las que hay cargadas, se muestra un aviso y el
número exacto que falta, pero el cliente puede seguir y mandar el pedido igual.
El inventario de María no siempre está al día y no queremos que un número viejo
frene una venta: la que confirma es ella.

## Qué NO hace la v1 (a propósito)

Está acá para no volver a discutirlo cada vez:

- No se elige el cierre, ni el color del hilo, ni el elástico.
- No hay dijes, charms ni cuentas de letra colgando del hilo.
- No hay patrones sugeridos ni plantillas ("flor", "espiral"). Vienen después,
  desde `pulseras diseños/`.
- No se puede editar un diseño ya guardado: se arma otro. Los códigos son
  baratos.
- No hay pago online. Termina en WhatsApp, como el resto de la tienda.
- No hay cuenta de usuario ni "mis diseños". El link es la única llave.
- La cartera del cliente no entra todavía.

## Lo que sigue, en orden

1. **Dijes y remates**: colgar algo del hilo (v1 solo tiene cuentas iguales en
   una fila). Toca `geometria.ts` y la paleta.
2. **Patrones sugeridos**: arrancar de un motivo ya armado en vez del hilo
   liso. Salen de las fichas de `pulseras diseños/`.
3. **Cartera del cliente**: `DisenadorCartera` en modo cliente, con medidas
   cerradas y sin precios internos.
4. **Reponer stock**: al confirmar un pedido, descontar las cuentas usadas de
   `CuentaStock` (por eso guardamos el `id` en la paleta).

## Mapa de archivos

```
src/lib/hilo/tipos.ts        los tipos, sus formas, largos y precios de armado
src/lib/hilo/diseno.ts       largo, precio, conteo, validación del POST
src/lib/hilo/geometria.ts    la secuencia → posiciones en el espacio (cm)
src/lib/celdas.ts            comprimir/descomprimir, compartido con carteras
src/lib/cuenta3d.ts          el material three.js de una cuenta (perla/metal/mate)

src/components/DisenadorHilo.tsx   la pantalla completa del cliente
src/components/TiraCuentas.tsx     la tira editable: una cuenta = un botón
src/components/Hilo3D.tsx          el hilo en 3D, en su forma real
src/components/Hilo3DCliente.tsx   el mismo, cargado solo en el navegador

src/app/(tienda)/disenar/page.tsx            elegir qué diseñar
src/app/(tienda)/disenar/[tipo]/page.tsx     el diseñador
src/app/(tienda)/disenar/ver/[codigo]/page.tsx  un diseño guardado, solo lectura
src/app/api/disenos/route.ts                 guardar
src/app/admin/(panel)/disenos/page.tsx       los diseños que llegaron
```
