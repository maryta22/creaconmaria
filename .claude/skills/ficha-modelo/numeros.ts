/**
 * Los números de un modelo de cartera, sacados del código.
 *
 *   npx tsx .claude/skills/ficha-modelo/numeros.ts cartera-orca
 *
 * Todo lo que imprime está calculado desde `armarLayout()`, `motivoInicial()` y
 * `pasosDeArmado()`: es lo que la app dibuja de verdad. Escribir estos números
 * a mano en la ficha es como se desincronizan las dos cosas.
 */
import { armarLayout, armarHilos, esAsa, indiceEn, NOMBRE_PANEL } from "../../../src/lib/cartera/geometria";
import { pasosDeArmado } from "../../../src/lib/cartera/mapa";
import { MODELOS, modeloPorSlug, motivoInicial } from "../../../src/lib/cartera/modelos";

const slug = process.argv[2];
const modelo = slug ? modeloPorSlug(slug) : undefined;
if (!modelo) {
  console.error(`Pasá un slug. Los que hay: ${MODELOS.map((m) => m.slug).join(", ")}`);
  process.exit(1);
}

const layout = armarLayout(modelo.medidas);
const celdas = motivoInicial(modelo);
const letra = (i: number) => String.fromCharCode(65 + i);

console.log(`# ${modelo.nombre}  (${modelo.slug})`);
console.log(`ficha declarada: ${modelo.ficha}`);

console.log("\n## Medidas");
for (const [k, v] of Object.entries(modelo.medidas)) console.log(`  ${k}: ${v}`);
console.log(`  paso de la grilla: ${layout.paso} cm`);

console.log("\n## Piezas");
for (const r of layout.rejillas) {
  const forma = esAsa(r.panel) ? `${r.filas} vueltas × ${r.cols}` : `${r.filas} × ${r.cols}`;
  const hueco = r.total < r.filas * r.cols ? "  (con silueta: no es un rectángulo lleno)" : "";
  console.log(`  ${NOMBRE_PANEL[r.panel].padEnd(20)} ${forma.padEnd(18)} ${String(r.total).padStart(5)}${hueco}`);
}
console.log(`  ${"TOTAL".padEnd(20)} ${"".padEnd(18)} ${String(layout.cuentas.length).padStart(5)}`);

console.log("\n## Lista de compras");
for (const [i, p] of modelo.paleta.entries()) {
  const n = celdas.filter((x) => x === i).length;
  console.log(`  ${letra(i)}  ${p.nombre.padEnd(24)} ${String(n).padStart(5)}   ${p.color} ${p.acabado}`);
}

console.log("\n## Cuadrículas   (· = hueco de la silueta; la fila 0 es la de abajo)");
for (const r of layout.rejillas) {
  const usadas = new Set<number>();
  for (let f = 0; f < r.filas; f++)
    for (let c = 0; c < r.cols; c++) {
      const i = indiceEn(r, f, c);
      usadas.add(i < 0 ? -1 : celdas[i]);
    }
  // Una pieza de un solo color y sin huecos no aporta nada dibujada.
  if (usadas.size === 1 && !usadas.has(-1)) {
    console.log(`\n  ${NOMBRE_PANEL[r.panel]}: lisa, toda ${letra([...usadas][0])}`);
    continue;
  }
  console.log(`\n  ${NOMBRE_PANEL[r.panel]}  (${r.filas} × ${r.cols})`);
  for (let f = r.filas - 1; f >= 0; f--) {
    let linea = "";
    for (let c = 0; c < r.cols; c++) {
      const i = indiceEn(r, f, c);
      linea += i < 0 ? "·" : letra(celdas[i]);
    }
    console.log(`  ${String(f).padStart(3)} ${linea}`);
  }
}

console.log("\n## Armado   (sale de COSTURAS: no lo reescribas a mano)");
for (const [i, p] of pasosDeArmado(layout).entries()) {
  console.log(`  ${i + 1}. ${p.texto}`);
  if (p.union) console.log(`     ${p.union}`);
}

console.log("\n## Controles de geometría");
const d = modelo.medidas.cuentaMm / 10;
let asoma = 0;
for (const h of armarHilos(layout)) {
  const dist = Math.hypot(h.a.pos[0] - h.b.pos[0], h.a.pos[1] - h.b.pos[1], h.a.pos[2] - h.b.pos[2]);
  asoma = Math.max(asoma, dist - d);
}
const cs = layout.cuentas;
let encima = 0;
for (let i = 0; i < cs.length; i++) {
  for (let j = i + 1; j < cs.length; j++) {
    const dx = cs[i].pos[0] - cs[j].pos[0];
    if (Math.abs(dx) > d) continue;
    const dy = cs[i].pos[1] - cs[j].pos[1];
    if (Math.abs(dy) > d) continue;
    const dz = cs[i].pos[2] - cs[j].pos[2];
    if (Math.abs(dz) > d) continue;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < d - 1e-9) encima = Math.max(encima, d - dist);
  }
}
console.log(`  hilo a la vista:    hasta ${(asoma * 10).toFixed(1)} mm   (las cuentas van juntas: esto tiene que dar ~0)`);
console.log(`  cuentas encimadas:  hasta ${(encima * 10).toFixed(1)} mm   (una cuenta no se mete dentro de otra)`);
