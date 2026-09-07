"use client";

import { estiloDeCuenta } from "@/lib/cuentas";
import Link from "next/link";
import { useMemo, useState } from "react";
import Hilo3D from "./Hilo3DCliente";
import TejidoPulsera from "./TejidoPulsera";
import TiraCuentas, { type ModoEdicion } from "./TiraCuentas";
import { useCarrito } from "./CarritoProveedor";
import { comprimir } from "@/lib/celdas";
import {
  compactar,
  cuentasParaLargo,
  largoDe,
  materialesDe,
  precioDe,
  MAX_CUENTAS,
  MAX_PALETA,
  type CuentaHilo,
} from "@/lib/hilo/diseno";
import type { TipoHilo } from "@/lib/hilo/tipos";
import { celdasDePreset, PRESETS_PULSERA } from "@/lib/hilo/presets";
import { cm, precio as enPlata } from "@/lib/formato";

/** La cuenta como la ve el diseñador: la paleta más lo que hay en el cajón. */
export type CuentaConStock = CuentaHilo & { stock: number };

/**
 * Un diseño a medida se arma para el pedido, así que no hay "unidades": el
 * tope es solo para que nadie mande cincuenta pulseras iguales sin hablar.
 */
const MAX_POR_PEDIDO = 5;

const MODOS: { id: ModoEdicion; texto: string; ayuda: string }[] = [
  { id: "pintar", texto: "Pintar", ayuda: "Tocá una cuenta para cambiarla por la elegida." },
  { id: "insertar", texto: "Insertar", ayuda: "Tocá una cuenta para meter una nueva antes." },
  { id: "quitar", texto: "Quitar", ayuda: "Tocá una cuenta para sacarla del hilo." },
];

export default function DisenadorHilo({
  tipo,
  cuentas,
  presetInicial,
}: {
  tipo: TipoHilo;
  cuentas: CuentaConStock[];
  presetInicial?: string;
}) {
  const { agregar } = useCarrito();

  const presetInicialEncontrado = PRESETS_PULSERA.find((item) => item.id === presetInicial);
  const [objetivo, setObjetivo] = useState(presetInicialEncontrado?.largoCm ?? tipo.largos[0]);
  const [pincel, setPincel] = useState(0);
  const [modo, setModo] = useState<ModoEdicion>("pintar");
  const [activa, setActiva] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [niveles, setNiveles] = useState(presetInicialEncontrado?.niveles ?? 1);
  // El hilo arranca lleno hasta el largo sugerido: es más fácil cambiar
  // cuentas de algo que ya existe que armar una pieza desde el vacío.
  const [celdas, setCeldas] = useState<number[]>(() => presetInicialEncontrado
    ? celdasDePreset(presetInicialEncontrado, cuentas, tipo)
    : new Array(cuentasParaLargo(cuentas[0]?.mm ?? 8, tipo.largos[0], tipo)).fill(0));

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<{ codigo: string; precio: number } | null>(null);

  const largo = largoDe(cuentas, celdas, tipo);
  const total = precioDe(cuentas, celdas, tipo, niveles);
  const materiales = useMemo(() => materialesDe(cuentas, celdas, niveles), [cuentas, celdas, niveles]);
  /** El inventario partido por tamaño, que es como se elige una cuenta. */
  const porTamano = useMemo(() => {
    const grupos = new Map<number, { indice: number; cuenta: CuentaConStock }[]>();
    cuentas.forEach((cuenta, indice) => {
      const lista = grupos.get(cuenta.mm) ?? [];
      lista.push({ indice, cuenta });
      grupos.set(cuenta.mm, lista);
    });
    return [...grupos.entries()].sort((a, b) => a[0] - b[0]);
  }, [cuentas]);
  const faltantes = materiales.filter((m) => m.cantidad > cuentas[m.indice].stock);
  const lleno = celdas.length >= MAX_CUENTAS;

  /** Cualquier cambio invalida lo guardado: el código de allá quedó viejo. */
  function editar(nuevas: number[]) {
    setCeldas(nuevas.slice(0, MAX_CUENTAS));
    setGuardado(null);
  }

  function tocar(posicion: number) {
    setActiva(posicion);
    if (modo === "pintar") {
      editar(celdas.map((valor, i) => (i === posicion ? pincel : valor)));
    } else if (modo === "insertar") {
      editar([...celdas.slice(0, posicion), pincel, ...celdas.slice(posicion)]);
    } else {
      editar(celdas.filter((_, i) => i !== posicion));
    }
  }

  /** Agrega o saca cuentas del final hasta llegar al largo pedido. */
  function ajustar(hastaCm = objetivo) {
    const mm = cuentas[pincel]?.mm ?? 8;
    const nuevas = [...celdas];
    let largoActual = largoDe(cuentas, nuevas, tipo);
    // Media cuenta de tolerancia: es lo más cerca que se puede quedar sin
    // partir una al medio.
    const cerca = mm / 20;
    while (largoActual - hastaCm > cerca && nuevas.length > 0) {
      nuevas.pop();
      largoActual = largoDe(cuentas, nuevas, tipo);
    }
    while (hastaCm - largoActual > cerca && nuevas.length < MAX_CUENTAS) {
      nuevas.push(pincel);
      largoActual = largoDe(cuentas, nuevas, tipo);
    }
    editar(nuevas);
  }

  function cambiarObjetivo(valor: number) {
    const acotado = Math.min(Math.max(valor, tipo.minCm), tipo.maxCm);
    setObjetivo(acotado);
    setGuardado(null);
  }

  async function guardar() {
    const compacto = compactar(cuentas, celdas);
    // El patrón se guarda con un caracter por cuenta, así que una pieza no
    // puede mezclar más colores que letras tiene el base36.
    if (compacto.paleta.length > MAX_PALETA) {
      setError(`Una pieza no puede mezclar más de ${MAX_PALETA} colores distintos`);
      return;
    }
    setGuardando(true);
    setError(null);
    const r = await fetch("/api/disenos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: tipo.slug,
        nombre: nombre.trim(),
        largoObjetivoCm: objetivo,
        paleta: compacto.paleta.map((c) => c.id),
        celdas: comprimir(compacto.celdas),
      }),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError(json.error ?? "No se pudo guardar el diseño");
      setGuardando(false);
      return;
    }

    const titulo = nombre.trim() || `${tipo.nombre} a medida`;
    agregar({
      id: `diseno-${json.codigo}`,
      slug: json.codigo,
      nombre: `${titulo} (${json.codigo})`,
      precio: json.precio,
      stock: MAX_POR_PEDIDO,
      enlace: `/disenar/ver/${json.codigo}`,
    });
    setGuardado({ codigo: json.codigo, precio: json.precio });
    setGuardando(false);
  }

  if (cuentas.length === 0) {
    return (
      <div className="tarjeta p-10 text-center text-humo">
        María todavía no cargó las cuentas con las que se arma esta pieza.
        Escribile y las subimos.
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <div className="fondo-3d relative aspect-square w-full border border-linea">
          {presetInicialEncontrado ? <TejidoPulsera paleta={cuentas} celdas={celdas} /> : <Hilo3D tipo={tipo} paleta={cuentas} celdas={celdas} encuadreCm={objetivo} niveles={niveles} editable onTocar={tocar} className="h-full w-full" />}
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-papel/60">
            Arrastrá para girar · tocá una cuenta para {MODOS.find((m) => m.id === modo)!.texto.toLowerCase()}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-humo">
            <span className="precio">{cm(largo)}</span> de {cm(objetivo)} · {celdas.length} cuentas
          </p>
          <div className="h-1 w-40 bg-hueso">
            <div
              className="h-full bg-oro transition-all"
              style={{ width: `${Math.min(100, (largo / objetivo) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <p className="sobretitulo">Largo</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />
          <div className="flex flex-wrap items-center gap-2">
            {tipo.largos.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => cambiarObjetivo(valor)}
                className={objetivo === valor ? "chip chip-oro" : "chip"}
              >
                {cm(valor)}
              </button>
            ))}
            <label className="sr-only" htmlFor="largo">Largo a medida en cm</label>
            <input
              id="largo"
              type="number"
              className="campo w-24"
              min={tipo.minCm}
              max={tipo.maxCm}
              step={0.5}
              value={objetivo}
              onChange={(e) => cambiarObjetivo(Number(e.target.value))}
            />
            <button type="button" className="btn btn-linea btn-chico" onClick={() => ajustar()}>
              Ajustar el hilo
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gris">
            El largo sale de las cuentas que pongas: {cm(tipo.cierreCm)} son del {tipo.cierre}.
            Entre {cm(tipo.minCm)} y {cm(tipo.maxCm)}.
          </p>
        </section>

        <section>
          <p className="sobretitulo">Cuentas de María</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />
          {/* Agrupadas por tamaño porque el tamaño es lo que decide el largo:
              treinta colores sueltos no se leen, seis de 8 mm sí. */}
          <div className="space-y-3">
            {porTamano.map(([mm, lista]) => (
              <div key={mm}>
                <p className="mb-1.5 text-xs uppercase tracking-[0.14em] text-gris">{mm} mm</p>
                <div className="flex flex-wrap gap-1.5">
                  {lista.map(({ indice, cuenta }) => (
                    <button
                      key={cuenta.id}
                      type="button"
                      onClick={() => setPincel(indice)}
                      title={`${cuenta.nombre} · ${cuenta.mm} mm`}
                      aria-label={`Usar ${cuenta.nombre} de ${cuenta.mm} mm`}
                      aria-pressed={pincel === indice}
                      className="h-8 w-8 rounded-full border border-linea transition-transform hover:scale-110"
                      style={{
                        ...estiloDeCuenta(cuenta),
                        outline: pincel === indice ? "2px solid var(--color-oro)" : undefined,
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gris">
            Elegida: <span className="text-humo">{cuentas[pincel]?.nombre}</span> ·{" "}
            {cuentas[pincel]?.mm} mm
            {cuentas[pincel] && cuentas[pincel].precioUnidad > 0
              ? ` · ${enPlata(cuentas[pincel].precioUnidad)} c/u`
              : ""}
          </p>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="sobretitulo">El hilo</p>
            <div className="flex gap-2">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModo(m.id)}
                  className={modo === m.id ? "chip chip-oro" : "chip"}
                >
                  {m.texto}
                </button>
              ))}
            </div>
          </div>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />

          <TiraCuentas paleta={cuentas} celdas={celdas} modo={modo} onTocar={tocar} activa={activa} />

          <p className="mt-2 text-xs text-gris">{MODOS.find((m) => m.id === modo)!.ayuda}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-linea btn-chico"
              disabled={lleno}
              onClick={() => editar([...celdas, pincel])}
            >
              Agregar una
            </button>
            <button
              type="button"
              className="btn btn-linea btn-chico"
              disabled={celdas.length === 0}
              onClick={() => editar(celdas.slice(0, -1))}
            >
              Sacar la última
            </button>
            <button
              type="button"
              className="btn btn-linea btn-chico"
              disabled={celdas.length === 0}
              onClick={() => editar([])}
            >
              Vaciar
            </button>
          </div>
          {lleno && (
            <p className="mt-3 border border-oro bg-hueso p-3 text-xs text-humo">
              Llegaste a {MAX_CUENTAS} cuentas, que es el tope de una pieza. Para
              algo más largo, cuentas más grandes.
            </p>
          )}
        </section>

        <section className="tarjeta p-5">
          <p className="sobretitulo">Lo que lleva</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />
          <ul className="space-y-1.5 text-sm">
            {materiales.map((m) => (
              <li key={m.indice} className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="block h-3.5 w-3.5 shrink-0 rounded-full border border-linea"
                    style={estiloDeCuenta(m.cuenta)}
                  />
                  <span className="truncate text-humo">{m.cuenta.nombre}</span>
                </span>
                <span className="shrink-0 text-gris">{m.cantidad}</span>
              </li>
            ))}
            {materiales.length === 0 && <li className="text-gris">Todavía nada.</li>}
          </ul>

          <div className="mt-5 flex items-end justify-between border-t border-linea pt-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-gris">Estimado</p>
              <p className="precio mt-1">{enPlata(total)}</p>
            </div>
            <p className="text-right text-xs text-gris">
              {cm(largo)}
              <br />
              {celdas.length} cuentas
            </p>
          </div>

          {faltantes.length > 0 && (
            <p className="mt-4 border border-oro bg-hueso p-3 text-xs leading-relaxed text-humo">
              A María puede que no le alcancen{" "}
              {faltantes.map((f) => f.cuenta.nombre.toLowerCase()).join(", ")}. Podés
              mandarlo igual: ella confirma y consigue lo que falte.
            </p>
          )}
        </section>

        <section className="tarjeta p-5">
          <p className="sobretitulo">Guardar</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />

          {guardado ? (
            <div className="space-y-4 text-sm">
              <p className="text-humo">
                Guardado como <strong className="tracking-[0.16em]">{guardado.codigo}</strong> y
                agregado al carrito por {enPlata(guardado.precio)}.
              </p>
              <p className="text-xs leading-relaxed text-gris">
                Con ese código María abre tu diseño tal cual lo armaste. El link
                viaja solo en el pedido.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/carrito" className="btn btn-chico">Ir al carrito</Link>
                <Link href={`/disenar/ver/${guardado.codigo}`} className="btn btn-linea btn-chico">
                  Ver el diseño
                </Link>
              </div>
            </div>
          ) : (
            <>
              <label className="etiqueta" htmlFor="nombre">Ponele un nombre (opcional)</label>
              <input
                id="nombre"
                className="campo"
                maxLength={60}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={`${tipo.nombre} a medida`}
              />
              <button
                type="button"
                className="btn mt-4 w-full"
                disabled={guardando || celdas.length === 0}
                onClick={guardar}
              >
                {guardando ? "Guardando..." : "Guardar y agregar al carrito"}
              </button>
              <p className="mt-3 text-xs leading-relaxed text-gris">
                El precio es estimado: María confirma disponibilidad y total
                antes de cobrarte.
              </p>
            </>
          )}

          {error && <p className="mt-4 border border-oro bg-white p-3 text-sm text-oro">{error}</p>}
        </section>
      </div>
    </div>
  );
}
