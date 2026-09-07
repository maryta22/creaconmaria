import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { tintaSobre } from "@/lib/cartera/mapa";
import { PUNTOS, type Punto } from "@/lib/cartera/punto";

const S = 20; // media diagonal de cada unidad
const RADIO = 9;
const IZQ = 62; // aire para la marca de arranque, a la izquierda de la cuenta 1
const DER = 34; // aire para las flechas de los dos extremos
const ALTO_AIRE = 30;
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
type Extremo = "I" | "II";

/**
 * Por dónde va cada extremo en la unidad `j`. Los dos se cruzan dentro de la
 * cuenta que cierra, así que **salen cambiados de lado**: el que venía por
 * arriba sigue por abajo. Eso es el punto cruzado.
 */
const ladoDe = (extremo: Extremo, j: number): Lado => {
  const arranca = extremo === "I" ? 0 : 1;
  return (j + arranca) % 2 === 0 ? "arriba" : "abajo";
};

/** Qué extremo está de un lado en la unidad `j`. */
const extremoEn = (lado: Lado, j: number): Extremo =>
  ladoDe("I", j) === lado ? "I" : "II";

/**
 * Cuánto se avanzó dentro de la unidad que se está haciendo:
 * 0 = los dos extremos salieron de la cuenta anterior y todavía no ensartaron
 * nada · 1 = está puesta la de arriba · 2 = también la de abajo · 3 = las dos
 * cruzaron en la que cierra y la unidad quedó trabada.
 */
type Avance = 0 | 1 | 2 | 3;

type Cuadro = {
  titulo: string;
  texto: React.ReactNode;
  /** Unidades ya terminadas antes de la que se muestra en curso. */
  unidades: number;
  avance: Avance;
  /** Números de cuenta a resaltar: es lo que se acaba de hacer. */
  destacar: number[];
  /** Marca el cruce sobre la cuenta que cierra, como la ✕ del pliego. */
  cruce?: boolean;
};

function Dibujo({
  cuadro,
  paleta,
}: {
  cuadro: Cuadro;
  paleta: CuentaPaleta[];
}) {
  const { unidades, avance, destacar, cruce } = cuadro;
  const ancho = IZQ + UNIDADES_MAX * 2 * S + DER;
  const alto = 2 * S + 2 * ALTO_AIRE;
  const medio = alto / 2;
  const x = (medioPaso: number) => IZQ + medioPaso * S;
  const yDe = (lado: Lado) => medio + (lado === "arriba" ? -S : S);
  const cuenta = (i: number) => paleta[Math.min(i, paleta.length - 1)];
  const resaltada = (n: number) => destacar.includes(n);

  /** La unidad en curso es la que sigue a las terminadas. */
  const j = unidades;

  /**
   * El recorrido de un extremo hasta donde llegó. Cada uno se dibuja solo
   * hasta la cuenta que tiene en la mano: así se ve **cuál de los dos se
   * movió** en este paso y cuál está esperando.
   */
  const recorrido = (extremo: Extremo) => {
    const partes = [`M ${x(0)} ${medio}`];
    for (let k = 0; k < unidades; k++) {
      partes.push(`L ${x(2 * k + 1)} ${yDe(ladoDe(extremo, k))}`);
      partes.push(`L ${x(2 * k + 2)} ${medio}`);
    }
    const lado = ladoDe(extremo, j);
    const yaEnsarto = (lado === "arriba" && avance >= 1) || (lado === "abajo" && avance >= 2);
    if (yaEnsarto) partes.push(`L ${x(2 * j + 1)} ${yDe(lado)}`);
    if (avance >= 3) partes.push(`L ${x(2 * j + 2)} ${medio}`);
    return partes.join(" ");
  };

  /** Por dónde sale cada extremo: la flecha dice a qué lado va en la unidad que viene. */
  const flecha = (extremo: Extremo) => {
    // Mientras la unidad no cerró, el extremo sigue del lado en el que está.
    const unidadDeSalida = avance >= 3 ? j + 1 : j;
    const lado = ladoDe(extremo, unidadDeSalida);
    const yaEnsarto =
      avance >= 3 ||
      (ladoDe(extremo, j) === "arriba" && avance >= 1) ||
      (ladoDe(extremo, j) === "abajo" && avance >= 2);
    const desdeX = avance >= 3 ? x(2 * j + 2) : yaEnsarto ? x(2 * j + 1) : x(2 * j);
    const desdeY = avance >= 3 || !yaEnsarto ? medio : yDe(ladoDe(extremo, j));
    const haciaX = desdeX + S * 0.75;
    const haciaY = desdeY + (lado === "arriba" ? -S * 0.6 : S * 0.6);
    const punta = 3.6;
    const dx = haciaX - desdeX;
    const dy = haciaY - desdeY;
    const largo = Math.hypot(dx, dy) || 1;
    const ux = dx / largo;
    const uy = dy / largo;
    return {
      linea: `M ${desdeX} ${desdeY} L ${haciaX} ${haciaY}`,
      cabeza: `M ${haciaX} ${haciaY}
               L ${haciaX - ux * punta * 2 - uy * punta} ${haciaY - uy * punta * 2 + ux * punta}
               L ${haciaX - ux * punta * 2 + uy * punta} ${haciaY - uy * punta * 2 - ux * punta} Z`,
      etiquetaX: haciaX + 3,
      etiquetaY: haciaY + (lado === "arriba" ? -3 : 9),
    };
  };

  /** Las cuentas laterales que hay que dibujar, con su número y su lado. */
  const laterales: { lado: Lado; j: number; n: number }[] = [];
  for (let k = 0; k < unidades; k++) {
    laterales.push({ lado: "arriba", j: k, n: numeroArriba(k) });
    laterales.push({ lado: "abajo", j: k, n: numeroAbajo(k) });
  }
  if (avance >= 1) laterales.push({ lado: "arriba", j, n: numeroArriba(j) });
  if (avance >= 2) laterales.push({ lado: "abajo", j, n: numeroAbajo(j) });

  /** Las del eje: la 1 del arranque y una por cada unidad ya cerrada. */
  const ejes = [{ i: 0, n: 1 }];
  for (let k = 0; k < unidades; k++) ejes.push({ i: k + 1, n: numeroCierre(k) });
  if (avance >= 3) ejes.push({ i: j + 1, n: numeroCierre(j) });

  const Cuenta = ({ cx, cy, n, color }: { cx: number; cy: number; n: number; color: string }) => (
    <g>
      {resaltada(n) && <circle cx={cx} cy={cy} r={RADIO + 3.5} fill="none" stroke={ORO} strokeWidth="2" />}
      <circle cx={cx} cy={cy} r={RADIO} fill={color} stroke="#8b847a" strokeWidth="0.7" />
      <text
        x={cx}
        y={cy + 3.4}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="600"
        fill={tintaSobre(color)}
      >
        {n}
      </text>
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      role="img"
      aria-label={cuadro.titulo}
      className="h-auto w-full"
    >
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

      {laterales.map((l) => (
        <Cuenta
          key={`lat-${l.n}`}
          cx={x(2 * l.j + 1)}
          cy={yDe(l.lado)}
          n={l.n}
          color={cuenta(l.lado === "arriba" ? 1 : 2).color}
        />
      ))}

      {ejes.map((e) => (
        <Cuenta key={`eje-${e.n}`} cx={x(2 * e.i)} cy={medio} n={e.n} color={cuenta(0).color} />
      ))}

      {/* La ✕ del pliego: acá es donde los dos extremos se cruzan. */}
      {cruce && avance >= 3 && (
        <text
          x={x(2 * j + 2)}
          y={medio - RADIO - 7}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill={ORO}
        >
          ✕
        </text>
      )}

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
  );
}

/** Los pasos de una unidad, que es lo que se repite hasta el ancho de la fila. */
function cuadros(): Cuadro[] {
  const arribaPrimera = extremoEn("arriba", 0);
  const abajoPrimera = extremoEn("abajo", 0);

  return [
    {
      titulo: "1 · El hilo doblado",
      texto: (
        <>
          El hilo va <b>doblado al medio</b> y la cuenta <b>1</b> queda en el doblez.
          De ella salen los dos extremos: <Marca e="I" /> para un lado y{" "}
          <Marca e="II" /> para el otro. No hay un tercer cabo.
        </>
      ),
      unidades: 0,
      avance: 0,
      destacar: [1],
    },
    {
      titulo: "2 · Una cuenta con un extremo",
      texto: (
        <>
          Con <Marca e={arribaPrimera} />, el que va por arriba, se ensarta la
          cuenta <b>2</b>. El otro extremo todavía no se movió.
        </>
      ),
      unidades: 0,
      avance: 1,
      destacar: [numeroArriba(0)],
    },
    {
      titulo: "3 · Otra con el otro",
      texto: (
        <>
          Con <Marca e={abajoPrimera} />, el que va por abajo, se ensarta la
          cuenta <b>3</b>. Ahora cada extremo tiene una cuenta, una de cada lado.
        </>
      ),
      unidades: 0,
      avance: 2,
      destacar: [numeroAbajo(0)],
    },
    {
      titulo: "4 · Los dos en la misma cuenta",
      texto: (
        <>
          Los dos extremos entran en la cuenta <b>4</b>, pero{" "}
          <b>en direcciones opuestas</b>: <Marca e={arribaPrimera} /> desde arriba
          y <Marca e={abajoPrimera} /> desde abajo, cada uno por una punta del
          agujero. Ese cruce —la ✕ del pliego— es lo que traba la unidad.
        </>
      ),
      unidades: 0,
      avance: 3,
      destacar: [numeroCierre(0)],
      cruce: true,
    },
    {
      titulo: "5 · Salen cambiados de lado",
      texto: (
        <>
          Al salir de la <b>4</b>, <Marca e={arribaPrimera} /> sigue por abajo y{" "}
          <Marca e={abajoPrimera} /> por arriba. <b>Ninguno se queda de un solo
          lado</b>: alternan unidad por unidad. Por eso los dos caminos se cruzan
          en cada rombo.
        </>
      ),
      unidades: 1,
      avance: 0,
      destacar: [],
    },
    {
      titulo: "6 · Y se repite",
      texto: (
        <>
          La unidad que sigue es lo mismo: una cuenta con cada extremo —la{" "}
          <b>5</b> y la <b>6</b>— y las dos cruzando en la <b>7</b>. Así hasta
          llegar al ancho de la fila.
        </>
      ),
      unidades: 1,
      avance: 3,
      destacar: [numeroArriba(1), numeroAbajo(1), numeroCierre(1)],
      cruce: true,
    },
  ];
}

/** El nombre de un extremo, con su color: el mismo que lleva en el 3D. */
function Marca({ e }: { e: Extremo }) {
  return (
    <b style={{ color: e === "I" ? ORO : TINTA }}>{e}</b>
  );
}

/**
 * El punto, paso a paso, como en el pliego de `patrones/cruzado.md`: qué hace
 * cada extremo del hilo en cada momento y dónde entra.
 *
 * Cada cuadro dibuja **solo lo que ya está hecho**, y el recorrido de cada
 * extremo llega hasta la cuenta que tiene en la mano. Así se ve cuál de los dos
 * se movió y cuál está esperando — que es lo que un dibujo con los dos caminos
 * enteros no puede mostrar.
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
  const pasos = cuadros();

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-x-6 gap-y-5 ${compacto ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {pasos.map((cuadro) => (
          <figure key={cuadro.titulo} className="m-0 flex flex-col gap-1.5">
            <figcaption className="sobretitulo">{cuadro.titulo}</figcaption>
            <Dibujo cuadro={cuadro} paleta={paleta} />
            <p className="text-xs leading-relaxed text-humo">{cuadro.texto}</p>
          </figure>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-humo">
        <p>
          <b className="font-semibold text-tinta">{PUNTOS[punto].nombre}.</b>{" "}
          {PUNTOS[punto].comoVa}
        </p>
        <p>
          En el 3D los dos extremos salen de la última cuenta puesta con estos
          mismos colores: el dorado es <Marca e="I" /> y el oscuro,{" "}
          <Marca e="II" />.
        </p>
        <p>
          Al terminar, los dos extremos salen de la última cuenta. Se rematan con
          nudo doble y se esconden pasándolos por varias cuentas vecinas antes de
          cortar.
        </p>
      </div>
    </div>
  );
}
