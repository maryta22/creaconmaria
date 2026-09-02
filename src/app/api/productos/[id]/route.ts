import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";
import { datosDeProducto } from "@/lib/producto";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }
  const { id } = await params;
  const datos = datosDeProducto(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });

  // Las fotos se reemplazan enteras: llega la lista final desde el formulario.
  await prisma.$transaction([
    prisma.foto.deleteMany({ where: { productoId: id } }),
    prisma.producto.update({
      where: { id },
      data: { ...datos.valores, fotos: { create: datos.fotos } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }
  await prisma.producto.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
