/** Pieza tal como la necesitan las funciones de acá (no hace falta el modelo entero). */
type ConMedidas = {
  categoria: string;
  largoCm?: number | null;
  anchoCm?: number | null;
  altoCm?: number | null;
  profundidadCm?: number | null;
  cuentaMm?: number | null;
  ajustable?: boolean;
  extensionCm?: number | null;
};

const monedaEC = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export function precio(valor: number) {
  return monedaEC.format(valor);
}

/** 12.5 -> "12,5" (sin decimales de relleno). */
function num(valor: number) {
  return new Intl.NumberFormat("es-EC", { maximumFractionDigits: 1 }).format(valor);
}

/**
 * La medida principal, corta, para mostrar en la tarjeta del catálogo.
 * Carteras van en ancho × alto × profundidad; el resto, largo.
 */
export function medidaCorta(p: ConMedidas): string | null {
  if (p.categoria === "CARTERA") {
    const partes = [p.anchoCm, p.altoCm, p.profundidadCm].filter(
      (v): v is number => typeof v === "number",
    );
    if (partes.length === 0) return null;
    return `${partes.map(num).join(" × ")} cm`;
  }
  if (typeof p.largoCm !== "number") return null;
  const base = `${num(p.largoCm)} cm`;
  if (p.ajustable && typeof p.extensionCm === "number") {
    return `${base} + ${num(p.extensionCm)} cm`;
  }
  return base;
}

/** Todas las medidas, para la ficha del producto. */
export function medidasDetalladas(p: ConMedidas): { etiqueta: string; valor: string }[] {
  const filas: { etiqueta: string; valor: string }[] = [];
  const cm = (v: number) => `${num(v)} cm`;

  if (p.categoria === "CARTERA") {
    if (typeof p.anchoCm === "number") filas.push({ etiqueta: "Ancho", valor: cm(p.anchoCm) });
    if (typeof p.altoCm === "number") filas.push({ etiqueta: "Alto", valor: cm(p.altoCm) });
    if (typeof p.profundidadCm === "number")
      filas.push({ etiqueta: "Profundidad", valor: cm(p.profundidadCm) });
    if (typeof p.largoCm === "number") filas.push({ etiqueta: "Largo del asa", valor: cm(p.largoCm) });
  } else {
    if (typeof p.largoCm === "number") filas.push({ etiqueta: "Largo", valor: cm(p.largoCm) });
    if (p.ajustable) {
      filas.push({
        etiqueta: "Extensión",
        valor: typeof p.extensionCm === "number" ? `regulable +${num(p.extensionCm)} cm` : "regulable",
      });
    }
  }

  if (typeof p.cuentaMm === "number") {
    filas.push({ etiqueta: "Cuenta", valor: `${num(p.cuentaMm)} mm` });
  }
  return filas;
}

/** "Pulsera Perla Marfil" -> "pulsera-perla-marfil" */
export function aSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
