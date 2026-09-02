"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ENLACES = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/stock", texto: "Stock" },
  { href: "/admin/stock/nuevo", texto: "Cargar pieza" },
];

export default function NavAdmin() {
  const ruta = usePathname();
  const router = useRouter();

  async function salir() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-linea bg-tinta text-papel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin" className="leading-none">
          <span className="titulo text-lg tracking-[0.12em]">MARÍA</span>
          <span className="ml-2 text-[0.6875rem] uppercase tracking-[0.2em] text-oro-claro">
            Panel
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-6 text-[0.8125rem] uppercase tracking-[0.12em]">
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={ruta === e.href ? "text-oro-claro" : "text-papel/70 hover:text-papel"}
            >
              {e.texto}
            </Link>
          ))}
          <Link href="/" className="text-papel/70 hover:text-papel">Ver tienda</Link>
          <button onClick={salir} className="text-papel/70 hover:text-papel uppercase">
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
