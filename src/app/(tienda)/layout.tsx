import Cabecera from "@/components/Cabecera";
import { CarritoProveedor } from "@/components/CarritoProveedor";
import PieDePagina from "@/components/PieDePagina";

export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return (
    <CarritoProveedor>
      <div className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="flex-1">{children}</main>
        <PieDePagina />
      </div>
    </CarritoProveedor>
  );
}
