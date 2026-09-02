---
name: discovery
description: Poner al día el discovery del repo — CLAUDE.md y los README de índice — contra lo que el código dice hoy. Usar al cerrar un bloque de trabajo que agregó rutas, libs o carpetas, antes de commitear, o cuando piden "actualizá el discovery / CLAUDE.md / la doc".
---

# Discovery al día

El **discovery** es lo que una sesión nueva lee antes de tocar código: `CLAUDE.md`
en la raíz y los `README.md` que hacen de índice de carpeta. Si eso miente, la
sesión siguiente arranca equivocada y no se entera.

Esta skill compara la doc contra el repo y **escribe solo las diferencias**.

## Qué entra y qué no

CLAUDE.md guarda lo que **no se deduce leyendo el código**:

- decisiones y su porqué (negro como acción, oro solo de acento);
- números mágicos y qué gobiernan (`separacion: 1.3`, `font-size: 112.5%`);
- fuentes únicas de verdad (`COSTURAS`, `categorias.ts`, `medidaCorta()`);
- trampas: "si cambiás el orden de `armarLayout()` los patrones guardados quedan
  corridos".

No entra: listas de archivos, firmas de funciones, nada que un `find` o un `grep`
conteste mejor. **Un archivo nuevo no se documenta por existir** — se documenta
cuando trae una regla que alguien puede romper sin darse cuenta.

CLAUDE.md se lee entero en cada sesión: lo que agregás se paga en cada mensaje.
Si dudás, no lo agregues.

## Pasos

### 1. Inventario real

```bash
git status --short
find src -type f | sort
grep -n '^model' prisma/schema.prisma
sed -n '/"scripts"/,/}/p' package.json
ls -d */ | grep -v node_modules
```

### 2. Lo que la doc nombra, ¿existe?

```bash
{ cat CLAUDE.md; find . -name README.md -not -path './node_modules/*' -exec cat {} +; } |
  grep -oE 'src/[]A-Za-z0-9_/.()[-]+' | sed 's/[.,;:)]*$//' | sort -u |
  while read -r p; do [ -e "$p" ] || echo "YA NO EXISTE: $p"; done
```

Cada línea que salga es doc para corregir o borrar. **Borrar también es
actualizar**: un puntero muerto hace más daño que una sección faltante.

### 3. Lo que el repo tiene, ¿está en la doc?

Por cada `src/lib/*.ts`, cada carpeta de ruta bajo `src/app/` y cada carpeta de
diseños, `grep` el nombre en CLAUDE.md. Lo que no aparezca es **candidato**, no
pendiente: pasalo por la regla de arriba y quedate solo con lo que trae una
decisión o una trampa.

### 4. Los números todavía dicen eso

CLAUDE.md afirma valores concretos. Verificá uno por uno y corregí el texto si
el código cambió:

```bash
grep -n 'separacion: 1.3' src/lib/cartera/modelos.ts     # uno por modelo
grep -n 'font-size: 112.5%' src/app/globals.css
grep -n 'id: "' src/lib/categorias.ts                     # las líneas declaradas
grep -n 'COSTURAS' src/lib/cartera/geometria.ts
grep -nE '^\s*\.(btn|chip|campo|sobretitulo|filete|tarjeta|precio)' src/app/globals.css
```

Si un número cambió, gana el código y se corrige el texto. Si parece que el que
se rompió es el código (un invariante que dejó de valer), **decíselo a María y no
lo arregles de prepo**: esta es una pasada de documentación, no de código.

### 5. README de índice

- Toda imagen de diseño con su `.md` hermano; si falta, es trabajo de
  `/ficha-diseno` — no inventes la fila de la tabla.
- Toda ficha `.md` con su fila en el README de la carpeta.
- Carpeta sin README (`dijes diseños/`, `pulseras diseños/`, `recursos/`): o le
  ponés un README corto o una línea en el índice de arriba. Sin carpetas
  huérfanas.

### 6. Escribir y reportar

Editá en el lugar, no reescribas el archivo entero. Mantené la voz del repo:
español, frases cortas, sin viñetas de relleno. Si una sección de CLAUDE.md pasa
de unas 25 líneas, mudá el detalle al README de esa carpeta y dejá en CLAUDE.md
el puntero más la regla.

Al terminar, mostrá el resumen:

```bash
git diff --stat CLAUDE.md '**/README.md'
```

y una línea por cambio: qué se agregó, qué se borró porque ya no existe, qué
número se corrigió.

## Reglas

- **No inventes.** Cada línea nueva sale de un archivo que leíste en esta pasada.
- No toques código, schema ni estilos desde esta skill.
- Si no hay nada desactualizado, decilo y no escribas nada. Una pasada sin
  cambios es un resultado válido.
