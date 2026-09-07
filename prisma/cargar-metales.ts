/**
 * Carga las **cuentas metálicas de 4 mm** en el stock.
 *
 *   npx tsx prisma/cargar-metales.ts
 *
 * El inventario de 4 mm eran las veinticuatro macaron mate y dos perlas: ni una
 * dorada. La margarita necesita dos —el centro de la flor y las rondelas del
 * tramo de unión— y sin ellas el modelo se ofrecía sin colores para elegir.
 *
 * Van en 4 mm a propósito: es la medida del pétalo, y en una margarita el
 * anillo cierra solo si las seis miden lo mismo. La regla de los 8 mm es de las
 * carteras, que tienen que sostenerse solas; una pulsera cuelga del hilo.
 *
 * **Es idempotente**: si una cuenta ya está cargada con ese nombre y ese
 * tamaño, no la toca — ni el stock ni el precio, que son de María.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Lo mismo que traen las que ya estaban: números de referencia. */
const STOCK_INICIAL = 200;

const METALES: { nombre: string; color: string }[] = [
  // El oro es el acento de la marca: van tres tonos, que es lo que se usa.
  { nombre: "Dorado brillante", color: "#d7b42f" },
  { nombre: "Dorado claro", color: "#e8c76a" },
  { nombre: "Oro rosado", color: "#dda58c" },
  { nombre: "Bronce", color: "#9c7845" },
  { nombre: "Plateado", color: "#c3c7cb" },
  { nombre: "Grafito metálico", color: "#4a4744" },
];

async function main() {
  let nuevas = 0;
  for (const cuenta of METALES) {
    const yaEsta = await prisma.cuentaStock.findFirst({
      where: { nombre: cuenta.nombre, tamanoMm: 4 },
      select: { id: true },
    });
    if (yaEsta) continue;
    await prisma.cuentaStock.create({
      data: {
        nombre: cuenta.nombre,
        color: cuenta.color,
        tamanoMm: 4,
        acabado: "metal",
        stock: STOCK_INICIAL,
        precioUnidad: 0,
        activo: true,
      },
    });
    nuevas += 1;
  }
  const total = await prisma.cuentaStock.count({ where: { tamanoMm: 4, acabado: "metal" } });
  console.log(`Listo: ${nuevas} metálicas nuevas de 4 mm. Ahora hay ${total} en total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
