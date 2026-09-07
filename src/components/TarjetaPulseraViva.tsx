"use client";

import { useEffect, useRef, useState } from "react";
import MuestraPulsera from "./MuestraPulsera";
import Pulsera3D from "./Pulsera3D";
import { ubicacionesDePulsera, type ModeloPulsera } from "@/lib/pulsera/modelos";

/** Igual que las carteras, el visor 3D se monta solo cuando la tarjeta entra en pantalla. */
export default function TarjetaPulseraViva({ modelo, className = "" }: { modelo: ModeloPulsera; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [aLaVista, setALaVista] = useState(false);
  const layout = ubicacionesDePulsera(modelo, modelo.largoBaseCm);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const mirador = new IntersectionObserver(
      ([entrada]) => setALaVista(entrada.isIntersecting),
      { rootMargin: "200px" },
    );
    mirador.observe(nodo);
    return () => mirador.disconnect();
  }, []);

  return (
    <div ref={caja} className={`fondo-3d relative overflow-hidden ${className}`}>
      {aLaVista ? (
        <Pulsera3D layout={layout} paleta={modelo.paleta} autoGirar className="h-full w-full" />
      ) : (
        <MuestraPulsera modelo={modelo} className="p-4" />
      )}
    </div>
  );
}
