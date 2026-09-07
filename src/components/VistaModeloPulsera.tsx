import type { PresetPulsera } from "@/lib/hilo/presets";

const COLORES = ["#c7a600", "#15130f", "#f7f2ea", "#b68f26"];

export default function VistaModeloPulsera({ preset }: { preset: PresetPulsera }) {
  const puntos = patronDe(preset.tecnica);
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#4a402e_0%,#28221a_52%,#171411_100%)]">
      <div className="absolute inset-4 rounded-full border border-oro/20" />
      {puntos.map(([x, y, tono], indice) => <Cuenta key={indice} x={x} y={y} color={COLORES[(tono + preset.patron) % COLORES.length]} />)}
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/65">{preset.descripcion}</span>
    </div>
  );
}

function patronDe(tecnica: string): [number, number, number][] {
  const puntos: [number, number, number][] = [];
  const agregar = (x: number, y: number, tono = 0) => puntos.push([x, y, tono]);
  if (tecnica === "flor" || tecnica === "estrella" || tecnica === "trebol") {
    [22, 50, 78].forEach((x, flor) => {
      const lados = tecnica === "trebol" ? 3 : tecnica === "estrella" ? 5 : 6;
      for (let i = 0; i < lados; i++) { const a = i / lados * Math.PI * 2; agregar(x + Math.cos(a) * 5, 47 + Math.sin(a) * 10, i % 2); }
      agregar(x, 47, 2);
    });
  } else if (tecnica === "rombo" || tecnica === "panal") {
    for (let x = 16; x <= 84; x += 17) for (let y = 38; y <= 56; y += 9) agregar(x + (y === 47 ? 8 : 0), y, (x + y) % 3);
  } else if (tecnica === "espiga" || tecnica === "zigzag") {
    for (let i = 0; i < 16; i++) { agregar(12 + i * 5, 47 + (i % 2 ? -9 : 9), i % 3); agregar(12 + i * 5, 47, (i + 1) % 3); }
  } else if (tecnica === "abanico") {
    [20, 50, 80].forEach((x) => { for (let i = 0; i < 5; i++) { const a = Math.PI + i * Math.PI / 4; agregar(x + Math.cos(a) * 9, 51 + Math.sin(a) * 12, i); } agregar(x, 51, 2); });
  } else if (tecnica === "ojo") {
    [25, 50, 75].forEach((x) => { [[-8, 0], [-4, -7], [4, -7], [8, 0], [4, 7], [-4, 7], [0, 0]].forEach(([dx, dy], i) => agregar(x + dx, 47 + dy, i)); });
  } else {
    for (let x = 14; x <= 86; x += 8) { agregar(x, 39, 0); agregar(x, 47, 1); agregar(x, 55, 2); }
  }
  return puntos;
}

function Cuenta({ x, y, color }: { x: number; y: number; color: string }) {
  return <span className="absolute h-3.5 w-3.5 rounded-full border border-white/80 shadow-[0_2px_5px_rgba(0,0,0,0.45)]" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", background: `radial-gradient(circle at 30% 25%, #fff 0%, ${color} 35%, ${color} 100%)` }} />;
}
