export type ProductoCarrito = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  foto?: string;
  /**
   * A dónde lleva la línea. Vacío = la ficha de la pieza (`/pieza/slug`); un
   * diseño del cliente apunta acá a su `/disenar/ver/CODIGO`, que es la única
   * forma de volver a verlo.
   */
  enlace?: string;
  /** Cuenta solicitada para una cartera personalizada. */
  personalizacion?: {
    cuentaId: string;
    cuentaNombre: string;
    color: string;
    tamanoMm: number;
  };
};

export type LineaCarrito = ProductoCarrito & {
  cantidad: number;
};

export function claveLineaCarrito(linea: Pick<ProductoCarrito, "id" | "personalizacion">) {
  return `${linea.id}:${linea.personalizacion?.cuentaId ?? "original"}`;
}
