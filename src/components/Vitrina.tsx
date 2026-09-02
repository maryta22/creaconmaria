import Link from "next/link";
import TarjetaProducto, { type ProductoEnVitrina } from "./TarjetaProducto";
import { CATEGORIAS } from "@/lib/categorias";

/** Encabezado + filtros + grilla. Lo comparten /catalogo y /catalogo/[slug]. */
export default function Vitrina({
  titulo,
  sobretitulo,
  descripcion,
  productos,
  slugActivo,
}: {
  titulo: string;
  sobretitulo: string;
  descripcion?: string;
  productos: ProductoEnVitrina[];
  slugActivo: string | null;
}) {
  const disponibles = productos.filter((p) => p.stock > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="sobretitulo">{sobretitulo}</p>
      <h1 className="titulo mt-2 text-4xl">{titulo}</h1>
      {descripcion && <p className="mt-3 max-w-xl text-humo">{descripcion}</p>}
      <div className="filete my-8 max-w-[10rem]" />

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          <Link href="/catalogo" className="chip" data-activo={slugActivo === null}>
            Todo
          </Link>
          {CATEGORIAS.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo/${c.slug}`}
              className={slugActivo === c.slug ? "chip chip-oro" : "chip"}
            >
              {c.nombre}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-gris">
          {productos.length} {productos.length === 1 ? "pieza" : "piezas"} · {disponibles} con stock
        </p>
      </div>

      {productos.length === 0 ? (
        <div className="tarjeta p-12 text-center">
          <p className="titulo text-xl">Nada por acá todavía</p>
          <p className="mt-2 text-sm text-humo">
            Cuando María cargue piezas de esta línea van a aparecer en esta página.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {productos.map((p) => (
            <TarjetaProducto key={p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
