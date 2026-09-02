/**
 * Los modelos de cartera que salen de las fichas de `carteras diseños/`,
 * con su paleta y el motivo que llevan tejido.
 *
 * Cada modelo trae una función que, para cada cuenta, dice qué entrada de la
 * paleta le toca. Eso genera el patrón inicial; después María lo edita cuenta
 * por cuenta en el diseñador y se guarda en la base.
 */
import { armarLayout, type Cuenta, type LayoutCartera, type MedidasCartera } from "./geometria";

export type CuentaPaleta = {
  /** Diámetro en mm: define el tamaño con que se dibuja la esfera. */
  mm: number;
  /** Color en hex. */
  color: string;
  nombre: string;
  /** Las doradas se dibujan metálicas; las perladas, con brillo nacarado. */
  acabado: "perla" | "metal" | "mate";
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
function esEsquina(c: Cuenta, ctx: ContextoMotivo) {
  return enFilete(c, ctx) && (c.col === 0 || c.col === ctx.cols - 1);
}

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

export const MODELOS: ModeloCartera[] = [
  {
    slug: "cartera-perlada-marfil",
    nombre: "Perlado",
    ficha: "carteras diseños/carteras/2930c920-43d7-4c1b-9b5d-57e87aba4d55.md",
    descripcion:
      "Perla marfil con filete rosa en los bordes y detalles dorados en las esquinas. Cierre magnético.",
    medidas: {
      anchoCm: 18,
      altoCm: 14,
      profundidadCm: 7,
      altoSolapaCm: 7,
      asaCm: 16,
      cuentaMm: 10,
      separacion: 1.3,
    },
    paleta: [
      { mm: 10, color: "#f4ece0", nombre: "Perla marfil 10 mm", acabado: "perla" },
      { mm: 6, color: "#f0cdd2", nombre: "Rosa pastel 6 mm", acabado: "perla" },
      { mm: 4, color: "#c9a227", nombre: "Dorada 4 mm", acabado: "metal" },
    ],
    motivo: (c, ctx) => {
      const broche = enBroche(c, ctx);
      if (broche) return broche;
      if (c.panel === "asa") return c.fila % 4 === 0 ? 1 : 0;
      if (esEsquina(c, ctx)) return 2;
      if (enFilete(c, ctx)) return 1;
      return 0;
    },
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
      separacion: 1.3,
    },
    paleta: [
      { mm: 10, color: "#a789d4", nombre: "Lila 10 mm", acabado: "perla" },
      { mm: 8, color: "#efe6f5", nombre: "Tornasol 8 mm", acabado: "perla" },
      { mm: 6, color: "#c9a227", nombre: "Dorada 6 mm", acabado: "metal" },
    ],
    motivo: (c, ctx) => {
      const broche = enBroche(c, ctx);
      if (broche) return broche === 1 ? 0 : 2;
      if (c.panel === "asa") return (c.fila + c.col) % 3 === 0 ? 1 : 0;
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
      separacion: 1.3,
    },
    paleta: [
      { mm: 10, color: "#f7f2ea", nombre: "Perla blanca 10 mm", acabado: "perla" },
      { mm: 8, color: "#e0a0aa", nombre: "Rosa pastel 8 mm", acabado: "perla" },
      { mm: 4, color: "#c9a227", nombre: "Dorada 4 mm", acabado: "metal" },
    ],
    motivo: (c, ctx) => {
      const broche = enBroche(c, ctx);
      if (broche) return broche === 1 ? 1 : 2;
      if (c.panel === "asa") return 0;
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
