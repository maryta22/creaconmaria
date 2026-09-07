import Link from "next/link";
import { notFound } from "next/navigation";
import TarjetaPulseraViva from "@/components/TarjetaPulseraViva";
import { modeloPulseraPorId, ubicacionesDePulsera } from "@/lib/pulsera/modelos";
import { idDeVideo, PUNTOS } from "@/lib/pulsera/punto";
import { MATERIALES_CIERRE, METALES } from "@/lib/pulsera/cierre";
import { cm } from "@/lib/formato";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const modelo = modeloPulseraPorId((await params).slug);
  return { title: modelo ? `Indicaciones · ${modelo.nombre}` : "Indicaciones" };
}

/**
 * **Las indicaciones de una pulsera, para tejerla.**
 *
 * Es lo que el mapa de tejido es para una cartera: la pieza, los pasos del
 * punto y la lista de compras en una hoja que se imprime. Lo que no es papel
 * —el visor, los enlaces— lleva `no-imprimir`.
 *
 * El video va acá y no en la tienda a propósito: la clienta elige, María teje.
 */
export default async function Indicaciones({ params }: { params: Promise<{ slug: string }> }) {
  const modelo = modeloPulseraPorId((await params).slug);
  if (!modelo) notFound();

  const layout = ubicacionesDePulsera(modelo, modelo.largoBaseCm);
  const punto = PUNTOS[modelo.armado];
  const video = idDeVideo(punto.video);

  const porColor = modelo.paleta.map((cuenta, papel) => ({
    cuenta,
    papel,
    cantidad: layout.cuentas.filter((c) => c.tono === papel).length,
  })).filter((fila) => fila.cantidad > 0);

  return (
    <div className="pagina-ancha">
      <div className="no-imprimir mb-8">
        <Link href="/admin/pulseras" className="sobretitulo hover:text-tinta">
          ← Volver a pulseras
        </Link>
      </div>

      <p className="sobretitulo">{modelo.tecnica}</p>
      <h1 className="titulo mt-2 text-3xl">{modelo.nombre}</h1>
      <p className="mt-3 max-w-2xl text-humo">{modelo.descripcion}</p>
      <div className="filete my-6 max-w-[8rem]" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div>
          <TarjetaPulseraViva
            modelo={modelo}
            className="no-imprimir aspect-square w-full border border-linea"
          />

          <section className="mt-8">
            <h2 className="sobretitulo">Lo que hay que sacar del stock</h2>
            <div className="filete mb-4 mt-2 max-w-[4rem]" />
            <table className="w-full text-sm">
              <tbody className="divide-y divide-linea border-y border-linea">
                {porColor.map(({ cuenta, papel, cantidad }) => (
                  <tr key={papel}>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-2">
                        <span
                          className="block h-4 w-4 shrink-0 rounded-full border border-linea"
                          style={{ background: cuenta.color }}
                        />
                        <span>{cuenta.nombre}</span>
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-gris">
                      {modelo.nombresColor[papel]} · {cuenta.mm} mm
                    </td>
                    <td className="py-2 text-right tabular-nums">{cantidad}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 font-medium">Total</td>
                  <td />
                  <td className="py-2 text-right font-medium tabular-nums">{layout.cuentas.length}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs leading-relaxed text-gris">
              Cierra entre {cm(Math.round((layout.largoCm - layout.ajusteCm) * 10) / 10)} y{" "}
              {cm(layout.largoCm)}, y mide {modelo.anchoCm.toFixed(1)} cm de ancho.
              El largo sale de la pieza: se redondea para arriba, porque la cadena
              solo acorta.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="sobretitulo">El cierre</h2>
            <div className="filete mb-4 mt-2 max-w-[4rem]" />
            <ul className="space-y-1.5 text-sm">
              {MATERIALES_CIERRE.map((cosa) => (
                <li key={cosa} className="flex gap-3">
                  <span className="text-oro">·</span>
                  <span>{cosa}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-gris">
              En {METALES.map((m) => m.nombre.toLowerCase()).join(" o ")}, como lo
              haya pedido la clienta. La cadena deja cerrar hasta{" "}
              {cm(layout.ajusteCm)} más corta, así que el largo no tiene que caer
              justo.
            </p>
          </section>
        </div>

        <div>
          <section>
            <h2 className="titulo text-xl">Cómo se teje</h2>
            <p className="mt-1 text-sm text-humo">{punto.nombre}</p>
            <div className="filete mb-5 mt-3 max-w-[4rem]" />
            <ol className="space-y-3">
              {punto.pasos.map((paso, i) => (
                <li key={i} className="flex gap-4 border-b border-linea pb-3 last:border-0">
                  <span className="titulo w-6 shrink-0 text-lg text-oro tabular-nums">{i + 1}</span>
                  <span className="text-sm leading-relaxed">{paso}</span>
                </li>
              ))}
            </ol>
          </section>

          {punto.tips.length > 0 && (
            <section className="mt-10">
              <h2 className="sobretitulo">Para tener en cuenta</h2>
              <div className="filete mb-4 mt-2 max-w-[4rem]" />
              <ul className="space-y-2 text-sm leading-relaxed text-humo">
                {punto.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-oro">·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {punto.video && (
            <section className="mt-10">
              <h2 className="sobretitulo">El video</h2>
              <div className="filete mb-4 mt-2 max-w-[4rem]" />
              {video && (
                <div className="no-imprimir aspect-video w-full border border-linea">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video}`}
                    title={punto.videoNombre ?? "Video de la técnica"}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              )}
              <p className="mt-3 text-sm text-humo">
                <a href={punto.video} target="_blank" rel="noreferrer" className="text-oro underline">
                  {punto.videoNombre ?? punto.video}
                </a>{" "}
                — la misma técnica, en tiempo real y sin cortes.
              </p>
            </section>
          )}

          <p className="mt-10 text-xs text-gris">
            El punto sale del pliego <code>{punto.pliego}</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
