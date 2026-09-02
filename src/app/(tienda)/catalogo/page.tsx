import { prisma } from "@/lib/prisma";
import Vitrina from "@/components/Vitrina";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo" };

export default async function Catalogo() {
  const productos = await prisma.producto.findMany({
    where: { publicado: true },
    include: { fotos: { orderBy: { orden: "asc" } } },
    orderBy: [{ stock: "desc" }, { creadoEn: "desc" }],
  });

  return (
    <Vitrina
      titulo="Catálogo"
      sobretitulo="Todas las piezas"
      descripcion="Todo lo que hay disponible ahora mismo, con su medida."
      productos={productos}
      slugActivo={null}
    />
  );
}
