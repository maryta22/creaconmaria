import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormProducto, { type ValoresProducto } from "@/components/FormProducto";

export const dynamic = "force-dynamic";

/** null/undefined -> "" para que el input controlado no se queje. */
const txt = (v: string | null | undefined) => v ?? "";
const num = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export default async function EditarPieza({ params }: { params: Promise<{ id: string }> }) {
  const producto = await prisma.producto.findUnique({
    where: { id: (await params).id },
    include: { fotos: { orderBy: { orden: "asc" } } },
  });
  if (!producto) notFound();

  const inicial: ValoresProducto = {
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    descripcion: txt(producto.descripcion),
    materiales: txt(producto.materiales),
    color: txt(producto.color),
    largoCm: num(producto.largoCm),
    anchoCm: num(producto.anchoCm),
    altoCm: num(producto.altoCm),
    profundidadCm: num(producto.profundidadCm),
    cuentaMm: num(producto.cuentaMm),
    ajustable: producto.ajustable,
    extensionCm: num(producto.extensionCm),
    costo: num(producto.costo),
    precio: num(producto.precio),
    stock: String(producto.stock),
    destacado: producto.destacado,
    publicado: producto.publicado,
    notaInterna: txt(producto.notaInterna),
    fotos: producto.fotos.map((f) => ({ url: f.url, alt: f.alt })),
  };

  return (
    <>
      <p className="sobretitulo">Inventario</p>
      <h1 className="titulo mt-2 text-3xl">{producto.nombre}</h1>
      <div className="filete my-6 max-w-[8rem]" />
      <FormProducto inicial={inicial} />
    </>
  );
}
