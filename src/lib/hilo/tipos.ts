/**
 * Los tipos de pieza que el cliente puede diseñar solo, en la tienda.
 *
 * Los tres son lo mismo: **un hilo con cuentas en fila**. Lo único que cambia
 * es cómo se acomoda ese hilo en el espacio, qué cierre lleva y qué largos
 * tiene sentido sugerir. Por eso no hay tres diseñadores: hay uno.
 *
 * **Para agregar un tipo alcanza con agregar una entrada a este array**, igual
 * que con las líneas de `src/lib/categorias.ts`.
 *
 * Los precios de armado son inventados, como los del seed. Ver
 * `docs/disenador-cliente.md`.
 */

/** Cómo se acomoda el hilo. Cada forma la dibuja `armarHilo()`. */
export type FormaHilo =
  /** Anillo cerrado, apoyado sobre la mesa. El cierre queda atrás. */
  | "aro"
  /** Anillo colgando: la parte de abajo es la que se ve, el cierre va arriba. */
  | "curva"
  /** Tira vertical con una argolla arriba. */
  | "tira";

export type TipoHilo = {
  /** Lo que va en la URL: /disenar/pulsera */
  slug: string;
  /**
   * La misma categoría de `src/lib/categorias.ts`, a propósito: el día que
   * María quiera publicar un diseño del cliente como pieza del catálogo, ya
   * cae en la línea correcta sin traducir nada.
   */
  categoria: string;
  nombre: string;
  descripcion: string;
  forma: FormaHilo;
  /** Cómo se llama el cierre en pantalla: "broche", "argolla". */
  cierre: string;
  /** Cuántos cm suma el cierre al largo total. */
  cierreCm: number;
  /** Largos sugeridos, en cm. El primero es con el que arranca la pantalla. */
  largos: readonly number[];
  /** Hasta dónde puede estirarlo el cliente. */
  minCm: number;
  maxCm: number;
  /** Mano de obra + cierre, en USD. Las cuentas se suman aparte. */
  armado: number;
};

export const TIPOS_HILO = [
  {
    slug: "pulsera",
    categoria: "PULSERA",
    nombre: "Pulsera",
    descripcion: "Un aro de cuentas alrededor de la muñeca, cerrado con broche.",
    forma: "aro",
    cierre: "broche",
    cierreCm: 1.5,
    largos: [15, 17, 19],
    minCm: 12,
    maxCm: 24,
    armado: 3,
  },
  {
    slug: "collar",
    categoria: "COLLAR",
    nombre: "Collar",
    descripcion: "Del cuello para abajo: gargantilla corta o collar largo.",
    forma: "curva",
    cierre: "broche",
    cierreCm: 2,
    largos: [38, 45, 55],
    minCm: 30,
    maxCm: 70,
    armado: 5,
  },
  {
    slug: "colgador",
    categoria: "COLGADOR",
    nombre: "Colgador de mochila",
    descripcion: "Una tira que cuelga de la mochila, la cartera o las llaves.",
    forma: "tira",
    cierre: "argolla",
    cierreCm: 2.5,
    largos: [10, 12, 15],
    minCm: 6,
    maxCm: 25,
    armado: 3.5,
  },
] as const satisfies readonly TipoHilo[];

export type SlugHilo = (typeof TIPOS_HILO)[number]["slug"];

export function tipoPorSlug(slug: string): TipoHilo | undefined {
  return TIPOS_HILO.find((t) => t.slug === slug);
}

/** El tipo de un diseño ya guardado, que se persiste por categoría. */
export function tipoPorCategoria(categoria: string): TipoHilo | undefined {
  return TIPOS_HILO.find((t) => t.categoria === categoria);
}
