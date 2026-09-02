export type DijeDisponible = {
  id: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  activo: boolean;
};

/** Valida los dijes antes de guardarlos en el inventario de materiales. */
export function datosDeDije(cuerpo: Record<string, unknown>) {
  const nombre = typeof cuerpo.nombre === "string" ? cuerpo.nombre.trim() : "";
  if (!nombre) return { error: "Falta el nombre del dije" } as const;

  const descripcion = typeof cuerpo.descripcion === "string" ? cuerpo.descripcion.trim() : "";
  const stock = Math.trunc(Number(cuerpo.stock));
  if (!Number.isFinite(stock) || stock < 0) return { error: "El stock no puede ser negativo" } as const;

  return {
    valores: {
      nombre,
      descripcion: descripcion || null,
      stock,
      activo: cuerpo.activo !== false,
    },
  } as const;
}
