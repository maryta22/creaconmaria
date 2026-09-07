---
name: cerrar-requerimiento
description: Verificar, commitear y subir a GitHub el bloque de trabajo que María acaba de dar por terminado. Usar cuando dice que algo queda listo y pasa a otra cosa ("listo", "esto queda así", "damos por terminado el carrito", "ahora pasemos a X"), o cuando pide el commit directo. No usar a mitad de una tarea.
---

# Cerrar un requerimiento

María trabaja de a un requerimiento por vez. Cuando dice que uno **queda
terminado** y pasa a otro, ese es el punto de control: se verifica, se commitea
y se sube a `origin/main`. **Un requerimiento, un commit.**

Sin esto el repo acumula veinte cambios sueltos y el día que algo se rompe no
hay a dónde volver.

## Cuándo se dispara

Lo dispara ella, cerrando algo: "listo", "esto ya está", "queda así", "damos por
terminado el diseñador", "pasemos a otra cosa". También si pide el commit
directo.

## Cuándo NO

- A mitad de una tarea, aunque compile. El commit lo dispara María, no vos.
- Con la verificación en rojo. No se sube nada roto, ni "para no perderlo".
- Si ella todavía no vio el cambio funcionando: preguntá antes de subirlo.

## Pasos

### 1. Verificar que no está roto

```bash
npx tsc --noEmit
```

Tarda ~20 s y tiene que salir sin una sola línea. Si tira errores, mostráselos y
arreglalos **antes** del commit.

`npm run build` es la verificación completa, pero **no la corras si hay un
`next dev` levantado**: comparten `.next` y se corrompen entre sí (ver
CLAUDE.md). Esa dejala para antes de publicar.

### 2. Mirar qué se va a subir

```bash
git status --short
git diff --stat
```

Leé la lista entera antes de stagear, buscando dos cosas:

- **Lo que no va nunca**: `.env`, `prisma/*.db`, `public/uploads/*`, `.next/`.
  El `.gitignore` ya las cubre; si alguna aparece igual, no la agregues y avisá.
- **Cambios ajenos al requerimiento**: una prueba a medias, un `console.log`, un
  archivo de otra tarea. Nombralos y preguntá si entran en este commit o quedan
  afuera. En la duda, `git add` archivo por archivo en vez de `-A`.

### 3. ¿Cambió el mapa del repo?

Si el requerimiento agregó rutas, libs o carpetas, o rompió un invariante que
CLAUDE.md documenta, corré `/discovery` **antes** de commitear: así la doc entra
en el mismo commit que el código. Si solo tocaste archivos que ya existían,
salteá este paso.

### 4. Commitear

El mensaje va en español, como el resto del repo:

- Primera línea: qué quedó terminado. Menos de 72 caracteres, sin punto final.
- Línea en blanco y una viñeta por cambio con peso propio.
- Nada de "varios cambios" ni "actualizaciones". Si no podés nombrarlo en una
  línea, es que hay dos requerimientos metidos en el mismo commit: separalos.
- Cerrá siempre con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

Pasá el mensaje por heredoc, nunca por `-m` suelto: los acentos y los saltos de
línea se rompen al pasar por PowerShell.

```bash
git add -A
git commit -F - <<'EOF'
Carrito público con envío por WhatsApp

- Proveedor de contexto y persistencia en localStorage.
- Botón de agregar en la ficha de pieza.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

### 5. Subir

```bash
git push origin main
```

Va derecho a `main`: es el repo de María, trabaja sola y `main` es lo que se
publica. No abras ramas ni PRs salvo que ella lo pida.

Si el push rebota por *non-fast-forward*, subieron algo desde otro lado:
`git pull --rebase origin main`, repetí el paso 1 y recién ahí empujá. **Nunca
`--force`.**

### 6. Reportar

Tres líneas, no más:

- hash corto y título del commit;
- cuántos archivos entraron y qué quedó afuera, si quedó algo;
- que `main` está a la par de `origin/main` (`git status -sb`).

## Reglas

- **Un requerimiento, un commit.** Si en el medio arreglaste algo grande y no
  relacionado, hacé dos.
- El mensaje describe lo que hiciste, no lo que pensabas hacer. No lo infles: el
  diff ya está ahí.
- El remoto es `https://github.com/maryta22/creaconmaria.git`. Si `origin`
  apunta a otro lado, avisá antes de tocarlo.
- Nada de `--amend` sobre un commit ya subido, ni `--no-verify`.
