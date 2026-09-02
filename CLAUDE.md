# Crea con María — tienda + panel

Bisutería hecha a mano. Una sola app Next.js con dos caras:

- **Cliente** (`src/app/(tienda)/`): catálogo público con medidas, sin login.
- **Vendedora** (`src/app/admin/`): carga de stock, costos y márgenes. Protegido
  por `CLAVE_VENDEDORA` (cookie firmada, ver `src/lib/sesion.ts`).

## Stack

Next.js 15 (App Router) · Prisma + SQLite · Tailwind v4. Todo el código y la
UI están **en español**, incluidos nombres de variables y de rutas.

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

## Estilo visual

Negro (`--color-tinta`) como color de acción, oro (`--color-oro`) solo como
acento — filetes, chips activos, estados. Serif editorial para títulos, formas
rectas, mucho aire. Nada de rosas ni de píldoras redondeadas: la marca apunta a
lujo, no a "tierno". Los tokens y las clases reutilizables (`.btn`, `.chip`,
`.campo`, `.sobretitulo`, `.filete`, `.tarjeta`, `.precio`) están en
`src/app/globals.css`.
