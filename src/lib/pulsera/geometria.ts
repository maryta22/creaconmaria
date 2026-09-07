/**
 * De un modelo de pulsera a cuentas puestas en el espacio, en cm.
 *
 * Hay **dos construcciones** y no se parecen en nada:
 *
 * - `trama` — una banda tejida. Todas las cuentas del mismo tamaño sobre una
 *   cuadrícula: filas a lo ancho de la muñeca, columnas dando la vuelta. Es lo
 *   que hacen la Perla lisa, la alternada y las demás.
 * - `margarita` — una cadena de flores. Cada cuenta tiene su medida y el hilo
 *   las acomoda por largo de arco. Vive en [`margarita.ts`](./margarita.ts).
 *
 * Las dos devuelven **lo mismo**: dónde va cada cuenta, de qué tamaño, y el
 * hilo que se ve. `Pulsera3D` no sabe cuál de las dos le tocó, solo las planta
 * —igual que `Cartera3D` con `armarLayout()`—. Toda la diferencia entre una
 * banda y una cadena de flores está acá adentro y en ningún componente.
 */
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { CIERRE_CM, AJUSTE_CM, faseDeCierre, herrajesDeCierre, type HerrajePulsera } from "./cierre";
import type { MatrizPulsera } from "./modelos";

export type Punto = [number, number, number];

/**
 * Cuánto más allá de la pieza puede estirarse el encuadre para mostrar el
 * cierre. Con 1,35 se ve el broche entero y el arranque de la cadena; con más,
 * la pulsera empieza a achicarse por una cola de metal.
 */
const MARGEN_CIERRE = 1.35;

export type CuentaUbicadaPulsera = {
  pos: Punto;
  /** En cm. */
  diametro: number;
  /** Índice en la paleta del modelo; lo puede pisar el diseño guardado. */
  tono: number;
  /**
   * Las rondelas doradas son **discos**, no bolitas: se achatan contra el hilo.
   * `eje` es hacia dónde va el hilo ahí y `achatado` cuánto se aplasta.
   */
  eje?: Punto;
  achatado?: number;
};

export type LayoutPulsera = {
  cuentas: CuentaUbicadaPulsera[];
  /** El hilo que se ve, de cuenta a cuenta. */
  tramos: { a: Punto; b: Punto }[];
  /**
   * El broche y la cadena de extensión. **No son cuentas**: no salen del stock,
   * no se pintan y lo único que se elige de ellos es si son dorados o
   * plateados. Ver [`cierre.ts`](./cierre.ts).
   */
  herrajes: HerrajePulsera[];
  /** Cuánto se puede acortar con la cadena de extensión. */
  ajusteCm: number;
  /** Centro y radio de la esfera que envuelve todo, para encuadrar la cámara. */
  centro: Punto;
  alcance: number;
  /**
   * **El largo que sale, no el que se pidió.** Las dos construcciones redondean
   * —la trama a la columna, la margarita a la flor entera— así que el largo
   * real es este y es el que se le dice a la clienta.
   */
  largoCm: number;
};

/**
 * La banda tejida cerrada en aro.
 *
 * **Las cuentas se tocan.** El paso sale del diámetro de la cuenta, no de un
 * número suelto. Sobre el aro lo que tiene que medir un diámetro es la
 * **cuerda** entre dos centros, no el arco: de ahí sale el radio.
 *
 * **Cada fila da la vuelta con las cuentas que tiene**, no con las de la fila
 * más larga: repartiéndolas sobre el total la pulsera aparecía partida al
 * medio, con un tajo.
 */
export function armarTrama(matriz: MatrizPulsera, paleta: CuentaPaleta[]): LayoutPulsera {
  const filas = matriz.length;
  const columnas = Math.max(1, ...matriz.map((fila) => fila.length));
  const diametro = Math.max(0.2, (paleta[0]?.mm ?? 8) / 10);
  const pasoY = diametro;
  /**
   * **El aro no cierra con cuentas: lo cierra el metal.** La circunferencia es
   * la tira más el hueco del cierre, y cada cuenta ocupa un diámetro de arco.
   */
  const arcoCuentas = columnas * diametro;
  const radio = (arcoCuentas + CIERRE_CM) / (2 * Math.PI);
  const paso = diametro / radio;
  // El cierre se muestra al fondo del aro; las cuentas se corren con él.
  const fase = faseDeCierre(radio, arcoCuentas);

  const cuentas: CuentaUbicadaPulsera[] = [];
  const posiciones: (Punto | null)[][] = matriz.map((fila) => new Array(fila.length).fill(null));

  /**
   * Las filas impares van corridas medio paso, como en el tejido — pero ese
   * corrimiento tiene que ser **entre filas**, no de la pieza entera.
   *
   * La tira de una sola fila vive en la fila 1 de la matriz, que es impar, así
   * que la pulsera salía corrida medio diámetro: de un lado quedaban dos
   * milímetros de hilo pelado antes de la argolla y del otro la última cuenta
   * se metía adentro del metal. Se descuenta el corrimiento más chico de las
   * filas que tienen cuentas: una banda con las dos paridades no cambia, y una
   * tira sola arranca en cero.
   */
  const corrimiento = Math.min(
    ...matriz.flatMap((fila, f) => (fila.some((tono) => tono >= 0) ? [f % 2 ? 0.5 : 0] : [])),
  );

  matriz.forEach((fila, f) => {
    fila.forEach((tono, c) => {
      if (tono < 0) return;
      const angulo = paso * (c + (f % 2 ? 0.5 : 0) - corrimiento) + paso / 2 + fase;
      const pos: Punto = [
        radio * Math.sin(angulo),
        (f - (filas - 1) / 2) * pasoY,
        radio * Math.cos(angulo),
      ];
      posiciones[f][c] = pos;
      cuentas.push({ pos, diametro: (paleta[tono]?.mm ?? 4) / 10, tono });
    });
  });

  // Los cruces diagonales son la trama: evitan que se lea como hileras sueltas.
  const tramos: { a: Punto; b: Punto }[] = [];
  const unir = (a: Punto | null, b: Punto | null) => {
    if (a && b) tramos.push({ a, b });
  };
  // La vuelta ya no cierra sobre sí misma: la última cuenta no se ata con la
  // primera, porque entre las dos va el cierre.
  posiciones.forEach((fila, f) => {
    fila.forEach((punto, c) => {
      unir(punto, fila[c + 1] ?? null);
      if (f < posiciones.length - 1) unir(punto, posiciones[f + 1][c + (f % 2 ? 1 : 0)] ?? null);
    });
  });

  /**
   * El arco de la tira es `arcoCuentas` justo: la primera cuenta está centrada
   * en medio diámetro y la última a medio diámetro del final, así que los
   * bordes de afuera caen en 0 y en `arcoCuentas`. Sumarle un diámetro más
   * corría el cierre hacia adentro del hueco y dejaba un claro enorme.
   */
  const herrajes = herrajesDeCierre(radio, arcoCuentas);
  return {
    cuentas,
    tramos,
    herrajes,
    ajusteCm: AJUSTE_CM,
    ...envolturaDe(cuentas, herrajes),
    largoCm: Math.round(2 * Math.PI * radio * 10) / 10,
  };
}

/**
 * La esfera que encuadra la pieza.
 *
 * **La manda la pieza, no la cadena.** La extensión son tres centímetros que
 * salen hacia afuera de una pulsera de cinco y medio: encuadrando todo, la
 * cámara se aleja al doble y la pulsera —que es lo que se vende— queda chica y
 * corrida. Así que el centro sale de las cuentas y el radio se estira solo
 * hasta `MARGEN_CIERRE`: se ve de dónde sale la cadena y hacia dónde va, y si
 * la cola se recorta contra el borde, se recorta. Es el mismo criterio con el
 * que se fotografía una pieza.
 */
export function envolturaDe(cuentas: CuentaUbicadaPulsera[], herrajes: HerrajePulsera[]) {
  if (cuentas.length === 0) return { centro: [0, 0, 0] as Punto, alcance: 1 };

  const min: Punto = [Infinity, Infinity, Infinity];
  const max: Punto = [-Infinity, -Infinity, -Infinity];
  for (const c of cuentas) {
    for (let i = 0; i < 3; i += 1) {
      min[i] = Math.min(min[i], c.pos[i] - c.diametro / 2);
      max[i] = Math.max(max[i], c.pos[i] + c.diametro / 2);
    }
  }
  const centro: Punto = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];

  const lejos = (pos: Punto, margen: number) =>
    Math.hypot(pos[0] - centro[0], pos[1] - centro[1], pos[2] - centro[2]) + margen;
  let dePieza = 0;
  for (const c of cuentas) dePieza = Math.max(dePieza, lejos(c.pos, c.diametro / 2));

  let deTodo = dePieza;
  for (const h of herrajes) {
    deTodo = Math.max(deTodo, lejos(h.pos, h.radio * h.alargue + h.grosor));
  }

  return { centro, alcance: Math.min(deTodo, dePieza * MARGEN_CIERRE) };
}
