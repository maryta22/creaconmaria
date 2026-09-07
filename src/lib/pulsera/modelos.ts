/**
 * Modelos de pulsera que salen de las fichas de `pulseras diseños/modelos/`.
 *
 * A diferencia de una pulsera de una sola tira, cada modelo guarda una matriz
 * completa de cuentas: filas, uniones y motivo. Esa matriz alimenta tanto la
 * tarjeta del catalogo como el visor 3D y el diseno que se guarda.
 */
import { comprimir, descomprimir } from "@/lib/celdas";
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { paletaBase } from "@/lib/cuentas-base";
import { CIERRE_CM, esMetal, type MetalCierre } from "./cierre";
import { armarTrama, type LayoutPulsera } from "./geometria";
import { armarRaw, medidasRaw, tonosRaw } from "./raw";
import {
  anilloDeFlor,
  armarFlores,
  floresParaLargo,
  tonosDeFlores,
  ACENTO,
  RONDELA,
  type Flor,
} from "./flores";

export type MatrizPulsera = number[][];

/**
 * **Cómo se construye la pieza**, que no es lo mismo que cómo se ve.
 *
 * - `trama` — una banda tejida sobre una cuadrícula. Todas las cuentas miden lo
 *   mismo: el paso de la grilla es el diámetro de la cuenta, así que una más
 *   grande se metería adentro de sus vecinas.
 * - `flores` — una cadena de flores ensartadas en un hilo. Acá **sí** se
 *   mezclan tamaños, porque no hay grilla: cada cuenta se acomoda a
 *   continuación de la anterior por su propio diámetro. Cuántos pétalos lleva
 *   cada flor no se elige: lo cuenta la geometría a partir del tamaño del
 *   centro y del pétalo.
 *
 * Cada una tiene su geometría y las dos devuelven lo mismo; ver
 * [`geometria.ts`](./geometria.ts).
 */
export type ArmadoPulsera = "trama" | "flores" | "raw";

export type ModeloPulsera = {
  /** Conserva los codigos de las primeras fichas para que los enlaces viejos sigan sirviendo. */
  id: string;
  slug: string;
  nombre: string;
  tecnica: string;
  construccion: string;
  ficha: string;
  descripcion: string;
  largoBaseCm: number;
  anchoCm: number;
  manoDeObra: number;
  armado: ArmadoPulsera;
  /**
   * **El diámetro que le toca a cada papel de la paleta, y cuántos papeles
   * tiene el modelo.** Van solo los que el modelo usa de verdad: una tira lisa
   * tiene uno solo. Rellenar hasta cuatro con "Sin uso" le pedía a la clienta
   * elegir un color para una cuenta que no existe en la pieza —salía
   * *"Sin uso · 0 cuentas"* en la pantalla— y bloqueaba el pedido hasta
   * elegirlo.
   *
   * No es opcional: de acá sale la paleta base con la que se muestra el modelo,
   * y es la medida que la clienta tiene que respetar al elegir su cuenta del
   * stock.
   *
   * La margarita lo necesita además para cerrar: el anillo se arma con pétalos
   * del mismo diámetro y el cristal del tramo de unión es más gordo a propósito.
   * Con un pétalo de 8 mm la flor no cerraría.
   */
  medidas: number[];
  /** El video de la técnica, para las indicaciones de María. */
  video?: string;
  /** Cómo es la flor, cuando el armado es `flores`. Ver `flores.ts`. */
  flor?: Flor;
  paleta: CuentaPaleta[];
  nombresColor: string[];
  matriz: MatrizPulsera;
};

/**
 * **Un modelo por tejido, y sin color propio.** Eran cinco tejidos por seis
 * colecciones: treinta tarjetas para cinco piezas distintas. Lo dijo Maria:
 * *"solo quiero 1 de cada modelo, porque si quiere otros colores solo tiene
 * que editarla"*. El color no es un modelo aparte — es lo primero que se cambia
 * en la pantalla de al lado.
 *
 * Por eso una tecnica **no declara paleta**: declara los diametros de cada
 * papel y se muestra con la escala de grises de `src/lib/cuentas-base.ts`. El
 * color entra recien cuando alguien elige cuentas del stock.
 */
type Tecnica = Omit<ModeloPulsera, "id" | "slug" | "nombre" | "ficha" | "paleta"> & {
  archivo: string;
};

function lienzo(filas: number, columnas: number, fondo = 0): MatrizPulsera {
  return Array.from({ length: filas }, () => new Array<number>(columnas).fill(fondo));
}

function pintar(matriz: MatrizPulsera, fila: number, columna: number, color: number) {
  if (fila < 0 || columna < 0 || fila >= matriz.length || columna >= matriz[0].length) return;
  matriz[fila][columna] = color;
}

/**
 * Las tiras simples, las flores y las bandas con motivo comparten cat?logo.
 * En las matrices, -1 deja un hueco y cada entero identifica un papel de la
 * paleta. Los dise?os nuevos se agregan al final para conservar los IDs.
 */

/** El lienzo vacio con su tira del medio: el punto de partida de todos. */
function tira(columnas: number, filas = 5) {
  const matriz = lienzo(filas, columnas, -1);
  const medio = (filas - 1) / 2;
  for (let columna = 0; columna < columnas; columna += 1) pintar(matriz, medio, columna, 0);
  return matriz;
}

/** Donde caen los motivos a lo largo de la vuelta. */
function repartir(columnas: number, cuantos: number) {
  return Array.from({ length: cuantos }, (_, i) => Math.round((columnas * i) / cuantos));
}

// -- Solo perlas ----------------------------------------------------

/** La tira sola, de un color. */
function lisa() {
  return tira(48, 3);
}

/** Perlas alternadas de dos colores. */
function alternada() {
  const m = tira(48, 3);
  for (let c = 1; c < 48; c += 2) pintar(m, 1, c, 1);
  return m;
}

/** De a tres: tres de un color y tres del otro. */
function tresillo() {
  const m = tira(48, 3);
  for (let c = 0; c < 48; c += 1) if (Math.floor(c / 3) % 2 === 1) pintar(m, 1, c, 1);
  return m;
}

/** Una cuenta de contraste cada seis, como separador. */
function separadores() {
  const m = tira(48, 3);
  repartir(48, 8).forEach((c) => pintar(m, 1, c, 1));
  return m;
}

// -- Un motivo ------------------------------------------------------

const TECNICAS: Tecnica[] = [
  {
    archivo: "perla-lisa",
    armado: "trama",
    tecnica: "Perla lisa",
    construccion: "Hilo simple",
    descripcion: "Una sola vuelta de perlas iguales. Lo más delicado de la línea.",
    largoBaseCm: 17,
    anchoCm: 0.4,
    manoDeObra: 2.4,
    /** Marfil y dorado: el neutro de la marca. */
    medidas: [4],
    nombresColor: ["Perla"],
    matriz: lisa(),
  },
  {
    archivo: "perla-alternada",
    armado: "trama",
    tecnica: "Perla alternada",
    construccion: "Hilo simple",
    descripcion: "Perlas de dos colores que se turnan una y una.",
    largoBaseCm: 17,
    anchoCm: 0.4,
    manoDeObra: 2.6,
    /** Negro y oro: el contraste mas fuerte, que es lo que luce alternado. */
    medidas: [4, 4],
    nombresColor: ["Perla", "Alterna"],
    matriz: alternada(),
  },
  {
    archivo: "perla-tresillo",
    armado: "trama",
    tecnica: "Perla en tresillo",
    construccion: "Hilo simple",
    descripcion: "Tres perlas de un color y tres del otro, en grupos parejos.",
    largoBaseCm: 17,
    anchoCm: 0.4,
    manoDeObra: 2.6,
    /** Rosa te, en 6 mm: los grupos de tres piden una cuenta mas grande. */
    medidas: [6, 6],
    nombresColor: ["Perla", "Grupo"],
    matriz: tresillo(),
  },
  {
    archivo: "perla-separador",
    armado: "trama",
    tecnica: "Perla con separador",
    construccion: "Hilo simple",
    descripcion: "Una cuenta de contraste cada seis perlas, como separador.",
    largoBaseCm: 17,
    anchoCm: 0.4,
    manoDeObra: 2.7,
    /** Atardecer, en 8 mm: la unica gruesa de la linea. */
    medidas: [8, 8],
    nombresColor: ["Perla", "Separador"],
    matriz: separadores(),
  },
  {
    archivo: "margarita",
    armado: "flores",
    tecnica: "Margarita",
    construccion: "Cadena de flores con hilo de dos extremos",
    descripcion:
      "Flores de seis pétalos alrededor de un centro, unidas por una rondela, un cristal y otra rondela. La tira se repite hasta el largo pedido.",
    largoBaseCm: 17,
    anchoCm: 1.2,
    manoDeObra: 4.2,
    /**
     * Petalo y centro miden lo mismo: con seis petalos el hueco del medio da
     * exactamente un petalo. El cristal es el acento y las rondelas, el filo
     * dorado entre una flor y la otra: es un disco de 4 mm, achatado contra el
     * hilo, no una bolita.
     */
    medidas: [4, 4, 8, 4],
    video: "https://www.youtube.com/watch?v=ZwnIj34sJ80",
    /** El tramo con acento del video: rondela, cristal y rondela. */
    flor: { union: [RONDELA, ACENTO, RONDELA], rondelas: [RONDELA] },
    /** Los colores de la foto que trajo Maria. */
    nombresColor: ["Pétalo", "Centro", "Cristal", "Rondela"],
    /**
     * Una cadena de flores **no tiene matriz**: la arma `matrizParaLargo()`
     * desde la flor y el largo. Esta queda como el minimo que el tipo pide.
     */
    matriz: [[0]],
  },
  {
    archivo: "roseton",
    armado: "flores",
    tecnica: "Rosetón",
    construccion: "Cadena de flores con hilo de dos extremos",
    descripcion:
      "Una perla grande rodeada de nueve cuentas chicas, y tres de unión entre flor y flor. La misma técnica de la margarita, con el centro del doble.",
    largoBaseCm: 17,
    anchoCm: 1.6,
    manoDeObra: 5.2,
    /**
     * El centro es del doble que el petalo, y por eso entran **nueve** y no
     * seis: los que entren tocandose alrededor. No es una variante de color de
     * la margarita, es otra flor.
     */
    medidas: [4, 8, 4],
    /** Union de tres iguales, como la del pliego: sin acento, la flor manda. */
    flor: { union: [ACENTO, ACENTO, ACENTO] },
    nombresColor: ["Pétalo", "Centro", "Unión"],
    matriz: [[0]],
  },
  {
    archivo: "margarita-menuda",
    armado: "flores",
    tecnica: "Margarita menuda",
    construccion: "Cadena de flores con hilo de dos extremos",
    descripcion:
      "Margaritas una detrás de otra, separadas por una sola rondela dorada. Sin cristal: la tira queda tupida y más fina.",
    largoBaseCm: 17,
    anchoCm: 1.2,
    manoDeObra: 4.6,
    medidas: [4, 4, 4],
    /** Una rondela sola: las flores casi se tocan, sin cristal en el medio. */
    flor: { union: [ACENTO], rondelas: [ACENTO] },
    nombresColor: ["Pétalo", "Centro", "Rondela"],
    matriz: [[0]],
  },
  {
    archivo: "cristal-cruzado",
    armado: "raw",
    tecnica: "Cristal cruzado",
    construccion: "Tejido en ángulo recto de una hilera",
    descripcion: "Una cinta delicada de cristal facetado: cuatro biconos forman cada eslabón y comparten una cuenta con el siguiente. Elige los colores de los laterales y las uniones.",
    largoBaseCm: 17,
    anchoCm: 0.8,
    manoDeObra: 4.8,
    medidas: [4, 4],
    nombresColor: ["Cristales laterales", "Cristales de unión"],
    matriz: [[0]],
  },

];


/** Los modelos: uno por tejido. El color se cambia en el editor, no acá. */
export const MODELOS_PULSERA: ModeloPulsera[] = TECNICAS.map((tecnica, indice) => {
  /**
   * El ancho **se calcula**, no se escribe: es la fila mas ancha del motivo por
   * el tamano de la cuenta de la tira. Escrito a mano quedaba en el numero de
   * cuando todas las paletas eran de 4 mm, y en las de 6 mentia por la mitad.
   *
   * En la margarita no sale de las filas —no hay filas— sino de la flor: tres
   * petalos de punta a punta.
   */
  const filasOcupadas = tecnica.matriz
    .map((fila, indice) => fila.some((tono) => tono >= 0) ? indice : -1)
    .filter((indice) => indice >= 0);
  const anchoEnFilas = Math.max(...filasOcupadas) - Math.min(...filasOcupadas) + 1;
  /**
   * **La paleta de un modelo es la escala de grises, no un color lindo.** Un
   * modelo es la forma esperando que alguien elija las cuentas; pintado con
   * perlas de verdad se lee como una pieza terminada y no lo es. Ver
   * `src/lib/cuentas-base.ts`.
   */
  const conMedidas: CuentaPaleta[] = paletaBase(tecnica.medidas).map((cuenta) =>
    tecnica.armado === "raw" ? { ...cuenta, forma: "bicono" } : cuenta,
  );
  const anchoCm =
    tecnica.armado === "raw"
      ? Math.round(medidasRaw(tecnica.medidas[0], tecnica.largoBaseCm).anchoCm * 10) / 10
      : tecnica.armado === "flores"
      ? (() => {
          const { radio, petalo } = anilloDeFlor(conMedidas);
          return Math.round((2 * radio + petalo) * 10) / 10;
        })()
      : Math.round(anchoEnFilas * ((tecnica.medidas[0] ?? 4) / 10) * 10) / 10;

  return {
    ...tecnica,
    anchoCm,
    id: `pulsera-${indice + 1}`,
    slug: `pulsera-${tecnica.archivo}`,
    nombre: tecnica.tecnica,
    ficha: `pulseras diseños/modelos/${tecnica.archivo}.md`,
    // La tecnica, cuando lo fija, manda la medida de cada papel.
    paleta: conMedidas,
  };
});

export function modeloPulseraPorId(id: string) {
  return MODELOS_PULSERA.find((modelo) => modelo.id === id || modelo.slug === id);
}

/**
 * La paleta de una pieza: los colores que se eligieron, con las medidas que
 * manda la tecnica. La clienta cambia el color, nunca el tamano — en la
 * margarita un petalo de otro diametro no cierra el anillo.
 */
export function paletaDelModelo(modelo: ModeloPulsera, elegida?: CuentaPaleta[]): CuentaPaleta[] {
  const base = elegida?.length ? elegida : modelo.paleta;
  return base.map((cuenta, papel) => ({ ...cuenta, mm: modelo.medidas[papel] ?? cuenta.mm }));
}

/** Que medida tiene que tener la cuenta de cada papel. */
export function medidaDePapel(modelo: ModeloPulsera, papel: number) {
  return modelo.medidas[papel] ?? modelo.paleta[0]?.mm ?? 4;
}

/** RAW requiere el corte bicono; una esfera del mismo diámetro no lo sustituye. */
export function cuentaSirveParaPapel(modelo: ModeloPulsera, papel: number, cuenta: { mm: number; acabado: string }) {
  return cuenta.mm === medidaDePapel(modelo, papel) && (modelo.armado !== "raw" || cuenta.acabado === "cristal");
}

/**
 * Donde va cada cuenta. Es lo unico que mira el visor: no sabe si le toco una
 * banda tejida o una cadena de flores.
 */
export function ubicacionesDePulsera(
  modelo: ModeloPulsera,
  largoCm: number,
  elegida?: CuentaPaleta[],
): LayoutPulsera {
  const paleta = paletaDelModelo(modelo, elegida);
  if (modelo.armado === "raw") return armarRaw(paleta, largoCm);
  if (modelo.armado === "flores" && modelo.flor) return armarFlores(paleta, modelo.flor, largoCm);
  return armarTrama(matrizParaLargo(modelo, largoCm), paleta);
}

/** Repite el modulo del modelo para que el largo elegido conserve su dibujo. */
export function matrizParaLargo(modelo: ModeloPulsera, largoCm: number): MatrizPulsera {
  if (modelo.armado === "raw") return [tonosRaw(medidasRaw(modelo.medidas[0], largoCm).unidades)];
  /**
   * **Una margarita entra entera o no entra.** No se repite por columnas como
   * una trama: se repite por flores, y el largo real es el que sale de las
   * flores que entraron. Cortar una flor al medio no es una pulsera.
   */
  if (modelo.armado === "flores" && modelo.flor) {
    const paleta = paletaDelModelo(modelo);
    return [tonosDeFlores(paleta, modelo.flor, floresParaLargo(paleta, modelo.flor, largoCm))];
  }
  const mm = modelo.paleta[0]?.mm ?? 4;
  // El piso estaba en 30 columnas, que con cuentas de 4 mm es razonable pero
  // con las de 8 estira la pulsera a 24 cm: el largo pedido dejaba de valer.
  // Con 16 sigue siendo un aro y ya no fuerza la medida.
  //
  // Del largo pedido, una parte la ocupa el cierre; el resto son cuentas. Y se
  // redondea para arriba: la cadena de extensión acorta, no alarga.
  const deCuentas = Math.max(12, largoCm) - CIERRE_CM;
  const columnas = Math.max(16, Math.ceil((deCuentas * 10) / mm - 1e-9));
  return modelo.matriz.map((fila) => Array.from({ length: columnas }, (_, columna) => fila[columna % fila.length]));
}

/** El orden de guardado es fila por fila, de izquierda a derecha. */
export function celdasDeMatriz(matriz: MatrizPulsera) {
  return matriz.flatMap((fila) => fila.filter((indice) => indice >= 0));
}

const PREFIJO_DISENO = "tejido";

/**
 * El diseño guardado entra entero en `DisenoCliente.celdas`: qué modelo, de qué
 * metal es el cierre y qué color lleva cada cuenta. El metal va en el medio
 * porque no es una cuenta —no sale del stock ni entra en la paleta— pero sí es
 * parte del pedido.
 */
export function codificarDisenoPulsera(modelo: ModeloPulsera, cierre: MetalCierre, celdas: number[]) {
  return `${PREFIJO_DISENO}/${modelo.id}/${cierre}/${comprimir(celdas)}`;
}

/** Lee un diseno tejido sin confundirlo con la pulsera de una sola tira. */
export function leerDisenoPulsera(celdasGuardadas: string, largoCm: number) {
  // El metal es opcional al leer: los diseños guardados antes del cierre no lo
  // traen y son doradas.
  const coincidencia = /^tejido\/([^/]+)\/(?:(dorado|plateado)\/)?([0-9a-z]+)$/i.exec(celdasGuardadas);
  if (!coincidencia) return null;
  const modelo = modeloPulseraPorId(coincidencia[1]);
  if (!modelo) return null;
  const matriz = matrizParaLargo(modelo, largoCm);
  const esperadas = celdasDeMatriz(matriz).length;
  return {
    modelo,
    matriz,
    cierre: (esMetal(coincidencia[2]) ? coincidencia[2] : "dorado") as MetalCierre,
    layout: ubicacionesDePulsera(modelo, largoCm),
    celdas: descomprimir(coincidencia[3], esperadas),
  };
}
