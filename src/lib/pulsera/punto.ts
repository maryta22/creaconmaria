/**
 * Qué punto lleva cada construcción de pulsera y cómo se teje, sacado de los
 * pliegos de `pulseras diseños/patrones/`.
 *
 * Es el hermano de `src/lib/cartera/punto.ts`: el pliego `.md` es la fuente y
 * acá vive lo que la pantalla necesita mostrar. **Si cambia el pliego, cambia
 * esto** — no al revés.
 *
 * Los pasos son los del pliego, uno por movimiento. No se resumen: María los
 * lee mientras teje, y un paso que junta dos movimientos es un paso que hay que
 * adivinar.
 */
import type { ArmadoPulsera } from "./modelos";

export type Punto = {
  nombre: string;
  /** El pliego del que sale, relativo a la raíz del repo. */
  pliego: string;
  /** El video de la técnica, si hay. */
  video?: string;
  /** Cómo se llama el video, para no mostrar una URL pelada. */
  videoNombre?: string;
  pasos: string[];
  tips: string[];
};

export const PUNTOS: Record<ArmadoPulsera, Punto> = {
  raw: {
    nombre: "Tejido cruzado con biconos (RAW)",
    pliego: "pulseras diseños/patrones/patron-cristal-cruzado.md",
    pasos: [
      "Formar una primera unidad con cuatro cristales: unión, lateral, unión y lateral. Cerrar el hilo en un anillo.",
      "Recorrer la unidad hasta salir por la unión desde la que continuará la tira.",
      "Añadir tres cristales y cerrar la nueva unidad atravesando de nuevo la unión compartida.",
      "Continuar con unidades completas y reforzar el recorrido. Rematar las puntas con el cierre elegido.",
    ],
    tips: [
      "Cada unidad nueva comparte una cuenta con la anterior: el total es tres veces las unidades más una.",
      "Esta versión utiliza biconos de 4 mm. Los colores pueden cambiar; el corte y el tamaño se conservan.",
      "Referencia técnica: diagrama Right Angle Weave de Artbeads; enlace en el pliego del patrón.",
    ],
  },
  flores: {
    nombre: "Flor con hilo de dos extremos",
    pliego: "pulseras diseños/patrones/patron pulsera flor.md",
    video: "https://www.youtube.com/watch?v=ZwnIj34sJ80",
    videoNombre: "Daisy Bracelet Tutorial w/ Accent",
    pasos: [
      "Ensartar media vuelta de pétalos y, al final, la cuenta del centro. El hilo queda con A saliendo por la izquierda y B por la derecha.",
      "Cerrar el anillo: pasar B de vuelta por el primer pétalo, en sentido contrario al que entró. Los dos extremos quedan saliendo de ahí.",
      "Queda armado: el primer pétalo a la izquierda, los demás girando por arriba y el centro en el medio. A sale hacia la izquierda y ahí se queda; B sale hacia abajo y sigue trabajando.",
      "Sumar los pétalos que faltan: con B, ensartarlos por debajo hasta completar la vuelta.",
      "Cerrar la flor: pasar B por el pétalo de la derecha. Los pétalos quedan rodeando al centro y B sale por arriba.",
      "El tramo de unión: con B, ensartar las cuentas que lleve —está en la lista de compras— y volver al paso 1 para la flor siguiente.",
      "Al llegar al largo, rematar las dos puntas en su argolla: de un lado el broche de mosquetón y del otro la cadena de extensión.",
    ],
    tips: [
      "A no se usa hasta el final. Dejalo largo: es el que remata la pulsera del lado del arranque.",
      "El largo se redondea para arriba: la cadena de extensión acorta, nunca alarga.",
      "La flor se cierra recién en el paso 5. Antes de eso el anillo queda flojo a propósito, para poder pasar la aguja.",
      "Cuando el tramo lleva un acento, va en el medio y nunca pegado a la flor: las rondelas hacen de tope y son las que le dan el filo dorado.",
      "Cuántos pétalos lleva la flor lo decide el tamaño del centro, no vos: los que entren tocándose alrededor. Con centro y pétalo iguales son seis; con un centro del doble, nueve.",
    ],
  },
  trama: {
    nombre: "Telar plano",
    pliego: "pulseras diseños/README.md",
    pasos: [
      "Ensartar la primera vuelta entera, midiendo contra la muñeca antes de rematar. No cierra sola: entre las dos puntas va el cierre.",
      "Las vueltas siguientes van encajadas en el hueco de la anterior, media cuenta corridas.",
      "Los colores se cuentan sobre la vuelta: el dibujo se repite hasta llegar al largo.",
      "Rematar las dos puntas en su argolla: de un lado el broche de mosquetón y del otro la cadena de extensión.",
    ],
    tips: [
      "Todas las cuentas de una trama miden lo mismo: es lo que hace que las vueltas encajen entre sí.",
    ],
  },
};

/** El id del video de YouTube, para poder incrustarlo sin salir del panel. */
export function idDeVideo(url: string | undefined) {
  if (!url) return null;
  const coincidencia = /[?&]v=([\w-]{6,20})/.exec(url) ?? /youtu\.be\/([\w-]{6,20})/.exec(url);
  return coincidencia?.[1] ?? null;
}
