"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ENLACES = [
  { href: "/admin", texto: "Resumen" },
  { href: "/admin/stock", texto: "Stock" },
  { href: "/admin/pedidos", texto: "Pedidos" },
  { href: "/admin/disenador", texto: "Carteras" },
  { href: "/admin/pulseras", texto: "Pulseras" },
  { href: "/admin/disenos", texto: "Diseños" },
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
    <header className="no-imprimir border-b border-oro/30 bg-tinta text-white shadow-lg shadow-tinta/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin" className="leading-none">
          <span className="titulo text-lg tracking-[0.12em]">MARÍA</span>
          <span className="ml-2 text-xs uppercase tracking-[0.2em] text-oro-claro">
            Panel
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-6 text-sm uppercase tracking-[0.12em]">
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={ruta === e.href ? "text-oro-claro" : "text-white/65 transition-colors hover:text-white"}
            >
              {e.texto}
            </Link>
          ))}
          <Link href="/" className="text-white/65 transition-colors hover:text-white">Ver tienda</Link>
          <button onClick={salir} className="text-white/65 transition-colors hover:text-white uppercase">
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
