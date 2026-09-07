"use client";

import { estiloDeCuenta } from "@/lib/cuentas";
import Link from "next/link";
import { useMemo, useState } from "react";
import Pulsera3D from "./Pulsera3D";
import { useCarrito } from "./CarritoProveedor";
import { cm, precio as enPlata } from "@/lib/formato";
import {
  celdasDeMatriz,
  cuentaSirveParaPapel,
  matrizParaLargo,
  medidaDePapel,
  ubicacionesDePulsera,
  type ModeloPulsera,
} from "@/lib/pulsera/modelos";
import type { CuentaHilo } from "@/lib/hilo/diseno";
import { METALES, type MetalCierre } from "@/lib/pulsera/cierre";

type CuentaDisponible = CuentaHilo & { stock: number };

const LARGOS = [15, 17, 19] as const;
const MAX_POR_PEDIDO = 5;

/**
 * El modelo ya esta elegido desde el catalogo. Acá solo se ajusta la medida y
 * la paleta; no hay otro selector de modelos que pueda reemplazarlo.
 */
export default function DisenadorPulseraTejida({
  modelo,
  cuentas,
}: {
  modelo: ModeloPulsera;
  cuentas: CuentaDisponible[];
}) {
  const { agregar } = useCarrito();
  /**
   * **El tamano de cada cuenta lo manda el modelo, no la clienta.**
   *
   * En una trama porque la grilla tiene el paso de la cuenta: una mas grande se
   * mete adentro de sus vecinas —se ven fusionadas y con hilo de verdad no
   * entran— y una mas chica deja hueco. Lo vio Maria: *"ni tiene forma y las
   * cuentas no se fusionan"*.
   *
   * En una margarita porque el anillo cierra solo si los seis petalos miden lo
   * mismo, y el cristal del tramo de union es mas gordo a proposito.
   *
   * Por eso cada papel de la paleta ofrece **solo las cuentas de su medida**:
   * la clienta elige el color, nunca el tamano.
   */
  const disponiblesPara = useMemo(() => {
    const enStock = cuentas.filter((cuenta) => cuenta.stock > 0);
    return modelo.paleta.map((_, papel) =>
      enStock.filter((cuenta) => cuentaSirveParaPapel(modelo, papel, cuenta)),
    );
  }, [cuentas, modelo]);
  const [largo, setLargo] = useState(modelo.largoBaseCm);
  const [cierre, setCierre] = useState<MetalCierre>("dorado");
  /**
   * **Arranca sin ninguna cuenta elegida.** El modelo se muestra con la escala
   * de grises de `cuentas-base.ts`: es la forma, no una pieza. Preelegir la
   * cuenta del stock mas parecida al gris daba una pulsera gris de verdad y
   * hacia creer que ya estaba lista para pedir.
   */
  const [elegidas, setElegidas] = useState<string[]>(() => modelo.paleta.map(() => ""));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<{ codigo: string; precio: number } | null>(null);

  const seleccionadas = useMemo(
    () => modelo.paleta.map((base, indice) => cuentas.find((cuenta) => cuenta.id === elegidas[indice]) ?? base),
    [cuentas, elegidas, modelo.paleta],
  );
  const paleta = useMemo(
    () => seleccionadas.map((cuenta, papel) => ({
      // La medida es la del modelo aunque la cuenta elegida diga otra cosa.
      mm: medidaDePapel(modelo, papel),
      color: cuenta.color,
      nombre: cuenta.nombre,
      acabado: cuenta.acabado,
      forma: modelo.paleta[papel].forma,
    })),
    [modelo, seleccionadas],
  );
  const matriz = useMemo(() => matrizParaLargo(modelo, largo), [largo, modelo]);
  const celdas = useMemo(() => celdasDeMatriz(matriz), [matriz]);
  const layout = useMemo(() => ubicacionesDePulsera(modelo, largo, paleta), [largo, modelo, paleta]);
  // La cadena solo acorta, así que la pieza tiene un largo máximo y un mínimo.
  const corto = Math.round((layout.largoCm - layout.ajusteCm) * 10) / 10;
  const porColor = useMemo(() => {
    const total = new Array(modelo.paleta.length).fill(0);
    celdas.forEach((indice) => {
      if (indice >= 0 && indice < total.length) total[indice] += 1;
    });
    return total;
  }, [celdas, modelo.paleta.length]);
  const estimado = useMemo(
    () => 3 + modelo.manoDeObra + celdas.reduce(
      (suma, indice) => suma + ((seleccionadas[indice] as CuentaDisponible | undefined)?.precioUnidad ?? 0),
      0,
    ),
    [celdas, modelo.manoDeObra, seleccionadas],
  );
  const faltanColores = elegidas.some((id, papel) => !disponiblesPara[papel].some((cuenta) => cuenta.id === id));

  function cambiarColor(indice: number, id: string) {
    setElegidas((actuales) => actuales.map((actual, posicion) => (posicion === indice ? id : actual)));
    setGuardado(null);
    setError(null);
  }

  function cambiarLargo(valor: number) {
    setLargo(valor);
    setGuardado(null);
  }

  async function guardar() {
    if (faltanColores) {
      setError("Elegí una cuenta del stock para cada parte del modelo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/disenos-pulsera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo: modelo.id, paleta: elegidas, largoObjetivoCm: largo, cierre }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo guardar la pulsera");
      agregar({
        id: `diseno-${datos.codigo}`,
        slug: datos.codigo,
        nombre: `${modelo.nombre} (${datos.codigo})`,
        precio: datos.precio,
        stock: MAX_POR_PEDIDO,
        enlace: `/disenar/ver/${datos.codigo}`,
      });
      setGuardado({ codigo: datos.codigo, precio: datos.precio });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo guardar la pulsera");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="fondo-3d relative aspect-[5/4] overflow-hidden border border-linea sm:aspect-[3/2]">
          <Pulsera3D layout={layout} paleta={paleta} cierre={cierre} className="h-full w-full" />
          <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-papel/65">
            Arrastra para mirar la trama de cerca
          </p>
        </div>
        <p className="mt-3 text-sm text-humo">
          {modelo.tecnica} · {celdas.length} cuentas · cierra entre {cm(corto)} y{" "}
          {cm(layout.largoCm)}
        </p>
      </div>

      <aside className="space-y-7">
        <section>
          <p className="sobretitulo">Modelo elegido</p>
          <div className="filete mb-3 mt-2 max-w-[5rem]" />
          <h2 className="titulo text-2xl">{modelo.nombre}</h2>
          <p className="mt-2 text-sm leading-relaxed text-humo">{modelo.descripcion}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.13em] text-gris">{modelo.construccion}</p>
          <Link href="/catalogo/pulseras" className="mt-4 inline-block text-xs uppercase tracking-[0.12em] text-oro hover:underline">
            Cambiar por otro modelo
          </Link>
        </section>

        <section>
          <p className="sobretitulo">Largo</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />
          <div className="flex flex-wrap gap-2">
            {LARGOS.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => cambiarLargo(valor)}
                className={largo === valor ? "chip chip-oro" : "chip"}
              >
                {cm(valor)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gris">
            {/* El largo lo decide la pieza: decir "17 cm" cuando mide 16,5 es mentirle a la clienta. */}
            {modelo.armado === "flores"
              ? `Las flores entran enteras, asi que la tira se arma con la primera que pase el largo pedido.`
              : `La vuelta se completa con cuentas enteras, asi que pasa apenas el largo pedido.`}{" "}
            {`Con la cadena, esta cierra entre ${cm(corto)} y ${cm(layout.largoCm)}.`}
          </p>
        </section>

        <section>
          <p className="sobretitulo">Cierre</p>
          <div className="filete mb-4 mt-2 max-w-[4rem]" />
          <div className="flex flex-wrap gap-2">
            {METALES.map((metal) => (
              <button
                key={metal.id}
                type="button"
                onClick={() => {
                  setCierre(metal.id);
                  setGuardado(null);
                }}
                className={cierre === metal.id ? "chip chip-oro" : "chip"}
              >
                <span
                  className="mr-2 inline-block h-3 w-3 translate-y-[1px] rounded-full border border-linea"
                  style={{ background: metal.color }}
                />
                {metal.nombre}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gris">
            Broche de mosquetón y cadena de extensión: la pulsera se puede cerrar
            hasta {cm(layout.ajusteCm)} más corta, así que el largo no tiene que
            caer justo. El cierre no sale del stock de cuentas; va incluido en el
            armado.
          </p>
        </section>

        <section>
          <p className="sobretitulo">Colores de tu pulsera</p>
          <div className="filete mb-4 mt-2 max-w-[5rem]" />
          {faltanColores && (
            <p className="mb-4 text-xs leading-relaxed text-gris">
              El modelo se muestra en gris: son las cuentas patrón, no un color.
              Elegí una cuenta del stock para cada parte y la pulsera se pinta
              sola.
            </p>
          )}
          <div className="space-y-3">
            {modelo.paleta.map((base, indice) => {
              const cuenta = seleccionadas[indice];
              return (
                <label key={modelo.nombresColor[indice]} className="block">
                  <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-gris">
                    {modelo.nombresColor[indice]} · {porColor[indice]} cuentas
                  </span>
                  <span className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 shrink-0 rounded-full border border-linea"
                      style={estiloDeCuenta(cuenta ?? base)}
                    />
                    <select
                      className="campo min-w-0 flex-1"
                      value={elegidas[indice] ?? ""}
                      onChange={(evento) => cambiarColor(indice, evento.target.value)}
                    >
                      <option value="">Elegir color...</option>
                      {disponiblesPara[indice].map((opcion) => (
                        <option key={opcion.id} value={opcion.id}>
                          {opcion.nombre} · {opcion.mm} mm · quedan {opcion.stock}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              );
            })}
          </div>
          {disponiblesPara.every((lista) => lista.length === 0) && (
            <p className="mt-3 text-xs text-gris">No hay cuentas disponibles en stock para personalizar este modelo.</p>
          )}
        </section>

        <section className="tarjeta p-5">
          <p className="sobretitulo">Estimado</p>
          {/* Sin cuentas elegidas no hay precio: las base no se compran. */}
          <p className="precio mt-1">{faltanColores ? "—" : enPlata(estimado)}</p>
          <p className="mt-2 text-xs leading-relaxed text-gris">
            {faltanColores
              ? "El precio sale de las cuentas que elijas: hasta entonces no hay nada que cotizar."
              : "Incluye la trama del modelo, el broche y las cuentas elegidas. Maria confirma disponibilidad antes de cobrar."}
          </p>
          <button type="button" className="btn mt-5 w-full" onClick={guardar} disabled={guardando || faltanColores}>
            {guardando ? "Guardando..." : "Guardar y agregar al carrito"}
          </button>
          {faltanColores && (
            <p className="mt-2 text-xs text-gris">
              Elegí una cuenta del stock para cada parte del modelo para continuar.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          {guardado && (
            <p className="mt-3 text-sm text-humo">
              Guardada con el codigo <strong className="tracking-widest">{guardado.codigo}</strong>.{" "}
              <Link href={`/disenar/ver/${guardado.codigo}`} className="text-oro underline">Ver pulsera</Link>
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
