import { prisma } from "@/lib/prisma";
import { CUENTA_MINIMA_MM } from "@/lib/cartera/geometria";
import ElectorEstampado from "@/components/ElectorEstampado";

export const metadata = {
  title: "Armá tu cartera · Crea con María",
  description: "Elegí la cartera, el estampado y los colores. La tejemos a mano para vos.",
};

/**
 * El cliente arma su propia cartera: elige una llana, un estampado y los
 * colores, la ve en 3D y se lleva un código.
 *
 * **Es la misma pantalla del panel**, en modo tienda. Lo único que cambia es a
 * dónde va lo elegido: acá se guarda un diseño con su código, y no se crea un
 * patrón ni se abre el diseñador. **El mapa de tejido no está de este lado**:
 * el cliente elige, María teje.
 */
export default async function PaginaArmarCartera() {
  const cuentas = await prisma.cuentaStock.findMany({
    where: { activo: true, stock: { gt: 0 }, tamanoMm: { gte: CUENTA_MINIMA_MM } },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, color: true, tamanoMm: true, acabado: true, stock: true },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-10">
        <p className="sobretitulo">Armá la tuya</p>
        <h1 className="mt-1 font-serif text-4xl">Tu cartera</h1>
        <p className="mt-3 max-w-2xl text-sm text-black/60">
          Elegí la forma, el estampado y los colores. La ves acá mismo, girándola, y cuando te
          guste te llevás un código para mandárnosla. La tejemos a mano, cuenta por cuenta.
        </p>
      </header>

      <ElectorEstampado cuentas={cuentas} minimoMm={CUENTA_MINIMA_MM} modo="tienda" />
    </div>
  );
}
