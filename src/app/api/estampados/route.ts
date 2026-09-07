import { acabadoDeCuenta } from "@/lib/cuentas";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haySesion } from "@/lib/sesion";
import { CUENTA_MINIMA_MM, sirveParaCartera } from "@/lib/cartera/geometria";
import { estampadoPorSlug } from "@/lib/cartera/estampados";
import { celdasDeEstampado, llanaPorSlug } from "@/lib/cartera/llanas";
import { comprimir, type CuentaPaleta } from "@/lib/cartera/modelos";

/** Un slug libre a partir del nombre, con número al final si ya existe. */
async function slugLibre(base: string) {
  const limpio =
    base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cartera";
  let candidato = limpio;
  let n = 2;
  while (await prisma.patronCartera.findUnique({ where: { slug: candidato }, select: { id: true } })) {
    candidato = `${limpio}-${n++}`;
  }
  return candidato;
}

/**
 * Crear un patrón nuevo: una cartera llana con un estampado encima.
 *
 * Del navegador solo se aceptan **elecciones**, nunca celdas: qué llana, qué
 * estampado y qué cuentas del stock. El patrón se calcula acá con las medidas
 * de la llana y la cuadrícula del estampado, así que no hay forma de mandar un
 * patrón que no salga del catálogo.
 */
export async function POST(req: Request) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const cuerpo = await req.json();
  const llana = llanaPorSlug(String(cuerpo.llana ?? ""));
  const estampado = estampadoPorSlug(String(cuerpo.estampado ?? ""));
  if (!llana) return NextResponse.json({ error: "Esa cartera llana no existe" }, { status: 400 });
  if (!estampado) return NextResponse.json({ error: "Ese estampado no existe" }, { status: 400 });

  const ids: string[] = Array.isArray(cuerpo.cuentas) ? cuerpo.cuentas.map(String) : [];
  if (ids.length !== estampado.tonos) {
    return NextResponse.json(
      { error: `${estampado.nombre} lleva ${estampado.tonos} colores` },
      { status: 400 },
    );
  }

  const enStock = await prisma.cuentaStock.findMany({ where: { id: { in: ids } } });
  // En el orden en que se eligieron: el primero es el fondo.
  const elegidas = ids.map((id) => enStock.find((c) => c.id === id));
  if (elegidas.some((c) => !c)) {
    return NextResponse.json({ error: "Alguna cuenta ya no está en el stock" }, { status: 400 });
  }

  // La regla de las carteras, otra vez acá: la pantalla no las ofrece, pero es
  // el servidor el que decide.
  if (elegidas.some((c) => !sirveParaCartera(c!.tamanoMm))) {
    return NextResponse.json(
      { error: `En una cartera no entran cuentas de menos de ${CUENTA_MINIMA_MM} mm` },
      { status: 400 },
    );
  }

  const paleta: CuentaPaleta[] = elegidas.map((c) => ({
    mm: c!.tamanoMm,
    color: c!.color,
    nombre: c!.nombre,
    acabado: acabadoDeCuenta(c!.acabado),
  }));

  // La cuenta de la cartera es la del fondo: es la que pone casi todas.
  const laterales = cuerpo.laterales === true;
  const medidas = { ...llana.medidas, cuentaMm: paleta[0].mm };
  const celdas = comprimir(celdasDeEstampado(medidas, estampado, { laterales }));

  const nombre =
    typeof cuerpo.nombre === "string" && cuerpo.nombre.trim()
      ? cuerpo.nombre.trim()
      : `${llana.nombre} ${estampado.nombre}`;

  const patron = await prisma.patronCartera.create({
    data: {
      slug: await slugLibre(nombre),
      nombre,
      ...medidas,
      paleta: JSON.stringify(paleta),
      celdas,
    },
  });

  return NextResponse.json({ ok: true, slug: patron.slug });
}
