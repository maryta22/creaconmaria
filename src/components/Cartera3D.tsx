"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  apareceEn,
  armarHilos,
  armarLayout,
  type LayoutCartera,
  type MedidasCartera,
} from "@/lib/cartera/geometria";
import type { CuentaPaleta } from "@/lib/cartera/modelos";

type Props = {
  medidas: MedidasCartera;
  paleta: CuentaPaleta[];
  /** Índice de paleta de cada cuenta, en el orden de `armarLayout()`. */
  celdas: number[];
  /** Si es true, al hacer clic sobre una cuenta se avisa por `onPintar`. */
  editable?: boolean;
  onPintar?: (indiceCuenta: number) => void;
  /** Gira sola, para la vitrina del cliente. */
  autoGirar?: boolean;
  /** Dibuja el hilo nylon que pasa de cuenta a cuenta. */
  mostrarHilo?: boolean;
  /**
   * Cuántas cuentas mostrar, en el orden en que se tejen. `undefined` = todas.
   * Con esto se reproduce el armado sin recalcular la escena.
   */
  cuentasVisibles?: number;
  className?: string;
};

/** Una malla por entrada de paleta: así cada color lleva su tamaño y acabado. */
type MallaPaleta = {
  malla: THREE.InstancedMesh;
  /** instanceId → índice de la cuenta en el layout. */
  cuentas: number[];
};

function materialDe(p: CuentaPaleta) {
  const color = new THREE.Color(p.color);
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

export default function Cartera3D({
  medidas,
  paleta,
  celdas,
  editable = false,
  onPintar,
  autoGirar = false,
  mostrarHilo = true,
  cuentasVisibles,
  className = "",
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  // El callback puede cambiar en cada render; lo leemos por ref para no
  // reconstruir la escena entera cada vez.
  const alPintar = useRef(onPintar);
  alPintar.current = onPintar;
  // Igual con el patrón: la escena lo lee por ref y solo repinta.
  const celdasRef = useRef(celdas);
  celdasRef.current = celdas;
  const visiblesRef = useRef(cuentasVisibles);
  visiblesRef.current = cuentasVisibles;
  const autoGirarRef = useRef(autoGirar);
  autoGirarRef.current = autoGirar;
  const refrescarColores = useRef<(() => void) | null>(null);
  const mostrarHasta = useRef<((n: number) => void) | null>(null);
  const ajustarGiro = useRef<((girar: boolean) => void) | null>(null);

  // --- Escena. Se rehace solo si cambian las medidas o la paleta. ---
  const firmaMedidas = JSON.stringify(medidas);
  const firmaPaleta = JSON.stringify(paleta);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;

    const layout: LayoutCartera = armarLayout(medidas);
    const paletaActual: CuentaPaleta[] = JSON.parse(firmaPaleta);

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

    const CAMPO = 38;
    const camara = new THREE.PerspectiveCamera(CAMPO, 1, 0.1, 500);

    // Encuadre: la distancia contempla el asa, pero la mira va al cuerpo. Si se
    // apunta al centro de todo, el asa tira la cartera para abajo del cuadro —
    // y durante la reproducción del tejido, que empieza por la base, peor.
    const centro = new THREE.Vector3(
      0,
      Math.min(layout.altoTotal * 0.45, medidas.altoCm * 0.6),
      0,
    );
    const aEncuadrar = Math.max(layout.altoTotal, medidas.anchoCm) * 1.35;
    const distancia = aEncuadrar / 2 / Math.tan((CAMPO / 2) * (Math.PI / 180));

    // Tres cuartos y un poco desde arriba, que es como se fotografía un bolso.
    const giro = THREE.MathUtils.degToRad(38);
    const alturaVista = THREE.MathUtils.degToRad(16);
    camara.position.set(
      distancia * Math.cos(alturaVista) * Math.sin(giro),
      centro.y + distancia * Math.sin(alturaVista),
      distancia * Math.cos(alturaVista) * Math.cos(giro),
    );

    const controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enablePan = false;
    controles.minDistance = distancia * 0.35;
    controles.maxDistance = distancia * 2.2;
    controles.autoRotate = autoGirarRef.current;
    controles.autoRotateSpeed = 0.8;
    ajustarGiro.current = (girar) => {
      controles.autoRotate = girar;
    };
    controles.target.copy(centro);
    controles.update();

    // --- Una malla instanciada por color de la paleta ---
    const esfera = new THREE.SphereGeometry(0.5, 20, 14);
    const mallas: MallaPaleta[] = paletaActual.map((p) => {
      const material = materialDe(p);
      const malla = new THREE.InstancedMesh(esfera, material, layout.cuentas.length);
      malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      malla.count = 0;
      malla.frustumCulled = false;
      escena.add(malla);
      return { malla, cuentas: [] };
    });

    const matriz = new THREE.Matrix4();
    const posicion = new THREE.Vector3();
    const rotacion = new THREE.Quaternion();
    const escala = new THREE.Vector3();

    // --- El hilo nylon que pasa de cuenta a cuenta ---
    // Cada tramo es un cilindro entre dos centros: dentro de la cuenta queda
    // tapado y solo se ve en el hueco, que es exactamente lo que pasa de verdad.
    let hiloMalla: THREE.InstancedMesh | null = null;
    let hiloGeo: THREE.CylinderGeometry | null = null;
    let ordenHilo: number[] = [];
    if (mostrarHilo) {
      const tramos = armarHilos(layout).sort((x, y) => apareceEn(x) - apareceEn(y));
      ordenHilo = tramos.map(apareceEn);
      // Un poco más grueso y más oscuro que el nylon real: si se dibuja fiel
      // (0,6 mm y translúcido) desaparece contra las perlas y no se ve el tejido.
      const grosor = (medidas.cuentaMm / 10) * 0.075;
      hiloGeo = new THREE.CylinderGeometry(grosor, grosor, 1, 5, 1, true);
      const hiloMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#9b9184"),
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      hiloMalla = new THREE.InstancedMesh(hiloGeo, hiloMaterial, tramos.length);
      hiloMalla.frustumCulled = false;

      const desde = new THREE.Vector3();
      const hasta = new THREE.Vector3();
      const direccion = new THREE.Vector3();
      const arriba = new THREE.Vector3(0, 1, 0);

      tramos.forEach((tramo, i) => {
        desde.set(...tramo.a.pos);
        hasta.set(...tramo.b.pos);
        direccion.subVectors(hasta, desde);
        const largo = direccion.length();
        if (largo === 0) return;

        posicion.addVectors(desde, hasta).multiplyScalar(0.5);
        rotacion.setFromUnitVectors(arriba, direccion.divideScalar(largo));
        escala.set(1, largo, 1);
        matriz.compose(posicion, rotacion, escala);
        hiloMalla!.setMatrixAt(i, matriz);
      });
      hiloMalla.instanceMatrix.needsUpdate = true;
      escena.add(hiloMalla);
      rotacion.identity();
    }

    /** Hasta qué cuenta se está mostrando. Infinity = la cartera terminada. */
    let limite = Infinity;

    /** Reparte las cuentas entre las mallas según el patrón actual. */
    function reconstruir(indices: number[]) {
      mallas.forEach((m) => {
        m.cuentas.length = 0;
        m.malla.count = 0;
      });

      layout.cuentas.forEach((cuenta, i) => {
        const entrada = Math.min(Math.max(indices[i] ?? 0, 0), mallas.length - 1);
        const destino = mallas[entrada];
        const diametro = (paletaActual[entrada]?.mm ?? 10) / 10;

        posicion.set(cuenta.pos[0], cuenta.pos[1], cuenta.pos[2]);
        escala.setScalar(diametro);
        matriz.compose(posicion, rotacion, escala);
        destino.malla.setMatrixAt(destino.malla.count, matriz);
        destino.cuentas.push(i);
        destino.malla.count += 1;
      });

      mallas.forEach((m) => {
        m.malla.instanceMatrix.needsUpdate = true;
        m.malla.computeBoundingSphere();
      });

      limitar(limite);
    }

    /** Cuántos elementos de un array ascendente son menores que `n`. */
    function prefijo(ordenados: number[], n: number) {
      let bajo = 0;
      let alto = ordenados.length;
      while (bajo < alto) {
        const medio = (bajo + alto) >> 1;
        if (ordenados[medio] < n) bajo = medio + 1;
        else alto = medio;
      }
      return bajo;
    }

    /**
     * Muestra solo las primeras `n` cuentas, que es como reproducir el tejido:
     * las matrices ya están cargadas, así que alcanza con recortar el `count`
     * de cada malla. Los índices vienen ordenados, así que es una búsqueda
     * binaria por cuadro y nada más.
     */
    function limitar(n: number) {
      limite = n;
      for (const m of mallas) m.malla.count = prefijo(m.cuentas, n);
      if (hiloMalla) hiloMalla.count = prefijo(ordenHilo, n);
    }

    reconstruir(celdasRef.current);
    limitar(visiblesRef.current ?? Infinity);
    refrescarColores.current = () => reconstruir(celdasRef.current);
    mostrarHasta.current = limitar;

    // --- Clic para pintar. Un arrastre gira la cámara y no pinta. ---
    const rayo = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    let bajoEn: { x: number; y: number } | null = null;

    function aCoordenadas(e: PointerEvent) {
      const caja = renderer.domElement.getBoundingClientRect();
      puntero.x = ((e.clientX - caja.left) / caja.width) * 2 - 1;
      puntero.y = -((e.clientY - caja.top) / caja.height) * 2 + 1;
    }

    function alBajar(e: PointerEvent) {
      bajoEn = { x: e.clientX, y: e.clientY };
    }

    function alSubir(e: PointerEvent) {
      if (!bajoEn) return;
      const arrastre = Math.hypot(e.clientX - bajoEn.x, e.clientY - bajoEn.y);
      bajoEn = null;
      if (arrastre > 4 || !alPintar.current) return;

      aCoordenadas(e);
      rayo.setFromCamera(puntero, camara);
      const choques = rayo.intersectObjects(mallas.map((m) => m.malla), false);
      const primero = choques.find((ch) => ch.instanceId !== undefined);
      if (!primero) return;

      const grupo = mallas.find((m) => m.malla === primero.object);
      const indiceCuenta = grupo?.cuentas[primero.instanceId!];
      if (indiceCuenta !== undefined) alPintar.current(indiceCuenta);
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
      refrescarColores.current = null;
      mostrarHasta.current = null;
      ajustarGiro.current = null;
      controles.dispose();
      mallas.forEach((m) => {
        m.malla.geometry.dispose();
        (m.malla.material as THREE.Material).dispose();
      });
      if (hiloMalla) (hiloMalla.material as THREE.Material).dispose();
      hiloGeo?.dispose();
      esfera.dispose();
      pmrem.dispose();
      escena.environment?.dispose();
      renderer.dispose();
      nodo!.removeChild(renderer.domElement);
    };
    // `celdas` no va acá a propósito: pintar una cuenta no debe rehacer la escena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaMedidas, firmaPaleta, mostrarHilo]);

  // Repintado barato cuando cambia el patrón.
  useEffect(() => {
    refrescarColores.current?.();
  }, [celdas]);

  // Avance de la reproducción del tejido.
  useEffect(() => {
    mostrarHasta.current?.(cuentasVisibles ?? Infinity);
  }, [cuentasVisibles]);

  // Prender o apagar el giro solo no justifica rehacer la escena.
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
