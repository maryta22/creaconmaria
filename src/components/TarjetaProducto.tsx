import Link from "next/link";
import FotoProducto from "./FotoProducto";
import { medidaCorta, precio } from "@/lib/formato";
import { nombreCategoria } from "@/lib/categorias";

export type ProductoEnVitrina = {
  slug: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  largoCm: number | null;
  anchoCm: number | null;
  altoCm: number | null;
  profundidadCm: number | null;
  cuentaMm: number | null;
  ajustable: boolean;
  extensionCm: number | null;
  fotos: { url: string; alt: string | null }[];
};

export default function TarjetaProducto({ p }: { p: ProductoEnVitrina }) {
  const medida = medidaCorta(p);
  const agotado = p.stock <= 0;

  return (
    <Link href={`/pieza/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden border border-linea bg-white">
        <FotoProducto
          url={p.fotos[0]?.url}
          alt={p.fotos[0]?.alt}
          nombre={p.nombre}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {agotado && (
          <span className="chip chip-agotado absolute left-3 top-3">Agotada</span>
        )}
        {!agotado && p.stock <= 2 && (
          <span className="chip chip-oro absolute left-3 top-3">
            {p.stock === 1 ? "Última" : `Quedan ${p.stock}`}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="sobretitulo">{nombreCategoria(p.categoria)}</p>
        <h3 className="titulo mt-1 text-lg leading-snug">{p.nombre}</h3>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="precio">{precio(p.precio)}</span>
          {medida && <span className="text-xs text-gris">{medida}</span>}
        </div>
      </div>
    </Link>
  );
}
