---
description: Genera una propuesta comercial (HTML + DOCX) desde la ultima reunion de Fathom. Modo consultor interactivo.
---

Invoca la skill `comercial` para generar una propuesta comercial profesional desde la ultima reunion de Fathom (con fallback manual si la API no esta configurada).

Flujo:
1. Lee `~/.claude/skills/comercial/config.json` (o avisa si no existe).
2. Trae la ultima reunion de Fathom via `scripts/fathom-client.mjs`. Si falla, pide transcripcion manual.
3. Analiza la transcripcion y detecta idioma + huecos de informacion.
4. Actua como consultor: pregunta pricing (2 opciones), condiciones de pago, ambiguedades de alcance. Sugiere proactivamente items "fuera de alcance".
5. Genera HTML navegable + DOCX en `{config.output.ruta_base}/<cliente-slug>/YYYY-MM-DD_<cliente-slug>_propuesta_v1.{html,docx}`.
6. Devuelve las rutas absolutas de los archivos.

Reglas clave:
- Idioma de la propuesta = idioma de la reunion
- Siempre 2 opciones de precio (Fee unico | Fee inicial + mensualidad)
- IVA siempre separado
- Nunca inventar precios, servicios o condiciones
- Sin preview previo en chat — genera directo

Si el usuario ha pasado argumentos tras `/comercial`, interpretalos como contexto adicional (ej: `/comercial cliente urgente` = priorizar rapidez).
