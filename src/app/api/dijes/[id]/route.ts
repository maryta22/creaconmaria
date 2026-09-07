import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { datosDeDije } from "@/lib/dijes";
import { haySesion } from "@/lib/sesion";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const datos = datosDeDije(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  await prisma.$executeRaw`
    UPDATE DijeStock
    SET nombre = ${datos.valores.nombre}, descripcion = ${datos.valores.descripcion}, imagenUrl = ${datos.valores.imagenUrl}, stock = ${datos.valores.stock}, activo = ${datos.valores.activo ? 1 : 0}, actualizadoEn = CURRENT_TIMESTAMP
    WHERE id = ${(await params).id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  await prisma.$executeRaw`DELETE FROM DijeStock WHERE id = ${(await params).id}`;
  return NextResponse.json({ ok: true });
}
