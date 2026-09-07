/**
 * Rehace las fichas `.md` de todos los modelos de pulsera.
 *
 *   npm run fichas:pulseras
 *
 * **Ningún número de la ficha se escribe a mano** — misma regla que la skill
 * `/ficha-modelo` para las carteras. El conteo de cuentas, el largo real, el
 * ancho y la lista de compras salen de `ubicacionesDePulsera()`, que es lo
 * mismo que dibuja el visor 3D. Escritos a mano se desincronizan: las fichas
 * viejas seguían describiendo diez técnicas cuando en el código quedaban
 * cuatro.
 *
 * Borra las que sobran: una ficha de un modelo que ya no existe miente peor
 * que no tener ficha.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MODELOS_PULSERA, ubicacionesDePulsera, type ModeloPulsera } from "../src/lib/pulsera/modelos";
import { MATERIALES_CIERRE, METALES } from "../src/lib/pulsera/cierre";

const CARPETA = join(process.cwd(), "pulseras diseños", "modelos");
/** Añade fichas nuevas y actualiza el índice, conservando las existentes. */
const SOLO_NUEVAS = process.argv.includes("--solo-nuevas");

/** El pliego de punto del que sale cada construcción. */
const PLIEGOS: Record<string, string> = {
  raw: "../patrones/patron-cristal-cruzado.md",
  flores: "../patrones/patron%20pulsera%20flor.md",
};

function listaDeCompras(modelo: ModeloPulsera, celdas: number[]) {
  const total = new Array(modelo.paleta.length).fill(0);
  celdas.forEach((tono) => {
    if (tono >= 0 && tono < total.length) total[tono] += 1;
  });
  return modelo.paleta
    .map((cuenta, papel) => ({ cuenta, papel, cantidad: total[papel] }))
    .filter((fila) => fila.cantidad > 0);
}

function ficha(modelo: ModeloPulsera) {
  const layout = ubicacionesDePulsera(modelo, modelo.largoBaseCm);
  const compras = listaDeCompras(modelo, layout.cuentas.map((c) => c.tono));
  const pliego = PLIEGOS[modelo.armado];
  const largo = layout.largoCm.toFixed(1).replace(".", ",");
  const corto = (layout.largoCm - layout.ajusteCm).toFixed(1).replace(".", ",");
  const banda = modelo.armado === "trama" && modelo.matriz.filter((fila) => fila.some((tono) => tono >= 0)).length > 1;
  const modulo = banda ? `El módulo de cuentas se lee por filas; las columnas recorren el largo de la pulsera.
Cada número es un papel de la lista de compras y el punto es un espacio sin cuenta.
Las filas impares se desplazan medio paso en el visor.

\`\`\`text
${modelo.matriz.map((fila) => fila.map((tono) => tono < 0 ? "." : tono + 1).join(" ")).join("\n")}
\`\`\`

${modelo.nombresColor.map((nombre, i) => `${i + 1}. ${nombre}`).join("\n")}

Repetir el módulo completo a lo largo de la tira. Conectar las cuentas vecinas
de cada fila y las uniones entre filas; dejar libres los huecos del dibujo.
Rematar cada punta en su argolla y cerrar con las piezas de la lista.` : "";

  const filas = compras
    .map(
      ({ cuenta, papel, cantidad }) =>
        `| ${modelo.nombresColor[papel]} | ${cuenta.nombre} | ${cuenta.mm} mm | ${cuenta.acabado} | ${cantidad} |`,
    )
    .join("\n");

  return `---
modelo: ${modelo.nombre}
codigo: ${modelo.id}
categoria: PULSERA
tecnica: ${modelo.tecnica}
armado: ${modelo.armado}
construccion: ${modelo.construccion}
estado: propuesta de coleccion
---

# ${modelo.nombre}

${modelo.descripcion}

## La pieza

| | |
|---|---|
| Construcción | ${modelo.construccion} |
| Cierra entre | ${corto} y ${largo} cm |
| Ancho | ${modelo.anchoCm.toFixed(1).replace(".", ",")} cm |
| Cuentas | ${layout.cuentas.length} |
${modelo.armado === "flores" ? `| Flor | ${(layout as { petalos?: number }).petalos ?? "—"} pétalos |
| Flores | ${(layout as { flores?: number }).flores ?? "—"} |\n` : ""}
**El largo sale de la pieza, no al revés.** ${
    modelo.armado === "flores"
      ? "Una flor entra entera o no entra, así que la tira se arma con la primera que pase el largo pedido."
      : "La vuelta se completa con cuentas enteras, así que pasa apenas el largo pedido."
  } La cadena de extensión hace el resto: solo acorta, nunca alarga, y por eso
se redondea para arriba.

## El cierre

${MATERIALES_CIERRE.map((cosa) => `- ${cosa}`).join("\n")}

En ${METALES.map((m) => m.nombre.toLowerCase()).join(" o ")}, como lo pida la
clienta. No sale del stock de cuentas: va en el armado.

## Lista de compras

| Papel | Cuenta | Medida | Acabado | Cantidad |
|---|---|---|---|---:|
${filas}

**El tamaño de cada cuenta lo manda la técnica, no la clienta.** Se puede
cambiar el color; la medida no, porque de ella depende que la pieza cierre.

## Cómo se teje

${
  pliego
    ? `El punto está en el pliego de [${modelo.tecnica.toLowerCase()}](${pliego}). Ahí van los pasos, el orden de ensarte y las referencias de la técnica.`
    : modulo || "Una sola vuelta de cuentas ensartadas, sin motivo: el dibujo lo hace el orden de los colores."
}

## Medida sugerida

Cierra entre ${corto} y ${largo} cm. Confirmar con la clienta antes de tejer.
`;
}

/**
 * El README de la carpeta también sale del código: la tabla de técnicas decía
 * diez cuando quedaban cuatro, y el ancho de cada una era el de cuando todas
 * las colecciones eran de 4 mm.
 */
function readme() {
  const tecnicas = MODELOS_PULSERA;
  const filas = tecnicas
    .map((t) => {
      const medidas = [...new Set(t.paleta.map((c) => c.mm))].join(" y ");
      return `| ${t.tecnica} | ${t.armado} | ${t.construccion} | ${t.anchoCm.toFixed(1).replace(".", ",")} cm | ${medidas} mm |`;
    })
    .join("\n");

  return `# Colección de pulseras

**Esta carpeta la escribe \`npm run fichas:pulseras\`.** No la edites a mano: los
conteos, los largos y la lista de compras de cada ficha salen de
\`src/lib/pulsera/modelos.ts\`, que es lo mismo que dibuja el visor 3D. Escritos
a mano se desincronizan, y ya pasó: las fichas seguían describiendo diez
técnicas cuando en el código quedaban cuatro.

Son ${MODELOS_PULSERA.length} modelos, uno por tejido. **El color no hace modelo aparte**: un
modelo se muestra en la escala de grises de \`src/lib/cuentas-base.ts\` y el
color entra recién cuando alguien elige cuentas del stock. Cada modelo declara
**solo los papeles que usa**: una tira lisa tiene uno.

| Técnica | Armado | Construcción | Ancho | Cuenta |
|---|---|---|---:|---:|
${filas}

**\`armado\` identifica la construcción.** \`trama\` usa una cuadrícula;
\`flores\`, anillos de pétalos; y \`raw\`, unidades de cuatro cuentas que comparten
una unión. Cada construcción tiene su propia geometría.

## Al agregar un modelo

1. Agregar la técnica a \`TECNICAS\` en \`src/lib/pulsera/modelos.ts\`, con sus
   \`medidas\` —una por papel, y solo los que use— y su matriz o su flor.
2. Correr \`npm run fichas:pulseras\`.
3. El catálogo, el visor 3D y las indicaciones de María lo toman solos.
`;
}

/**
 * **Un modelo declara exactamente los papeles que usa.** Ni uno de menos —el
 * visor pintaría con un color que no existe— ni uno de más: un papel que no
 * pone ninguna cuenta sale en la pantalla de la clienta como "Sin uso · 0
 * cuentas" y le bloquea el pedido hasta que elige un color para nada.
 */
const mal: string[] = [];
for (const modelo of MODELOS_PULSERA) {
  const usados = new Set(ubicacionesDePulsera(modelo, modelo.largoBaseCm).cuentas.map((c) => c.tono));
  const sobran = modelo.paleta.map((_, papel) => papel).filter((papel) => !usados.has(papel));
  const faltan = [...usados].filter((papel) => papel >= modelo.paleta.length);
  if (sobran.length) mal.push(`${modelo.tecnica}: sobran los papeles ${sobran.join(", ")}`);
  if (faltan.length) mal.push(`${modelo.tecnica}: usa los papeles ${faltan.join(", ")} y no los declara`);
}

const generadas = new Set<string>();
mkdirSync(CARPETA, { recursive: true });

for (const modelo of MODELOS_PULSERA) {
  const archivo = modelo.ficha.split("/").pop();
  if (!archivo) continue;
  if (!SOLO_NUEVAS || !existsSync(join(CARPETA, archivo))) {
    writeFileSync(join(CARPETA, archivo), ficha(modelo), "utf8");
  }
  generadas.add(archivo);
}

let borradas = 0;
const quedaron: string[] = [];
for (const archivo of SOLO_NUEVAS ? [] : readdirSync(CARPETA)) {
  if (archivo === "README.md" || generadas.has(archivo)) continue;
  const ruta = join(CARPETA, archivo);
  rmSync(ruta, { force: true });
  // Se comprueba: borrar y confiar ya dejó cincuenta fichas de técnicas que no
  // existen conviviendo con las buenas, y el script decía que las había borrado.
  if (existsSync(ruta)) quedaron.push(archivo);
  else borradas += 1;
}

writeFileSync(join(CARPETA, "README.md"), readme(), "utf8");

console.log(`Listo: ${generadas.size} fichas al día, ${borradas} borradas por sobrar.`);
if (mal.length) {
  console.error(`Papeles mal declarados: ${mal.join(" · ")}`);
  process.exit(1);
}
if (quedaron.length) {
  console.error(`Sobran ${quedaron.length} y no se pudieron borrar: ${quedaron.join(", ")}`);
  process.exit(1);
}
