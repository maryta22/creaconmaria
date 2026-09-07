/**
 * De las medidas de una cartera a la lista de cuentas en el espacio.
 *
 * La cartera se teje en seis piezas planas (base, frente, espalda, dos
 * laterales y solapa) más el asa tubular, así que acá se arma exactamente eso:
 * cada panel es una grilla de cuentas y la solapa se dobla sobre el borde
 * superior trasero siguiendo un recorrido con esquina redondeada.
 *
 * Unidad de mundo = 1 cm.
 */

export type Panel =
  | "base"
  | "frente"
  | "espalda"
  | "lateralIzq"
  | "lateralDer"
  | "solapa"
  | "asa"
  /**
   * Las dos asas de una cartera que abre por todo el borde de arriba: una
   * sobre cada cara, para no cruzar la boca. Ver `asasDeLayout()`.
   */
  | "asaFrente"
  | "asaEspalda"
  /** La tira que da la vuelta al borde de una pieza con silueta y le da la profundidad. */
  | "contorno";

/** Si esa pieza es un asa. Son tubos: ni serpentean ni llevan forro. */
export function esAsa(panel: Panel) {
  return panel === "asa" || panel === "asaFrente" || panel === "asaEspalda";
}

/** Las seis piezas tejidas, en el orden en que se arman. El asa va aparte. */
export const PANELES: Panel[] = [
  "base",
  "frente",
  "espalda",
  "lateralIzq",
  "lateralDer",
  "solapa",
  "asa",
];

export const NOMBRE_PANEL: Record<Panel, string> = {
  contorno: "Contorno",
  base: "Base",
  frente: "Frente",
  espalda: "Espalda",
  lateralIzq: "Lateral izquierdo",
  lateralDer: "Lateral derecho",
  solapa: "Solapa",
  asa: "Asa",
  asaFrente: "Asa delantera",
  asaEspalda: "Asa trasera",
};

export type MedidasCartera = {
  /**
   * `caja` = las seis piezas rectangulares de siempre. `corazon`, `tulipan` y
   * `fresa` =
   * dos caras con silueta más una tira de contorno
   * (`docs/carteras-con-silueta.md`).
   * `cuadrada` = la caja sin solapa que **se angosta hacia arriba** hasta el
   * ancho del aro, y cuelga de una cadena (`docs/cartera-cuadrada.md`).
   */
  forma?: "caja" | "corazon" | "tulipan" | "fresa" | "circulo" | "cuadrada";
  anchoCm: number;
  altoCm: number;
  profundidadCm: number;
  /** Cuánto baja la solapa por el frente. */
  altoSolapaCm: number;
  /** Largo total del asa tejida. 0 = sin asa. */
  asaCm: number;
  /**
   * Diámetro interior del aro de acero de las esquinas de arriba. **Es lo que
   * decide cuánto se angosta la boca**: el borde de arriba de cada lateral
   * tiene que pasar por adentro del aro, así que la boca mide justo esto.
   * Solo lo usa `forma: "cuadrada"`.
   */
  aroCm?: number;
  /** Largo de la cadena, de aro a aro. Solo `forma: "cuadrada"`. */
  cadenaCm?: number;
  /** Diámetro de la cuenta principal. Define el paso de la grilla. */
  cuentaMm: number;
  /**
   * En tejido en cruz las cuentas no quedan pegadas: el paso entre centros es
   * mayor que el diámetro. 1.3 es lo que hace que el conteo dé parecido al de
   * los pliegos de patrón.
   */
  separacion: number;
};

export type Cuenta = {
  /** Índice en el array; es también el instanceId en el render. */
  i: number;
  panel: Panel;
  fila: number;
  col: number;
  /** Centro de la cuenta, en cm. */
  pos: [number, number, number];
};

export type Rejilla = {
  panel: Panel;
  filas: number;
  cols: number;
  /** Índice de la primera cuenta del panel dentro de `cuentas`. */
  desde: number;
  /**
   * Si el tejido **va y vuelve**. Las seis piezas planas sí: al llegar al
   * borde el hilo dobla y la fila siguiente se teje en el otro sentido, que es
   * la única forma de seguir con el mismo hilo. El asa no: es un tubo y cada
   * vuelta sigue girando para el mismo lado (ver `carteras diseños/patrones/cruzado.md`).
   */
  serpentea: boolean;
  /**
   * `fila * cols + col` → índice de la cuenta, o **-1 si ahí no va ninguna**.
   * Es una tabla y no una cuenta aritmética porque una pieza con silueta tiene
   * huecos: la grilla del corazón es un rectángulo con las esquinas vacías.
   */
  indices: number[];
  /** Cuántas cuentas tiene de verdad. En un rectángulo lleno es `filas × cols`. */
  total: number;
  /**
   * El borde de la silueta **que lleva contorno**, en orden. Solo lo tienen
   * las piezas con forma; contra esta lista se cose la tira del contorno.
   *
   * No es toda la vuelta: el tramo de la `boca` queda afuera.
   */
  contorno?: number[];
  /**
   * El tramo del borde que queda **sin coser**: por ahí abre la cartera. En
   * el corazón es la hendidura entre los dos lóbulos, tal como manda la ficha.
   */
  boca?: number[];
};

/**
 * Dónde cae la cuenta (fila, col) de una pieza dentro del recorrido del hilo.
 *
 * **En las filas que vuelven, la primera cuenta tejida es la de la última
 * columna.** Todo lo que traduzca coordenadas de la cuadrícula a un índice
 * tiene que pasar por acá: el orden del array es el orden en que se ensarta,
 * y ya no coincide con leer la fila siempre de izquierda a derecha.
 */
export function indiceEn(rejilla: Rejilla, fila: number, col: number) {
  if (fila < 0 || fila >= rejilla.filas || col < 0 || col >= rejilla.cols) return -1;
  return rejilla.indices[fila * rejilla.cols + col];
}

/** Hacia dónde se teje una fila. La de vuelta va de derecha a izquierda. */
export function sentidoDeFila(serpentea: boolean, fila: number) {
  return serpentea && fila % 2 === 1 ? "vuelve" : "va";
}

export type LayoutCartera = {
  medidas: MedidasCartera;
  /** Con qué forma se armó. De acá salen las costuras que corresponden. */
  forma: "caja" | "corazon" | "tulipan" | "fresa" | "circulo" | "cuadrada";
  /** Paso entre centros de cuenta, en cm. */
  paso: number;
  cuentas: Cuenta[];
  rejillas: Rejilla[];
  /** Alto total con la solapa o la cadena puesta, para encuadrar la cámara. */
  altoTotal: number;
  /**
   * Lo que no es cuenta: los aros de acero y los eslabones de la cadena. No
   * entran en el conteo ni en el patrón —son piezas compradas, como el broche—
   * pero sí se dibujan.
   */
  herrajes?: Herraje[];
};

/**
 * Una pieza de metal del armado: un anillo, dibujado como un toro. Sirve para
 * el aro de acero de las esquinas y para cada eslabón de la cadena.
 */
export type Herraje = {
  clase: "aro" | "eslabon";
  /** Centro del anillo, en cm. */
  pos: [number, number, number];
  /** Eje del anillo: por ahí pasa lo que engancha. */
  eje: [number, number, number];
  /** Radio del anillo, medido al medio del alambre. */
  radio: number;
  /** Grosor del alambre. */
  grosor: number;
};

const redondearMin1 = (v: number) => Math.max(1, Math.round(v));

/**
 * Recorrido de la solapa en el plano y-z: sale del borde superior trasero,
 * cruza el techo, dobla en una esquina redondeada y baja por el frente.
 */
function recorridoSolapa(cuerpo: { techo: number; frente: number; espalda: number }, paso: number) {
  // La solapa **se apoya encima** de la cartera: es una pieza más, no una capa
  // pintada. Va a un diámetro de la pared que tapa, medido contra dónde están
  // las cuentas de verdad y no contra la medida nominal.
  //
  // Antes salía de `altoCm` y `profundidadCm/2` más medio paso, y esas dos no
  // son donde termina el tejido: la última fila de la pared cae medio paso más
  // adentro. La solapa bajaba a 3 mm del frente con cuentas de 8 y **se metía
  // 5 mm adentro** de las del frente. De ahí que se vieran fusionadas.
  // La bisagra manda la altura del techo. La primera fila de la solapa cae
  // medio paso adentro del borde trasero, así que para que quede **a un paso
  // exacto** de la última fila de la espalda —ni encimada ni con el hilo al
  // aire— tiene que subir `paso·√3/2`, no un paso entero.
  const yTecho = cuerpo.techo + (paso * Math.sqrt(3)) / 2;
  const zFrente = cuerpo.frente + paso;
  const zEspalda = cuerpo.espalda;
  const radio = paso;
  const zCentro = zFrente - radio;
  const yCentro = yTecho - radio;

  const largoTecho = zCentro - zEspalda;
  const largoCurva = (Math.PI * radio) / 2;

  return (s: number): { y: number; z: number } => {
    if (s <= largoTecho) {
      return { y: yTecho, z: zEspalda + s };
    }
    if (s <= largoTecho + largoCurva) {
      const angulo = (s - largoTecho) / radio; // 0 = arriba, π/2 = al frente
      return {
        y: yCentro + radio * Math.cos(angulo),
        z: zCentro + radio * Math.sin(angulo),
      };
    }
    return { y: yCentro - (s - largoTecho - largoCurva), z: zFrente };
  };
}

/**
 * El perfil de la pared en el plano y-z de `forma: "cuadrada"`: sube recta
 * desde el borde de la base y sobre el final **se mete hacia adentro** hasta
 * el ancho del aro. Devuelve el punto que queda a `s` cm de **tejido**,
 * contados desde la base.
 *
 * Se reparte por largo de tejido y no por altura a propósito: la pared del
 * cuello va inclinada, así que una fila y la de arriba están a un paso sobre
 * la pared pero a menos de un paso de altura. Repartiendo por altura, en el
 * cuello las cuentas quedaban separadas y se veía el hilo.
 */
function perfilCuadrada(
  { zCuerpo, zBoca, largoCuello }: { zCuerpo: number; zBoca: number; largoCuello: number },
  largoPared: number,
) {
  const sCuello = Math.max(0, largoPared - largoCuello);
  const seno = largoCuello > 0 ? Math.min(1, (zCuerpo - zBoca) / largoCuello) : 0;
  const coseno = Math.sqrt(1 - seno * seno);
  return (s: number): { y: number; z: number } => {
    if (s <= sCuello) return { y: s, z: zCuerpo };
    const d = s - sCuello;
    return { y: sCuello + d * coseno, z: zCuerpo - d * seno };
  };
}

/**
 * El fuelle doblado, visto desde arriba: por dónde pasan sus cuentas cuando las
 * dos esquinas de arriba están más juntas que el fuelle desplegado.
 *
 * **El fuelle no pierde cuentas.** Son siempre las mismas y siempre pegadas, así
 * que su recorrido mide siempre lo mismo: al juntarse las puntas, lo que sobra
 * se **dobla para adentro**, como la esquina de una bolsa de papel. Lo dijo
 * María: *"son las mismas pero unes las esquinas superiores y eso hace que se
 * doble para adentro"*.
 *
 * El doblez es una **V con la punta redondeada**: dos tramos rectos y una vuelta
 * de radio `paso/2`, que es lo más cerrado que se puede doblar una tela de
 * cuentas —de un lado del doblez a la otra queda justo una cuenta—. Cuánto se
 * mete la punta no se elige: es lo que hace que el recorrido siga midiendo lo
 * que mide, así que se busca.
 *
 * Devuelve el punto que queda a `s` cm de recorrido desde la punta de atrás:
 * `dentro` es cuánto se metió hacia el centro de la cartera y `z` dónde cae
 * entre el frente y la espalda.
 */
function fuelleDoblado(mediaSeparacion: number, largo: number, radio: number) {
  const sz = mediaSeparacion;

  /** Cuánto mide el recorrido si la punta se mete `h`. Crece con `h`. */
  const mide = (h: number) => {
    const cx = h - radio;
    const d = Math.hypot(cx, sz);
    if (d <= radio) return Infinity;
    const tangente = Math.sqrt(d * d - radio * radio);
    const vuelta = Math.atan2(sz, -cx) - Math.acos(radio / d);
    return 2 * tangente + 2 * radio * Math.max(0, vuelta);
  };

  // Se busca en vez de despejarla: con la punta redondeada no hay fórmula
  // corta, y el recorrido crece parejo con `h`, así que partirlo al medio unas
  // cuantas veces alcanza y sobra.
  let bajo = 0;
  let alto = largo;
  for (let i = 0; i < 60; i++) {
    const medio = (bajo + alto) / 2;
    if (mide(medio) < largo) bajo = medio;
    else alto = medio;
  }
  const hondo = (bajo + alto) / 2;
  const h = hondo;

  const cx = h - radio;
  const d = Math.hypot(cx, sz);
  const tangente = Math.sqrt(Math.max(0, d * d - radio * radio));
  const desdeElCentro = Math.atan2(sz, -cx) - Math.acos(radio / d);
  const vuelta = Math.max(0, desdeElCentro);
  const arco = 2 * radio * vuelta;

  // Donde el tramo recto se despega y empieza la vuelta. Es el de **atrás**,
  // del mismo lado que la punta desde la que se empieza a recorrer.
  const tocaEn = { x: cx + radio * Math.cos(vuelta), z: -radio * Math.sin(vuelta) };

  const en = (s: number): { dentro: number; z: number } => {
    // Simétrico: se resuelve la mitad de atrás y la otra se espeja.
    const espeja = s > largo / 2;
    const t = espeja ? largo - s : s;
    if (t <= tangente) {
      // Tramo recto, desde la punta de atrás hasta donde empieza la vuelta.
      const avance = tangente > 0 ? t / tangente : 0;
      const x = tocaEn.x * avance;
      const z = -sz + (tocaEn.z + sz) * avance;
      return { dentro: x, z: espeja ? -z : z };
    }
    // La vuelta de la punta: de −vuelta hasta 0, que es la punta misma.
    const angulo = -vuelta + (t - tangente) / radio;
    const z = radio * Math.sin(angulo);
    return { dentro: cx + radio * Math.cos(angulo), z: espeja ? -z : z };
  };

  return { hondo, en };
}

/**
 * Recorrido del asa: un arco que nace de las argollas, hacia adentro de las
 * esquinas superiores, y sube. La altura del arco sale de que el recorrido
 * tiene que medir `asaCm`, que es lo que dice la ficha.
 */
function recorridoAsa(
  m: MedidasCartera,
  paso: number,
  ancla: { x: number; y: number },
  /** Cuánto tiene que medir el recorrido. Por defecto, el asa tejida. */
  largo = m.asaCm,
) {
  // Las argollas van hacia adentro de las esquinas, como en las fotos.
  const a = ancla.x;
  const yAnclaje = ancla.y;

  const MUESTRAS = 400;

  /** Cuánto mide el arco de la media elipse de altura `b`. */
  const medirArco = (b: number) => {
    let largo = 0;
    let xAnterior = -a;
    let yAnterior = 0;
    for (let i = 1; i <= MUESTRAS; i++) {
      const angulo = (Math.PI * i) / MUESTRAS;
      const x = -a * Math.cos(angulo);
      const y = b * Math.sin(angulo);
      largo += Math.hypot(x - xAnterior, y - yAnterior);
      xAnterior = x;
      yAnterior = y;
    }
    return largo;
  };

  /**
   * La altura del arco se **busca**, no se despeja: el largo de arco de una
   * elipse no tiene fórmula cerrada, y la aproximación que había acá
   * (`π/2 · √(2(a²+b²))`) se quedaba corta — con `asaCm: 16` el asa terminaba
   * midiendo 23 cm de verdad. Como el arco crece con `b`, alcanza con
   * partirlo al medio unas cuantas veces.
   *
   * El piso es la recta entre las dos argollas: un asa no puede medir menos.
   */
  const objetivo = Math.max(largo, 2 * a * 1.02);
  let bajo = 0.001;
  let alto = objetivo;
  for (let i = 0; i < 60; i++) {
    const medio = (bajo + alto) / 2;
    if (medirArco(medio) < objetivo) bajo = medio;
    else alto = medio;
  }
  const b = Math.max(paso, (bajo + alto) / 2);

  const en = (t: number) => {
    const angulo = Math.PI * t; // 0 → 1 recorre de una argolla a la otra
    return {
      x: -a * Math.cos(angulo),
      y: yAnclaje + b * Math.sin(angulo),
      z: 0,
    };
  };

  /**
   * El arco es una media elipse, así que **avanzar de a un mismo paso de `t` no
   * avanza siempre lo mismo de recorrido**: cerca de las argollas el punto
   * corre mucho más rápido que arriba. Repartir las cuentas por `t` las dejaba
   * apretadas en el medio y separadas en las puntas.
   *
   * Se mide el arco de una vez y después se reparte **por largo**, que es como
   * se ensartan de verdad: una cuenta cada diámetro.
   */
  const acumulado: number[] = [0];
  let anterior = en(0);
  for (let i = 1; i <= MUESTRAS; i++) {
    const punto = en(i / MUESTRAS);
    acumulado.push(acumulado[i - 1] + Math.hypot(punto.x - anterior.x, punto.y - anterior.y));
    anterior = punto;
  }
  const largoTotal = acumulado[MUESTRAS];

  /**
   * La perpendicular al recorrido que apunta **hacia afuera** de la curva.
   * La usan las dos cosas que tienen que coincidir: el reparto de las vueltas
   * y la orientación del anillo de cuentas. Si cada una eligiera su signo, se
   * repartiría por un borde y se dibujaría por el otro, y del lado de afuera
   * quedarían huecos.
   */
  const normalEn = (t: number) => {
    const aqui = en(t);
    const antes = en(Math.max(0, t - 0.002));
    const luego = en(Math.min(1, t + 0.002));
    const dx = luego.x - antes.x;
    const dy = luego.y - antes.y;
    const largo = Math.hypot(dx, dy) || 1;
    let x = -dy / largo;
    let y = dx / largo;
    if (x * aqui.x + y * (aqui.y - yAnclaje) < 0) {
      x = -x;
      y = -y;
    }
    return { x, y };
  };

  /** El punto que queda a `s` cm de recorrido desde la primera argolla. */
  const porLargo = (s: number) => {
    const objetivo = Math.min(Math.max(s, 0), largoTotal);
    let bajo = 0;
    let alto = MUESTRAS;
    while (bajo < alto) {
      const medio = (bajo + alto) >> 1;
      if (acumulado[medio] < objetivo) bajo = medio + 1;
      else alto = medio;
    }
    const i = Math.max(1, bajo);
    const tramo = acumulado[i] - acumulado[i - 1] || 1;
    const sobra = (objetivo - acumulado[i - 1]) / tramo;
    return en((i - 1 + sobra) / MUESTRAS);
  };

  /**
   * Cuánto mide el recorrido **por la parte de afuera de la curva**, a `r` del
   * eje. En un tubo curvo las cuentas de afuera tienen que recorrer más que las
   * del eje: si se reparten por el largo del eje, del lado de afuera quedan
   * separadas. Repartiéndolas por este largo, las de afuera se tocan y las de
   * adentro se montan un poco — que es lo que pasa de verdad al tensar.
   */
  const largoConRadio = (r: number) => {
    const afuera = (t: number) => {
      const aqui = en(t);
      const n = normalEn(t);
      return { x: aqui.x + n.x * r, y: aqui.y + n.y * r };
    };

    let largo = 0;
    let anterior = afuera(0);
    for (let i = 1; i <= MUESTRAS; i++) {
      const punto = afuera(i / MUESTRAS);
      largo += Math.hypot(punto.x - anterior.x, punto.y - anterior.y);
      anterior = punto;
    }
    return largo;
  };

  return { porLargo, largoTotal, largoConRadio, normalEn };
}

/**
 * La silueta de corazón, muestreada una sola vez como polígono junto con su
 * caja. Es la curva paramétrica clásica:
 *
 * ```
 * x = 16 sen³t
 * y = 13 cos t − 3 cos 2t − 2 cos 3t − cos 4t
 * ```
 *
 * **No es la implícita `(x² + y² − 1)³ − x²y³ ≤ 0`**, con la que se arrancó.
 * Sobre la grilla de la cara —20 filas de 23 cuentas, que es lo que entra en
 * 18 × 16 cm con cuenta de 8 mm— la implícita casi no se nota: la hendidura
 * entre los lóbulos ocupa **un solo casillero** y los hombros salen rectos,
 * así que el corazón leía como un escudo. Con esta se redondean los lóbulos.
 * Lo pidió María mirando el 3D de la ficha.
 *
 * **El coeficiente de `cos 2t` es el que manda la hendidura.** Arrancó en 5 y
 * el valle bajaba cinco filas: sobre la grilla eso es un tajo de un casillero
 * de ancho que parte el corazón en dos bloques — *"se nota muy brusco"*. En 3
 * la hendidura baja tres filas y los hombros bajan de a una columna. Ni escudo
 * ni sierra. Tocarlo cambia el conteo de la cara y corre el patrón guardado:
 * hay que regenerar con `npm run db:seed`.
 *
 * La caja sale del muestreo y no de números escritos a mano: se estira a la
 * grilla de la pieza, así que el corazón siempre entra justo en el ancho y el
 * alto pedidos.
 */
const MUESTRAS_CORAZON = 720;

const CORAZON = (() => {
  const borde: { x: number; y: number }[] = [];
  for (let i = 0; i < MUESTRAS_CORAZON; i++) {
    const t = (i / MUESTRAS_CORAZON) * Math.PI * 2;
    borde.push({
      x: 16 * Math.sin(t) ** 3,
      y: 13 * Math.cos(t) - 3 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t),
    });
  }
  const caja = borde.reduce(
    (c, p) => ({
      xMin: Math.min(c.xMin, p.x), xMax: Math.max(c.xMax, p.x),
      yMin: Math.min(c.yMin, p.y), yMax: Math.max(c.yMax, p.y),
    }),
    { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity },
  );
  return { borde, ...caja };
})();

/**
 * Si un punto cae adentro de la silueta. La curva no tiene forma implícita
 * simple, así que se cuenta cuántas veces la cruza un rayo horizontal: impar
 * es adentro. Contra el polígono de arriba, que es el mismo para todas las
 * carteras.
 */
function dentroDelCorazon(x: number, y: number) {
  const { borde } = CORAZON;
  let adentro = false;
  for (let i = 0, j = borde.length - 1; i < borde.length; j = i++) {
    const a = borde[i];
    const b = borde[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      adentro = !adentro;
    }
  }
  return adentro;
}

function siluetaCorazon(filas: number, cols: number) {
  const mascara: boolean[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const x = CORAZON.xMin + ((c + 0.5) / cols) * (CORAZON.xMax - CORAZON.xMin);
      const y = CORAZON.yMin + ((f + 0.5) / filas) * (CORAZON.yMax - CORAZON.yMin);
      mascara.push(dentroDelCorazon(x, y));
    }
  }
  return mascara;
}

/**
 * Tulipán con una copa ancha y tres pétalos redondeados arriba. La base se
 * angosta para que funcione como bolso y la boca queda entre los pétalos.
 */
function siluetaTulipan(filas: number, cols: number) {
  const mascara: boolean[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols) * 2 - 1;
      const y = ((f + 0.5) / filas) * 2 - 1;
      const progreso = (y + 1) / 2;
      // La copa se abre desde una base estrecha y se sostiene hasta los pétalos.
      const anchoCopa = progreso < 0.48 ? 0.24 + progreso * 1.25 : 0.84;
      const copa = y <= 0.36 && Math.abs(x) <= anchoCopa;
      // Tres lóbulos unidos: uno al centro y uno a cada lado.
      const petalo = (centroX: number, centroY: number) =>
        ((x - centroX) / 0.42) ** 2 + ((y - centroY) / 0.48) ** 2 <= 1;
      mascara.push(copa || petalo(-0.38, 0.38) || petalo(0, 0.55) || petalo(0.38, 0.38));
    }
  }
  return mascara;
}

/** Fresa con cuerpo redondeado, base en punta suave y boca arriba. */
function siluetaFresa(filas: number, cols: number) {
  const mascara: boolean[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols) * 2 - 1;
      const y = ((f + 0.5) / filas) * 2 - 1;
      const progreso = Math.min(1, Math.max(0, (y + 1) / 2));
      // El máximo queda un poco antes de la boca. Así el contorno sostiene
      // los hombros y las últimas filas se reservan para abrir la cartera.
      const anchoCuerpo = 0.11 + 0.75 * Math.sin(progreso * Math.PI * 0.75);
      mascara.push(Math.abs(x) <= anchoCuerpo);
    }
  }
  return mascara;
}

/** Círculo completo: dos tapas redondas unidas por una tira de contorno. */
function siluetaCirculo(filas: number, cols: number) {
  const mascara: boolean[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      const x = ((c + 0.5) / cols) * 2 - 1;
      const y = ((f + 0.5) / filas) * 2 - 1;
      mascara.push(x * x + y * y <= 1);
    }
  }
  return mascara;
}

/** Los ocho vecinos de una celda, en orden, para bordear la silueta. */
const VECINOS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]] as const;

/**
 * El borde de una silueta, **en orden y dando la vuelta completa**. Es contra
 * esta lista que se cose la tira del contorno, así que el orden importa: la
 * cuenta 5 del contorno va con la cuenta 5 del borde de la cara.
 *
 * Va bordeando de vecino en vecino (trazado de Moore): arranca en la celda
 * llena más de abajo y sigue girando siempre para el mismo lado hasta volver.
 */
function contornoDe(mascara: boolean[], filas: number, cols: number) {
  const lleno = (f: number, c: number) =>
    f >= 0 && f < filas && c >= 0 && c < cols && mascara[f * cols + c];

  let inicio: [number, number] | null = null;
  for (let f = 0; f < filas && !inicio; f++) {
    for (let c = 0; c < cols; c++) {
      if (lleno(f, c)) {
        inicio = [f, c];
        break;
      }
    }
  }
  if (!inicio) return [];

  const recorrido: { fila: number; col: number }[] = [];
  let [f, c] = inicio;
  let direccion = 0;
  const tope = filas * cols * 4;
  do {
    recorrido.push({ fila: f, col: c });
    let paso: [number, number, number] | null = null;
    for (let k = 0; k < 8; k++) {
      // Se retoma desde atrás de por donde se venía: así se bordea sin cortar.
      const d = (direccion + 6 + k) % 8;
      const nf = f + VECINOS[d][0];
      const nc = c + VECINOS[d][1];
      if (lleno(nf, nc)) {
        paso = [nf, nc, d];
        break;
      }
    }
    if (!paso) break;
    [f, c, direccion] = paso;
  } while (!(f === inicio[0] && c === inicio[1]) && recorrido.length < tope);

  return recorrido;
}

/**
 * La boca: el tramo del borde por donde la cartera **abre**, y que por eso no
 * lleva contorno ni va cosido.
 *
 * Es **todo el borde de arriba**: de la cintura —la fila más ancha de la
 * silueta— para arriba. Lo dijo María, que es la que las teje: *"tiene que ser
 * toda la parte de arriba, es una cartera"*. Una cartera se abre a lo ancho y
 * se mete la mano; una ranura entre los dos lóbulos era un monedero.
 *
 * Salvo `FILAS_CERRADAS`: las dos filas justo encima de la cintura siguen
 * cosidas. Abierta hasta la cintura misma, la boca terminaba en el punto más
 * ancho y por esas dos puntas se veía el forro. *"Un poquito más cerrada en
 * los extremos"*.
 *
 * En el corazón eso deja el contorno cosido en la **V de abajo**, que es donde
 * está el volumen, y los dos lóbulos abiertos de punta a punta. La cintura es
 * también donde caen las dos puntas de la tira, o sea donde va el broche.
 *
 * Sale de la silueta y no de números escritos a mano, así que sirve para
 * cualquier forma que venga después.
 */
const FILAS_CERRADAS = 2;

function bocaDeSilueta(mascara: boolean[], filas: number, cols: number) {
  const anchoDe = (f: number) => {
    let n = 0;
    for (let c = 0; c < cols; c++) if (mascara[f * cols + c]) n += 1;
    return n;
  };

  // La cintura: la fila más ancha y, si varias empatan, la de más arriba —
  // ahí termina el contorno y arranca la boca.
  let cintura = -1;
  let ancho = 0;
  for (let f = 0; f < filas; f++) {
    const n = anchoDe(f);
    if (n > 0 && n >= ancho) {
      ancho = n;
      cintura = f;
    }
  }

  const boca = new Set<number>();
  if (cintura < 0) return boca;
  for (let f = cintura + 1 + FILAS_CERRADAS; f < filas; f++) {
    for (let c = 0; c < cols; c++) if (mascara[f * cols + c]) boca.add(f * cols + c);
  }
  return boca;
}

/**
 * **En una cartera no entran cuentas de menos de 8 mm.** Lo dijo María: *"para
 * bolsos solo de 8 mm y 10 mm o más"*.
 *
 * No es capricho de tamaño, es que una cartera se sostiene sola: con cuentas
 * más chicas la tela queda blanda y el bolso se cae sobre sí mismo, además de
 * multiplicar el trabajo —la misma cartera de 18 cm pasa de 23 columnas a 45,
 * o sea de 1.900 cuentas a más de 6.000—. Las cuentas chicas son para pulseras
 * y collares, donde el hilo es el que manda.
 *
 * Vale para **la cuenta de la grilla y para cada color de la paleta**: una
 * cuenta más chica que el paso no llena su lugar y deja el hilo a la vista.
 */
export const CUENTA_MINIMA_MM = 8;

/** Si esa cuenta se puede usar en una cartera. */
export function sirveParaCartera(mm: number) {
  return mm >= CUENTA_MINIMA_MM;
}

/** La forma guardada en la base, saneada. Lo que no se reconoce es una caja. */
export function formaDe(valor: string | null | undefined): "caja" | "corazon" | "tulipan" | "fresa" | "circulo" | "cuadrada" {
  if (valor === "corazon") return "corazon";
  if (valor === "tulipan") return "tulipan";
  if (valor === "fresa") return "fresa";
  if (valor === "circulo") return "circulo";
  if (valor === "cuadrada") return "cuadrada";
  return "caja";
}

/**
 * Los dos aros de acero de las esquinas de arriba y la cadena que va de uno al
 * otro.
 *
 * El aro **encierra la última fila del lateral**, que es el borde que junta
 * frente y espalda: por eso su eje va en z, que es la dirección en la que
 * corre ese borde. La cadena hace el mismo arco que haría un asa tejida —el
 * mismo `recorridoAsa`, con el largo de la cadena— pero se dibuja como
 * eslabones, cada uno cruzado con el anterior.
 */
function herrajesCuadrada(
  m: MedidasCartera,
  paso: number,
  esquina: { x: number; y: number; aro: number },
): Herraje[] {
  // Alambre de acero, ~1,2 mm con cuenta de 8: se ve pero no pesa la escena.
  /**
   * **Sin aro.** Estuvo dibujado —acostado, uniendo el frente con la espalda—
   * y María lo sacó: *"el aro grande quitalo"*. Con cuatro centímetros de
   * diámetro sobre una cartera de dieciocho quedaba enorme, y lo que se ve es
   * un alambre grueso apoyado en la esquina, no un herraje.
   *
   * La cartera se sigue cerrando igual: las dos esquinas de arriba se juntan
   * cosiendo el borde sobre sí mismo, y el fuelle se dobla para adentro lo
   * mismo que antes —eso no dependía del aro—. La cadena se engancha
   * directamente sobre esa esquina.
   *
   * `MedidasCartera.aroCm` quedó sin uso en el dibujo. No se borra todavía
   * porque está guardado en los patrones de la base.
   */
  const herrajes: Herraje[] = [];

  const largo = m.cadenaCm ?? 0;
  if (largo <= 0) return herrajes;

  const arco = recorridoAsa(m, paso, { x: esquina.x, y: esquina.y }, largo);
  const radioEslabon = esquina.aro * 0.3;
  const grosorEslabon = Math.max(0.05, radioEslabon * 0.26);
  // Dos eslabones enganchados se montan: de centro a centro queda el largo del
  // eslabón menos los dos alambres que se cruzan.
  const entreEslabones = Math.max(grosorEslabon, 2 * radioEslabon - 2 * grosorEslabon);
  // **Par**: así el primer eslabón y el último caen los dos en la misma
  // paridad, y los dos quedan cruzados con su aro.
  const cuantos = Math.max(2, 2 * Math.round(arco.largoTotal / entreEslabones / 2));

  for (let i = 0; i <= cuantos; i++) {
    const avance = (arco.largoTotal * i) / cuantos;
    const centro = arco.porLargo(avance);
    /**
     * **Cada eslabón está cruzado con el anterior**: los dos ejes son
     * perpendiculares al recorrido y se van alternando. Todos iguales es una
     * tira de anillos, no una cadena.
     *
     * Arranca por la normal del arco y no por z para que la punta de la cadena
     * entre de canto en la esquina y no de plano contra la tela.
     */
    const n = arco.normalEn(avance / arco.largoTotal);
    herrajes.push({
      clase: "eslabon",
      pos: [centro.x, centro.y, centro.z],
      eje: i % 2 === 0 ? [n.x, n.y, 0] : [0, 0, 1],
      radio: radioEslabon,
      grosor: grosorEslabon,
    });
  }
  return herrajes;
}

/**
 * Las medidas guardadas en la base, pasadas a `MedidasCartera`.
 *
 * **Se arman acá y no campo por campo en cada página.** Son cinco vistas que
 * construyen lo mismo —la ficha, la tarjeta del catálogo, el diseñador, su
 * lista y el mapa—, y cada medida nueva se olvidaba en alguna: esa vista
 * quedaba dibujando otra cartera.
 */
export function medidasDePatron(p: {
  forma: string | null;
  anchoCm: number;
  altoCm: number;
  profundidadCm: number;
  altoSolapaCm: number;
  asaCm: number;
  aroCm?: number | null;
  cadenaCm?: number | null;
  cuentaMm: number;
  separacion: number;
}): MedidasCartera {
  return {
    forma: formaDe(p.forma),
    anchoCm: p.anchoCm,
    altoCm: p.altoCm,
    profundidadCm: p.profundidadCm,
    altoSolapaCm: p.altoSolapaCm,
    asaCm: p.asaCm,
    aroCm: p.aroCm ?? undefined,
    cadenaCm: p.cadenaCm ?? undefined,
    cuentaMm: p.cuentaMm,
    separacion: p.separacion,
  };
}

/** Arma la lista completa de cuentas a partir de las medidas. */
export function armarLayout(medidas: MedidasCartera): LayoutCartera {
  const paso = (medidas.cuentaMm / 10) * medidas.separacion;
  const { anchoCm: W, altoCm: H, profundidadCm: D } = medidas;

  const forma = medidas.forma ?? "caja";
  const cols = redondearMin1(W / paso);
  const filasCuerpo = redondearMin1(H / paso);
  const filasBase = redondearMin1(D / paso);

  const cuentas: Cuenta[] = [];
  const rejillas: Rejilla[] = [];
  let herrajes: Herraje[] | undefined;

  const agregar = (
    panel: Panel,
    filas: number,
    ancho: number,
    ubicar: (f: number, c: number) => [number, number, number],
    /** Qué celdas llevan cuenta. Sin máscara, la pieza es un rectángulo lleno. */
    mascara?: boolean[],
  ) => {
    // El asa es un tubo: cada vuelta sigue girando para el mismo lado. Las
    // piezas planas van y vuelven.
    const serpentea = !esAsa(panel);
    const desde = cuentas.length;
    const indices = new Array<number>(filas * ancho).fill(-1);
    for (let f = 0; f < filas; f++) {
      for (let k = 0; k < ancho; k++) {
        // Al terminar una fila el hilo **dobla en el borde**: la siguiente
        // arranca ahí mismo, no del otro lado de la pieza. Saltar de punta a
        // punta es lo que no se puede hacer tejiendo con un hilo solo.
        const c = serpentea && f % 2 === 1 ? ancho - 1 - k : k;
        if (mascara && !mascara[f * ancho + c]) continue;
        indices[f * ancho + c] = cuentas.length;
        cuentas.push({ i: cuentas.length, panel, fila: f, col: c, pos: ubicar(f, c) });
      }
    }
    const rejilla: Rejilla = { panel, filas, cols: ancho, desde, serpentea, indices, total: cuentas.length - desde };
    rejillas.push(rejilla);
    return rejilla;
  };

  /** Centro de la columna `c` sobre el ancho de la cartera. */
  const ejeX = (c: number) => (c + 0.5) * paso - (cols * paso) / 2;
  /** Centro de la fila `f` sobre la profundidad. */
  const ejeZ = (f: number) => (f + 0.5) * paso - (filasBase * paso) / 2;
  const mitadD = (filasBase * paso) / 2;
  const mitadW = (cols * paso) / 2;

  if (forma === "corazon" || forma === "tulipan" || forma === "fresa" || forma === "circulo") {
    // --- Dos caras con silueta y una tira que las separa ---
    // No hay base ni solapa: la cartera abre por el borde superior.
    const filasCara = redondearMin1(H / paso);
    const mascara =
      forma === "circulo"
        ? siluetaCirculo(filasCara, cols)
        : forma === "tulipan"
        ? siluetaTulipan(filasCara, cols)
        : forma === "fresa"
          ? siluetaFresa(filasCara, cols)
          : siluetaCorazon(filasCara, cols);
    const alturaY = (f: number) => (f + 0.5) * paso;

    const frente = agregar("frente", filasCara, cols, (f, c) => [ejeX(c), alturaY(f), mitadD], mascara);
    const espalda = agregar("espalda", filasCara, cols, (f, c) => [ejeX(c), alturaY(f), -mitadD], mascara);

    // El borde, en orden, dando la vuelta entera.
    const vuelta = contornoDe(mascara, filasCara, cols);

    // De esa vuelta se descuenta la boca: ahí no va contorno, y las dos caras
    // quedan sueltas una de otra. Es por donde se mete la mano.
    //
    // El trazado sube por un costado, cruza todo el borde de arriba y baja por
    // el otro, así que la boca sale como un tramo seguido y alcanza con
    // quedarse con su principio y su final. Una silueta que la partiera en dos
    // se comería también lo del medio: la boca saldría más ancha, pero la tira
    // sigue siendo una sola y entera.
    const enBoca = bocaDeSilueta(mascara, filasCara, cols);
    const marcadas = vuelta.map((b) => enBoca.has(b.fila * cols + b.col));
    const abre = marcadas.indexOf(true);
    const cierra = marcadas.lastIndexOf(true);

    // La tira arranca **justo después** de la boca y termina justo antes: así
    // es una tira abierta y no un anillo, y sus dos puntas caen a los costados
    // de la boca, que es donde va el broche.
    const borde =
      abre < 0 ? vuelta : [...vuelta.slice(cierra + 1), ...vuelta.slice(0, abre)];
    if (abre >= 0) {
      const tramo = vuelta.slice(abre, cierra + 1);
      frente.boca = tramo.map((b) => indiceEn(frente, b.fila, b.col));
      espalda.boca = tramo.map((b) => indiceEn(espalda, b.fila, b.col));
    }

    /**
     * La tira no lleva una cuenta por cuenta del borde: lleva **una cada
     * diámetro a lo largo del borde**, que no es lo mismo.
     *
     * El borde de una silueta va en escalera, y donde sube en diagonal dos
     * cuentas del borde quedan a 1,4 pasos una de otra. Con una cuenta de tira
     * por cada una, la tira se estiraba justo ahí y **se veía el hilo**: 3,3 mm
     * al aire en 120 tramos. Las cuentas van siempre juntas — una tira de 39
     * cuentas pegadas mide 30 cm y el borde mide 37: faltaban cuentas.
     *
     * Así que se reparte por largo de arco, igual que el asa sobre su arco.
     * Cada cuenta de la tira se cose después a la cuenta del borde que le queda
     * enfrente, y en los escalones una cuenta del borde se lleva dos de la
     * tira, que es lo que se hace tejiendo.
     */
    /**
     * **El canto.** La tira no va escondida detrás del borde: va en el filo,
     * que es donde va en la cartera de verdad. Escondida entre las dos caras
     * casi no se veía, y solo asomaba a los tumbos donde el borde hace un
     * escalón — esos bultos sueltos alrededor del corazón.
     *
     * Se corre hacia afuera lo justo para que su primera y su última vuelta
     * queden a **un paso exacto** de las cuentas del borde de cada cara: como
     * esas vueltas caen medio paso adentro en z, lo que hay que correrse es
     * `paso·√3/2`. Ni encimada ni con el hilo al aire.
     *
     * Correrla es lo **primero**: recién sobre el canto ya corrido se reparten
     * las cuentas. Al revés —repartir y después correr— en las puntas del
     * corazón se abrían, porque una curva corrida hacia afuera se estira.
     */
    const salida = (paso * Math.sqrt(3)) / 2;
    const camino = borde.map((b) => ({ x: ejeX(b.col), y: alturaY(b.fila) }));

    /**
     * Para qué lado queda afuera. Sale del **sentido de giro** del borde: el
     * trazado le da la vuelta entera a la silueta siempre para el mismo lado,
     * así que el signo del área con signo lo dice de una vez para todas.
     *
     * Probar la máscara una celda hacia el costado —que fue lo primero que
     * hice— se equivoca en las diagonales y en los rincones: ahí la celda de al
     * lado también está llena, el normal se daba vuelta y la tira se metía
     * **detrás** de la cara, encimada 4 mm con las cuentas del borde.
     */
    const giro = vuelta.reduce((area, b, i) => {
      const a = { x: ejeX(b.col), y: alturaY(b.fila) };
      const sig = vuelta[(i + 1) % vuelta.length];
      const z = { x: ejeX(sig.col), y: alturaY(sig.fila) };
      return area + (a.x * z.y - z.x * a.y);
    }, 0);
    const manoDerecha = giro > 0;

    /** Perpendicular al recorrido, apuntando hacia afuera de la silueta. */
    const haciaAfuera = (i: number) => {
      const aqui = camino[i];
      const antes = camino[Math.max(0, i - 1)];
      const luego = camino[Math.min(camino.length - 1, i + 1)];
      const largo = Math.hypot(luego.x - antes.x, luego.y - antes.y);

      // La punta del corazón es un pico de **una cuenta de ancho**: el trazado
      // entra y sale por el mismo lado, la anterior y la siguiente son la misma
      // cuenta y la perpendicular no existe —da cero—. Ahí la tira se quedaba
      // sin correr y caía justo encima de la cuenta de la punta. Afuera, en un
      // pico, es seguir derecho para donde apunta.
      if (largo < 1e-6) {
        const ex = aqui.x - antes.x;
        const ey = aqui.y - antes.y;
        const puntero = Math.hypot(ex, ey) || 1;
        return { nx: ex / puntero, ny: ey / puntero };
      }

      const dx = (luego.x - antes.x) / largo;
      const dy = (luego.y - antes.y) / largo;
      return manoDerecha ? { nx: dy, ny: -dx } : { nx: -dy, ny: dx };
    };
    const canto = camino.map((punto, i) => {
      const n = haciaAfuera(i);
      return { x: punto.x + n.nx * salida, y: punto.y + n.ny * salida };
    });

    /**
     * Y sobre ese canto, una cuenta cada `paso` de recorrido: la tira **no
     * lleva una cuenta por cuenta del borde**, que no es lo mismo.
     *
     * El borde de una silueta va en escalera, y donde sube en diagonal dos
     * cuentas quedan a 1,4 pasos una de otra. Con una cuenta de tira por cada
     * una, la tira se estiraba justo ahí y **se veía el hilo**: 3,3 mm al aire
     * en 120 tramos. Las cuentas van siempre juntas — una tira de 39 cuentas
     * pegadas mide 30 cm y el canto mide 37: faltaban cuentas.
     */
    const acumulado = [0];
    for (let i = 1; i < canto.length; i++) {
      acumulado.push(
        acumulado[i - 1] + Math.hypot(canto[i].x - canto[i - 1].x, canto[i].y - canto[i - 1].y),
      );
    }
    const largoCanto = acumulado[acumulado.length - 1];
    // `ceil` y no `round`: así el paso entre cuentas queda siempre **igual o
    // menor** que el diámetro. Redondeando para abajo sobraban 0,05 mm y el
    // hilo asomaba, poco pero asomaba.
    const columnas = Math.max(2, Math.ceil(largoCanto / paso) + 1);

    /** El punto del canto que está a `avance` cm del arranque de la tira. */
    const puntoEn = (avance: number) => {
      let i = 1;
      while (i < acumulado.length - 1 && acumulado[i] < avance) i += 1;
      const tramo = acumulado[i] - acumulado[i - 1] || 1;
      const t = (avance - acumulado[i - 1]) / tramo;
      return {
        x: canto[i - 1].x + t * (canto[i].x - canto[i - 1].x),
        y: canto[i - 1].y + t * (canto[i].y - canto[i - 1].y),
      };
    };
    const enTira = Array.from({ length: columnas }, (_, c) =>
      puntoEn((largoCanto * c) / (columnas - 1)),
    );

    // La tira: tantas vueltas como profundidad.
    const vueltas = redondearMin1(D / paso);
    agregar("contorno", vueltas, columnas, (f, c) => [
      enTira[c].x,
      enTira[c].y,
      mitadD - (f + 0.5) * paso,
    ]);

    // Y la costura: cada cuenta de la tira contra la del borde que tiene
    // enfrente. Como la tira tiene más cuentas que el borde, en los escalones
    // hay cuentas del borde que reciben dos.
    const bordeMasCerca = (punto: { x: number; y: number }) => {
      let mejor = 0;
      let corta = Infinity;
      for (let i = 0; i < camino.length; i++) {
        const dist = Math.hypot(camino[i].x - punto.x, camino[i].y - punto.y);
        if (dist < corta) {
          corta = dist;
          mejor = i;
        }
      }
      return borde[mejor];
    };
    const enfrente = enTira.map(bordeMasCerca);
    frente.contorno = enfrente.map((b) => indiceEn(frente, b.fila, b.col));
    espalda.contorno = enfrente.map((b) => indiceEn(espalda, b.fila, b.col));
  } else if (forma === "cuadrada") {
    // --- La caja que se angosta hasta los aros ---
    // Base, frente, espalda y dos laterales. No hay solapa ni asa tejida: la
    // boca se junta en los dos aros de acero de las esquinas de arriba, y de
    // aro a aro va la cadena.
    //
    // **El fuelle no pierde cuentas.** Las mismas ocho de abajo llegan arriba;
    // lo que pasa es que las dos esquinas de arriba se juntan y el fuelle que
    // sobra **se dobla para adentro**, como la esquina de una bolsa de papel.
    // Lo dijo María: *"el ancho no debe encogerse por menos cuentas, sino que
    // son las mismas pero unes las esquinas superiores y eso hace que se doble
    // para adentro"*.
    //
    // Antes se disminuía —una cuenta de cada lado cada cuatro filas— y estaba
    // mal: eso angosta el fuelle en vez de doblarlo.
    const largoFuelle = (filasBase - 1) * paso;
    // Lo más cerrado que se puede doblar una tela de cuentas: de una capa del
    // doblez a la otra tiene que entrar una cuenta.
    const radioDoblez = paso / 2;
    /**
     * El cuello mide **el ancho del fuelle más dos filas**. El ancho del fuelle
     * es el pliegue propiamente dicho: en una bolsa de papel las diagonales van
     * a 45°, y eso es exactamente lo que sale cuando el alto del cuello iguala
     * al ancho del fuelle. Las dos filas de más son la **entrada**: sin ellas,
     * la primera fila del pliegue pandea de golpe y ahí se abre el hilo casi un
     * milímetro. Con ellas, 0,6 mm — lo mismo que las otras carteras traen
     * desde siempre adentro del asa. Debajo del cuello es una caja recta.
     */
    const filasCuello = Math.min(filasCuerpo - 1, filasBase + 2);
    const desdeCuello = filasCuerpo - filasCuello;
    const szAbajo = largoFuelle / 2;
    const szArriba = paso / 2;

    /**
     * Media separación entre las dos puntas del fuelle, fila por fila: de todo
     * el fuelle desplegado abajo a una sola cuenta arriba, que es "unir las
     * esquinas".
     *
     * **Arranca despacio, al cuadrado.** Con una rampa derecha, la primera fila
     * del cuello ya pandea de golpe —el doblez salta de 0 a 1,3 cm— y entre esa
     * fila y la de abajo se abre el hilo 3,3 mm. Es que el doblez sale de una
     * raíz: cuando las puntas recién empiezan a juntarse, un pelo de acercarse
     * mete muchísimo el doblez. Entrando al cuadrado, esa raíz se compensa y el
     * doblez crece parejo, que es lo que dicen las diagonales rectas del
     * pliegue de bolsa.
     */
    const separacionEn = (f: number) => {
      if (f < desdeCuello) return szAbajo;
      const u = (f - desdeCuello + 1) / filasCuello;
      return szAbajo - (szAbajo - szArriba) * u * u;
    };

    // Se resuelve una vez por fila: el doblez, dónde caen sus cuentas, a qué
    // distancia quedan las paredes y a qué altura cae la fila. La altura se
    // acumula **por largo de tejido**: en el cuello la pared va inclinada, así
    // que una fila y la de arriba están a un paso sobre la pared pero a menos
    // de un paso de altura.
    type FilaCuerpo = { z: number; y: number; en: (s: number) => { dentro: number; z: number } };
    const fuelles: FilaCuerpo[] = [];
    let altura = paso / 2;
    for (let f = 0; f < filasCuerpo; f++) {
      const sz = separacionEn(f);
      const z = sz + paso / 2;
      if (f > 0) {
        const cierra = fuelles[f - 1].z - z;
        altura += Math.sqrt(Math.max(0, paso * paso - cierra * cierra));
      }
      fuelles.push({ z, y: altura, en: fuelleDoblado(sz, largoFuelle, radioDoblez).en });
    }

    // 1. Base: el fondo, que no se dobla.
    agregar("base", filasBase, cols, (f, c) => [ejeX(c), 0, ejeZ(f)]);

    // 2 y 3. Frente y espalda, apoyados sobre el perfil: rectos abajo y
    // juntándose en el cuello hasta tocarse en las esquinas de arriba.
    agregar("frente", filasCuerpo, cols, (f, c) => [ejeX(c), fuelles[f].y, fuelles[f].z]);
    agregar("espalda", filasCuerpo, cols, (f, c) => [ejeX(c), fuelles[f].y, -fuelles[f].z]);

    // 4. Los fuelles: **siempre las ocho cuentas**, repartidas por largo sobre
    // el camino doblado. Abajo el camino es recto y da la misma grilla de
    // siempre; arriba se dobla hacia adentro y las cuentas lo siguen.
    //
    // La columna 0 va contra la espalda y la última contra el frente, igual que
    // `ejeZ` en la caja: así las cuatro costuras de esquina calzan.
    const ubicarFuelle =
      (lado: 1 | -1) =>
      (f: number, c: number): [number, number, number] => {
        const { dentro, z } = fuelles[f].en(c * paso);
        return [lado * (mitadW - dentro), fuelles[f].y, z];
      };
    agregar("lateralIzq", filasCuerpo, filasBase, ubicarFuelle(-1));
    agregar("lateralDer", filasCuerpo, filasBase, ubicarFuelle(1));

    // 5. Los aros y la cadena. No son cuentas: son las piezas de acero.
    herrajes = herrajesCuadrada(medidas, paso, {
      x: mitadW,
      y: fuelles[filasCuerpo - 1].y,
      aro: (medidas.aroCm ?? D / 2) / 2,
    });
  } else {
    // 1. Base: la pieza rectangular sobre la que se levanta todo.
    agregar("base", filasBase, cols, (f, c) => [ejeX(c), 0, ejeZ(f)]);

    // 2 y 3. Frente y espalda: paredes largas.
    agregar("frente", filasCuerpo, cols, (f, c) => [ejeX(c), (f + 0.5) * paso, mitadD]);
    agregar("espalda", filasCuerpo, cols, (f, c) => [ejeX(c), (f + 0.5) * paso, -mitadD]);

    // 4. Laterales: cierran el volumen entre frente y espalda.
    agregar("lateralIzq", filasCuerpo, filasBase, (f, c) => [-mitadW, (f + 0.5) * paso, ejeZ(c)]);
    agregar("lateralDer", filasCuerpo, filasBase, (f, c) => [mitadW, (f + 0.5) * paso, ejeZ(c)]);

    // 5. Solapa: cruza el techo y baja por el frente, apoyada sobre las
    // paredes. **`altoSolapaCm: 0` es una caja sin solapa**, abierta arriba:
    // no se teje la pieza, y las costuras y los pasos de armado que la nombran
    // se caen solos porque salen del layout.
    if (medidas.altoSolapaCm > 0) {
      const largoSolapa = D + medidas.altoSolapaCm;
      const filasSolapa = redondearMin1(largoSolapa / paso);
      const puntoSolapa = recorridoSolapa(
        { techo: (filasCuerpo - 0.5) * paso, frente: mitadD, espalda: -mitadD },
        paso,
      );
      agregar("solapa", filasSolapa, cols, (f, c) => {
        const { y, z } = puntoSolapa((f + 0.5) * paso);
        return [ejeX(c), y, z];
      });
    }
  }

  // 6. Las asas: un tubo de 4 cuentas por vuelta siguiendo el arco. Las
  // cuentas van pegadas, igual que en el resto de la cartera: una vuelta cada
  // diámetro a lo largo del arco, y el radio del tubo es el que hace que las
  // cuatro de la vuelta se toquen entre sí.
  //
  // **Cuántas asas lo decide la boca.** Una cartera que abre por todo el borde
  // de arriba no puede llevar una sola cruzada por el medio: le pasaría justo
  // por encima de la boca. Lleva dos, una sobre cada cara, y se abre entre las
  // dos. Lo pidió María: *"en lugar de una correa central, mejor una de un lado
  // y otra del otro"*. La que cierra con solapa sigue con una sola y centrada,
  // que es donde apoya: ahí no hay boca que tapar.
  //
  // Cada asa mide `asaCm`, como cualquier asa: son dos asas, no una partida.
  const diametro = medidas.cuentaMm / 10;
  const porVuelta = 4;
  // Para que dos cuentas vecinas de la vuelta se toquen, lo que tiene que
  // medir un diámetro es la **cuerda** entre sus centros, no el arco.
  const radioTubo = diametro / (2 * Math.sin(Math.PI / porVuelta));

  /**
   * Dónde se ata el asa.
   *
   * Se ata sobre **la cuenta más alta que ya haya** —la solapa en la caja, la
   * fila de arriba de las caras en el corazón—, no sobre la medida nominal:
   * `altoCm` no es donde termina el tejido, la última fila cae medio paso más
   * abajo. Colgada de la medida, el asa quedaba flotando y **se veía el hilo de
   * las argollas**; y las cuentas van siempre juntas.
   *
   * Tan arriba como se pueda sin que el hilo asome: el tubo se abre `radioTubo`
   * hacia los costados, así que de altura solo le queda
   * `√(diámetro² − radioTubo²)`, y de eso hay que descontar lo que sube la
   * primera vuelta sobre el anclaje (media vuelta, medio diámetro). Y la **x se
   * pega al centro de una columna**: atada entre dos, no llegaba a ninguna.
   */
  const tapada = rejillas.some((r) => r.panel === "solapa");
  // Las siluetas pueden tener un pétalo o un lóbulo alto en el centro. El asa
  // se sostiene sobre los hombros laterales, no desde ese pico: así sus cuatro
  // cuentas de arranque quedan pegadas a la cara y no dejan hilos largos.
  const candidatasAncla = tapada
    ? cuentas
    : cuentas.filter(
        (c) =>
          (c.panel === "frente" || c.panel === "espalda") &&
          Math.abs(c.pos[0]) >= medidas.anchoCm * 0.16,
      );
  const arriba = candidatasAncla.reduce((max, c) => Math.max(max, c.pos[1]), -Infinity);
  /**
   * **El asa nace adentro, no de las esquinas.** De todas las cuentas de más
   * arriba se elige la que caiga más cerca de poco más de un cuarto del ancho
   * contando del centro. Lo pidió María mirando la Básica y la Orca: *"las asas
   * van centradas, no a los extremos"*.
   *
   * Quedarse con la cuenta más alta a secas no alcanza: arriba hay una fila
   * entera a la misma altura y la primera que aparece es la de la punta, así
   * que el asa salía de las dos esquinas del todo —a 9,35 cm del centro en una
   * cartera de 18— y la cartera parecía colgada de las orejas.
   */
  const anclaIdeal = medidas.anchoCm * 0.28;
  const lejosDelIdeal = (c: Cuenta) => Math.abs(Math.abs(c.pos[0]) - anclaIdeal);
  const cuentaAncla = candidatasAncla
    .filter((c) => c.pos[1] >= arriba - diametro / 2)
    .reduce(
      (mejor, cuenta) => (lejosDelIdeal(cuenta) < lejosDelIdeal(mejor) ? cuenta : mejor),
      candidatasAncla[0] ?? cuentas[0],
    );
  const alturaLibre = Math.sqrt(diametro * diametro - radioTubo * radioTubo) - diametro / 2;
  const ancla = { x: Math.abs(cuentaAncla.pos[0]), y: cuentaAncla.pos[1] + alturaLibre };

  for (const asa of asasDeLayout(forma, tapada, mitadD)) {
    if (medidas.asaCm <= 0) break;
    const arco = recorridoAsa(medidas, paso, ancla);
    // Las vueltas se cuentan por el borde de afuera, que es el que se ve.
    const pasosAsa = redondearMin1(arco.largoConRadio(radioTubo) / diametro);
    agregar(asa.panel, pasosAsa, porVuelta, (f, c) => {
      const avance = (f + 0.5) * (arco.largoTotal / pasosAsa);
      const centro = arco.porLargo(avance);
      // La misma normal con la que se repartieron las vueltas: así la columna
      // 0 del tubo es la de afuera de la curva, que es la que se ve.
      const { x: nx, y: ny } = arco.normalEn(avance / arco.largoTotal);
      const angulo = (c / porVuelta) * Math.PI * 2;
      return [
        centro.x + nx * radioTubo * Math.cos(angulo),
        centro.y + ny * radioTubo * Math.cos(angulo),
        // El arco se traza en el plano del medio; cada asa se corre al suyo.
        centro.z + asa.z + radioTubo * Math.sin(angulo),
      ];
    });
  }

  // La cadena sube más que la última cuenta: si no entra acá, la cámara la
  // recorta en el catálogo.
  const altoTotal = (herrajes ?? []).reduce(
    (max, h) => Math.max(max, h.pos[1] + h.radio + h.grosor),
    cuentas.reduce((max, c) => Math.max(max, c.pos[1]), 0),
  );

  return { medidas, forma, paso, cuentas, rejillas, altoTotal, herrajes };
}

/**
 * Un tramo de hilo entre dos cuentas vecinas. Guarda las cuentas enteras, no
 * solo su posición, porque el índice de cada una dice en qué momento del
 * tejido aparece — que es lo que usa la reproducción paso a paso.
 */
export type Hilo = { a: Cuenta; b: Cuenta };

/**
 * Un borde de una pieza, nombrado como se ve en la cuadrícula del mapa: la
 * fila 1 se dibuja abajo y la columna 1 a la izquierda.
 */
export type Borde =
  | "primeraFila"
  | "ultimaFila"
  | "primeraColumna"
  | "ultimaColumna"
  /** Toda la vuelta de una pieza con silueta. No es un lado: es el perímetro. */
  | "contorno";

export type Costura = {
  a: Panel;
  bordeA: Borde;
  b: Panel;
  bordeB: Borde;
  /** Qué se está cerrando, en criollo. */
  nota: string;
};

/**
 * Qué borde va cosido con qué borde. **Esta lista es la única fuente**: de acá
 * salen los hilos de unión del 3D y las marcas del mapa de tejido, así que no
 * pueden decir cosas distintas.
 *
 * Los dos bordes de cada costura se recorren en el mismo sentido, cuenta contra
 * cuenta.
 */
const COSTURAS_CAJA: Costura[] = [
  {
    a: "base", bordeA: "ultimaFila",
    b: "frente", bordeB: "primeraFila",
    nota: "Levanta el frente desde el borde delantero de la base.",
  },
  {
    a: "base", bordeA: "primeraFila",
    b: "espalda", bordeB: "primeraFila",
    nota: "Levanta la espalda desde el borde opuesto.",
  },
  {
    a: "base", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "primeraFila",
    nota: "Levanta el lateral izquierdo desde el borde corto de la base.",
  },
  {
    a: "base", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "primeraFila",
    nota: "Levanta el lateral derecho desde el otro borde corto.",
  },
  {
    a: "frente", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "ultimaColumna",
    nota: "Cierra la esquina delantera izquierda.",
  },
  {
    a: "frente", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "ultimaColumna",
    nota: "Cierra la esquina delantera derecha.",
  },
  {
    a: "espalda", bordeA: "primeraColumna",
    b: "lateralIzq", bordeB: "primeraColumna",
    nota: "Cierra la esquina trasera izquierda.",
  },
  {
    a: "espalda", bordeA: "ultimaColumna",
    b: "lateralDer", bordeB: "primeraColumna",
    nota: "Cierra la esquina trasera derecha.",
  },
  {
    a: "espalda", bordeA: "ultimaFila",
    b: "solapa", bordeB: "primeraFila",
    nota: "La bisagra: la solapa nace del borde superior de la espalda.",
  },
];

/**
 * El corazón se cose distinto: no hay bordes que se levanten desde una base,
 * hay una tira que da la vuelta y separa las dos caras.
 */
const COSTURAS_CORAZON: Costura[] = [
  {
    a: "contorno", bordeA: "primeraFila",
    b: "frente", bordeB: "contorno",
    nota: "Cose la tira del contorno al borde de la cara delantera, de un costado de la boca al otro.",
  },
  {
    a: "contorno", bordeA: "ultimaFila",
    b: "espalda", bordeB: "contorno",
    nota: "Y del otro lado de la tira, la cara trasera: eso es lo que le da la profundidad.",
  },
];

/**
 * Qué asas lleva y sobre qué plano va cada una. Sale de la forma, igual que
 * las costuras: la que abre por arriba lleva dos —una por cara, para dejar la
 * boca libre— y la que cierra con solapa, una sola centrada.
 */
function asasDeLayout(
  forma: "caja" | "corazon" | "tulipan" | "fresa" | "circulo" | "cuadrada",
  tapada: boolean,
  mitadD: number,
): { panel: Panel; z: number }[] {
  // La cuadrada cuelga de una cadena: no hay asa tejida que armar.
  if (forma === "cuadrada") return [];

  // La fresa abre por arriba: lleva dos asas, una sobre cada cara, para dejar
  // libre la boca. Cada una se cose contra su propia cara.
  if (forma === "fresa" || forma === "circulo") {
    return [
      { panel: "asaFrente", z: mitadD },
      { panel: "asaEspalda", z: -mitadD },
    ];
  }

  // **Lo decide si la cartera está tapada arriba, no la forma.** Sobre una
  // solapa hay dónde apoyar el asa, y va una sola cruzada por el medio. Sin
  // tapa no hay nada en el medio: el asa quedaría colgada sobre la boca y sus
  // argollas tendrían que estirarse hasta la pared —28 mm de hilo al aire en
  // la caja abierta— además de taparle la boca. Ahí van dos, una por cara.
  return tapada
    ? [{ panel: "asa", z: 0 }]
    : [
        { panel: "asaFrente", z: mitadD },
        { panel: "asaEspalda", z: -mitadD },
      ];
}

/**
 * La cuadrada se cose **como la caja pero sin la bisagra de la solapa**, que no
 * lleva. Sale de la misma lista y no de una copia, así no pueden discrepar.
 */
const COSTURAS_CUADRADA: Costura[] = COSTURAS_CAJA.filter(
  (c) => c.a !== "solapa" && c.b !== "solapa",
);

/** Qué se cose con qué en esta cartera. Depende de la forma con la que se armó. */
export function costurasDeLayout(layout: LayoutCartera): Costura[] {
  // Una costura contra una pieza que esta cartera no tiene —la solapa, cuando
  // `altoSolapaCm` es 0— no existe. Se filtra acá, que es la única fuente.
  const hay = new Set(layout.rejillas.map((r) => r.panel));
  return listaDeCosturas(layout).filter((c) => hay.has(c.a) && hay.has(c.b));
}

function listaDeCosturas(layout: LayoutCartera): Costura[] {
  if (layout.forma === "corazon" || layout.forma === "tulipan" || layout.forma === "fresa" || layout.forma === "circulo") return COSTURAS_CORAZON;
  if (layout.forma === "cuadrada") return COSTURAS_CUADRADA;
  return COSTURAS_CAJA;
}

/** Las cuentas de un borde, en orden. Los dos lados de una costura calzan. */
export function cuentasDelBorde(layout: LayoutCartera, panel: Panel, borde: Borde) {
  const r = layout.rejillas.find((x) => x.panel === panel);
  if (!r) return [];
  // En una pieza con silueta el borde es el perímetro, ya recorrido en orden.
  if (borde === "contorno") return (r.contorno ?? []).map((i) => layout.cuentas[i]);

  const filas = Array.from({ length: r.filas }, (_, f) => f);
  const cols = Array.from({ length: r.cols }, (_, c) => c);

  /**
   * El borde **saltea los huecos**: es la primera cuenta que hay, no la de la
   * columna 0. En un rectángulo lleno da exactamente lo mismo de antes, y en
   * una pieza que se angosta —el lateral de la cuadrada— sigue el contorno de
   * verdad, que es contra lo que se cose la pared.
   */
  const buscar = (cuantos: number, leer: (i: number) => number, alReves = false) => {
    for (let k = 0; k < cuantos; k++) {
      const i = leer(alReves ? cuantos - 1 - k : k);
      if (i >= 0) return layout.cuentas[i];
    }
    return undefined;
  };
  const enFila = (f: number, alReves = false) =>
    buscar(r.cols, (c) => indiceEn(r, f, c), alReves);
  const enColumna = (c: number, alReves = false) =>
    buscar(r.filas, (f) => indiceEn(r, f, c), alReves);
  const sinHuecos = (lista: (Cuenta | undefined)[]) => lista.filter((x): x is Cuenta => !!x);

  switch (borde) {
    case "primeraFila":
      return sinHuecos(cols.map((c) => enColumna(c)));
    case "ultimaFila":
      return sinHuecos(cols.map((c) => enColumna(c, true)));
    case "primeraColumna":
      return sinHuecos(filas.map((f) => enFila(f)));
    case "ultimaColumna":
      return sinHuecos(filas.map((f) => enFila(f, true)));
  }
}

/**
 * El recorrido del hilo. En tejido en cruz cada cuenta se asegura pasando el
 * hilo por las de los costados, así que el hilo une cada cuenta con la de su
 * derecha y con la de abajo: dentro de la cuenta va escondido y solo asoma en
 * el hueco que queda entre una y otra.
 *
 * En el asa, que es un tubo, además se cierra el anillo de cada vuelta.
 */
export function armarHilos(layout: LayoutCartera): Hilo[] {
  const hilos: Hilo[] = [];
  const porPanel = new Map(layout.rejillas.map((r) => [r.panel, r]));

  const unir = (a: Cuenta, b: Cuenta) => hilos.push({ a, b });

  // --- Tejido de cada pieza ---
  for (const rejilla of layout.rejillas) tejerPieza(layout, rejilla, unir);

  // --- Costuras: lo que en el pliego es "unir las piezas" ---
  for (const costura of costurasDeLayout(layout)) {
    const ladoA = cuentasDelBorde(layout, costura.a, costura.bordeA);
    const ladoB = cuentasDelBorde(layout, costura.b, costura.bordeB);
    const pares = Math.min(ladoA.length, ladoB.length);
    for (let i = 0; i < pares; i++) unir(ladoA[i], ladoB[i]);
  }

  // Las argollas del asa no son una costura borde con borde: cada punta se ata
  // a la cuenta del cuerpo que le queda más cerca. Con dos asas, cada una cae
  // sobre su cara y encuentra sola las cuentas de esa cara.
  for (const asa of layout.rejillas.filter((r) => esAsa(r.panel))) {
    // Cada asa abierta se cose contra su propia cara. Buscar en todo el cuerpo
    // podía engancharla al contorno o a la otra cara y dibujaba hilos cruzados.
    const cara = asa.panel === "asaFrente" ? "frente" : asa.panel === "asaEspalda" ? "espalda" : undefined;
    const delCuerpo = cara
      ? layout.cuentas.filter((c) => c.panel === cara)
      : layout.cuentas.filter((c) => !esAsa(c.panel));
    for (const fila of [0, asa.filas - 1]) {
      for (let c = 0; c < asa.cols; c++) {
        const punta = layout.cuentas[indiceEn(asa, fila, c)];
        unir(punta, masCercana(punta.pos, delCuerpo));
      }
    }
  }

  return hilos;
}

/** El tejido de una sola pieza: cada cuenta con la de su derecha y la de abajo. */
function tejerPieza(
  layout: LayoutCartera,
  rejilla: Rejilla,
  unir: (a: Cuenta, b: Cuenta) => void,
) {
  const { filas, cols, panel } = rejilla;
  const aqui = (f: number, c: number) => layout.cuentas[indiceEn(rejilla, f, c)];
  // El asa es tubular: la última cuenta de cada vuelta cierra con la primera.
  const cierraVuelta = esAsa(panel) && cols > 2;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      // En una pieza con silueta hay celdas vacías: no hay hilo desde un hueco.
      const desde = aqui(f, c);
      if (!desde) continue;
      const derecha = c + 1 < cols ? aqui(f, c + 1) : cierraVuelta ? aqui(f, 0) : undefined;
      if (derecha) unir(desde, derecha);
      const abajo = f + 1 < filas ? aqui(f + 1, c) : undefined;
      if (abajo) unir(desde, abajo);
    }
  }
}

/** La cuenta del grupo que queda más cerca de un punto. */
function masCercana(punto: Cuenta["pos"], entre: Cuenta[]) {
  let elegida = entre[0];
  let menor = Infinity;
  for (const candidata of entre) {
    const d =
      (candidata.pos[0] - punto[0]) ** 2 +
      (candidata.pos[1] - punto[1]) ** 2 +
      (candidata.pos[2] - punto[2]) ** 2;
    if (d < menor) {
      menor = d;
      elegida = candidata;
    }
  }
  return elegida;
}

/**
 * En qué momento del tejido aparece un tramo: cuando ya están puestas sus dos
 * cuentas. Sirve para reproducir el armado sin recalcular nada por cuadro.
 */
export function apareceEn(hilo: Hilo) {
  return Math.max(hilo.a.i, hilo.b.i);
}

/**
 * El índice de la última cuenta puesta cuando la reproducción va por `n`.
 *
 * La reproducción avanza con decimales y se dibuja mostrando las cuentas con
 * índice **menor que `n`**: con n = 7,4 hay ocho puestas y la última es la 7.
 * **Todo lo que señale "acá está la labor" tiene que pasar por acá**, o queda
 * apuntando a la cuenta anterior.
 */
export function ultimaPuesta(n: number) {
  return Math.ceil(n) - 1;
}

/** Qué se está tejiendo cuando ya se pusieron `cuantas` cuentas. */
export function loQueSeTeje(layout: LayoutCartera, cuantas: number) {
  const i = Math.min(Math.max(ultimaPuesta(cuantas), 0), layout.cuentas.length - 1);
  const cuenta = layout.cuentas[i];
  const rejilla = layout.rejillas.find((r) => r.panel === cuenta.panel);
  return {
    panel: cuenta.panel,
    nombre: NOMBRE_PANEL[cuenta.panel],
    fila: cuenta.fila + 1,
    filas: rejilla?.filas ?? 0,
    col: cuenta.col + 1,
    cols: rejilla?.cols ?? 0,
  };
}

/** Cuántas cuentas lleva cada panel. Para la lista de materiales del panel. */
export function conteoPorPanel(layout: LayoutCartera) {
  return layout.rejillas.map((r) => ({
    panel: r.panel,
    nombre: NOMBRE_PANEL[r.panel],
    filas: r.filas,
    cols: r.cols,
    total: r.total,
  }));
}
