/**
 * De una secuencia de cuentas a posiciones en el espacio, en cm.
 *
 * El hilo se recorre por **largo de arco**: la cuenta `i` va centrada a
 * `Σ(diámetros anteriores) + diámetro/2` cm del arranque. Después cada forma
 * dice cómo se dobla ese recorrido — un aro, una curva colgando o una tira
 * recta. Cambiar de forma no cambia el orden ni el conteo: es la misma pieza
 * acomodada distinto.
 *
 * Todo en cm, igual que `src/lib/cartera/geometria.ts`.
 */
import type { FormaHilo, TipoHilo } from "./tipos";

export type Punto = [number, number, number];

export type CuentaUbicada = {
  /** Posición en la secuencia, que es el orden en que se ensarta. */
  indice: number;
  pos: Punto;
  /** Diámetro en cm. */
  diametro: number;
};

/** Un tramo de hilo entre dos puntos. */
export type Tramo = { a: Punto; b: Punto };

export type LayoutHilo = {
  cuentas: CuentaUbicada[];
  /** Broche o argolla: dónde va y hacia dónde mira el eje del aro. */
  cierre: { pos: Punto; eje: Punto; radio: number };
  tramos: Tramo[];
  /** Para encuadrar la cámara: centro y radio de la esfera que envuelve todo. */
  centro: Punto;
  radio: number;
  /** Largo total, cierre incluido. */
  largoCm: number;
  forma: FormaHilo;
};

const TAU = Math.PI * 2;

/**
 * El radio del aro que necesita un largo dado. Sirve para encuadrar la cámara
 * antes de saber qué cuentas va a poner el cliente: si el encuadre se calcula
 * del largo real, la cámara salta con cada cuenta que se agrega.
 */
export function radioDeLargo(largoCm: number, forma: FormaHilo) {
  if (forma === "tira") return largoCm / 2;
  return largoCm / TAU;
}

export function armarHilo(diametros: number[], tipo: TipoHilo): LayoutHilo {
  const { forma, cierreCm } = tipo;
  const totalCuentas = diametros.reduce((suma, d) => suma + d, 0);
  const largoCm = totalCuentas + cierreCm;
  const mayor = diametros.length ? Math.max(...diametros) : 0.6;

  // El centro de cada cuenta, medido en cm de hilo desde la primera.
  const arcos: number[] = [];
  let recorrido = 0;
  for (const d of diametros) {
    arcos.push(recorrido + d / 2);
    recorrido += d;
  }

  /** El recorrido doblado según la forma: de cm de hilo a un punto. */
  let punto: (s: number) => Punto;
  let eje: (s: number) => Punto;
  let centro: Punto;
  let radio: number;

  if (forma === "tira") {
    // Cuelga derecho para abajo, con la argolla arriba de todo.
    punto = (s) => [0, -(cierreCm + s), 0];
    eje = () => [0, 0, 1];
    centro = [0, -largoCm / 2, 0];
    radio = largoCm / 2 + mayor;
  } else {
    // Aro y curva son el mismo anillo: uno apoyado y el otro colgando. Las
    // cuentas quedan centradas en la parte que se mira y el cierre, del otro
    // lado — atrás en la pulsera, en la nuca en el collar.
    const R = largoCm / TAU;
    const angulo = (s: number) => ((s - totalCuentas / 2) / largoCm) * TAU;
    if (forma === "aro") {
      punto = (s) => [R * Math.sin(angulo(s)), 0, R * Math.cos(angulo(s))];
      eje = (s) => [Math.cos(angulo(s)), 0, -Math.sin(angulo(s))];
    } else {
      punto = (s) => [R * Math.sin(angulo(s)), -R * Math.cos(angulo(s)), 0];
      eje = (s) => [Math.cos(angulo(s)), Math.sin(angulo(s)), 0];
    }
    centro = [0, 0, 0];
    radio = R + mayor;
  }

  const cuentas: CuentaUbicada[] = arcos.map((s, indice) => ({
    indice,
    pos: punto(s),
    diametro: diametros[indice],
  }));

  // El cierre ocupa el hueco que queda después de la última cuenta.
  const enElHueco = totalCuentas + cierreCm / 2;
  const cierre = {
    pos: forma === "tira" ? ([0, -cierreCm / 2, 0] as Punto) : punto(enElHueco),
    eje: forma === "tira" ? ([0, 0, 1] as Punto) : eje(enElHueco),
    radio: Math.min(cierreCm * 0.35, mayor * 1.1),
  };

  return {
    cuentas,
    cierre,
    tramos: tramosDeHilo(cuentas, cierre.pos, forma),
    centro,
    radio: Math.max(radio, cierreCm),
    largoCm,
    forma,
  };
}

/**
 * El hilo que se ve: de cuenta a cuenta, y de las puntas al cierre. Adentro de
 * la cuenta queda tapado; solo asoma en el hueco, que es lo que pasa de verdad.
 */
function tramosDeHilo(cuentas: CuentaUbicada[], cierre: Punto, forma: FormaHilo): Tramo[] {
  const tramos: Tramo[] = [];
  for (let i = 1; i < cuentas.length; i += 1) {
    tramos.push({ a: cuentas[i - 1].pos, b: cuentas[i].pos });
  }
  if (cuentas.length === 0) return tramos;

  // La tira arranca en la argolla y termina en la última cuenta. El aro y la
  // curva se cierran: el hilo vuelve por el broche.
  tramos.push({ a: cierre, b: cuentas[0].pos });
  if (forma !== "tira") tramos.push({ a: cuentas[cuentas.length - 1].pos, b: cierre });
  return tramos;
}
