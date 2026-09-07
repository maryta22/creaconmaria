import { redirect } from "next/navigation";
import { haySesion } from "@/lib/sesion";
import NavAdmin from "@/components/NavAdmin";

export const metadata = { title: "Panel" };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  if (!(await haySesion())) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavAdmin />
      {/* El panel va contenido, salvo las páginas que piden todo el ancho
          (el mapa de tejido) marcándose con `pagina-ancha`. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 has-[.pagina-ancha]:max-w-none">
        {children}
      </main>
    </div>
  );
}
