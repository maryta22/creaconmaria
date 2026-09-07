import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { datosDeDije } from "@/lib/dijes";
import { haySesion } from "@/lib/sesion";

export async function POST(req: Request) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const datos = datosDeDije(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  const dije = { id: randomUUID(), ...datos.valores };
  await prisma.$executeRaw`
    INSERT INTO DijeStock (id, nombre, descripcion, imagenUrl, stock, activo, creadoEn, actualizadoEn)
    VALUES (${dije.id}, ${dije.nombre}, ${dije.descripcion}, ${dije.imagenUrl}, ${dije.stock}, ${dije.activo ? 1 : 0}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  return NextResponse.json({ dije });
}
