/**
 * Un diseño del cliente es **una secuencia de cuentas**. De esa secuencia salen
 * calculados el largo, el precio y la lista de materiales: no son datos que
 * alguien escriba y haya que mantener sincronizados.
 *
 * Nada de acá toca la base. La ruta hace la consulta y estas funciones hacen
 * la cuenta, igual que `datosDeCuenta()` en `src/lib/cuentas.ts`.
 */
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { ACABADOS_CUENTA, type AcabadoCuenta } from "@/lib/cuentas";
import { descomprimir } from "@/lib/celdas";
import { tipoPorSlug, type TipoHilo } from "./tipos";

/**
 * Una cuenta dentro de un diseño. Es la paleta del 3D (`CuentaPaleta`) más lo
 * que necesita el pedido: de dónde salió y cuánto vale.
 *
 * Ojo: cuando esto se guarda es una **copia**, no una referencia viva a
 * `CuentaStock`. Si María le cambia el precio o borra la cuenta del
 * inventario, el diseño que el cliente ya mandó tiene que seguir viéndose y
 * costando igual. El `id` queda solo para poder reponer stock después.
 */
export type CuentaHilo = CuentaPaleta & {
  id: string;
  precioUnidad: number;
};

/**
 * Base36: un caracter por cuenta, así que **una pieza** no puede mezclar más
 * de 36 colores. No es un tope de cuántas cuentas ofrecerle al cliente: el
 * inventario puede tener las que sea y `compactar()` deja guardadas solo las
 * que la pieza usa de verdad.
 */
export const MAX_PALETA = 36;
/** Un collar de 55 cm en cuentas de 3 mm da 183. Con 200 sobra. */
export const MAX_CUENTAS = 200;
export const MAX_NOMBRE = 60;

/** Las cuentas del inventario, tal como las necesita el diseñador. */
type CuentaDelStock = {
  id: string;
  nombre: string;
  color: string;
  tamanoMm: number;
  acabado: string;
  precioUnidad: number;
};

/** Del inventario de María a la paleta del diseñador. */
export function aPaleta(cuentas: CuentaDelStock[]): CuentaHilo[] {
  return cuentas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    mm: c.tamanoMm,
    acabado: ACABADOS_CUENTA.includes(c.acabado as AcabadoCuenta)
      ? (c.acabado as AcabadoCuenta)
      : "perla",
    precioUnidad: c.precioUnidad,
  }));
}

function redondear(valor: number, decimales: number) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

/** Los diámetros, en cm y en orden. Es lo único que necesita la geometría. */
export function diametrosCm(paleta: CuentaHilo[], celdas: number[]) {
  return celdas.map((i) => (paleta[i]?.mm ?? 0) / 10);
}

/** Las cuentas una detrás de la otra, más lo que mide el cierre. */
export function largoDe(paleta: CuentaHilo[], celdas: number[], tipo: TipoHilo) {
  const cuentas = celdas.reduce((suma, i) => suma + (paleta[i]?.mm ?? 0), 0) / 10;
  return redondear(cuentas + tipo.cierreCm, 1);
}

/** Armado del tipo + cada cuenta a su precio. Una cuenta sin precio suma 0. */
export function precioDe(paleta: CuentaHilo[], celdas: number[], tipo: TipoHilo, niveles = 1) {
  const cuentas = celdas.reduce((suma, i) => suma + (paleta[i]?.precioUnidad ?? 0), 0) * niveles;
  return redondear(tipo.armado + cuentas, 2);
}

/** Cuántas cuentas de cada tipo lleva: la lista de materiales del pedido. */
export function materialesDe(paleta: CuentaHilo[], celdas: number[], niveles = 1) {
  const usadas = new Map<number, number>();
  for (const i of celdas) usadas.set(i, (usadas.get(i) ?? 0) + 1);
  return [...usadas.entries()]
    .filter(([indice]) => paleta[indice])
    .sort((a, b) => b[1] - a[1])
    .map(([indice, cantidad]) => ({ indice, cantidad: cantidad * niveles, cuenta: paleta[indice] }));
}

/**
 * Cuántas cuentas de un diámetro entran en un largo. Es lo que usa el botón
 * de completar hasta el objetivo.
 */
export function cuentasParaLargo(mm: number, objetivoCm: number, tipo: TipoHilo) {
  if (mm <= 0) return 0;
  const disponible = Math.max(objetivoCm - tipo.cierreCm, 0);
  return Math.max(1, Math.min(Math.round((disponible * 10) / mm), MAX_CUENTAS));
}

/**
 * Deja en la paleta solo las cuentas que el diseño usa de verdad, en el orden
 * en que aparecen, y recorre los índices para que sigan apuntando bien.
 *
 * Es lo que se manda a guardar: el inventario de María puede tener treinta
 * colores, pero una pulsera de tres colores tiene que quedar guardada con
 * tres — así la lista de materiales del pedido es exactamente lo que lleva.
 */
export function compactar(paleta: CuentaHilo[], celdas: number[]) {
  const nuevoIndice = new Map<number, number>();
  const usada: CuentaHilo[] = [];
  const indices = celdas.map((viejo) => {
    if (!paleta[viejo]) return 0;
    let indice = nuevoIndice.get(viejo);
    if (indice === undefined) {
      indice = usada.length;
      nuevoIndice.set(viejo, indice);
      usada.push(paleta[viejo]);
    }
    return indice;
  });
  return { paleta: usada, celdas: indices };
}

// --- Guardar -----------------------------------------------------------------

/** Sin O/0 ni I/1: el código se dicta por teléfono y se copia a mano. */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nuevoCodigo() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

function texto(valor: unknown, largoMax: number) {
  return typeof valor === "string" ? valor.trim().slice(0, largoMax) : "";
}

/**
 * Valida lo que manda el navegador. **No confía en el largo ni en el precio**:
 * el cuerpo solo trae qué cuentas se usaron y en qué orden; los números los
 * calcula el servidor con los precios reales del inventario.
 */
export function datosDeDiseno(cuerpo: Record<string, unknown>) {
  const tipo = tipoPorSlug(texto(cuerpo.tipo, 20));
  if (!tipo) return { error: "Ese tipo de pieza no existe" } as const;

  const ids = Array.isArray(cuerpo.paleta)
    ? cuerpo.paleta.filter((v): v is string => typeof v === "string")
    : [];
  if (ids.length === 0) return { error: "El diseño no tiene cuentas" } as const;
  if (ids.length > MAX_PALETA) return { error: `No se pueden usar más de ${MAX_PALETA} colores` } as const;
  if (new Set(ids).size !== ids.length) return { error: "La paleta tiene cuentas repetidas" } as const;

  const celdas = texto(cuerpo.celdas, MAX_CUENTAS + 1);
  if (!celdas) return { error: "Todavía no pusiste ninguna cuenta" } as const;
  if (celdas.length > MAX_CUENTAS) return { error: `El diseño no puede pasar de ${MAX_CUENTAS} cuentas` } as const;

  const indices = descomprimir(celdas, celdas.length);
  if (indices.some((i) => i >= ids.length)) return { error: "El diseño usa una cuenta que no está en la paleta" } as const;

  const largoObjetivoCm = Number(cuerpo.largoObjetivoCm);
  if (!Number.isFinite(largoObjetivoCm) || largoObjetivoCm < tipo.minCm || largoObjetivoCm > tipo.maxCm) {
    return { error: `El largo tiene que estar entre ${tipo.minCm} y ${tipo.maxCm} cm` } as const;
  }

  return {
    valores: {
      tipo,
      nombre: texto(cuerpo.nombre, MAX_NOMBRE) || `${tipo.nombre} a medida`,
      ids,
      indices,
      celdas,
      largoObjetivoCm,
      contacto: texto(cuerpo.contacto, 120) || null,
      nota: texto(cuerpo.nota, 400) || null,
    },
  } as const;
}

/** Lee la paleta guardada de un diseño. Un JSON roto no puede tirar la página. */
export function paletaGuardada(json: string): CuentaHilo[] {
  try {
    const valor = JSON.parse(json) as unknown;
    if (!Array.isArray(valor)) return [];
    return valor.filter(
      (c): c is CuentaHilo =>
        !!c && typeof c === "object" && typeof (c as CuentaHilo).color === "string",
    );
  } catch {
    return [];
  }
}
