/**
 * El mapa de tejido: pasa del patrón 3D a las cuadrículas planas que María
 * necesita con la cartera a medio tejer al lado. Una por pieza, en el orden en
 * que se arman.
 */
import {
  costurasDeLayout,
  indiceEn,
  NOMBRE_PANEL,
  type Borde,
  type Costura,
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
  contorno: "Contorno",
  asa: "Asa",
  asaFrente: "Asa delantera",
  asaEspalda: "Asa trasera",
};

/** De qué lado de la cuadrícula cae cada borde, tal como se dibuja. */
export const LADO: Record<Borde, "arriba" | "abajo" | "izquierda" | "derecha" | null> = {
  primeraFila: "abajo",
  ultimaFila: "arriba",
  primeraColumna: "izquierda",
  ultimaColumna: "derecha",
  // El contorno no cae de un lado: es toda la vuelta. No se marca con corchete.
  contorno: null,
};

/** "Fila 1 (abajo)", "Columna 17 (derecha)"… */
export function nombreBorde(borde: Borde, filas: number, cols: number) {
  if (borde === "contorno") return "Todo el borde";
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

  return costurasDeLayout(layout).flatMap((c: Costura) => {
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
  /** Índices de paleta, `[fila][columna]`. **-1 = hueco**, ahí no va cuenta. */
  celdas: number[][];
  /** En qué lugar de la pieza se ensarta cada cuenta, 1 en adelante. -1 = hueco. */
  orden: number[][];
  /** Si las filas van y vuelven. El asa, que es un tubo, no. */
  serpentea: boolean;
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
  contorno: "Una tira larga: cada fila bordea la mitad de abajo de la cara, de una punta de la boca a la otra. No cierra en anillo — la columna 1 y la última quedan a los lados de la boca, que es donde va el broche.",
  base: "Se teje plana y apoyada. Las filas van de la espalda hacia el frente.",
  frente: "Se levanta desde el borde largo delantero de la base. Fila 1 = abajo.",
  espalda: "Se levanta desde el borde largo trasero de la base. Fila 1 = abajo.",
  lateralIzq: "Cierra entre frente y espalda, del lado izquierdo. Fila 1 = abajo.",
  lateralDer: "Cierra entre frente y espalda, del lado derecho. Fila 1 = abajo.",
  solapa:
    "Nace del borde superior de la espalda: las primeras filas cruzan el techo y las últimas bajan por el frente.",
  asa: "Tejido tubular: cada fila es una vuelta completa alrededor del tubo.",
  asaFrente: "Tejido tubular: cada fila es una vuelta completa alrededor del tubo. Va sobre la cara delantera, no cruzada por el medio.",
  asaEspalda: "Tejido tubular: igual que la delantera. Va sobre la cara trasera — entre las dos queda la boca.",
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

  const paneles = layout.rejillas.map((rejilla, posicion): PanelMapa => {
    const porColor = new Array(paleta.length).fill(0);
    const grilla: number[][] = [];

    const orden: number[][] = [];
    for (let f = 0; f < rejilla.filas; f++) {
      const fila: number[] = [];
      const filaOrden: number[] = [];
      for (let c = 0; c < rejilla.cols; c++) {
        const cuenta = indiceEn(rejilla, f, c);
        // -1 = acá no va cuenta: es un hueco de la silueta.
        if (cuenta < 0) {
          fila.push(-1);
          filaOrden.push(-1);
          continue;
        }
        const indice = Math.min(Math.max(celdas[cuenta] ?? 0, 0), paleta.length - 1);
        fila.push(indice);
        // El número que se imprime es el lugar que ocupa dentro de la pieza.
        filaOrden.push(cuenta - rejilla.desde + 1);
        porColor[indice] += 1;
        porColorTotal[indice] += 1;
      }
      grilla.push(fila);
      orden.push(filaOrden);
    }

    return {
      panel: rejilla.panel,
      nombre: NOMBRE_PANEL[rejilla.panel],
      paso: posicion + 1,
      filas: rejilla.filas,
      cols: rejilla.cols,
      celdas: grilla,
      orden,
      serpentea: rejilla.serpentea,
      porColor,
      total: rejilla.total,
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


  const silueta = layout.forma === "corazon" || layout.forma === "tulipan" || layout.forma === "fresa" || layout.forma === "circulo";
  const cuadrada = layout.forma === "cuadrada";
  // Una caja sin solapa se cierra sobre el borde de arriba, no contra la tapa.
  const llevaSolapa = layout.rejillas.some((r) => r.panel === "solapa");
  const aro = layout.medidas.aroCm ?? 0;
  const cadena = layout.medidas.cadenaCm ?? 0;
  // El tramo que se deja abierto es tan parte del armado como las costuras: si
  // no se dice, se cose de más y la cartera termina sellada.
  const boca = layout.rejillas.find((r) => r.boca?.length)?.boca ?? [];

  return [
    {
      texto: cuadrada
        ? "Tejer cada pieza por separado, siguiendo su cuadrícula. Los dos laterales son rectángulos enteros: no se disminuye. Lo que angosta la boca es el pliegue, y ese se hace al armar."
        : "Tejer cada pieza por separado, siguiendo su cuadrícula.",
    },
    ...costurasDeLayout(layout).map((c: Costura) => ({
      texto: c.nota,
      union: `${medida(c.a, c.bordeA)} — con — ${medida(c.b, c.bordeB)}`,
    })),
    ...(boca.length
      ? [{
          texto: "Dejar sin coser todo el borde de arriba: esa es la boca, por donde abre la cartera.",
          union: `Boca — ${boca.length} cuentas del borde, de una punta de la tira a la otra`,
        }]
      : []),
    {
      texto: layout.forma === "corazon"
        ? "Reforzar la punta y los dos lóbulos pasando el hilo varias veces por las cuentas del borde."
        : layout.forma === "tulipan"
          ? "Reforzar los tres pétalos pasando el hilo varias veces por las cuentas del borde."
        : layout.forma === "fresa"
          ? "Reforzar la punta y la corona de hojas pasando el hilo varias veces por las cuentas del borde."
          : layout.forma === "circulo"
            ? "Reforzar todo el borde redondo pasando el hilo varias veces por las cuentas de contorno."
        : "Reforzar las esquinas pasando el hilo varias veces por las cuentas de borde.",
    },
    ...(cuadrada
      ? [
          {
            texto: `Pasar el borde de arriba de cada lateral por adentro de su aro de acero de ${aro} cm y coserlo sobre sí mismo. Eso es lo que junta frente y espalda y cierra la cartera.`,
            union: "La última fila de cada Lateral — por adentro de su aro",
          },
          {
            texto: `Enganchar la cadena de ${cadena} cm, una punta en cada aro.`,
          },
        ]
      : [
          {
            texto: silueta
              ? "Colocar el broche magnético en las dos puntas de la tira, que es donde se cierra la boca."
              : llevaSolapa
                ? "Colocar el cierre centrado, mitad en la solapa y mitad en el frente."
                : "Colocar el broche magnético centrado en el borde de arriba, mitad en el frente y mitad en la espalda.",
          },
          silueta
            ? {
                texto: "Tejer las dos asas aparte y coserlas con las argollas, una sobre cada cara.",
                union: "Las puntas de cada asa — a los dos extremos del borde superior de su propia cara",
              }
            : {
                texto: "Tejer el asa aparte y coserla con las argollas.",
                union: "Las dos puntas del Asa — a los costados del borde superior",
              },
        ]),
  ];
}
