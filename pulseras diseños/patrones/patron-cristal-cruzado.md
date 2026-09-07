# Cristal cruzado: una hilera RAW

Referencia técnica: [Right Angle Weave — Artbeads, diagrama de 2014](https://artbeads.com/content/tutorial-pdfs/2014-right-angle-weave-diagram.pdf).

La unidad básica es un anillo de cuatro cuentas. Cada unidad siguiente comparte una cuenta con la anterior y añade tres. Esta adaptación usa biconos de 4 mm y dos papeles de color: laterales y uniones. Es una versión de una hilera del punto básico.

## Secuencia

1. Cerrar la primera unidad alternando unión, lateral, unión y lateral.
2. Recorrerla hasta alcanzar la unión desde la que continúa la tira.
3. Añadir los tres cristales de la siguiente unidad y volver por la unión compartida.
4. Continuar con unidades completas, reforzar el hilo y rematar con el cierre.

El diagrama enlazado muestra las pasadas de aguja y los cambios de dirección.

## Datos de esta adaptación digital

La cuenta compartida se almacena una sola vez. Para N unidades hay 3N + 1 cristales: 2N laterales y N + 1 uniones. El conteo para cada largo sale de `src/lib/pulsera/raw.ts`.

Las cuentas laterales se orientan a lo largo de la pulsera; las uniones, a través de su ancho. El hilo dibujado conecta los extremos de sus agujeros. La holgura geométrica usada en la vista 3D es del 10 % del tamaño del cristal: es un parámetro de esta adaptación, no una medida publicada por Artbeads.

La tira se curva en el plano de la pulsera y reserva el espacio del cierre existente. La cadena de extensión permite ajustar el largo resultante. La ficha del modelo calcula los materiales y medidas desde esta misma geometría.
