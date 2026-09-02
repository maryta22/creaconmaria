import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";
import { datosDeProducto, slugLibre } from "@/lib/producto";

export async function POST(req: Request) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const cuerpo = await req.json();
  const datos = datosDeProducto(cuerpo);
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });

  const producto = await prisma.producto.create({
    data: {
      ...datos.valores,
      slug: await slugLibre(datos.valores.nombre),
      fotos: { create: datos.fotos },
    },
  });

  return NextResponse.json({ id: producto.id, slug: producto.slug });
}
