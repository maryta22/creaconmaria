"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { CATEGORIAS, categoriaPorId } from "@/lib/categorias";
import { precio as fmtPrecio } from "@/lib/formato";
import FotoProducto from "./FotoProducto";

export type ValoresProducto = {
  id?: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  materiales: string;
  color: string;
  largoCm: string;
  anchoCm: string;
  altoCm: string;
  profundidadCm: string;
  cuentaMm: string;
  ajustable: boolean;
  extensionCm: string;
  costo: string;
  precio: string;
  stock: string;
  destacado: boolean;
  publicado: boolean;
  notaInterna: string;
  fotos: { url: string; alt: string | null }[];
};

export const VACIO: ValoresProducto = {
  nombre: "",
  categoria: "PULSERA",
  descripcion: "",
  materiales: "",
  color: "",
  largoCm: "",
  anchoCm: "",
  altoCm: "",
  profundidadCm: "",
  cuentaMm: "",
  ajustable: false,
  extensionCm: "",
  costo: "",
  precio: "",
  stock: "1",
  destacado: false,
  publicado: true,
  notaInterna: "",
  fotos: [],
};

/** Cómo se llama y qué unidad tiene cada campo de medida. */
const CAMPOS_MEDIDA: Record<string, { etiqueta: string; ayuda?: string }> = {
  largoCm: { etiqueta: "Largo (cm)", ayuda: "De punta a punta, cerrada." },
  anchoCm: { etiqueta: "Ancho (cm)" },
  altoCm: { etiqueta: "Alto (cm)" },
  profundidadCm: { etiqueta: "Profundidad (cm)" },
  cuentaMm: { etiqueta: "Cuenta (mm)", ayuda: "Diámetro de la cuenta principal." },
  extensionCm: { etiqueta: "Extensión (cm)" },
};

export default function FormProducto({ inicial }: { inicial: ValoresProducto }) {
  const router = useRouter();
  const [v, setV] = useState<ValoresProducto>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputFoto = useRef<HTMLInputElement>(null);

  const categoria = categoriaPorId(v.categoria);
  const esCartera = v.categoria === "CARTERA";
  const admiteExtension = (categoria?.medidas as readonly string[] | undefined)?.includes("extensionCm") ?? false;

  const margen = useMemo(() => {
    const p = Number(v.precio) || 0;
    const c = Number(v.costo) || 0;
    if (p <= 0) return null;
    return { ganancia: p - c, porcentaje: Math.round(((p - c) / p) * 100) };
  }, [v.precio, v.costo]);

  function set<K extends keyof ValoresProducto>(campo: K, valor: ValoresProducto[K]) {
    setV((previo) => ({ ...previo, [campo]: valor }));
  }

  async function subirFoto(archivo: File) {
    setSubiendo(true);
    setError(null);
    const datos = new FormData();
    datos.append("archivo", archivo);
    const r = await fetch("/api/subir", { method: "POST", body: datos });
    const json = await r.json();
    if (r.ok) {
      setV((previo) => ({ ...previo, fotos: [...previo.fotos, { url: json.url, alt: null }] }));
    } else {
      setError(json.error ?? "No se pudo subir la foto");
    }
    setSubiendo(false);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const destino = v.id ? `/api/productos/${v.id}` : "/api/productos";
    const r = await fetch(destino, {
      method: v.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const json = await r.json().catch(() => ({}));

    if (r.ok) {
      router.push("/admin/stock");
      router.refresh();
    } else {
      setError(json.error ?? "No se pudo guardar");
      setGuardando(false);
    }
  }

  async function borrar() {
    if (!v.id) return;
    if (!confirm(`¿Borrar "${v.nombre}"? No se puede deshacer.`)) return;
    setGuardando(true);
    await fetch(`/api/productos/${v.id}`, { method: "DELETE" });
    router.push("/admin/stock");
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-10">
        {/* Identidad */}
        <section className="tarjeta p-6">
          <p className="sobretitulo">La pieza</p>
          <div className="filete mb-6 mt-2 max-w-[5rem]" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="etiqueta" htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                className="campo"
                value={v.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Cartera Perlada Marfil"
                required
              />
            </div>

            <div>
              <label className="etiqueta" htmlFor="categoria">Línea</label>
              <select
                id="categoria"
                className="campo"
                value={v.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="etiqueta" htmlFor="color">Color</label>
              <input
                id="color"
                className="campo"
                value={v.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="Marfil con rosa pastel"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="etiqueta" htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                className="campo min-h-24"
                value={v.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Lo que ve el cliente en la ficha."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="etiqueta" htmlFor="materiales">Materiales</label>
              <input
                id="materiales"
                className="campo"
                value={v.materiales}
                onChange={(e) => set("materiales", e.target.value)}
                placeholder="Perlas acrílicas 10 mm, cuentas 6 mm, hilo nylon"
              />
            </div>
          </div>
        </section>

        {/* Medidas */}
        <section className="tarjeta p-6">
          <p className="sobretitulo">Medidas</p>
          <div className="filete mb-2 mt-2 max-w-[5rem]" />
          <p className="mb-6 text-xs text-gris">
            {esCartera
              ? "Las carteras se muestran como ancho × alto × profundidad."
              : "El largo es lo que ve el cliente en la tarjeta del catálogo."}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {categoria?.medidas
              .filter((campo) => campo !== "extensionCm")
              .map((campo) => (
                <div key={campo}>
                  <label className="etiqueta" htmlFor={campo}>
                    {CAMPOS_MEDIDA[campo].etiqueta}
                  </label>
                  <input
                    id={campo}
                    type="number"
                    step="0.1"
                    min="0"
                    className="campo"
                    value={v[campo as keyof ValoresProducto] as string}
                    onChange={(e) => set(campo as keyof ValoresProducto, e.target.value as never)}
                  />
                  {CAMPOS_MEDIDA[campo].ayuda && (
                    <p className="mt-1 text-xs text-gris">{CAMPOS_MEDIDA[campo].ayuda}</p>
                  )}
                </div>
              ))}

            {esCartera && (
              <div>
                <label className="etiqueta" htmlFor="largoCm">Largo del asa (cm)</label>
                <input
                  id="largoCm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="campo"
                  value={v.largoCm}
                  onChange={(e) => set("largoCm", e.target.value)}
                />
              </div>
            )}
          </div>

          {admiteExtension && (
            <div className="mt-6 border-t border-linea pt-6">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={v.ajustable}
                  onChange={(e) => set("ajustable", e.target.checked)}
                />
                Tiene extensión regulable
              </label>
              {v.ajustable && (
                <div className="mt-4 max-w-[12rem]">
                  <label className="etiqueta" htmlFor="extensionCm">Extensión (cm)</label>
                  <input
                    id="extensionCm"
                    type="number"
                    step="0.1"
                    min="0"
                    className="campo"
                    value={v.extensionCm}
                    onChange={(e) => set("extensionCm", e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Fotos */}
        <section className="tarjeta p-6">
          <p className="sobretitulo">Fotos</p>
          <div className="filete mb-2 mt-2 max-w-[5rem]" />
          <p className="mb-6 text-xs text-gris">La primera es la que se ve en el catálogo.</p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {v.fotos.map((f, i) => (
              <div key={f.url} className="group relative aspect-square overflow-hidden border border-linea">
                <FotoProducto url={f.url} nombre={v.nombre || "Pieza"} />
                {i === 0 && (
                  <span className="absolute left-1 top-1 bg-tinta px-1.5 py-0.5 text-[0.6875rem] uppercase tracking-wider text-papel">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => set("fotos", v.fotos.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 bg-tinta px-1.5 py-0.5 text-[0.6875rem] uppercase text-papel opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Quitar
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => inputFoto.current?.click()}
              disabled={subiendo}
              className="flex aspect-square items-center justify-center border border-dashed border-linea text-xs uppercase tracking-[0.12em] text-gris hover:border-oro hover:text-oro"
            >
              {subiendo ? "Subiendo…" : "+ Foto"}
            </button>
          </div>

          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subirFoto(archivo);
              e.target.value = "";
            }}
          />
        </section>
      </div>

      {/* Columna de plata y estado */}
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="tarjeta p-6">
          <p className="sobretitulo">Plata</p>
          <div className="filete mb-6 mt-2 max-w-[5rem]" />

          <div className="space-y-4">
            <div>
              <label className="etiqueta" htmlFor="costo">Costo (lo que te sale)</label>
              <input
                id="costo"
                type="number"
                step="0.01"
                min="0"
                className="campo"
                value={v.costo}
                onChange={(e) => set("costo", e.target.value)}
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="precio">Precio de venta</label>
              <input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                className="campo"
                value={v.precio}
                onChange={(e) => set("precio", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="stock">Unidades que tenés</label>
              <input
                id="stock"
                type="number"
                step="1"
                min="0"
                className="campo"
                value={v.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </div>
          </div>

          {margen && (
            <p className="mt-5 border-t border-linea pt-4 text-sm text-humo">
              Ganás <strong className="text-tinta">{fmtPrecio(margen.ganancia)}</strong> por
              pieza <span className="text-gris">({margen.porcentaje}%)</span>
            </p>
          )}
        </section>

        <section className="tarjeta p-6">
          <p className="sobretitulo">Estado</p>
          <div className="filete mb-6 mt-2 max-w-[5rem]" />

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={v.publicado}
              onChange={(e) => set("publicado", e.target.checked)}
            />
            Visible en la tienda
          </label>
          <label className="mt-3 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={v.destacado}
              onChange={(e) => set("destacado", e.target.checked)}
            />
            Destacar en la portada
          </label>

          <div className="mt-5">
            <label className="etiqueta" htmlFor="notaInterna">Nota interna</label>
            <textarea
              id="notaInterna"
              className="campo min-h-20"
              value={v.notaInterna}
              onChange={(e) => set("notaInterna", e.target.value)}
              placeholder="Dónde está guardada, de qué lote salió… no lo ve el cliente."
            />
          </div>
        </section>

        {error && <p className="border border-oro bg-white p-4 text-sm text-oro">{error}</p>}

        <div className="space-y-3">
          <button type="submit" className="btn w-full" disabled={guardando}>
            {guardando ? "Guardando…" : v.id ? "Guardar cambios" : "Cargar pieza"}
          </button>
          {v.id && (
            <button type="button" onClick={borrar} className="btn btn-linea btn-chico w-full">
              Borrar pieza
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}
