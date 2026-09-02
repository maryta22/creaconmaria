"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";

export default function Cabecera() {
  const ruta = usePathname();

  return (
    <header className="border-b border-linea bg-papel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="leading-none">
          <span className="sobretitulo block">Crea con</span>
          <span className="titulo text-2xl tracking-[0.12em]">MARÍA</span>
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
        </nav>
      </div>
    </header>
  );
}
