import Link from "next/link";
import { PRESETS_PULSERA } from "@/lib/hilo/presets";

export default function ModelosBasePulsera() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <p className="sobretitulo">Personalizables</p>
      <h2 className="titulo mt-2 text-3xl">50 modelos base</h2>
      <p className="mt-3 max-w-2xl text-humo">Elegí una base y cambiá sus colores y cuentas en el editor.</p>
      <div className="filete mb-8 mt-5 max-w-[8rem]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS_PULSERA.map((preset) => (
          <Link key={preset.id} href={`/disenar/pulsera?modelo=${preset.id}`} className="tarjeta group p-4 transition-colors hover:border-oro">
            <p className="sobretitulo">{preset.descripcion}</p>
            <h3 className="titulo mt-1 text-xl group-hover:text-oro">{preset.nombre}</h3>
            <span className="mt-3 inline-block text-xs uppercase tracking-[0.12em] text-oro">Editar colores</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
