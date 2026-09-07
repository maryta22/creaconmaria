"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { armarHilo, radioDeLargo } from "@/lib/hilo/geometria";
import { diametrosCm, MAX_CUENTAS, type CuentaHilo } from "@/lib/hilo/diseno";
import type { FormaHilo, TipoHilo } from "@/lib/hilo/tipos";
import { geometriaDeCuenta, materialDeCuenta } from "@/lib/cuenta3d";

type Props = {
  tipo: TipoHilo;
  paleta: CuentaHilo[];
  /** Índice de paleta de cada cuenta, en el orden en que se ensartan. */
  celdas: number[];
  /**
   * El largo con el que se encuadra la cámara. Va aparte del largo real a
   * propósito: si la cámara se recalculara con cada cuenta que se agrega,
   * saltaría en cada clic. Se mueve solo cuando cambia el objetivo.
   */
  encuadreCm: number;
  niveles?: number;
  /** Si es true, tocar una cuenta avisa por `onTocar`. */
  editable?: boolean;
  onTocar?: (indice: number) => void;
  autoGirar?: boolean;
  className?: string;
};

/** Una malla por entrada de paleta: cada color lleva su tamaño y su acabado. */
type MallaPaleta = {
  malla: THREE.InstancedMesh;
  /** instanceId → posición de la cuenta en la secuencia. */
  cuentas: number[];
};

/** Desde dónde se mira cada forma, que es como se fotografía cada pieza. */
const VISTA: Record<FormaHilo, { giro: number; altura: number }> = {
  /** La pulsera apoyada se mira desde arriba, en diagonal. */
  aro: { giro: 26, altura: 46 },
  /** El collar colgado, casi de frente. */
  curva: { giro: 12, altura: 8 },
  tira: { giro: 10, altura: 6 },
};

const CAMPO = 38;

export default function Hilo3D({
  tipo,
  paleta,
  celdas,
  encuadreCm,
  niveles = 1,
  editable = false,
  onTocar,
  autoGirar = false,
  className = "",
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  // Los callbacks y el patrón se leen por ref: cambian en cada render y no
  // pueden rehacer la escena entera.
  const alTocar = useRef(onTocar);
  alTocar.current = onTocar;
  const celdasRef = useRef(celdas);
  celdasRef.current = celdas;
  const encuadreRef = useRef(encuadreCm);
  encuadreRef.current = encuadreCm;
  const autoGirarRef = useRef(autoGirar);
  autoGirarRef.current = autoGirar;

  const reconstruir = useRef<((indices: number[]) => void) | null>(null);
  const encuadrar = useRef<((largoCm: number) => void) | null>(null);
  const ajustarGiro = useRef<((girar: boolean) => void) | null>(null);

  const firmaPaleta = JSON.stringify(paleta);
  const firmaTipo = tipo.slug;

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;

    const paletaActual: CuentaHilo[] = JSON.parse(firmaPaleta);
    if (paletaActual.length === 0) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    nodo.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const escena = new THREE.Scene();

    // Un cuarto virtual como entorno: sin él las cuentas doradas salen negras.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const cuarto = new RoomEnvironment();
    escena.environment = pmrem.fromScene(cuarto, 0.04).texture;
    cuarto.dispose();

    escena.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 1.1));
    const principal = new THREE.DirectionalLight(0xffffff, 2.2);
    principal.position.set(1.4, 2.2, 1.8);
    escena.add(principal);
    const relleno = new THREE.DirectionalLight(0xfff2df, 0.8);
    relleno.position.set(-1.6, 0.6, -1.2);
    escena.add(relleno);

    const camara = new THREE.PerspectiveCamera(CAMPO, 1, 0.05, 500);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enablePan = false;
    controles.autoRotate = autoGirarRef.current;
    controles.autoRotateSpeed = 0.9;

    // --- Las cuentas: una malla instanciada por color de la paleta ---
    const mallas: MallaPaleta[] = paletaActual.map((p) => {
      const malla = new THREE.InstancedMesh(geometriaDeCuenta(p), materialDeCuenta(p), MAX_CUENTAS * 3);
      malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      malla.count = 0;
      malla.frustumCulled = false;
      escena.add(malla);
      return { malla, cuentas: [] };
    });

    // --- El hilo: un cilindro por tramo, de centro a centro de cuenta ---
    // Adentro de la cuenta queda tapado y solo asoma en el hueco, que es
    // exactamente lo que pasa de verdad.
    const hiloGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const hiloMalla = new THREE.InstancedMesh(
      hiloGeo,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#9b9184"),
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
      MAX_CUENTAS * 3 + 6,
    );
    hiloMalla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    hiloMalla.count = 0;
    hiloMalla.frustumCulled = false;
    escena.add(hiloMalla);

    // --- El cierre: el broche de la pulsera o la argolla del colgador ---
    // Se dibuja con radio 1 y se escala, así cambiar las cuentas no obliga a
    // rehacer la geometría.
    const cierreGeo = new THREE.TorusGeometry(1, 0.2, 10, 40);
    const cierreMalla = new THREE.Mesh(
      cierreGeo,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#b08d3f"),
        metalness: 1,
        roughness: 0.28,
      }),
    );
    cierreMalla.frustumCulled = false;
    escena.add(cierreMalla);

    const matriz = new THREE.Matrix4();
    const posicion = new THREE.Vector3();
    const rotacion = new THREE.Quaternion();
    const escala = new THREE.Vector3();
    const desde = new THREE.Vector3();
    const hasta = new THREE.Vector3();
    const direccion = new THREE.Vector3();
    const arriba = new THREE.Vector3(0, 1, 0);
    const ejeAro = new THREE.Vector3(0, 0, 1);

    /**
     * Rehace la pieza entera. A diferencia de la cartera, acá **cambiar una
     * cuenta mueve a las que siguen**: si entra una de 10 mm donde había una
     * de 6, todo lo de atrás se corre. Son 200 cuentas como mucho, así que se
     * recalcula entero y no hace falta nada más fino.
     */
    function armar(indices: number[]) {
      // El recorte es el que fija la capacidad de las mallas instanciadas: de
      // ahí para arriba las cuentas no tendrían dónde entrar.
      const usados = indices
        .slice(0, MAX_CUENTAS)
        .map((i) => Math.min(Math.max(i, 0), mallas.length - 1));
      const layout = armarHilo(diametrosCm(paletaActual, usados), tipo);

      mallas.forEach((m) => {
        m.cuentas.length = 0;
        m.malla.count = 0;
      });

      rotacion.identity();
      for (let nivel = 0; nivel < niveles; nivel += 1) {
        const separacion = (nivel - (niveles - 1) / 2) * 0.95;
        layout.cuentas.forEach((cuenta, i) => {
          const destino = mallas[usados[(i + nivel) % usados.length]];
          const x = cuenta.pos[0] + (tipo.forma === "tira" ? separacion : 0);
          const y = cuenta.pos[1] + (tipo.forma === "aro" ? separacion : 0);
          const z = cuenta.pos[2] + (tipo.forma === "curva" ? separacion : 0);
          posicion.set(x, y, z);
          escala.setScalar(cuenta.diametro);
          matriz.compose(posicion, rotacion, escala);
          destino.malla.setMatrixAt(destino.malla.count, matriz);
          destino.cuentas.push(i);
          destino.malla.count += 1;
        });
      }
      mallas.forEach((m) => {
        m.malla.instanceMatrix.needsUpdate = true;
        m.malla.computeBoundingSphere();
      });

      // El hilo va más grueso que el nylon real a propósito: fiel a la escala
      // desaparece contra las perlas y no se ve de qué está colgando.
      const medio = layout.cuentas.length
        ? layout.cuentas.reduce((s, c) => s + c.diametro, 0) / layout.cuentas.length
        : 0.6;
      const grosor = medio * 0.075;

      layout.tramos.forEach((tramo, i) => {
        desde.set(tramo.a[0], tramo.a[1], tramo.a[2]);
        hasta.set(tramo.b[0], tramo.b[1], tramo.b[2]);
        direccion.subVectors(hasta, desde);
        const largo = direccion.length();
        if (largo === 0) return;
        posicion.addVectors(desde, hasta).multiplyScalar(0.5);
        rotacion.setFromUnitVectors(arriba, direccion.divideScalar(largo));
        escala.set(grosor, largo, grosor);
        matriz.compose(posicion, rotacion, escala);
        hiloMalla.setMatrixAt(i, matriz);
      });
      hiloMalla.count = layout.tramos.length;
      hiloMalla.instanceMatrix.needsUpdate = true;

      const c = layout.cierre;
      cierreMalla.position.set(c.pos[0], c.pos[1], c.pos[2]);
      direccion.set(c.eje[0], c.eje[1], c.eje[2]).normalize();
      cierreMalla.quaternion.setFromUnitVectors(ejeAro, direccion);
      cierreMalla.scale.setScalar(c.radio);
    }

    /**
     * La cámara se planta según el largo pedido, no según el que hay puesto:
     * así se puede pintar y agregar cuentas sin que la vista se mueva sola.
     */
    function plantarCamara(largoCm: number) {
      const radio = radioDeLargo(largoCm, tipo.forma) * 1.35 + 1;
      const distancia = radio / Math.sin((CAMPO / 2) * (Math.PI / 180));
      const centro = new THREE.Vector3(0, tipo.forma === "tira" ? -largoCm / 2 : 0, 0);

      const { giro, altura } = VISTA[tipo.forma];
      const a = THREE.MathUtils.degToRad(giro);
      const b = THREE.MathUtils.degToRad(altura);
      camara.position.set(
        centro.x + distancia * Math.cos(b) * Math.sin(a),
        centro.y + distancia * Math.sin(b),
        centro.z + distancia * Math.cos(b) * Math.cos(a),
      );
      controles.target.copy(centro);
      controles.minDistance = distancia * 0.3;
      controles.maxDistance = distancia * 2.4;
      controles.update();
    }

    armar(celdasRef.current);
    plantarCamara(encuadreRef.current);
    reconstruir.current = armar;
    encuadrar.current = plantarCamara;
    ajustarGiro.current = (girar) => {
      controles.autoRotate = girar;
    };

    // --- Tocar una cuenta. Un arrastre gira la cámara y no toca nada. ---
    const rayo = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let bajoEn: { x: number; y: number } | null = null;

    function alBajar(e: PointerEvent) {
      bajoEn = { x: e.clientX, y: e.clientY };
    }

    function alSubir(e: PointerEvent) {
      if (!bajoEn) return;
      const arrastre = Math.hypot(e.clientX - bajoEn.x, e.clientY - bajoEn.y);
      bajoEn = null;
      if (arrastre > 4 || !alTocar.current) return;

      const caja = renderer.domElement.getBoundingClientRect();
      puntero.x = ((e.clientX - caja.left) / caja.width) * 2 - 1;
      puntero.y = -((e.clientY - caja.top) / caja.height) * 2 + 1;
      rayo.setFromCamera(puntero, camara);
      const choques = rayo.intersectObjects(mallas.map((m) => m.malla), false);
      const primero = choques.find((ch) => ch.instanceId !== undefined);
      if (!primero) return;
      const grupo = mallas.find((m) => m.malla === primero.object);
      const cuenta = grupo?.cuentas[primero.instanceId!];
      if (cuenta !== undefined) alTocar.current(cuenta);
    }

    renderer.domElement.addEventListener("pointerdown", alBajar);
    renderer.domElement.addEventListener("pointerup", alSubir);

    // --- Tamaño y bucle ---
    function medir() {
      const { clientWidth, clientHeight } = nodo!;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camara.aspect = clientWidth / clientHeight;
      camara.updateProjectionMatrix();
    }
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);

    let animacion = 0;
    function dibujar() {
      animacion = requestAnimationFrame(dibujar);
      controles.update();
      renderer.render(escena, camara);
    }
    dibujar();

    return () => {
      cancelAnimationFrame(animacion);
      observador.disconnect();
      renderer.domElement.removeEventListener("pointerdown", alBajar);
      renderer.domElement.removeEventListener("pointerup", alSubir);
      reconstruir.current = null;
      encuadrar.current = null;
      ajustarGiro.current = null;
      controles.dispose();
      mallas.forEach((m) => {
        m.malla.geometry.dispose();
        (m.malla.material as THREE.Material).dispose();
      });
      (hiloMalla.material as THREE.Material).dispose();
      (cierreMalla.material as THREE.Material).dispose();
      hiloGeo.dispose();
      cierreGeo.dispose();
      pmrem.dispose();
      escena.environment?.dispose();
      renderer.dispose();
      nodo!.removeChild(renderer.domElement);
    };
    // `celdas` y `encuadreCm` no van acá: tienen su propio efecto, barato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaPaleta, firmaTipo, niveles]);

  // Repintado barato: cambió el patrón, se rehacen las matrices y nada más.
  useEffect(() => {
    reconstruir.current?.(celdas);
  }, [celdas]);

  useEffect(() => {
    encuadrar.current?.(encuadreCm);
  }, [encuadreCm]);

  useEffect(() => {
    ajustarGiro.current?.(autoGirar);
  }, [autoGirar]);

  return (
    <div
      ref={contenedor}
      className={`relative ${className}`}
      style={{ cursor: editable ? "crosshair" : "grab" }}
    />
  );
}
