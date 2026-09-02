"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clave }),
    });
    if (r.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError("Esa clave no es.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={entrar} className="tarjeta w-full max-w-sm p-8">
        <p className="sobretitulo">Crea con</p>
        <h1 className="titulo text-2xl tracking-[0.12em]">MARÍA</h1>
        <div className="filete my-6" />
        <p className="mb-6 text-sm text-humo">Panel de vendedora.</p>

        <label className="etiqueta" htmlFor="clave">Clave</label>
        <input
          id="clave"
          type="password"
          className="campo"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-oro">{error}</p>}

        <button type="submit" className="btn mt-6 w-full" disabled={enviando || !clave}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
