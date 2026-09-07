/**
 * El punto con el que se teje cada pieza.
 *
 * Sale de `carteras diseños/patrones/cruzado.md`: un hilo con sus dos extremos,
 * cuatro cuentas por unidad y los dos extremos cruzándose dentro de la cuenta
 * que cierra. Las piezas planas se tejen en tira; el asa, el mismo punto pero
 * cerrado en tubo.
 */
import type { Panel } from "./geometria";

export type Punto = "cruzadoPlano" | "cruzadoTubular";

export const PUNTO_DE: Record<Panel, Punto> = {
  base: "cruzadoPlano",
  frente: "cruzadoPlano",
  espalda: "cruzadoPlano",
  lateralIzq: "cruzadoPlano",
  lateralDer: "cruzadoPlano",
  solapa: "cruzadoPlano",
  contorno: "cruzadoPlano",
  asa: "cruzadoTubular",
  asaFrente: "cruzadoTubular",
  asaEspalda: "cruzadoTubular",
};

export const PUNTOS: Record<Punto, { nombre: string; comoVa: string }> = {
  cruzadoPlano: {
    nombre: "Tejido cruzado, en tira",
    comoVa:
      "Cuatro cuentas por unidad. Los dos extremos del hilo se cruzan dentro de la cuenta que cierra, entrando en direcciones opuestas: eso es lo que traba la labor.",
  },
  cruzadoTubular: {
    nombre: "Tejido cruzado, cerrado en tubo",
    comoVa:
      "El mismo punto, pero cada vuelta engancha con la primera cuenta en lugar de terminar en un borde. Así el asa queda maciza y no se aplasta.",
  },
};

export const FICHA_DEL_PUNTO = "carteras diseños/patrones/cruzado.md";
