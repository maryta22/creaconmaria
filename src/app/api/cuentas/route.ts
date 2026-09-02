import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { datosDeCuenta } from "@/lib/cuentas";
import { haySesion } from "@/lib/sesion";

export async function POST(req: Request) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const datos = datosDeCuenta(await req.json());
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  const cuenta = await prisma.cuentaStock.create({ data: datos.valores });
  return NextResponse.json({ cuenta });
}
