import { prisma } from "@/lib/prisma";
import { precio } from "@/lib/formato";
import EstadoPedido from "@/components/EstadoPedido";
import FormWhatsAppVendedora from "@/components/FormWhatsAppVendedora";

type LineaPedido = { nombre: string; cantidad: number; precio: number };
type Pedido = { id: string; codigo: string; nombre: string; contacto: string; nota: string | null; total: number; lineas: string; estado: string; creadoEn: Date };

export const dynamic = "force-dynamic";
export const metadata = { title: "Pedidos" };

export default async function Pedidos() {
  const [pedidos, configuracion] = await Promise.all([
    prisma.$queryRaw<Pedido[]>`
      SELECT id, codigo, nombre, contacto, nota, total, lineas, estado, creadoEn
      FROM Pedido
      ORDER BY creadoEn DESC
    `,
    prisma.$queryRaw<{ whatsapp: string }[]>`
      SELECT whatsapp FROM ConfiguracionVendedora WHERE id = 'principal' LIMIT 1
    `,
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sobretitulo">Ventas</p>
          <h1 className="titulo mt-2 text-3xl">Pedidos recibidos</h1>
        </div>
        <FormWhatsAppVendedora inicial={configuracion[0]?.whatsapp ?? ""} />
      </div>
      <p className="mt-3 max-w-2xl text-humo">Pedidos enviados desde el carrito. Confirmá disponibilidad y pago directamente con cada clienta.</p>
      <div className="filete my-6 max-w-[8rem]" />

      {pedidos.length === 0 ? (
        <div className="tarjeta p-12 text-center text-humo">Todavía no recibiste pedidos desde la tienda.</div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const lineas = JSON.parse(pedido.lineas) as LineaPedido[];
            return (
              <article key={pedido.id} className="tarjeta p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="sobretitulo">Pedido {pedido.codigo}</p>
                    <h2 className="titulo mt-1 text-xl">{pedido.nombre}</h2>
                    <p className="mt-1 text-sm text-humo">{pedido.contacto}</p>
                  </div>
                  <div className="text-right">
                    <EstadoPedido codigo={pedido.codigo} inicial={pedido.estado} />
                    <p className="precio mt-2">{precio(pedido.total)}</p>
                  </div>
                </div>
                <ul className="mt-5 divide-y divide-linea border-y border-linea text-sm">
                  {lineas.map((linea, indice) => (
                    <li key={`${linea.nombre}-${indice}`} className="flex justify-between gap-4 py-2.5"><span>{linea.cantidad} × {linea.nombre}</span><span className="tabular-nums text-humo">{precio(linea.cantidad * linea.precio)}</span></li>
                  ))}
                </ul>
                {pedido.nota && <p className="mt-4 text-sm text-humo"><span className="font-medium text-tinta">Nota:</span> {pedido.nota}</p>}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
