/**
 * Cadenas de flores: el pliego `pulseras diseños/patrones/patron pulsera
 * flor.md` puesto en el espacio, y **todas las flores que salen de él**.
 *
 * **No es una trama y no entra en la grilla.** Los otros modelos son una banda
 * tejida: todas las cuentas del mismo tamaño, apoyadas en una cuadrícula con un
 * paso fijo. Acá no. Una flor es un anillo de pétalos alrededor de un centro, y
 * entre flor y flor va un tramo de unión. Cada cuenta tiene su medida y el hilo
 * las va acomodando por **largo de arco**, igual que en
 * `src/lib/hilo/geometria.ts`.
 *
 * Por eso una cadena de flores **sí puede mezclar tamaños** y una trama no: el
 * cristal de 8 mm no se mete adentro de nadie, se acomoda a continuación.
 *
 * ## Cuántos pétalos entran no se elige: se cuenta
 *
 * Alrededor de un centro de diámetro `c`, los pétalos de diámetro `p` quedan en
 * un círculo de radio `r = (c + p) / 2` — es lo que hace que cada pétalo toque
 * al centro—. Cuántos entran es cuántas cuerdas de largo `p` caben en ese
 * círculo: `n = ⌊π / arcsen(p / 2r)⌋`.
 *
 * Con centro y pétalo de 4 mm dan **seis**, que es la margarita del pliego. Con
 * un centro de 8 mm y pétalos de 4 dan **nueve**, y eso ya no es una margarita:
 * es un rosetón. **La flor la decide el tamaño de las dos cuentas**, no un
 * número escrito a mano — escrito a mano se pone en siete y el anillo queda
 * flojo, o en cinco y no cierra.
 *
 * ## El orden es el del pliego
 *
 * Se ensarta media vuelta de pétalos y el centro, se cierra el anillo, se suman
 * los de abajo y recién ahí va el tramo de unión. Ese es el orden en que se
 * guardan las cuentas, así que el mapa de colores, el precio y el diseño
 * guardado hablan todos del mismo hilo.
 */
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { CIERRE_CM, AJUSTE_CM, faseDeCierre, herrajesDeCierre } from "./cierre";
import { envolturaDe, type CuentaUbicadaPulsera, type LayoutPulsera, type Punto } from "./geometria";

export type LayoutFlores = LayoutPulsera & { flores: number; petalos: number };

/** Los cuatro papeles de la paleta, en el orden en que se editan. */
export const PETALO = 0;
export const CENTRO = 1;
export const ACENTO = 2;
export const RONDELA = 3;

/**
 * Cómo es la flor de un modelo. **Los pétalos no están acá**: los cuenta la
 * geometría a partir de los diámetros.
 */
export type Flor = {
  /** Los papeles del tramo de unión, en el orden en que se ensartan. */
  union: number[];
  /** Cuáles de esos papeles son rondelas: discos achatados contra el hilo. */
  rondelas?: number[];
};

/**
 * **Lo que una rondela ocupa sobre el hilo es su grosor, no su diámetro.** Es
 * un disco: mide 4 mm de ancho y menos de 2 de canto. Avanzar el diámetro
 * entero dejaba dos milímetros de hilo a la vista de cada lado.
 */
const ACHATADO = 0.45;

const mm = (paleta: CuentaPaleta[], papel: number, porDefecto: number) =>
  (paleta[papel]?.mm ?? porDefecto) / 10;

/** Cuántos pétalos entran alrededor del centro, y en qué círculo caen. */
export function anilloDeFlor(paleta: CuentaPaleta[]) {
  const petalo = mm(paleta, PETALO, 0.4);
  const centro = mm(paleta, CENTRO, 0.4);
  const radio = (centro + petalo) / 2;
  const seno = Math.min(1, petalo / (2 * radio));
  /**
   * **El margen no es opcional.** Con centro y pétalo iguales la cuenta da seis
   * clavado, pero `asin(0.5)` devuelve un pelo más que π/6 y la división cae en
   * 5,999999: sin el margen, la margarita del pliego salía de cinco pétalos.
   */
  const petalos = Math.floor(Math.PI / Math.asin(seno) + 1e-9);
  return { petalo, centro, radio, petalos: Math.max(3, petalos) };
}

/** Lo que ocupa cada cuenta del tramo de unión sobre el hilo. */
function tramo(paleta: CuentaPaleta[], flor: Flor) {
  const rondelas = new Set(flor.rondelas ?? []);
  return flor.union.map((papel) => {
    const diametro = mm(paleta, papel, 0.4);
    const rondela = rondelas.has(papel);
    return { papel, diametro, rondela, grosor: rondela ? diametro * ACHATADO : diametro };
  });
}

/** Cuántas cuentas lleva una flor con su tramo de unión. */
export function cuentasPorFlor(paleta: CuentaPaleta[], flor: Flor) {
  return anilloDeFlor(paleta).petalos + 1 + flor.union.length;
}

/**
 * Los tonos de una vuelta entera, en el orden en que se ensartan: media vuelta
 * de pétalos, el centro, la otra media y el tramo de unión.
 */
export function tonosDeFlores(paleta: CuentaPaleta[], flor: Flor, flores: number) {
  const { petalos } = anilloDeFlor(paleta);
  const mitad = Math.ceil(petalos / 2);
  const unidad = [
    ...new Array(mitad).fill(PETALO),
    CENTRO,
    ...new Array(petalos - mitad).fill(PETALO),
    ...flor.union,
  ];
  return Array.from({ length: flores * unidad.length }, (_, i) => unidad[i % unidad.length]);
}

/** Cuánto avanza el hilo de una flor a la siguiente. */
export function pasoDeFlores(paleta: CuentaPaleta[], flor: Flor) {
  const { petalo, radio, petalos } = anilloDeFlor(paleta);
  const salida = Math.max(...angulos(petalos).map(Math.cos));
  const ancho = radio * (salida + 1);
  return ancho + petalo + tramo(paleta, flor).reduce((suma, c) => suma + c.grosor, 0);
}

/** Los pétalos arrancan a la izquierda, por donde entra el hilo, y giran. */
function angulos(petalos: number) {
  return Array.from({ length: petalos }, (_, k) => Math.PI - (2 * Math.PI * k) / petalos);
}

/**
 * Cuántas flores enteras entran en el largo pedido. Nunca menos de tres.
 *
 * El largo pedido es el de la **pulsera cerrada**, y una parte de esa vuelta la
 * ocupa el metal: lo que hay que llenar con flores es el resto.
 *
 * **Se redondea para arriba, no al más cercano.** La cadena de extensión solo
 * acorta: una pulsera que sobra se cierra en un eslabón más adentro, pero una
 * que queda corta no hay cómo agrandarla. Así el largo pedido siempre entra.
 */
export function floresParaLargo(paleta: CuentaPaleta[], flor: Flor, largoCm: number) {
  return Math.max(3, Math.ceil((largoCm - CIERRE_CM) / pasoDeFlores(paleta, flor) - 1e-9));
}

/**
 * **El largo lo deciden las flores, no al revés.** Una flor entra entera o no
 * entra: cortar una por la mitad no es una pulsera. Así que se redondea a la
 * flor más cercana y el largo real es el que sale de ahí, como pasa con las
 * cuentas de una cartera.
 */
export function armarFlores(paleta: CuentaPaleta[], flor: Flor, largoCm: number): LayoutFlores {
  const { petalo, radio: r, petalos } = anilloDeFlor(paleta);
  const centroMm = mm(paleta, CENTRO, 0.4);
  const union = tramo(paleta, flor);
  const anillo = angulos(petalos);
  const paso = pasoDeFlores(paleta, flor);
  const flores = floresParaLargo(paleta, flor, largoCm);
  // El aro no cierra con cuentas: entre la última flor y la primera va el
  // cierre. La vuelta es la tira de flores más ese hueco.
  const arcoCuentas = flores * paso;
  const vuelta = arcoCuentas + CIERRE_CM;
  const R = vuelta / (2 * Math.PI);

  // El cierre se muestra al fondo del aro; las flores se corren con él.
  const fase = faseDeCierre(R, arcoCuentas);
  /** De cm de hilo a un punto del aro, con `y` cruzando la banda. */
  const punto = (s: number, y: number): Punto => {
    const a = (s / vuelta) * 2 * Math.PI + fase;
    return [R * Math.sin(a), y, R * Math.cos(a)];
  };
  /** Hacia dónde va el hilo en ese punto: el eje de las rondelas. */
  const tangente = (s: number): Punto => {
    const a = (s / vuelta) * 2 * Math.PI + fase;
    return [Math.cos(a), 0, -Math.sin(a)];
  };

  const cuentas: CuentaUbicadaPulsera[] = [];
  const tramos: { a: Punto; b: Punto }[] = [];
  const salida = anillo.reduce((mejor, a) => (Math.cos(a) > Math.cos(mejor) ? a : mejor), anillo[0]);

  for (let flor_ = 0; flor_ < flores; flor_ += 1) {
    // El centro de la flor: media vuelta después de donde entra el hilo.
    const centro = flor_ * paso + r + petalo / 2;
    const enElAnillo = anillo.map((a) => punto(centro + r * Math.cos(a), r * Math.sin(a)));

    /**
     * El orden del pliego: media vuelta de pétalos, el centro, y los de abajo.
     * El centro se ensarta con el anillo abierto y queda encerrado al cerrarlo.
     */
    const mitad = Math.ceil(petalos / 2);
    enElAnillo.slice(0, mitad).forEach((pos) => cuentas.push({ pos, diametro: petalo, tono: PETALO }));
    cuentas.push({ pos: punto(centro, 0), diametro: centroMm, tono: CENTRO });
    enElAnillo.slice(mitad).forEach((pos) => cuentas.push({ pos, diametro: petalo, tono: PETALO }));

    // El hilo da la vuelta al anillo. El centro queda encerrado y su hilo no se
    // ve, que es justo lo que lo mantiene en el medio.
    enElAnillo.forEach((a, i) => tramos.push({ a, b: enElAnillo[(i + 1) % enElAnillo.length] }));

    // El tramo de unión, sobre el hilo.
    const camino: Punto[] = [punto(centro + r * Math.cos(salida), r * Math.sin(salida))];
    let s = centro + r * Math.cos(salida) + petalo / 2;
    for (const cuenta of union) {
      s += cuenta.grosor / 2;
      const pos = punto(s, 0);
      camino.push(pos);
      cuentas.push(
        cuenta.rondela
          ? { pos, diametro: cuenta.diametro, tono: cuenta.papel, eje: tangente(s), achatado: ACHATADO }
          : { pos, diametro: cuenta.diametro, tono: cuenta.papel },
      );
      s += cuenta.grosor / 2;
    }
    // Y del tramo al pétalo de entrada de la flor siguiente. La última no tiene
    // siguiente: ahí termina la tira y empieza el cierre.
    if (flor_ < flores - 1) {
      const siguiente = (flor_ + 1) * paso + r + petalo / 2;
      camino.push(punto(siguiente + r * Math.cos(anillo[0]), r * Math.sin(anillo[0])));
    }
    camino.forEach((a, i) => i < camino.length - 1 && tramos.push({ a, b: camino[i + 1] }));
  }

  const herrajes = herrajesDeCierre(R, arcoCuentas);
  return {
    cuentas,
    tramos,
    herrajes,
    ajusteCm: AJUSTE_CM,
    flores,
    petalos,
    largoCm: Math.round(vuelta * 10) / 10,
    ...envolturaDe(cuentas, herrajes),
  };
}
