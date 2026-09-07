"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FotoProducto from "@/components/FotoProducto";
import { claveLineaCarrito } from "@/lib/carrito";
import { useCarrito } from "@/components/CarritoProveedor";
import { precio } from "@/lib/formato";

export default function Carrito() {
  const { lineas, listo, cantidadTotal, total, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch("/api/configuracion/whatsapp")
      .then((r) => r.json())
      .then((datos) => setWhatsapp(typeof datos.whatsapp === "string" ? datos.whatsapp : ""))
      .catch(() => setWhatsapp(""));
  }, []);

  if (!listo) return <div className="mx-auto max-w-6xl px-6 py-16 text-humo">Cargando carrito...</div>;

  if (codigoPedido) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="sobretitulo">Pedido enviado</p>
        <h1 className="titulo mt-2 text-4xl">Gracias, {nombre}</h1>
        <div className="filete my-6 max-w-[8rem]" />
        <div className="tarjeta max-w-xl p-6">
          <p className="text-sm text-humo">Tu código de pedido es</p>
          <p className="titulo mt-2 text-3xl tracking-[0.08em]">{codigoPedido}</p>
          <p className="mt-4 text-sm leading-relaxed text-humo">También lo enviamos en el mensaje para María. Guardalo para consultar el estado de tu pedido.</p>
          <Link href={`/consultar-pedido?codigo=${encodeURIComponent(codigoPedido)}`} className="btn mt-6">Consultar pedido</Link>
        </div>
      </div>
    );
  }

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

  async function enviarPedido() {
    setEnviando(true);
    setError(null);
    const r = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        contacto,
        nota,
        lineas: lineas.map((linea) => ({
          id: linea.id,
          cantidad: linea.cantidad,
          personalizacion: linea.personalizacion ? { cuentaId: linea.personalizacion.cuentaId } : undefined,
        })),
      }),
    });
    const pedido = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(pedido.error ?? "No se pudo registrar el pedido");
      setEnviando(false);
      return;
    }
    // Los diseños que armó el cliente viajan con su link: es lo único que
    // tiene María para abrirlos y ver qué cuentas van.
    const detalle = lineas.map((linea) => {
      const personalizada = linea.personalizacion
        ? ` [${linea.personalizacion.cuentaNombre}, ${linea.personalizacion.tamanoMm} mm]`
        : "";
      const fila = `- ${linea.cantidad} x ${linea.nombre}${personalizada}: ${precio(linea.precio * linea.cantidad)}`;
      return linea.enlace ? `${fila}
  ${window.location.origin}${linea.enlace}` : fila;
    });
    const mensaje = [
      `Hola Maria, quiero hacer este pedido (#${pedido.codigo}):`, "", ...detalle, "", `Total estimado: ${precio(total)}`, "",
      `Nombre: ${nombre.trim()}`, `Contacto: ${contacto.trim()}`,
      nota.trim() ? `Nota: ${nota.trim()}` : "", "", "Quedo pendiente de confirmacion de disponibilidad y pago.",
    ].filter(Boolean).join("\n");
    vaciar();
    setCodigoPedido(pedido.codigo);
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
    setEnviando(false);
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
          {lineas.map((linea) => {
            const clave = claveLineaCarrito(linea);
            return (
            <article key={clave} className="flex gap-4 py-4">
              <Link href={linea.enlace ?? `/pieza/${linea.slug}`} className="h-24 w-20 shrink-0 overflow-hidden border border-linea bg-white">
                <FotoProducto url={linea.foto} nombre={linea.nombre} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={linea.enlace ?? `/pieza/${linea.slug}`} className="titulo text-lg hover:text-oro">{linea.nombre}</Link>
                {linea.personalizacion && (
                  <p className="mt-1 flex items-center gap-2 text-xs text-humo">
                    <span className="h-3 w-3 rounded-full border border-linea" style={{ background: linea.personalizacion.color }} />
                    Cuenta elegida: {linea.personalizacion.cuentaNombre} ({linea.personalizacion.tamanoMm} mm)
                  </p>
                )}
                <p className="precio mt-1">{precio(linea.precio)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="sr-only" htmlFor={`cantidad-${clave}`}>Cantidad de {linea.nombre}</label>
                  <button type="button" className="h-8 w-8 border border-linea" onClick={() => cambiarCantidad(clave, linea.cantidad - 1)} aria-label={`Quitar una ${linea.nombre}`}>-</button>
                  <input id={`cantidad-${clave}`} className="h-8 w-10 border-y border-linea text-center text-sm" type="number" min={1} max={linea.stock} value={linea.cantidad} onChange={(e) => cambiarCantidad(clave, Number(e.target.value))} />
                  <button type="button" className="h-8 w-8 border border-linea" onClick={() => cambiarCantidad(clave, linea.cantidad + 1)} disabled={linea.cantidad >= linea.stock} aria-label={`Agregar una ${linea.nombre}`}>+</button>
                  <button type="button" onClick={() => quitar(clave)} className="ml-2 text-xs uppercase tracking-[0.12em] text-humo underline hover:text-tinta">Quitar</button>
                </div>
              </div>
              <p className="precio shrink-0">{precio(linea.precio * linea.cantidad)}</p>
            </article>
            );
          })}
        </section>

        <aside className="tarjeta h-fit p-5 lg:sticky lg:top-6">
          <p className="sobretitulo">Enviar pedido</p>
          <div className="filete mb-5 mt-2 max-w-[6rem]" />
          <div className="mb-5 flex justify-between text-sm"><span className="text-humo">{cantidadTotal} piezas</span><span className="precio">{precio(total)}</span></div>
          <div className="space-y-4">
            <div><label className="etiqueta" htmlFor="nombre">Tu nombre</label><input id="nombre" className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div><label className="etiqueta" htmlFor="contacto">Número de teléfono</label><input id="contacto" className="campo" type="tel" value={contacto} onChange={(e) => setContacto(e.target.value)} required /></div>
            <div><label className="etiqueta" htmlFor="nota">Nota (opcional)</label><textarea id="nota" className="campo min-h-24 resize-y" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Color, entrega o cualquier detalle" /></div>
          </div>
          {whatsapp ? (
            <button type="button" className="btn mt-6 w-full" onClick={enviarPedido} disabled={enviando || !nombre.trim() || !contacto.trim()}>{enviando ? "Enviando pedido..." : "Enviar pedido por WhatsApp"}</button>
          ) : (
            <p className="mt-6 border border-oro bg-hueso p-3 text-sm text-humo">Falta configurar el WhatsApp de la vendedora.</p>
          )}
          {error && <p className="mt-4 border border-oro bg-hueso p-3 text-sm text-humo">{error}</p>}
          <p className="mt-4 text-xs leading-relaxed text-gris">El pedido queda sujeto a confirmacion de disponibilidad y pago por parte de Maria.</p>
        </aside>
      </div>
    </div>
  );
}
