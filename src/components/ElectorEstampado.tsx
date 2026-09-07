"use client";

import { acabadoDeCuenta, estiloDeCuenta } from "@/lib/cuentas";
import { useMemo, useState } from "react";
import { cuentaBase } from "@/lib/cuentas-base";
import TarjetaCarteraViva from "./TarjetaCarteraViva";
import { useRouter } from "next/navigation";
import Cartera3D from "./Cartera3D";
import { ESTAMPADOS } from "@/lib/cartera/estampados";
import { FORRO_LLANA, LLANAS, celdasDeEstampado, celdasDeLlana, paletaDeLlana } from "@/lib/cartera/llanas";
import { comprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import type { MedidasCartera } from "@/lib/cartera/geometria";

type CuentaElegible = {
  id: string;
  nombre: string;
  color: string;
  tamanoMm: number;
  acabado: string;
  stock: number;
};

const MINI = 13;

/**
 * A partir de cuántas carteras llanas la fila de arriba deja de servir.
 *
 * Con cuatro entran en una fila y se ven todas de un vistazo, que es lo mejor.
 * Con cien serían veinticinco filas de tarjetas: el estampado y la vista previa
 * se irían abajo de todo y habría que scrollear a ciegas para comparar. Pasado
 * este número la lista se comporta como la de estampados —buscador y alto
 * limitado— en vez de crecer para siempre.
 */
const MUCHAS_LLANAS = 8;

/** La miniatura de un estampado: la misma cuadrícula, chica y en los colores de ahora. */
function Mini({ celda, tonos, colores }: {
  celda: (f: number, c: number, filas: number, cols: number) => number;
  tonos: number;
  colores: string[];
}) {
  const celdas: string[] = [];
  for (let f = MINI - 1; f >= 0; f--) {
    for (let c = 0; c < MINI; c++) {
      const tono = Math.max(0, Math.min(celda(f, c, MINI, MINI), tonos - 1));
      celdas.push(colores[tono] ?? colores[0]);
    }
  }
  return (
    <div
      className="grid gap-px rounded-sm p-1"
      style={{ gridTemplateColumns: `repeat(${MINI}, 1fr)`, background: "var(--color-hueso)" }}
      aria-hidden
    >
      {celdas.map((color, i) => (
        <span key={i} className="aspect-square rounded-full" style={{ background: color }} />
      ))}
    </div>
  );
}

/**
 * La misma pantalla sirve para las dos caras, cambia a dónde va lo elegido:
 *
 * - `panel`: María crea un patrón y lo abre en el diseñador, con su mapa.
 * - `tienda`: el cliente guarda su cartera y se lleva un código. **Sin mapa**:
 *   el cliente elige, María teje.
 */
/** Una cartera que ya está y a la que se le va a poner el estampado encima. */
type Destino = { id: string; slug: string; nombre: string; medidas: MedidasCartera };

export default function ElectorEstampado({
  cuentas,
  minimoMm,
  modo = "panel",
  llanaInicial,
  destino = null,
}: {
  cuentas: CuentaElegible[];
  minimoMm: number;
  modo?: "panel" | "tienda";
  llanaInicial?: string;
  destino?: Destino | null;
}) {
  const router = useRouter();
  const [llana, setLlana] = useState(
    () => (llanaInicial && LLANAS.some((l) => l.slug === llanaInicial) ? llanaInicial : LLANAS[0].slug),
  );
  const [estampado, setEstampado] = useState(ESTAMPADOS[0].slug);
  const [familia, setFamilia] = useState<"todos" | "geometrico" | "figura">("todos");
  const [busca, setBusca] = useState("");
  const [buscaLlana, setBuscaLlana] = useState("");
  const [laterales, setLaterales] = useState(false);
  /**
   * **Arranca sin ninguna cuenta elegida.** El estampado se muestra con la
   * escala de grises de `cuentas-base.ts`: es el dibujo, no una cartera
   * terminada. Antes se preelegían la cuenta más clara y la más oscura del
   * stock, y el modelo salía ya pintado de un color que nadie había pedido.
   */
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState<{ codigo: string } | null>(null);

  const elegido = ESTAMPADOS.find((e) => e.slug === estampado) ?? ESTAMPADOS[0];
  const laLlana = LLANAS.find((l) => l.slug === llana) ?? LLANAS[0];

  const cuentaDe = (id: string | undefined) => cuentas.find((c) => c.id === id);
  // Sin elegir, el tono que le toca de la escala base: así las cien
  // miniaturas se distinguen desde el primer momento.
  const colores = useMemo(
    () => [0, 1, 2, 3].map((i) => cuentaDe(elegidas[i])?.color ?? cuentaBase(minimoMm, i).color),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elegidas, cuentas, minimoMm],
  );

  /**
   * La paleta y el patrón de la vista previa. Salen de lo mismo que va a usar
   * el servidor al crear, así que **lo que se ve es lo que se guarda**.
   *
   * `Cartera3D` rehace la escena solo si cambian medidas o paleta: cambiar de
   * estampado nada más repinta las cuentas, que es instantáneo.
   */
  const paleta: CuentaPaleta[] = useMemo(() => {
    return Array.from({ length: elegido.tonos }, (_, i) => cuentaDe(elegidas[i])).map((c, i) => {
      // La que todavía no se eligió va con su cuenta base, en gris.
      if (!c) return cuentaBase(minimoMm, i);
      return {
        mm: c.tamanoMm,
        color: c.color,
        nombre: c.nombre,
        acabado: acabadoDeCuenta(c.acabado),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegidas, elegido.tonos, cuentas, minimoMm]);

  // Sobre una cartera que ya está se conservan **sus** medidas: lo que se le
  // cambia es el dibujo, no el tamaño.
  const medidas = useMemo(
    () => ({ ...(destino?.medidas ?? laLlana.medidas), cuentaMm: paleta[0]?.mm ?? minimoMm }),
    [destino, laLlana, paleta, minimoMm],
  );

  const celdas = useMemo(
    () => celdasDeEstampado(medidas, elegido, { laterales }),
    [medidas, elegido, laterales],
  );

  const lista = ESTAMPADOS.filter((e) => {
    if (familia !== "todos" && e.familia !== familia) return false;
    if (!busca.trim()) return true;
    return e.nombre.toLowerCase().includes(busca.trim().toLowerCase());
  });

  const faltanColores = Array.from({ length: elegido.tonos }, (_, i) => elegidas[i]).some((x) => !x);

  const muchas = LLANAS.length > MUCHAS_LLANAS;
  const llanas = LLANAS.filter((l) => {
    if (!muchas || !buscaLlana.trim()) return true;
    const texto = `${l.nombre} ${l.resumen}`.toLowerCase();
    return texto.includes(buscaLlana.trim().toLowerCase());
  });

  async function crear() {
    setError(null);
    setGuardando(true);
    try {
      // Sobre una cartera que ya está se le cambia el dibujo; si no, se crea
      // una nueva.
      if (destino) {
        const r = await fetch(`/api/patrones/${destino.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ celdas: comprimir(celdas), paleta }),
        });
        if (!r.ok) throw new Error((await r.json()).error ?? "No se pudo aplicar");
        router.push(`/admin/disenador/${destino.slug}`);
        return;
      }

      const ruta = modo === "tienda" ? "/api/disenos-cartera" : "/api/estampados";
      const r = await fetch(ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llana,
          estampado,
          laterales,
          cuentas: elegidas.slice(0, elegido.tonos),
        }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error ?? "No se pudo guardar");
      if (modo === "tienda") {
        setListo({ codigo: datos.codigo });
        setGuardando(false);
        return;
      }
      router.push(`/admin/disenador/${datos.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      setGuardando(false);
    }
  }

  if (cuentas.length === 0) {
    return (
      <p className="tarjeta p-6 text-sm">
        Para armar un estampado hacen falta cuentas de <strong>{minimoMm} mm o más</strong> en
        el stock: en una cartera no entran las más chicas, la tela queda blanda y el bolso no
        se sostiene. Andá a <a className="underline" href="/admin/stock">Stock</a> y cargá al
        menos dos.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── 1. La cartera. Si ya vino elegida, no hay nada que elegir. ── */}
      {destino ? (
        <p className="tarjeta p-4 text-sm">
          Le vas a poner el estampado a <strong>{destino.nombre}</strong>. Conserva sus medidas
          — {destino.medidas.anchoCm} × {destino.medidas.altoCm} ×{" "}
          {destino.medidas.profundidadCm} cm — y se le cambia el dibujo.
        </p>
      ) : (
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="sobretitulo mr-auto">1 · La cartera</h2>
          {muchas && (
            <>
              <input
                className="campo w-44"
                placeholder="Buscar cartera…"
                value={buscaLlana}
                onChange={(e) => setBuscaLlana(e.target.value)}
              />
              <span className="text-xs text-black/55">
                {llanas.length} de {LLANAS.length}
              </span>
            </>
          )}
        </div>
        <div
          className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
            muchas ? "max-h-[18rem] overflow-y-auto pr-2" : ""
          }`}
        >
          {llanas.map((l) => (
            <button
              key={l.slug}
              type="button"
              onClick={() => setLlana(l.slug)}
              className={`rounded-sm border p-3 text-left transition-colors ${
                llana === l.slug
                  ? "border-[var(--color-oro)] bg-[var(--color-hueso)]"
                  : "border-black/12 hover:border-black/30"
              }`}
            >
              {/*
                La forma se elige **viéndola**, igual que en el panel. Va en la
                escala de grises de `cuentas-base.ts`: es la forma, el color lo
                pone el estampado.
              */}
              <TarjetaCarteraViva
                medidas={l.medidas}
                paleta={paletaDeLlana(l)}
                celdas={celdasDeLlana(l)}
              colorForro={FORRO_LLANA}
                className="mb-2 aspect-[4/3] w-full rounded-sm"
              />
              <span className="block text-sm font-medium">{l.nombre}</span>
              <span className="block text-xs text-black/55">{l.resumen}</span>
            </button>
          ))}
          {llanas.length === 0 && (
            <p className="col-span-full text-sm text-black/55">
              Ninguna cartera se llama así.
            </p>
          )}
        </div>
      </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
        {/* ── 2. El estampado ── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="sobretitulo mr-auto">2 · El estampado</h2>
            <input
              className="campo w-44"
              placeholder="Buscar…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {(["todos", "geometrico", "figura"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFamilia(f)}
                className={`chip ${familia === f ? "chip-oro" : ""}`}
              >
                {f === "todos" ? "Todos" : f === "geometrico" ? "Geométricos" : "Figuras"}
              </button>
            ))}
          </div>

          <p className="mb-3 text-xs text-black/55">{lista.length} de {ESTAMPADOS.length}</p>

          {/* Se limita el alto: la vista previa de al lado tiene que quedar a la vista. */}
          <div className="grid max-h-[34rem] grid-cols-3 gap-3 overflow-y-auto pr-2 sm:grid-cols-4 xl:grid-cols-5">
            {lista.map((e) => (
              <button
                key={e.slug}
                type="button"
                onClick={() => setEstampado(e.slug)}
                className={`rounded-sm border p-2 text-left transition-colors ${
                  estampado === e.slug
                    ? "border-[var(--color-oro)] bg-[var(--color-hueso)]"
                    : "border-black/12 hover:border-black/30"
                }`}
              >
                <Mini celda={e.celda} tonos={e.tonos} colores={colores} />
                <span className="mt-2 block truncate text-xs font-medium">{e.nombre}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── La vista previa, en vivo ── */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="fondo-3d relative aspect-square border border-linea">
            <Cartera3D
              medidas={medidas}
              paleta={paleta}
              celdas={celdas}
              mostrarHilo={false}
              mostrarForro
              autoGirar
              className="h-full w-full"
            />
          </div>
          <p className="mt-2 text-xs text-black/55">
            {(destino?.nombre ?? laLlana.nombre)} con {elegido.nombre.toLowerCase()} ·{" "}
            {celdas.length} cuentas.
            Arrastrá para girarla.
          </p>

          {/* El dibujo va siempre en el frente y la espalda; los costados son
              opcionales porque cambian mucho cómo se lee la cartera. */}
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={laterales}
              onChange={(e) => setLaterales(e.target.checked)}
            />
            <span>
              Estampado también en los laterales
              <span className="block text-xs text-black/55">
                El fuelle de los costados lleva el mismo dibujo. La base y las asas van siempre
                lisas.
              </span>
            </span>
          </label>

          <section className="mt-6">
            <h2 className="sobretitulo mb-3">3 · Los colores</h2>
            <p className="mb-3 text-xs text-black/55">
              El primero es el fondo — pone casi todas las cuentas.{" "}
              <strong>{elegido.nombre}</strong> lleva {elegido.tonos}.
            </p>
            {faltanColores && (
              <p className="mb-3 text-xs leading-relaxed text-black/55">
                Hasta acá el dibujo se muestra en gris: son las cuentas patrón,
                no un color. Elegí una cuenta del stock para cada tono.
              </p>
            )}
            <div className="space-y-2">
              {Array.from({ length: elegido.tonos }, (_, i) => (
                <label key={i} className="flex items-center gap-3">
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-black/15"
                    style={estiloDeCuenta(paleta[i])}
                  />
                  <select
                    className="campo flex-1"
                    value={elegidas[i] ?? ""}
                    onChange={(e) => {
                      const copia = [...elegidas];
                      copia[i] = e.target.value;
                      setElegidas(copia);
                    }}
                  >
                    <option value="">{i === 0 ? "Fondo…" : `Color ${i + 1}…`}</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} · {c.tamanoMm} mm · quedan {c.stock}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <button
            type="button"
            className="btn mt-6 w-full"
            onClick={crear}
            disabled={guardando || faltanColores}
          >
            {guardando
              ? "Guardando…"
              : destino
                ? `Aplicar a ${destino.nombre}`
                : modo === "tienda"
                  ? "Guardar mi cartera"
                  : "Crear y abrir en el diseñador"}
          </button>
          {listo && (
            <div className="tarjeta mt-4 p-4 text-sm">
              <p className="font-medium">Tu cartera quedó guardada.</p>
              <p className="mt-1 text-black/60">
                Tu código es <strong className="tracking-widest">{listo.codigo}</strong>. Con él
                podés volver a verla y mandársela a María.
              </p>
              <a className="btn btn-linea btn-chico mt-3 inline-block" href={`/disenar/cartera/ver/${listo.codigo}`}>
                Ver mi cartera
              </a>
            </div>
          )}
          {faltanColores && (
            <p className="mt-2 text-xs text-black/55">Elegí los {elegido.tonos} colores.</p>
          )}
          {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
