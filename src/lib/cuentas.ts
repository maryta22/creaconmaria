export const ACABADOS_CUENTA = ["perla", "metal", "mate", "cristal"] as const;
export type AcabadoCuenta = (typeof ACABADOS_CUENTA)[number];

export const NOMBRES_ACABADO: Record<AcabadoCuenta, string> = {
  perla: "Perla", metal: "Metal", mate: "Mate", cristal: "Cristal facetado",
};

export function acabadoDeCuenta(valor: string): AcabadoCuenta {
  return ACABADOS_CUENTA.includes(valor as AcabadoCuenta) ? valor as AcabadoCuenta : "perla";
}

/** Muestra el corte del cristal también en los selectores de inventario. */
export function estiloDeCuenta(cuenta: { color: string; acabado: string }) {
  if (cuenta.acabado === "cristal") return {
    borderRadius: 0,
    clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
    background: `conic-gradient(from 45deg, #ffffffb3, #ffffff00 25%, #00000035 50%, #ffffff90 75%, #ffffffb3), ${cuenta.color}`,
  };
  const luz = cuenta.acabado === "metal" ? 0.9 : 0.75;
  return {
    background: cuenta.acabado === "mate" ? cuenta.color : `radial-gradient(circle at 33% 27%, rgba(255,255,255,${luz}) 0%, rgba(255,255,255,0) 45%), ${cuenta.color}`,
  };
}

export type CuentaDisponible = {
  id: string;
  nombre: string;
  color: string;
  tamanoMm: number;
  acabado: AcabadoCuenta;
  /** Lo que suma esta cuenta en el diseñador del cliente. */
  precioUnidad: number;
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

  const precioUnidad = Number(cuerpo.precioUnidad ?? 0);
  if (!Number.isFinite(precioUnidad) || precioUnidad < 0) {
    return { error: "El precio de la cuenta no puede ser negativo" } as const;
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
      precioUnidad,
      stock,
      acabado: acabado as AcabadoCuenta,
      activo: cuerpo.activo !== false,
    },
  } as const;
}
