"use client";

import { estiloDeCuenta } from "@/lib/cuentas";
import { MEDIDAS_CARTERA } from "@/lib/cartera/medida";
import { createContext, useContext, useState } from "react";
import BotonAgregarCarrito from "./BotonAgregarCarrito";
import type { ProductoCarrito } from "@/lib/carrito";

type CuentaElegible = {
  id: string;
  nombre: string;
  color: string;
  tamanoMm: number;
  acabado: string;
  stock: number;
};

type ContextoPersonalizacion = {
  cuenta: CuentaElegible | null;
  /** Con qué cuenta se teje. Cambiarla cambia el conteo de toda la pieza. */
  tamanoMm: number;
  seleccionar: (cuenta: CuentaElegible) => void;
  elegirMedida: (mm: number) => void;
};

const PersonalizacionContexto = createContext<ContextoPersonalizacion | null>(null);

export function PersonalizacionCarteraProveedor({
  medidaInicial,
  children,
}: {
  medidaInicial: number;
  children: React.ReactNode;
}) {
  const [cuenta, seleccionar] = useState<CuentaElegible | null>(null);
  const [tamanoMm, setTamano] = useState(medidaInicial);
  /**
   * Al cambiar de medida se **suelta la cuenta elegida**: era de la medida
   * anterior y no existe en la nueva. Dejarla puesta pintaba la cartera de un
   * color que ya no estaba en la lista.
   */
  const elegirMedida = (mm: number) => {
    setTamano(mm);
    seleccionar((actual) => (actual && actual.tamanoMm === mm ? actual : null));
  };
  return (
    <PersonalizacionContexto.Provider value={{ cuenta, tamanoMm, seleccionar, elegirMedida }}>
      {children}
    </PersonalizacionContexto.Provider>
  );
}

export function usePersonalizacionCartera() {
  return useContext(PersonalizacionContexto);
}

export default function SelectorCuentaCartera({
  producto,
  cuentas,
}: {
  producto: ProductoCarrito;
  cuentas: CuentaElegible[];
}) {
  const contexto = usePersonalizacionCartera();
  const tamanoMm = contexto?.tamanoMm ?? cuentas[0]?.tamanoMm ?? 8;
  /**
   * **La lista sigue a la medida elegida.** Una cartera de 8 mm y la misma de
   * 10 no llevan las mismas cuentas: el conteo cambia y el inventario también,
   * así que ofrecer un color que no existe en esa medida es ofrecer algo que no
   * se puede tejer.
   */
  const deLaMedida = cuentas.filter((c) => c.tamanoMm === tamanoMm);
  const medidas = MEDIDAS_CARTERA.filter((mm) => cuentas.some((c) => c.tamanoMm === mm));
  const cuenta = contexto?.cuenta ?? deLaMedida[0];

  if (!cuenta) return <BotonAgregarCarrito producto={producto} />;

  return (
    <section className="mt-8 max-w-sm">
      <div className="border-l-2 border-oro pl-4">
        <p className="sobretitulo">Elegí tus cuentas</p>
        <p className="mt-2 text-sm text-humo">La medida de la cuenta y su color.</p>
      </div>

      {medidas.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-gris">Medida</p>
          <div className="flex flex-wrap gap-2">
            {medidas.map((mm) => (
              <button
                key={mm}
                type="button"
                onClick={() => contexto?.elegirMedida(mm)}
                className={mm === tamanoMm ? "chip chip-oro" : "chip"}
              >
                {mm} mm
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gris">
            Con la cuenta más grande la cartera lleva menos cuentas y el tejido
            se ve más marcado. La medida no cambia el tamaño de la cartera.
          </p>
        </div>
      )}
      {/*
        La lista tiene todo el inventario: sin techo, estiraba la ficha a
        varias pantallas y empujaba la cartera fuera de la vista. Con su propio
        alto y su scroll, la ficha vuelve a caber.
      */}
      <div className="mt-4 flex max-h-72 flex-wrap gap-2 overflow-y-auto pr-1">
        {deLaMedida.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            onClick={() => contexto?.seleccionar(opcion)}
            className={`flex items-center gap-2 rounded-full border px-3 py-2 text-left ${opcion.id === cuenta.id ? "border-oro bg-hueso" : "border-linea bg-white hover:border-oro"}`}
          >
            <span className="h-6 w-6 shrink-0 rounded-full border border-linea" style={estiloDeCuenta(opcion)} />
            <span className="text-xs leading-snug">{opcion.nombre}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <BotonAgregarCarrito
          producto={{
            ...producto,
            personalizacion: {
              cuentaId: cuenta.id,
              cuentaNombre: cuenta.nombre,
              color: cuenta.color,
              tamanoMm: cuenta.tamanoMm,
            },
          }}
        />
      </div>
    </section>
  );
}
