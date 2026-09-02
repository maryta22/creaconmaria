import { prisma } from "@/lib/prisma";
import GestorDijes from "@/components/GestorDijes";
import SubnavStock from "@/components/SubnavStock";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock de dijes" };

export default async function StockDijes() {
  const dijes = await prisma.dijeStock.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return (
    <>
      <p className="sobretitulo">Stock de materiales</p>
      <h1 className="titulo mt-2 text-3xl">Dijes</h1>
      <p className="mt-3 max-w-2xl text-humo">Colgantes, figuras y adornos disponibles para tus piezas.</p>
      <div className="filete my-6 max-w-[8rem]" />
      <SubnavStock actual="dijes" />
      <GestorDijes iniciales={dijes} />
    </>
  );
}
