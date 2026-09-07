import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DisenadorHilo, { type CuentaConStock } from "@/components/DisenadorHilo";
import DisenadorPulseraTejida from "@/components/DisenadorPulseraTejida";
import { aPaleta } from "@/lib/hilo/diseno";
import { tipoPorSlug } from "@/lib/hilo/tipos";
import { modeloPulseraPorId } from "@/lib/pulsera/modelos";

/** El inventario cambia seguido, por eso la pantalla se arma en el momento. */
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: Promise<{ tipo: string }> }) {
  return params.then(({ tipo: slug }) => {
    const tipo = tipoPorSlug(slug);
    return { title: tipo ? `Diseña tu ${tipo.nombre.toLowerCase()}` : "Diseña la tuya" };
  });
}

export default async function DisenarTipo({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ modelo?: string }>;
}) {
  const tipo = tipoPorSlug((await params).tipo);
  const modeloId = (await searchParams).modelo;
  if (!tipo) notFound();

  const modelo = tipo.slug === "pulsera" && modeloId ? modeloPulseraPorId(modeloId) : undefined;
  if (tipo.slug === "pulsera" && modeloId && !modelo) notFound();

  const cuentas = await prisma.cuentaStock.findMany({
    where: { activo: true },
    orderBy: [{ tamanoMm: "asc" }, { nombre: "asc" }],
  });
  const stockPorId = new Map(cuentas.map((cuenta) => [cuenta.id, cuenta.stock]));
  const conStock: CuentaConStock[] = aPaleta(cuentas).map((cuenta) => ({
    ...cuenta,
    stock: stockPorId.get(cuenta.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href={modelo ? "/catalogo/pulseras" : "/disenar"}
        className="text-xs uppercase tracking-[0.14em] text-gris hover:text-tinta"
      >
        ← {modelo ? "Otro modelo" : "Otra pieza"}
      </Link>
      <p className="sobretitulo mt-6">{modelo ? "Modelo a medida" : "A medida"}</p>
      <h1 className="titulo mt-2 text-4xl">{modelo ? modelo.nombre : `Tu ${tipo.nombre.toLowerCase()}`}</h1>
      <div className="filete mb-6 mt-5 max-w-[8rem]" />
      <p className="mb-10 max-w-2xl text-humo">{modelo ? modelo.descripcion : tipo.descripcion}</p>

      {modelo ? (
        <DisenadorPulseraTejida modelo={modelo} cuentas={conStock} />
      ) : (
        <DisenadorHilo tipo={tipo} cuentas={conStock} />
      )}
    </div>
  );
}
