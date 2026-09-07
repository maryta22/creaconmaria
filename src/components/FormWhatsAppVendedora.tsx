"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FormWhatsAppVendedora({ inicial }: { inicial: string }) {
  const [abierto, setAbierto] = useState(false);
  const [whatsapp, setWhatsapp] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    const r = await fetch("/api/configuracion/whatsapp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp }),
    });
    const json = await r.json().catch(() => ({}));
    setAviso(r.ok ? "Número guardado." : (json.error ?? "No se pudo guardar"));
    setGuardando(false);
  }

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-linea">
        Configurar WhatsApp
      </button>

      {abierto && montado && createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-tinta/60 p-6" role="presentation" onMouseDown={() => setAbierto(false)}>
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto border border-linea bg-papel p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-whatsapp" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="sobretitulo">Recepción de pedidos</p>
                <h2 id="titulo-whatsapp" className="titulo mt-2 text-2xl">WhatsApp de la vendedora</h2>
              </div>
              <button type="button" onClick={() => setAbierto(false)} className="h-8 w-8 border border-linea text-lg text-humo hover:border-tinta hover:text-tinta" aria-label="Cerrar">×</button>
            </div>
            <div className="filete mb-5 mt-4 max-w-[5rem]" />
            <form onSubmit={guardar}>
              <label className="etiqueta" htmlFor="whatsapp">Número de WhatsApp</label>
              <input id="whatsapp" className="campo" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="593999999999" required />
              <p className="mt-2 text-xs text-gris">Incluí el código de país, sin +, espacios ni guiones.</p>
              {aviso && <p className="mt-4 border border-oro bg-hueso p-3 text-sm text-humo">{aviso}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn btn-linea" onClick={() => setAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar número"}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
