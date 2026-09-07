/**
 * Carga la gama de **perla de 8 mm** en el stock.
 *
 *   npx tsx prisma/cargar-perlas.ts
 *
 * El inventario tenía las veinticuatro macaron mate de 4 mm pero de perla solo
 * blanco crema y blanco puro. Con dos blancos casi iguales no se puede armar un
 * estampado: en `/admin/estampados` salían las cien miniaturas en blanco. Esta
 * es la gama que faltaba, en el mismo tamaño con el que se tejen las carteras
 * (ver `CUENTA_MINIMA_MM`).
 *
 * **Es idempotente**: si una perla ya está cargada con ese nombre y ese tamaño,
 * no la toca — ni el stock ni el precio, que son de María.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Lo mismo que traen las perlas que ya estaban: números de referencia. */
const STOCK_INICIAL = 350;

const PERLAS: { nombre: string; color: string }[] = [
  // Neutros y oscuros. Son los que faltaban: sin un oscuro no hay estampado.
  { nombre: "Perla negra", color: "#1f1c1a" },
  { nombre: "Perla grafito", color: "#4a4744" },
  { nombre: "Perla gris", color: "#9b9793" },
  { nombre: "Perla gris claro", color: "#c8c4bf" },
  { nombre: "Perla marfil", color: "#efe3cf" },
  { nombre: "Perla champán", color: "#e3cfae" },
  { nombre: "Perla arena", color: "#d8c3a5" },
  { nombre: "Perla café", color: "#7b5b43" },
  { nombre: "Perla chocolate", color: "#4a342a" },
  // Metálicos: el oro es el acento de la marca.
  { nombre: "Perla oro viejo", color: "#c7a600" },
  { nombre: "Perla oro rosa", color: "#d8a48f" },
  { nombre: "Perla bronce", color: "#9c7845" },
  // Color.
  { nombre: "Perla rosa", color: "#e8b4c0" },
  { nombre: "Perla rosa viejo", color: "#c98b98" },
  { nombre: "Perla coral", color: "#e28a72" },
  { nombre: "Perla vino", color: "#7d2437" },
  { nombre: "Perla lila", color: "#b5a2cc" },
  { nombre: "Perla violeta", color: "#6b4e8f" },
  { nombre: "Perla azul noche", color: "#24314f" },
  { nombre: "Perla azul acero", color: "#5c7a99" },
  { nombre: "Perla celeste", color: "#a8c6dd" },
  { nombre: "Perla verde agua", color: "#8fbfb2" },
  { nombre: "Perla verde oliva", color: "#6b7247" },
  { nombre: "Perla verde inglés", color: "#24463a" },
];

async function main() {
  let nuevas = 0;
  for (const perla of PERLAS) {
    const yaEsta = await prisma.cuentaStock.findFirst({
      where: { nombre: perla.nombre, tamanoMm: 8 },
      select: { id: true },
    });
    if (yaEsta) continue;
    await prisma.cuentaStock.create({
      data: {
        nombre: perla.nombre,
        color: perla.color,
        tamanoMm: 8,
        acabado: "perla",
        stock: STOCK_INICIAL,
        precioUnidad: 0,
        activo: true,
      },
    });
    nuevas += 1;
  }
  const total = await prisma.cuentaStock.count({ where: { tamanoMm: 8, acabado: "perla" } });
  console.log(`Listo: ${nuevas} perlas nuevas de 8 mm. Ahora hay ${total} en total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
