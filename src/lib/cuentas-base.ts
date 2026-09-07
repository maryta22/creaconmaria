/**
 * Las **cuentas base**: la escala de grises con la que se arman los modelos.
 *
 * No son stock. No se compran, no se descuentan de nada y no tienen precio: son
 * la cuenta patrón, en todos los diámetros que usa la casa, para poder mostrar
 * la **forma** de un modelo sin comprometer un color.
 *
 * Lo pidió María: *"crea unas cuentas standard de todos los mm, blancos…
 * aparte del stock… estas solo se usarán para armar los modelos base, no se
 * podrá pedir hasta seleccionar la cuenta en stock respectivo"*.
 *
 * ## Por qué grises y no colores lindos
 *
 * Un modelo pintado con perlas de verdad se lee como una pieza terminada, y no
 * lo es: es un patrón esperando que alguien elija las cuentas. Cuando la
 * margarita salía en celeste y rosa, esos colores parecían parte del modelo —y
 * no lo son, son los de una foto—. En gris se entiende de una: **esto es la
 * forma, el color lo ponés vos**.
 *
 * El primer tono es un **gris claro**; los que siguen se van eligiendo por
 * contraste, no por orden de claridad. Un modelo de un solo color sale todo de
 * ese gris, y uno con dibujo usa los que necesite para que se distingan las
 * partes — igual que un pliego impreso.
 *
 * Todas son `mate` a propósito: sin brillo de perla ni de metal, para que
 * ninguna se confunda con una cuenta real del inventario.
 *
 * ## La regla que sale de acá
 *
 * **Una pieza con cuentas base no se puede pedir.** Antes de guardar hay que
 * elegir, para cada papel de la paleta, una cuenta de `CuentaStock` del mismo
 * diámetro. Lo comprueba `tieneCuentasBase()`, y lo miran el diseñador y la
 * API: el precio de una cuenta que no existe sería inventado y el pedido, un
 * papel que María no puede tejer.
 */
import type { CuentaPaleta } from "@/lib/cartera/modelos";

/** Los diámetros que usa la casa, en mm. */
export const MEDIDAS_BASE = [3, 4, 6, 8, 10, 12] as const;

/**
 * La escala, **ordenada por contraste y no de claro a oscuro**.
 *
 * El 0 es un **gris claro, no blanco**. Blanco puro se veía bien sobre el fondo
 * oscuro del visor, pero las tarjetas del catálogo son blancas y las carteras
 * base desaparecían contra el papel. Lo pidió María: *"hazlas un poco gris para
 * que se puedan ver con el fondo blanco"*.
 *
 * Y va **bastante** más gris de lo que uno escribiría: el visor tiene luz de
 * entorno y tono ACES, que levantan los claros. Un gris apenas insinuado sale
 * blanco igual en pantalla; hay que bajarlo hasta que se note en el color
 * plano para que se note en el render.
 *
 * El 1 es el más oscuro de todos, no el segundo más claro — porque la mayoría
 * de los modelos usan dos tonos y esos dos tienen que distinguirse de una. Con
 * la escala en orden, la Perla alternada salía clara contra un gris casi igual:
 * en el visor, con la luz del entorno, las dos se veían iguales y el modelo
 * parecía liso.
 *
 * Los que siguen van llenando los huecos del medio, así cada tono que se suma
 * cae lo más lejos posible de los que ya estaban.
 */
export const TONOS_BASE = [
  { nombre: "Gris claro", color: "#8e8d87" },
  { nombre: "Gris tinta", color: "#2f2f2b" },
  { nombre: "Gris medio", color: "#61615b" },
  { nombre: "Gris perla", color: "#c2c1bc" },
  { nombre: "Gris oscuro", color: "#454540" },
] as const;

/**
 * El forro de un modelo base. El forro real viene en colores —el de fábrica es
 * rosa— y en una pieza patrón eso desentona: la cartera sale en gris y por los
 * huecos se le ve una tela de color, que nadie eligió.
 *
 * Va un paso más oscuro que la cuenta, para que se note que hay tela adentro.
 */
export const FORRO_BASE = "#75746e";

/** Marca de agua: así se reconoce una cuenta base sin comparar colores. */
const PREFIJO = "Base";

/** Una cuenta base de un diámetro y un tono de la escala. */
export function cuentaBase(mm: number, tono = 0): CuentaPaleta {
  const paso = TONOS_BASE[Math.min(Math.max(tono, 0), TONOS_BASE.length - 1)];
  return {
    mm,
    color: paso.color,
    nombre: `${PREFIJO} ${paso.nombre.toLowerCase()} ${mm} mm`,
    acabado: "mate",
  };
}

/**
 * La paleta base de un modelo: un tono por papel, en el diámetro que le toca a
 * cada uno. `medidas` es la misma lista que declara la técnica.
 */
export function paletaBase(medidas: readonly number[]): CuentaPaleta[] {
  return medidas.map((mm, papel) => cuentaBase(mm, papel));
}

/** ¿Esta cuenta es de la escala base y no del inventario? */
export function esCuentaBase(cuenta: { nombre?: string } | undefined) {
  return Boolean(cuenta?.nombre?.startsWith(`${PREFIJO} `));
}

/**
 * La paleta con la que se muestra un modelo base: cada papel pasa a su tono de
 * la escala, con lo que un modelo de dos tonos sigue distinguiéndose.
 *
 * Se probó deducirlo del dato —"una sola color quiere decir que no hay
 * dibujo"— y no alcanza: la Cuadrada es una forma lisa y lleva dos tonos, el
 * cuerpo y la banda de arriba. Cuáles son las básicas es una decisión de
 * producto, y vive en `CARTERAS_BASE`.
 */
export function paletaDeVitrina(paleta: CuentaPaleta[]): CuentaPaleta[] {
  return paleta.map((cuenta, papel) => cuentaBase(cuenta.mm, papel));
}

/**
 * ¿La paleta todavía tiene alguna cuenta base? Si la respuesta es sí, la pieza
 * es una muestra y **no se puede pedir**.
 */
export function tieneCuentasBase(paleta: { nombre?: string }[]) {
  return paleta.some(esCuentaBase);
}
