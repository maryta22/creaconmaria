import { ubicacionesDePulsera, type ModeloPulsera } from "@/lib/pulsera/modelos";
import { colorDeMetal } from "@/lib/pulsera/cierre";

/**
 * Vista vectorial inmediata mientras el visor 3D de una tarjeta se monta.
 *
 * **Es el mismo layout que el 3D, proyectado.** Antes dibujaba la matriz
 * estirada en una tira y el salto al visor era de una pieza a otra: la tarjeta
 * mostraba una cinta y un instante después aparecía un aro. Ahora toma las
 * mismas cuentas de `ubicacionesDePulsera()` y las proyecta desde el mismo
 * ángulo que la cámara, así que lo que se ve antes y después es la misma pieza.
 *
 * La proyección es ortográfica; la del visor tiene perspectiva. A esta
 * distancia la diferencia no se nota y no vale una matriz de proyección acá.
 */

/** Desde donde mira la cámara del visor. */
const CAMARA = [0.3, 0.62, 0.72] as const;

/**
 * **Las coordenadas van redondeadas.** `Math.sin` no está obligado a dar el
 * mismo último bit en todas las implementaciones, y no lo da: Node y el
 * navegador difieren en el dígito diecisiete. Con eso React ve un atributo
 * distinto en el HTML del servidor y en el del cliente, y tira el árbol
 * hidratado a la basura. Cuatro decimales sobran para un dibujo de centímetros
 * y de paso achican el SVG.
 */
const redondear = (valor: number) => Math.round(valor * 1e4) / 1e4;

function ejes() {
  const largo = Math.hypot(...CAMARA);
  const f = CAMARA.map((v) => v / largo) as [number, number, number];
  // derecha = arriba × frente, normalizada; arriba del mundo es (0, 1, 0).
  const d: [number, number, number] = [f[2], 0, -f[0]];
  const dl = Math.hypot(d[0], d[2]) || 1;
  const derecha: [number, number, number] = [d[0] / dl, 0, d[2] / dl];
  const arriba: [number, number, number] = [
    f[1] * derecha[2] - f[2] * derecha[1],
    f[2] * derecha[0] - f[0] * derecha[2],
    f[0] * derecha[1] - f[1] * derecha[0],
  ];
  return { f, derecha, arriba };
}

export default function MuestraPulsera({ modelo, className = "" }: { modelo: ModeloPulsera; className?: string }) {
  const layout = ubicacionesDePulsera(modelo, modelo.largoBaseCm);
  const { f, derecha, arriba } = ejes();
  const punto = (p: readonly [number, number, number]) => ({
    x: redondear(p[0] * derecha[0] + p[1] * derecha[1] + p[2] * derecha[2]),
    y: redondear(-(p[0] * arriba[0] + p[1] * arriba[1] + p[2] * arriba[2])),
    // Redondeada tambien: si dos profundidades difieren en el ultimo bit, el
    // orden del sort cambia entre servidor y cliente y se mueven los nodos.
    z: redondear(p[0] * f[0] + p[1] * f[1] + p[2] * f[2]),
  });

  // De atrás hacia adelante, para que las de adelante tapen a las de atrás.
  const cuentas = layout.cuentas
    .map((cuenta) => ({ ...punto(cuenta.pos), r: redondear(cuenta.diametro / 2), tono: cuenta.tono }))
    .sort((a, b) => a.z - b.z);

  // El broche y la cadena también van: si no, la miniatura muestra una pieza
  // distinta de la que aparece cuando monta el 3D.
  const oro = colorDeMetal("dorado");
  const herrajes = layout.herrajes
    .map((h) => ({ ...punto(h.pos), r: redondear(h.radio), grosor: redondear(h.grosor) }))
    .sort((a, b) => a.z - b.z);

  const medio = punto(layout.centro);
  const lado = redondear(layout.alcance * 2.15);

  return (
    <svg
      viewBox={`${redondear(medio.x - lado / 2)} ${redondear(medio.y - lado / 2)} ${lado} ${lado}`}
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`${modelo.nombre}, ${modelo.tecnica}`}
    >
      <defs>
        <radialGradient id={`brillo-${modelo.id}`} cx="32%" cy="24%" r="72%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.16" />
        </radialGradient>
      </defs>
      {cuentas.map((cuenta, i) => (
        <g key={i}>
          <circle
            cx={cuenta.x}
            cy={cuenta.y}
            r={cuenta.r}
            fill={modelo.paleta[cuenta.tono]?.color ?? "#f4ede2"}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={redondear(cuenta.r * 0.14)}
          />
          <circle cx={cuenta.x} cy={cuenta.y} r={cuenta.r} fill={`url(#brillo-${modelo.id})`} />
        </g>
      ))}
      {herrajes.map((h, i) => (
        <circle
          key={`h${i}`}
          cx={h.x}
          cy={h.y}
          r={h.r}
          fill="none"
          stroke={oro}
          strokeWidth={redondear(h.grosor * 2)}
        />
      ))}
    </svg>
  );
}
