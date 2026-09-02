"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DijeDisponible } from "@/lib/dijes";

const VACIO = { nombre: "", descripcion: "", stock: 0, activo: true };

export default function GestorDijes({ iniciales }: { iniciales: DijeDisponible[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(VACIO);
  const [dijes, setDijes] = useState(iniciales);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando("nuevo");
    setError(null);
    const r = await fetch("/api/dijes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevo) });
    const json = await r.json().catch(() => ({}));
    if (r.ok) {
      setDijes((actuales) => [...actuales, json.dije as DijeDisponible]);
      setNuevo(VACIO);
      router.refresh();
    } else setError(json.error ?? "No se pudo cargar el dije");
    setGuardando(null);
  }

  function cambiar(id: string, campo: keyof Omit<DijeDisponible, "id">, valor: string | number | boolean | null) {
    setDijes((actuales) => actuales.map((dije) => dije.id === id ? { ...dije, [campo]: valor } : dije));
  }

  async function guardar(dije: DijeDisponible) {
    setGuardando(dije.id);
    setError(null);
    const r = await fetch(`/api/dijes/${dije.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dije) });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) setError(json.error ?? "No se pudo guardar el dije");
    else router.refresh();
    setGuardando(null);
  }

  async function borrar(dije: DijeDisponible) {
    if (!window.confirm(`Borrar ${dije.nombre}? Esta accion no se puede deshacer.`)) return;
    setGuardando(dije.id);
    const r = await fetch(`/api/dijes/${dije.id}`, { method: "DELETE" });
    if (r.ok) {
      setDijes((actuales) => actuales.filter((item) => item.id !== dije.id));
      router.refresh();
    } else setError("No se pudo borrar el dije");
    setGuardando(null);
  }

  return (
    <section>
      <p className="sobretitulo">Dijes</p>
      <h2 className="titulo mt-2 text-2xl">Dijes y colgantes</h2>
      <p className="mt-2 text-sm text-humo">Insumos decorativos que se manejan por separado de las cuentas de tejido.</p>
      <div className="filete mb-6 mt-3 max-w-[6rem]" />

      <form onSubmit={crear} className="tarjeta grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto] sm:items-end">
        <Campo etiqueta="Nombre"><input className="campo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Dijes de pan mixtos" required /></Campo>
        <Campo etiqueta="Detalle"><input className="campo" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Resina, estilos variados" /></Campo>
        <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: Number(e.target.value) })} required /></Campo>
        <button type="submit" className="btn btn-chico" disabled={guardando === "nuevo"}>{guardando === "nuevo" ? "Guardando..." : "Agregar dije"}</button>
      </form>

      {error && <p className="mt-4 border border-oro bg-white p-4 text-sm text-oro">{error}</p>}

      <div className="mt-4 space-y-3">
        {dijes.map((dije) => (
          <article key={dije.id} className="tarjeta grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_auto] sm:items-end">
            <Campo etiqueta="Nombre"><input className="campo" value={dije.nombre} onChange={(e) => cambiar(dije.id, "nombre", e.target.value)} /></Campo>
            <Campo etiqueta="Detalle"><input className="campo" value={dije.descripcion ?? ""} onChange={(e) => cambiar(dije.id, "descripcion", e.target.value)} /></Campo>
            <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" value={dije.stock} onChange={(e) => cambiar(dije.id, "stock", Number(e.target.value))} /></Campo>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <label className="flex items-center gap-2 text-xs text-humo"><input type="checkbox" checked={dije.activo} onChange={(e) => cambiar(dije.id, "activo", e.target.checked)} /> Activo</label>
              <button type="button" className="btn btn-chico" onClick={() => guardar(dije)} disabled={guardando === dije.id}>Guardar</button>
              <button type="button" className="btn btn-linea btn-chico" onClick={() => borrar(dije)} disabled={guardando === dije.id}>Borrar</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div><label className="etiqueta">{etiqueta}</label>{children}</div>;
}
