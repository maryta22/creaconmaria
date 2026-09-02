export type ProductoCarrito = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  stock: number;
  foto?: string;
};

export type LineaCarrito = ProductoCarrito & {
  cantidad: number;
};
