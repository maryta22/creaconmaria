"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  apareceEn,
  armarHilos,
  armarLayout,
  esAsa,
  indiceEn,
  ultimaPuesta,
  type LayoutCartera,
  type MedidasCartera,
} from "@/lib/cartera/geometria";
import { armarManiqui } from "@/lib/cartera/maniqui";
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { geometriaDeCuenta, materialDeCuenta } from "@/lib/cuenta3d";

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
  /** Pone el forro de tela: por dentro del cuerpo y debajo de la solapa. */
  mostrarForro?: boolean;
  /** Color del forro guardado en el patrón de esta cartera. */
  colorForro?: string;
  /**
   * Pone un maniquí de 1,60 m sosteniendo la cartera, para que se entienda el
   * tamaño. Ver [`maniqui.ts`](../lib/cartera/maniqui.ts).
   */
  conManiqui?: boolean;
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

export default function Cartera3D({
  medidas,
  paleta,
  celdas,
  editable = false,
  onPintar,
  autoGirar = false,
  mostrarHilo = true,
  mostrarForro = false,
  colorForro = "#e8a6b8",
  conManiqui = false,
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
  const forroRef = useRef(mostrarForro);
  forroRef.current = mostrarForro;
  const ajustarForro = useRef<((ver: boolean) => void) | null>(null);

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

    /**
     * **El maniquí no se mueve: se mueve alrededor de la cartera.** La cartera
     * ya está armada en el origen y todas sus mallas se agregan sueltas a la
     * escena; correrlas para colgarla de una mano sería tocar cada una. Al
     * revés es una sola resta: se traslada el maniquí hasta que su mano cae en
     * la parte de arriba del asa.
     */
    // El maniquí se arma sabiendo qué va a sostener: de ahí sale cuánto tiene
    // que separar el brazo para que la cartera no se meta en la falda.
    const maniqui = conManiqui ? armarManiqui(undefined, medidas.anchoCm / 2) : null;
    /** Lo que hay que soltar al desmontar: geometrías y el material del yeso. */
    const delManiqui: { dispose: () => void }[] = [];
    const corrimiento = maniqui
      ? new THREE.Vector3(-maniqui.mano[0], layout.altoTotal - maniqui.mano[1], -maniqui.mano[2])
      : new THREE.Vector3();

    if (maniqui) {
      /**
       * Tres tonos mate y nada más: piel de yeso, vestido y pelo. Es la regla,
       * no la pieza que se vende — si brilla o tiene color, compite.
       */
      const tonos = {
        cuerpo: new THREE.MeshStandardMaterial({ color: new THREE.Color("#cfc7b8"), roughness: 0.93, metalness: 0 }),
        // Los tres tonos van bien separados: con la luz del visor, dos grises
        // parecidos se lavan hasta el mismo blanco y el vestido desaparecía
        // contra el cuerpo. Es lo mismo que pasó con las cuentas base.
        vestido: new THREE.MeshStandardMaterial({ color: new THREE.Color("#6d675d"), roughness: 0.97, metalness: 0 }),
        pelo: new THREE.MeshStandardMaterial({ color: new THREE.Color("#3b342c"), roughness: 0.8, metalness: 0 }),
      };
      const arriba = new THREE.Vector3(0, 1, 0);
      const desde = new THREE.Vector3();
      const hasta = new THREE.Vector3();
      const medio = new THREE.Vector3();
      const eje = new THREE.Vector3();
      /** Cualquier pieza de punta a punta se planta igual: cambia la geometría. */
      const plantar = (
        a: readonly [number, number, number],
        b: readonly [number, number, number],
        geometria: THREE.BufferGeometry,
        material: THREE.Material,
      ) => {
        desde.set(a[0], a[1], a[2]).add(corrimiento);
        hasta.set(b[0], b[1], b[2]).add(corrimiento);
        eje.subVectors(hasta, desde);
        const pieza = new THREE.Mesh(geometria, material);
        pieza.position.copy(medio.addVectors(desde, hasta).multiplyScalar(0.5));
        pieza.quaternion.setFromUnitVectors(arriba, eje.normalize());
        escena.add(pieza);
        delManiqui.push(geometria);
      };

      const largoDe = (a: readonly number[], b: readonly number[]) =>
        Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

      for (const hueso of maniqui.huesos) {
        const largo = largoDe(hueso.desde, hueso.hasta);
        plantar(
          hueso.desde,
          hueso.hasta,
          new THREE.CapsuleGeometry(hueso.radio, Math.max(largo - hueso.radio * 2, 0.01), 4, 14),
          tonos[hueso.material ?? "cuerpo"],
        );
      }
      // La falda y el corpiño: un tubo del mismo grosor no es un vestido.
      for (const cono of maniqui.conos) {
        const largo = largoDe(cono.desde, cono.hasta);
        plantar(
          cono.desde,
          cono.hasta,
          new THREE.CylinderGeometry(cono.radioHasta, cono.radioDesde, largo, 26, 1, false),
          tonos[cono.material ?? "cuerpo"],
        );
      }

      const cabeza = new THREE.Mesh(new THREE.SphereGeometry(maniqui.cabeza.radio, 26, 20), tonos.cuerpo);
      cabeza.position
        .set(maniqui.cabeza.centro[0], maniqui.cabeza.centro[1], maniqui.cabeza.centro[2])
        .add(corrimiento);
      escena.add(cabeza);
      const pelo = new THREE.Mesh(new THREE.SphereGeometry(maniqui.pelo.radio, 26, 20), tonos.pelo);
      pelo.position
        .set(maniqui.pelo.centro[0], maniqui.pelo.centro[1], maniqui.pelo.centro[2])
        .add(corrimiento);
      escena.add(pelo);
      delManiqui.push(cabeza.geometry, pelo.geometry, tonos.cuerpo, tonos.vestido, tonos.pelo);
    }

    const CAMPO = 38;
    const camara = new THREE.PerspectiveCamera(CAMPO, 1, 0.1, 500);

    // El punto de mira incluye el asa para que no se recorte en el catálogo.
    // Con maniquí lo que hay que encuadrar es la persona entera.
    /**
     * **La protagonista es la cartera, no el maniquí.** Encuadrando la persona
     * entera la cartera quedaba del tamaño de una uña: se entendía la escala y
     * no se veía la pieza. Lo dijo María: *"que haga zoom a la parte de la
     * cartera"*.
     *
     * Así que la cámara mira a la cartera y abre lo justo para que entren la
     * mano, el brazo y un tramo de falda alrededor. Eso alcanza para medirla
     * contra un cuerpo, que es para lo que está la vista, y la cartera ocupa un
     * tercio del cuadro en vez de un veinteavo. Para ver a la persona entera,
     * se aleja con la rueda.
     */
    const alto = Math.max(layout.altoTotal, medidas.anchoCm);
    const centro = maniqui
      ? new THREE.Vector3(0, layout.altoTotal * 0.75, 0)
      : new THREE.Vector3(0, layout.altoTotal * 0.55, 0);
    const aEncuadrar = maniqui ? alto * 3.4 : alto * 1.35;
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
    const mallas: MallaPaleta[] = paletaActual.map((p) => {
      const material = materialDeCuenta(p);
      const malla = new THREE.InstancedMesh(geometriaDeCuenta(p), material, layout.cuentas.length);
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
    const grosor = (medidas.cuentaMm / 10) * 0.075;
    if (mostrarHilo) {
      const tramos = armarHilos(layout).sort((x, y) => apareceEn(x) - apareceEn(y));
      ordenHilo = tramos.map(apareceEn);
      // Un poco más grueso y más oscuro que el nylon real: si se dibuja fiel
      // (0,6 mm y translúcido) desaparece contra las perlas y no se ve el tejido.
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

    // --- El forro: la tela que va cosida por dentro ---
    // Se arma desde la **misma grilla de cada pieza**, corrida hacia adentro
    // medio diámetro. Así sigue la forma real —incluida la curva de la solapa,
    // que no es un plano— sin tener que describirla otra vez, y se asoma por
    // los huecos que dejan las cuentas al tocarse, como el forro de verdad.
    const forroMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorForro),
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const forros: THREE.Mesh[] = [];
    // Un punto bien adentro del cuerpo: sirve para saber de qué lado de cada
    // pieza cae el revés.
    const adentro = new THREE.Vector3(0, medidas.altoCm * 0.5, 0);
    const hundir = (medidas.cuentaMm / 10) * 0.5;

    for (const rejilla of layout.rejillas) {
      // El asa es un tubo macizo: no lleva forro.
      if (esAsa(rejilla.panel) || rejilla.filas < 2 || rejilla.cols < 2) continue;
      const { filas, cols } = rejilla;

      const acotar = (v: number, tope: number) => Math.min(Math.max(v, 0), tope - 1);
      /** La cuenta de esa celda, o `null` si es un hueco de la silueta. */
      const en = (f: number, c: number) => {
        const i = indiceEn(rejilla, acotar(f, filas), acotar(c, cols));
        return i < 0 ? null : layout.cuentas[i].pos;
      };

      const vertices = new Float32Array(filas * cols * 3);
      const largo = new THREE.Vector3();
      const ancho = new THREE.Vector3();
      const normal = new THREE.Vector3();
      const punto = new THREE.Vector3();
      const haciaAdentro = new THREE.Vector3();

      for (let f = 0; f < filas; f++) {
        for (let c = 0; c < cols; c++) {
          const aqui = en(f, c);
          if (!aqui) continue; // hueco de la silueta: no hay tela que colgar
          punto.set(aqui[0], aqui[1], aqui[2]);

          // Si el vecino es un hueco se usa la propia cuenta: en el borde de la
          // silueta la tela se apoya en lo que hay.
          const cx1 = en(f, c + 1) ?? aqui;
          const cx0 = en(f, c - 1) ?? aqui;
          ancho.set(cx1[0] - cx0[0], cx1[1] - cx0[1], cx1[2] - cx0[2]);
          const fy1 = en(f + 1, c) ?? aqui;
          const fy0 = en(f - 1, c) ?? aqui;
          largo.set(fy1[0] - fy0[0], fy1[1] - fy0[1], fy1[2] - fy0[2]);

          normal.crossVectors(largo, ancho);
          if (normal.lengthSq() < 1e-8) normal.set(0, 1, 0);
          normal.normalize();
          // El forro va del lado de adentro, no del que da a la calle.
          haciaAdentro.subVectors(adentro, punto);
          if (normal.dot(haciaAdentro) < 0) normal.negate();

          punto.addScaledVector(normal, hundir);
          const i = (f * cols + c) * 3;
          vertices[i] = punto.x;
          vertices[i + 1] = punto.y;
          vertices[i + 2] = punto.z;
        }
      }

      const caras: number[] = [];
      for (let f = 0; f < filas - 1; f++) {
        for (let c = 0; c < cols - 1; c++) {
          // Un cuadrado de tela solo existe si están sus cuatro esquinas.
          if (!en(f, c) || !en(f, c + 1) || !en(f + 1, c) || !en(f + 1, c + 1)) continue;
          const a = f * cols + c;
          const b = a + 1;
          const d = a + cols;
          const e = d + 1;
          caras.push(a, d, b, b, d, e);
        }
      }
      if (caras.length === 0) continue;

      const geometria = new THREE.BufferGeometry();
      geometria.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometria.setIndex(caras);
      geometria.computeVertexNormals();

      const tela = new THREE.Mesh(geometria, forroMaterial);
      tela.frustumCulled = false;
      tela.visible = forroRef.current;
      escena.add(tela);
      forros.push(tela);
    }

    ajustarForro.current = (ver) => {
      for (const tela of forros) tela.visible = ver;
    };

    // --- Los herrajes: los aros de acero y la cadena ---
    // No son cuentas y no entran en el patrón: son piezas compradas, como el
    // broche. Vienen ya ubicadas desde `armarLayout()` —dónde va cada aro y
    // por dónde pasa la cadena es geometría, no dibujo— y acá solo se plantan.
    const herrajes = layout.herrajes ?? [];
    const aceroMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#c2c7cd"),
      metalness: 1,
      roughness: 0.24,
    });
    const anillos: THREE.InstancedMesh[] = [];
    const anilloGeos: THREE.TorusGeometry[] = [];
    {
      // Un toro por medida: los aros son todos iguales entre sí y los
      // eslabones también, así que salen dos mallas instanciadas y nada más.
      const porMedida = new Map<string, typeof herrajes>();
      for (const h of herrajes) {
        const clave = `${h.radio}|${h.grosor}`;
        const lista = porMedida.get(clave) ?? [];
        lista.push(h);
        porMedida.set(clave, lista);
      }
      // El toro de three.js está en el plano XY, o sea con el eje en +Z: para
      // orientarlo alcanza con llevar ese +Z al eje que pide el herraje.
      const ejeToro = new THREE.Vector3(0, 0, 1);
      const hacia = new THREE.Vector3();
      for (const lista of porMedida.values()) {
        const geo = new THREE.TorusGeometry(lista[0].radio, lista[0].grosor, 10, 36);
        const malla = new THREE.InstancedMesh(geo, aceroMaterial, lista.length);
        malla.frustumCulled = false;
        lista.forEach((h, i) => {
          posicion.set(h.pos[0], h.pos[1], h.pos[2]);
          hacia.set(h.eje[0], h.eje[1], h.eje[2]).normalize();
          rotacion.setFromUnitVectors(ejeToro, hacia);
          escala.setScalar(1);
          matriz.compose(posicion, rotacion, escala);
          malla.setMatrixAt(i, matriz);
        });
        malla.instanceMatrix.needsUpdate = true;
        escena.add(malla);
        anillos.push(malla);
        anilloGeos.push(geo);
      }
      rotacion.identity();
    }

    /**
     * Los herrajes se ponen **al final**, como en los pasos de armado: primero
     * se teje todo y recién ahí se enganchan los aros y la cadena. Durante la
     * reproducción no están.
     */
    const verHerrajes = (n: number) => {
      const puesta = !Number.isFinite(n) || n >= layout.cuentas.length;
      for (const m of anillos) m.visible = puesta;
    };

    // --- Las puntas del hilo ---
    // Dos colgando de donde arrancó la pieza y dos de donde está la labor: son
    // los extremos I y II del diagrama del punto, para no perderlos de vista.
    const ORO = "#c9a227";
    const TINTA = "#3f3a33";
    const diametroCuenta = medidas.cuentaMm / 10;
    const largoPunta = diametroCuenta * 4.2;
    const grosorPunta = grosor * 2;
    const curvaPunta = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.22, 0.36, 0.06).multiplyScalar(largoPunta),
      new THREE.Vector3(0.46, 0.7, 0.02).multiplyScalar(largoPunta),
      new THREE.Vector3(0.58, 1, -0.06).multiplyScalar(largoPunta),
    ]);
    const puntaGeo = new THREE.TubeGeometry(curvaPunta, 22, grosorPunta, 8, false);
    const matPunta = {
      I: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(ORO), roughness: 0.45 }),
      II: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(TINTA), roughness: 0.5 }),
    };

    const nuevaPunta = (extremo: "I" | "II", espejo: boolean) => {
      const m = new THREE.Mesh(puntaGeo, matPunta[extremo]);
      m.scale.x = espejo ? -1 : 1;
      m.visible = false;
      m.frustumCulled = false;
      escena.add(m);
      return m;
    };
    const puntasLabor = [nuevaPunta("I", false), nuevaPunta("II", true)];

    // El hilo tiene dos extremos y son los dos de arriba. En el arranque no hay
    // un tercer cabo: hay el doblez, que queda dentro de la labor. Se marca con
    // un **aro** — forma de anillo, no de hilo, justamente para que no se
    // confunda con una punta suelta.
    const bucleGeo = new THREE.TorusGeometry(diametroCuenta * 1.05, grosorPunta * 0.9, 8, 32);
    const bucle = new THREE.Mesh(
      bucleGeo,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c9a227"),
        metalness: 0.6,
        roughness: 0.35,
      }),
    );
    bucle.visible = false;
    bucle.frustumCulled = false;
    escena.add(bucle);

    const porPanel = new Map(layout.rejillas.map((r) => [r.panel, r]));
    const arriba = new THREE.Vector3(0, 1, 0);
    const hacia = new THREE.Vector3();
    const giroPunta = new THREE.Quaternion();

    /** Hacia dónde asoma el hilo en esa cuenta: para afuera de la pieza y arriba. */
    function haciaAfuera(pos: [number, number, number]) {
      hacia.set(pos[0], 0, pos[2]);
      if (hacia.lengthSq() < 0.01) hacia.set(0, 0, 1);
      return hacia.normalize().multiplyScalar(0.65).add(arriba).normalize();
    }

    /** Planta los dos extremos en una cuenta. */
    function plantarPuntas(par: THREE.Mesh[], pos: [number, number, number]) {
      giroPunta.setFromUnitVectors(arriba, haciaAfuera(pos));
      for (const m of par) {
        m.position.set(pos[0], pos[1], pos[2]);
        m.quaternion.copy(giroPunta);
        m.visible = true;
      }
    }

    /** Dónde empezó la pieza y dónde va la labor, según cuántas cuentas hay. */
    function ubicarPuntas(n: number) {
      const enCurso = Number.isFinite(n) && n >= 1 && n < layout.cuentas.length;
      if (!enCurso) {
        puntasLabor.forEach((m) => (m.visible = false));
        bucle.visible = false;
        return;
      }
      // `limitar()` muestra las cuentas con índice < n, así que con n = 7,4
      // hay 8 puestas y la última es la 7: **ceil(n) - 1**, no floor(n) - 1.
      // La reproducción avanza con decimales, así que redondear distinto acá
      // dejaba los extremos una cuenta atrás de la labor.
      const ultima = layout.cuentas[Math.min(ultimaPuesta(n), layout.cuentas.length - 1)];
      const rejilla = porPanel.get(ultima.panel);
      plantarPuntas(puntasLabor, ultima.pos);

      if (rejilla) {
        const arranque = layout.cuentas[rejilla.desde].pos;
        bucle.position.set(arranque[0], arranque[1], arranque[2]);
        bucle.visible = true;
        // La orientación la pone el bucle de dibujo: el aro mira siempre a la
        // cámara. Apoyado contra la pieza se veía de canto y parecía un cabo.
      }
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
      ubicarPuntas(n);
      verHerrajes(n);
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
      // El aro de arranque es una marca, no una pieza: siempre de frente.
      if (bucle.visible) bucle.quaternion.copy(camara.quaternion);
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
      ajustarForro.current = null;
      controles.dispose();
      mallas.forEach((m) => {
        m.malla.geometry.dispose();
        (m.malla.material as THREE.Material).dispose();
      });
      if (hiloMalla) (hiloMalla.material as THREE.Material).dispose();
      hiloGeo?.dispose();
      puntaGeo.dispose();
      bucleGeo.dispose();
      (bucle.material as THREE.Material).dispose();
      matPunta.I.dispose();
      matPunta.II.dispose();
      forros.forEach((tela) => tela.geometry.dispose());
      forroMaterial.dispose();
      anilloGeos.forEach((g) => g.dispose());
      aceroMaterial.dispose();
      delManiqui.forEach((cosa) => cosa.dispose());
      pmrem.dispose();
      escena.environment?.dispose();
      renderer.dispose();
      nodo!.removeChild(renderer.domElement);
    };
    // `celdas` no va acá a propósito: pintar una cuenta no debe rehacer la escena.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaMedidas, firmaPaleta, mostrarHilo, colorForro, conManiqui]);

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

  // Poner o sacar el forro es cambiar una visibilidad: la tela ya está armada.
  useEffect(() => {
    ajustarForro.current?.(mostrarForro);
  }, [mostrarForro]);

  return (
    <div
      ref={contenedor}
      className={`relative ${className}`}
      style={{ cursor: editable ? "crosshair" : "grab" }}
    />
  );
}
