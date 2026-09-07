import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { materialesDe, paletaGuardada } from "@/lib/hilo/diseno";
import { tipoPorCategoria } from "@/lib/hilo/tipos";
import { descomprimir } from "@/lib/celdas";
import { cm, precio as enPlata } from "@/lib/formato";

export const dynamic = "force-dynamic";
export const metadata = { title: "Diseños de clientes" };

const fecha = new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" });

export default async function Disenos() {
  const disenos = await prisma.disenoCliente.findMany({ orderBy: { creadoEn: "desc" }, take: 100 });

  return (
    <>
      <p className="sobretitulo">Pedidos a medida</p>
      <h1 className="titulo mt-2 text-3xl">Diseños de clientes</h1>
      <p className="mt-3 max-w-2xl text-humo">
        Lo que armó cada cliente en la tienda, con el código que te llega por
        WhatsApp. Abrilo para ver la pieza en 3D y la lista de cuentas.
      </p>
      <div className="filete my-6 max-w-[8rem]" />

      {disenos.length === 0 ? (
        <div className="tarjeta p-10 text-center text-humo">
          Todavía no llegó ningún diseño.
        </div>
      ) : (
        <div className="space-y-3">
          {disenos.map((diseno) => {
            const paleta = paletaGuardada(diseno.paleta);
            const celdas = descomprimir(diseno.celdas, diseno.celdas.length);
            const materiales = materialesDe(paleta, celdas);
            const tipo = tipoPorCategoria(diseno.tipo);

            return (
              <article key={diseno.id} className="tarjeta flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <Link
                      href={`/disenar/ver/${diseno.codigo}`}
                      target="_blank"
                      className="titulo text-lg hover:text-oro"
                    >
                      {diseno.nombre}
                    </Link>
                    <span className="chip chip-oro">{diseno.codigo}</span>
                  </div>
                  <p className="mt-1 text-sm text-humo">
                    {tipo?.nombre ?? diseno.tipo} · {cm(diseno.largoCm)} · {celdas.length} cuentas
                  </p>
                  {(diseno.contacto || diseno.nota) && (
                    <p className="mt-1 text-sm text-gris">
                      {[diseno.contacto, diseno.nota].filter(Boolean).join(" — ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5" title={materiales.map((m) => `${m.cantidad} ${m.cuenta.nombre}`).join(", ")}>
                  {materiales.map((m) => (
                    <span
                      key={m.indice}
                      className="block h-5 w-5 rounded-full border border-linea"
                      style={{ background: m.cuenta.color }}
                    />
                  ))}
                </div>

                <div className="text-right">
                  <p className="precio">{enPlata(diseno.precio)}</p>
                  <p className="text-xs text-gris">{fecha.format(diseno.creadoEn)}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
