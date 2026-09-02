import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS } from "@/lib/categorias";
import { precio } from "@/lib/formato";
import FotoProducto from "@/components/FotoProducto";

export const dynamic = "force-dynamic";

function Dato({ valor, etiqueta, nota }: { valor: string; etiqueta: string; nota?: string }) {
  return (
    <div className="tarjeta p-5">
      <p className="sobretitulo">{etiqueta}</p>
      <p className="titulo mt-2 text-3xl tabular-nums">{valor}</p>
      {nota && <p className="mt-1 text-xs text-gris">{nota}</p>}
    </div>
  );
}

export default async function Resumen() {
  const productos = await prisma.producto.findMany({
    include: { fotos: { orderBy: { orden: "asc" }, take: 1 } },
    orderBy: { creadoEn: "desc" },
  });

  const unidades = productos.reduce((s, p) => s + p.stock, 0);
  const valorVenta = productos.reduce((s, p) => s + p.stock * p.precio, 0);
  const valorCosto = productos.reduce((s, p) => s + p.stock * p.costo, 0);
  const agotadas = productos.filter((p) => p.stock <= 0).length;
  const ocultas = productos.filter((p) => !p.publicado).length;

  return (
    <>
      <p className="sobretitulo">Panel</p>
      <h1 className="titulo mt-2 text-3xl">Tu stock hoy</h1>
      <div className="filete my-6 max-w-[8rem]" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato valor={String(productos.length)} etiqueta="Piezas cargadas" nota={`${ocultas} sin publicar`} />
        <Dato valor={String(unidades)} etiqueta="Unidades en mano" nota={`${agotadas} agotadas`} />
        <Dato valor={precio(valorVenta)} etiqueta="Valor a precio de venta" />
        <Dato
          valor={precio(valorVenta - valorCosto)}
          etiqueta="Ganancia si vendés todo"
          nota={`Invertido: ${precio(valorCosto)}`}
        />
      </div>

      {/* Por línea de producto */}
      <section className="mt-12">
        <p className="sobretitulo">Por línea</p>
        <div className="filete mb-5 mt-2 max-w-[6rem]" />
        <div className="grid gap-px border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => {
            const dela = productos.filter((p) => p.categoria === c.id);
            const u = dela.reduce((s, p) => s + p.stock, 0);
            return (
              <Link
                key={c.id}
                href={`/admin/stock?categoria=${c.id}`}
                className="bg-papel p-5 transition-colors hover:bg-white"
              >
                <p className="sobretitulo">{c.nombre}</p>
                <p className="titulo mt-2 text-2xl tabular-nums">{dela.length}</p>
                <p className="mt-1 text-xs text-gris">{u} unidades</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Alertas de stock */}
      {productos.some((p) => p.stock <= 1 && p.publicado) && (
        <section className="mt-12">
          <p className="sobretitulo">Se están acabando</p>
          <div className="filete mb-5 mt-2 max-w-[6rem]" />
          <ul className="divide-y divide-linea border-y border-linea">
            {productos
              .filter((p) => p.stock <= 1 && p.publicado)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden border border-linea">
                    <FotoProducto url={p.fotos[0]?.url} nombre={p.nombre} />
                  </div>
                  <Link href={`/admin/stock/${p.id}`} className="flex-1 text-sm hover:text-oro">
                    {p.nombre}
                  </Link>
                  <span className={p.stock <= 0 ? "chip chip-agotado" : "chip chip-oro"}>
                    {p.stock <= 0 ? "Agotada" : "Queda 1"}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {productos.length === 0 && (
        <div className="tarjeta mt-12 p-12 text-center">
          <p className="titulo text-xl">Todavía no cargaste ninguna pieza</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-humo">
            Cargá la primera con su medida, su foto y cuántas tenés hechas. Al
            guardarla aparece sola en la tienda.
          </p>
          <Link href="/admin/stock/nuevo" className="btn mt-6">Cargar mi primera pieza</Link>
        </div>
      )}
    </>
  );
}
