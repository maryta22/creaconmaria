"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { LineaCarrito, ProductoCarrito } from "@/lib/carrito";

const CLAVE_CARRITO = "crea-con-maria-carrito";

type ContextoCarrito = {
  lineas: LineaCarrito[];
  listo: boolean;
  cantidadTotal: number;
  total: number;
  agregar: (producto: ProductoCarrito) => void;
  cambiarCantidad: (id: string, cantidad: number) => void;
  quitar: (id: string) => void;
  vaciar: () => void;
};

const CarritoContexto = createContext<ContextoCarrito | null>(null);

export function CarritoProveedor({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_CARRITO);
      if (guardado) {
        const valor = JSON.parse(guardado) as unknown;
        if (Array.isArray(valor)) setLineas(valor.filter(esLineaValida));
      }
    } catch {
      // Un carrito corrupto no debe impedir navegar por la tienda.
    } finally {
      setListo(true);
    }
  }, []);

  useEffect(() => {
    if (listo) window.localStorage.setItem(CLAVE_CARRITO, JSON.stringify(lineas));
  }, [lineas, listo]);

  function agregar(producto: ProductoCarrito) {
    if (producto.stock <= 0) return;
    setLineas((actuales) => {
      const existe = actuales.find((linea) => linea.id === producto.id);
      if (!existe) return [...actuales, { ...producto, cantidad: 1 }];
      return actuales.map((linea) =>
        linea.id === producto.id
          ? { ...linea, ...producto, cantidad: Math.min(linea.cantidad + 1, producto.stock) }
          : linea,
      );
    });
  }

  function cambiarCantidad(id: string, cantidad: number) {
    setLineas((actuales) =>
      actuales.flatMap((linea) => {
        if (linea.id !== id) return [linea];
        if (cantidad <= 0) return [];
        return [{ ...linea, cantidad: Math.min(Math.trunc(cantidad), linea.stock) }];
      }),
    );
  }

  const contexto: ContextoCarrito = {
    lineas,
    listo,
    cantidadTotal: lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
    total: lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precio, 0),
    agregar,
    cambiarCantidad,
    quitar: (id) => setLineas((actuales) => actuales.filter((linea) => linea.id !== id)),
    vaciar: () => setLineas([]),
  };

  return <CarritoContexto.Provider value={contexto}>{children}</CarritoContexto.Provider>;
}

export function useCarrito() {
  const contexto = useContext(CarritoContexto);
  if (!contexto) throw new Error("useCarrito debe usarse dentro de CarritoProveedor");
  return contexto;
}

function esLineaValida(valor: unknown): valor is LineaCarrito {
  if (!valor || typeof valor !== "object") return false;
  const linea = valor as Record<string, unknown>;
  return ["id", "slug", "nombre"].every((campo) => typeof linea[campo] === "string")
    && typeof linea.precio === "number"
    && typeof linea.stock === "number"
    && typeof linea.cantidad === "number";
}
