import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS, categoriaPorId } from "@/lib/categorias";
import { medidaCorta, precio } from "@/lib/formato";
import FotoProducto from "@/components/FotoProducto";
import SubnavStock from "@/components/SubnavStock";

export const dynamic = "force-dynamic";

export default async function Stock({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const filtro = categoriaPorId(categoria ?? "");

  const productos = await prisma.producto.findMany({
    where: filtro ? { categoria: filtro.id } : undefined,
    include: { fotos: { orderBy: { orden: "asc" }, take: 1 } },
    orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sobretitulo">Inventario</p>
          <h1 className="titulo mt-2 text-3xl">{filtro ? filtro.nombre : "Todo el stock"}</h1>
        </div>
        <Link href="/admin/stock/nuevo" className="btn btn-chico">Cargar pieza</Link>
      </div>
      <div className="filete my-6 max-w-[8rem]" />

      <SubnavStock actual="piezas" />

      <nav className="mb-8 flex flex-wrap gap-2">
        <Link href="/admin/stock" className={filtro ? "chip" : "chip chip-oro"}>Todo</Link>
        {CATEGORIAS.map((c) => (
          <Link
            key={c.id}
            href={`/admin/stock?categoria=${c.id}`}
            className={filtro?.id === c.id ? "chip chip-oro" : "chip"}
          >
            {c.nombre}
          </Link>
        ))}
      </nav>

      {productos.length === 0 ? (
        <div className="tarjeta p-12 text-center">
          <p className="titulo text-xl">No hay piezas acá</p>
          <Link href="/admin/stock/nuevo" className="btn mt-6">Cargar una</Link>
        </div>
      ) : (
        <div className="overflow-x-auto border border-linea bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-linea text-left">
                {["Pieza", "Línea", "Medida", "Costo", "Precio", "Stock", "Estado", ""].map((h) => (
                  <th key={h} className="sobretitulo px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-linea">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-papel">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden border border-linea">
                        <FotoProducto url={p.fotos[0]?.url} nombre={p.nombre} />
                      </div>
                      <span>{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-humo">{categoriaPorId(p.categoria)?.singular}</td>
                  <td className="px-4 py-3 tabular-nums text-humo">{medidaCorta(p) ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-humo">{precio(p.costo)}</td>
                  <td className="px-4 py-3 tabular-nums">{precio(p.precio)}</td>
                  <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-4 py-3">
                    {!p.publicado ? (
                      <span className="chip">Oculta</span>
                    ) : p.stock <= 0 ? (
                      <span className="chip chip-agotado">Agotada</span>
                    ) : (
                      <span className="chip chip-oro">En tienda</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/stock/${p.id}`} className="text-xs uppercase tracking-[0.12em] text-oro">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
