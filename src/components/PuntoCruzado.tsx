import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { tintaSobre } from "@/lib/cartera/mapa";
import { PUNTOS, type Punto } from "@/lib/cartera/punto";

const S = 20; // media diagonal de cada unidad
const RADIO = 9;
const IZQ = 62; // aire para la marca de arranque, a la izquierda de la cuenta 1
const DER = 34; // aire para las flechas de los dos extremos
const ALTO_AIRE = 26;
const UNIDADES_MAX = 3;

const ORO = "#96742c"; // extremo I
const TINTA = "#4a453e"; // extremo II

/**
 * Numeración en el orden en que se ensartan: la 1 es donde arranca el hilo
 * doblado, y cada unidad suma tres — la de arriba, la de abajo y la que cierra.
 */
const numeroArriba = (j: number) => 3 * j + 2;
const numeroAbajo = (j: number) => 3 * j + 3;
const numeroCierre = (j: number) => 3 * j + 4;

type Lado = "arriba" | "abajo";

/**
 * Por dónde va cada extremo en la unidad `j`. Los dos se cruzan dentro de la
 * cuenta que cierra, así que **salen cambiados de lado**: el que venía por
 * arriba sigue por abajo. Eso es el punto cruzado.
 */
const ladoDe = (extremo: "I" | "II", j: number): Lado => {
  const arranca = extremo === "I" ? 0 : 1;
  return (j + arranca) % 2 === 0 ? "arriba" : "abajo";
};

function Paso({
  unidades,
  paleta,
  titulo,
}: {
  unidades: number;
  paleta: CuentaPaleta[];
  titulo: string;
}) {
  const ancho = IZQ + UNIDADES_MAX * 2 * S + DER;
  const alto = 2 * S + 2 * ALTO_AIRE;
  const medio = alto / 2;
  const x = (medioPaso: number) => IZQ + medioPaso * S;
  const yDe = (lado: Lado) => medio + (lado === "arriba" ? -S : S);

  const cuenta = (i: number) => paleta[Math.min(i, paleta.length - 1)];

  /** El recorrido de un extremo: arranca en la 1 y va cruzando unidad a unidad. */
  const recorrido = (extremo: "I" | "II") => {
    const partes = [`M ${x(0)} ${medio}`];
    for (let j = 0; j < unidades; j++) {
      partes.push(`L ${x(2 * j + 1)} ${yDe(ladoDe(extremo, j))}`);
      partes.push(`L ${x(2 * j + 2)} ${medio}`);
    }
    return partes.join(" ");
  };

  /** La flecha de salida: por dónde sigue ese extremo en la unidad que viene. */
  const flecha = (extremo: "I" | "II") => {
    const lado = ladoDe(extremo, unidades);
    const desdeX = x(2 * unidades);
    const haciaX = desdeX + S * 0.8;
    const haciaY = medio + (lado === "arriba" ? -S * 0.8 : S * 0.8);
    const punta = 3.6;
    const dx = haciaX - desdeX;
    const dy = haciaY - medio;
    const largo = Math.hypot(dx, dy);
    const ux = dx / largo;
    const uy = dy / largo;
    return {
      linea: `M ${desdeX} ${medio} L ${haciaX} ${haciaY}`,
      cabeza: `M ${haciaX} ${haciaY}
               L ${haciaX - ux * punta * 2 - uy * punta} ${haciaY - uy * punta * 2 + ux * punta}
               L ${haciaX - ux * punta * 2 + uy * punta} ${haciaY - uy * punta * 2 - ux * punta} Z`,
      etiquetaX: haciaX + 3,
      etiquetaY: haciaY + (lado === "arriba" ? -3 : 9),
    };
  };

  return (
    <figure className="m-0 flex flex-col gap-1.5">
      <figcaption className="sobretitulo">{titulo}</figcaption>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        role="img"
        aria-label={`Paso del tejido cruzado con ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`}
        className="h-auto w-full"
      >
        {/* Los dos extremos, cada uno con su color */}
        {(["I", "II"] as const).map((extremo) => (
          <path
            key={extremo}
            d={recorrido(extremo)}
            fill="none"
            stroke={extremo === "I" ? ORO : TINTA}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Por dónde sigue cada extremo */}
        {(["I", "II"] as const).map((extremo) => {
          const f = flecha(extremo);
          const color = extremo === "I" ? ORO : TINTA;
          return (
            <g key={`f-${extremo}`}>
              <path d={f.linea} stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d={f.cabeza} fill={color} />
              <text x={f.etiquetaX} y={f.etiquetaY} fontSize="10" fontWeight="700" fill={color}>
                {extremo}
              </text>
            </g>
          );
        })}

        {/* Las cuentas de arriba y de abajo de cada unidad */}
        {Array.from({ length: unidades }, (_, j) => (
          <g key={j}>
            {(["arriba", "abajo"] as const).map((lado) => {
              const n = lado === "arriba" ? numeroArriba(j) : numeroAbajo(j);
              const c = cuenta(lado === "arriba" ? 1 : 2);
              return (
                <g key={lado}>
                  <circle
                    cx={x(2 * j + 1)}
                    cy={yDe(lado)}
                    r={RADIO}
                    fill={c.color}
                    stroke="#8b847a"
                    strokeWidth="0.7"
                  />
                  <text
                    x={x(2 * j + 1)}
                    y={yDe(lado) + 3.4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={tintaSobre(c.color)}
                  >
                    {n}
                  </text>
                </g>
              );
            })}
          </g>
        ))}

        {/* Las cuentas del eje: la 1 es el arranque, las demás son las que cierran */}
        {Array.from({ length: unidades + 1 }, (_, i) => {
          const n = i === 0 ? 1 : numeroCierre(i - 1);
          return (
            <g key={`eje-${i}`}>
              <circle
                cx={x(2 * i)}
                cy={medio}
                r={RADIO}
                fill={cuenta(0).color}
                stroke={i === 0 ? ORO : "#8b847a"}
                strokeWidth={i === 0 ? 2 : 0.7}
              />
              <text
                x={x(2 * i)}
                y={medio + 3.4}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill={tintaSobre(cuenta(0).color)}
              >
                {n}
              </text>
            </g>
          );
        })}

        <text
          x={x(0) - RADIO - 6}
          y={medio + 3}
          textAnchor="end"
          fontSize="8.5"
          fontWeight="600"
          fill={ORO}
        >
          empieza
        </text>
      </svg>
    </figure>
  );
}

/**
 * El punto, explicado como en el pliego de `patrones/cruzado.md`: dónde arranca
 * el hilo, por qué cuentas va pasando cada extremo y dónde queda cada uno.
 *
 * La clave está en la cuenta que cierra cada unidad: los dos extremos la
 * atraviesan en direcciones opuestas y **salen cambiados de lado**. Por eso los
 * dos caminos de colores se intercambian en cada cruce.
 */
export default function PuntoCruzado({
  paleta,
  punto,
  compacto = false,
}: {
  paleta: CuentaPaleta[];
  punto: Punto;
  compacto?: boolean;
}) {
  const pasos = compacto
    ? [{ unidades: 1, titulo: "1 · La primera cruz" }, { unidades: 3, titulo: "2 · Y se repite" }]
    : [
        { unidades: 1, titulo: "1 · La primera cruz" },
        { unidades: 2, titulo: "2 · Tres cuentas más" },
        { unidades: 3, titulo: "3 · Y así hasta el largo" },
      ];

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`grid gap-x-6 gap-y-4 ${compacto ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
      >
        {pasos.map((p) => (
          <Paso key={p.titulo} unidades={p.unidades} paleta={paleta} titulo={p.titulo} />
        ))}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-humo">
        <p>
          <b className="font-semibold text-tinta">{PUNTOS[punto].nombre}.</b>{" "}
          El hilo va <b className="font-semibold text-tinta">doblado al medio</b>: los
          dos extremos salen de la cuenta 1. Con uno ensartás la de arriba y con el
          otro la de abajo, y los dos entran en la que cierra —{" "}
          <span style={{ color: ORO }}>I</span> por un lado y{" "}
          <span style={{ color: TINTA }}>II</span> por el otro. Ahí se cruzan y{" "}
          <b className="font-semibold text-tinta">salen cambiados de lado</b>: el que
          venía por arriba sigue por abajo.
        </p>
        <p>{PUNTOS[punto].comoVa}</p>
        <p>
          Al terminar, los dos extremos salen de la última cuenta. Se rematan con
          nudo doble y se esconden pasándolos por varias cuentas vecinas antes de
          cortar.
        </p>
      </div>
    </div>
  );
}
