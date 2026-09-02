import Link from "next/link";

type SeccionStock = "piezas" | "cuentas" | "dijes";

const SECCIONES: { id: SeccionStock; href: string; texto: string }[] = [
  { id: "piezas", href: "/admin/stock", texto: "Piezas armadas" },
  { id: "cuentas", href: "/admin/stock/cuentas", texto: "Cuentas" },
  { id: "dijes", href: "/admin/stock/dijes", texto: "Dijes" },
];

export default function SubnavStock({ actual }: { actual: SeccionStock }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {SECCIONES.map((seccion) => (
        <Link key={seccion.id} href={seccion.href} className={seccion.id === actual ? "chip chip-oro" : "chip"}>
          {seccion.texto}
        </Link>
      ))}
    </nav>
  );
}
