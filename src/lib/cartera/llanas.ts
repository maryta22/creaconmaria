/**
 * Las carteras **llanas**: las formas de la línea sin dibujo, para ponerles un
 * estampado encima. Es lo que se elige en `/admin/estampados`.
 *
 * Son las medidas y nada más. El color y el dibujo los pone el estampado, así
 * que acá no hay paleta ni motivo: una llana no es un modelo del catálogo, es
 * el punto de partida de uno.
 *
 * Para mostrarla se usa la **cuenta base** de `src/lib/cuentas-base.ts`, en
 * gris. Es la misma regla que en las pulseras: un modelo base se ve en escala
 * de grises y el color entra recién cuando alguien elige cuentas del stock. Las
 * carteras que **ya tienen color** —las que están guardadas en
 * `PatronCartera`— conservan el suyo; esto es solo para las formas sin dibujo.
 */
import { cuentaBase, FORRO_BASE } from "@/lib/cuentas-base";
import { armarLayout, type MedidasCartera, type Panel } from "./geometria";
import type { CuentaPaleta } from "./modelos";
import type { Estampado } from "./estampados";

export type Llana = {
  slug: string;
  nombre: string;
  /** En criollo, para el que elige. */
  resumen: string;
  medidas: MedidasCartera;
};

export const LLANAS: Llana[] = [
  {
    slug: "basica",
    nombre: "Básica",
    resumen: "Caja con solapa y un asa. 18 × 14 × 7 cm.",
    medidas: {
      forma: "caja",
      anchoCm: 18,
      altoCm: 14,
      profundidadCm: 7,
      altoSolapaCm: 7,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
  },
  {
    slug: "abierta",
    nombre: "Abierta",
    resumen: "La misma caja sin solapa: abre arriba y lleva dos asas. 18 × 14 × 7 cm.",
    medidas: {
      forma: "caja",
      anchoCm: 18,
      altoCm: 14,
      profundidadCm: 7,
      altoSolapaCm: 0,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
  },
  {
    slug: "cuadrada",
    nombre: "Cuadrada",
    resumen: "Se cierra juntando las esquinas en dos aros y cuelga de una cadena. 18 × 18 × 6 cm.",
    medidas: {
      forma: "cuadrada",
      anchoCm: 18,
      altoCm: 18,
      profundidadCm: 6,
      altoSolapaCm: 0,
      asaCm: 0,
      aroCm: 4,
      cadenaCm: 60,
      cuentaMm: 8,
      separacion: 1,
    },
  },
  {
    slug: "corazon",
    nombre: "Corazón",
    resumen: "Dos caras con silueta y una tira de contorno. 18 × 16 × 5 cm.",
    medidas: {
      forma: "corazon",
      anchoCm: 18,
      altoCm: 16,
      profundidadCm: 5,
      altoSolapaCm: 0,
      asaCm: 24,
      cuentaMm: 8,
      separacion: 1,
    },
  },
];

/**
 * Con qué se dibuja una llana mientras no tiene color: una sola cuenta base,
 * blanca, del tamaño que use la forma.
 */
export function paletaDeLlana(llana: Llana): CuentaPaleta[] {
  return [cuentaBase(llana.medidas.cuentaMm)];
}

/** El forro de una llana va en gris, como sus cuentas. */
export const FORRO_LLANA = FORRO_BASE;

/** Todas las cuentas del mismo tono: una llana no tiene dibujo. */
export function celdasDeLlana(llana: Llana) {
  return new Array(armarLayout(llana.medidas).cuentas.length).fill(0);
}

/**
 * **Las carteras que son modelos base**, por slug.
 *
 * Son las que no tienen dibujo: lo que define la pieza es la forma, y el color
 * lo elige la clienta en la ficha. Se muestran con la escala de grises de
 * `cuentas-base.ts`; las que tienen dibujo conservan su paleta, porque ahí el
 * color es parte del diseño.
 *
 * **Va a mano, como `LLANAS`.** No se puede deducir de la paleta: la Cuadrada
 * es lisa y lleva dos tonos —el cuerpo y la banda de arriba—, así que contar
 * colores dejaba afuera justo la que María había marcado. Las nombró ella:
 * *"estas son las básicas"*.
 */
export const CARTERAS_BASE = [
  "cartera-corazon",
  "cartera-perlada-marfil",
  "bolso-cuadrado-abierto",
  "bolso-circular-dorado",
  "cartera-cuadrada",
];

export function esCarteraBase(slug: string) {
  return CARTERAS_BASE.includes(slug);
}

export function llanaPorSlug(slug: string) {
  return LLANAS.find((l) => l.slug === slug);
}

/** Las piezas de costado de cada forma: el fuelle, o la tira del corazón. */
const COSTADOS: Panel[] = ["lateralIzq", "lateralDer", "contorno"];

export type OpcionesEstampado = {
  /** Si el dibujo también va en las piezas de costado. */
  laterales?: boolean;
};

/**
 * El patrón que sale de ponerle un estampado a una llana: un índice de paleta
 * por cuenta, en el orden de `armarLayout()`.
 *
 * **El estampado va en el frente y la espalda**, y con `laterales` también en
 * el fuelle (o en la tira, en el corazón). La base, la solapa y las asas van
 * siempre del color de fondo: la base no se mira y las asas llenas de dibujo
 * hacen que la cartera se lea sucia.
 *
 * **Cada pieza lleva su propia cuadrícula, desde su (0, 0).** No se estira una
 * cuadrícula única dando la vuelta a la cartera, porque no es así como se teje:
 * cada pieza se teje aparte, con su pliego al lado. Las rayas horizontales
 * calzan solas de una pieza a la otra —las filas están a la misma altura— y las
 * verticales muestran la costura, que es lo que se ve en una cartera de verdad.
 *
 * En la espalda **se espeja**. Mirando la cartera de atrás el dibujo se ve al
 * revés, así que sin espejar la orca nada para el otro lado. A un geométrico no
 * le cambia nada; a una figura, todo.
 */
export function celdasDeEstampado(
  medidas: MedidasCartera,
  estampado: Estampado,
  opciones: OpcionesEstampado = {},
): number[] {
  const layout = armarLayout(medidas);
  const porPanel = new Map(layout.rejillas.map((r) => [r.panel, r]));

  const lleva = (panel: Panel) =>
    panel === "frente" ||
    panel === "espalda" ||
    (!!opciones.laterales && COSTADOS.includes(panel));

  return layout.cuentas.map((cuenta) => {
    if (!lleva(cuenta.panel)) return 0;
    const rejilla = porPanel.get(cuenta.panel);
    if (!rejilla) return 0;
    // La espalda y el lateral izquierdo se ven desde el otro lado.
    const espeja = cuenta.panel === "espalda" || cuenta.panel === "lateralIzq";
    const col = espeja ? rejilla.cols - 1 - cuenta.col : cuenta.col;
    const tono = estampado.celda(cuenta.fila, col, rejilla.filas, rejilla.cols);
    return Math.max(0, Math.min(tono, estampado.tonos - 1));
  });
}
