import { prisma } from "@/lib/prisma";
import GestorCuentas from "@/components/GestorCuentas";
import SubnavStock from "@/components/SubnavStock";
import type { AcabadoCuenta } from "@/lib/cuentas";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock de cuentas" };

export default async function StockCuentas() {
  const cuentas = await prisma.cuentaStock.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
  return (
    <>
      <p className="sobretitulo">Stock de materiales</p>
      <h1 className="titulo mt-2 text-3xl">Cuentas</h1>
      <p className="mt-3 max-w-2xl text-humo">Colores, tamaños y unidades disponibles para tejer.</p>
      <div className="filete my-6 max-w-[8rem]" />
      <SubnavStock actual="cuentas" />
      <GestorCuentas iniciales={cuentas.map((cuenta) => ({ ...cuenta, acabado: cuenta.acabado as AcabadoCuenta }))} />
    </>
  );
}
