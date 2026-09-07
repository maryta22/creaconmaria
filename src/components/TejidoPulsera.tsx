import type { CuentaHilo } from "@/lib/hilo/diseno";

export default function TejidoPulsera({ paleta, celdas }: { paleta: CuentaHilo[]; celdas: number[] }) {
  const color = (indice: number, alterno: string) => paleta[celdas[indice] ?? 0]?.color ?? alterno;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#211e19]">
      <div className="absolute inset-x-8 top-1/2 -translate-y-1/2">
        <div className="flex items-center justify-between gap-3">
          {Array.from({ length: 3 }, (_, flor) => {
            const base = flor * 10;
            return (
              <div key={flor} className="relative h-32 w-32 shrink-0">
                {Array.from({ length: 6 }, (_, petalo) => {
                  const angulo = (petalo / 6) * Math.PI * 2;
                  return <Cuenta key={petalo} x={50 + Math.cos(angulo) * 31} y={50 + Math.sin(angulo) * 31} color={color(base + petalo, "#f7f2ea")} />;
                })}
                <Cuenta x={50} y={50} color={color(base + 6, "#c7a600")} />
                {flor < 2 && <div className="absolute left-[107%] top-1/2 flex -translate-y-1/2 gap-1">{[7, 8, 9].map((cuenta) => <span key={cuenta} className="h-4 w-4 rounded-full border border-white/40" style={{ background: color(base + cuenta, "#15130f") }} />)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <p className="absolute bottom-5 left-0 right-0 text-center text-xs uppercase tracking-[0.16em] text-white/60">Flor de seis petalos · tejido de dos extremos</p>
    </div>
  );
}

function Cuenta({ x, y, color }: { x: number; y: number; color: string }) {
  return <span className="absolute h-6 w-6 rounded-full border border-white/60 shadow-lg" style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", background: `radial-gradient(circle at 30% 25%, #fff 0%, ${color} 38%, ${color} 100%)` }} />;
}
