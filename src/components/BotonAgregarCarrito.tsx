"use client";

import { useState } from "react";
import { useCarrito } from "./CarritoProveedor";
import type { ProductoCarrito } from "@/lib/carrito";

export default function BotonAgregarCarrito({ producto, compacto = false }: {
  producto: ProductoCarrito;
  compacto?: boolean;
}) {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const agotado = producto.stock <= 0;

  function agregarAlCarrito() {
    agregar(producto);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1800);
  }

  return (
    <button type="button" onClick={agregarAlCarrito} disabled={agotado} className={`btn ${compacto ? "btn-chico w-full" : "w-full"}`}>
      {agotado ? "Agotada" : agregado ? "Agregada al carrito" : "Agregar al carrito"}
    </button>
  );
}
