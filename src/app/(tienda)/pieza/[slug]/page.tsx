import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoriaPorId, nombreCategoria } from "@/lib/categorias";
import { medidasDetalladas, precio } from "@/lib/formato";
import TarjetaProducto from "@/components/TarjetaProducto";
import GaleriaPieza, { type PatronVitrina } from "@/components/GaleriaPieza";
import { armarLayout, medidasDePatron } from "@/lib/cartera/geometria";
import { descomprimir } from "@/lib/cartera/modelos";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import SelectorCuentaCartera, { PersonalizacionCarteraProveedor } from "@/components/SelectorCuentaCartera";
import { paletaDeVitrina } from "@/lib/cuentas-base";
import { esCarteraBase } from "@/lib/cartera/llanas";
import { MEDIDAS_CARTERA } from "@/lib/cartera/medida";

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
    const medidas = medidasDePatron(p.patron);
    const layout = armarLayout(medidas);
    patron = {
      medidas,
      paleta: esCarteraBase(p.slug)
        ? paletaDeVitrina(JSON.parse(p.patron.paleta))
        : JSON.parse(p.patron.paleta),
      enGris: esCarteraBase(p.slug),
      celdas: descomprimir(p.patron.celdas, layout.cuentas.length),
      totalCuentas: layout.cuentas.length,
    };
  }

  const categoria = categoriaPorId(p.categoria);
  /**
   * Si la pieza se puede personalizar, la medida de la cuenta la elige la
   * clienta y sale del selector: dejarla también en la tabla de medidas hacía
   * que la ficha dijera 8 mm mientras el visor mostraba la de 10.
   */
  const medidas = medidasDetalladas(p).filter(
    (fila) => !(p.patron && fila.etiqueta === "Cuenta"),
  );
  const agotado = p.stock <= 0;
  const cuentasParaPersonalizar = p.patron
    ? await prisma.cuentaStock.findMany({
      /**
       * Todas las medidas con las que se teje una cartera, no solo la del
       * patrón: la clienta puede pasar de 8 a 10 mm y la lista de colores tiene
       * que seguirla. El filtro por medida se hace en la pantalla.
       */
      where: { activo: true, stock: { gt: 0 }, tamanoMm: { in: [...MEDIDAS_CARTERA] } },
      select: { id: true, nombre: true, color: true, tamanoMm: true, acabado: true, precioUnidad: true, stock: true },
      orderBy: { nombre: "asc" },
    })
    : [];

  const similares = await prisma.producto.findMany({
    where: { publicado: true, categoria: p.categoria, id: { not: p.id } },
    include: { fotos: { orderBy: { orden: "asc" } } },
    orderBy: { creadoEn: "desc" },
    take: 4,
  });

  return (
    <PersonalizacionCarteraProveedor medidaInicial={p.patron?.cuentaMm ?? 8}>
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
            cuentasParaPersonalizar.length > 0 ? (
              <SelectorCuentaCartera
                producto={{
                  id: p.id,
                  slug: p.slug,
                  nombre: p.nombre,
                  precio: p.precio,
                  stock: p.stock,
                  foto: p.fotos[0]?.url,
                }}
                cuentas={cuentasParaPersonalizar}
              />
            ) : (
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
            )
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
    </PersonalizacionCarteraProveedor>
  );
}
