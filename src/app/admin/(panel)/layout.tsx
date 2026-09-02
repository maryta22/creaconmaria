import { redirect } from "next/navigation";
import { haySesion } from "@/lib/sesion";
import NavAdmin from "@/components/NavAdmin";

export const metadata = { title: "Panel" };

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  if (!(await haySesion())) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavAdmin />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
