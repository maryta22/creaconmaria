/**
 * Datos de arranque para ver la tienda con contenido.
 *
 * Las carteras salen de las fichas reales de `carteras diseños/`
 * (medidas y materiales son los del patrón). **Los precios son inventados**:
 * cambialos desde el panel. Las demás piezas son ejemplos para que se vea
 * cómo queda cada línea.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { MODELOS, motivoInicial, comprimir } from "../src/lib/cartera/modelos";

const prisma = new PrismaClient();
const CARTERAS_ACTIVAS = new Set([
  "cartera-perlada-marfil",
  "cartera-corazon",
  "cartera-fresa",
  "cartera-tulipan",
  "cartera-cuadrada",
  "cartera-orca",
  "bolso-circular-dorado",
  "bolso-cuadrado-abierto",
]);

const PIEZAS = [
  // --- Carteras: fichas reales de carteras diseños/ ---
  {
    slug: "cartera-perlada-marfil",
    nombre: "Cartera Perlada Marfil",
    categoria: "CARTERA",
    descripcion:
      "Cartera tejida en cruz, cuenta por cuenta, en perla marfil de 8 mm: un solo color, de la base a la solapa. Cierre magnético y asa tubular. Lleva alrededor de 1.900 cuentas.",
    materiales: "Perlas acrílicas 8 mm marfil, hilo nylon",
    color: "Marfil",
    anchoCm: 18,
    altoCm: 14,
    profundidadCm: 7,
    largoCm: 24,
    cuentaMm: 8,
    costo: 18,
    precio: 45,
    stock: 2,
    destacado: true,
  },
  {
    slug: "cartera-corazon",
    nombre: "Cartera Corazón",
    categoria: "CARTERA",
    descripcion:
      "Silueta de corazón tejida en cruz, en perla marfil de 8 mm. Dos caras llenas y una tira de contorno que bordea la V de abajo y les da la profundidad. Abre por todo el borde de arriba —una boca de 22 cm— y cierra con broche magnético. Dos asas de 24 cm, una cosida a cada cara. Lleva alrededor de 1.100 cuentas.",
    materiales: "Perlas acrílicas 8 mm marfil, broche magnético, argollas doradas, hilo nylon",
    color: "Marfil",
    anchoCm: 18,
    altoCm: 16,
    profundidadCm: 5,
    largoCm: 24,
    cuentaMm: 8,
    costo: 15,
    precio: 38,
    stock: 2,
    destacado: true,
  },
  {
    slug: "cartera-tulipan",
    nombre: "Cartera Tulipán",
    categoria: "CARTERA",
    descripcion:
      "Cartera con silueta de tulipán, tejida cuenta por cuenta. Copa rosada de tres pétalos, contorno verde, dos caras, tira de profundidad y dos asas. Abre por el borde de arriba y cierra con broche magnético.",
    materiales: "Perlas acrílicas 8 mm rosa y verde, broche magnético, argollas doradas, hilo nylon",
    color: "Rosa y verde",
    anchoCm: 18,
    altoCm: 18,
    profundidadCm: 5,
    largoCm: 24,
    cuentaMm: 8,
    costo: 18,
    precio: 44,
    stock: 1,
    destacado: true,
  },
  {
    slug: "cartera-fresa",
    nombre: "Cartera Fresa",
    categoria: "CARTERA",
    descripcion:
      "Cartera de mano con silueta de fresa: cuerpo rojo redondeado, base en punta suave, apertura superior y dos asas tubulares.",
    materiales: "Perlas acrílicas 8 mm rojas, cuentas negras 6 mm, broche magnético, argollas doradas, hilo nylon",
    color: "Rojos y negro",
    anchoCm: 18,
    altoCm: 16,
    profundidadCm: 5,
    largoCm: 20,
    cuentaMm: 8,
    costo: 18,
    precio: 44,
    stock: 1,
    destacado: true,
  },
  {
    slug: "cartera-orca",
    nombre: "Cartera Orca",
    categoria: "CARTERA",
    descripcion:
      "La forma del Básico pero abierta arriba, sin solapa, para que el dibujo se vea entero: una orca tejida al medio de las dos paredes, en negro mate sobre fondo azul mar, con el mentón, la panza y la mancha del ojo en perla. Dos asas de 24 cm, una cosida a cada cara, y broche magnético en el borde de arriba. Lleva alrededor de 1.615 cuentas, y solo el dibujo son 178.",
    materiales: "Perlas acrílicas 8 mm azul mar, negro mate y perla marfil, broche magnético, argollas doradas, hilo nylon",
    color: "Azul mar con negro y perla",
    anchoCm: 18,
    altoCm: 14,
    profundidadCm: 7,
    largoCm: 24,
    cuentaMm: 8,
    costo: 24,
    precio: 58,
    stock: 1,
    destacado: true,
  },
  {
    slug: "bolso-cuadrado-abierto",
    nombre: "Bolso Cuadrado Abierto",
    categoria: "CARTERA",
    descripcion:
      "Bolso cuadrado tejido cuenta por cuenta en dorado. Abre por arriba y lleva dos asas tubulares para mantener libre la boca.",
    materiales: "Perlas acrilicas 8 mm doradas, broche magnetico, argollas doradas, hilo nylon",
    color: "Dorado",
    anchoCm: 18,
    altoCm: 18,
    profundidadCm: 6,
    largoCm: 28,
    cuentaMm: 8,
    costo: 20,
    precio: 50,
    stock: 1,
    destacado: true,
  },
  {
    slug: "cartera-cuadrada",
    nombre: "Cartera Cuadrada",
    categoria: "CARTERA",
    descripcion:
      "Cuadrada de 18, tejida en cruz en negro mate con filete de acero. Se cierra juntando las dos esquinas de arriba en sendos aros de acero: ahí el fuelle se dobla para adentro, como la esquina de una bolsa de papel. De aro a aro va una cadena de 60 cm. Lleva 1.610 cuentas.",
    materiales: "Perlas acrílicas 8 mm negro mate y acero, dos aros de acero de 4 cm, cadena de acero 60 cm, hilo nylon",
    color: "Negro",
    anchoCm: 18,
    altoCm: 18,
    profundidadCm: 6,
    largoCm: 60,
    cuentaMm: 8,
    costo: 22,
    precio: 52,
    stock: 1,
    destacado: true,
  },
  {
    slug: "bolso-circular-dorado",
    nombre: "Bolso Circular",
    categoria: "CARTERA",
    descripcion:
      "Bolso redondo tejido cuenta por cuenta en dorado, con dos caras circulares y dos asas tubulares. Abre por arriba.",
    materiales: "Perlas acrilicas 8 mm doradas, broche magnetico, argollas doradas, hilo nylon",
    color: "Dorado",
    anchoCm: 18,
    altoCm: 18,
    profundidadCm: 5,
    largoCm: 28,
    cuentaMm: 8,
    costo: 20,
    precio: 52,
    stock: 1,
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

  // --- Ejemplos de las otras líneas ---
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
  const piezasActivas = PIEZAS.filter(
    (pieza) => pieza.categoria !== "CARTERA" || CARTERAS_ACTIVAS.has(pieza.slug),
  );
  const modelosActivos = MODELOS.filter((modelo) => CARTERAS_ACTIVAS.has(modelo.slug));

  for (const pieza of piezasActivas) {
    await prisma.producto.upsert({
      where: { slug: pieza.slug },
      update: pieza.slug === "bolso-circular-dorado" ? pieza : {},
      create: pieza,
    });
  }
  // Patrones 3D de las carteras, generados desde las fichas de diseño.
  for (const modelo of modelosActivos) {
    const producto = await prisma.producto.findUnique({ where: { slug: modelo.slug } });
    const datos = {
      nombre: modelo.nombre,
      ficha: modelo.ficha,
      ...modelo.medidas,
      // Va aparte y siempre: un modelo que no declara `forma` usa el default,
      // y sin esta línea la columna se quedaba con la forma que tuviera de
      // antes. Un patrón guardado como `cuadrada` sobre celdas generadas para
      // una caja no dibuja nada parecido a la cartera.
      forma: modelo.medidas.forma ?? "caja",
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

  console.log(`Listo: ${piezasActivas.length} piezas y ${modelosActivos.length} patrones 3D.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
