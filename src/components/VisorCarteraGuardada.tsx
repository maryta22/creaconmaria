"use client";

import Cartera3D from "./Cartera3D";
import type { MedidasCartera } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

/**
 * La cartera guardada de un cliente, girando. Solo mira: no se pinta, no se
 * edita y **no tiene mapa** — eso es del panel.
 *
 * Existe para que la página que la muestra pueda seguir siendo de servidor:
 * `Cartera3D` es de navegador, así que necesita una puerta con `"use client"`.
 */
export default function VisorCarteraGuardada({
  medidas,
  paleta,
  celdas,
}: {
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  celdas: number[];
}) {
  return (
    <Cartera3D
      medidas={medidas}
      paleta={paleta}
      celdas={celdas}
      mostrarHilo={false}
      mostrarForro
      autoGirar
      className="h-full w-full"
    />
  );
}
