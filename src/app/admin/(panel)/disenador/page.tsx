import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { armarLayout, medidasDePatron } from "@/lib/cartera/geometria";
import { descomprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import { celdasDeLlana, FORRO_LLANA, LLANAS, paletaDeLlana } from "@/lib/cartera/llanas";
import TarjetaCarteraViva from "@/components/TarjetaCarteraViva";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carteras · Panel" };

/**
 * **Una sola sección para todo lo que es una cartera.** Antes había dos —el
 * diseñador por un lado y los estampados por el otro— y había que saber de
 * antemano cuál abrir. Ahora se entra siempre acá: primero se elige la cartera
 * **viéndola**, y recién después se la edita.
 *
 * Lo dijo María: *"aquí debo poder ver las carteras, no solo los nombres…
 * diseños y estampados deben ser una sola donde yo primero selecciono la
 * cartera y luego puedo editarla"*.
 */
export default async function Carteras() {
  const patrones = await prisma.patronCartera.findMany({
    include: { producto: { select: { nombre: true, slug: true, stock: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <>
      <p className="sobretitulo">Taller</p>
      <h1 className="titulo mt-2 text-3xl">Carteras</h1>
      <p className="mt-3 max-w-xl text-humo">
        Elegí una y entrá a editarla: giralas, pintá las cuentas que quieras, cambiá las
        medidas y guardá. O empezá una nueva con un estampado.
      </p>
      <div className="filete my-6 max-w-[8rem]" />

      {/* ── Empezar una nueva ── */}
      <h2 className="sobretitulo mb-1">Empezar una nueva</h2>
      <p className="mb-4 text-sm text-humo">
        Las formas de la línea, en gris: son las cuentas patrón, no un color. El
        color entra cuando elegís el estampado.
      </p>
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LLANAS.map((l) => (
          <Link
            key={l.slug}
            href={`/admin/estampados?llana=${l.slug}`}
            className="border border-linea bg-papel transition-colors hover:border-oro"
          >
            <TarjetaCarteraViva
              medidas={l.medidas}
              paleta={paletaDeLlana(l)}
              celdas={celdasDeLlana(l)}
              colorForro={FORRO_LLANA}
              className="aspect-[4/3] w-full border-b border-linea"
            />
            <span className="block p-4">
              <span className="titulo block text-lg">{l.nombre}</span>
              <span className="mt-1 block text-xs text-humo">{l.resumen}</span>
              <span className="mt-3 block text-xs uppercase tracking-[0.12em] text-oro">
                Elegir estampado →
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* ── Las que ya están ── */}
      <h2 className="sobretitulo mb-3">Las que ya están</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {patrones.map((p) => {
          const paleta: CuentaPaleta[] = JSON.parse(p.paleta);
          const medidas = medidasDePatron(p);
          const layout = armarLayout(medidas);
          const celdas = descomprimir(p.celdas, layout.cuentas.length);
          // El estampado reemplaza el dibujo entero, así que solo se ofrece
          // sobre una cartera lisa: sobre una que ya tiene dibujo, lo borraría.
          const deUnColor = paleta.length === 1;

          return (
            <article key={p.id} className="border border-linea bg-papel">
              <Link href={`/admin/disenador/${p.slug}`} className="block">
                <TarjetaCarteraViva
                  medidas={medidas}
                  paleta={paleta}
                  celdas={celdas}
                  className="aspect-[4/3] w-full border-b border-linea"
                />
              </Link>
              <div className="p-5">
                <div className="mb-3 flex gap-1.5">
                  {paleta.map((c, i) => (
                    <span
                      key={i}
                      className="h-5 w-5 rounded-full border border-linea"
                      style={{ background: c.color }}
                      title={c.nombre}
                    />
                  ))}
                </div>
                <Link href={`/admin/disenador/${p.slug}`} className="titulo text-xl hover:text-oro">
                  {p.nombre}
                </Link>
                <p className="mt-1 text-sm tabular-nums text-humo">
                  {p.anchoCm} × {p.altoCm} × {p.profundidadCm} cm ·{" "}
                  {layout.cuentas.length.toLocaleString("es-AR")} cuentas
                </p>
                {p.producto && (
                  <p className="mt-3 text-xs uppercase tracking-[0.12em] text-oro">
                    Vinculada a {p.producto.nombre}
                  </p>
                )}
                {deUnColor && (
                  <Link
                    href={`/admin/estampados?patron=${p.slug}`}
                    className="mt-3 block text-xs uppercase tracking-[0.12em] text-oro"
                  >
                    Ponerle un estampado →
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {patrones.length === 0 && (
        <div className="tarjeta p-12 text-center">
          <p className="titulo text-xl">No hay carteras todavía</p>
          <p className="mt-2 text-sm text-humo">
            Empezá una nueva acá arriba, o corré <code>npm run db:seed</code> para cargar las
            que salen de las fichas de <code>carteras diseños/</code>.
          </p>
        </div>
      )}
    </>
  );
}
