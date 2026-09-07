/**
 * Los modelos de cartera que salen de las fichas de `carteras diseños/`,
 * con su paleta y el motivo que llevan tejido.
 *
 * Cada modelo trae una función que, para cada cuenta, dice qué entrada de la
 * paleta le toca. Eso genera el patrón inicial; después María lo edita cuenta
 * por cuenta en el diseñador y se guarda en la base.
 */
import { armarLayout, esAsa, type Cuenta, type LayoutCartera, type MedidasCartera } from "./geometria";
import type { AcabadoCuenta } from "../cuentas";

export type CuentaPaleta = {
  /** Tamaño en mm: define la escala de la cuenta. */
  mm: number;
  /** Color en hex. */
  color: string;
  nombre: string;
  /** Material y corte: el cristal se representa como bicono facetado. */
  acabado: AcabadoCuenta;
  /** Conserva el corte en las cuentas base, cuyo material es gris mate. */
  forma?: "bicono";
};

export type ModeloCartera = {
  slug: string;
  nombre: string;
  /** Ficha de la que salió, dentro de `carteras diseños/`. */
  ficha: string;
  descripcion: string;
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  /** Devuelve el índice de paleta de cada cuenta. */
  motivo: (c: Cuenta, ctx: ContextoMotivo) => number;
};

export type ContextoMotivo = {
  layout: LayoutCartera;
  /** Filas y columnas del panel al que pertenece la cuenta. */
  filas: number;
  cols: number;
};

/**
 * El filete: la primera y la última fila de cada panel. Es lo que en los
 * pliegos se llama "reforzar los bordes", y es donde van las cuentas chicas.
 */
function enFilete(c: Cuenta, ctx: ContextoMotivo) {
  return c.fila === 0 || c.fila === ctx.filas - 1;
}

/** Las puntas del filete, donde el pliego pone la cuenta dorada. */
/** El broche: un círculo de cuentas en el centro del frente de la solapa. */
function enBroche(c: Cuenta, ctx: ContextoMotivo, radio = 1.6) {
  if (c.panel !== "solapa") return 0;
  const centroFila = ctx.filas - 2;
  const centroCol = (ctx.cols - 1) / 2;
  const d = Math.hypot(c.fila - centroFila, c.col - centroCol);
  if (d < 0.6) return 1; // la cuenta grande del centro
  if (d < radio) return 2; // el aro dorado alrededor
  return 0;
}

/**
 * La orca, de perfil y mirando a la izquierda. 17 cuentas de ancho por 9 de
 * alto, centrada en la pared: **no ocupa todo el ancho**, le quedan tres
 * cuentas de mar a cada lado y cuatro filas arriba y abajo. Lo pidió María:
 * *"no tiene que ocupar todo el ancho de la cartera, puede ser más pequeña"*.
 *
 * La cola sale del cuerpo y no al lado: las filas de arriba y de abajo del
 * pedúnculo siguen derecho hasta los lóbulos, y lo que abre la horquilla es que
 * la del medio se corta antes. Y la mancha del ojo va separada del blanco de la
 * panza por una cuenta negra: pegadas se leen como un solo manchón.
 *
 * Se dibuja acá como cuadrícula y no con fórmulas porque **es un dibujo**: así
 * se lee igual en el código que en la ficha, y para corregirle una cuenta se
 * cambia un caracter. `#` es negro, `o` blanco y `.` el mar de fondo.
 *
 * Está escrita de arriba para abajo, como se ve; la fila 0 de una pieza es la
 * de abajo, así que `enOrca()` la da vuelta.
 */
const ORCA = [
  "........#........",
  ".......##........",
  "......###........",
  "..#########...###",
  "##oo############.",
  "oo############...",
  ".ooooooo########.",
  "...###........###",
  "....##...........",
];

/** Qué le toca a la celda (fila, col) de una pared con la orca centrada. */
function enOrca(fila: number, col: number, filas: number, cols: number) {
  const desdeCol = Math.floor((cols - ORCA[0].length) / 2);
  const desdeFila = Math.floor((filas - ORCA.length) / 2);
  const f = fila - desdeFila;
  const c = col - desdeCol;
  if (f < 0 || f >= ORCA.length || c < 0 || c >= ORCA[0].length) return ".";
  return ORCA[ORCA.length - 1 - f][c];
}

/** Fresa compacta para la caída frontal de una solapa: `r` rojo y `#` negro. */
const FRESA = [
  "....###....",
  "...#r#r#...",
  "..rrrrrrr..",
  ".rr#rrr#rr.",
  ".rrrrrrrrr.",
  "..rrr#rrr..",
  "...rrrrr...",
  "....rrr....",
  ".....r.....",
];

function enFresa(fila: number, col: number, filas: number, cols: number) {
  const desdeCol = Math.floor((cols - FRESA[0].length) / 2);
  // Las últimas filas de la solapa son las que caen sobre el frente. En el
  // techo no va dibujo: al doblar la solapa se partiría y parecería deformado.
  const desdeFila = filas - FRESA.length;
  const f = fila - desdeFila;
  const c = col - desdeCol;
  if (f < 0 || f >= FRESA.length || c < 0 || c >= FRESA[0].length) return ".";
  return FRESA[FRESA.length - 1 - f][c];
}

export const MODELOS: ModeloCartera[] = [
  {
    slug: "cartera-perlada-marfil",
    nombre: "Básico",
    ficha: "carteras diseños/carteras/basico.md",
    descripcion:
      "Perla marfil de 8 mm, un solo color y una sola medida de cuenta. El modelo liso de la línea.",
    medidas: {
      anchoCm: 18,
      altoCm: 14,
      profundidadCm: 7,
      altoSolapaCm: 7,
      // 24 cm de tira dejan unos 10 cm de hueco entre el asa y la cartera, que
      // es por donde pasa la mano. Con 16 el arco levantaba 5 cm y no entraba.
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
    // Una sola entrada: no hay filete, ni esquinas doradas, ni broche.
    paleta: [{ mm: 8, color: "#f4ece0", nombre: "Perla marfil 8 mm", acabado: "perla" }],
    // Liso de punta a punta. Es lo que lo hace el modelo con el que se arranca.
    motivo: () => 0,
  },

  {
    slug: "cartera-corazon",
    nombre: "Corazón",
    ficha: "carteras diseños/carteras/corazon.md",
    descripcion:
      "Silueta de corazón en perla marfil de 8 mm. Dos caras y una tira de contorno que les da la profundidad; abre por la hendidura de arriba.",
    medidas: {
      forma: "corazon",
      anchoCm: 18,
      altoCm: 16,
      profundidadCm: 5,
      // No lleva solapa: la boca es la hendidura entre los dos lóbulos.
      altoSolapaCm: 0,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [{ mm: 8, color: "#f4ece0", nombre: "Perla marfil 8 mm", acabado: "perla" }],
    motivo: () => 0,
  },

  {
    slug: "cartera-tulipan",
    nombre: "Tulipán",
    ficha: "carteras diseños/carteras/tulipan.md",
    descripcion:
      "Silueta de tulipán con una copa amplia, tres pétalos rosados y contorno verde. Dos caras, una tira de contorno y dos asas para dejar libre la boca superior.",
    medidas: {
      forma: "tulipan",
      anchoCm: 18,
      altoCm: 18,
      profundidadCm: 5,
      altoSolapaCm: 0,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [
      { mm: 8, color: "#ee8fac", nombre: "Rosa tulipán 8 mm", acabado: "perla" },
      { mm: 8, color: "#f8bfd0", nombre: "Rosa claro 8 mm", acabado: "perla" },
      { mm: 8, color: "#6eaa78", nombre: "Verde hoja 8 mm", acabado: "perla" },
    ],
    motivo: (c, ctx) => {
      if (c.panel === "contorno" || esAsa(c.panel)) return 2;
      if (c.panel === "frente" || c.panel === "espalda") {
        const centroFila = ctx.filas * 0.42;
        const centroCol = (ctx.cols - 1) / 2;
        // Un aclarado vertical en el centro da volumen a la copa sin perder
        // la lectura limpia de un tulipán tejido.
        if (Math.abs(c.col - centroCol) <= 1.5 && c.fila >= centroFila - 3) return 1;
      }
      return 0;
    },
  },

  {
    slug: "cartera-fresa",
    nombre: "Fresa",
    ficha: "carteras diseños/carteras/fresa.md",
    descripcion:
      "Cartera de mano con silueta de fresa: cuerpo rojo redondeado, base en punta suave, apertura superior y dos asas tubulares.",
    medidas: {
      forma: "fresa",
      anchoCm: 18,
      altoCm: 16,
      profundidadCm: 5,
      altoSolapaCm: 0,
      asaCm: 20,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [
      { mm: 8, color: "#c91545", nombre: "Rojo fresa 8 mm", acabado: "mate" },
      { mm: 8, color: "#7d1530", nombre: "Rojo oscuro 8 mm", acabado: "mate" },
      { mm: 6, color: "#181616", nombre: "Semilla negra 6 mm", acabado: "mate" },
    ],
    motivo: (c, ctx) => {
      if (c.panel === "contorno" || esAsa(c.panel)) return 1;
      if (c.panel === "frente" || c.panel === "espalda") {
        // Semillas negras pequeñas, separadas en filas alternadas.
        if (c.fila % 3 === 1 && (c.col + Math.floor(c.fila / 3) * 2) % 5 === 0) return 2;
      }
      return 0;
    },
  },

  {
    slug: "bolso-circular-dorado",
    nombre: "Bolso Circular",
    ficha: "Modelo circular creado en el disenador",
    descripcion:
      "Bolso redondo de dos caras, tejido completamente en dorado, con dos asas tubulares. Abre por el arco superior.",
    medidas: {
      forma: "circulo",
      anchoCm: 18,
      altoCm: 18,
      profundidadCm: 5,
      altoSolapaCm: 0,
      asaCm: 28,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [{ mm: 8, color: "#c7a600", nombre: "Dorado logo 8 mm", acabado: "metal" }],
    motivo: () => 0,
  },

  {
    slug: "cartera-violeta",
    nombre: "Violeta",
    ficha: "carteras diseños/carteras/30690106-70df-4d06-a93c-f415262cf890.md",
    descripcion:
      "Lila opaco mezclado con cuentas tornasol en tablero de damas, filete dorado en los bordes.",
    medidas: {
      anchoCm: 20,
      altoCm: 14,
      profundidadCm: 8,
      altoSolapaCm: 7,
      asaCm: 16,
      cuentaMm: 10,
      separacion: 1,
    },
    paleta: [
      { mm: 10, color: "#a789d4", nombre: "Lila 10 mm", acabado: "perla" },
      { mm: 8, color: "#efe6f5", nombre: "Tornasol 8 mm", acabado: "perla" },
      { mm: 6, color: "#c9a227", nombre: "Dorada 6 mm", acabado: "metal" },
    ],
    motivo: (c, ctx) => {
      const broche = enBroche(c, ctx);
      if (broche) return broche === 1 ? 0 : 2;
      if (esAsa(c.panel)) return (c.fila + c.col) % 3 === 0 ? 1 : 0;
      if (enFilete(c, ctx)) return 2;
      // Tablero de damas de a dos: bloques de lila y bloques tornasol.
      return (Math.floor(c.fila / 2) + Math.floor(c.col / 2)) % 2 === 0 ? 0 : 1;
    },
  },

  {
    slug: "cartera-rombo",
    nombre: "Rombo",
    ficha: "carteras diseños/carteras/632c9813-d6e8-4e55-b7b3-4ba71baf307f.md",
    descripcion:
      "Perla blanca con una banda de rombos rosa recorriendo el cuerpo y cuentas doradas en los vértices.",
    medidas: {
      anchoCm: 22,
      altoCm: 13,
      profundidadCm: 7,
      altoSolapaCm: 7,
      asaCm: 30,
      cuentaMm: 10,
      separacion: 1,
    },
    paleta: [
      { mm: 10, color: "#f7f2ea", nombre: "Perla blanca 10 mm", acabado: "perla" },
      { mm: 8, color: "#e0a0aa", nombre: "Rosa pastel 8 mm", acabado: "perla" },
      { mm: 4, color: "#c9a227", nombre: "Dorada 4 mm", acabado: "metal" },
    ],
    motivo: (c, ctx) => {
      const broche = enBroche(c, ctx);
      if (broche) return broche === 1 ? 1 : 2;
      if (esAsa(c.panel)) return 0;
      // Base y solapa van lisas, como dice la ficha; el motivo va en las paredes.
      if (c.panel === "base" || c.panel === "solapa") return enFilete(c, ctx) ? 1 : 0;

      // Rejilla de rombos: dos familias de diagonales cruzadas.
      const periodo = 5;
      const subida = (c.fila + c.col) % periodo;
      const bajada = (c.fila - c.col + periodo * 10) % periodo;
      if (subida === 0 && bajada === 0) return 2; // vértice donde se cruzan
      if (subida === 0 || bajada === 0) return 1; // contorno del rombo
      return 0;
    },
  },

  {
    slug: "bolso-cuadrado-abierto",
    nombre: "Bolso Cuadrado Abierto",
    ficha: "Modelo cuadrado abierto creado en el disenador",
    descripcion:
      "Bolso cuadrado abierto por arriba, tejido completamente en dorado. Lleva dos asas tubulares, una sobre cada cara, para dejar libre la boca.",
    medidas: {
      anchoCm: 18,
      altoCm: 18,
      profundidadCm: 6,
      altoSolapaCm: 0,
      asaCm: 28,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [{ mm: 8, color: "#c7a600", nombre: "Dorado logo 8 mm", acabado: "metal" }],
    motivo: () => 0,
  },

  {
    slug: "cartera-cuadrada",
    nombre: "Cuadrada",
    ficha: "carteras diseños/carteras/cuadrada.md",
    descripcion:
      "Cuadrada de 18, tejida en negro mate. Las dos esquinas de arriba se juntan en sendos aros de acero y ahí el fuelle se dobla para adentro; de aro a aro va la cadena.",
    medidas: {
      forma: "cuadrada",
      anchoCm: 18,
      altoCm: 18,
      profundidadCm: 6,
      // Ni solapa ni asa tejida: cierra juntándose en los aros.
      altoSolapaCm: 0,
      asaCm: 0,
      aroCm: 4,
      cadenaCm: 60,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [
      { mm: 8, color: "#221f1c", nombre: "Negro mate 8 mm", acabado: "mate" },
      { mm: 8, color: "#b9bec4", nombre: "Acero 8 mm", acabado: "metal" },
    ],
    // Un filete de acero en las dos últimas filas de las paredes: el mismo
    // metal que los aros, ahí donde la boca se junta con ellos.
    motivo: (c, ctx) => (c.panel !== "base" && c.fila >= ctx.filas - 2 ? 1 : 0),
  },

  {
    slug: "cartera-orca",
    nombre: "Orca",
    ficha: "carteras diseños/carteras/orca.md",
    descripcion:
      "La forma del Básico pero abierta arriba, sin solapa, para que la orca se vea entera. Fondo azul mar, la orca en negro mate con el mentón, la panza y la mancha del ojo en perla.",
    medidas: {
      // Las del Básico, salvo la solapa: `altoSolapaCm: 0` es una caja abierta
      // arriba. Con solapa, la tapa cubría el frente hasta la fila 10 y la
      // orca —que mide 11 de alto— quedaba cortada por la mitad.
      anchoCm: 18,
      altoCm: 14,
      profundidadCm: 7,
      altoSolapaCm: 0,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
    paleta: [
      { mm: 8, color: "#5c8ba8", nombre: "Azul mar 8 mm", acabado: "perla" },
      { mm: 8, color: "#221f1c", nombre: "Negro mate 8 mm", acabado: "mate" },
      { mm: 8, color: "#f4ece0", nombre: "Perla marfil 8 mm", acabado: "perla" },
    ],
    motivo: (c, ctx) => {
      if (c.panel === "frente" || c.panel === "espalda") {
        // En la espalda va espejada. Mirando la cartera de atrás, el eje x se
        // ve al revés: sin espejar, la orca nadaría para el otro lado.
        const col = c.panel === "espalda" ? ctx.cols - 1 - c.col : c.col;
        const trazo = enOrca(c.fila, col, ctx.filas, ctx.cols);
        if (trazo === "#") return 1;
        if (trazo === "o") return 2;
      }
      // Todo lo demás es mar: base, laterales y asa van lisos.
      return 0;
    },
  },
];

export function modeloPorSlug(slug: string) {
  return MODELOS.find((m) => m.slug === slug);
}

/** Genera el patrón inicial de un modelo: un índice de paleta por cuenta. */
export function motivoInicial(modelo: ModeloCartera): number[] {
  const layout = armarLayout(modelo.medidas);
  const porPanel = new Map(layout.rejillas.map((r) => [r.panel, r]));

  return layout.cuentas.map((c) => {
    const rejilla = porPanel.get(c.panel)!;
    const indice = modelo.motivo(c, { layout, filas: rejilla.filas, cols: rejilla.cols });
    return Math.min(Math.max(indice, 0), modelo.paleta.length - 1);
  });
}

/**
 * Patrón comprimido: un caracter base36 por cuenta. Una cartera de ~700
 * cuentas queda en 700 caracteres, que entran cómodos en una columna de texto.
 */
export function comprimir(indices: number[]) {
  return indices.map((i) => i.toString(36)).join("");
}

export function descomprimir(celdas: string, cuentas: number): number[] {
  const indices = Array.from(celdas, (ch) => parseInt(ch, 36) || 0);
  // Si el patrón guardado quedó corto (cambió una medida), se completa con 0.
  while (indices.length < cuentas) indices.push(0);
  return indices.slice(0, cuentas);
}
