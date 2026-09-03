# Proyecto DamIASolve

Herramientas web sencillas para micropymes y negocios locales. La aplicación
arranca en una pantalla de inicio desde la que se accede a dos herramientas:

| Herramienta | Para qué sirve |
|---|---|
| **B2B Hunter** | Buscar clientes potenciales por ciudad y sector, priorizarlos y generar la propuesta comercial en un click |
| **Analizador de Procesos** | Diagnóstico rápido de ineficiencias y cuellos de botella de un negocio |

## Poner en marcha

```bash
npm install
npm start      # desarrollo, en http://localhost:3000
npm run build  # versión de producción en build/
```

No hace falta ninguna clave ni servidor: todo funciona en el navegador.

---

## B2B Hunter

### Cómo se usa

1. **Qué vendes.** Elige una de las seis ofertas y rellena tus datos (se usan
   para firmar las propuestas). La oferta elegida decide a quién se prioriza:
   la misma lista de negocios se ordena distinto según lo que ofrezcas.
2. **Buscar.** Escribe una o varias ciudades separadas por comas y marca los
   sectores. Si solo quieres ver cómo funciona, pulsa **«Probar con datos de
   ejemplo»**: carga negocios ficticios sin tocar la red.
3. **Resultados.** Cada negocio trae su puntuación, las señales detectadas y
   los datos de contacto disponibles. «¿Por qué esta nota?» abre el desglose.
4. **Mis leads.** Los que guardes quedan aquí con su estado (nuevo, contactado,
   interesado, cliente, descartado), notas y exportación a CSV.

### Lo más importante que debes saber

> **Las señales son hipótesis, no hechos.**

Cuando la app dice «sin web registrada» significa *«en el mapa no consta su
web»*, no *«este negocio no tiene web»*. Los datos son colaborativos e
incompletos. Por eso:

- Cada ficha lleva un enlace **«Comprobar en Google»**: úsalo antes de escribir.
- Las plantillas van redactadas en condicional a propósito («no he sido capaz
  de encontrar…», nunca «no tenéis…»).
- Si te responden que sí lo tienen, dales la razón sin discutir.

Escribir una afirmación falsa en la primera línea de un correo frío es la forma
más rápida de perder el cliente y quedar mal.

### Cómo se calcula la puntuación

```
Nota final = 65 % encaje + 35 % facilidad de contacto
```

- **Encaje**: cuántas de las señales detectadas importan *para lo que tú
  vendes*. «Sin web» pesa mucho si vendes páginas web y casi nada si vendes
  facturación.
- **Facilidad de contacto**: teléfono (60), email (40) y web (20), tope 100. Un
  cliente perfecto al que no puedes llegar no vale nada, así que penaliza.

Junto al número siempre aparecen los motivos en texto, para que puedas
discrepar del cálculo con criterio propio.

### Fuentes de datos

**OpenStreetMap (por defecto).** Gratis, sin clave y sus datos se pueden
guardar. La ciudad se resuelve con Nominatim y los negocios con Overpass. Son
servicios comunitarios con normas de uso: la app consulta una ciudad por
segundo, va en serie (nunca en paralelo), cachea la geocodificación y reintenta
con espera creciente antes de pasar a un servidor de respaldo.

Cobertura desigual y honesta: nombres y direcciones bastante completos;
teléfonos y webs, según la zona (mejor en capitales que en pueblos). Si en tu
primera búsqueda ves pocos datos de contacto, es esto, no un fallo.

**Google Places (opcional).** Más cobertura, pero de pago y con una restricción
importante: **sus condiciones no permiten almacenar los resultados**, así que
los leads de Google salen marcados y el botón de guardar queda desactivado.
Cópiate la propuesta en el momento o usa OpenStreetMap.

Si lo activas, la clave se guarda **solo en tu navegador** y nunca en el
repositorio. Restríngela en Google Cloud por referente HTTP y limítala a la
Places API: al ir en una app de navegador, cualquiera que inspeccione la página
puede verla y gastar dinero de tu cuenta.

### Protección de datos

- Los datos de negocios son © colaboradores de OpenStreetMap, bajo licencia
  ODbL. La atribución aparece en el pie de la app y es obligatoria.
- Las plantillas de correo incluyen de serie el origen de los datos y una línea
  de baja, que es lo que corresponde en prospección B2B en España.
- «Borrar» un lead lo borra de verdad del navegador.
- La app **no envía correos automáticamente** a propósito: prepara el texto y lo
  abres tú en tu cliente de correo o en WhatsApp. El envío masivo automatizado
  es donde empiezan los problemas legales y donde se quema el dominio.

### Dónde se guardan tus datos

En el `localStorage` de tu navegador, así que:

- no se sincronizan entre dispositivos;
- si usas modo incógnito no se conservan (la app te avisa);
- **exporta a CSV de vez en cuando**. El CSV usa `;` y lleva BOM UTF-8 para que
  Excel en español lo abra en columnas y con los acentos bien.

---

## Estructura del código

```
src/
├── App.jsx                        pantalla de inicio y selección de herramienta
├── analizador/
│   └── AnalizadorProcesos.jsx     el analizador original, sin cambios de lógica
└── b2b/
    ├── B2BHunter.jsx              contenedor: estado, pestañas, orquestación
    ├── PanelBusqueda.jsx          formulario de búsqueda
    ├── FichaLead.jsx              tarjeta de un cliente potencial
    ├── ModalPropuesta.jsx         propuesta generada y editable
    ├── sectores.js                sector → etiquetas de OpenStreetMap
    ├── ofertas.js                 lo que vendes → qué señales puntúan
    ├── senales.js                 detección de señales y cálculo de la nota
    ├── propuestas.js              plantillas de email, WhatsApp y llamada
    ├── geocodificar.js            Nominatim (ciudad → área)
    ├── osm.js                     Overpass (negocios), reintentos y deduplicado
    ├── googlePlaces.js            motor opcional de Google
    ├── almacen.js                 localStorage con control de errores
    ├── csv.js                     exportación compatible con Excel español
    └── demo.js                    negocios ficticios para probar sin red
```

Sin dependencias nuevas: React, Recharts (ya estaban) y Tailwind por CDN.

### Por qué las propuestas son plantillas y no IA

Siguiendo el principio de `AGENTS.md` («no usar IA si una automatización
sencilla resuelve el problema»): las plantillas son instantáneas, gratis,
funcionan sin conexión y siempre dicen lo mismo, que es exactamente lo que
quieres en un texto comercial que vas a enviar decenas de veces. Además el
texto es editable antes de copiarlo, que es donde de verdad se personaliza.

## Prueba manual rápida

1. `npm start` y abre la pantalla de inicio: deben verse las dos herramientas.
2. Entra en B2B Hunter → «Probar con datos de ejemplo». Deben salir 15 negocios
   ficticios ordenados de mayor a menor nota.
3. Cambia la oferta en «1. Qué vendes» y vuelve a resultados: **el orden debe
   cambiar**.
4. «Generar propuesta» en cualquiera: revisa las tres pestañas y pulsa Copiar.
5. Guarda dos o tres, cámbiales el estado, escribe una nota y exporta el CSV.
6. Recarga la página: los leads guardados deben seguir ahí.
7. Ya con datos reales: busca `peluquerías` en `Granada` y comprueba que salen
   negocios que existen.

## Limitaciones conocidas

- Tailwind se carga por CDN (`cdn.tailwindcss.com`). Es cómodo, pero su propia
  documentación desaconseja el CDN para producción: si algún día publicas esto
  de cara al cliente, conviene compilar Tailwind en el proyecto.
- Los leads viven en un solo navegador. Si necesitas varios dispositivos, el
  siguiente paso natural es mover `almacen.js` a Supabase sin tocar el resto.
- La búsqueda por sectores usa un catálogo cerrado de ~22 tipos de negocio. Se
  amplía añadiendo entradas en `sectores.js`.
