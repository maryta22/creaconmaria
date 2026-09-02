/**
 * El mapa de tejido: pasa del patrón 3D a las cuadrículas planas que María
 * necesita con la cartera a medio tejer al lado. Una por pieza, en el orden en
 * que se arman.
 */
import {
  COSTURAS,
  NOMBRE_PANEL,
  type Borde,
  type LayoutCartera,
  type Panel,
} from "./geometria";
import type { CuentaPaleta } from "./modelos";

/** Nombre corto, para las etiquetas que van al costado de una cuadrícula. */
export const NOMBRE_CORTO: Record<Panel, string> = {
  base: "Base",
  frente: "Frente",
  espalda: "Espalda",
  lateralIzq: "Lateral izquierdo",
  lateralDer: "Lateral derecho",
  solapa: "Solapa",
  asa: "Asa",
};

/** De qué lado de la cuadrícula cae cada borde, tal como se dibuja. */
export const LADO: Record<Borde, "arriba" | "abajo" | "izquierda" | "derecha"> = {
  primeraFila: "abajo",
  ultimaFila: "arriba",
  primeraColumna: "izquierda",
  ultimaColumna: "derecha",
};

/** "Fila 1 (abajo)", "Columna 17 (derecha)"… */
export function nombreBorde(borde: Borde, filas: number, cols: number) {
  const numero = {
    primeraFila: `Fila 1`,
    ultimaFila: `Fila ${filas}`,
    primeraColumna: `Columna 1`,
    ultimaColumna: `Columna ${cols}`,
  }[borde];
  return `${numero} (${LADO[borde]})`;
}

/** Una unión vista desde una de las dos piezas. */
export type CosturaDePanel = {
  borde: Borde;
  con: Panel;
  conBorde: Borde;
  nota: string;
  /** "Fila 5 (arriba)" — este borde. Se completa en `armarMapa`. */
  bordeNombre: string;
  /** "Fila 1 (abajo)" — el borde de la otra pieza. */
  conBordeNombre: string;
};

/**
 * Todas las costuras que tocan una pieza, desde su punto de vista, con los dos
 * bordes ya nombrados con su número de fila o columna.
 */
export function costurasDe(layout: LayoutCartera, panel: Panel): CosturaDePanel[] {
  const nombrar = (p: Panel, b: Borde) => {
    const r = layout.rejillas.find((x) => x.panel === p);
    return r ? nombreBorde(b, r.filas, r.cols) : "";
  };
  const armar = (borde: Borde, con: Panel, conBorde: Borde, nota: string) => ({
    borde,
    con,
    conBorde,
    nota,
    bordeNombre: nombrar(panel, borde),
    conBordeNombre: nombrar(con, conBorde),
  });

  return COSTURAS.flatMap((c) => {
    if (c.a === panel) return [armar(c.bordeA, c.b, c.bordeB, c.nota)];
    if (c.b === panel) return [armar(c.bordeB, c.a, c.bordeA, c.nota)];
    return [];
  });
}

export type PanelMapa = {
  panel: Panel;
  nombre: string;
  /** Letra con la que se numera la pieza en el orden de armado. */
  paso: number;
  filas: number;
  cols: number;
  /** Índices de paleta, `[fila][columna]`. La fila 0 es la primera que se teje. */
  celdas: number[][];
  /** Cuántas cuentas de cada color lleva esta pieza. */
  porColor: number[];
  total: number;
  /** Cómo se orienta la cuadrícula respecto de la cartera terminada. */
  orientacion: string;
  /** Qué bordes de esta pieza se cosen, y con qué. */
  costuras: CosturaDePanel[];
};

export type MapaTejido = {
  paneles: PanelMapa[];
  porColor: number[];
  total: number;
};

const ORIENTACION: Record<Panel, string> = {
  base: "Se teje plana y apoyada. Las filas van de la espalda hacia el frente.",
  frente: "Se levanta desde el borde largo delantero de la base. Fila 1 = abajo.",
  espalda: "Se levanta desde el borde largo trasero de la base. Fila 1 = abajo.",
  lateralIzq: "Cierra entre frente y espalda, del lado izquierdo. Fila 1 = abajo.",
  lateralDer: "Cierra entre frente y espalda, del lado derecho. Fila 1 = abajo.",
  solapa:
    "Nace del borde superior de la espalda: las primeras filas cruzan el techo y las últimas bajan por el frente.",
  asa: "Tejido tubular: cada fila es una vuelta completa alrededor del tubo.",
};

/** La letra con la que aparece cada color en la cuadrícula. */
export function letraDe(indice: number) {
  return String.fromCharCode(65 + indice);
}

/** Negro o blanco, el que se lea mejor sobre ese color de cuenta. */
export function tintaSobre(hex: string) {
  const limpio = hex.replace("#", "");
  const n = parseInt(limpio.length === 3 ? limpio.replace(/./g, "$&$&") : limpio, 16);
  const luz = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return luz > 150 ? "#2a251f" : "#ffffff";
}

export function armarMapa(
  layout: LayoutCartera,
  celdas: number[],
  paleta: CuentaPaleta[],
): MapaTejido {
  const porColorTotal = new Array(paleta.length).fill(0);

  const paneles = layout.rejillas.map((rejilla, orden): PanelMapa => {
    const porColor = new Array(paleta.length).fill(0);
    const grilla: number[][] = [];

    for (let f = 0; f < rejilla.filas; f++) {
      const fila: number[] = [];
      for (let c = 0; c < rejilla.cols; c++) {
        const indice = Math.min(
          Math.max(celdas[rejilla.desde + f * rejilla.cols + c] ?? 0, 0),
          paleta.length - 1,
        );
        fila.push(indice);
        porColor[indice] += 1;
        porColorTotal[indice] += 1;
      }
      grilla.push(fila);
    }

    return {
      panel: rejilla.panel,
      nombre: NOMBRE_PANEL[rejilla.panel],
      paso: orden + 1,
      filas: rejilla.filas,
      cols: rejilla.cols,
      celdas: grilla,
      porColor,
      total: rejilla.filas * rejilla.cols,
      orientacion: ORIENTACION[rejilla.panel],
      costuras: costurasDe(layout, rejilla.panel),
    };
  });

  return {
    paneles,
    porColor: porColorTotal,
    total: layout.cuentas.length,
  };
}

export type PasoArmado = { texto: string; union?: string };

/**
 * Los pasos de armado. Los del medio **se generan desde `COSTURAS`**, así que
 * las instrucciones y los hilos del 3D siempre dicen lo mismo.
 */
export function pasosDeArmado(layout: LayoutCartera): PasoArmado[] {
  const medida = (panel: Panel, borde: Borde) => {
    const r = layout.rejillas.find((x) => x.panel === panel);
    if (!r) return "";
    return `${nombreBorde(borde, r.filas, r.cols)} de ${NOMBRE_CORTO[panel]}`;
  };


  return [
    { texto: "Tejer cada pieza por separado, siguiendo su cuadrícula." },
    ...COSTURAS.map((c) => ({
      texto: c.nota,
      union: `${medida(c.a, c.bordeA)} — con — ${medida(c.b, c.bordeB)}`,
    })),
    { texto: "Reforzar las esquinas pasando el hilo varias veces por las cuentas de borde." },
    { texto: "Colocar el cierre centrado, mitad en la solapa y mitad en el frente." },
    {
      texto: "Tejer el asa aparte y coserla con las argollas.",
      union: "Las dos puntas del Asa — a los costados del borde superior",
    },
  ];
}
