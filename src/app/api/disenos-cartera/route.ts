import { acabadoDeCuenta } from "@/lib/cuentas";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sirveParaCartera, CUENTA_MINIMA_MM, armarLayout } from "@/lib/cartera/geometria";
import { estampadoPorSlug } from "@/lib/cartera/estampados";
import { celdasDeEstampado, llanaPorSlug } from "@/lib/cartera/llanas";
import { comprimir, type CuentaPaleta } from "@/lib/cartera/modelos";

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Seis caracteres, sin las que se confunden a mano (I, O, 0, 1). */
function nuevoCodigo() {
  let codigo = "";
  for (let i = 0; i < 6; i++) codigo += LETRAS[Math.floor(Math.random() * LETRAS.length)];
  return codigo;
}

function codigoRepetido(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

/**
 * Guarda la cartera que personalizó un cliente. **Es público**: no hay login en
 * la tienda, así que del navegador solo se aceptan **elecciones** —qué llana,
 * qué estampado, qué cuentas— y nunca un patrón. Las celdas, el conteo y el
 * precio se calculan acá con el inventario de verdad.
 *
 * La paleta y las medidas se guardan **como copia** adentro del diseño: una
 * cartera que un cliente mandó tiene que seguir viéndose igual aunque María
 * borre esa cuenta del stock o le cambie el precio.
 *
 * **Lo que no sale de acá es el mapa de tejido.** El cliente elige y ve su
 * cartera; cómo se teje es de María. El mapa vive en `/admin`, detrás de la
 * sesión, y esta ruta no lo devuelve ni lo guarda.
 */
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ error: "No llegó el diseño" }, { status: 400 });
  }

  const llana = llanaPorSlug(String(cuerpo.llana ?? ""));
  const estampado = estampadoPorSlug(String(cuerpo.estampado ?? ""));
  if (!llana) return NextResponse.json({ error: "Esa cartera no existe" }, { status: 400 });
  if (!estampado) return NextResponse.json({ error: "Ese estampado no existe" }, { status: 400 });

  const ids: string[] = Array.isArray(cuerpo.cuentas) ? cuerpo.cuentas.map(String) : [];
  if (ids.length !== estampado.tonos) {
    return NextResponse.json(
      { error: `${estampado.nombre} lleva ${estampado.tonos} colores` },
      { status: 400 },
    );
  }

  const enStock = await prisma.cuentaStock.findMany({ where: { id: { in: ids }, activo: true } });
  const elegidas = ids.map((id) => enStock.find((c) => c.id === id));
  if (elegidas.some((c) => !c)) {
    return NextResponse.json({ error: "Alguna de esas cuentas ya no está disponible" }, { status: 400 });
  }
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

  const laterales = cuerpo.laterales === true;
  const medidas = { ...llana.medidas, cuentaMm: paleta[0].mm };
  const indices = celdasDeEstampado(medidas, estampado, { laterales });

  // El precio sale de las cuentas que lleva de verdad, una por una. Es
  // estimado, como el del diseñador de pulseras: los precios del inventario
  // todavía son de referencia.
  const porTono = indices.reduce<number[]>((cuenta, i) => {
    cuenta[i] = (cuenta[i] ?? 0) + 1;
    return cuenta;
  }, []);
  const precio = porTono.reduce(
    (total, cuantas, i) => total + cuantas * (elegidas[i]?.precioUnidad ?? 0),
    0,
  );

  const nombre =
    typeof cuerpo.nombre === "string" && cuerpo.nombre.trim().slice(0, 60)
      ? cuerpo.nombre.trim().slice(0, 60)
      : `${llana.nombre} ${estampado.nombre}`;
  const contacto = typeof cuerpo.contacto === "string" ? cuerpo.contacto.trim().slice(0, 120) : null;
  const nota = typeof cuerpo.nota === "string" ? cuerpo.nota.trim().slice(0, 500) : null;

  for (let intento = 0; intento < 5; intento += 1) {
    try {
      const diseno = await prisma.disenoCartera.create({
        data: {
          codigo: nuevoCodigo(),
          llana: llana.slug,
          estampado: estampado.slug,
          nombre,
          paleta: JSON.stringify(paleta),
          medidas: JSON.stringify(medidas),
          celdas: comprimir(indices),
          precio: Math.round(precio * 100) / 100,
          contacto: contacto || null,
          nota: nota || null,
        },
      });
      return NextResponse.json({
        ok: true,
        codigo: diseno.codigo,
        cuentas: armarLayout(medidas).cuentas.length,
        precio: diseno.precio,
      });
    } catch (e) {
      if (!codigoRepetido(e)) throw e;
    }
  }

  return NextResponse.json({ error: "No se pudo guardar, probá de nuevo" }, { status: 500 });
}
