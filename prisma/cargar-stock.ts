/**
 * Amplía colores y tamaños y repone cuentas y dijes hasta 5.000 unidades.
 * Vista previa: npm run db:stock
 * Aplicar:     npm run db:stock -- --aplicar
 * Conserva precios, nombres, IDs y estados existentes; nunca reduce stock.
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const prisma = new PrismaClient();
const STOCK_MINIMO = 5_000;
const TAMANOS = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16];
const COLORES = [
  { nombre: "Rojo cereza", color: "#c91545" },
  { nombre: "Rojo oscuro", color: "#7d1530" },
  { nombre: "Rosa tulipán", color: "#ee8fac" },
  { nombre: "Rosa pastel", color: "#f8bfd0" },
  { nombre: "Verde hoja", color: "#6eaa78" },
  { nombre: "Azul mar", color: "#5c8ba8" },
  { nombre: "Azul eléctrico", color: "#2454dc" },
  { nombre: "Verde esmeralda", color: "#008c69" },
  { nombre: "Lavanda", color: "#c6b4e8" },
  { nombre: "Amarillo mantequilla", color: "#f8e6a0" },
  { nombre: "Mandarina", color: "#ff9638" },
  { nombre: "Terracota", color: "#bd654b" },
];
const METALES = [
  { nombre: "Acero", color: "#b9bec4" },
  { nombre: "Cobre", color: "#b87333" },
  { nombre: "Dorado logo", color: "#c7a600" },
];

type Tono = { nombre: string; color: string; acabado: string };
const claveTono = (c: Tono) => `${c.color.toLowerCase()}|${c.acabado}`;
const claveVariante = (c: Tono & { tamanoMm: number }) => `${claveTono(c)}|${c.tamanoMm}`;

async function main() {
  const [cuentas, dijes] = await Promise.all([
    prisma.cuentaStock.findMany({ orderBy: { creadoEn: "asc" } }),
    prisma.dijeStock.findMany(),
  ]);
  const tonos = new Map<string, Tono>();
  for (const cuenta of cuentas.filter((c) => c.activo)) {
    tonos.set(claveTono(cuenta), {
      nombre: cuenta.nombre.replace(/\s+\d+(?:\.\d+)?\s*mm$/i, ""),
      color: cuenta.color.toLowerCase(),
      acabado: cuenta.acabado,
    });
  }
  for (const acabado of ["perla", "mate"]) {
    for (const color of COLORES) {
      const tono = { ...color, nombre: `${color.nombre} ${acabado}`, acabado };
      if (!tonos.has(claveTono(tono))) tonos.set(claveTono(tono), tono);
    }
  }
  for (const metal of METALES) {
    const tono = { ...metal, acabado: "metal" };
    if (!tonos.has(claveTono(tono))) tonos.set(claveTono(tono), tono);
  }
  const existentes = new Set(cuentas.map(claveVariante));
  const nuevas = [...tonos.values()].flatMap((tono) => TAMANOS.map((tamanoMm) => ({
    ...tono,
    tamanoMm,
    stock: STOCK_MINIMO,
    activo: true,
    // Sigue la convención del inventario: precio pendiente de definir.
    precioUnidad: 0,
  }))).filter((cuenta) => !existentes.has(claveVariante(cuenta)));
  const reponerCuentas = cuentas.filter((c) => c.stock < STOCK_MINIMO).length;
  const reponerDijes = dijes.filter((d) => d.stock < STOCK_MINIMO).length;
  console.log(JSON.stringify({
    nuevas: nuevas.length,
    cuentasAReponer: reponerCuentas,
    dijesAReponer: reponerDijes,
    tamanosMm: TAMANOS,
    minimoPorVariante: STOCK_MINIMO,
  }, null, 2));
  if (!process.argv.includes("--aplicar")) return;
  if (!nuevas.length && !reponerCuentas && !reponerDijes) {
    console.log("El inventario ya está completo; no hay cambios.");
    return;
  }

  const directorio = join(process.cwd(), "prisma", "stock-backups");
  await mkdir(directorio, { recursive: true });
  const respaldo = join(directorio, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(respaldo, JSON.stringify({ cuentas, dijes }, null, 2), { flag: "wx" });
  await prisma.$transaction(async (tx) => {
    if (nuevas.length) await tx.cuentaStock.createMany({ data: nuevas });
    await tx.cuentaStock.updateMany({
      where: { stock: { lt: STOCK_MINIMO } }, data: { stock: STOCK_MINIMO },
    });
    await tx.dijeStock.updateMany({
      where: { stock: { lt: STOCK_MINIMO } }, data: { stock: STOCK_MINIMO },
    });
  }, { timeout: 30_000 });

  const [totalCuentas, totalDijes] = await Promise.all([
    prisma.cuentaStock.aggregate({ _count: true, _min: { stock: true }, _sum: { stock: true } }),
    prisma.dijeStock.aggregate({ _count: true, _min: { stock: true }, _sum: { stock: true } }),
  ]);
  console.log(JSON.stringify({ totalCuentas, totalDijes, respaldo }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
