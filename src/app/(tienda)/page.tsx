import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/categorias";
import TarjetaProducto from "@/components/TarjetaProducto";
import FotoProducto from "@/components/FotoProducto";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [destacados, porCategoria] = await Promise.all([
    prisma.producto.findMany({
      where: { publicado: true, destacado: true },
      include: { fotos: { orderBy: { orden: "asc" } } },
      orderBy: { creadoEn: "desc" },
      take: 8,
    }),
    prisma.producto.groupBy({
      by: ["categoria"],
      where: { publicado: true, stock: { gt: 0 } },
      _count: true,
    }),
  ]);

  const cuenta = new Map(porCategoria.map((f) => [f.categoria, f._count]));

  return (
    <>
      {/* Portada */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="sobretitulo">Bisutería hecha a mano</p>
          <h1 className="titulo mt-4 max-w-3xl text-4xl leading-[1.15] md:text-6xl">
            Cada pieza se teje cuenta por cuenta.
          </h1>
          <div className="filete my-8 max-w-xs" />
          <p className="max-w-xl text-humo">
            Pulseras, collares, colgadores de mochila y carteras de cuentas. Todo
            está publicado con su medida exacta, así sabés cómo te va a quedar
            antes de pedirlo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalogo" className="btn">
              Ver el catálogo
            </Link>
            <Link href="/catalogo/carteras" className="btn btn-linea">
              Carteras de cuentas
            </Link>
          </div>
        </div>

        <div className="relative mx-auto h-64 w-full max-w-md overflow-hidden border border-linea bg-white sm:h-72">
          <div className="absolute inset-4 border border-oro-claro" />
          <Image
            src="/logo.jpeg"
            alt="Crea con María"
            width={2048}
            height={2048}
            className="absolute left-1/2 top-[-17.5rem] w-[51rem] max-w-none -translate-x-1/2"
          />
        </div>
      </section>

      {/* Las cuatro líneas */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-px border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo/${c.slug}`}
              className="group bg-papel p-6 transition-colors hover:bg-white"
            >
              <p className="sobretitulo">{cuenta.get(c.id) ?? 0} disponibles</p>
              <h2 className="titulo mt-2 text-xl">{c.nombre}</h2>
              <p className="mt-2 text-sm text-humo">{c.descripcion}</p>
              <span className="mt-4 inline-block text-xs tracking-[0.14em] text-oro uppercase">
                Ver →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-8">
          <p className="sobretitulo">Selección de María</p>
          <div className="filete mb-8 mt-3 max-w-[8rem]" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {destacados.map((p) => (
              <TarjetaProducto key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {destacados.length === 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="tarjeta flex flex-col items-center gap-4 p-12 text-center">
            <div className="h-16 w-16">
              <FotoProducto nombre="M" />
            </div>
            <p className="titulo text-xl">Todavía no hay piezas cargadas</p>
            <p className="max-w-md text-sm text-humo">
              Entrá al panel, cargá tu primera pieza con su medida y su foto, y
              va a aparecer acá.
            </p>
            <Link href="/admin" className="btn btn-chico">
              Ir al panel
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
