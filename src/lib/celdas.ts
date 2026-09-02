/**
 * Patrón comprimido: un caracter base36 por cuenta, que es el índice dentro de
 * la paleta. Lo usan las carteras (`PatronCartera.celdas`) y los diseños del
 * cliente (`DisenoCliente.celdas`), así que vive acá y no adentro de ninguno.
 *
 * Una cartera de ~700 cuentas queda en 700 caracteres; una pulsera, en 20.
 */

export function comprimir(indices: number[]) {
  return indices.map((i) => i.toString(36)).join("");
}

export function descomprimir(celdas: string, cuentas: number): number[] {
  const indices = Array.from(celdas, (ch) => parseInt(ch, 36) || 0);
  // Si el patrón guardado quedó corto (cambió una medida), se completa con 0.
  while (indices.length < cuentas) indices.push(0);
  return indices.slice(0, cuentas);
}
