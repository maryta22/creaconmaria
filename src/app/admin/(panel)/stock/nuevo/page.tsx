import FormProducto, { VACIO } from "@/components/FormProducto";

export const metadata = { title: "Cargar pieza" };

export default function Nuevo() {
  return (
    <>
      <p className="sobretitulo">Inventario</p>
      <h1 className="titulo mt-2 text-3xl">Cargar una pieza</h1>
      <div className="filete my-6 max-w-[8rem]" />
      <FormProducto inicial={VACIO} />
    </>
  );
}
