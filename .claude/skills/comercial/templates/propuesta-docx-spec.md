# Especificacion DOCX — Propuesta comercial

Este archivo es una **guia de instrucciones** para la skill `anthropic-skills:docx`. Cuando la skill `comercial` llame a `docx`, le pasara el contenido relleno y estas instrucciones de estilo.

## Objetivo

Generar un `.docx` con el mismo contenido que el HTML pero adaptado al formato Word profesional. Que se vea impecable abierto en Word, Google Docs y Pages.

## Estructura exacta (replicar las 12 secciones del HTML)

1. **Portada** — pagina completa, titulo grande centrado, subtitulo "Preparada para {{cliente}}", fecha y firmante en pie.
2. Resumen ejecutivo
3. Contexto y diagnostico
4. Objetivos del proyecto
5. Alcance / Que incluye
6. Fuera de alcance
7. Metodologia / Como trabajamos
8. Timeline
9. Equipo
10. Inversion (2 opciones, tabla comparativa)
11. Condiciones
12. Siguiente paso / CTA

## Estilo visual

### Colores
- **Primario**: `{{color_primario}}` (azul corporativo) — titulos, headers de tabla
- **Secundario**: `{{color_secundario}}` (beige claro) — fondos de cajas
- **Acento**: `{{color_acento}}` — checks, viñetas especiales
- **Texto principal**: gris oscuro (#1f2937)

### Tipografia
- **Headings**: sans-serif, peso bold
- **Body**: sans-serif, regular, 11pt
- Usa la fuente del sistema si no hay otra disponible (Calibri, Helvetica, Arial)

### Elementos clave

**Portada (pagina 1):**
- Margen generoso, contenido centrado verticalmente
- Logo arriba izquierda si hay
- Titulo del proyecto en grande (28-36pt, bold, color primario)
- "Preparada para {{cliente}}" en subtitulo (16pt)
- Fecha + firmante al pie

**Titulos de seccion:**
- Numerados (01, 02, 03...)
- Color primario, bold, 18-20pt
- Con linea horizontal fina debajo

**Cajas destacadas:**
- Fondo beige claro, borde fino, padding interior
- Para: resumen ejecutivo, items de alcance, condiciones

**Tabla de Inversion (critica):**
- 2 columnas: "Opcion A — Fee unico" | "Opcion B — Inicial + mensualidad"
- Header con fondo color primario, texto blanco
- Precio grande y destacado en cada columna
- Badge "Recomendado" sobre la Opcion B
- IVA mostrado SEPARADO en linea debajo del precio:
  - "Precio: 4.500 EUR"
  - "+ IVA (21%)"
  - "Total con IVA: 5.445 EUR"
- Bullets de "Que incluye" en cada columna

**Timeline:**
- Lista vertical con bullet circular de color primario a la izquierda
- "Momento" en minusculas y color gris encima del titulo del hito

**Fuera de alcance:**
- Usa iconos "×" o cross de color rojo/acento
- Fondo ligeramente distinto al resto (tint rojizo suave opcional)

**CTA final:**
- Caja grande con fondo color primario y texto blanco
- Titulo "¿Arrancamos?" o equivalente en el idioma de la reunion
- Boton/badge con el CTA ("Acepta la propuesta", "Agendemos kickoff"...)
- Email del firmante destacado

**Firma:**
- Al final del documento
- Nombre, cargo, empresa, email, telefono del firmante
- Opcional: linea para firma manuscrita si el documento se imprime

## Reglas de contenido

- **Idioma**: TODO el documento en el idioma de la reunion (pasado como variable `{{lang}}`). No mezcles.
- **Moneda**: siempre con el simbolo o codigo (EUR, USD, MXN...) consistente en todo el doc.
- **IVA**: SIEMPRE mostrado separado. Nunca incluido en el precio principal.
- **Longitud**: media. ~4-6 paginas A4.
- **Sin claims inventadas**: ninguna cifra (ROI, % mejora, etc.) que el usuario no haya validado.

## Orientacion y margenes

- Orientacion: vertical (portrait)
- Tamano: A4 (210×297mm)
- Margenes: 2.5cm arriba/abajo, 2.5cm izquierda/derecha
- Interlineado: 1.3
- Espaciado entre parrafos: 6pt

## Saltos de pagina

- Portada siempre ocupa 1 pagina completa (page break tras ella)
- Evitar cortar una seccion a la mitad (mantener titulo + primer parrafo juntos)
- La tabla de Inversion en la misma pagina si cabe
- CTA final en la misma pagina que la firma si es posible

## Meta

- **Titulo del documento Word**: `Propuesta — {{cliente}} — {{titulo_proyecto}}`
- **Autor**: `{{firmante_nombre}}`
- **Asunto**: `Propuesta comercial para {{cliente}}`
