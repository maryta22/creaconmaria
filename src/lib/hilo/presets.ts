import { cuentasParaLargo, type CuentaHilo } from "./diseno";
import type { TipoHilo } from "./tipos";

export type PresetPulsera = { id: string; nombre: string; descripcion: string; largoCm: number; niveles: 1 | 2 | 3; patron: number; tecnica: string };

const COLECCIONES = ["Marfil", "Oro y negro", "Jardin", "Oceano", "Atardecer"];
const TECNICAS = [
  ["Flor de seis petalos", "flor"], ["Rombo cruzado", "rombo"], ["Espiga", "espiga"], ["Zigzag doble", "zigzag"], ["Estrella", "estrella"],
  ["Trebol", "trebol"], ["Ojo de cuenta", "ojo"], ["Abanico", "abanico"], ["Escalera", "escalera"], ["Panal", "panal"],
] as const;

export const PRESETS_PULSERA: PresetPulsera[] = Array.from({ length: 50 }, (_, indice) => {
  const patron = indice % TECNICAS.length;
  const coleccion = Math.floor(indice / TECNICAS.length);
  const [nombreTecnica, tecnica] = TECNICAS[patron];
  return { id: `pulsera-${coleccion + 1}-${patron + 1}`, nombre: `${nombreTecnica} ${COLECCIONES[coleccion]}`, descripcion: "Tejido de dos extremos", largoCm: [15, 17, 19][indice % 3], niveles: 1, patron, tecnica };
});

export function celdasDePreset(preset: PresetPulsera, paleta: CuentaHilo[], tipo: TipoHilo) {
  const cantidad = cuentasParaLargo(paleta[0]?.mm ?? 8, preset.largoCm, tipo);
  const colores = Math.max(1, Math.min(paleta.length, 4));
  const centro = Math.floor(cantidad / 2);
  return Array.from({ length: cantidad }, (_, i) => {
    if (colores === 1 || preset.patron === 0) return 0;
    if (preset.patron === 1) return i % colores;
    if (preset.patron === 2) return Math.floor(i / 2) % colores;
    if (preset.patron === 3) return Math.abs(i - centro) <= 1 ? colores - 1 : i % 2;
    if (preset.patron === 4) return Math.floor(i / 3) % colores;
    if (preset.patron === 5) return i % 4 === 0 ? colores - 1 : i % Math.min(colores, 2);
    if (preset.patron === 6) return i % 5 === 0 ? colores - 1 : 0;
    if (preset.patron === 7) return Math.floor(i / 4) % colores;
    if (preset.patron === 8) return (i + Math.floor(i / 3)) % colores;
    return Math.abs(i - centro) % 4 === 0 ? colores - 1 : (i + 1) % colores;
  });
}
