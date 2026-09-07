"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { esAsa, loQueSeTeje, NOMBRE_PANEL, type LayoutCartera } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { PUNTO_DE } from "@/lib/cartera/punto";
import PuntoCruzado from "./PuntoCruzado";

/**
 * Cuentas por segundo a 1×. Es un ritmo fijo, no una duración: así 1× siempre
 * significa lo mismo y una cartera más grande simplemente tarda más. A este
 * ritmo se alcanza a ver cuenta por cuenta; 0,25× lo baja hasta poder seguirlo
 * con la aguja en la mano, y 2× lo apura.
 */
const POR_SEGUNDO = 3;

export type Tejido = ReturnType<typeof useTejido>;

/**
 * Reproduce el armado: va destapando las cuentas en el mismo orden en que se
 * tejen. `visibles` es `undefined` cuando se muestra la cartera terminada.
 */
export function useTejido(total: number) {
  const [visibles, setVisibles] = useState<number | undefined>(undefined);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  // El valor con decimales vive en un ref: el estado es solo para dibujar.
  const valor = useRef(0);

  useEffect(() => {
    if (!reproduciendo) return;
    let anterior = performance.now();
    let cuadro = 0;

    const paso = (ahora: number) => {
      // Si la pestaña estuvo en segundo plano, no saltamos medio tejido.
      const dt = Math.min((ahora - anterior) / 1000, 0.1);
      anterior = ahora;
      valor.current += POR_SEGUNDO * velocidad * dt;

      if (valor.current >= total) {
        valor.current = total;
        setVisibles(total);
        setReproduciendo(false);
        return;
      }
      setVisibles(valor.current);
      cuadro = requestAnimationFrame(paso);
    };

    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [reproduciendo, velocidad, total]);

  const irA = useCallback((n: number) => {
    valor.current = n;
    setVisibles(n);
    setReproduciendo(false);
  }, []);

  const alternar = useCallback(() => {
    setReproduciendo((antes) => {
      if (antes) return false;
      // Si ya terminó (o nunca arrancó), vuelve a empezar.
      if (valor.current >= total || valor.current <= 0) {
        valor.current = 0;
        setVisibles(0);
      }
      return true;
    });
  }, [total]);

  const verTerminada = useCallback(() => {
    setReproduciendo(false);
    valor.current = total;
    setVisibles(undefined);
  }, [total]);

  return { visibles, reproduciendo, velocidad, setVelocidad, irA, alternar, verTerminada, total };
}

const VELOCIDADES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** 0.5 -> "0,50"; los enteros van pelados: "1", "2". */
const etiquetaVelocidad = (v: number) =>
  new Intl.NumberFormat("es-EC", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
  }).format(v);

/** La barra de reproducción: play, línea de tiempo y salto a cada pieza. */
export function BarraTejido({
  tejido,
  layout,
  paleta,
  compacta = false,
}: {
  tejido: Tejido;
  layout: LayoutCartera;
  paleta: CuentaPaleta[];
  compacta?: boolean;
}) {
  const { visibles, reproduciendo, velocidad, setVelocidad, irA, alternar, verTerminada, total } =
    tejido;
  const enCurso = visibles !== undefined;
  // Se dibujan las cuentas con índice < visibles, así que con 7,4 hay **8**
  // puestas. Con floor decía una menos de las que se ven, y el cartel señalaba
  // la cuenta anterior a la de la labor.
  const puestas = Math.ceil(visibles ?? total);
  const donde = loQueSeTeje(layout, puestas);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={alternar} className="btn btn-chico">
          {reproduciendo ? "Pausar" : enCurso && puestas > 0 ? "Seguir" : "Ver cómo se teje"}
        </button>

        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={puestas}
          onChange={(e) => irA(Number(e.target.value))}
          aria-label="Avance del tejido"
          className="h-1 min-w-40 flex-1 cursor-pointer accent-oro"
        />

        {enCurso && (
          <button type="button" onClick={verTerminada} className="chip">
            Ver terminada
          </button>
        )}
      </div>

      {enCurso && (
        <>
          <p className="text-sm text-humo">
            Tejiendo <b className="text-tinta">{donde.nombre}</b>
            {esAsa(donde.panel) ? (
              <> · vuelta {donde.fila} de {donde.filas}</>
            ) : (
              <> · fila {donde.fila} de {donde.filas}, cuenta {donde.col} de {donde.cols}</>
            )}{" "}
            <span className="tabular-nums text-gris">
              ({puestas} de {total} cuentas)
            </span>
          </p>

          <p className="text-xs text-gris">
            En el 3D hay <b className="text-humo">un solo hilo</b>, con sus dos
            extremos: los que cuelgan juntos de donde va la labor —{" "}
            <b style={{ color: "#96742c" }}>I</b> y <b style={{ color: "#4a453e" }}>II</b>.
            El <b className="text-humo">aro dorado</b> no es un tercer cabo: solo marca
            la cuenta por donde se empezó la pieza. El doblez queda adentro del tejido.
          </p>

          {/* Qué punto se está haciendo ahora mismo */}
          <div className="border-t border-linea pt-3">
            <PuntoCruzado
              paleta={paleta}
              punto={PUNTO_DE[donde.panel]}
              compacto={compacta}
            />
          </div>

          {!compacta && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="sobretitulo mr-1">Ir a</span>
              {layout.rejillas.map((r) => (
                <button
                  key={r.panel}
                  type="button"
                  // +1: con la primera cuenta de la pieza ya puesta. Ir al
                  // índice pelado deja la pieza sin empezar y el cartel
                  // hablando de la anterior.
                  onClick={() => irA(r.desde + 1)}
                  className={donde.panel === r.panel ? "chip chip-oro" : "chip"}
                >
                  {NOMBRE_PANEL[r.panel]}
                </button>
              ))}

              <span className="ml-auto flex flex-wrap gap-1">
                {VELOCIDADES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVelocidad(v)}
                    className={velocidad === v ? "chip chip-oro" : "chip"}
                  >
                    {etiquetaVelocidad(v)}×
                  </button>
                ))}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
