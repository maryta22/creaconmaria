"use client";

import { estiloDeCuenta } from "@/lib/cuentas";
import type { CuentaHilo } from "@/lib/hilo/diseno";

/** Qué pasa cuando el cliente toca una cuenta, acá o en el 3D. */
export type ModoEdicion = "pintar" | "insertar" | "quitar";

type Props = {
  paleta: CuentaHilo[];
  /** Índice de paleta de cada cuenta, en el orden en que se ensartan. */
  celdas: number[];
  modo: ModoEdicion;
  onTocar: (posicion: number) => void;
  /** La última cuenta tocada. Se señala para no perderla de vista. */
  activa?: number | null;
};

const VERBO: Record<ModoEdicion, string> = {
  pintar: "Cambiar",
  insertar: "Insertar antes de",
  quitar: "Quitar",
};

/**
 * El hilo estirado y en orden: **una cuenta, un botón**. Es la misma lista que
 * el 3D, plana, para poder tocar una cuenta puntual sin tener que girar la
 * pieza — y en el teléfono es la forma real de editar.
 */
export default function TiraCuentas({ paleta, celdas, modo, onTocar, activa }: Props) {
  if (celdas.length === 0) {
    return (
      <p className="border border-dashed border-linea bg-hueso p-6 text-center text-sm text-humo">
        El hilo está vacío. Elegí una cuenta y tocá <em>Agregar</em>, o completá
        el largo de una vez.
      </p>
    );
  }

  return (
    <div className="max-h-56 overflow-y-auto border border-linea bg-white p-3">
      <div className="flex flex-wrap items-center gap-1">
        {celdas.map((indice, posicion) => {
          const cuenta = paleta[indice];
          if (!cuenta) return null;
          const lado = tamano(cuenta.mm);
          return (
            <button
              key={posicion}
              type="button"
              onClick={() => onTocar(posicion)}
              title={`${cuenta.nombre} · ${cuenta.mm} mm`}
              aria-label={`${VERBO[modo]} la cuenta ${posicion + 1} de ${celdas.length}, ${cuenta.nombre}`}
              className="shrink-0 rounded-full border border-linea transition-transform hover:scale-110"
              style={{
                width: lado,
                height: lado,
                ...estiloDeCuenta(cuenta),
                outline: posicion === activa ? "2px solid var(--color-oro)" : undefined,
                outlineOffset: 2,
                cursor: modo === "quitar" ? "crosshair" : "pointer",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * En pantalla la cuenta no puede medir lo que mide de verdad: una de 4 mm
 * quedaría imposible de tocar. Se respeta la proporción pero con un piso, la
 * misma idea que el radio de las cuadrículas del mapa de tejido.
 */
function tamano(mm: number) {
  return `${Math.min(2.2, Math.max(1.15, mm * 0.16))}rem`;
}

