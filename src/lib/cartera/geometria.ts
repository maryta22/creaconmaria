/**
 * De las medidas de una cartera a la lista de cuentas en el espacio.
 *
 * La cartera se teje en seis piezas planas (base, frente, espalda, dos
 * laterales y solapa) más el asa tubular, así que acá se arma exactamente eso:
 * cada panel es una grilla de cuentas y la solapa se dobla sobre el borde
 * superior trasero siguiendo un recorrido con esquina redondeada.
 *
 * Unidad de mundo = 1 cm.
 */

export type Panel = "base" | "frente" | "espalda" | "lateralIzq" | "lateralDer" | "solapa" | "asa";

/** Las seis piezas tejidas, en el orden en que se arman. El asa va aparte. */
export const PANELES: Panel[] = [
  "base",
  "frente",
  "espalda",
  "lateralIzq",
  "lateralDer",
  "solapa",
  "asa",
];

export const NOMBRE_PANEL: Record<Panel, string> = {
  base: "Base",
  frente: "Frente",
  espalda: "Espalda",
  lateralIzq: "Lateral izquierdo",
  lateralDer: "Lateral derecho",
  solapa: "Solapa",
  asa: "Asa",
};

export type MedidasCartera = {
  anchoCm: number;
  altoCm: number;
  profundidadCm: number;
  /** Cuánto baja la solapa por el frente. */
  altoSolapaCm: number;
  /** Largo total del asa tejida. 0 = sin asa. */
  asaCm: number;
  /** Diámetro de la cuenta principal. Define el paso de la grilla. */
  cuentaMm: number;
  /**
   * En tejido en cruz las cuentas no quedan pegadas: el paso entre centros es
   * mayor que el diámetro. 1.3 es lo que hace que el conteo dé parecido al de
   * los pliegos de patrón.
   */
  separacion: number;
};

export type Cuenta = {
  /** Índice en el array; es también el instanceId en el render. */
  i: number;
  panel: Panel;
  fila: number;
  col: number;
  /** Centro de la cuenta, en cm. */
  pos: [number, number, number];
};

export type Rejilla = {
  panel: Panel;
  filas: number;
  cols: number;
  /** Índice de la primera cuenta del panel dentro de `cuentas`. */
  desde: number;
};

export type LayoutCartera = {
  medidas: MedidasCartera;
  /** Paso entre centros de cuenta, en cm. */
  paso: number;
  cuentas: Cuenta[];
  rejillas: Rejilla[];
  /** Alto total con la solapa puesta, para encuadrar la cámara. */
  altoTotal: number;
};

const redondearMin1 = (v: number) => Math.max(1, Math.round(v));

/**
 * Recorrido de la solapa en el plano y-z: sale del borde superior trasero,
 * cruza el techo, dobla en una esquina redondeada y baja por el frente.
 */
function recorridoSolapa(m: MedidasCartera, paso: number) {
  const yTecho = m.altoCm + paso / 2;
  const zFrente = m.profundidadCm / 2 + paso / 2;
  const radio = paso;
  const zCentro = zFrente - radio;
  const yCentro = yTecho - radio;

  const largoTecho = zCentro - -m.profundidadCm / 2;
  const largoCurva = (Math.PI * radio) / 2;

  return (s: number): { y: number; z: number } => {
    if (s <= largoTecho) {
      return { y: yTecho, z: -m.profundidadCm / 2 + s };
    }
    if (s <= largoTecho + largoCurva) {
      const angulo = (s - largoTecho) / radio; // 0 = arriba, π/2 = al frente
      return {
        y: yCentro + radio * Math.cos(angulo),
        z: zCentro + radio * Math.sin(angulo),
      };
    }
    return { y: yCentro - (s - largoTecho - largoCurva), z: zFrente };
  };
}

/**
 * Recorrido del asa: un arco que nace de las argollas, hacia adentro de las
 * esquinas superiores, y sube. La altura del arco sale de que el recorrido
 * tiene que medir `asaCm`, que es lo que dice la ficha.
 */
function recorridoAsa(m: MedidasCartera, paso: number) {
  // Las argollas van hacia adentro de las esquinas, como en las fotos.
  const a = m.anchoCm * 0.28;
  // Largo de arco de media elipse ≈ π/2 · √(2(a²+b²)) → despejamos b.
  const objetivo = Math.max(m.asaCm, Math.PI * a * 0.55);
  const b = Math.max(paso, Math.sqrt(Math.max(0.01, 2 * (objetivo / (Math.PI / 2)) ** 2 - 2 * a * a) / 2));
  // Nace justo encima de la solapa, que es la que apoya sobre las paredes.
  const yAnclaje = m.altoCm + paso / 2;

  return (t: number): { x: number; y: number; z: number } => {
    const angulo = Math.PI * t; // 0 → 1 recorre de una argolla a la otra
    return {
      x: -a * Math.cos(angulo),
      y: yAnclaje + b * Math.sin(angulo),
      z: 0,
    };
  };
}

/** Arma la lista completa de cuentas a partir de las medidas. */
export function armarLayout(medidas: MedidasCartera): LayoutCartera {
  const paso = (medidas.cuentaMm / 10) * medidas.separacion;
  const { anchoCm: W, altoCm: H, profundidadCm: D } = medidas;

  const cols = redondearMin1(W / paso);
  const filasCuerpo = redondearMin1(H / paso);
  const filasBase = redondearMin1(D / paso);

  const cuentas: Cuenta[] = [];
  const rejillas: Rejilla[] = [];

  const agregar = (panel: Panel, filas: number, ancho: number, ubicar: (f: number, c: number) => [number, number, number]) => {
    rejillas.push({ panel, filas, cols: ancho, desde: cuentas.length });
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < ancho; c++) {
        cuentas.push({ i: cuentas.length, panel, fila: f, col: c, pos: ubicar(f, c) });
      }
    }
  };

  /** Centro de la columna `c` sobre el ancho de la cartera. */
  const ejeX = (c: number) => (c + 0.5) * paso - (cols * paso) / 2;
  /** Centro de la fila `f` sobre la profundidad. */
  const ejeZ = (f: number) => (f + 0.5) * paso - (filasBase * paso) / 2;
  const mitadD = (filasBase * paso) / 2;
  const mitadW = (cols * paso) / 2;

  // 1. Base: la pieza rectangular sobre la que se levanta todo.
  agregar("base", filasBase, cols, (f, c) => [ejeX(c), 0, ejeZ(f)]);

  // 2 y 3. Frente y espalda: paredes largas.
  agregar("frente", filasCuerpo, cols, (f, c) => [ejeX(c), (f + 0.5) * paso, mitadD]);
  agregar("espalda", filasCuerpo, cols, (f, c) => [ejeX(c), (f + 0.5) * paso, -mitadD]);

  // 4. Laterales: cierran el volumen entre frente y espalda.
  agregar("lateralIzq", filasCuerpo, filasBase, (f, c) => [-mitadW, (f + 0.5) * paso, ejeZ(c)]);
  agregar("lateralDer", filasCuerpo, filasBase, (f, c) => [mitadW, (f + 0.5) * paso, ejeZ(c)]);

  // 5. Solapa: cruza el techo y baja por el frente.
  const largoSolapa = D + medidas.altoSolapaCm;
  const filasSolapa = redondearMin1(largoSolapa / paso);
  const puntoSolapa = recorridoSolapa(medidas, paso);
  agregar("solapa", filasSolapa, cols, (f, c) => {
    const { y, z } = puntoSolapa((f + 0.5) * paso);
    return [ejeX(c), y, z];
  });

  // 6. Asa tubular: un tubo de 4 cuentas de vuelta siguiendo el arco. Acá las
  // vueltas van pegadas (no al paso de la grilla) para que el asa se vea
  // maciza y no como una cadena de cuentas sueltas.
  if (medidas.asaCm > 0) {
    const puntoAsa = recorridoAsa(medidas, paso);
    const diametro = medidas.cuentaMm / 10;
    const pasosAsa = redondearMin1(medidas.asaCm / (diametro * 0.85));
    const porVuelta = 4;
    const radioTubo = diametro * 0.5;
    agregar("asa", pasosAsa, porVuelta, (f, c) => {
      const t = (f + 0.5) / pasosAsa;
      const centro = puntoAsa(t);
      // Tangente aproximada para orientar el anillo de cuentas.
      const siguiente = puntoAsa(Math.min(1, t + 0.01));
      const dx = siguiente.x - centro.x;
      const dy = siguiente.y - centro.y;
      const largo = Math.hypot(dx, dy) || 1;
      // Normal dentro del plano x-y, perpendicular a la tangente.
      const nx = -dy / largo;
      const ny = dx / largo;
      const angulo = (c / porVuelta) * Math.PI * 2;
      return [
        centro.x + nx * radioTubo * Math.cos(angulo),
        centro.y + ny * radioTubo * Math.cos(angulo),
        centro.z + radioTubo * Math.sin(angulo),
      ];
    });
  }

  const altoTotal = cuentas.reduce((max, c) => Math.max(max, c.pos[1]), 0);

  return { medidas, paso, cuentas, rejillas, altoTotal };
}

/**
 * Un tramo de hilo entre dos cuentas vecinas. Guarda las cuentas enteras, no
 * solo su posición, porque el índice de cada una dice en qué momento del
 * tejido aparece — que es lo que usa la reproducción paso a paso.
 */
export type Hilo = { a: Cuenta; b: Cuenta };

/**
 * Un borde de una pieza, nombrado como se ve en la cuadrícula del mapa: la
 * fila 1 se dibuja abajo y la columna 1 a la izquierda.
 */
export type Borde = "primeraFila" | "ultimaFila" | "primeraColumna" | "ultimaColumna";

export type Costura = {
  a: Panel;
  bordeA: Borde;
  b: Panel;
  bordeB: Borde;
  /** Qué se está cerrando, en criollo. */
  nota: string;
};

/**
 * Qué borde va cosido con qué borde. **Esta lista es la única fuente**: de acá
 * salen los hilos de unión del 3D y las marcas del mapa de tejido, así que no
 * pueden decir cosas distintas.
 *
 * Los dos bordes de cada costura se recorren en el mismo sentido, cuenta contra
 * cuenta.
 */
export const COSTURAS: Costura[] = [
  {
    a: "base", bordeA: "ultimaFila",
    b: "frente", bordeB: "primeraFila",
    nota: "Levanta el frente desde el borde delantero de la base.",
  },
  {
    a: "base", bordeA: "primeraFila",
    b: "espalda", bordeB: "primeraFila",
    nota: "Levanta la espalda desde el borde opuesto.",
  },
  {
    a: "base", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "primeraFila",
    nota: "Levanta el lateral izquierdo desde el borde corto de la base.",
  },
  {
    a: "base", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "primeraFila",
    nota: "Levanta el lateral derecho desde el otro borde corto.",
  },
  {
    a: "frente", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "ultimaColumna",
    nota: "Cierra la esquina delantera izquierda.",
  },
  {
    a: "frente", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "ultimaColumna",
    nota: "Cierra la esquina delantera derecha.",
  },
  {
    a: "espalda", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "primeraColumna",
    nota: "Cierra la esquina trasera izquierda.",
  },
  {
    a: "espalda", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "primeraColumna",
    nota: "Cierra la esquina trasera derecha.",
  },
  {
    a: "espalda", bordeA: "ultimaFila",
    b: "solapa", bordeB: "primeraFila",
    nota: "La bisagra: la solapa nace del borde superior de la espalda.",
  },
];

/** Las cuentas de un borde, en orden. Los dos lados de una costura calzan. */
export function cuentasDelBorde(layout: LayoutCartera, panel: Panel, borde: Borde) {
  const r = layout.rejillas.find((x) => x.panel === panel);
  if (!r) return [];
  const en = (f: number, c: number) => layout.cuentas[r.desde + f * r.cols + c];
  const filas = Array.from({ length: r.filas }, (_, f) => f);
  const cols = Array.from({ length: r.cols }, (_, c) => c);

  switch (borde) {
    case "primeraFila":
      return cols.map((c) => en(0, c));
    case "ultimaFila":
      return cols.map((c) => en(r.filas - 1, c));
    case "primeraColumna":
      return filas.map((f) => en(f, 0));
    case "ultimaColumna":
      return filas.map((f) => en(f, r.cols - 1));
  }
}

/**
 * El recorrido del hilo. En tejido en cruz cada cuenta se asegura pasando el
 * hilo por las de los costados, así que el hilo une cada cuenta con la de su
 * derecha y con la de abajo: dentro de la cuenta va escondido y solo asoma en
 * el hueco que queda entre una y otra.
 *
 * En el asa, que es un tubo, además se cierra el anillo de cada vuelta.
 */
export function armarHilos(layout: LayoutCartera): Hilo[] {
  const hilos: Hilo[] = [];
  const porPanel = new Map(layout.rejillas.map((r) => [r.panel, r]));

  const unir = (a: Cuenta, b: Cuenta) => hilos.push({ a, b });

  // --- Tejido de cada pieza ---
  for (const rejilla of layout.rejillas) tejerPieza(layout, rejilla, unir);

  // --- Costuras: lo que en el pliego es "unir las piezas" ---
  for (const costura of COSTURAS) {
    const ladoA = cuentasDelBorde(layout, costura.a, costura.bordeA);
    const ladoB = cuentasDelBorde(layout, costura.b, costura.bordeB);
    const pares = Math.min(ladoA.length, ladoB.length);
    for (let i = 0; i < pares; i++) unir(ladoA[i], ladoB[i]);
  }

  // Las argollas del asa no son una costura borde con borde: cada punta se ata
  // a la cuenta del cuerpo que le queda más cerca.
  const asa = porPanel.get("asa");
  if (asa) {
    const delCuerpo = layout.cuentas.filter((c) => c.panel !== "asa");
    for (const fila of [0, asa.filas - 1]) {
      for (let c = 0; c < asa.cols; c++) {
        const punta = layout.cuentas[asa.desde + fila * asa.cols + c];
        unir(punta, masCercana(punta.pos, delCuerpo));
      }
    }
  }

  return hilos;
}

/** El tejido de una sola pieza: cada cuenta con la de su derecha y la de abajo. */
function tejerPieza(
  layout: LayoutCartera,
  rejilla: Rejilla,
  unir: (a: Cuenta, b: Cuenta) => void,
) {
  const { desde, filas, cols, panel } = rejilla;
  const aqui = (f: number, c: number) => layout.cuentas[desde + f * cols + c];
  // El asa es tubular: la última cuenta de cada vuelta cierra con la primera.
  const cierraVuelta = panel === "asa" && cols > 2;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) unir(aqui(f, c), aqui(f, c + 1));
      else if (cierraVuelta) unir(aqui(f, c), aqui(f, 0));
      if (f + 1 < filas) unir(aqui(f, c), aqui(f + 1, c));
    }
  }
}

/** La cuenta del grupo que queda más cerca de un punto. */
function masCercana(punto: Cuenta["pos"], entre: Cuenta[]) {
  let elegida = entre[0];
  let menor = Infinity;
  for (const candidata of entre) {
    const d =
      (candidata.pos[0] - punto[0]) ** 2 +
      (candidata.pos[1] - punto[1]) ** 2 +
      (candidata.pos[2] - punto[2]) ** 2;
    if (d < menor) {
      menor = d;
      elegida = candidata;
    }
  }
  return elegida;
}

/**
 * En qué momento del tejido aparece un tramo: cuando ya están puestas sus dos
 * cuentas. Sirve para reproducir el armado sin recalcular nada por cuadro.
 */
export function apareceEn(hilo: Hilo) {
  return Math.max(hilo.a.i, hilo.b.i);
}

/** Qué se está tejiendo cuando ya se pusieron `cuantas` cuentas. */
export function loQueSeTeje(layout: LayoutCartera, cuantas: number) {
  const i = Math.min(Math.max(Math.floor(cuantas), 0), layout.cuentas.length - 1);
  const cuenta = layout.cuentas[i];
  const rejilla = layout.rejillas.find((r) => r.panel === cuenta.panel);
  return {
    panel: cuenta.panel,
    nombre: NOMBRE_PANEL[cuenta.panel],
    fila: cuenta.fila + 1,
    filas: rejilla?.filas ?? 0,
    col: cuenta.col + 1,
    cols: rejilla?.cols ?? 0,
  };
}

/** Cuántas cuentas lleva cada panel. Para la lista de materiales del panel. */
export function conteoPorPanel(layout: LayoutCartera) {
  return layout.rejillas.map((r) => ({
    panel: r.panel,
    nombre: NOMBRE_PANEL[r.panel],
    filas: r.filas,
    cols: r.cols,
    total: r.filas * r.cols,
  }));
}
