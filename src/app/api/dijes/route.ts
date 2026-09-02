import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { datosDeDije } from "@/lib/dijes";
import { haySesion } from "@/lib/sesion";

export async function POST(req: Request) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const datos = datosDeDije(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  const dije = await prisma.dijeStock.create({ data: datos.valores });
  return NextResponse.json({ dije });
}
