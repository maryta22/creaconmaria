/**
 * Cambiar de medida de cuenta una cartera que ya está dibujada.
 *
 * La misma cartera de 18 cm tejida en 8 mm tiene 23 columnas y en 10 mm tiene
 * 18: **cambiar la cuenta cambia el conteo**, así que el patrón guardado no
 * sirve tal cual. Hay que migrarlo, que es lo mismo que dice `CLAUDE.md` para
 * cuando se toca el orden de `armarLayout()`: mover cada color al lugar nuevo
 * de su (fila, columna).
 *
 * Acá se hace por **proporción dentro de cada pieza**. Una cuenta que estaba a
 * un tercio del ancho del frente sigue a un tercio del ancho del frente, tenga
 * la grilla las columnas que tenga. No es una interpolación de colores: cada
 * cuenta nueva se lleva el color de la vieja que le queda más cerca, así que
 * una paleta de tres tonos sigue teniendo tres tonos y ninguno inventado.
 *
 * El dibujo se **redondea**, como cualquier cosa que cambia de resolución: una
 * raya de una cuenta de ancho puede engordar o adelgazar. Es lo que pasa al
 * tejerla de verdad en otra medida, así que está bien que se vea.
 */
import { armarLayout, indiceEn, type MedidasCartera, type Panel, type Rejilla } from "./geometria";

/** Las medidas de cuenta con las que se ofrece una cartera. */
export const MEDIDAS_CARTERA = [8, 10] as const;

export type MedidaCartera = (typeof MEDIDAS_CARTERA)[number];

export function esMedidaDeCartera(valor: unknown): valor is MedidaCartera {
  return typeof valor === "number" && (MEDIDAS_CARTERA as readonly number[]).includes(valor);
}

/**
 * El mismo dibujo, tejido con otra cuenta. Devuelve las celdas nuevas, en el
 * orden en que `armarLayout(medidasNuevas)` genera las suyas.
 */
export function celdasEnOtraMedida(
  medidas: MedidasCartera,
  celdas: number[],
  cuentaMm: number,
): number[] {
  if (cuentaMm === medidas.cuentaMm) return celdas;

  const viejo = armarLayout(medidas);
  const nuevo = armarLayout({ ...medidas, cuentaMm });
  const viejas = new Map(viejo.rejillas.map((r) => [r.panel, r] as const));

  /** Lo que se usa cuando la cuenta vieja de ese lugar no existe. */
  const masUsado = celdas.length
    ? celdas.reduce((cuenta, tono) => {
        cuenta[tono] = (cuenta[tono] ?? 0) + 1;
        return cuenta;
      }, [] as number[])
    : [];
  const fondo = masUsado.indexOf(Math.max(...masUsado, 0));

  const nuevas = new Array<number>(nuevo.cuentas.length).fill(Math.max(fondo, 0));

  for (const rejilla of nuevo.rejillas) {
    const vieja = viejas.get(rejilla.panel as Panel);
    if (!vieja) continue;
    // De cuántas a cuántas: con una sola fila o columna no hay proporción que
    // calcular y todo cae en la única que hay.
    const porFila = vieja.filas > 1 && rejilla.filas > 1 ? (vieja.filas - 1) / (rejilla.filas - 1) : 0;
    const porCol = vieja.cols > 1 && rejilla.cols > 1 ? (vieja.cols - 1) / (rejilla.cols - 1) : 0;

    for (let f = 0; f < rejilla.filas; f += 1) {
      for (let c = 0; c < rejilla.cols; c += 1) {
        const destino = indiceEn(rejilla, f, c);
        if (destino < 0) continue;
        const origen = buscarCerca(vieja, Math.round(f * porFila), Math.round(c * porCol));
        if (origen >= 0 && celdas[origen] !== undefined) nuevas[destino] = celdas[origen];
      }
    }
  }

  return nuevas;
}

/**
 * El índice de esa (fila, columna) o el de la cuenta más cercana que sí exista.
 *
 * Hace falta porque **una pieza con silueta tiene huecos**: la grilla del
 * corazón es un rectángulo con las esquinas vacías, y al cambiar de medida la
 * silueta no cae en los mismos lugares. Sin esto, las cuentas del borde se
 * quedaban con el color de fondo y la silueta salía mordida.
 */
function buscarCerca(rejilla: Rejilla, fila: number, col: number) {
  const directo = indiceEn(rejilla, fila, col);
  if (directo >= 0) return directo;
  for (let radio = 1; radio <= 3; radio += 1) {
    for (let df = -radio; df <= radio; df += 1) {
      for (let dc = -radio; dc <= radio; dc += 1) {
        const f = fila + df;
        const c = col + dc;
        if (f < 0 || c < 0 || f >= rejilla.filas || c >= rejilla.cols) continue;
        const i = indiceEn(rejilla, f, c);
        if (i >= 0) return i;
      }
    }
  }
  return -1;
}
