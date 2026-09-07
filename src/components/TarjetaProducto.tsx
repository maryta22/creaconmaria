import Link from "next/link";
import FotoProducto from "./FotoProducto";
import Cartera3D from "./Cartera3D";
import { FORRO_BASE, paletaDeVitrina } from "@/lib/cuentas-base";
import { esCarteraBase } from "@/lib/cartera/llanas";
import { medidaCorta, precio } from "@/lib/formato";
import { nombreCategoria } from "@/lib/categorias";
import BotonAgregarCarrito from "./BotonAgregarCarrito";
import { descomprimir, type CuentaPaleta } from "@/lib/cartera/modelos";
import { armarLayout, medidasDePatron } from "@/lib/cartera/geometria";

export type ProductoEnVitrina = {
  id: string;
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
  patron?: {
    /** caja | corazon | tulipan | fresa | cuadrada: sin esto la tarjeta dibuja todo como caja. */
    forma: string;
    anchoCm: number;
    altoCm: number;
    profundidadCm: number;
    altoSolapaCm: number;
    asaCm: number;
    aroCm: number | null;
    cadenaCm: number | null;
    cuentaMm: number;
    separacion: number;
    paleta: string;
    celdas: string;
  } | null;
};

export default function TarjetaProducto({ p }: { p: ProductoEnVitrina }) {
  const medida = medidaCorta(p);
  const agotado = p.stock <= 0;
  const patron = p.fotos.length === 0 ? p.patron ?? null : null;
  /**
   * Las carteras **sin dibujo** se muestran con la cuenta patrón: son la forma,
   * y el color se elige en la ficha. Las que tienen dibujo conservan el suyo.
   */
  const guardada = patron ? JSON.parse(patron.paleta) as CuentaPaleta[] : null;
  const enGris = esCarteraBase(p.slug);
  const paleta = guardada ? (enGris ? paletaDeVitrina(guardada) : guardada) : null;
  const medidas = patron ? medidasDePatron(patron) : null;
  const celdas = patron && medidas ? descomprimir(patron.celdas, armarLayout(medidas).cuentas.length) : null;

  return (
    <article className="group">
      <Link href={`/pieza/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-linea bg-white shadow-[0_10px_30px_rgba(21,19,15,0.04)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-oro/50 group-hover:shadow-[0_18px_35px_rgba(21,19,15,0.1)]">
        {patron && paleta && medidas && celdas ? (
          <Cartera3D
            medidas={medidas}
            paleta={paleta}
            celdas={celdas}
            colorForro={enGris ? FORRO_BASE : undefined}
            autoGirar
            mostrarHilo
            mostrarForro
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <FotoProducto
            url={p.fotos[0]?.url}
            alt={p.fotos[0]?.alt}
            nombre={p.nombre}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
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
        <h3 className="titulo mt-1 text-lg leading-snug transition-colors group-hover:text-oro">{p.nombre}</h3>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="precio">{precio(p.precio)}</span>
          {medida && <span className="text-xs text-gris">{medida}</span>}
        </div>
      </div>
      </Link>
      {!agotado && (
        <div className="mt-4">
          <BotonAgregarCarrito producto={{
            id: p.id,
            slug: p.slug,
            nombre: p.nombre,
            precio: p.precio,
            stock: p.stock,
            foto: p.fotos[0]?.url,
          }} compacto />
        </div>
      )}
    </article>
  );
}
