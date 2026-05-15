# Proyecto DamIASolve

Este proyecto pertenece a DamIASolve.

## Objetivo

Crear soluciones sencillas, mantenibles y seguras para micropymes y negocios locales.

## Principios

- Ordenar primero, automatizar después.
- Priorizar soluciones simples antes que complejas.
- No usar inteligencia artificial si una automatización sencilla resuelve el problema.
- Documentar los cambios importantes.
- Evitar sobreingeniería.
- No exponer claves API, contraseñas ni datos sensibles.

## Forma de trabajar

Antes de modificar código:

1. Analiza el problema real.
2. Identifica riesgos.
3. Propón una solución mínima viable.
4. Explica qué archivos vas a tocar.
5. Aplica cambios pequeños y controlados.

## Reglas técnicas

- Mantener el código claro y modular.
- Usar nombres descriptivos.
- Añadir control de errores.
- No romper funcionalidades existentes.
- Si hay pruebas, ejecutarlas o explicar cómo ejecutarlas.
- Si no hay pruebas, proponer una prueba manual sencilla.

## Integraciones y plugins

Este proyecto usa el plugin **make-skills** (`make-skills@make-marketplace`) para trabajar con automatizaciones de Make.com (antes Integromat). Proporciona habilidades para diseñar, construir y desplegar escenarios de Make.

Para instalar el plugin en una sesión nueva:
```
claude plugins marketplace add integromat/make-skills
claude plugins install make-skills@make-marketplace
```

## Estilo de respuesta

Responder en español de España, de forma clara, directa y práctica.
Explicar los cambios como si Damián necesitara entenderlos para mantener la solución o explicársela a un cliente.
