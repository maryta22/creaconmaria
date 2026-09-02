import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { armarLayout } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diseñador 3D" };

export default async function Disenador() {
  const patrones = await prisma.patronCartera.findMany({
    include: { producto: { select: { nombre: true, slug: true, stock: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <>
      <p className="sobretitulo">Taller</p>
      <h1 className="titulo mt-2 text-3xl">Diseñador 3D de carteras</h1>
      <p className="mt-3 max-w-xl text-humo">
        Cada patrón está armado cuenta por cuenta a partir de las medidas reales.
        Entrá, giralo, pintá las cuentas que quieras y guardá.
      </p>
      <div className="filete my-6 max-w-[8rem]" />

      <div className="grid gap-px border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-3">
        {patrones.map((p) => {
          const paleta: CuentaPaleta[] = JSON.parse(p.paleta);
          const layout = armarLayout({
            anchoCm: p.anchoCm,
            altoCm: p.altoCm,
            profundidadCm: p.profundidadCm,
            altoSolapaCm: p.altoSolapaCm,
            asaCm: p.asaCm,
            cuentaMm: p.cuentaMm,
            separacion: p.separacion,
          });

          return (
            <Link
              key={p.id}
              href={`/admin/disenador/${p.slug}`}
              className="group bg-papel p-6 transition-colors hover:bg-white"
            >
              <div className="mb-4 flex gap-1.5">
                {paleta.map((c, i) => (
                  <span
                    key={i}
                    className="h-6 w-6 rounded-full border border-linea"
                    style={{ background: c.color }}
                    title={c.nombre}
                  />
                ))}
              </div>
              <h2 className="titulo text-xl">{p.nombre}</h2>
              <p className="mt-1 text-sm tabular-nums text-humo">
                {p.anchoCm} × {p.altoCm} × {p.profundidadCm} cm
              </p>
              <p className="mt-1 text-xs tabular-nums text-gris">
                {layout.cuentas.length} cuentas · paso {layout.paso.toFixed(2)} cm
              </p>
              {p.producto && (
                <p className="mt-4 text-xs uppercase tracking-[0.12em] text-oro">
                  Vinculada a {p.producto.nombre} →
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {patrones.length === 0 && (
        <div className="tarjeta p-12 text-center">
          <p className="titulo text-xl">No hay patrones todavía</p>
          <p className="mt-2 text-sm text-humo">
            Corré <code>npm run db:seed</code> para cargar los que salen de las
            fichas de <code>carteras diseños/</code>.
          </p>
        </div>
      )}
    </>
  );
}
