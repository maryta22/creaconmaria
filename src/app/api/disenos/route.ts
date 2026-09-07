import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aPaleta, datosDeDiseno, largoDe, nuevoCodigo, precioDe } from "@/lib/hilo/diseno";

/** Prisma marca así el choque de un campo único: acá, un código repetido. */
function codigoRepetido(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/**
 * Guarda el diseño que armó un cliente. **Es público**: no hay login en la
 * tienda, así que lo único que se acepta del navegador es qué cuentas usó y en
 * qué orden. El largo y el precio se calculan acá, con los datos del
 * inventario, y la paleta se guarda como copia dentro del diseño.
 */
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ error: "No llegó el diseño" }, { status: 400 });
  }

  const datos = datosDeDiseno(cuerpo as Record<string, unknown>);
  if ("error" in datos) return NextResponse.json({ error: datos.error }, { status: 400 });
  const { tipo, ids, indices, celdas, nombre, largoObjetivoCm, contacto, nota } = datos.valores;

  const enStock = await prisma.cuentaStock.findMany({ where: { id: { in: ids }, activo: true } });
  const porId = new Map(enStock.map((c) => [c.id, c]));
  const elegidas = ids.map((id) => porId.get(id));
  if (elegidas.some((c) => !c)) {
    return NextResponse.json({ error: "Alguna de esas cuentas ya no está disponible" }, { status: 400 });
  }

  const paleta = aPaleta(elegidas as NonNullable<(typeof elegidas)[number]>[]);
  const largoCm = largoDe(paleta, indices, tipo);
  const precio = precioDe(paleta, indices, tipo);

  // El código es la única llave del diseño, así que se sortea; si justo cae
  // uno ya usado se vuelve a sortear.
  for (let intento = 0; intento < 5; intento += 1) {
    try {
      const diseno = await prisma.disenoCliente.create({
        data: {
          codigo: nuevoCodigo(),
          tipo: tipo.categoria,
          nombre,
          paleta: JSON.stringify(paleta),
          celdas,
          largoObjetivoCm,
          largoCm,
          precio,
          contacto,
          nota,
        },
      });
      return NextResponse.json({ codigo: diseno.codigo, precio, largoCm });
    } catch (e) {
      if (!codigoRepetido(e)) throw e;
    }
  }

  return NextResponse.json({ error: "No se pudo guardar el diseño, probá de nuevo" }, { status: 500 });
}
