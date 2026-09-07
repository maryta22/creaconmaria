/**
 * El maniquí que sostiene la cartera, para verla **en persona**.
 *
 * Lo pidió María: *"una vista en persona, un maniquí sosteniendo el bolso, que
 * el maniquí sea de una altura de 1,60 que es lo promedio"*.
 *
 * ## Para qué está
 *
 * Una cartera sola en el aire no tiene tamaño: un bolso de 18 cm y uno de 30 se
 * ven iguales si no hay nada al lado. Las medidas están escritas en la ficha,
 * pero un número no se compara con el cuerpo de uno. Al lado de una persona de
 * 1,60 se entiende de una.
 *
 * ## Es un maniquí, no una persona
 *
 * Una chica con vestido —lo pidió María— pero **sin cara**, en yeso mate, como
 * el de una vitrina. La pieza que se vende es la cartera; el maniquí es la
 * regla. Los rasgos le robarían atención a lo que hay que mirar; el vestido no,
 * porque es lo que hace que se lea como una persona y no como un muñeco de
 * palitos.
 *
 * ## Las proporciones no se inventan
 *
 * Salen del canon de siete cabezas y media, escrito como fracción de la altura:
 * así el maniquí sigue siendo correcto si algún día la altura cambia. Todo en
 * **cm**, como el resto de `src/lib/cartera/`.
 */

export type Punto = [number, number, number];

/** De qué es cada pieza. El visor le pone su tono a cada una. */
export type MaterialManiqui = "cuerpo" | "vestido" | "pelo";

/** Un hueso: un tubo de punta a punta con las puntas redondeadas. */
export type Hueso = {
  nombre: string;
  desde: Punto;
  hasta: Punto;
  radio: number;
  material?: MaterialManiqui;
};

/**
 * Un tronco de cono: se abre o se cierra de una punta a la otra. Es lo que hace
 * falta para una falda y para un corpiño, que un tubo no puede.
 */
export type Cono = {
  nombre: string;
  desde: Punto;
  hasta: Punto;
  radioDesde: number;
  radioHasta: number;
  material?: MaterialManiqui;
};

export type Maniqui = {
  alturaCm: number;
  huesos: Hueso[];
  /** El vestido y el pelo, que no son tubos. */
  conos: Cono[];
  /** El centro de la cabeza y su radio: va aparte porque es una esfera. */
  cabeza: { centro: Punto; radio: number };
  /** La melena: una esfera detrás de la cabeza, un poco más grande. */
  pelo: { centro: Punto; radio: number };
  /**
   * Dónde queda la mano que sostiene la cartera. Es el punto por el que hay que
   * colgarla: ahí va la parte de arriba del asa.
   */
  mano: Punto;
  /** Hasta dónde llega de ancho, para encuadrar la cámara. */
  anchoCm: number;
};

export const ALTURA_MANIQUI_CM = 160;

/**
 * Fracciones de la altura total. Son las del canon de siete cabezas y media,
 * que es el que usa una vitrina: la muñeca cae a la mitad de la altura, los
 * hombros a poco más de cuatro quintos.
 */
const CANON = {
  /** El ruedo del vestido: a media pantorrilla. */
  ruedo: 0.21,
  entrepierna: 0.47,
  cintura: 0.635,
  busto: 0.72,
  hombro: 0.825,
  cuello: 0.875,
  /** El centro de la cabeza, puesto para que la coronilla dé la altura justa. */
  cabeza: 0.944,
  codo: 0.62,
  muneca: 0.465,
  /**
   * Silueta de mujer: los hombros y la cadera casi iguales, con la cintura
   * marcada en el medio. Con los hombros más anchos que la cadera el maniquí
   * se leía como un hombre por más vestido que le pusiera.
   */
  anchoHombros: 0.205,
  anchoCadera: 0.155,
  radioCabeza: 0.056,
  radioBusto: 0.058,
  radioCintura: 0.043,
  radioCadera: 0.055,
  /** Cuánto se abre la falda abajo. Es lo que hace que sea un vestido y no un tubo. */
  radioRuedo: 0.115,
  radioPierna: 0.028,
  radioBrazo: 0.019,
};

/**
 * El maniquí: una chica de pie, con vestido, y la cartera colgando de la mano.
 *
 * **Los huesos se encadenan**: cada uno arranca donde termina el anterior. La
 * primera versión los ponía por altura suelta y quedaban huecos — la cabeza
 * flotaba sobre los hombros y el torso no llegaba a tocarlos. Un tubo con las
 * puntas redondeadas tapa la junta solo si las puntas se pisan.
 *
 * El vestido y el corpiño son **conos**, no tubos: un tubo del mismo grosor de
 * arriba abajo no es un vestido, es una funda. La falda se abre del talle al
 * ruedo y el corpiño se estrecha del busto a la cintura.
 *
 * El brazo que sostiene se separa un poco del cuerpo — lo justo para que la
 * cartera no roce la falda. Pegado al costado se veía la cartera metida adentro
 * de la pierna.
 */
export function armarManiqui(alturaCm = ALTURA_MANIQUI_CM, mediaCarteraCm = 0): Maniqui {
  const a = (fraccion: number) => fraccion * alturaCm;
  const hombro = a(CANON.anchoHombros) / 2;
  const cadera = a(CANON.anchoCadera) / 2;
  /**
   * Cuánto se abre el brazo que lleva la cartera.
   *
   * **Tiene que salvar el ruedo más la mitad de la cartera**, no solo el ruedo.
   * Calculado sin la cartera, un bolso ancho se metía adentro de la falda: la
   * mano quedaba libre pero la pieza no. Se le suma un dedo de aire para que no
   * queden rozándose.
   */
  const separa = Math.max(
    a(0.03),
    a(CANON.radioRuedo) + mediaCarteraCm + a(0.02) - hombro,
  );
  const muneca = hombro + separa;

  const huesos: Hueso[] = [
    // Piernas: del ruedo del vestido al piso. Arriba las tapa la falda.
    { nombre: "pierna izquierda", desde: [-cadera * 0.7, a(CANON.ruedo), 0], hasta: [-cadera * 0.6, 0, 0], radio: a(CANON.radioPierna) },
    { nombre: "pierna derecha", desde: [cadera * 0.7, a(CANON.ruedo), 0], hasta: [cadera * 0.6, 0, 0], radio: a(CANON.radioPierna) },
    /**
     * **El vestido cierra en los hombros y sube al cuello.** El escote y los
     * hombros al aire dejaban a la vista tres tubos de piel que no aportaban
     * nada, y de lejos parecía un maniquí desvestido.
     */
    { nombre: "hombros", desde: [-hombro, a(CANON.hombro), 0], hasta: [hombro, a(CANON.hombro), 0], radio: a(CANON.radioBrazo) * 1.55, material: "vestido" },
    { nombre: "cuello", desde: [0, a(CANON.hombro), 0], hasta: [0, a(CANON.cuello), 0], radio: a(CANON.radioBrazo) * 1.35 },
    // Brazo libre, pegado al costado.
    { nombre: "brazo izquierdo", desde: [-hombro, a(CANON.hombro), 0], hasta: [-hombro * 1.05, a(CANON.codo), 0], radio: a(CANON.radioBrazo) },
    { nombre: "antebrazo izquierdo", desde: [-hombro * 1.05, a(CANON.codo), 0], hasta: [-muneca * 0.82, a(CANON.muneca), 0], radio: a(CANON.radioBrazo) * 0.85 },
    { nombre: "mano izquierda", desde: [-muneca * 0.82, a(CANON.muneca), 0], hasta: [-muneca * 0.82, a(CANON.muneca) - a(0.032), 0], radio: a(CANON.radioBrazo) * 0.95 },
    // Brazo que sostiene: se abre para dejarle lugar a la cartera.
    { nombre: "brazo derecho", desde: [hombro, a(CANON.hombro), 0], hasta: [hombro + separa * 0.45, a(CANON.codo), 0], radio: a(CANON.radioBrazo) },
    { nombre: "antebrazo derecho", desde: [hombro + separa * 0.45, a(CANON.codo), 0], hasta: [muneca, a(CANON.muneca), 0], radio: a(CANON.radioBrazo) * 0.85 },
    { nombre: "mano derecha", desde: [muneca, a(CANON.muneca), 0], hasta: [muneca, a(CANON.muneca) - a(0.032), 0], radio: a(CANON.radioBrazo) * 0.95 },
  ];

  const conos: Cono[] = [
    // La falda, del talle al ruedo. Es la pieza que dice que es un vestido.
    { nombre: "falda", desde: [0, a(CANON.ruedo), 0], hasta: [0, a(CANON.cintura), 0], radioDesde: a(CANON.radioRuedo), radioHasta: a(CANON.radioCintura), material: "vestido" },
    // La cadera, entre el talle y la falda: cierra el hueco del cono.
    { nombre: "cadera", desde: [0, a(CANON.cintura), 0], hasta: [0, a(CANON.entrepierna), 0], radioDesde: a(CANON.radioCintura), radioHasta: a(CANON.radioCadera), material: "vestido" },
    // El corpiño, de la cintura al cuello, pasando por el busto.
    { nombre: "talle", desde: [0, a(CANON.cintura), 0], hasta: [0, a(CANON.busto), 0], radioDesde: a(CANON.radioCintura), radioHasta: a(CANON.radioBusto), material: "vestido" },
    { nombre: "corpiño", desde: [0, a(CANON.busto), 0], hasta: [0, a(CANON.cuello) - a(0.015), 0], radioDesde: a(CANON.radioBusto), radioHasta: a(CANON.radioBrazo) * 1.7, material: "vestido" },
    // Mangas cortas: el vestido baja un poco por el brazo.
    { nombre: "manga izquierda", desde: [-hombro, a(CANON.hombro), 0], hasta: [-hombro * 1.03, a(CANON.hombro) - a(0.075), 0], radioDesde: a(CANON.radioBrazo) * 1.5, radioHasta: a(CANON.radioBrazo) * 1.2, material: "vestido" },
    { nombre: "manga derecha", desde: [hombro, a(CANON.hombro), 0], hasta: [hombro + separa * 0.2, a(CANON.hombro) - a(0.075), 0], radioDesde: a(CANON.radioBrazo) * 1.5, radioHasta: a(CANON.radioBrazo) * 1.2, material: "vestido" },
    // La melena que cae por la espalda, hasta debajo del hombro.
    { nombre: "melena", desde: [0, a(CANON.cabeza) - a(0.01), -a(CANON.radioCabeza) * 0.5], hasta: [0, a(CANON.hombro) - a(0.015), -a(CANON.radioCabeza) * 0.55], radioDesde: a(CANON.radioCabeza) * 0.8, radioHasta: a(CANON.radioCabeza) * 0.62, material: "pelo" },
  ];

  return {
    alturaCm,
    huesos,
    conos,
    cabeza: { centro: [0, a(CANON.cabeza), 0], radio: a(CANON.radioCabeza) },
    /**
     * El pelo es una esfera **apenas** más grande que la cabeza y corrida hacia
     * atrás: así se ve la cara de frente y la melena por detrás. Más grande o
     * más centrada le comía la cabeza y parecía una capucha.
     */
    pelo: {
      centro: [0, a(CANON.cabeza) + a(0.004), -a(CANON.radioCabeza) * 0.42],
      radio: a(CANON.radioCabeza) * 1.02,
    },
    // El asa se cuelga de la mano, no de la muñeca: un poco más abajo.
    mano: [muneca, a(CANON.muneca) - a(0.016), 0],
    anchoCm: Math.max(muneca * 2, a(CANON.radioRuedo) * 2) + a(CANON.radioBrazo) * 2,
  };
}
