import { prisma } from "@/lib/prisma";
import { CUENTA_MINIMA_MM, medidasDePatron } from "@/lib/cartera/geometria";
import ElectorEstampado from "@/components/ElectorEstampado";

export const metadata = { title: "Estampados · Panel" };

/**
 * Elegir una cartera llana y ponerle un estampado.
 *
 * Sale un patrón nuevo en el diseñador, con su mapa para imprimir. De ahí en
 * más es un patrón como cualquier otro: se edita cuenta por cuenta, se le pone
 * precio y se publica.
 */
/**
 * Se entra desde `/admin/disenador`, que es la única puerta a las carteras:
 *
 * - `?llana=basica` — empezar una nueva sobre esa forma.
 * - `?patron=slug` — ponerle un estampado a una cartera que ya está. Solo
 *   llegan acá las **de un solo color**: sobre una que ya tiene dibujo, el
 *   estampado se lo borraría.
 */
export default async function PaginaEstampados({
  searchParams,
}: {
  searchParams: Promise<{ llana?: string; patron?: string }>;
}) {
  const { llana, patron: slugPatron } = await searchParams;
  // **En una cartera no entran cuentas de menos de 8 mm** (`CUENTA_MINIMA_MM`).
  // No se filtran en la pantalla: no se ofrecen, así no hay que explicar por
  // qué una que está en el stock no anda.
  const cuentas = await prisma.cuentaStock.findMany({
    where: { activo: true, tamanoMm: { gte: CUENTA_MINIMA_MM } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, color: true, tamanoMm: true, acabado: true, stock: true },
  });

  const patron = slugPatron
    ? await prisma.patronCartera.findUnique({ where: { slug: slugPatron } })
    : null;
  const destino =
    patron && (JSON.parse(patron.paleta) as unknown[]).length === 1
      ? { id: patron.id, slug: patron.slug, nombre: patron.nombre, medidas: medidasDePatron(patron) }
      : null;

  return (
    <div>
      <header className="mb-10">
        <p className="sobretitulo">Panel</p>
        <h1 className="mt-1 font-serif text-3xl">Estampados</h1>
        <p className="mt-3 max-w-2xl text-sm text-black/60">
          Elegí una cartera llana, un estampado y los colores. Sale un patrón nuevo en el
          diseñador: ahí lo retocás cuenta por cuenta, imprimís el mapa y, si te gusta, lo
          publicás en el catálogo.
        </p>
      </header>

      <ElectorEstampado
        cuentas={cuentas}
        minimoMm={CUENTA_MINIMA_MM}
        llanaInicial={llana}
        destino={destino}
      />
    </div>
  );
}
