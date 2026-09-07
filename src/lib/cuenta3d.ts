/**
 * El material de una cuenta en three.js. Lo comparten el 3D de las carteras y
 * el del diseñador del cliente: una perla marfil tiene que verse igual en los
 * dos lados, así que el brillo se define una sola vez y acá.
 */
import * as THREE from "three";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

/** Diámetro y largo unitarios: el visor los escala al tamaño de inventario. */
export function geometriaDeCuenta(p: Pick<CuentaPaleta, "acabado" | "forma">) {
  if (p.acabado !== "cristal" && p.forma !== "bicono") return new THREE.SphereGeometry(0.5, 24, 16);
  // Bicono de ocho caras por vuelta, con los extremos abiertos para el hilo.
  const base = new THREE.LatheGeometry([
    new THREE.Vector2(0.08, -0.5),
    new THREE.Vector2(0.22, -0.36),
    new THREE.Vector2(0.5, 0),
    new THREE.Vector2(0.22, 0.36),
    new THREE.Vector2(0.08, 0.5),
  ], 8);
  const geometria = base.toNonIndexed();
  base.dispose();
  geometria.computeVertexNormals();
  return geometria;
}

export function materialDeCuenta(p: CuentaPaleta) {
  const color = new THREE.Color(p.color);
  if (p.acabado === "cristal") {
    return new THREE.MeshPhysicalMaterial({
      color, metalness: 0, roughness: 0.08,
      transmission: 0.65, thickness: p.mm / 10, ior: 1.55,
      clearcoat: 1, clearcoatRoughness: 0.04, flatShading: true,
      side: THREE.DoubleSide,
    });
  }
  if (p.acabado === "metal") {
    return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.26 });
  }
  if (p.acabado === "mate") {
    return new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.85 });
  }
  // Perla: barniz encima de un núcleo claro, que es lo que le da el nácar.
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.05,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    sheen: 0.7,
    sheenColor: new THREE.Color("#ffffff"),
  });
}
