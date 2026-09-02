export default function PieDePagina() {
  return (
    <footer className="mt-24 border-t border-linea">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-10">
        <div>
          <span className="sobretitulo block">Crea con</span>
          <span className="titulo text-xl tracking-[0.12em]">MARÍA</span>
          <p className="mt-3 max-w-sm text-sm text-humo">
            Bisutería hecha a mano. Cada pieza se teje cuenta por cuenta, así que
            no hay dos exactamente iguales.
          </p>
        </div>
        <a href="/admin" className="nav-enlace">
          Panel de María
        </a>
      </div>
    </footer>
  );
}
