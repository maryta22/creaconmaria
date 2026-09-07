"use client";

import { useState } from "react";

const ESTADOS = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"] as const;

function etiqueta(estado: string) {
  return estado.replaceAll("_", " ").toLowerCase();
}

export default function EstadoPedido({ codigo, inicial }: { codigo: string; inicial: string }) {
  const [estado, setEstado] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiar(nuevo: string) {
    setEstado(nuevo);
    setGuardando(true);
    setError(null);
    const r = await fetch(`/api/pedidos/${encodeURIComponent(codigo)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevo }),
    });
    if (!r.ok) {
      setEstado(inicial);
      setError("No se pudo guardar");
    }
    setGuardando(false);
  }

  return (
    <div className="text-right">
      <label className="sr-only" htmlFor={`estado-${codigo}`}>Estado del pedido</label>
      <select id={`estado-${codigo}`} className="campo min-w-36 py-1.5 text-xs uppercase" value={estado} onChange={(e) => cambiar(e.target.value)} disabled={guardando}>
        {ESTADOS.map((item) => <option key={item} value={item}>{etiqueta(item)}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-oro">{error}</p>}
    </div>
  );
}
