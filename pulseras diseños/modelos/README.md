# Colección de pulseras

**Esta carpeta la escribe `npm run fichas:pulseras`.** No la edites a mano: los
conteos, los largos y la lista de compras de cada ficha salen de
`src/lib/pulsera/modelos.ts`, que es lo mismo que dibuja el visor 3D. Escritos
a mano se desincronizan, y ya pasó: las fichas seguían describiendo diez
técnicas cuando en el código quedaban cuatro.

Son 8 modelos, uno por tejido. **El color no hace modelo aparte**: un
modelo se muestra en la escala de grises de `src/lib/cuentas-base.ts` y el
color entra recién cuando alguien elige cuentas del stock. Cada modelo declara
**solo los papeles que usa**: una tira lisa tiene uno.

| Técnica | Armado | Construcción | Ancho | Cuenta |
|---|---|---|---:|---:|
| Perla lisa | trama | Hilo simple | 0,4 cm | 4 mm |
| Perla alternada | trama | Hilo simple | 0,4 cm | 4 mm |
| Perla en tresillo | trama | Hilo simple | 0,6 cm | 6 mm |
| Perla con separador | trama | Hilo simple | 0,8 cm | 8 mm |
| Margarita | flores | Cadena de flores con hilo de dos extremos | 1,2 cm | 4 y 8 mm |
| Rosetón | flores | Cadena de flores con hilo de dos extremos | 1,6 cm | 4 y 8 mm |
| Margarita menuda | flores | Cadena de flores con hilo de dos extremos | 1,2 cm | 4 mm |
| Cristal cruzado | raw | Tejido en ángulo recto de una hilera | 0,8 cm | 4 mm |

**`armado` identifica la construcción.** `trama` usa una cuadrícula;
`flores`, anillos de pétalos; y `raw`, unidades de cuatro cuentas que comparten
una unión. Cada construcción tiene su propia geometría.

## Al agregar un modelo

1. Agregar la técnica a `TECNICAS` en `src/lib/pulsera/modelos.ts`, con sus
   `medidas` —una por papel, y solo los que use— y su matriz o su flor.
2. Correr `npm run fichas:pulseras`.
3. El catálogo, el visor 3D y las indicaciones de María lo toman solos.
