"use client";

import { acabadoDeCuenta } from "@/lib/cuentas";
import { FORRO_BASE } from "@/lib/cuentas-base";
import { celdasEnOtraMedida } from "@/lib/cartera/medida";
import { useMemo, useState } from "react";
import FotoProducto from "./FotoProducto";
import Cartera3D from "./Cartera3D";
import { usePersonalizacionCartera } from "./SelectorCuentaCartera";
import type { MedidasCartera } from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

export type PatronVitrina = {
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  celdas: number[];
  totalCuentas: number;
  /** Sin dibujo: se muestra con la cuenta patrón hasta que se elige el color. */
  enGris: boolean;
};

export default function GaleriaPieza({
  nombre,
  fotos,
  patron,
}: {
  nombre: string;
  fotos: { id: string; url: string; alt: string | null }[];
  patron?: PatronVitrina | null;
}) {
  // Si todavía no hay fotos pero sí patrón, arranca mostrando el 3D.
  /**
   * **Tres vistas y una sola escena por vez.** *En persona* es el mismo visor
   * con el maniquí puesto: una cartera sola en el aire no tiene tamaño, y al
   * lado de alguien de 1,60 se entiende de una.
   */
  const [vista, setVista] = useState<"fotos" | "3d" | "persona">(
    patron && fotos.length === 0 ? "3d" : "fotos",
  );
  const [principal, setPrincipal] = useState(0);
  const personalizacion = usePersonalizacionCartera();
  /**
   * **Cambiar la medida de la cuenta cambia la pieza entera.** La misma cartera
   * de 18 cm lleva 23 columnas en 8 mm y 18 en 10: el conteo no es el mismo, así
   * que el dibujo se migra a la grilla nueva con `celdasEnOtraMedida()` en vez
   * de reusar las celdas guardadas, que quedarían corridas.
   */
  const tamanoMm = personalizacion?.tamanoMm ?? patron?.medidas.cuentaMm ?? 8;
  const medidas = useMemo(
    () => (patron ? { ...patron.medidas, cuentaMm: tamanoMm } : null),
    [patron, tamanoMm],
  );
  const celdas = useMemo(
    () => (patron ? celdasEnOtraMedida(patron.medidas, patron.celdas, tamanoMm) : []),
    [patron, tamanoMm],
  );

  const paleta = useMemo(() => {
    // La cartera se teje entera con la misma cuenta: la paleta toma esa medida.
    const base = (patron?.paleta ?? []).map((color) => ({ ...color, mm: tamanoMm }));
    const cuenta = personalizacion?.cuenta;
    if (!cuenta) return base;
    return base.map((color) => color.mm === cuenta.tamanoMm ? {
      ...color,
      nombre: cuenta.nombre,
      color: cuenta.color,
      acabado: acabadoDeCuenta(cuenta.acabado),
    } : color);
  }, [patron, personalizacion?.cuenta, tamanoMm]);

  /**
   * **El visor tiene que entrar en la pantalla.** Queda fijo mientras se
   * recorre la ficha, pero `sticky` no sirve de nada si el bloque es más alto
   * que la ventana: la cartera quedaba cortada abajo y solo se veía entera
   * bajando hasta el final. Lo dijo María: *"solo si bajo hasta el final puedo
   * ver la cartera"*.
   *
   * La primera vuelta se pasó para el otro lado: le puse tope al alto y la caja
   * quedó apaisada, con la cartera chiquita en el medio y negro a los costados.
   * Lo dijo María: *"tan pequeño el visor tampoco, ahí no puedo apreciar bien
   * la cartera"*.
   *
   * Lo que va es al revés: **el alto es todo lo que entra en la ventana y el
   * ancho lo sigue** por el 4:5, aunque sobre columna al costado. Así la
   * cartera se ve lo más grande posible y entera. En pantalla angosta no hay
   * columna al lado y la caja ocupa el ancho, como siempre.
   */
  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      {patron && (
        <div className="mb-3 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setVista("fotos")}
            className={vista === "fotos" ? "chip chip-oro" : "chip"}
          >
            Fotos
          </button>
          <button
            type="button"
            onClick={() => setVista("3d")}
            className={vista === "3d" ? "chip chip-oro" : "chip"}
          >
            Ver en 3D
          </button>
          <button
            type="button"
            onClick={() => setVista("persona")}
            className={vista === "persona" ? "chip chip-oro" : "chip"}
          >
            En persona
          </button>
        </div>
      )}

      <div
        className={`mx-auto aspect-[4/5] w-full overflow-hidden border border-linea lg:h-[calc(100vh-13rem)] lg:w-auto lg:max-w-full ${vista === "fotos" ? "bg-white" : "fondo-3d"}`}
      >
        {vista !== "fotos" && patron && medidas ? (
          <Cartera3D
            medidas={medidas}
            paleta={paleta}
            celdas={celdas}
            // Un modelo base va entero en gris, forro incluido: el forro de
            // fábrica es rosa y desentonaba con la cartera sin color.
            colorForro={patron.enGris && !personalizacion?.cuenta ? FORRO_BASE : undefined}
            conManiqui={vista === "persona"}
            // Con el maniquí no gira sola: la gracia es compararla con el
            // cuerpo, y girando cuesta medirla de un vistazo.
            autoGirar={vista === "3d"}
            // Al cliente se le muestra la pieza terminada: con su hilo y con el
            // forro puesto. Los interruptores son cosa del taller, no de acá.
            mostrarHilo
            mostrarForro
            className="h-full w-full"
          />
        ) : (
          <FotoProducto
            url={fotos[principal]?.url}
            alt={fotos[principal]?.alt}
            nombre={nombre}
          />
        )}
      </div>

      {vista !== "fotos" && patron ? (
        <p className="mt-3 shrink-0 text-xs text-gris">
          {vista === "persona" ? (
            <>Al lado de alguien de 1,60 m. Arrastrá para girar.</>
          ) : (
            <>
              Arrastrá para girarla. Está armada cuenta por cuenta:{" "}
              <span className="tabular-nums">{celdas.length}</span> cuentas de {tamanoMm} mm,
              tejidas en cruz.
            </>
          )}
        </p>
      ) : (
        fotos.length > 1 && (
          <div className="mt-3 grid shrink-0 grid-cols-4 gap-3">
            {fotos.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPrincipal(i)}
                className={`aspect-square overflow-hidden border bg-white ${
                  i === principal ? "border-oro" : "border-linea"
                }`}
              >
                <FotoProducto url={f.url} alt={f.alt} nombre={nombre} />
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}
