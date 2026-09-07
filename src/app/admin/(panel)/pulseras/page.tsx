import Link from "next/link";
import TarjetaPulseraViva from "@/components/TarjetaPulseraViva";
import { MODELOS_PULSERA } from "@/lib/pulsera/modelos";
import { cm } from "@/lib/formato";

export const metadata = { title: "Pulseras · Panel" };

/**
 * **Las pulseras del lado de María.** La tienda las muestra para vender; acá se
 * abren para tejer: cada una lleva a sus indicaciones, con los pasos del punto,
 * el video y la lista de compras.
 *
 * Se entra viendo la pieza, igual que en Carteras: elegir por nombre no es
 * elegir. Hay **uno por tejido**: el color no hace modelo aparte, se cambia en
 * el editor.
 */
export default function Pulseras() {
  return (
    <>
      <p className="sobretitulo">Taller</p>
      <h1 className="titulo mt-2 text-3xl">Pulseras</h1>
      <p className="mt-3 max-w-xl text-humo">
        Entrá a una para ver cómo se teje: los pasos del punto, el video al lado
        y cuántas cuentas de cada color hay que sacar del stock.
      </p>
      <div className="filete my-6 max-w-[8rem]" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODELOS_PULSERA.map((modelo) => (
          <article key={modelo.id} className="border border-linea bg-papel">
            <Link href={`/admin/pulseras/${modelo.slug}`} className="block">
              <TarjetaPulseraViva modelo={modelo} className="aspect-[4/3] w-full border-b border-linea" />
            </Link>
            <div className="p-5">
              <div className="mb-3 flex gap-1.5">
                {modelo.paleta.map((cuenta, i) => (
                  <span
                    key={i}
                    title={`${cuenta.nombre} · ${cuenta.mm} mm`}
                    className="block h-4 w-4 rounded-full border border-linea"
                    style={{ background: cuenta.color }}
                  />
                ))}
              </div>
              <Link href={`/admin/pulseras/${modelo.slug}`} className="titulo block text-lg hover:text-oro">
                {modelo.tecnica}
              </Link>
              <p className="mt-1 text-xs text-humo">{modelo.construccion}</p>
              <p className="mt-1 text-xs text-gris">
                {cm(modelo.largoBaseCm)} · {modelo.anchoCm.toFixed(1)} cm de ancho · cuenta de{" "}
                {[...new Set(modelo.paleta.map((c) => c.mm))].join(" y ")} mm
              </p>
              <Link
                href={`/admin/pulseras/${modelo.slug}`}
                className="mt-3 inline-block text-xs uppercase tracking-[0.12em] text-oro hover:underline"
              >
                Ver indicaciones →
              </Link>
            </div>
          </article>
        ))}
      </div>

    </>
  );
}
