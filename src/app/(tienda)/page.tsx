import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/categorias";
import TarjetaProducto from "@/components/TarjetaProducto";
import FotoProducto from "@/components/FotoProducto";
import { tipoPorCategoria } from "@/lib/hilo/tipos";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [destacados, porCategoria] = await Promise.all([
    prisma.producto.findMany({
      where: { publicado: true, destacado: true },
      include: { fotos: { orderBy: { orden: "asc" } }, patron: true },
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

        <div className="relative mx-auto min-h-72 w-full max-w-md overflow-hidden rounded-2xl border border-linea bg-hueso shadow-[0_22px_50px_rgba(21,19,15,0.08)] sm:min-h-80">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[18px] border-oro/20" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-oro/10" />
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(var(--color-oro)_1px,transparent_1px)] [background-size:12px_12px]" />

          <div className="absolute inset-x-7 top-8 h-48 rotate-[-3deg] rounded-lg border border-oro-claro bg-white shadow-[10px_12px_0_rgba(199,166,0,0.16)] sm:inset-x-10 sm:top-10 sm:h-52">
            <Image
              src="/logo.jpeg"
              alt="Crea con María"
              width={2048}
              height={2048}
              className="absolute left-1/2 top-[-15.5rem] w-[45rem] max-w-none -translate-x-1/2 mix-blend-multiply sm:top-[-16.75rem] sm:w-[49rem]"
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-linea bg-white/90 px-6 py-4 text-xs uppercase tracking-[0.18em] text-humo">
            <span>Hecho a mano</span>
            <span className="text-oro">Ecuador</span>
          </div>
        </div>
      </section>

      {/* Las cuatro líneas */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-px border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => {
            const tipo = tipoPorCategoria(c.id);
            return (
              <article key={c.id} className="group bg-white p-6 transition-all hover:bg-hueso hover:shadow-[inset_0_0_0_1px_rgba(199,166,0,0.35)]">
                <Link href={`/catalogo/${c.slug}`} className="block">
                  <p className="sobretitulo">{cuenta.get(c.id) ?? 0} disponibles</p>
                  <h2 className="titulo mt-2 text-xl">{c.nombre}</h2>
                  <p className="mt-2 text-sm text-humo">{c.descripcion}</p>
                  <span className="mt-4 inline-block text-xs tracking-[0.14em] text-oro uppercase">
                    Ver →
                  </span>
                </Link>
                {tipo && (
                  <Link href={`/disenar/${tipo.slug}`} className="btn btn-linea btn-chico mt-5 w-full">
                    Crea el tuyo
                  </Link>
                )}
              </article>
            );
          })}
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
