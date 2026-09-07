"use client";

import { estiloDeCuenta } from "@/lib/cuentas";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cartera3D from "./Cartera3D";
import { armarLayout, conteoPorPanel } from "@/lib/cartera/geometria";
import type { MedidasCartera } from "@/lib/cartera/geometria";
import { comprimir, descomprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import type { CuentaDisponible } from "@/lib/cuentas";

export type PatronEditable = {
  id: string;
  nombre: string;
  ficha: string | null;
  medidas: MedidasCartera;
  forroColor: string;
  paleta: CuentaPaleta[];
  celdas: string;
};

const CAMPOS_MEDIDA: { campo: keyof MedidasCartera; etiqueta: string; paso: number }[] = [
  { campo: "anchoCm", etiqueta: "Ancho (cm)", paso: 0.5 },
  { campo: "altoCm", etiqueta: "Alto (cm)", paso: 0.5 },
  { campo: "profundidadCm", etiqueta: "Profundidad (cm)", paso: 0.5 },
  { campo: "altoSolapaCm", etiqueta: "Caída de solapa (cm)", paso: 0.5 },
  { campo: "asaCm", etiqueta: "Largo del asa (cm)", paso: 1 },
  { campo: "cuentaMm", etiqueta: "Cuenta (mm)", paso: 1 },
];

export default function DisenadorCartera({ patron, cuentasDisponibles }: {
  patron: PatronEditable;
  cuentasDisponibles: CuentaDisponible[];
}) {
  const router = useRouter();
  const cuentasDeMedidaOriginal = useMemo(
    () => cuentasDisponibles.filter((cuenta) => cuenta.tamanoMm === patron.medidas.cuentaMm),
    [cuentasDisponibles, patron.medidas.cuentaMm],
  );
  const [medidas, setMedidas] = useState(patron.medidas);
  const [forroColor, setForroColor] = useState(patron.forroColor);
  const [paleta, setPaleta] = useState(patron.paleta);
  const [seleccion, setSeleccion] = useState(0);
  const [panelEnCambio, setPanelEnCambio] = useState<string | null>(null);
  const [cuentaElegidaId, setCuentaElegidaId] = useState(cuentasDeMedidaOriginal[0]?.id ?? "");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const layout = useMemo(() => armarLayout(medidas), [medidas]);

  // El patrón guardado puede ser de otras medidas; se recorta o rellena solo.
  const [celdas, setCeldas] = useState<number[]>(() =>
    descomprimir(patron.celdas, armarLayout(patron.medidas).cuentas.length),
  );

  const celdasAjustadas = useMemo(() => {
    if (celdas.length === layout.cuentas.length) return celdas;
    const copia = celdas.slice(0, layout.cuentas.length);
    while (copia.length < layout.cuentas.length) copia.push(0);
    return copia;
  }, [celdas, layout.cuentas.length]);

  const pintar = useCallback(
    (i: number) => {
      setCeldas((previo) => {
        const copia = previo.slice(0, layout.cuentas.length);
        while (copia.length < layout.cuentas.length) copia.push(0);
        if (copia[i] === seleccion) return previo;
        copia[i] = seleccion;
        return copia;
      });
      setAviso(null);
    },
    [seleccion, layout.cuentas.length],
  );

  /** Cuántas cuentas de cada color lleva el patrón. Es la lista de compras. */
  const conteo = useMemo(() => {
    const total = new Array(paleta.length).fill(0);
    celdasAjustadas.forEach((indice) => {
      if (indice < total.length) total[indice] += 1;
    });
    return total;
  }, [celdasAjustadas, paleta.length]);

  const paneles = useMemo(() => conteoPorPanel(layout), [layout]);

  /** Aplica una entrada de la paleta a todas las cuentas de un panel. */
  function pintarPanel(panel: string, indice: number) {
    const rejilla = layout.rejillas.find((r) => r.panel === panel);
    if (!rejilla) return;
    setCeldas((previo) => {
      const copia = previo.slice(0, layout.cuentas.length);
      while (copia.length < layout.cuentas.length) copia.push(0);
      for (let i = rejilla.desde; i < rejilla.desde + rejilla.total; i++) {
        copia[i] = indice;
      }
      return copia;
    });
  }

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    const r = await fetch(`/api/patrones/${patron.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...medidas, forroColor, paleta, celdas: comprimir(celdasAjustadas) }),
    });
    setGuardando(false);
    if (r.ok) {
      setAviso("Guardado.");
      router.refresh();
    } else {
      const json = await r.json().catch(() => ({}));
      setAviso(json.error ?? "No se pudo guardar");
    }
  }

  function cambiarMedida(campo: keyof MedidasCartera, valor: string) {
    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) return;
    setMedidas((previo) => ({ ...previo, [campo]: n }));
  }

  function abrirCambio(panel: string) {
    setPanelEnCambio((actual) => actual === panel ? null : panel);
    if (!cuentaElegidaId) setCuentaElegidaId(cuentasDeMedidaOriginal[0]?.id ?? "");
  }

  function seleccionarCuentaDeStock(cuenta: CuentaDisponible) {
    const entrada: CuentaPaleta = {
      nombre: cuenta.nombre,
      color: cuenta.color,
      mm: cuenta.tamanoMm,
      acabado: cuenta.acabado,
    };
    const indice = paleta.findIndex((item) =>
      item.nombre === entrada.nombre && item.color === entrada.color && item.mm === entrada.mm && item.acabado === entrada.acabado,
    );
    if (indice >= 0) {
      setSeleccion(indice);
      return;
    }
    setPaleta((actual) => [...actual, entrada]);
    setSeleccion(paleta.length);
  }

  function aplicarCuentaAlPanel(panel: string) {
    const cuenta = cuentasDeMedidaOriginal.find((item) => item.id === cuentaElegidaId);
    if (!cuenta) return;
    const entrada: CuentaPaleta = {
      nombre: cuenta.nombre,
      color: cuenta.color,
      mm: cuenta.tamanoMm,
      acabado: cuenta.acabado,
    };
    let indice = paleta.findIndex((item) =>
      item.nombre === entrada.nombre && item.color === entrada.color && item.mm === entrada.mm && item.acabado === entrada.acabado,
    );
    if (indice < 0) {
      indice = paleta.length;
      setPaleta((actual) => [...actual, entrada]);
    }
    setSeleccion(indice);
    pintarPanel(panel, indice);
    setPanelEnCambio(null);
  }

  /**
   * El hilo tapa las cuentas cuando se está pintando, así que arranca
   * apagado; pero es lo único que muestra cómo se teje, así que se puede
   * prender. No es clickeable: pintar sigue acertando siempre a la cuenta.
   */
  const [verHilo, setVerHilo] = useState(false);
  /** El forro de tela por dentro del cuerpo y debajo de la solapa. */
  const [verForro, setVerForro] = useState(true);

  function reiniciarCambios() {
    if (!window.confirm("Se descartaran todos los cambios sin guardar. Deseas continuar?")) return;
    setMedidas(patron.medidas);
    setForroColor(patron.forroColor);
    setPaleta(patron.paleta);
    setCeldas(descomprimir(patron.celdas, armarLayout(patron.medidas).cuentas.length));
    setSeleccion(0);
    setPanelEnCambio(null);
    setAviso(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {/* Lienzo 3D */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="fondo-3d relative aspect-square border border-linea sm:aspect-[4/3]">
          <Cartera3D
            medidas={medidas}
            paleta={paleta}
            celdas={celdasAjustadas}
            editable
            onPintar={pintar}
            mostrarHilo={verHilo}
            mostrarForro={verForro}
            colorForro={forroColor}
            className="h-full w-full"
          />
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            <BotonVisor activo={verForro} onClick={() => setVerForro((v) => !v)}>
              {verForro ? "Quitar forro" : "Poner forro"}
            </BotonVisor>
            <BotonVisor activo={verHilo} onClick={() => setVerHilo((v) => !v)}>
              {verHilo ? "Ocultar hilo" : "Ver el hilo"}
            </BotonVisor>
          </div>
          <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-papel/60">
            Arrastrá para girar · rueda para acercar · clic en una cuenta para pintarla
          </p>
        </div>

      </div>

      {/* Panel de control */}
      <aside className="space-y-6">
        <nav className="sticky top-0 z-10 -mx-1 flex gap-4 border-b border-linea bg-papel px-1 py-3 text-xs uppercase tracking-[0.14em] text-humo">
          <a href="#cuentas" className="hover:text-tinta">Cuentas</a>
          <a href="#medidas" className="hover:text-tinta">Medidas</a>
          <a href="#diseno" className="hover:text-tinta">Diseño</a>
        </nav>

        <section id="cuentas" className="tarjeta scroll-mt-16 p-5">
          <p className="sobretitulo">Cuentas</p>
          <div className="filete mb-2 mt-2 max-w-[5rem]" />
          <p className="mb-4 text-xs text-gris">Elegí una y tocá las cuentas en el 3D.</p>

          <ul className="space-y-2">
            {paleta.map((p, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 border p-2 ${
                  seleccion === i ? "border-oro bg-hueso" : "border-linea"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSeleccion(i)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-linea"
                    style={estiloDeCuenta(p)}
                  />
                  <span className="flex-1">
                    <span className="block text-sm leading-tight">{p.nombre}</span>
                    <span className="text-xs text-gris tabular-nums">{conteo[i]} cuentas</span>
                  </span>
                </button>
                <span className="text-xs tabular-nums text-gris">{p.mm} mm</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-linea pt-5">
            <p className="sobretitulo">Disponibles en stock</p>
            <p className="mt-2 text-xs text-gris">Elegí una para agregarla a la paleta de este diseño.</p>
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {cuentasDeMedidaOriginal.map((cuenta) => (
                <li key={cuenta.id}>
                  <button
                    type="button"
                    onClick={() => seleccionarCuentaDeStock(cuenta)}
                    className="flex w-full items-center gap-3 border border-linea bg-white p-2 text-left hover:border-oro"
                  >
                    <span className="h-7 w-7 shrink-0 rounded-full border border-linea" style={estiloDeCuenta(cuenta)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm leading-tight">{cuenta.nombre}</span>
                      <span className="text-xs tabular-nums text-gris">{cuenta.tamanoMm} mm · {cuenta.stock} disponibles</span>
                    </span>
                  </button>
                </li>
              ))}
              {cuentasDeMedidaOriginal.length === 0 && (
                <li className="border border-linea p-3 text-xs text-gris">
                  No hay cuentas disponibles de {patron.medidas.cuentaMm} mm.
                </li>
              )}
            </ul>
          </div>
        </section>

        <section id="medidas" className="tarjeta scroll-mt-16 p-5">
          <p className="sobretitulo">Medidas</p>
          <div className="filete mb-2 mt-2 max-w-[5rem]" />
          <p className="mb-4 text-xs text-gris">
            Cambiar una medida rearma la grilla; el patrón se conserva lo que puede.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_MEDIDA.map(({ campo, etiqueta, paso }) => (
              <div key={campo}>
                <label className="etiqueta" htmlFor={campo}>{etiqueta}</label>
                <input
                  id={campo}
                  type="number"
                  step={paso}
                  min={0}
                  className="campo"
                  value={medidas[campo]}
                  onChange={(e) => cambiarMedida(campo, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-linea pt-3 text-xs text-gris">
            Paso de la grilla: <span className="tabular-nums">{layout.paso.toFixed(2)} cm</span> ·{" "}
            {layout.cuentas.length} cuentas en total
          </div>
        </section>

        <section id="diseno" className="tarjeta scroll-mt-16 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="sobretitulo">Diseño</p>
              <div className="filete mb-2 mt-2 max-w-[5rem]" />
            </div>
          </div>

          <p className="mt-3 text-xs text-gris">Cambiar la cuenta de una pieza aplica el color elegido a toda esa secciÃ³n.</p>
          <ul className="mt-4 divide-y divide-linea border-y border-linea text-sm">
            {paneles.map((p) => (
              <li key={p.panel} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <span>{p.nombre}</span>
                  <span className="tabular-nums text-humo">{p.total} cuentas</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gris">
                  <span>{p.cols} × {p.filas}</span>
                  <button
                    type="button"
                    onClick={() => abrirCambio(p.panel)}
                    className="uppercase tracking-[0.12em] text-oro hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
                {panelEnCambio === p.panel && (
                  <div className="mt-3 space-y-3 border-t border-linea pt-3">
                    <div>
                      <label className="etiqueta" htmlFor={`cuenta-${p.panel}`}>Cuenta</label>
                      <select
                        id={`cuenta-${p.panel}`}
                        className="campo"
                        value={cuentaElegidaId}
                        onChange={(e) => setCuentaElegidaId(e.target.value)}
                      >
                        {cuentasDeMedidaOriginal.map((cuenta) => (
                          <option key={cuenta.id} value={cuenta.id}>
                            {cuenta.nombre} ({cuenta.tamanoMm} mm, {cuenta.stock} disponibles)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="etiqueta mb-0" htmlFor={`color-${p.panel}`}>Color</label>
                      <span
                        id={`color-${p.panel}`}
                        className="h-8 w-10 border border-linea"
                        style={{ background: cuentasDeMedidaOriginal.find((cuenta) => cuenta.id === cuentaElegidaId)?.color ?? "#ffffff" }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => aplicarCuentaAlPanel(p.panel)}
                      className="btn btn-chico w-full"
                      disabled={!cuentaElegidaId}
                    >
                      Aplicar a {p.nombre.toLowerCase()}
                    </button>
                  </div>
                )}
              </li>
            ))}
            <li className="flex items-center justify-between bg-papel py-3 font-medium">
              <span>Total</span>
              <span className="tabular-nums">{layout.cuentas.length} cuentas</span>
            </li>
          </ul>
        </section>

        {aviso && <p className="border border-oro bg-white p-3 text-sm text-oro">{aviso}</p>}

        <div className="space-y-3">
          <button type="button" onClick={guardar} className="btn w-full" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar patrón"}
          </button>
          <button type="button" onClick={reiniciarCambios} className="btn btn-linea w-full" disabled={guardando}>
            Reiniciar cambios
          </button>
        </div>

      </aside>
    </div>
  );
}

/** Un interruptor sobre el visor 3D: se lee sobre el fondo oscuro. */
function BotonVisor({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className="border px-3 py-1.5 text-xs uppercase tracking-[0.12em]"
      style={{
        background: activo ? "var(--color-oro)" : "rgba(18,16,14,0.55)",
        borderColor: activo ? "var(--color-oro)" : "rgba(250,248,244,0.35)",
        color: activo ? "var(--color-tinta)" : "var(--color-papel)",
      }}
    >
      {children}
    </button>
  );
}
