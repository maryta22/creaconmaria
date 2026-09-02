---
name: ficha-diseno
description: Extraer la ficha .md de un pliego de patrón de bisutería (imagen) para no volver a analizar la misma imagen. Usar cuando se agrega un diseño nuevo a "carteras diseños/" o a cualquier carpeta de diseños, o cuando piden "sacá la ficha de este diseño".
---

# Ficha de diseño

Convierte un pliego de patrón (imagen) en un `.md` legible, para que las
próximas sesiones lean texto en vez de volver a mirar la imagen.

## Cuándo NO usarla

Si la ficha `.md` ya existe para esa imagen, leela y listo. Solo volvé a
extraer si María lo pide explícitamente o si cambió la imagen.

## Pasos

1. Ubicá las imágenes sin ficha: por cada `X.jpg` / `X.png` en la carpeta de
   diseños, mirá si existe `X.md`. Trabajá solo sobre las que faltan.
2. Leé la imagen **una sola vez** con la herramienta Read.
3. Escribí `X.md` — mismo nombre base que la imagen, misma carpeta — con esta
   estructura:

```markdown
---
imagen: X.jpg
modelo: <nombre que dice el pliego>
tipo: cartera | pulsera | collar | colgador | guia
categoria: CARTERA | PULSERA | COLLAR | COLGADOR
tecnica: <tejido en cruz, etc.>
extraido: <AAAA-MM-DD>
---

# <Título del pliego>

<Una o dos frases: qué es y en qué se diferencia de los otros modelos.>

## Medidas finales
<Tabla: ancho / alto / profundidad / largo del asa.>

## Materiales
<Lista textual del pliego, con tamaños y colores.>

## Consumo aproximado de cuentas
<Tabla tamaño / color / cantidad, más el total.>

## Patrón por partes
<Tabla pieza / ancho / alto / nota.>

## Armado
<Los pasos numerados del pliego.>

## Broche decorativo frontal
<Si lo tiene.>

## Tips
<Los del pliego.>
```

4. Actualizá la tabla de `README.md` de esa carpeta con una fila del modelo
   nuevo (medidas, asa, cierre, total de cuentas, link a la ficha).

## Reglas

- **Copiá los números tal cual del pliego.** Si un dato no está, omití la fila;
  no lo estimes ni lo inventes.
- Si el pliego es una guía de armado y no un modelo vendible, poné
  `tipo: guia` y decilo en la primera frase.
- Enlazá con `[texto](otra-ficha.md)` los modelos que comparten construcción.
- La ficha va en español, igual que el resto del repo.

## Después

Con la ficha lista, cargar la pieza en la tienda es directo: los campos del
panel (`ancho`, `alto`, `profundidad`, `largo del asa`, `cuenta mm`,
`materiales`) salen tal cual de las tablas de la ficha.
