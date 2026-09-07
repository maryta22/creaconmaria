import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";

const ESTADOS = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"] as const;

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const codigo = (await params).codigo.trim().toUpperCase();
  const pedidos = await prisma.$queryRaw<{ codigo: string; nombre: string; total: number; lineas: string; estado: string; creadoEn: Date }[]>`
    SELECT codigo, nombre, total, lineas, estado, creadoEn FROM Pedido WHERE codigo = ${codigo} LIMIT 1
  `;
  const pedido = pedidos[0];
  if (!pedido) return NextResponse.json({ error: "No encontramos un pedido con ese código" }, { status: 404 });
  return NextResponse.json(pedido);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ codigo: string }> }) {
  if (!(await haySesion())) return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  const { estado } = await req.json() as { estado?: unknown };
  if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  await prisma.$executeRaw`
    UPDATE Pedido SET estado = ${estado as string}, actualizadoEn = CURRENT_TIMESTAMP WHERE codigo = ${(await params).codigo.toUpperCase()}
  `;
  return NextResponse.json({ ok: true });
}
