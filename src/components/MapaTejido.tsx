import {
  armarHilos,
  esAsa,
  sentidoDeFila,
  type LayoutCartera,
} from "@/lib/cartera/geometria";
import PuntoCruzado from "./PuntoCruzado";
import { FICHA_DEL_PUNTO } from "@/lib/cartera/punto";
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import {
  armarMapa,
  LADO,
  letraDe,
  NOMBRE_CORTO,
  pasosDeArmado,
  tintaSobre,
  type PanelMapa,
} from "@/lib/cartera/mapa";

const CELDA = 30;
const MARGEN_IZQ = 38;
const MARGEN_SUP = 22;

/** Cuánto aire hay que dejar de cada lado para la marca de costura. */
const AIRE_COSTURA = 30;
/**
 * Arriba y a la izquierda, entre la rejilla y el corchete pasa la franja de
 * números de fila y de columna: el corchete arranca afuera de esa franja. A la
 * izquierda hace falta más aire porque las filas llegan a dos dígitos.
 */
const AIRE_NUMEROS_X = 30;
const AIRE_NUMEROS_Y = 22;

const ORO = "#96742c";

/**
 * Una pieza como cuadrícula. Cada círculo es una cuenta, dibujada al tamaño
 * que le toca, con la letra de su color adentro para que también se entienda
 * impreso en blanco y negro. Los corchetes dorados de los bordes dicen con qué
 * pieza se cose cada lado.
 */
function Cuadricula({
  panel,
  paleta,
  modo,
}: {
  panel: PanelMapa;
  paleta: CuentaPaleta[];
  /** `color` = qué cuenta va en cada lugar. `orden` = en qué orden se ensartan. */
  modo: "color" | "orden";
}) {
  const mmMaximo = Math.max(...paleta.map((p) => p.mm));
  const marcada = (n: number, total: number) => n === 1 || n === total || n % 5 === 0;

  // Las costuras solo van en la de colores: en la del orden estorban.
  const costuras = modo === "color" ? panel.costuras : [];
  const lados = new Set(costuras.map((c) => LADO[c.borde]));
  const ox = MARGEN_IZQ + (lados.has("izquierda") ? AIRE_COSTURA : 0);
  const oy = MARGEN_SUP + (lados.has("arriba") ? AIRE_COSTURA : 0);
  const anchoRejilla = panel.cols * CELDA;
  const altoRejilla = panel.filas * CELDA;
  // En la de orden va una flecha por fila a la derecha: hay que dejarle lugar
  // o el viewBox la corta.
  const aireFlecha = modo === "orden" ? 16 : 0;
  const ancho = ox + anchoRejilla + 6 + aireFlecha + (lados.has("derecha") ? AIRE_COSTURA : 0);
  const alto = oy + altoRejilla + 6 + (lados.has("abajo") ? AIRE_COSTURA : 0);

  /** El corchete dorado que marca un borde cosido, con el nombre de su pareja. */
  function Costura({ costura }: { costura: PanelMapa["costuras"][number] }) {
    const lado = LADO[costura.borde];
    const etiqueta = `↔ ${NOMBRE_CORTO[costura.con]}`;
    const comun = { stroke: ORO, strokeWidth: 2.5, strokeLinecap: "round" as const };
    const texto = { fill: ORO, fontSize: 11, fontWeight: 600 };

    if (lado === "abajo" || lado === "arriba") {
      const y = lado === "abajo" ? oy + altoRejilla + 9 : oy - AIRE_NUMEROS_Y;
      return (
        <g>
          <line x1={ox + 2} y1={y} x2={ox + anchoRejilla - 2} y2={y} {...comun} />
          <text
            x={ox + anchoRejilla / 2}
            y={lado === "abajo" ? y + 14 : y - 5}
            textAnchor="middle"
            {...texto}
          >
            {etiqueta}
          </text>
        </g>
      );
    }

    const x = lado === "izquierda" ? ox - AIRE_NUMEROS_X : ox + anchoRejilla + 9;
    const centroY = oy + altoRejilla / 2;
    const xTexto = lado === "izquierda" ? x - 5 : x + 14;
    return (
      <g>
        <line x1={x} y1={oy + 2} x2={x} y2={oy + altoRejilla - 2} {...comun} />
        <text
          x={xTexto}
          y={centroY}
          textAnchor="middle"
          transform={`rotate(${lado === "izquierda" ? -90 : 90} ${xTexto} ${centroY})`}
          {...texto}
        >
          {etiqueta}
        </text>
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho}
      height={alto}
      role="img"
      aria-label={`Cuadrícula de ${panel.nombre}: ${panel.cols} columnas por ${panel.filas} filas`}
      className="mx-auto block h-auto max-w-full"
    >
      {costuras.map((costura) => (
        <Costura key={`${costura.borde}-${costura.con}`} costura={costura} />
      ))}

      {/* Números de columna */}
      {Array.from({ length: panel.cols }, (_, c) =>
        marcada(c + 1, panel.cols) ? (
          <text
            key={`c${c}`}
            x={ox + c * CELDA + CELDA / 2}
            y={oy - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#8b847a"
          >
            {c + 1}
          </text>
        ) : null,
      )}

      {/* Filas, de abajo hacia arriba: la fila 1 es la primera que se teje */}
      {panel.celdas.map((fila, f) => {
        const y = oy + (panel.filas - 1 - f) * CELDA + CELDA / 2;
        return (
          <g key={f}>
            {marcada(f + 1, panel.filas) && (
              <text x={ox - 7} y={y + 4} textAnchor="end" fontSize="11" fill="#8b847a">
                {f + 1}
              </text>
            )}
            {/* En la de orden, hacia dónde va la fila. El hilo dobla en el
                borde: no se vuelve al otro lado de la pieza. */}
            {modo === "orden" && (
              <text x={ox + panel.cols * CELDA + 7} y={y + 4} fontSize="12" fill="#b08d3f">
                {sentidoDeFila(panel.serpentea, f) === "va" ? "→" : "←"}
              </text>
            )}
            {fila.map((indice, c) => {
              // -1 = hueco de la silueta: ahí no va cuenta ni número.
              if (indice < 0) return null;
              const cuenta = paleta[indice];
              // No escala desde cero: una cuenta de 4 mm quedaría tan chica que
              // no se le leería la letra, que es justo lo que hay que saber.
              const radio = (0.58 + 0.42 * (cuenta.mm / mmMaximo)) * (CELDA / 2 - 1.6);
              const x = ox + c * CELDA + CELDA / 2;
              // En la de orden la cuenta va en papel: lo que importa es el número.
              // Sale del layout, no de una fórmula: las filas impares vuelven
              // —el 1 de esa fila cae a la derecha— y una silueta además saltea
              // los huecos.
              const orden = panel.orden[f][c];
              const etiqueta = modo === "color" ? letraDe(indice) : String(orden);
              const primera = modo === "orden" && orden === 1;
              const chico = etiqueta.length > 2;
              return (
                <g key={c}>
                  <circle
                    cx={x}
                    cy={y}
                    r={radio}
                    fill={modo === "color" ? cuenta.color : "#f6f2ea"}
                    stroke={primera ? ORO : "#8b847a"}
                    strokeWidth={primera ? 1.8 : 0.5}
                  />
                  <text
                    x={x}
                    y={y + (radio > 10 && !chico ? 4.3 : 3.4)}
                    textAnchor="middle"
                    fontSize={chico ? "8" : radio > 10 ? "12" : "10"}
                    fill={modo === "color" ? tintaSobre(cuenta.color) : "#4a453e"}
                    fontWeight="600"
                  >
                    {etiqueta}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function MapaTejido({
  nombre,
  layout,
  celdas,
  paleta,
  ficha,
}: {
  nombre: string;
  layout: LayoutCartera;
  celdas: number[];
  paleta: CuentaPaleta[];
  ficha?: string | null;
}) {
  const mapa = armarMapa(layout, celdas, paleta);
  const { medidas } = layout;
  const tramosDeHilo = armarHilos(layout).length;

  return (
    <article className="mapa mx-auto w-full max-w-[88rem] bg-white p-8 text-tinta">
      {/* Cabecera */}
      <header className="border-b-2 border-tinta pb-5">
        <p className="sobretitulo">Mapa de tejido · Crea con María</p>
        <h1 className="titulo mt-2 text-4xl">{nombre}</h1>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {[
            ["Ancho", `${medidas.anchoCm} cm`],
            ["Alto", `${medidas.altoCm} cm`],
            ["Profundidad", `${medidas.profundidadCm} cm`],
            ["Caída de solapa", `${medidas.altoSolapaCm} cm`],
            ["Asa", `${medidas.asaCm} cm`],
            ["Cuenta principal", `${medidas.cuentaMm} mm`],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-xs uppercase tracking-[0.12em] text-gris">{etiqueta}</dt>
              <dd className="tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Lista de compras */}
      <section className="mt-8">
        <h2 className="titulo text-xl">Qué comprar</h2>
        <div className="filete mb-4 mt-2 max-w-[5rem]" />
        <table className="w-full border border-linea text-sm">
          <thead>
            <tr className="border-b border-linea text-left">
              {["", "Cuenta", "Tamaño", "Cantidad"].map((h) => (
                <th key={h} className="sobretitulo px-3 py-2 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-linea">
            {paleta.map((p, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gris text-xs font-semibold"
                    style={{ background: p.color, color: tintaSobre(p.color) }}
                  >
                    {letraDe(i)}
                  </span>
                </td>
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2 tabular-nums">{p.mm} mm</td>
                <td className="px-3 py-2 tabular-nums">{mapa.porColor[i]}</td>
              </tr>
            ))}
            <tr className="bg-hueso font-medium">
              <td className="px-3 py-2" />
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2 tabular-nums">{mapa.total}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gris">
          Más hilo nylon 0,6–0,7 mm (el patrón tiene {tramosDeHilo} tramos entre
          cuentas), el cierre, dos argollas y, si va, la cadena. Comprá siempre
          un poco de más: la tensión del hilo cambia el conteo.
        </p>
      </section>

      {/* El punto */}
      <section className="pieza mt-8">
        <h2 className="titulo text-xl">El punto</h2>
        <div className="filete mb-4 mt-2 max-w-[5rem]" />
        <PuntoCruzado paleta={paleta} punto="cruzadoPlano" />
        <p className="mt-3 text-xs text-gris">
          El pliego completo está en <code className="text-humo">{FICHA_DEL_PUNTO}</code>.
        </p>
      </section>

      {/* Orden de armado */}
      <section className="mt-8">
        <h2 className="titulo text-xl">Orden de armado</h2>
        <div className="filete mb-4 mt-2 max-w-[5rem]" />
        <ol className="flex flex-col divide-y divide-linea border-y border-linea text-sm">
          {pasosDeArmado(layout).map((paso, i) => (
            <li key={paso.texto} className="flex gap-3 py-2.5">
              <span className="tabular-nums text-oro">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-humo">{paso.texto}</span>
                {paso.union && (
                  <span className="text-xs text-tinta">
                    <b className="font-semibold">Se une:</b> {paso.union}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Una cuadrícula por pieza */}
      <section className="mt-10">
        <h2 className="titulo text-xl">Las piezas, cuenta por cuenta</h2>
        <div className="filete mb-2 mt-2 max-w-[5rem]" />
        <p className="mb-6 max-w-xl text-xs text-gris">
          Cada pieza va con <b className="text-tinta">dos cuadrículas</b>: una
          dice qué cuenta va en cada lugar —la letra es el color y el tamaño del
          círculo es el tamaño real— y la otra, en qué orden se ensartan. En las
          dos, la fila 1 es la primera que se teje y va abajo de todo.
        </p>

        <div className="flex flex-col gap-8">
          {mapa.paneles.map((panel) => (
            <div key={panel.panel} className="pieza border border-linea p-5">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="titulo text-lg">
                  <span className="mr-2 text-oro tabular-nums">
                    {String(panel.paso).padStart(2, "0")}
                  </span>
                  {panel.nombre}
                </h3>
                <p className="text-xs tabular-nums text-humo">
                  {panel.cols} columnas × {panel.filas} filas = {panel.total} cuentas
                </p>
              </div>

              <p className="mb-3 text-xs text-gris">{panel.orientacion}</p>

              <p className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-humo">
                {panel.porColor.map((cantidad, i) =>
                  cantidad > 0 ? (
                    <span key={i}>
                      <b className="font-semibold">{letraDe(i)}</b> {cantidad}
                    </span>
                  ) : null,
                )}
              </p>

              <div className="flex flex-col gap-5">
                <div>
                  <p className="sobretitulo mb-1.5">Colores · qué cuenta va en cada lugar</p>
                  <div className="overflow-x-auto">
                    <Cuadricula panel={panel} paleta={paleta} modo="color" />
                  </div>
                </div>

                <div>
                  <p className="sobretitulo mb-1.5">Orden · en qué secuencia se ensartan</p>
                  <div className="overflow-x-auto">
                    <Cuadricula panel={panel} paleta={paleta} modo="orden" />
                  </div>
                  <p className="mt-1.5 text-xs text-gris">
                    Se arranca en la <b className="text-humo">1</b> (marcada en oro), abajo
                    a la izquierda, y cada fila va de izquierda a derecha.
                  </p>
                </div>
              </div>

              {panel.costuras.length > 0 && (
                <div className="mt-4 border-t border-linea pt-3">
                  <p className="sobretitulo mb-2">Se une con</p>
                  <ul className="flex flex-col gap-1 text-xs">
                    {panel.costuras.map((costura) => (
                      <li key={`${costura.borde}-${costura.con}`} className="text-humo">
                        <b className="font-semibold text-tinta">{costura.bordeNombre}</b> va
                        con la <b className="font-semibold text-tinta">{costura.conBordeNombre}</b>{" "}
                        de {NOMBRE_CORTO[costura.con]}.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {esAsa(panel.panel) && (
                <p className="mt-4 border-t border-linea pt-3 text-xs text-humo">
                  {panel.panel === "asa"
                    ? "Las dos puntas se cosen con argollas a los costados del borde superior de la cartera, hacia adentro de las esquinas."
                    : "Las dos puntas se cosen con argollas a los costados de su propia cara. Las dos asas van una por cara, no cruzadas por el medio: entre ellas queda la boca."}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-linea pt-4 text-xs text-gris">
        Crea con María · mapa generado desde el patrón 3D
        {ficha ? ` · ficha original: ${ficha}` : ""}
      </footer>
    </article>
  );
}
