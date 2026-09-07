/** Cristal facetado tipo bicono. Ejecutar: npm run db:cristales */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAMANOS = [3, 4, 6, 8, 10, 12];
const STOCK = 5_000;
const COLORES = [
  ["Transparente", "#f3f8ff"], ["Champán", "#ecd7ad"],
  ["Ámbar", "#dca03a"], ["Topacio", "#f3c454"],
  ["Limón", "#e8ee68"], ["Melocotón", "#f5b68f"],
  ["Coral", "#ed8677"], ["Rosa claro", "#f6c5df"],
  ["Rosa", "#e99ac1"], ["Fucsia", "#cf3f91"],
  ["Rubí", "#b92547"], ["Granate", "#762c46"],
  ["Lila", "#c1a6e5"], ["Amatista", "#8650b8"],
  ["Violeta", "#62409a"], ["Zafiro", "#315fbd"],
  ["Azul noche", "#283d71"], ["Celeste", "#9dceef"],
  ["Aguamarina", "#82d7dc"], ["Turquesa", "#30b9ba"],
  ["Menta", "#b2e5c3"], ["Esmeralda", "#238c66"],
  ["Oliva", "#8e9c51"], ["Peridoto", "#b4ce6b"],
  ["Cobre", "#c98b68"], ["Café", "#896346"],
  ["Gris humo", "#8c939f"], ["Negro azabache", "#242631"],
] as const;

async function main() {
  await prisma.$transaction(async (tx) => {
    const existentes = await tx.cuentaStock.findMany({ where: { acabado: "cristal" } });
    const claves = new Set(existentes.map((c) => `${c.color.toLowerCase()}|${c.tamanoMm}`));
    const nuevas = COLORES.flatMap(([nombre, color]) => TAMANOS.map((tamanoMm) => ({
      nombre: `Cristal facetado ${nombre.toLowerCase()}`,
      color, tamanoMm, acabado: "cristal", stock: STOCK, activo: true, precioUnidad: 0,
    }))).filter((c) => !claves.has(`${c.color}|${c.tamanoMm}`));
    if (nuevas.length) await tx.cuentaStock.createMany({ data: nuevas });
    const repuestas = await tx.cuentaStock.updateMany({
      where: { acabado: "cristal", stock: { lt: STOCK } }, data: { stock: STOCK },
    });
    console.log(JSON.stringify({ nuevas: nuevas.length, repuestas: repuestas.count, colores: COLORES.length, tamanosMm: TAMANOS, unidadesPorVariante: STOCK }, null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
