/**
 * Datos de arranque para ver la tienda con contenido.
 *
 * Las tres carteras salen de las fichas reales de `carteras diseños/`
 * (medidas y materiales son los del patrón). **Los precios son inventados**:
 * cambialos desde el panel. Las demás piezas son ejemplos para que se vea
 * cómo queda cada línea.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { MODELOS, motivoInicial, comprimir } from "../src/lib/cartera/modelos";

const prisma = new PrismaClient();

const PIEZAS = [
  // --- Carteras: fichas reales de carteras diseños/ ---
  {
    slug: "cartera-perlada-marfil",
    nombre: "Cartera Perlada Marfil",
    categoria: "CARTERA",
    descripcion:
      "Cartera tejida en cruz, cuenta por cuenta, en perla marfil con filetes rosa pastel y detalles dorados. Cierre magnético y asa tubular. Lleva entre 540 y 600 cuentas.",
    materiales: "Perlas acrílicas 10 mm marfil, cuentas 6 mm rosa pastel, cuentas 4 mm doradas, hilo nylon",
    color: "Marfil con rosa pastel",
    anchoCm: 18,
    altoCm: 14,
    profundidadCm: 7,
    largoCm: 16,
    cuentaMm: 10,
    costo: 18,
    precio: 45,
    stock: 2,
    destacado: true,
  },
  {
    slug: "cartera-violeta",
    nombre: "Cartera Violeta",
    categoria: "CARTERA",
    descripcion:
      "La más amplia de la línea. Lila opaco combinado con cuentas transparentes tornasol y filete dorado, cierre magnético y cadena dorada opcional.",
    materiales: "Cuentas acrílicas 10 mm lila, 8 mm tornasol, 6 mm doradas, hilo nylon",
    color: "Lila y tornasol",
    anchoCm: 20,
    altoCm: 14,
    profundidadCm: 8,
    largoCm: 16,
    cuentaMm: 10,
    costo: 20,
    precio: 52,
    stock: 1,
    destacado: true,
  },
  {
    slug: "cartera-rombo",
    nombre: "Cartera Rombo",
    categoria: "CARTERA",
    descripcion:
      "Perla blanca con una banda de rombos rosa pastel recorriendo el cuerpo. Asa larga de 30 cm y broche metálico.",
    materiales: "Perlas 10 mm blancas, cuentas 8 mm rosa pastel, cuentas 4 mm doradas, hilo nylon",
    color: "Blanco con rosa pastel",
    anchoCm: 22,
    altoCm: 13,
    profundidadCm: 7,
    largoCm: 30,
    cuentaMm: 10,
    costo: 19,
    precio: 48,
    stock: 0,
    destacado: false,
  },

  // --- Ejemplos de las otras tres líneas ---
  {
    slug: "pulsera-perla-marfil",
    nombre: "Pulsera Perla Marfil",
    categoria: "PULSERA",
    descripcion: "Perlas marfil de 8 mm con separadores dorados y extensión regulable.",
    materiales: "Perlas acrílicas 8 mm, separadores dorados, elástico",
    color: "Marfil y dorado",
    largoCm: 17,
    ajustable: true,
    extensionCm: 3,
    cuentaMm: 8,
    costo: 2.5,
    precio: 8,
    stock: 6,
    destacado: true,
  },
  {
    slug: "pulsera-nombre-a-pedido",
    nombre: "Pulsera con nombre",
    categoria: "PULSERA",
    descripcion: "Cuentas de letra sobre base de color a elección. Se teje con el nombre que pidas.",
    materiales: "Cuentas de letra 6 mm, cuentas de color 6 mm, elástico",
    color: "A elección",
    largoCm: 17,
    ajustable: false,
    cuentaMm: 6,
    costo: 2,
    precio: 7,
    stock: 4,
    destacado: false,
  },
  {
    slug: "colgador-mochila-corazon",
    nombre: "Colgador de mochila Corazón",
    categoria: "COLGADOR",
    descripcion: "Dije tejido con mosquetón dorado, para colgar de la mochila o el bolso.",
    materiales: "Cuentas 6 mm, mosquetón dorado, hilo nylon",
    color: "Rosa y dorado",
    largoCm: 12,
    cuentaMm: 6,
    costo: 2,
    precio: 6.5,
    stock: 5,
    destacado: true,
  },
  {
    slug: "collar-gargantilla-perla",
    nombre: "Gargantilla de perlas",
    categoria: "COLLAR",
    descripcion: "Perlas 6 mm al ras del cuello, con cierre de mosquetón y extensión.",
    materiales: "Perlas acrílicas 6 mm, cierre dorado",
    color: "Marfil",
    largoCm: 38,
    ajustable: true,
    extensionCm: 5,
    cuentaMm: 6,
    costo: 4,
    precio: 12,
    stock: 3,
    destacado: false,
  },
];

async function main() {
  for (const pieza of PIEZAS) {
    await prisma.producto.upsert({
      where: { slug: pieza.slug },
      update: {},
      create: pieza,
    });
  }
  // Patrones 3D de las carteras, generados desde las fichas de diseño.
  for (const modelo of MODELOS) {
    const producto = await prisma.producto.findUnique({ where: { slug: modelo.slug } });
    const datos = {
      nombre: modelo.nombre,
      ficha: modelo.ficha,
      ...modelo.medidas,
      paleta: JSON.stringify(modelo.paleta),
      celdas: comprimir(motivoInicial(modelo)),
      productoId: producto?.id ?? null,
    };
    await prisma.patronCartera.upsert({
      where: { slug: modelo.slug },
      update: datos,
      create: { slug: modelo.slug, ...datos },
    });
  }

  console.log(`Listo: ${PIEZAS.length} piezas y ${MODELOS.length} patrones 3D.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
