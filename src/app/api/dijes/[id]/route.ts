import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { datosDeDije } from "@/lib/dijes";
import { haySesion } from "@/lib/sesion";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const datos = datosDeDije(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  await prisma.dijeStock.update({ where: { id: (await params).id }, data: datos.valores });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  await prisma.dijeStock.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
