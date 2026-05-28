# Auditoría de Seguridad Web — DamIASolve
**Fecha:** 28/05/2026 | **Alcance:** public_html completo

---

## Resumen ejecutivo

Se han analizado todos los archivos del servidor de damiasolve.com. Se encontraron **2 problemas críticos** que requieren acción inmediata (uno de ellos expone la contraseña del correo), **2 problemas de seguridad importantes** y **3 mejoras recomendadas. Con los archivos adjuntos a este informe, la mayoría quedan resueltos automáticamente.

---

## Tabla de hallazgos

| ID | Severidad | Problema | Estado |
|----|-----------|----------|--------|
| S1 | 🔴 Crítico | Archivo de log con contraseña visible en internet | **Borrar del servidor YA** |
| S2 | 🔴 Crítico | Contraseña del correo escrita dentro del PHP | Resuelto con `config.php` |
| S3 | 🟠 Alto | Sin protección anti-spam en el formulario | Resuelto en `enviarderechos.php` |
| S4 | 🟠 Alto | Sin cabeceras de seguridad ni HTTPS forzado | Resuelto con `.htaccess` |
| S5 | 🟡 Medio | Listado de carpetas visible | Resuelto con `.htaccess` |
| S6 | 🟡 Medio | Sin archivo robots.txt | Resuelto con `robots.txt` |
| S7 | 🟢 Bajo | Email incorrecto en ficha de Google (Schema.org) | Ver instrucciones abajo |
| S8 | 🟢 Bajo | Copyright desactualizado (2024 en lugar de 2026) | Ver instrucciones abajo |

---

## Detalle de cada problema

---

### 🔴 S1 — Archivo de log con contraseña expuesta

**¿Qué es?**
El archivo `smtp_debug.log` que se generó cuando tuviste problemas con el formulario sigue en el servidor y cualquier persona en el mundo puede verlo escribiendo en el navegador:
`damiasolve.com/privacidad/smtp_debug.log`

**¿Qué riesgo tiene?**
Dentro de ese archivo aparece tu contraseña de Outlook codificada en un formato llamado "base64". Aunque parece texto sin sentido (`SXJnb25lc18zMTI=`), cualquier herramienta gratuita en internet la descifra en menos de 1 segundo. Con esa contraseña, alguien podría:
- Leer todos tus correos de `ia@damiasolve.com`
- Enviar emails haciéndose pasar por ti
- Acceder a Microsoft 365 y tus documentos si usas OneDrive/SharePoint

**Cómo solucionarlo (hazlo ahora mismo):**

**Paso 1 — Borrar el archivo del servidor:**
1. Abre el Administrador de Archivos de Hostinger
2. Navega a `public_html/privacidad/`
3. Haz clic derecho en `smtp_debug.log` → **Eliminar**

**Paso 2 — Cambiar la contraseña de Outlook:**
1. Ve a `account.microsoft.com`
2. Inicia sesión con `ia@damiasolve.com`
3. Seguridad → **Cambiar contraseña**
4. Pon una contraseña nueva (mínimo 12 caracteres, mezcla letras, números y símbolos)
5. **Actualiza también `config.php`** con la nueva contraseña (ver S2)

> **Nota importante:** Este problema queda PREVENIDO para el futuro con el nuevo
> `enviarderechos.php` y `config.php` adjuntos. El log está desactivado por defecto.
> Solo se activa si tú mismo lo enciendes para depurar un problema.

---

### 🔴 S2 — Contraseña escrita dentro del archivo PHP

**¿Qué es?**
El archivo `enviarderechos.php` tenía en la línea 13 tu contraseña de correo escrita en texto plano:
```
define('SMTP_PASS',  'tu_contraseña');
```
Cualquiera que vea ese archivo (por un error de configuración del servidor, o si lo compartes para pedir ayuda) vería la contraseña directamente.

**¿Qué riesgo tiene?**
Si alguna vez compartes el archivo para pedir soporte técnico, o si hay un fallo de configuración en el servidor que muestre el código PHP, tu contraseña quedaría expuesta.

**Cómo queda solucionado:**
Con los archivos adjuntos, la contraseña se mueve a un archivo separado (`config.php`) que:
1. Está protegido por `.htaccess` (nadie puede abrirlo desde el navegador)
2. Solo puede ser leído por el propio PHP del servidor, nunca por el exterior
3. Tiene una comprobación interna: si alguien intenta abrirlo directamente, recibe un "Acceso denegado"

**Acción que necesitas hacer tú:**
Abrir `config.php` y poner tu contraseña real en la línea marcada:
```php
define('SMTP_PASS', 'TU_CONTRASEÑA_AQUI');  ← cambia esto
```

---

### 🟠 S3 — Sin protección anti-spam en el formulario

**¿Qué es?**
El formulario de derechos RGPD no tenía ninguna protección contra:
- **Robots de spam:** programas automáticos que rellenan formularios masivamente
- **Abuso de cuota:** alguien podía hacer que tu servidor enviara miles de emails al día agotando tu cuota de Microsoft 365 (que tiene límites diarios)
- **Envío desde otras webs:** alguien podía crear una web falsa que usara tu formulario para enviar correos

**¿Qué riesgo tiene?**
- Tu cuota de email se agota y el formulario deja de funcionar
- Recibes cientos de correos basura
- Tu cuenta de email puede ser suspendida por Microsoft por envío masivo

**Cómo queda solucionado** en el nuevo `enviarderechos.php`:
1. **Verificación de origen:** El formulario solo acepta envíos que vengan de `damiasolve.com`. Si alguien intenta usarlo desde otra web, se rechaza.
2. **Campo trampa (honeypot):** Se añade un campo invisible en el formulario. Los humanos no lo ven ni lo rellenan. Los robots sí lo rellenan → detección automática → bloqueo.
3. **Límite de envíos:** Máximo 3 envíos por hora desde la misma dirección IP. Protege contra ataques automatizados.

**Acción que necesitas hacer tú:**
Añadir el campo honeypot al HTML del formulario (en `privacidad/index.html`).
Busca la línea del campo oculto de procedencia y añade justo debajo:

```html
<!-- Campo trampa anti-bots: INVISIBLE para humanos, visible para robots -->
<input type="text" name="website" id="website-trap"
       style="display:none !important; position:absolute; left:-9999px;"
       tabindex="-1" autocomplete="off" aria-hidden="true" />
```

---

### 🟠 S4 — Sin cabeceras de seguridad ni HTTPS forzado

**¿Qué es?**
Las "cabeceras de seguridad" son instrucciones invisibles que el servidor le envía al navegador del visitante para que se proteja. Sin ellas, los navegadores funcionan en "modo básico" sin esas protecciones extra.

**¿Qué riesgos cubre cada protección?**

| Protección | ¿Para qué sirve? |
|------------|-----------------|
| HTTPS forzado | Si alguien escribe `http://damiasolve.com`, lo redirige automáticamente a `https://`. Evita que los datos viajen sin cifrar. |
| X-Frame-Options | Impide que tu web aparezca dentro de un `iframe` en otra página. Protege contra "clickjacking": botones trampa invisibles superpuestos sobre tu web. |
| X-Content-Type-Options | Evita que el navegador "adivine" el tipo de un archivo y lo ejecute de forma inesperada. |
| X-XSS-Protection | Activa el filtro anti-scripts-maliciosos en navegadores más antiguos. |
| Permissions-Policy | Desactiva el acceso a micrófono, cámara y localización desde tu web (tu web no los necesita). |

**Cómo queda solucionado:**
El archivo `.htaccess` adjunto activa todo esto automáticamente en cuanto lo subes.

---

### 🟡 S5 — Listado de carpetas visible

**¿Qué es?**
Si alguien va a `damiasolve.com/privacidad/` en el navegador (sin especificar un archivo), el servidor podría mostrar la lista completa de archivos de esa carpeta, como si fuera una carpeta de Windows.

**¿Qué riesgo tiene?**
Un atacante podría descubrir archivos que no debería saber que existen (logs, backups, PHP auxiliares) y luego intentar acceder a ellos.

**Cómo queda solucionado:**
Los `.htaccess` adjuntos añaden `Options -Indexes` que muestra "Forbidden" en lugar de la lista.

---

### 🟡 S6 — Sin archivo robots.txt

**¿Qué es?**
`robots.txt` es un archivo estándar que le dice a Google y otros buscadores qué páginas indexar y cuáles ignorar. Sin él, Google podría intentar indexar archivos internos como el log de diagnóstico.

**¿Qué riesgo tiene?**
Aunque el `.htaccess` ya bloquea el acceso a esos archivos, el `robots.txt` añade una capa extra: le dice a los buscadores que ni siquiera intenten visitar esas rutas.

**Cómo queda solucionado:**
El `robots.txt` adjunto está listo para subir a la raíz de `public_html`.

---

### 🟢 S7 — Email incorrecto en ficha de Google

**¿Qué es?**
El código de `index.html` tiene una sección invisible llamada "Schema.org" que le da información a Google para mostrar tu ficha de negocio en los resultados de búsqueda. En esa sección, el email pone `hola@damiasolve.com` pero tu email real es `ia@damiasolve.com`.

**Impacto:** Bajo — Google podría mostrar un email incorrecto en la ficha de negocio.

**Cómo solucionarlo:**
En `index.html`, busca (Ctrl+F): `hola@damiasolve.com` y cámbialo por `ia@damiasolve.com`.

---

### 🟢 S8 — Copyright desactualizado

**¿Qué es?**
El pie de página de `index.html` dice "© 2024" cuando estamos en 2026.

**Cómo solucionarlo:**
En `index.html`, busca `© 2024` y cámbialo por `© 2026`.

---

## Archivos listos para subir

Estos archivos están en la carpeta `public_html/` de este repositorio y ya incorporan todas las correcciones automáticas:

| Archivo | Dónde subirlo en Hostinger | Qué hace |
|---------|---------------------------|----------|
| `.htaccess` | `public_html/` (raíz) | HTTPS forzado + cabeceras de seguridad + bloqueo de archivos sensibles |
| `robots.txt` | `public_html/` (raíz) | Guía a Google para no indexar archivos internos |
| `privacidad/.htaccess` | `public_html/privacidad/` | Bloquea acceso al log y a config.php desde el navegador |
| `privacidad/config.php` | `public_html/privacidad/` | Credenciales SMTP separadas del código (pon tu contraseña aquí) |
| `privacidad/enviarderechos.php` | `public_html/privacidad/` | Formulario con anti-spam, honeypot y rate limiting |

### Orden recomendado de subida:
1. **Primero:** borrar `smtp_debug.log` del servidor y cambiar contraseña de Outlook (S1)
2. **Editar** `config.php` poniendo tu contraseña real antes de subirlo
3. **Subir** todos los archivos de la tabla anterior
4. **Editar** `privacidad/index.html` añadiendo el campo honeypot (S3)
5. **Editar** `index.html` corrigiendo el email y el copyright (S7 y S8)
6. **Probar** el formulario para confirmar que sigue funcionando

---

## Lista de verificación final

- [ ] `smtp_debug.log` borrado del servidor
- [ ] Contraseña de `ia@damiasolve.com` cambiada en Microsoft 365
- [ ] `config.php` con la nueva contraseña subido a `public_html/privacidad/`
- [ ] `.htaccess` subido a `public_html/` (raíz)
- [ ] `.htaccess` subido a `public_html/privacidad/`
- [ ] `robots.txt` subido a `public_html/` (raíz)
- [ ] `enviarderechos.php` actualizado subido a `public_html/privacidad/`
- [ ] Campo honeypot añadido al formulario en `privacidad/index.html`
- [ ] Email corregido en Schema.org de `index.html`
- [ ] Copyright actualizado a 2026 en `index.html`
- [ ] Formulario probado y funcionando tras todos los cambios
