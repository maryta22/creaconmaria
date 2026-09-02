/**
 * Foto de una pieza. Si todavía no se subió ninguna, dibuja un marcador
 * discreto con la inicial en lugar de un hueco vacío.
 */
export default function FotoProducto({
  url,
  alt,
  nombre,
  className = "",
}: {
  url?: string | null;
  alt?: string | null;
  nombre: string;
  className?: string;
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt || nombre} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-hueso ${className}`}>
      <span className="titulo text-3xl text-oro-claro">{nombre.charAt(0).toUpperCase()}</span>
    </div>
  );
}
