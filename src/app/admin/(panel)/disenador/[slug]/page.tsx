import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DisenadorCartera, { type PatronEditable } from "@/components/DisenadorCartera";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await prisma.patronCartera.findUnique({ where: { slug: (await params).slug } });
  return { title: p ? `Diseñador · ${p.nombre}` : "Diseñador" };
}

export default async function EditarPatron({ params }: { params: Promise<{ slug: string }> }) {
  const [p, cuentas] = await Promise.all([
    prisma.patronCartera.findUnique({
      where: { slug: (await params).slug },
      include: { producto: { select: { nombre: true, slug: true } } },
    }),
    prisma.cuentaStock.findMany({
      where: { activo: true, stock: { gt: 0 } },
      orderBy: { nombre: "asc" },
    }),
  ]);
  if (!p) notFound();

  const patron: PatronEditable = {
    id: p.id,
    nombre: p.nombre,
    ficha: p.ficha,
    medidas: {
      anchoCm: p.anchoCm,
      altoCm: p.altoCm,
      profundidadCm: p.profundidadCm,
      altoSolapaCm: p.altoSolapaCm,
      asaCm: p.asaCm,
      cuentaMm: p.cuentaMm,
      separacion: p.separacion,
    },
    paleta: JSON.parse(p.paleta),
    celdas: p.celdas,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sobretitulo">
            <Link href="/admin/disenador" className="hover:text-tinta">Diseñador</Link>
          </p>
          <h1 className="titulo mt-2 text-3xl">{p.nombre}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/disenador/${p.slug}/mapa`} className="btn btn-chico">
            Mapa de tejido
          </Link>
          {p.producto && (
            <Link href={`/pieza/${p.producto.slug}`} className="btn btn-linea btn-chico">
              Ver en la tienda
            </Link>
          )}
        </div>
      </div>
      <div className="filete my-6 max-w-[8rem]" />

      <DisenadorCartera
        patron={patron}
        cuentasDisponibles={cuentas.map((cuenta) => ({
          id: cuenta.id,
          nombre: cuenta.nombre,
          color: cuenta.color,
          tamanoMm: cuenta.tamanoMm,
          acabado: cuenta.acabado as "perla" | "metal" | "mate",
          stock: cuenta.stock,
        }))}
      />
    </>
  );
}
