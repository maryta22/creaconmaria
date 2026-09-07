/**
 * RAW de una hilera: cuatro cuentas por unidad, una compartida al continuar.
 * Referencia técnica: https://artbeads.com/content/tutorial-pdfs/2014-right-angle-weave-diagram.pdf
 * Las posiciones son una adaptación geométrica propia para biconos de 4 mm.
 */
import type { CuentaPaleta } from "../cartera/modelos";
import { AJUSTE_CM, CIERRE_CM, faseDeCierre, herrajesDeCierre } from "./cierre";
import { envolturaDe, type LayoutPulsera, type Punto } from "./geometria";

export function medidasRaw(mm: number, largoCm: number) {
  const diametro = mm / 10;
  // Holgura entre extremos para el giro del hilo en cada esquina.
  const paso = diametro * 1.1;
  const unidades = Math.max(1, Math.ceil((largoCm - CIERRE_CM - diametro) / paso - 1e-9));
  const arco = unidades * paso + diametro;
  return { diametro, paso, unidades, arco, anchoCm: paso + diametro };
}

export function tonosRaw(unidades: number) {
  // Unión inicial, luego lateral exterior, lateral interior y nueva unión.
  return [1, ...Array.from({ length: unidades }, () => [0, 0, 1]).flat()];
}

export function armarRaw(paleta: CuentaPaleta[], largoCm: number): LayoutPulsera {
  const { diametro, paso, unidades, arco } = medidasRaw(paleta[0].mm, largoCm);
  const radio = (arco + CIERRE_CM) / (2 * Math.PI);
  const fase = faseDeCierre(radio, arco);
  const punto = (s: number, w: number): Punto => {
    const a = fase + s / radio;
    return [(radio + w) * Math.sin(a), 0, (radio + w) * Math.cos(a)];
  };
  const cuentas: LayoutPulsera["cuentas"] = [];
  const tramos: LayoutPulsera["tramos"] = [];
  const poner = (s: number, w: number, tono: number, transversal: boolean) => {
    const a = fase + s / radio;
    const eje: Punto = transversal ? [Math.sin(a), 0, Math.cos(a)] : [Math.cos(a), 0, -Math.sin(a)];
    cuentas.push({ pos: punto(s, w), diametro, tono, eje });
    return cuentas.length - 1;
  };
  const extremo = (indice: number, signo: number): Punto => {
    const c = cuentas[indice];
    return c.pos.map((v, i) => v + signo * c.eje![i] * diametro / 2) as Punto;
  };
  const unir = (a: number, salida: number, b: number, entrada: number) => {
    tramos.push({ a: extremo(a, salida), b: extremo(b, entrada) });
  };

  let izquierda = poner(diametro / 2, 0, 1, true);
  for (let unidad = 0; unidad < unidades; unidad++) {
    const inicio = diametro / 2 + unidad * paso;
    const exterior = poner(inicio + paso / 2, paso / 2, 0, false);
    const interior = poner(inicio + paso / 2, -paso / 2, 0, false);
    const derecha = poner(inicio + paso, 0, 1, true);
    // El hilo entra y sale por el eje de cada bicono, no por su costado.
    unir(izquierda, 1, exterior, -1);
    unir(exterior, 1, derecha, 1);
    unir(derecha, -1, interior, 1);
    unir(interior, -1, izquierda, -1);
    izquierda = derecha;
  }
  // Lazadas de remate desde los dos extremos del bicono hasta el cierre.
  for (const [indice, s] of [[0, 0], [izquierda, arco]]) {
    for (const signo of [-1, 1]) tramos.push({ a: extremo(indice, signo), b: punto(s, 0) });
  }
  const herrajes = herrajesDeCierre(radio, arco);
  return {
    cuentas, tramos, herrajes, ajusteCm: AJUSTE_CM,
    ...envolturaDe(cuentas, herrajes),
    largoCm: Math.round((arco + CIERRE_CM) * 10) / 10,
  };
}
