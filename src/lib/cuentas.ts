export const ACABADOS_CUENTA = ["perla", "metal", "mate"] as const;
export type AcabadoCuenta = (typeof ACABADOS_CUENTA)[number];

export type CuentaDisponible = {
  id: string;
  nombre: string;
  color: string;
  tamanoMm: number;
  acabado: AcabadoCuenta;
  stock: number;
};

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

/** Valida las cuentas del inventario antes de persistirlas. */
export function datosDeCuenta(cuerpo: Record<string, unknown>) {
  const nombre = texto(cuerpo.nombre);
  if (!nombre) return { error: "Falta el nombre de la cuenta" } as const;

  const color = texto(cuerpo.color);
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: "El color debe estar en formato hexadecimal" } as const;

  const tamanoMm = Number(cuerpo.tamanoMm);
  if (!Number.isFinite(tamanoMm) || tamanoMm <= 0 || tamanoMm > 50) {
    return { error: "El tamaño debe estar entre 0 y 50 mm" } as const;
  }

  const stock = Math.trunc(Number(cuerpo.stock));
  if (!Number.isFinite(stock) || stock < 0) return { error: "El stock no puede ser negativo" } as const;

  const acabado = texto(cuerpo.acabado);
  if (!ACABADOS_CUENTA.includes(acabado as AcabadoCuenta)) return { error: "Acabado inválido" } as const;

  return {
    valores: {
      nombre,
      color: color.toLowerCase(),
      tamanoMm,
      stock,
      acabado: acabado as AcabadoCuenta,
      activo: cuerpo.activo !== false,
    },
  } as const;
}
