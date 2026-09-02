"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACABADOS_CUENTA, type AcabadoCuenta, type CuentaDisponible } from "@/lib/cuentas";

type CuentaEditable = CuentaDisponible & { activo: boolean };
type FormularioCuenta = Omit<CuentaEditable, "id">;

const VACIA: FormularioCuenta = {
  nombre: "",
  color: "#f4ece0",
  tamanoMm: 6,
  acabado: "perla",
  stock: 0,
  activo: true,
};

export default function GestorCuentas({ iniciales }: { iniciales: CuentaEditable[] }) {
  const router = useRouter();
  const [nueva, setNueva] = useState<FormularioCuenta>(VACIA);
  const [cuentas, setCuentas] = useState(iniciales);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando("nueva");
    setError(null);
    const r = await fetch("/api/cuentas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nueva),
    });
    const json = await r.json().catch(() => ({}));
    if (r.ok) {
      setNueva(VACIA);
      setCuentas((actuales) => [...actuales, json.cuenta as CuentaEditable]);
      router.refresh();
    } else {
      setError(json.error ?? "No se pudo cargar la cuenta");
    }
    setGuardando(null);
  }

  function cambiar(id: string, campo: keyof FormularioCuenta, valor: string | number | boolean) {
    setCuentas((actuales) => actuales.map((cuenta) => cuenta.id === id ? { ...cuenta, [campo]: valor } : cuenta));
  }

  async function guardar(cuenta: CuentaEditable) {
    setGuardando(cuenta.id);
    setError(null);
    const r = await fetch(`/api/cuentas/${cuenta.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuenta),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) setError(json.error ?? "No se pudo guardar la cuenta");
    else router.refresh();
    setGuardando(null);
  }

  async function borrar(cuenta: CuentaEditable) {
    if (!window.confirm(`Borrar ${cuenta.nombre}? Esta accion no se puede deshacer.`)) return;
    setGuardando(cuenta.id);
    const r = await fetch(`/api/cuentas/${cuenta.id}`, { method: "DELETE" });
    if (r.ok) {
      setCuentas((actuales) => actuales.filter((item) => item.id !== cuenta.id));
      router.refresh();
    } else {
      setError("No se pudo borrar la cuenta");
    }
    setGuardando(null);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={crear} className="tarjeta p-6">
        <p className="sobretitulo">Nueva cuenta</p>
        <div className="filete mb-6 mt-2 max-w-[5rem]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Campo etiqueta="Nombre"><input className="campo" value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Perla marfil" required /></Campo>
          <Campo etiqueta="Color"><input className="campo h-11 p-1" type="color" value={nueva.color} onChange={(e) => setNueva({ ...nueva, color: e.target.value })} /></Campo>
          <Campo etiqueta="Tamaño (mm)"><input className="campo" type="number" min="1" step="1" value={nueva.tamanoMm} onChange={(e) => setNueva({ ...nueva, tamanoMm: Number(e.target.value) })} required /></Campo>
          <Campo etiqueta="Acabado"><Acabado valor={nueva.acabado} alCambiar={(acabado) => setNueva({ ...nueva, acabado })} /></Campo>
          <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" step="1" value={nueva.stock} onChange={(e) => setNueva({ ...nueva, stock: Number(e.target.value) })} required /></Campo>
        </div>
        <button type="submit" className="btn mt-5" disabled={guardando === "nueva"}>{guardando === "nueva" ? "Guardando..." : "Agregar al inventario"}</button>
      </form>

      {error && <p className="border border-oro bg-white p-4 text-sm text-oro">{error}</p>}

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <div><p className="sobretitulo">Inventario</p><h2 className="titulo mt-2 text-2xl">Cuentas cargadas</h2></div>
          <p className="text-sm text-humo">{cuentas.length} tipos</p>
        </div>
        <div className="filete mb-6 mt-3 max-w-[6rem]" />
        {cuentas.length === 0 ? (
          <div className="tarjeta p-10 text-center text-humo">Todavia no cargaste cuentas para usar en los diseños.</div>
        ) : (
          <div className="space-y-3">
            {cuentas.map((cuenta) => (
              <article key={cuenta.id} className="tarjeta grid gap-4 p-4 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_6rem_6rem_7rem_auto] sm:items-end">
                <div className="h-12 w-12 rounded-full border border-linea" style={{ background: cuenta.color }} />
                <Campo etiqueta="Nombre"><input className="campo" value={cuenta.nombre} onChange={(e) => cambiar(cuenta.id, "nombre", e.target.value)} /></Campo>
                <Campo etiqueta="Color"><input className="campo h-11 p-1" type="color" value={cuenta.color} onChange={(e) => cambiar(cuenta.id, "color", e.target.value)} /></Campo>
                <Campo etiqueta="Acabado"><Acabado valor={cuenta.acabado} alCambiar={(acabado) => cambiar(cuenta.id, "acabado", acabado)} /></Campo>
                <Campo etiqueta="Tamaño"><input className="campo" type="number" min="1" value={cuenta.tamanoMm} onChange={(e) => cambiar(cuenta.id, "tamanoMm", Number(e.target.value))} /></Campo>
                <Campo etiqueta="Unidades"><input className="campo" type="number" min="0" value={cuenta.stock} onChange={(e) => cambiar(cuenta.id, "stock", Number(e.target.value))} /></Campo>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <label className="flex items-center gap-2 text-xs text-humo"><input type="checkbox" checked={cuenta.activo} onChange={(e) => cambiar(cuenta.id, "activo", e.target.checked)} /> Activa</label>
                  <button type="button" className="btn btn-chico" onClick={() => guardar(cuenta)} disabled={guardando === cuenta.id}>Guardar</button>
                  <button type="button" className="btn btn-linea btn-chico" onClick={() => borrar(cuenta)} disabled={guardando === cuenta.id}>Borrar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div><label className="etiqueta">{etiqueta}</label>{children}</div>;
}

function Acabado({ valor, alCambiar }: { valor: AcabadoCuenta; alCambiar: (valor: AcabadoCuenta) => void }) {
  return <select className="campo" value={valor} onChange={(e) => alCambiar(e.target.value as AcabadoCuenta)}>{ACABADOS_CUENTA.map((acabado) => <option key={acabado} value={acabado}>{acabado}</option>)}</select>;
}
