import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { armarLayout, type MedidasCartera } from "@/lib/cartera/geometria";
import { descomprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import { precio as formatoPrecio } from "@/lib/formato";
import VisorCarteraGuardada from "@/components/VisorCarteraGuardada";

export const metadata = { title: "Tu cartera · Crea con María" };

/**
 * La cartera que guardó un cliente, por su código.
 *
 * Se dibuja con la paleta y las medidas **que quedaron guardadas dentro del
 * diseño**, no con las del inventario de hoy: si María le cambió el precio a
 * una cuenta o la dio de baja, la cartera que el cliente mandó tiene que
 * seguir viéndose igual.
 *
 * **Acá no hay mapa de tejido.** El cliente ve su cartera; cómo se teje es de
 * María y vive en el panel.
 */
export default async function PaginaVerCartera({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const diseno = await prisma.disenoCartera.findUnique({
    where: { codigo: codigo.toUpperCase() },
  });
  if (!diseno) notFound();

  const medidas = JSON.parse(diseno.medidas) as MedidasCartera;
  const paleta = JSON.parse(diseno.paleta) as CuentaPaleta[];
  const layout = armarLayout(medidas);
  const celdas = descomprimir(diseno.celdas, layout.cuentas.length);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="sobretitulo">Tu cartera</p>
      <h1 className="mt-1 font-serif text-4xl">{diseno.nombre}</h1>
      <p className="mt-2 text-sm text-black/60">
        Código <strong className="tracking-widest">{diseno.codigo}</strong> · guardá este link
        para volver a verla.
      </p>

      <div className="fondo-3d relative mt-8 aspect-square border border-linea sm:aspect-[4/3]">
        <VisorCarteraGuardada medidas={medidas} paleta={paleta} celdas={celdas} />
      </div>
      <p className="mt-2 text-xs text-black/55">Arrastrá para girarla.</p>

      <dl className="mt-8 divide-y divide-black/10 border-y border-black/10 text-sm">
        <div className="flex justify-between py-3">
          <dt className="text-black/60">Medidas</dt>
          <dd>
            {medidas.anchoCm} × {medidas.altoCm} × {medidas.profundidadCm} cm
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-black/60">Cuentas</dt>
          <dd>{layout.cuentas.length.toLocaleString("es-AR")} de {medidas.cuentaMm} mm</dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-black/60">Colores</dt>
          <dd className="flex items-center gap-2">
            {paleta.map((p, i) => (
              <span key={i} className="flex items-center gap-1">
                <span
                  className="inline-block h-4 w-4 rounded-full border border-black/15"
                  style={{ background: p.color }}
                />
                {p.nombre}
              </span>
            ))}
          </dd>
        </div>
        <div className="flex justify-between py-3">
          <dt className="text-black/60">Precio estimado</dt>
          <dd className="precio">{formatoPrecio(diseno.precio)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-black/55">
        El precio es estimado: se calcula por las cuentas que lleva y no incluye el armado.
        Escribinos con tu código y te pasamos el precio final.
      </p>

      <a className="btn mt-8 inline-block" href="/disenar/cartera">
        Armar otra
      </a>
    </div>
  );
}
