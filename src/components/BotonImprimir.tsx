"use client";

export default function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-chico">
      Descargar o imprimir
    </button>
  );
}
