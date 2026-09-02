"use client";

import { useMemo, useState } from "react";
import FotoProducto from "./FotoProducto";
import Cartera3D from "./Cartera3D";
import { BarraTejido, useTejido } from "./ReproductorTejido";
import { armarLayout, type MedidasCartera } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

export type PatronVitrina = {
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  celdas: number[];
  totalCuentas: number;
};

export default function GaleriaPieza({
  nombre,
  fotos,
  patron,
}: {
  nombre: string;
  fotos: { id: string; url: string; alt: string | null }[];
  patron?: PatronVitrina | null;
}) {
  // Si todavía no hay fotos pero sí patrón, arranca mostrando el 3D.
  const [vista, setVista] = useState<"fotos" | "3d" | "tejido">(
    patron && fotos.length === 0 ? "3d" : "fotos",
  );
  const [principal, setPrincipal] = useState(0);

  const layout = useMemo(
    () => (patron ? armarLayout(patron.medidas) : null),
    [patron],
  );
  const tejido = useTejido(layout?.cuentas.length ?? 0);
  const enTejido = vista === "tejido" && patron && layout;

  return (
    <div>
      {patron && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setVista("fotos")}
            className={vista === "fotos" ? "chip chip-oro" : "chip"}
          >
            Fotos
          </button>
          <button
            type="button"
            onClick={() => setVista("3d")}
            className={vista === "3d" ? "chip chip-oro" : "chip"}
          >
            Ver en 3D
          </button>
          <button
            type="button"
            onClick={() => setVista("tejido")}
            className={vista === "tejido" ? "chip chip-oro" : "chip"}
          >
            Cómo se teje
          </button>
        </div>
      )}

      <div className="aspect-[4/5] overflow-hidden border border-linea bg-white">
        {(vista === "3d" || enTejido) && patron ? (
          <Cartera3D
            medidas={patron.medidas}
            paleta={patron.paleta}
            celdas={patron.celdas}
            autoGirar={vista === "3d"}
            cuentasVisibles={enTejido ? tejido.visibles : undefined}
            className="h-full w-full"
          />
        ) : (
          <FotoProducto
            url={fotos[principal]?.url}
            alt={fotos[principal]?.alt}
            nombre={nombre}
          />
        )}
      </div>

      {enTejido && layout ? (
        <div className="mt-4 border border-linea p-4">
          <BarraTejido tejido={tejido} layout={layout} paleta={patron.paleta} compacta />
          <p className="mt-3 text-xs text-gris">
            Así se arma, en el mismo orden en que María la teje: primero la base,
            después las paredes, la solapa y por último el asa.
          </p>
        </div>
      ) : vista === "3d" && patron ? (
        <p className="mt-3 text-xs text-gris">
          Arrastrá para girarla. Está armada cuenta por cuenta:{" "}
          <span className="tabular-nums">{patron.totalCuentas}</span> cuentas tejidas en cruz.
        </p>
      ) : (
        fotos.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPrincipal(i)}
                className={`aspect-square overflow-hidden border bg-white ${
                  i === principal ? "border-oro" : "border-linea"
                }`}
              >
                <FotoProducto url={f.url} alt={f.alt} nombre={nombre} />
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
