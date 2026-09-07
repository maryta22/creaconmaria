"use client";

import { useEffect, useRef, useState } from "react";
import Cartera3D from "./Cartera3D";
import type { MedidasCartera } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

/**
 * La cartera de una tarjeta de lista, dibujada de verdad.
 *
 * **Se monta solo cuando entra en pantalla y se desmonta al salir.** Un lienzo
 * 3D es un contexto WebGL, y el navegador da unos pocos —alrededor de dieciséis
 * y después empieza a tirar los viejos—: una lista de cien carteras con un
 * lienzo cada una se queda sin contextos y se ven cuadros en negro. Montando
 * solo lo que se está mirando, la cuenta nunca pasa de lo que entra en la
 * ventana, y la lista puede crecer todo lo que quiera.
 *
 * Mientras no está montada queda el fondo del visor, que es el mismo: no
 * parpadea.
 */
export default function TarjetaCarteraViva({
  medidas,
  paleta,
  celdas,
  colorForro,
  className = "",
}: {
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  celdas: number[];
  /** El forro de esta cartera. Sin esto, el visor pone el de fábrica. */
  colorForro?: string;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [aLaVista, setALaVista] = useState(false);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const mirador = new IntersectionObserver(
      ([entrada]) => setALaVista(entrada.isIntersecting),
      // Un poco antes de que entre, así ya está dibujada al llegar.
      { rootMargin: "200px" },
    );
    mirador.observe(nodo);
    return () => mirador.disconnect();
  }, []);

  return (
    <div ref={caja} className={`fondo-3d relative ${className}`}>
      {aLaVista && (
        <Cartera3D
          medidas={medidas}
          paleta={paleta}
          celdas={celdas}
          colorForro={colorForro}
          mostrarHilo={false}
          mostrarForro
          className="h-full w-full"
        />
      )}
    </div>
  );
}
