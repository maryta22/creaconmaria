import { prisma } from "./prisma";
import { aSlug } from "./formato";
import { IDS_CATEGORIA } from "./categorias";

/** Lo que manda el formulario del panel. Todo llega como string o vacío. */
export type CuerpoProducto = Record<string, unknown> & {
  fotos?: { url: string; alt?: string | null }[];
};

function numeroOpcional(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function numero(v: unknown, porDefecto = 0): number {
  const n = numeroOpcional(v);
  return n === null ? porDefecto : n;
}

function texto(v: unknown): string | null {
  const t = typeof v === "string" ? v.trim() : "";
  return t === "" ? null : t;
}

/** Valida y normaliza el cuerpo del formulario antes de tocar la base. */
export function datosDeProducto(cuerpo: CuerpoProducto) {
  const nombre = texto(cuerpo.nombre);
  if (!nombre) return { error: "Falta el nombre de la pieza" } as const;

  const categoria = typeof cuerpo.categoria === "string" ? cuerpo.categoria : "";
  if (!IDS_CATEGORIA.includes(categoria as (typeof IDS_CATEGORIA)[number])) {
    return { error: "Categoría inválida" } as const;
  }

  const precio = numero(cuerpo.precio);
  if (precio < 0) return { error: "El precio no puede ser negativo" } as const;

  const stock = Math.trunc(numero(cuerpo.stock));
  if (stock < 0) return { error: "El stock no puede ser negativo" } as const;

  const fotos = (Array.isArray(cuerpo.fotos) ? cuerpo.fotos : [])
    .filter((f) => f && typeof f.url === "string" && f.url.trim() !== "")
    .map((f, i) => ({ url: f.url.trim(), alt: texto(f.alt), orden: i }));

  return {
    valores: {
      nombre,
      categoria,
      descripcion: texto(cuerpo.descripcion),
      materiales: texto(cuerpo.materiales),
      color: texto(cuerpo.color),
      largoCm: numeroOpcional(cuerpo.largoCm),
      anchoCm: numeroOpcional(cuerpo.anchoCm),
      altoCm: numeroOpcional(cuerpo.altoCm),
      profundidadCm: numeroOpcional(cuerpo.profundidadCm),
      cuentaMm: numeroOpcional(cuerpo.cuentaMm),
      ajustable: Boolean(cuerpo.ajustable),
      extensionCm: numeroOpcional(cuerpo.extensionCm),
      costo: numero(cuerpo.costo),
      precio,
      stock,
      destacado: Boolean(cuerpo.destacado),
      publicado: cuerpo.publicado === undefined ? true : Boolean(cuerpo.publicado),
      notaInterna: texto(cuerpo.notaInterna),
    },
    fotos,
  } as const;
}

/** Agrega -2, -3… si el slug ya existe. */
export async function slugLibre(nombre: string) {
  const base = aSlug(nombre) || "pieza";
  let candidato = base;
  let n = 2;
  while (await prisma.producto.findUnique({ where: { slug: candidato }, select: { id: true } })) {
    candidato = `${base}-${n++}`;
  }
  return candidato;
}
