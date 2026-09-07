import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Hilo3D from "@/components/Hilo3DCliente";
import Pulsera3D from "@/components/Pulsera3D";
import BotonAgregarCarrito from "@/components/BotonAgregarCarrito";
import { descomprimir } from "@/lib/celdas";
import { materialesDe, paletaGuardada } from "@/lib/hilo/diseno";
import { tipoPorCategoria } from "@/lib/hilo/tipos";
import { leerDisenoPulsera } from "@/lib/pulsera/modelos";
import { cm, precio as enPlata } from "@/lib/formato";

/** Igual que en el disenador: es una pieza a pedido, no un stock que se agota. */
const MAX_POR_PEDIDO = 5;

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }) {
  const diseno = await prisma.disenoCliente.findUnique({ where: { codigo: (await params).codigo } });
  return { title: diseno ? `${diseno.nombre} (${diseno.codigo})` : "Diseno" };
}

export default async function VerDiseno({ params }: { params: Promise<{ codigo: string }> }) {
  const codigo = (await params).codigo.toUpperCase();
  const diseno = await prisma.disenoCliente.findUnique({ where: { codigo } });
  if (!diseno) notFound();

  const tipo = tipoPorCategoria(diseno.tipo);
  const paleta = paletaGuardada(diseno.paleta);
  if (!tipo || paleta.length === 0) notFound();

  const tejido = tipo.slug === "pulsera" ? leerDisenoPulsera(diseno.celdas, diseno.largoObjetivoCm) : null;
  const celdas = tejido?.celdas ?? descomprimir(diseno.celdas, diseno.celdas.length);
  const materiales = materialesDe(paleta, celdas);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="sobretitulo">Diseno {diseno.codigo}</p>
      <h1 className="titulo mt-2 text-4xl">{diseno.nombre}</h1>
      <div className="filete mb-8 mt-5 max-w-[8rem]" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="fondo-3d relative aspect-square w-full border border-linea">
          {tejido ? (
            <Pulsera3D
              layout={tejido.layout}
              paleta={paleta}
              celdas={celdas}
              cierre={tejido.cierre}
              autoGirar
              className="h-full w-full"
            />
          ) : (
            <Hilo3D
              tipo={tipo}
              paleta={paleta}
              celdas={celdas}
              encuadreCm={diseno.largoObjetivoCm}
              autoGirar
              className="h-full w-full"
            />
          )}
          <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-center text-xs text-papel/65">
            Arrastra para girar · Usa la rueda o pellizca para acercar
          </p>
        </div>

        <aside className="h-fit space-y-8">
          <section>
            <p className="sobretitulo">La pieza</p>
            <div className="filete mb-4 mt-2 max-w-[4rem]" />
            <dl className="space-y-2 text-sm">
              <Fila etiqueta="Tipo" valor={tipo.nombre} />
              {tejido && <Fila etiqueta="Tecnica" valor={tejido.modelo.tecnica} />}
              <Fila etiqueta="Largo" valor={cm(diseno.largoCm)} />
              {tejido && <Fila etiqueta="Ancho" valor={`${tejido.modelo.anchoCm.toFixed(1)} cm`} />}
              <Fila etiqueta="Cuentas" valor={`${celdas.length}`} />
              <Fila
                etiqueta="Cierre"
                valor={tejido ? `${tipo.cierre} ${tejido.cierre} + ${cm(tejido.layout.ajusteCm)} de ajuste` : tipo.cierre}
              />
            </dl>
          </section>

          <section>
            <p className="sobretitulo">Lo que lleva</p>
            <div className="filete mb-4 mt-2 max-w-[4rem]" />
            <ul className="space-y-1.5 text-sm">
              {materiales.map((material) => (
                <li key={material.indice} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="block h-3.5 w-3.5 shrink-0 rounded-full border border-linea"
                      style={{ background: material.cuenta.color }}
                    />
                    <span className="truncate text-humo">{material.cuenta.nombre}</span>
                    <span className="shrink-0 text-gris">{material.cuenta.mm} mm</span>
                  </span>
                  <span className="shrink-0 text-gris">{material.cantidad}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="tarjeta p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-gris">Estimado</p>
            <p className="precio mb-4 mt-1">{enPlata(diseno.precio)}</p>
            <BotonAgregarCarrito
              producto={{
                id: `diseno-${diseno.codigo}`,
                slug: diseno.codigo,
                nombre: `${diseno.nombre} (${diseno.codigo})`,
                precio: diseno.precio,
                stock: MAX_POR_PEDIDO,
                enlace: `/disenar/ver/${diseno.codigo}`,
              }}
            />
            <p className="mt-4 text-xs leading-relaxed text-gris">
              Maria confirma disponibilidad y total antes de cobrar. Si queres cambiarle algo, armas otro codigo.
            </p>
          </section>

          <Link href={tejido ? `/disenar/pulsera?modelo=${tejido.modelo.id}` : `/disenar/${tipo.slug}`} className="btn btn-linea w-full">
            {tejido ? "Editar otro color" : "Disenar otra"}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-linea pb-2">
      <dt className="text-gris">{etiqueta}</dt>
      <dd className="text-humo">{valor}</dd>
    </div>
  );
}
