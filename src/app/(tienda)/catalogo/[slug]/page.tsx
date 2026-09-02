import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS, categoriaPorSlug } from "@/lib/categorias";
import Vitrina from "@/components/Vitrina";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const categoria = categoriaPorSlug((await params).slug);
  return { title: categoria?.nombre ?? "Catálogo" };
}

export default async function CatalogoPorCategoria({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const categoria = categoriaPorSlug((await params).slug);
  if (!categoria) notFound();

  const productos = await prisma.producto.findMany({
    where: { publicado: true, categoria: categoria.id },
    include: { fotos: { orderBy: { orden: "asc" } } },
    orderBy: [{ stock: "desc" }, { creadoEn: "desc" }],
  });

  return (
    <Vitrina
      titulo={categoria.nombre}
      sobretitulo="Catálogo"
      descripcion={categoria.descripcion}
      productos={productos}
      slugActivo={categoria.slug}
    />
  );
}
