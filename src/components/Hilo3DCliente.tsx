"use client";

import dynamic from "next/dynamic";

/**
 * El visor 3D, cargado **solo en el navegador**.
 *
 * Renderizarlo en el servidor no aporta nada: sin DOM no hay canvas, así que
 * lo único que se gana es meter todo three.js en el módulo del servidor y
 * pagarlo en cada request. Por acá el hilo entra recién cuando hay pantalla.
 */
const Hilo3DCliente = dynamic(() => import("./Hilo3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

export default Hilo3DCliente;
