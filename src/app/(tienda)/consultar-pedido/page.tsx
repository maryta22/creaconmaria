"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { precio } from "@/lib/formato";

type PedidoConsultado = {
  codigo: string;
  nombre: string;
  total: number;
  estado: string;
  creadoEn: string;
  lineas: string;
};

type LineaPedido = { nombre: string; cantidad: number; precio: number };

function etiquetaEstado(estado: string) {
  return estado.replaceAll("_", " ").toLowerCase();
}

export default function ConsultarPedido() {
  const inicial = useSearchParams().get("codigo") ?? "";
  const [codigo, setCodigo] = useState(inicial);
  const [pedido, setPedido] = useState<PedidoConsultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setError(null);
    setPedido(null);
    const r = await fetch(`/api/pedidos/${encodeURIComponent(codigo.trim().toUpperCase())}`);
    const json = await r.json().catch(() => ({}));
    if (r.ok) setPedido(json as PedidoConsultado);
    else setError(json.error ?? "No se pudo consultar el pedido");
    setBuscando(false);
  }

  const lineas = pedido ? JSON.parse(pedido.lineas) as LineaPedido[] : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="sobretitulo">Seguimiento</p>
      <h1 className="titulo mt-2 text-4xl">Consultar pedido</h1>
      <p className="mt-4 text-humo">Ingresá el código que recibiste al enviar tu pedido.</p>
      <div className="filete my-6 max-w-[8rem]" />

      <form onSubmit={consultar} className="tarjeta flex flex-col gap-3 p-5 sm:flex-row">
        <label className="sr-only" htmlFor="codigo">Código de pedido</label>
        <input id="codigo" className="campo flex-1 uppercase" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="M-123ABC456DEF" required />
        <button type="submit" className="btn shrink-0" disabled={buscando}>{buscando ? "Buscando..." : "Consultar"}</button>
      </form>

      {error && <p className="mt-5 border border-oro bg-hueso p-4 text-sm text-humo">{error}</p>}

      {pedido && (
        <section className="tarjeta mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="sobretitulo">Pedido</p><h2 className="titulo mt-1 text-2xl">{pedido.codigo}</h2></div>
            <span className="chip chip-oro">{etiquetaEstado(pedido.estado)}</span>
          </div>
          <p className="mt-4 text-sm text-humo">Hola, {pedido.nombre}. Este es el estado actual de tu pedido.</p>
          <ul className="mt-5 divide-y divide-linea border-y border-linea text-sm">
            {lineas.map((linea, indice) => <li key={`${linea.nombre}-${indice}`} className="flex justify-between gap-4 py-2.5"><span>{linea.cantidad} × {linea.nombre}</span><span>{precio(linea.cantidad * linea.precio)}</span></li>)}
          </ul>
          <p className="precio mt-4 text-right">Total: {precio(pedido.total)}</p>
        </section>
      )}
    </div>
  );
}
