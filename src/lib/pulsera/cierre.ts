/**
 * El cierre de una pulsera: el **mosquetón** de un lado y la **cadena de
 * extensión** del otro.
 *
 * Lo pidió María: *"todas las pulseras tienen un ganchito y se conectan a una
 * cadena al final, para que se pueda ajustar; pueden decidir entre dorado y
 * plateado"*, y después trajo las fotos de la cadena y del cierre que usa.
 *
 * ## El aro deja de cerrar, y está bien
 *
 * Hasta acá la vuelta de cuentas cerraba sola: la última tocaba a la primera.
 * Una pulsera de verdad no hace eso — tiene dos puntas, y lo que cierra el
 * círculo es el metal. Así que la circunferencia es **las cuentas más el hueco
 * del cierre**. Es la misma cuenta que hace `src/lib/hilo/geometria.ts` con su
 * `cierreCm`.
 *
 * ## Cómo se lee un mosquetón
 *
 * Un óvalo solo no se lee: parece una argolla grande tirada ahí, y así se veía.
 * Lo que lo hace reconocible es el **cuerpo en forma de gota** —recorrido con un
 * tubo grueso, porque es una pieza fundida y no un alambre doblado— con la
 * **palanca** apoyada contra un costado.
 *
 * ## Las puntas van a una argolla, sin tapa
 *
 * El hilo se ata a una **argolla** en cada punta: de una cuelga el mosquetón y
 * de la otra sale la cadena. Probé poniendo un casquillo que tapara el remate y
 * está de más — lo cortó María mirando la foto: *"yo no veo aquí ningún tubo"*.
 *
 * ## La cadena va estirada, en el plano de la pulsera
 *
 * El mosquetón engancha un eslabón de la cadena que sale de la otra punta: eso
 * es lo que cierra el círculo, y lo que sobra es de lo que se trata poder
 * ajustar. Esa cola se muestra **acostada y hacia afuera**, como en la foto de
 * María y como queda una pulsera apoyada en la mesa.
 *
 * Colgando hacia abajo se veía mal por un motivo de dibujo, no de joyería: el
 * aro está acostado, así que todo lo que baja se proyecta sobre el hueco del
 * medio y la cadena parecía un dije cruzando la pieza. Seguirla por el contorno
 * era peor todavía: se montaba encima de las cuentas.
 *
 * ## Los eslabones se cruzan
 *
 * Cada eslabón gira 90° respecto del anterior. Dos anillos en el mismo plano no
 * se enganchan: quedan uno al lado del otro y se ve que no es una cadena. Ya
 * pasó con la cadena de la cartera cuadrada.
 */
import type { Punto } from "./geometria";

/** Cuánto se puede acortar la pulsera con la cadena de extensión. */
export const AJUSTE_CM = 3;

/** El acabado del metal. Es lo único del cierre que elige la clienta. */
export type MetalCierre = "dorado" | "plateado";

export const METALES: { id: MetalCierre; nombre: string; color: string }[] = [
  { id: "dorado", nombre: "Dorado", color: "#d3ab34" },
  { id: "plateado", nombre: "Plateado", color: "#c2c7cc" },
];

export function colorDeMetal(metal: MetalCierre) {
  return METALES.find((m) => m.id === metal)?.color ?? METALES[0].color;
}

export function esMetal(valor: unknown): valor is MetalCierre {
  return valor === "dorado" || valor === "plateado";
}

export type HerrajePulsera = {
  /**
   * Cada clase se dibuja distinto: `palanca` es un cilindro, `cuerpo` es el tubo
   * que recorre el contorno de la gota, y `argolla` y `eslabon` son anillos.
   */
  clase: "argolla" | "cuerpo" | "palanca" | "eslabon";
  pos: Punto;
  /** El eje del anillo: perpendicular al plano en el que está. */
  eje: Punto;
  /** Hacia dónde se alarga. En un anillo va sobre su plano; en un cilindro es su eje. */
  avance: Punto;
  /** El radio corto. El largo es `radio × alargue`. */
  radio: number;
  alargue: number;
  /** El grosor del tubo. Los cilindros no lo usan. */
  grosor: number;
};

/**
 * La argolla de cada punta: el hilo se ata a ella y de ahí sale el mosquetón de
 * un lado y la cadena del otro.
 *
 * **No hay casquillo.** Llegué a poner un tubito en cada punta para tapar el
 * remate, y no va: lo dijo María mirando la foto, *"yo no veo aquí ningún
 * tubo"*. En la pieza de verdad el eslabón entra derecho a la argolla.
 */
const ARGOLLA = { radio: 0.078, alargue: 1, grosor: 0.028 };
/**
 * El cuerpo del mosquetón: una **gota**, con la punta hacia la cadena. No es un
 * óvalo estirado — eso fue lo que nunca se leyó. Se dibuja recorriendo el
 * contorno con un tubo.
 *
 * El tubo va **grueso y el cuerpo rechoncho**, no fino y largo: un mosquetón es
 * una pieza fundida, y dibujado con alambre delgado parecía un aro de alambre
 * doblado. Se ve en la foto que trajo María.
 */
const CUERPO = { largo: 0.38, ancho: 0.28, alambre: 0.052 };
/** La palanca: la barrita que cierra la boca, apoyada contra un costado. */
const PALANCA = { radio: 0.019, largo: CUERPO.largo * 0.62 };
/**
 * El eslabón de cadena fina de la foto: chico y ovalado. Los de antes eran el
 * doble y pesaban más que la pulsera.
 */
const ESLABON = { radio: 0.055, alargue: 1.6, grosor: 0.018 };

const PASO_CADENA = ESLABON.radio * ESLABON.alargue * 1.35;

/**
 * El contorno de la gota, en su propio plano y con la punta en +X.
 *
 * Sale de `x = cos t`, `y = sen t · sen(t/2)`: la curva de gota de siempre. Se
 * escala al largo y al ancho que le tocan y el visor la recorre con un tubo.
 */
export function perfilDeGancho(muestras = 44): [number, number][] {
  const ALTO = 0.7698; // el maximo de |sen t · sen(t/2)|
  return Array.from({ length: muestras }, (_, i) => {
    const t = (2 * Math.PI * i) / muestras;
    return [
      (CUERPO.largo / 2) * Math.cos(t),
      ((CUERPO.ancho / 2) / ALTO) * Math.sin(t) * Math.sin(t / 2),
    ] as [number, number];
  });
}

export const ALAMBRE_GANCHO = CUERPO.alambre;

/**
 * Cuánto del contorno ocupa el cierre cerrado. **Se calcula de las piezas**, no
 * se elige: escrito a mano quedaba corto y el broche pisaba las cuentas.
 */
export const CIERRE_CM =
  Math.round((ARGOLLA.radio * 4 + CUERPO.largo + PASO_CADENA * 2) * 100) / 100;

const resta = (a: Punto, b: Punto): Punto => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: Punto, b: Punto): Punto => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function normal(v: Punto): Punto {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

/**
 * Las dos perpendiculares a la dirección de la cadena. El plano del eslabón
 * tiene que **contener** esa dirección, así que el eje sale de acá — y alterna
 * entre las dos para que un eslabón se enganche con el siguiente.
 */
function perpendiculares(d: Punto): [Punto, Punto] {
  const auxiliar: Punto = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const a = normal(cruz(d, auxiliar));
  return [a, normal(cruz(d, a))];
}

/**
 * **Dónde cae el cierre sobre el aro.** Se lo lleva al fondo, que en la vista
 * de tres cuartos es la parte de arriba: ahí se ve de frente y despejado. Al
 * frente quedaba abajo, de perfil y encimado con las cuentas de adelante — que
 * es como se veía mal.
 */
export function faseDeCierre(R: number, arcoCuentas: number) {
  const vuelta = 2 * Math.PI * R;
  return Math.PI - (arcoCuentas + vuelta) / (2 * R);
}

/**
 * El herraje de una pulsera abierta en un aro de radio `R`, con las cuentas
 * ocupando de `0` a `arcoCuentas` y el hueco del cierre hasta la vuelta entera.
 */
export function herrajesDeCierre(R: number, arcoCuentas: number): HerrajePulsera[] {
  const vuelta = 2 * Math.PI * R;
  const fase = faseDeCierre(R, arcoCuentas);
  const punto = (s: number, y = 0, fuera = 0): Punto => {
    const a = s / R + fase;
    return [(R + fuera) * Math.sin(a), y, (R + fuera) * Math.cos(a)];
  };
  const tangente = (s: number): Punto => {
    const a = s / R + fase;
    return [Math.cos(a), 0, -Math.sin(a)];
  };
  /** Acostado: el plano del anillo es el de la pulsera, que es como se mira. */
  const ACOSTADO: Punto = [0, 1, 0];
  /** Parado: de canto desde arriba. Un eslabon y el de al lado alternan. */
  const parado = (s: number): Punto => normal(resta(punto(s, 0, 1), punto(s)));
  const herrajes: HerrajePulsera[] = [];
  const poner = (
    clase: HerrajePulsera["clase"],
    pos: Punto,
    avance: Punto,
    eje: Punto,
    forma: { radio: number; alargue: number; grosor: number },
  ) => herrajes.push({ clase, pos, avance: normal(avance), eje: normal(eje), ...forma });

  const cilindro = (radio: number, largo: number) => ({ radio, alargue: largo, grosor: 0 });

  /**
   * De una punta a la otra: **argolla, mosquetón, cadena, argolla**. Nada más.
   * La punta de la gota mira hacia la cadena, que es a lo que se agarra.
   */
  const sArgA = arcoCuentas + ARGOLLA.radio;
  poner("argolla", punto(sArgA), tangente(sArgA), parado(sArgA), ARGOLLA);

  const sCuerpo = sArgA + ARGOLLA.radio + CUERPO.largo / 2;
  poner("cuerpo", punto(sCuerpo), tangente(sCuerpo), ACOSTADO, {
    radio: CUERPO.ancho / 2,
    alargue: CUERPO.largo,
    grosor: CUERPO.alambre,
  });
  // La palanca cierra la boca: va contra un costado, no cruzada al medio.
  poner(
    "palanca",
    punto(sCuerpo + CUERPO.largo * 0.1, 0, CUERPO.ancho * 0.26),
    tangente(sCuerpo),
    ACOSTADO,
    cilindro(PALANCA.radio, PALANCA.largo),
  );

  const sArgB = vuelta - ARGOLLA.radio;
  poner("argolla", punto(sArgB), tangente(sArgB), parado(sArgB), ARGOLLA);

  /**
   * La cadena va de la argolla B a la boca del mosquetón —esos son los
   * eslabones que cierran el círculo— y sigue de largo hacia afuera: eso es lo
   * que sobra y lo que deja ajustar. Va **acostada y en el plano**, como una
   * pulsera apoyada en la mesa; colgando se proyectaba sobre el hueco del medio
   * y parecía un dije cruzando la pieza.
   */
  const boca = sCuerpo + CUERPO.largo / 2;
  for (let i = 0, s2 = sArgB - ARGOLLA.radio - PASO_CADENA / 2; s2 > boca; s2 -= PASO_CADENA, i += 1) {
    poner("eslabon", punto(s2), tangente(s2), i % 2 ? parado(s2) : ACOSTADO, ESLABON);
  }

  const desde = punto(sArgB);
  const afuera = normal(resta(punto(sArgB, 0, 1), desde));
  const perp = perpendiculares(afuera);
  const cuantos = Math.max(2, Math.round(AJUSTE_CM / PASO_CADENA));

  let ultimo = desde;
  for (let i = 1; i <= cuantos; i += 1) {
    const avance = ARGOLLA.radio + (i - 0.5) * PASO_CADENA;
    ultimo = [
      desde[0] + afuera[0] * avance,
      desde[1] + afuera[1] * avance,
      desde[2] + afuera[2] * avance,
    ];
    poner("eslabon", ultimo, afuera, perp[i % 2], ESLABON);
  }

  return herrajes;
}

/** Lo que hay que tener en la mesa además de las cuentas. */
export const MATERIALES_CIERRE = [
  "1 mosquetón",
  "2 argollas de unión, una por punta",
  `1 cadena de extensión de eslabón fino, de ${AJUSTE_CM} cm`,
];
