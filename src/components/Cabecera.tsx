"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";
import { useCarrito } from "./CarritoProveedor";

export default function Cabecera() {
  const ruta = usePathname();
  const { cantidadTotal, listo } = useCarrito();

  return (
    <header className="border-b border-linea bg-papel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" aria-label="Crea con María" className="relative block h-24 w-48 shrink-0 overflow-hidden">
          <Image
            src="/logo.jpeg"
            alt="Crea con María"
            width={2048}
            height={2048}
            priority
            className="absolute left-1/2 top-[-7.5rem] w-[22rem] max-w-none -translate-x-1/2"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-6">
          <Link href="/catalogo" className="nav-enlace" data-activo={ruta === "/catalogo"}>
            Todo
          </Link>
          {CATEGORIAS.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo/${c.slug}`}
              className="nav-enlace"
              data-activo={ruta === `/catalogo/${c.slug}`}
            >
              {c.nombre}
            </Link>
          ))}
          <Link href="/carrito" className="nav-enlace" data-activo={ruta === "/carrito"}>
            Carrito{listo && cantidadTotal > 0 ? ` (${cantidadTotal})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
