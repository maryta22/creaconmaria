/** Las cuatro líneas de producto. El `slug` es lo que va en la URL. */
export const CATEGORIAS = [
  {
    id: "PULSERA",
    slug: "pulseras",
    nombre: "Pulseras",
    singular: "Pulsera",
    descripcion: "Tejidas a mano, con o sin extensión regulable.",
    /** Qué campos de medida tiene sentido pedir para esta categoría. */
    medidas: ["largoCm", "extensionCm", "cuentaMm"] as const,
  },
  {
    id: "COLGADOR",
    slug: "colgadores",
    nombre: "Colgadores de mochila",
    singular: "Colgador de mochila",
    descripcion: "Llaveros y dijes para colgar de la mochila o el bolso.",
    medidas: ["largoCm", "cuentaMm"] as const,
  },
  {
    id: "COLLAR",
    slug: "collares",
    nombre: "Collares",
    singular: "Collar",
    descripcion: "Gargantillas y collares largos, cuenta por cuenta.",
    medidas: ["largoCm", "extensionCm", "cuentaMm"] as const,
  },
  {
    id: "CARTERA",
    slug: "carteras",
    nombre: "Carteras",
    singular: "Cartera",
    descripcion: "Carteras de cuentas tejidas en cruz, pieza por pieza.",
    medidas: ["anchoCm", "altoCm", "profundidadCm", "cuentaMm"] as const,
  },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]["id"];

export const IDS_CATEGORIA = CATEGORIAS.map((c) => c.id) as CategoriaId[];

export function categoriaPorId(id: string) {
  return CATEGORIAS.find((c) => c.id === id);
}

export function categoriaPorSlug(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function nombreCategoria(id: string) {
  return categoriaPorId(id)?.singular ?? id;
}
