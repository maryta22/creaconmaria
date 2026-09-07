/**
 * El catálogo de estampados: lo que se le puede poner encima a una cartera
 * llana. De acá sale la sección `/admin/estampados`.
 *
 * Un estampado **no sabe de carteras**. Solo contesta, para la celda (fila,
 * col) de una pared de `filas × cols`, qué tono le toca: `0` es el fondo y de
 * ahí para arriba son los colores que el estampado pida. Quién los pinta y
 * sobre qué modelo es problema de quien lo usa.
 *
 * Hay dos familias y se comportan distinto a propósito:
 *
 * - **Geométrico**: cubre la pared entera y se repite. Sale de una cuenta sobre
 *   (fila, col), así que se ve parejo en cualquier medida de cartera.
 * - **Figura**: un dibujo centrado, con fondo alrededor, como la orca. Se
 *   escribe como cuadrícula de texto —igual que en la ficha— porque **es un
 *   dibujo**: para corregirle una cuenta se cambia un caracter.
 */

import { FIGURAS } from "./figuras";

/** Qué tono le toca a una celda de la pared. 0 = fondo. */
export type Celda = (fila: number, col: number, filas: number, cols: number) => number;

export type Estampado = {
  slug: string;
  nombre: string;
  familia: "geometrico" | "figura";
  /** Cuántos tonos usa, **contando el fondo**. Entre 2 y 4. */
  tonos: number;
  celda: Celda;
};

/** Resto que no se va a negativo: los estampados se repiten hacia los dos lados. */
const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Un dibujo centrado en la pared, escrito como cuadrícula de texto.
 *
 * `#` es el tono 1, `o` el 2 y `+` el 3; `.` es el fondo. **La primera línea es
 * la de arriba**, como se ve y como se escribe en la ficha; acá se da vuelta,
 * porque la fila 0 de una pieza es la de abajo.
 */
/** Qué parte del ancho de la pared ocupa una figura. */
const CUANTO_OCUPA = 0.7;

function figura(dibujo: string[]): Celda {
  const alto = dibujo.length;
  const ancho = dibujo[0].length;
  const tono: Record<string, number> = { "#": 1, o: 2, "+": 3 };
  return (fila, col, filas, cols) => {
    /**
     * **La figura se agranda hasta llenar la pared.** Con cuenta de 4 mm una
     * pared de 18 cm tiene 45 columnas, y un dibujo de 13 ahí es una mancha
     * que no se distingue. Se agranda de a números enteros —cada cuenta del
     * dibujo pasa a ser un cuadrado de 2 × 2, de 3 × 3…— para que no se
     * deforme: agrandar un dibujo de cuentas con decimales le come filas.
     */
    const escala = Math.max(
      1,
      Math.floor(Math.min((cols * CUANTO_OCUPA) / ancho, (filas * CUANTO_OCUPA) / alto)),
    );
    const f = Math.floor((fila - Math.floor((filas - alto * escala) / 2)) / escala);
    const c = Math.floor((col - Math.floor((cols - ancho * escala) / 2)) / escala);
    if (f < 0 || f >= alto || c < 0 || c >= ancho) return 0;
    return tono[dibujo[alto - 1 - f][c]] ?? 0;
  };
}

/**
 * **Centra un estampado que se repite sobre la pared.**
 *
 * Un geométrico sale de `mod(fila, paso)` y `mod(col, paso)`, o sea que arranca
 * en la esquina (0, 0) y donde caiga el borde, cae. Con cruces cada 7 sobre una
 * pared de 23 quedaban cuatro cruces enteras contra un costado y media contra
 * el otro: el dibujo se veía corrido. Lo vio María en el 3D.
 *
 * En vez de anotarle el paso a mano a los cincuenta y tres, se **busca** el
 * corrimiento que deja la pared más simétrica: se prueba correr el estampado
 * dentro de su propio período y se elige el que hace que la columna `j` se
 * parezca más a la `cols − 1 − j` (y lo mismo con las filas). Sale solo, vale
 * para cualquier estampado nuevo y no hay un número que se pueda olvidar.
 *
 * Se calcula una vez por medida de pared y queda guardado: la pantalla dibuja
 * cien miniaturas y no puede recalcularlo en cada una.
 */
const PERIODO_MAXIMO = 16;

function periodoDe(celda: Celda, filas: number, cols: number, enFilas: boolean) {
  for (let p = 1; p <= PERIODO_MAXIMO; p++) {
    let repite = true;
    for (let f = 0; f < filas && repite; f++) {
      for (let c = 0; c < cols && repite; c++) {
        const otro = enFilas ? celda(f + p, c, filas, cols) : celda(f, c + p, filas, cols);
        if (celda(f, c, filas, cols) !== otro) repite = false;
      }
    }
    if (repite) return p;
  }
  return 1;
}

/** Cuánto se parece la pared a su espejo, con este corrimiento. */
function simetria(celda: Celda, filas: number, cols: number, df: number, dc: number) {
  let iguales = 0;
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const aqui = celda(f + df, c + dc, filas, cols);
      if (aqui === celda(f + df, cols - 1 - c + dc, filas, cols)) iguales += 1;
      if (aqui === celda(filas - 1 - f + df, c + dc, filas, cols)) iguales += 1;
    }
  }
  return iguales;
}

function centrado(celda: Celda): Celda {
  const visto = new Map<string, [number, number]>();
  return (fila, col, filas, cols) => {
    const clave = `${filas}x${cols}`;
    let corrimiento = visto.get(clave);
    if (!corrimiento) {
      const pasoF = periodoDe(celda, filas, cols, true);
      const pasoC = periodoDe(celda, filas, cols, false);
      let mejor = -1;
      corrimiento = [0, 0];
      for (let df = 0; df < pasoF; df++) {
        for (let dc = 0; dc < pasoC; dc++) {
          const puntaje = simetria(celda, filas, cols, df, dc);
          if (puntaje > mejor) {
            mejor = puntaje;
            corrimiento = [df, dc];
          }
        }
      }
      visto.set(clave, corrimiento);
    }
    return celda(fila + corrimiento[0], col + corrimiento[1], filas, cols);
  };
}

// ─────────────────────────── Geométricos ───────────────────────────
// Todos salen de una cuenta sobre (fila, col): no dependen del tamaño de la
// pared, así que la misma raya se ve igual en la cartera chica y en la grande.

const rayasH = (alto: number, hueco: number): Celda => (f) =>
  mod(f, alto + hueco) < alto ? 1 : 0;

const rayasV = (ancho: number, hueco: number): Celda => (_f, c) =>
  mod(c, ancho + hueco) < ancho ? 1 : 0;

const diagonales = (ancho: number, hueco: number, vuelta = 1): Celda => (f, c) =>
  mod(c + vuelta * f, ancho + hueco) < ancho ? 1 : 0;

const damero = (lado: number): Celda => (f, c) =>
  (Math.floor(f / lado) + Math.floor(c / lado)) % 2 === 0 ? 1 : 0;

const lunares = (paso: number, radio: number, trabado = true): Celda => (f, c) => {
  const fila = Math.floor(f / paso);
  const corrido = trabado && fila % 2 === 1 ? Math.floor(paso / 2) : 0;
  const df = mod(f, paso) - (paso - 1) / 2;
  const dc = mod(c - corrido, paso) - (paso - 1) / 2;
  return Math.hypot(df, dc) <= radio ? 1 : 0;
};

const rombos = (ancho: number, alto: number, relleno: boolean): Celda => (f, c) => {
  const df = Math.abs(mod(f, alto) - (alto - 1) / 2) / ((alto - 1) / 2 || 1);
  const dc = Math.abs(mod(c, ancho) - (ancho - 1) / 2) / ((ancho - 1) / 2 || 1);
  const d = df + dc;
  if (relleno) return d <= 1 ? 1 : 0;
  return d <= 1 && d > 0.55 ? 1 : 0;
};

const zigzag = (paso: number, grosor: number): Celda => (f, c) => {
  const sube = mod(c, paso * 2);
  const y = sube < paso ? sube : paso * 2 - sube;
  return mod(f - y, paso + grosor) < grosor ? 1 : 0;
};

/** Espiga: columnas de diagonales que alternan el sentido, como el parquet. */
const espiga = (largo: number): Celda => (f, c) => {
  const banda = Math.floor(c / largo);
  const dentro = mod(c, largo);
  const desliz = banda % 2 === 0 ? dentro : largo - 1 - dentro;
  return mod(f + desliz, 4) < 2 ? 1 : 0;
};

/**
 * Escamas: arcos encimados, como las de un pez. Cada escama es un círculo con
 * centro en una grilla trabada, y se dibuja **solo el borde**: relleno tapa la
 * de abajo y se pierde el encimado, que es lo que hace la escama.
 */
const escamas = (radio: number): Celda => (f, c) => {
  const fila = Math.floor(f / radio);
  const corrido = fila % 2 === 1 ? radio : 0;
  const cx = Math.round((c - corrido) / (radio * 2)) * radio * 2 + corrido;
  const d = Math.hypot(c - cx, mod(f, radio));
  return Math.abs(d - radio) < 0.75 ? 1 : 0;
};

const olas = (paso: number, alto: number, grosor: number): Celda => (f, c) => {
  const y = Math.round((alto / 2) * Math.sin((2 * Math.PI * c) / paso));
  return mod(f - y, alto + grosor + 2) < grosor ? 1 : 0;
};

const ladrillos = (ancho: number, alto: number): Celda => (f, c) => {
  const fila = Math.floor(f / alto);
  const corrido = fila % 2 === 1 ? Math.floor(ancho / 2) : 0;
  return mod(f, alto) === alto - 1 || mod(c - corrido, ancho) === 0 ? 1 : 0;
};

const cuadros = (paso: number, grosor: number): Celda => (f, c) =>
  mod(f, paso) < grosor || mod(c, paso) < grosor ? 1 : 0;

/** Escocés: la trama fina cruzada con una banda más ancha en dos tonos. */
const escoces = (paso: number): Celda => (f, c) => {
  const anchoF = mod(f, paso) < 2;
  const anchoC = mod(c, paso) < 2;
  if (anchoF && anchoC) return 2;
  if (anchoF || anchoC) return 1;
  return mod(f, paso) === Math.floor(paso / 2) || mod(c, paso) === Math.floor(paso / 2) ? 2 : 0;
};

/** Triángulos que apuntan para arriba, trabados fila por medio y sin tocarse. */
const triangulos = (base: number): Celda => (f, c) => {
  const banda = Math.floor(f / base);
  const y = mod(f, base);
  const x = mod(c + (banda % 2 === 1 ? Math.floor(base / 2) : 0), base);
  return Math.abs(x - (base - 1) / 2) * 2 <= base - 2 - y ? 1 : 0;
};

const greca = (paso: number): Celda => (f, c) => {
  const x = mod(c, paso);
  const y = mod(f, paso);
  if (y === 0 || y === paso - 1) return 1;
  if (x === 0) return 1;
  if (y === 2 && x >= 2 && x <= paso - 3) return 1;
  if (x === paso - 3 && y >= 2 && y <= paso - 3) return 1;
  return 0;
};

/** Flechas apuntando para arriba, en filas trabadas. */
const flechas = (paso: number): Celda => (f, c) => {
  const fila = Math.floor(f / paso);
  const corrido = fila % 2 === 1 ? Math.floor(paso / 2) : 0;
  const x = mod(c - corrido, paso) - Math.floor(paso / 2);
  const y = mod(f, paso);
  return Math.abs(x) === y && y < paso - 1 ? 1 : 0;
};

const cruces = (paso: number): Celda => (f, c) => {
  const x = mod(c, paso) - Math.floor(paso / 2);
  const y = mod(f, paso) - Math.floor(paso / 2);
  return (x === 0 && Math.abs(y) <= 1) || (y === 0 && Math.abs(x) <= 1) ? 1 : 0;
};

const semilla = (paso: number): Celda => (f, c) =>
  mod(f, paso) === 0 &&
  mod(c + (Math.floor(f / paso) % 2) * Math.floor(paso / 2), paso) === 0
    ? 1
    : 0;

const bandas = (anchos: number[]): Celda => {
  const total = anchos.reduce((a, b) => a + b, 0);
  return (f) => {
    let n = mod(f, total);
    for (let i = 0; i < anchos.length; i++) {
      if (n < anchos[i]) return i % 2 === 0 ? 0 : 1;
      n -= anchos[i];
    }
    return 0;
  };
};

const GEOMETRICOS: Estampado[] = [
  { slug: "rayas-finas-h", nombre: "Rayas finas horizontales", tonos: 2, celda: rayasH(1, 1) },
  { slug: "rayas-h", nombre: "Rayas horizontales", tonos: 2, celda: rayasH(2, 2) },
  { slug: "rayas-anchas-h", nombre: "Rayas anchas horizontales", tonos: 2, celda: rayasH(4, 4) },
  { slug: "rayas-marinera", nombre: "Marinera", tonos: 2, celda: rayasH(2, 4) },
  { slug: "rayas-finas-v", nombre: "Rayas finas verticales", tonos: 2, celda: rayasV(1, 1) },
  { slug: "rayas-v", nombre: "Rayas verticales", tonos: 2, celda: rayasV(2, 2) },
  { slug: "rayas-anchas-v", nombre: "Rayas anchas verticales", tonos: 2, celda: rayasV(4, 4) },
  { slug: "rayas-bengala", nombre: "Bengala", tonos: 2, celda: rayasV(1, 3) },
  { slug: "diagonal-fina", nombre: "Diagonal fina", tonos: 2, celda: diagonales(1, 2) },
  { slug: "diagonal", nombre: "Diagonal", tonos: 2, celda: diagonales(2, 3) },
  { slug: "diagonal-ancha", nombre: "Diagonal ancha", tonos: 2, celda: diagonales(3, 4) },
  { slug: "diagonal-invertida", nombre: "Diagonal al revés", tonos: 2, celda: diagonales(2, 3, -1) },
  { slug: "diagonal-tendida", nombre: "Diagonal tendida", tonos: 2, celda: diagonales(2, 4, 2) },
  { slug: "damero-1", nombre: "Damero menudo", tonos: 2, celda: damero(1) },
  { slug: "damero-2", nombre: "Damero", tonos: 2, celda: damero(2) },
  { slug: "damero-3", nombre: "Damero grande", tonos: 2, celda: damero(3) },
  { slug: "damero-4", nombre: "Tablero", tonos: 2, celda: damero(4) },
  { slug: "lunares-chicos", nombre: "Lunares chicos", tonos: 2, celda: lunares(4, 0.8) },
  { slug: "lunares", nombre: "Lunares", tonos: 2, celda: lunares(5, 1.2) },
  { slug: "lunares-grandes", nombre: "Lunares grandes", tonos: 2, celda: lunares(7, 2.1) },
  { slug: "lunares-alineados", nombre: "Lunares alineados", tonos: 2, celda: lunares(5, 1.2, false) },
  { slug: "rombos", nombre: "Rombos", tonos: 2, celda: rombos(6, 6, true) },
  { slug: "rombos-chicos", nombre: "Rombos chicos", tonos: 2, celda: rombos(4, 4, true) },
  { slug: "rombos-huecos", nombre: "Rombos huecos", tonos: 2, celda: rombos(6, 6, false) },
  { slug: "rombos-altos", nombre: "Rombos altos", tonos: 2, celda: rombos(5, 8, false) },
  { slug: "zigzag-fino", nombre: "Zigzag fino", tonos: 2, celda: zigzag(3, 1) },
  { slug: "zigzag", nombre: "Zigzag", tonos: 2, celda: zigzag(4, 2) },
  { slug: "zigzag-ancho", nombre: "Zigzag ancho", tonos: 2, celda: zigzag(6, 3) },
  { slug: "espiga", nombre: "Espiga", tonos: 2, celda: espiga(4) },
  { slug: "espiga-larga", nombre: "Espiga larga", tonos: 2, celda: espiga(6) },
  { slug: "escamas", nombre: "Escamas", tonos: 2, celda: escamas(3) },
  { slug: "escamas-grandes", nombre: "Escamas grandes", tonos: 2, celda: escamas(5) },
  { slug: "olas", nombre: "Olas", tonos: 2, celda: olas(8, 4, 2) },
  { slug: "olas-menudas", nombre: "Olas menudas", tonos: 2, celda: olas(5, 2, 1) },
  { slug: "olas-largas", nombre: "Olas largas", tonos: 2, celda: olas(12, 6, 2) },
  { slug: "ladrillos", nombre: "Ladrillos", tonos: 2, celda: ladrillos(6, 3) },
  { slug: "ladrillos-chicos", nombre: "Ladrillos chicos", tonos: 2, celda: ladrillos(4, 2) },
  { slug: "cuadros", nombre: "Cuadros", tonos: 2, celda: cuadros(5, 1) },
  { slug: "cuadros-anchos", nombre: "Cuadros anchos", tonos: 2, celda: cuadros(8, 2) },
  { slug: "cuadros-menudos", nombre: "Cuadros menudos", tonos: 2, celda: cuadros(3, 1) },
  { slug: "escoces", nombre: "Escocés", tonos: 3, celda: escoces(6) },
  { slug: "escoces-grande", nombre: "Escocés grande", tonos: 3, celda: escoces(9) },
  { slug: "triangulos", nombre: "Triángulos", tonos: 2, celda: triangulos(5) },
  { slug: "triangulos-grandes", nombre: "Triángulos grandes", tonos: 2, celda: triangulos(8) },
  { slug: "greca", nombre: "Greca", tonos: 2, celda: greca(6) },
  { slug: "greca-grande", nombre: "Greca grande", tonos: 2, celda: greca(8) },
  { slug: "flechas", nombre: "Flechas", tonos: 2, celda: flechas(5) },
  { slug: "flechas-grandes", nombre: "Flechas grandes", tonos: 2, celda: flechas(7) },
  { slug: "cruces", nombre: "Cruces", tonos: 2, celda: cruces(5) },
  { slug: "cruces-ralas", nombre: "Cruces ralas", tonos: 2, celda: cruces(7) },
  { slug: "semilla", nombre: "Semilla", tonos: 2, celda: semilla(3) },
  { slug: "semilla-rala", nombre: "Semilla rala", tonos: 2, celda: semilla(5) },
  { slug: "bandas-desparejas", nombre: "Bandas desparejas", tonos: 2, celda: bandas([1, 1, 3, 2, 1, 4]) },
].map((e) => ({ ...e, familia: "geometrico" as const, celda: centrado(e.celda) }));

const CONVERTIDAS: Estampado[] = FIGURAS.map((f) => ({
  slug: f.slug,
  nombre: f.nombre,
  familia: "figura" as const,
  tonos: f.tonos,
  celda: figura(f.dibujo),
}));

export const ESTAMPADOS: Estampado[] = [...GEOMETRICOS, ...CONVERTIDAS];

export function estampadoPorSlug(slug: string) {
  return ESTAMPADOS.find((e) => e.slug === slug);
}

export { figura };
