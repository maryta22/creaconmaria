"use client";

import Link from "next/link";
import { useState } from "react";
import FotoProducto from "@/components/FotoProducto";
import { useCarrito } from "@/components/CarritoProveedor";
import { precio } from "@/lib/formato";

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_VENDEDORA ?? "").replace(/\D/g, "");

export default function Carrito() {
  const { lineas, listo, cantidadTotal, total, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [nota, setNota] = useState("");

  if (!listo) return <div className="mx-auto max-w-6xl px-6 py-16 text-humo">Cargando carrito...</div>;

  if (lineas.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="sobretitulo">Carrito</p>
        <h1 className="titulo mt-2 text-4xl">Todavia no elegiste piezas</h1>
        <p className="mt-4 max-w-lg text-humo">Recorre el catalogo y agrega las piezas que te gusten para armar tu pedido.</p>
        <Link href="/catalogo" className="btn mt-8">Ver el catalogo</Link>
      </div>
    );
  }

  function enviarPedido() {
    const detalle = lineas.map((linea) => `- ${linea.cantidad} x ${linea.nombre}: ${precio(linea.precio * linea.cantidad)}`);
    const mensaje = [
      "Hola Maria, quiero hacer este pedido:", "", ...detalle, "", `Total estimado: ${precio(total)}`, "",
      `Nombre: ${nombre.trim()}`, `Contacto: ${contacto.trim()}`,
      nota.trim() ? `Nota: ${nota.trim()}` : "", "", "Quedo pendiente de confirmacion de disponibilidad y pago.",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="sobretitulo">Pedido</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="titulo text-4xl">Tu carrito</h1>
        <button type="button" onClick={vaciar} className="text-sm text-humo underline hover:text-tinta">Vaciar carrito</button>
      </div>
      <div className="filete mb-8 mt-5 max-w-[8rem]" />

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <section className="divide-y divide-linea border-y border-linea">
          {lineas.map((linea) => (
            <article key={linea.id} className="flex gap-4 py-4">
              <Link href={`/pieza/${linea.slug}`} className="h-24 w-20 shrink-0 overflow-hidden border border-linea bg-white">
                <FotoProducto url={linea.foto} nombre={linea.nombre} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/pieza/${linea.slug}`} className="titulo text-lg hover:text-oro">{linea.nombre}</Link>
                <p className="precio mt-1">{precio(linea.precio)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="sr-only" htmlFor={`cantidad-${linea.id}`}>Cantidad de {linea.nombre}</label>
                  <button type="button" className="h-8 w-8 border border-linea" onClick={() => cambiarCantidad(linea.id, linea.cantidad - 1)} aria-label={`Quitar una ${linea.nombre}`}>-</button>
                  <input id={`cantidad-${linea.id}`} className="h-8 w-10 border-y border-linea text-center text-sm" type="number" min={1} max={linea.stock} value={linea.cantidad} onChange={(e) => cambiarCantidad(linea.id, Number(e.target.value))} />
                  <button type="button" className="h-8 w-8 border border-linea" onClick={() => cambiarCantidad(linea.id, linea.cantidad + 1)} disabled={linea.cantidad >= linea.stock} aria-label={`Agregar una ${linea.nombre}`}>+</button>
                  <button type="button" onClick={() => quitar(linea.id)} className="ml-2 text-xs uppercase tracking-[0.12em] text-humo underline hover:text-tinta">Quitar</button>
                </div>
              </div>
              <p className="precio shrink-0">{precio(linea.precio * linea.cantidad)}</p>
            </article>
          ))}
        </section>

        <aside className="tarjeta h-fit p-5 lg:sticky lg:top-6">
          <p className="sobretitulo">Enviar pedido</p>
          <div className="filete mb-5 mt-2 max-w-[6rem]" />
          <div className="mb-5 flex justify-between text-sm"><span className="text-humo">{cantidadTotal} piezas</span><span className="precio">{precio(total)}</span></div>
          <div className="space-y-4">
            <div><label className="etiqueta" htmlFor="nombre">Tu nombre</label><input id="nombre" className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div><label className="etiqueta" htmlFor="contacto">Telefono o Instagram</label><input id="contacto" className="campo" value={contacto} onChange={(e) => setContacto(e.target.value)} /></div>
            <div><label className="etiqueta" htmlFor="nota">Nota (opcional)</label><textarea id="nota" className="campo min-h-24 resize-y" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Color, entrega o cualquier detalle" /></div>
          </div>
          {WHATSAPP ? (
            <button type="button" className="btn mt-6 w-full" onClick={enviarPedido} disabled={!nombre.trim() || !contacto.trim()}>Enviar pedido por WhatsApp</button>
          ) : (
            <p className="mt-6 border border-oro bg-hueso p-3 text-sm text-humo">Falta configurar el WhatsApp de la vendedora.</p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-gris">El pedido queda sujeto a confirmacion de disponibilidad y pago por parte de Maria.</p>
        </aside>
      </div>
    </div>
  );
}
