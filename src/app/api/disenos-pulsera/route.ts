import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aPaleta, nuevoCodigo } from "@/lib/hilo/diseno";
import { esMetal } from "@/lib/pulsera/cierre";
import {
  celdasDeMatriz,
  cuentaSirveParaPapel,
  codificarDisenoPulsera,
  matrizParaLargo,
  medidaDePapel,
  modeloPulseraPorId,
  ubicacionesDePulsera,
} from "@/lib/pulsera/modelos";

function texto(valor: unknown, maximo: number) {
  return typeof valor === "string" ? valor.trim().slice(0, maximo) : "";
}

function codigoRepetido(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

/** Guarda una pulsera tejida como matriz, no como una sola tira de cuentas. */
export async function POST(req: Request) {
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo || typeof cuerpo !== "object") {
    return NextResponse.json({ error: "No llego el diseno" }, { status: 400 });
  }

  const datos = cuerpo as Record<string, unknown>;
  const modelo = modeloPulseraPorId(texto(datos.modelo, 80));
  if (!modelo) return NextResponse.json({ error: "Ese modelo de pulsera no existe" }, { status: 400 });

  const largoObjetivoCm = Number(datos.largoObjetivoCm);
  if (!Number.isFinite(largoObjetivoCm) || largoObjetivoCm < 12 || largoObjetivoCm > 24) {
    return NextResponse.json({ error: "El largo tiene que estar entre 12 y 24 cm" }, { status: 400 });
  }

  /**
   * De qué metal es el cierre. **No es una cuenta**: no sale del stock, no se
   * cotiza aparte —va en el armado, como el broche de siempre— y lo único que
   * se acepta son los dos que existen.
   */
  const cierre = esMetal(datos.cierre) ? datos.cierre : null;
  if (!cierre) {
    return NextResponse.json({ error: "Elegí el cierre: dorado o plateado" }, { status: 400 });
  }

  const ids = Array.isArray(datos.paleta)
    ? datos.paleta.filter((valor): valor is string => typeof valor === "string").map((valor) => valor.slice(0, 80))
    : [];
  if (ids.length !== modelo.paleta.length || ids.some((id) => !id)) {
    return NextResponse.json({ error: "Elegí una cuenta para cada color del modelo" }, { status: 400 });
  }

  const enStock = await prisma.cuentaStock.findMany({
    where: { id: { in: ids }, activo: true, stock: { gt: 0 } },
  });
  const porId = new Map(enStock.map((cuenta) => [cuenta.id, cuenta]));
  const elegidas = ids.map((id) => porId.get(id));
  if (elegidas.some((cuenta) => !cuenta)) {
    return NextResponse.json({ error: "Alguna cuenta ya no esta disponible" }, { status: 400 });
  }

  /**
   * **Cada papel solo acepta cuentas de su diametro.** El modelo se muestra con
   * la escala base y la clienta elige encima; si eligiera un petalo de 8 mm
   * donde va uno de 4, la flor no cerraria y la trama se fusionaria. La
   * pantalla ya filtra por medida, pero esto es lo que entra por la red.
   */
  const medidaEquivocada = elegidas.findIndex(
    (cuenta, papel) => cuenta!.tamanoMm !== medidaDePapel(modelo, papel),
  );
  if (medidaEquivocada >= 0) {
    return NextResponse.json(
      {
        error: `${modelo.nombresColor[medidaEquivocada]} tiene que ser una cuenta de ${medidaDePapel(modelo, medidaEquivocada)} mm`,
      },
      { status: 400 },
    );
  }

  const paleta = aPaleta(elegidas as NonNullable<(typeof elegidas)[number]>[]);
  if (paleta.some((cuenta, papel) => !cuentaSirveParaPapel(modelo, papel, cuenta))) {
    return NextResponse.json({ error: "Este tejido necesita cristales facetados de 4 mm." }, { status: 400 });
  }
  const matriz = matrizParaLargo(modelo, largoObjetivoCm);
  const celdas = celdasDeMatriz(matriz);
  /**
   * **El largo que se guarda es el que sale, no el que se pidio.** Las dos
   * construcciones redondean —la trama a la columna, la margarita a la flor
   * entera— y una margarita cortada al medio no es una pulsera. Guardar los 17
   * pedidos cuando la pieza mide 16,5 le miente a Maria cuando la teje.
   */
  const largoCm = ubicacionesDePulsera(modelo, largoObjetivoCm, paleta).largoCm;
  const precioCuentas = celdas.reduce((suma, indice) => suma + (paleta[indice]?.precioUnidad ?? 0), 0);
  // El armado base cubre broche y terminaciones; cada tecnica suma su tiempo propio.
  const precio = Math.round((3 + modelo.manoDeObra + precioCuentas) * 100) / 100;

  for (let intento = 0; intento < 5; intento += 1) {
    try {
      const diseno = await prisma.disenoCliente.create({
        data: {
          codigo: nuevoCodigo(),
          tipo: "PULSERA",
          nombre: `${modelo.nombre} · cierre ${cierre}`,
          paleta: JSON.stringify(paleta),
          celdas: codificarDisenoPulsera(modelo, cierre, celdas),
          largoObjetivoCm,
          largoCm,
          precio,
        },
      });
      return NextResponse.json({ codigo: diseno.codigo, precio: diseno.precio, largoCm: diseno.largoCm });
    } catch (error) {
      if (!codigoRepetido(error)) throw error;
    }
  }

  return NextResponse.json({ error: "No se pudo guardar la pulsera, proba otra vez" }, { status: 500 });
}
