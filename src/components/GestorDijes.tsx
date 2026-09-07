"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DijeDisponible } from "@/lib/dijes";
import FotoProducto from "./FotoProducto";

const VACIO = { nombre: "", descripcion: "", imagenUrl: "", stock: 0, activo: true };

export default function GestorDijes({ iniciales }: { iniciales: DijeDisponible[] }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState(VACIO);
  const [dijes, setDijes] = useState(iniciales);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
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

  async function subirImagen(archivo: File) {
    const datos = new FormData();
    datos.append("archivo", archivo);
    const r = await fetch("/api/subir", { method: "POST", body: datos });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.error ?? "No se pudo subir la imagen");
    return json.url as string;
  }

  async function subirImagenNueva(archivo: File) {
    setSubiendo("nuevo");
    setError(null);
    try {
      const imagenUrl = await subirImagen(archivo);
      setNuevo((actual) => ({ ...actual, imagenUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    }
    setSubiendo(null);
  }

  async function subirImagenDije(archivo: File, id: string) {
    setSubiendo(id);
    setError(null);
    try {
      const imagenUrl = await subirImagen(archivo);
      cambiar(id, "imagenUrl", imagenUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    }
    setSubiendo(null);
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

      <form onSubmit={crear} className="tarjeta grid gap-4 p-5 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_7rem_auto] sm:items-end">
        <div className="h-16 w-16 overflow-hidden border border-linea bg-hueso"><FotoProducto url={nuevo.imagenUrl || undefined} nombre={nuevo.nombre || "Dije"} /></div>
        <Campo etiqueta="Nombre"><input className="campo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Dijes de pan mixtos" required /></Campo>
        <Campo etiqueta="Detalle"><input className="campo" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} placeholder="Resina, estilos variados" /></Campo>
        <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: Number(e.target.value) })} required /></Campo>
        <div className="flex flex-wrap gap-2"><label className="btn btn-linea btn-chico cursor-pointer"><input className="sr-only" type="file" accept="image/*" onChange={(e) => { const archivo = e.target.files?.[0]; if (archivo) subirImagenNueva(archivo); e.target.value = ""; }} />{subiendo === "nuevo" ? "Subiendo..." : "Imagen"}</label><button type="submit" className="btn btn-chico" disabled={guardando === "nuevo"}>{guardando === "nuevo" ? "Guardando..." : "Agregar"}</button></div>
      </form>

      {error && <p className="mt-4 border border-oro bg-white p-4 text-sm text-oro">{error}</p>}

      <div className="mt-4 space-y-3">
        {dijes.map((dije) => (
          <article key={dije.id} className="tarjeta grid gap-4 p-4 sm:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_6rem_auto] sm:items-end">
            <div className="h-16 w-16 overflow-hidden border border-linea bg-hueso"><FotoProducto url={dije.imagenUrl ?? undefined} nombre={dije.nombre} /></div>
            <Campo etiqueta="Nombre"><input className="campo" value={dije.nombre} onChange={(e) => cambiar(dije.id, "nombre", e.target.value)} /></Campo>
            <Campo etiqueta="Detalle"><input className="campo" value={dije.descripcion ?? ""} onChange={(e) => cambiar(dije.id, "descripcion", e.target.value)} /></Campo>
            <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" value={dije.stock} onChange={(e) => cambiar(dije.id, "stock", Number(e.target.value))} /></Campo>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <label className="btn btn-linea btn-chico cursor-pointer"><input className="sr-only" type="file" accept="image/*" onChange={(e) => { const archivo = e.target.files?.[0]; if (archivo) subirImagenDije(archivo, dije.id); e.target.value = ""; }} />{subiendo === dije.id ? "Subiendo..." : "Imagen"}</label>
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
