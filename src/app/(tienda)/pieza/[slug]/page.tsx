import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoriaPorId, nombreCategoria } from "@/lib/categorias";
import { medidasDetalladas, precio } from "@/lib/formato";
import TarjetaProducto from "@/components/TarjetaProducto";
import GaleriaPieza, { type PatronVitrina } from "@/components/GaleriaPieza";
import { armarLayout } from "@/lib/cartera/geometria";
import { descomprimir } from "@/lib/cartera/modelos";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await prisma.producto.findUnique({ where: { slug: (await params).slug } });
  return { title: p?.nombre ?? "Pieza" };
}

export default async function Pieza({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.producto.findUnique({
    where: { slug },
    include: { fotos: { orderBy: { orden: "asc" } }, patron: true },
  });
  if (!p || !p.publicado) notFound();

  // Si la pieza tiene patrón 3D, el cliente puede girarla cuenta por cuenta.
  let patron: PatronVitrina | null = null;
  if (p.patron) {
    const medidas = {
      anchoCm: p.patron.anchoCm,
      altoCm: p.patron.altoCm,
      profundidadCm: p.patron.profundidadCm,
      altoSolapaCm: p.patron.altoSolapaCm,
      asaCm: p.patron.asaCm,
      cuentaMm: p.patron.cuentaMm,
      separacion: p.patron.separacion,
    };
    const layout = armarLayout(medidas);
    patron = {
      medidas,
      paleta: JSON.parse(p.patron.paleta),
      celdas: descomprimir(p.patron.celdas, layout.cuentas.length),
      totalCuentas: layout.cuentas.length,
    };
  }

  const categoria = categoriaPorId(p.categoria);
  const medidas = medidasDetalladas(p);
  const agotado = p.stock <= 0;

  const similares = await prisma.producto.findMany({
    where: { publicado: true, categoria: p.categoria, id: { not: p.id } },
    include: { fotos: { orderBy: { orden: "asc" } } },
    orderBy: { creadoEn: "desc" },
    take: 4,
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <nav className="sobretitulo mb-8 flex gap-2">
        <Link href="/catalogo" className="hover:text-tinta">Catálogo</Link>
        <span>/</span>
        {categoria && (
          <Link href={`/catalogo/${categoria.slug}`} className="hover:text-tinta">
            {categoria.nombre}
          </Link>
        )}
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Fotos y, si la hay, la cartera en 3D */}
        <GaleriaPieza nombre={p.nombre} fotos={p.fotos} patron={patron} />

        {/* Ficha */}
        <div>
          <p className="sobretitulo">{nombreCategoria(p.categoria)}</p>
          <h1 className="titulo mt-2 text-4xl leading-tight">{p.nombre}</h1>
          <p className="precio mt-4 text-2xl">{precio(p.precio)}</p>

          <div className="mt-4">
            {agotado ? (
              <span className="chip chip-agotado">Agotada — se puede encargar</span>
            ) : (
              <span className="chip chip-oro">
                {p.stock === 1 ? "Última disponible" : `${p.stock} disponibles`}
              </span>
            )}
          </div>

          {p.descripcion && (
            <p className="mt-6 leading-relaxed text-humo">{p.descripcion}</p>
          )}

          {medidas.length > 0 && (
            <section className="mt-10">
              <p className="sobretitulo">Medidas</p>
              <div className="filete mb-4 mt-2 max-w-[6rem]" />
              <dl className="divide-y divide-linea border-y border-linea">
                {medidas.map((m) => (
                  <div key={m.etiqueta} className="flex justify-between py-2.5 text-sm">
                    <dt className="text-humo">{m.etiqueta}</dt>
                    <dd className="tabular-nums">{m.valor}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {(p.materiales || p.color) && (
            <section className="mt-8">
              <p className="sobretitulo">Materiales</p>
              <div className="filete mb-4 mt-2 max-w-[6rem]" />
              <p className="text-sm leading-relaxed text-humo">
                {[p.materiales, p.color].filter(Boolean).join(" · ")}
              </p>
            </section>
          )}

          {!agotado && (
            <div className="mt-8 max-w-sm">
              <BotonAgregarCarrito producto={{
                id: p.id,
                slug: p.slug,
                nombre: p.nombre,
                precio: p.precio,
                stock: p.stock,
                foto: p.fotos[0]?.url,
              }} />
            </div>
          )}

        </div>
      </div>

      {similares.length > 0 && (
        <section className="mt-24">
          <p className="sobretitulo">Más {categoria?.nombre.toLowerCase() ?? "piezas"}</p>
          <div className="filete mb-8 mt-3 max-w-[8rem]" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {similares.map((s) => (
              <TarjetaProducto key={s.id} p={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
