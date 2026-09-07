import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

type LineaSolicitada = {
  id?: unknown;
  cantidad?: unknown;
  personalizacion?: { cuentaId?: unknown };
};

export async function POST(req: Request) {
  const cuerpo = await req.json() as { nombre?: unknown; contacto?: unknown; nota?: unknown; lineas?: unknown };
  const nombre = typeof cuerpo.nombre === "string" ? cuerpo.nombre.trim() : "";
  const contacto = typeof cuerpo.contacto === "string" ? cuerpo.contacto.trim() : "";
  const nota = typeof cuerpo.nota === "string" ? cuerpo.nota.trim() : "";
  if (!nombre || !contacto) return NextResponse.json({ error: "Faltan tu nombre y teléfono" }, { status: 400 });
  if (!Array.isArray(cuerpo.lineas) || cuerpo.lineas.length === 0) {
    return NextResponse.json({ error: "El pedido no tiene piezas" }, { status: 400 });
  }

  const solicitadas = cuerpo.lineas
    .map((linea) => linea as LineaSolicitada)
    .map((linea) => ({
      id: typeof linea.id === "string" ? linea.id : "",
      cantidad: Math.trunc(Number(linea.cantidad)),
      cuentaId: typeof linea.personalizacion?.cuentaId === "string" ? linea.personalizacion.cuentaId : null,
    }))
    .filter((linea) => linea.id && Number.isFinite(linea.cantidad) && linea.cantidad > 0);
  if (solicitadas.length !== cuerpo.lineas.length) return NextResponse.json({ error: "Hay piezas inválidas" }, { status: 400 });

  const productos = await prisma.producto.findMany({
    where: { id: { in: solicitadas.map((linea) => linea.id) }, publicado: true },
    select: { id: true, nombre: true, slug: true, precio: true, stock: true, cuentaMm: true },
  });
  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  const cuentas = await prisma.cuentaStock.findMany({
    where: { id: { in: solicitadas.flatMap((linea) => linea.cuentaId ? [linea.cuentaId] : []) }, activo: true, stock: { gt: 0 } },
    select: { id: true, nombre: true, color: true, tamanoMm: true },
  });
  const cuentaPorId = new Map(cuentas.map((cuenta) => [cuenta.id, cuenta]));
  const lineas = solicitadas.map((linea) => {
    const producto = porId.get(linea.id);
    if (!producto || linea.cantidad > producto.stock) return null;
    const cuenta = linea.cuentaId ? cuentaPorId.get(linea.cuentaId) : null;
    if (linea.cuentaId && (!cuenta || cuenta.tamanoMm !== producto.cuentaMm)) return null;
    return {
      id: producto.id,
      nombre: producto.nombre,
      slug: producto.slug,
      cantidad: linea.cantidad,
      precio: producto.precio,
      ...(cuenta ? { personalizacion: { cuentaId: cuenta.id, cuentaNombre: cuenta.nombre, color: cuenta.color, tamanoMm: cuenta.tamanoMm } } : {}),
    };
  });
  if (lineas.some((linea) => !linea)) {
    return NextResponse.json({ error: "Una pieza ya no está disponible en esa cantidad" }, { status: 409 });
  }

  const confirmadas = lineas.filter((linea): linea is NonNullable<typeof linea> => linea !== null);
  const total = confirmadas.reduce((suma, linea) => suma + linea.cantidad * linea.precio, 0);
  const id = randomUUID();
  const codigo = `M-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  await prisma.$executeRaw`
    INSERT INTO Pedido (id, codigo, nombre, contacto, nota, total, lineas, estado, creadoEn, actualizadoEn)
    VALUES (${id}, ${codigo}, ${nombre}, ${contacto}, ${nota || null}, ${total}, ${JSON.stringify(confirmadas)}, 'PENDIENTE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  return NextResponse.json({ id, codigo });
}
