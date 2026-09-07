import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";

export async function GET() {
  const filas = await prisma.$queryRaw<{ whatsapp: string }[]>`
    SELECT whatsapp FROM ConfiguracionVendedora WHERE id = 'principal' LIMIT 1
  `;
  return NextResponse.json({ whatsapp: filas[0]?.whatsapp ?? "" });
}

export async function PATCH(req: Request) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const { whatsapp } = await req.json() as { whatsapp?: unknown };
  const numero = typeof whatsapp === "string" ? whatsapp.replace(/\D/g, "") : "";
  if (numero.length < 8 || numero.length > 15) {
    return NextResponse.json({ error: "Ingresá el número con código de país" }, { status: 400 });
  }
  await prisma.$executeRaw`
    INSERT INTO ConfiguracionVendedora (id, whatsapp, actualizadoEn) VALUES ('principal', ${numero}, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET whatsapp = ${numero}, actualizadoEn = CURRENT_TIMESTAMP
  `;
  return NextResponse.json({ ok: true, whatsapp: numero });
}
