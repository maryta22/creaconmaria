"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { CuentaPaleta } from "@/lib/cartera/modelos";
import { geometriaDeCuenta, materialDeCuenta } from "@/lib/cuenta3d";
import type { LayoutPulsera } from "@/lib/pulsera/geometria";
import { ALAMBRE_GANCHO, colorDeMetal, perfilDeGancho, type MetalCierre } from "@/lib/pulsera/cierre";

type Props = {
  /** Dónde va cada cuenta. Sale de `ubicacionesDePulsera()`, nunca de acá. */
  layout: LayoutPulsera;
  paleta: CuentaPaleta[];
  /** Si viene de un diseño guardado, reemplaza los colores del layout. */
  celdas?: number[];
  /** De qué metal son el broche y la cadena. Lo único que se elige de ellos. */
  cierre?: MetalCierre;
  autoGirar?: boolean;
  className?: string;
};

/**
 * **La pulsera se muestra cerrada, como se usa.** Lo pidió María: *"así planas
 * no, que sean bien bolitas y circulares"*.
 *
 * Se presentaba abierta y estirada, con una curva apenas insinuada, para que el
 * motivo se leyera entero. El costo era que no parecía una pulsera: parecía una
 * cinta. Y al entrar los veinte centímetros de largo en el ancho de una
 * tarjeta, cada cuenta quedaba de tres o cuatro píxeles y se perdía la bolita,
 * que es lo que se compra.
 *
 * Cerrada en aro, la misma tarjeta la muestra al triple de tamaño —el ancho ya
 * no es el largo de la pulsera sino su diámetro— y cada cuenta se ve redonda.
 * De la vuelta se lee poco más de la mitad, que es lo que se ve de una pulsera
 * puesta.
 *
 * **Acá no se calcula ninguna posición.** Una banda tejida y una cadena de
 * margaritas se arman distinto, y esa diferencia vive entera en
 * `src/lib/pulsera/geometria.ts`. El visor solo planta lo que le dan, igual que
 * `Cartera3D` con `armarLayout()`.
 */
export default function Pulsera3D({ layout, paleta, celdas, cierre = "dorado", autoGirar = false, className = "" }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const autoGirarRef = useRef(autoGirar);
  autoGirarRef.current = autoGirar;
  const ajustarGiro = useRef<((girar: boolean) => void) | null>(null);

  /**
   * La firma que decide si hay que rehacer la escena.
   *
   * **Cada posición pesa por su lugar en la lista.** Sumarlas a secas no
   * alcanzaba: en un aro casi cerrado las x y las z se cancelan entre sí, así
   * que **girar la pulsera entera daba exactamente la misma suma** y el visor
   * se quedaba con la escena vieja. Pasó al mover el cierre al fondo del aro:
   * el texto de al lado decía los números nuevos y el 3D seguía mostrando lo
   * de antes.
   */
  const firma = (puntos: { pos: readonly [number, number, number] }[]) =>
    puntos
      .reduce((suma, p, i) => suma + (i + 1) * (p.pos[0] + p.pos[1] * 3 + p.pos[2] * 7), 0)
      .toFixed(3);
  const firmaLayout = [
    layout.cuentas.length,
    layout.herrajes.length,
    layout.alcance.toFixed(3),
    layout.centro.map((v) => v.toFixed(3)).join(","),
    firma(layout.cuentas),
    firma(layout.herrajes),
  ].join(":");
  const firmaPaleta = JSON.stringify(paleta);
  const firmaCeldas = celdas?.join(",") ?? "";

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo || paleta.length === 0 || layout.cuentas.length === 0) return;

    const paletaActual: CuentaPaleta[] = JSON.parse(firmaPaleta);
    const { cuentas, tramos, herrajes, centro, alcance } = layout;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    nodo.appendChild(renderer.domElement);

    const escena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const cuarto = new RoomEnvironment();
    escena.environment = pmrem.fromScene(cuarto, 0.04).texture;
    cuarto.dispose();
    escena.add(new THREE.HemisphereLight(0xffffff, 0x17130f, 1.6));
    const luz = new THREE.DirectionalLight(0xfff5de, 3.1);
    luz.position.set(-3, 5, 7);
    escena.add(luz);
    const relleno = new THREE.DirectionalLight(0xd7e7ff, 1.05);
    relleno.position.set(4, 1, 4);
    escena.add(relleno);

    const camara = new THREE.PerspectiveCamera(34, 1, 0.05, 200);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enablePan = false;
    controles.minDistance = 2;
    controles.maxDistance = 200;
    controles.autoRotate = autoGirarRef.current;
    controles.autoRotateSpeed = 0.18;
    // Permite mirar también el canto y la cara inferior de la pulsera.
    controles.minPolarAngle = 0;
    controles.maxPolarAngle = Math.PI;
    const alEmpezarGiro = () => {
      controles.autoRotate = false;
      nodo.style.cursor = "grabbing";
    };
    const alTerminarGiro = () => { nodo.style.cursor = "grab"; };
    controles.addEventListener("start", alEmpezarGiro);
    controles.addEventListener("end", alTerminarGiro);
    ajustarGiro.current = (girar) => {
      controles.autoRotate = girar;
    };

    const mallas = paletaActual.map((cuenta) => {
      const malla = new THREE.InstancedMesh(geometriaDeCuenta(cuenta), materialDeCuenta(cuenta), cuentas.length);
      malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      malla.count = 0;
      malla.frustumCulled = false;
      escena.add(malla);
      return malla;
    });

    const transformacion = new THREE.Matrix4();
    const escala = new THREE.Vector3();
    const giro = new THREE.Quaternion();
    const arriba = new THREE.Vector3(0, 1, 0);
    const eje = new THREE.Vector3();
    const posicion = new THREE.Vector3();

    cuentas.forEach((cuenta, indice) => {
      const tono = Math.min(Math.max(celdas?.[indice] ?? cuenta.tono, 0), mallas.length - 1);
      posicion.set(cuenta.pos[0], cuenta.pos[1], cuenta.pos[2]);
      /**
       * Las rondelas son discos: se achatan **contra el hilo**, no contra el
       * eje del mundo. Por eso cada una trae hacia dónde va el hilo ahí.
       */
      if (cuenta.eje) {
        eje.set(cuenta.eje[0], cuenta.eje[1], cuenta.eje[2]).normalize();
        giro.setFromUnitVectors(arriba, eje);
        escala.set(cuenta.diametro, cuenta.diametro * (cuenta.achatado ?? 1), cuenta.diametro);
      } else {
        giro.identity();
        escala.setScalar(cuenta.diametro);
      }
      transformacion.compose(posicion, giro, escala);
      const malla = mallas[tono];
      malla.setMatrixAt(malla.count, transformacion);
      malla.count += 1;
    });
    mallas.forEach((malla) => {
      malla.instanceMatrix.needsUpdate = true;
      malla.computeBoundingSphere();
    });

    const hilos: number[] = [];
    tramos.forEach(({ a, b }) => hilos.push(a[0], a[1], a[2], b[0], b[1], b[2]));
    const geometriaHilo = new THREE.BufferGeometry();
    geometriaHilo.setAttribute("position", new THREE.Float32BufferAttribute(hilos, 3));
    const materialHilo = new THREE.LineBasicMaterial({ color: "#b7a994", transparent: true, opacity: 0.52 });
    const trama = new THREE.LineSegments(geometriaHilo, materialHilo);
    escena.add(trama);

    /**
     * **El broche y la cadena.** No son cuentas: no salen del stock y lo único
     * que se elige de ellos es el metal. Dónde va cada uno es geometría —sale
     * de `herrajesDeCierre()`— y acá solo se plantan, igual que los herrajes de
     * la cartera.
     *
     * Un `TorusGeometry` nace en el plano XY con el eje en +Z, así que hay que
     * girarlo hasta el eje que le toca. Los ejes vienen alternados desde la
     * geometría para que los eslabones se enganchen y no queden uno al lado del
     * otro.
     */
    const metal = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorDeMetal(cierre)),
      metalness: 1,
      roughness: 0.24,
    });
    const ejeX = new THREE.Vector3();
    const ejeY = new THREE.Vector3();
    const ejeZ = new THREE.Vector3();
    const base = new THREE.Matrix4();
    /** Solo la palanca es un cilindro macizo; el resto, anillos o el tubo de la gota. */
    const esCilindro = (clase: string) => clase === "palanca";
    /**
     * **El cuerpo del mosquetón es una gota, no un óvalo.** Se recorre su
     * contorno con un tubo de alambre, que es lo que se ve en una de verdad.
     * Estirando un anillo nunca se leyó: quedaba una argolla grande y nada más.
     * La curva viene de `perfilDeGancho()` con su medida puesta, así que esta no
     * se escala.
     */
    const curvaGancho = new THREE.CatmullRomCurve3(
      perfilDeGancho().map(([x, y]) => new THREE.Vector3(x, y, 0)),
      true,
      "centripetal",
    );
    const anillos = herrajes.map((herraje) => {
      /**
       * El eslabón es un **óvalo**: se estira en la dirección de la cadena, así
       * que el toro se escala en su X. El cilindro ya nace con su largo puesto
       * y se lo gira para que el eje quede en X, como el resto.
       */
      const geometria =
        herraje.clase === "cuerpo"
          ? new THREE.TubeGeometry(curvaGancho, 90, ALAMBRE_GANCHO, 8, true)
          : esCilindro(herraje.clase)
            ? new THREE.CylinderGeometry(herraje.radio, herraje.radio, herraje.alargue, 18).rotateZ(
                -Math.PI / 2,
              )
            : new THREE.TorusGeometry(herraje.radio, herraje.grosor, 8, 22);
      const malla = new THREE.Mesh(geometria, metal);
      ejeX.set(herraje.avance[0], herraje.avance[1], herraje.avance[2]).normalize();
      ejeZ.set(herraje.eje[0], herraje.eje[1], herraje.eje[2]).normalize();
      ejeY.crossVectors(ejeZ, ejeX).normalize();
      // El cilindro y la gota ya nacen con su medida; solo el anillo se estira.
      const estirar =
        esCilindro(herraje.clase) || herraje.clase === "cuerpo" ? 1 : herraje.alargue;
      base.makeBasis(ejeX.multiplyScalar(estirar), ejeY, ejeZ);
      base.setPosition(herraje.pos[0], herraje.pos[1], herraje.pos[2]);
      malla.matrixAutoUpdate = false;
      malla.matrix.copy(base);
      escena.add(malla);
      return geometria;
    });

    let encuadrada = false;
    function encuadrar() {
      if (!nodo) return;
      const { clientWidth, clientHeight } = nodo;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camara.aspect = clientWidth / clientHeight;
      camara.updateProjectionMatrix();
      // ResizeObserver ajusta el lienzo sin deshacer el giro o zoom del usuario.
      if (encuadrada) return;
      encuadrada = true;
      const fov = THREE.MathUtils.degToRad(camara.fov);
      // El 0,92 recorta apenas: la pieza llena la tarjeta sin comerse la cadena.
      const distancia = ((alcance / Math.sin(fov / 2)) / Math.min(1, camara.aspect)) * 0.92;
      // De tres cuartos y desde arriba: así el aro se lee como aro —una elipse—
      // y se le ve el ancho de la trama. De frente sería un anillo plano.
      //
      // **Se mira al centro de la pieza, no al del aro**: la cadena cuelga
      // afuera y apuntando al origen quedaba cortada abajo del cuadro.
      camara.position.set(
        centro[0] + distancia * 0.3,
        centro[1] + distancia * 0.62,
        centro[2] + distancia * 0.72,
      );
      controles.target.set(centro[0], centro[1], centro[2]);
      controles.update();
    }
    encuadrar();
    const observador = new ResizeObserver(encuadrar);
    observador.observe(nodo);

    let cuadro = 0;
    function dibujar() {
      cuadro = requestAnimationFrame(dibujar);
      controles.update();
      renderer.render(escena, camara);
    }
    dibujar();

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      ajustarGiro.current = null;
      controles.removeEventListener("start", alEmpezarGiro);
      controles.removeEventListener("end", alTerminarGiro);
      controles.dispose();
      geometriaHilo.dispose();
      materialHilo.dispose();
      anillos.forEach((g) => g.dispose());
      metal.dispose();
      mallas.forEach((malla) => {
        malla.geometry.dispose();
        (malla.material as THREE.Material).dispose();
      });
      pmrem.dispose();
      escena.environment?.dispose();
      renderer.dispose();
      nodo.removeChild(renderer.domElement);
    };
  }, [firmaCeldas, firmaLayout, firmaPaleta, layout, celdas, cierre, paleta.length]);

  useEffect(() => {
    ajustarGiro.current?.(autoGirar);
  }, [autoGirar]);

  return <div ref={contenedor} className={`relative ${className}`} style={{ cursor: "grab" }} />;
}
