import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { datosDeCuenta } from "./cuentas";
import { geometriaDeCuenta, materialDeCuenta } from "./cuenta3d";
import { aPaleta, paletaGuardada } from "./hilo/diseno";
import { prisma } from "./prisma";
import { LLANAS } from "./cartera/llanas";
import { ESTAMPADOS } from "./cartera/estampados";
import { POST } from "../app/api/disenos-cartera/route";

const cristal = {
  id: "cristal-prueba", nombre: "Cristal facetado rubí", color: "#b92547",
  tamanoMm: 8, acabado: "cristal", precioUnidad: 0.1, stock: 5000, activo: true,
};

test("el inventario acepta cristal facetado y rechaza tipos desconocidos", () => {
  const resultado = datosDeCuenta(cristal);
  assert.ok("valores" in resultado);
  assert.equal(resultado.valores?.acabado, "cristal");
  assert.ok("error" in datosDeCuenta({ ...cristal, acabado: "desconocido" }));
});

test("el diseño de hilo conserva el cristal en la paleta guardada", () => {
  const guardada = paletaGuardada(JSON.stringify(aPaleta([cristal])));
  assert.equal(guardada[0].acabado, "cristal");
  assert.equal(guardada[0].mm, 8);
  assert.equal(guardada[0].precioUnidad, 0.1);
});

test("el bicono tiene extremos estrechos, caras planas y tamaño unitario", () => {
  const geometria = geometriaDeCuenta({ acabado: "cristal" });
  geometria.computeBoundingBox();
  const caja = geometria.boundingBox!;
  assert.ok(Math.abs(caja.max.y - caja.min.y - 1) < 1e-6);
  assert.ok(Math.abs(caja.max.x - caja.min.x - 1) < 1e-6);
  const posiciones = geometria.getAttribute("position");
  const normales = geometria.getAttribute("normal");
  for (let i = 0; i < posiciones.count; i++) {
    if (Math.abs(posiciones.getY(i)) > 0.49) {
      assert.ok(Math.hypot(posiciones.getX(i), posiciones.getZ(i)) < 0.09);
    }
  }
  for (let i = 0; i < normales.count; i += 3) {
    for (const eje of ["getX", "getY", "getZ"] as const) {
      assert.equal(normales[eje](i), normales[eje](i + 1));
      assert.equal(normales[eje](i), normales[eje](i + 2));
    }
  }
  geometria.dispose();
});

test("el cristal transmite luz y las perlas conservan su geometría redonda", () => {
  const cuenta = aPaleta([cristal])[0];
  const vidrio = materialDeCuenta(cuenta);
  const perla = materialDeCuenta({ ...cuenta, acabado: "perla" });
  const redonda = geometriaDeCuenta({ acabado: "perla" });
  assert.ok(vidrio.transmission > 0);
  assert.equal(vidrio.flatShading, true);
  assert.equal(perla.transmission, 0);
  assert.equal(redonda.type, "SphereGeometry");
  vidrio.dispose();
  perla.dispose();
  redonda.dispose();
});

test("la API guarda la cartera con cristal sin convertirlo en perla", async (t) => {
  let paleta = "";
  const findMany = prisma.cuentaStock.findMany;
  const create = prisma.disenoCartera.create;
  t.after(() => {
    Object.assign(prisma.cuentaStock, { findMany });
    Object.assign(prisma.disenoCartera, { create });
  });
  Object.assign(prisma.cuentaStock, { findMany: async () => [cristal] });
  Object.assign(prisma.disenoCartera, { create: async ({ data }: Prisma.DisenoCarteraCreateArgs) => {
    paleta = data.paleta;
    return { codigo: "TEST01", precio: data.precio };
  } });
  const respuesta = await POST(new Request("http://localhost/api/disenos-cartera", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llana: LLANAS[0].slug, estampado: ESTAMPADOS[0].slug,
      cuentas: Array(ESTAMPADOS[0].tonos).fill(cristal.id),
    }),
  }));
  assert.equal(respuesta.status, 200);
  const guardadas = JSON.parse(paleta);
  assert.ok(guardadas.length > 0);
  assert.ok(guardadas.every((c: { acabado: string }) => c.acabado === "cristal"));
});
