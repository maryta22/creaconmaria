import Link from "next/link";
import { TIPOS_HILO } from "@/lib/hilo/tipos";
import { cm } from "@/lib/formato";

export const metadata = {
  title: "Diseñá la tuya",
  description: "Armá tu pulsera, tu collar o tu colgador cuenta por cuenta.",
};

export default function Disenar() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="sobretitulo">A medida</p>
      <h1 className="titulo mt-2 text-4xl">Diseñá la tuya</h1>
      <div className="filete mb-6 mt-5 max-w-[8rem]" />
      <p className="max-w-2xl text-humo">
        Elegí qué querés armar y ponele las cuentas que quieras, una por una,
        con las que María tiene en el taller. Lo ves en 3D mientras lo armás y
        se lo mandás por WhatsApp cuando te guste.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TIPOS_HILO.map((tipo) => (
          <Link
            key={tipo.slug}
            href={`/disenar/${tipo.slug}`}
            className="tarjeta group flex flex-col p-6 transition-colors hover:border-oro"
          >
            <p className="sobretitulo">{cm(tipo.largos[0])} a {cm(tipo.largos[tipo.largos.length - 1])}</p>
            <h2 className="titulo mt-3 text-2xl group-hover:text-oro">{tipo.nombre}</h2>
            <div className="filete my-4 max-w-[3rem]" />
            <p className="flex-1 text-sm leading-relaxed text-humo">{tipo.descripcion}</p>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-gris">
              Cierre con {tipo.cierre} · desde {tipo.armado.toFixed(2)} USD
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-gris">
        Las carteras tejidas no entran todavía en el diseñador: son piezas de
        varios paneles y se hablan una por una con María.
      </p>
    </div>
  );
}
