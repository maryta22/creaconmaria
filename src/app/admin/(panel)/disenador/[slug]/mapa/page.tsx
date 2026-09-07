import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { armarLayout, medidasDePatron } from "@/lib/cartera/geometria";
import { descomprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import MapaTejido from "@/components/MapaTejido";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await prisma.patronCartera.findUnique({ where: { slug: (await params).slug } });
  return { title: p ? `Mapa de tejido · ${p.nombre}` : "Mapa de tejido" };
}

export default async function Mapa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.patronCartera.findUnique({ where: { slug } });
  if (!p) notFound();

  const layout = armarLayout(medidasDePatron(p));
  const paleta: CuentaPaleta[] = JSON.parse(p.paleta);

  return (
    <div className="pagina-ancha">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={`/admin/disenador/${p.slug}`} className="sobretitulo hover:text-tinta">
            Volver al diseñador
          </Link>
          <h1 className="titulo mt-2 text-3xl">Mapa de tejido</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/admin/disenador/${p.slug}`} className="btn btn-linea">
            Volver al diseñador
          </Link>
        </div>
      </div>

      <div className="border border-linea">
        <MapaTejido
          nombre={p.nombre}
          layout={layout}
          celdas={descomprimir(p.celdas, layout.cuentas.length)}
          paleta={paleta}
          ficha={p.ficha}
        />
      </div>
    </div>
  );
}
