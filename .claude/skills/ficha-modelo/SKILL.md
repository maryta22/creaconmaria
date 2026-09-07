---
name: ficha-modelo
description: Escribir (o rehacer) la ficha .md de un modelo de cartera que vive en el código, con los números sacados del propio código. Usar cada vez que se agrega un modelo nuevo a MODELOS en src/lib/cartera/modelos.ts, y cuando a un modelo ya cargado le cambian las medidas, la silueta, la paleta o el dibujo. No usar para pliegos en imagen: para eso está /ficha-diseno.
---

# Ficha de un modelo de cartera

Cada modelo de `MODELOS` tiene que tener su `.md` en
`carteras diseños/carteras/<slug>.md`. **Un modelo sin ficha no está
terminado.**

La ficha es lo que María imprime y lo que las próximas sesiones leen: CLAUDE.md
dice *"leé el `.md`; abrí la imagen solo si necesitás ver el dibujo"*. Si no
existe, la única forma de saber cuántas cuentas lleva la cartera es volver a
correr el motor.

## La regla que ordena todo lo demás

**Ningún número de la ficha se escribe a mano.** Las medidas, las grillas de
cada pieza, los conteos, la lista de compras y los pasos de armado **se
calculan** desde `armarLayout()`, `motivoInicial()` y `pasosDeArmado()`. Hay un
script que los imprime todos juntos, listo para copiar.

No es prolijidad: es que se desincronizan. Ya pasó. La ficha del Corazón siguió
mostrando la cuadrícula vieja —332 cuentas por cara— después de que la silueta
cambiara a 305, y nadie lo notó hasta que se contaron las cuentas del render.
La ficha decía una cartera y el código tejía otra.

## Cuándo se dispara

- Se agregó una entrada nueva a `MODELOS` en `src/lib/cartera/modelos.ts`.
- A un modelo ya cargado le cambiaron **las medidas, la silueta, la paleta o el
  dibujo**: la ficha vieja quedó mintiendo y hay que rehacerla.
- María pide "sacale la ficha a este modelo".

## Cuándo NO

- El diseño viene de un **pliego en imagen**: eso es `/ficha-diseno`, que lee la
  foto. Esta skill lee el código.
- Es un pliego de **punto** (cómo se teje, sin medidas): va en
  `carteras diseños/patrones/` y tampoco es acá.
- Cambió solo el precio o el stock: eso es la pieza de la tienda, no la ficha.

## Pasos

### 1. El modelo tiene que declarar su ficha

En su entrada de `MODELOS`:

```ts
ficha: "carteras diseños/carteras/<slug>.md",
```

Sin eso el diseñador no sabe de dónde salió la cartera.

### 2. Que el patrón exista en la base

Agregá el slug a `CARTERAS_ACTIVAS` en `prisma/seed.ts` y sembrá:

```bash
npm run db:seed
```

Sin esto el modelo no aparece en `/admin/disenador` y no hay mapa para imprimir.

### 3. Sacar los números

```bash
npx tsx .claude/skills/ficha-modelo/numeros.ts <slug>
```

Imprime, todo desde el código: medidas, una línea por pieza con su grilla y su
conteo, el total, la lista de compras por color, la cuadrícula de cada pieza que
no sea lisa —con una letra por color, `·` donde no va cuenta—, los pasos de
armado y dos controles de geometría.

Corré esto **antes** de escribir una sola línea de la ficha.

### 4. Escribir la ficha

`carteras diseños/carteras/<slug>.md`, con esta estructura:

```markdown
---
modelo: Modelo <Nombre>
tipo: cartera
categoria: CARTERA
tecnica: tejido en cruz
definido: <AAAA-MM-DD>
---

# Cartera de cuentas — Modelo <Nombre>

<Una o dos frases: qué es y en qué se diferencia de las otras. Enlazá con
[Básico](basico.md) o la que comparta construcción.>

## <Por qué es así>

<Las decisiones que no se leen en una tabla y que alguien va a querer cambiar
sin saber por qué están: por qué no lleva solapa, por qué son dos asas, por
qué la boca llega hasta donde llega. Si una la pidió María, escribilo con sus
palabras.>

## El dibujo            ← solo si lleva motivo

<La cuadrícula, tal cual sale del script. Debajo, qué mira cada parte del
dibujo y si en la espalda va espejada.>

## Medidas finales

<Tabla: ancho / alto / profundidad / solapa / largo del asa / cuenta.>

## Las piezas

<Tabla pieza / grilla / cuentas, con el total. Copiada del script.>

## Lista de compras

<Tabla cuenta / cantidad, con el total. Copiada del script.>

## Armado

<Los pasos numerados que imprime el script.>

## Técnica

Tejido en cruz, con el hilo doblado al medio y los dos extremos cruzándose en
la cuenta que cierra cada unidad. Las cuentas van **apretadas una contra otra**.

## En la app

Está en el diseñador 3D, en `/admin/disenador/<slug>`, con su mapa de tejido.
```

### 5. Enganchar la ficha con el resto

- Agregá una fila del modelo nuevo a la tabla de `carteras diseños/README.md`.
- Enlazá desde y hacia las fichas que comparten construcción.

## Los dos controles de geometría

El script termina con dos números que **tienen que dar cerca de cero**:

```
hilo a la vista:    hasta X mm
cuentas encimadas:  hasta Y mm
```

Salen de medir, tramo por tramo, la distancia entre las dos cuentas que une
cada hilo, contra el diámetro de la cuenta.

- **Hilo a la vista** es que dos cuentas cosidas quedaron a más de un diámetro:
  entre ellas se ve el nylon. María fue explícita: *"que no quede hilo
  expuesto, las cuentas van siempre juntas"*.
- **Cuentas encimadas** es lo contrario, dos cuentas más cerca que un diámetro:
  una se mete dentro de la otra y en el 3D se ven fundidas.

Si alguno da grande, **decilo en el reporte con el número**. No lo escondas en
la ficha ni lo maquilles: es un defecto del modelo, no de la ficha. Arreglarlo
suele ser mover una pieza contra la otra en `armarLayout()`, y eso mueve todas
las carteras: preguntá antes.

## Reglas

- **Ni un número tipeado a mano.** Si el script no lo imprime, o lo agregás al
  script o no va en la ficha.
- **La ficha es una foto del modelo de hoy.** Si el modelo cambia, se rehace
  entera; no se le parcha una tabla.
- El **dibujo** va en la ficha como cuadrícula de texto, igual que en el código.
  Así se corrige una cuenta cambiando un caracter y las dos versiones se pueden
  comparar de un vistazo.
- Contá **por qué**, no solo cuánto. Las tablas las regenera el script; las
  decisiones se pierden si no las escribe alguien.
- Todo en español, como el resto del repo.
- Si el modelo salió de un pliego en imagen, la ficha lo cita con
  `imagen: <archivo>` en el frontmatter y enlaza al pliego.

## Después

Con la ficha lista, cargar la pieza en la tienda es directo: los campos del
panel (`ancho`, `alto`, `profundidad`, `largo del asa`, `cuenta mm`,
`materiales`) salen tal cual de sus tablas. El precio y el costo no: esos los
pone María.
