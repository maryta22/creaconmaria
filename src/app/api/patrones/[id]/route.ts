import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";

/** Guardar el patrón editado: colores de cada cuenta, paleta y/o medidas. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const { id } = await params;
  const cuerpo = await req.json();
  const datos: Record<string, unknown> = {};

  if (typeof cuerpo.nombre === "string" && cuerpo.nombre.trim()) datos.nombre = cuerpo.nombre.trim();
  if (typeof cuerpo.celdas === "string") datos.celdas = cuerpo.celdas;
  if (Array.isArray(cuerpo.paleta)) datos.paleta = JSON.stringify(cuerpo.paleta);
  if (cuerpo.productoId === null || typeof cuerpo.productoId === "string") {
    datos.productoId = cuerpo.productoId || null;
  }

  for (const campo of ["anchoCm", "altoCm", "profundidadCm", "altoSolapaCm", "asaCm", "cuentaMm", "separacion"]) {
    const valor = Number(cuerpo[campo]);
    if (Number.isFinite(valor) && valor >= 0) datos[campo] = valor;
  }

  if (Object.keys(datos).length === 0) {
    return NextResponse.json({ error: "Nada que guardar" }, { status: 400 });
  }

  await prisma.patronCartera.update({ where: { id }, data: datos });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }
  await prisma.patronCartera.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
