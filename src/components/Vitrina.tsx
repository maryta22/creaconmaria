import Link from "next/link";
import TarjetaProducto, { type ProductoEnVitrina } from "./TarjetaProducto";
import TarjetaPulseraViva from "./TarjetaPulseraViva";
import { CATEGORIAS } from "@/lib/categorias";
import { MODELOS_PULSERA } from "@/lib/pulsera/modelos";

/** Encabezado, filtros y grilla compartidos por las pantallas de catalogo. */
export default function Vitrina({
  titulo,
  sobretitulo,
  descripcion,
  productos,
  slugActivo,
  mostrarModelosBase = false,
}: {
  titulo: string;
  sobretitulo: string;
  descripcion?: string;
  productos: ProductoEnVitrina[];
  slugActivo: string | null;
  mostrarModelosBase?: boolean;
}) {
  const disponibles = productos.filter((producto) => producto.stock > 0).length;
  const modelos = mostrarModelosBase ? MODELOS_PULSERA : [];
  const hayContenido = productos.length > 0 || modelos.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="sobretitulo">{sobretitulo}</p>
      <h1 className="titulo mt-2 text-4xl">{titulo}</h1>
      {descripcion && <p className="mt-3 max-w-xl text-humo">{descripcion}</p>}
      <div className="filete my-8 max-w-[10rem]" />

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap gap-2">
          <Link href="/catalogo" className="chip" data-activo={slugActivo === null}>
            Todo
          </Link>
          {CATEGORIAS.map((categoria) => (
            <Link
              key={categoria.id}
              href={`/catalogo/${categoria.slug}`}
              className={slugActivo === categoria.slug ? "chip chip-oro" : "chip"}
            >
              {categoria.nombre}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-gris">
          {modelos.length > 0
            ? `${modelos.length} modelos base${productos.length ? ` · ${disponibles} piezas listas` : ""}`
            : `${productos.length} ${productos.length === 1 ? "pieza" : "piezas"} · ${disponibles} con stock`}
        </p>
      </div>

      {!hayContenido ? (
        <div className="tarjeta p-12 text-center">
          <p className="titulo text-xl">Nada por aca todavia</p>
          <p className="mt-2 text-sm text-humo">
            Cuando Maria cargue piezas de esta linea van a aparecer en esta pagina.
          </p>
        </div>
      ) : (
        <>
          {modelos.length > 0 && (
            <section aria-labelledby="modelos-pulsera">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="sobretitulo">Modelos de pulsera</p>
                  <h2 id="modelos-pulsera" className="titulo mt-1 text-2xl">Elegi el tejido que queres llevar</h2>
                </div>
                <p className="max-w-sm text-sm text-humo">
                  Cada tarjeta muestra la pulsera completa. Al abrirla solo cambias sus colores y medida.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {modelos.map((modelo) => (
                  <Link key={modelo.id} href={`/disenar/pulsera?modelo=${modelo.id}`} className="group block">
                    <div className="relative aspect-[5/4] overflow-hidden rounded-xl border border-linea bg-[#211e19] shadow-[0_10px_30px_rgba(21,19,15,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-oro/60 group-hover:shadow-[0_18px_35px_rgba(21,19,15,0.16)]">
                      <TarjetaPulseraViva modelo={modelo} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <div className="mt-3">
                      <p className="sobretitulo">{modelo.construccion}</p>
                      <h3 className="titulo mt-1 text-lg leading-snug transition-colors group-hover:text-oro">{modelo.nombre}</h3>
                      <p className="mt-1 text-xs text-gris">{modelo.anchoCm.toFixed(1)} cm de ancho · {modelo.largoBaseCm} cm base</p>
                      <span className="mt-2 inline-block text-xs uppercase tracking-[0.12em] text-oro">Elegir y editar colores</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {productos.length > 0 && (
            <section className={modelos.length > 0 ? "mt-16" : ""} aria-labelledby="piezas-listas">
              {modelos.length > 0 && (
                <div className="mb-6">
                  <p className="sobretitulo">Disponibles ahora</p>
                  <h2 id="piezas-listas" className="titulo mt-1 text-2xl">Piezas listas para enviar</h2>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
                {productos.map((producto) => <TarjetaProducto key={producto.slug} p={producto} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
