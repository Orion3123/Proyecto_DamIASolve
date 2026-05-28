# Auditoría de Seguridad — DamIASolve
**Fecha:** Mayo 2026 | **Sitio:** damiasolve.com | **Hosting:** Hostinger (alojamiento compartido, PHP)

---

## Resumen ejecutivo

Se han analizado todos los archivos accesibles del servidor de damiasolve.com y se encontraron **10 problemas de seguridad**, de los cuales **3 son críticos** y requieren acción inmediata hoy mismo. El más urgente es un archivo de log que contiene la contraseña del correo corporativo y que lleva tiempo accesible públicamente en Internet. Los demás problemas tienen solución mediante los 5 archivos adjuntos a este informe, que están listos para subir al servidor sin necesidad de conocimientos técnicos.

---

## Tabla de hallazgos

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| 1 | 🔴 Crítico | Archivo smtp_debug.log con contraseña expuesto públicamente | **Acción inmediata — borrar del servidor HOY** |
| 2 | 🔴 Crítico | Contraseña de Outlook escrita en texto plano en enviarderechos.php | Con archivo adjunto (config.php + enviarderechos.php) |
| 3 | 🔴 Crítico | Sin .htaccess — archivos .log y .php accesibles y directorios visibles | Con archivo adjunto (.htaccess raíz y /privacidad/) |
| 4 | 🟠 Alto | Sin protección CSRF — el formulario puede ser usado desde otras webs | Con archivo adjunto (enviarderechos.php) |
| 5 | 🟠 Alto | Sin rate limiting — ataques automáticos de envío masivo posibles | Con archivo adjunto (enviarderechos.php) |
| 6 | 🟠 Alto | Sin cabeceras de seguridad HTTP | Con archivo adjunto (.htaccess raíz) |
| 7 | 🟡 Medio | Sin redirección HTTP → HTTPS | Con archivo adjunto (.htaccess raíz) |
| 8 | 🟡 Medio | Sin archivo robots.txt | Con archivo adjunto (robots.txt) |
| 9 | 🟡 Medio | Listado de directorios activo — cualquiera puede ver los archivos de cada carpeta | Con archivo adjunto (.htaccess raíz y /privacidad/) |
| 10 | 🟢 Bajo | Errores menores en index.html: email incorrecto, copyright 2024, imagen OG en CDN externo | Corrección manual (instrucciones abajo) |

---

## Detalle de cada hallazgo

---

### 🔴 Hallazgo 1 — Archivo de log con contraseña visible en Internet (CRÍTICO — URGENTE)

**¿Qué está pasando?**

Cuando se probó por primera vez el formulario de envío de correos, el script PHP generó automáticamente un archivo de diagnóstico llamado `smtp_debug.log` en la carpeta `privacidad/`. Ese archivo fue pensado solo para el desarrollador, para detectar errores. El problema es que nunca se borró y sigue en el servidor, accesible para cualquier persona del mundo.

Cualquiera puede abrir su navegador y escribir:
`https://damiasolve.com/privacidad/smtp_debug.log`
...y ver el contenido completo del archivo.

**¿Por qué es tan grave? La historia del Base64**

Dentro del log aparecen unas líneas que parecen texto sin sentido, por ejemplo:

```
AUTH LOGIN
aWFAZGFtaWFzb2x2ZS5jb20=
VFVfQ09OVFJBU0VOQUhBUVVJ
```

Ese texto "sin sentido" es el usuario y la contraseña de Outlook codificados en **Base64**. Mucha gente cree que Base64 es un sistema de seguridad o cifrado — no lo es. Es simplemente una forma de transformar texto para que no se vea a simple vista, igual que si escribieras algo al revés.

Cualquier persona puede ir a una web como `base64decode.org`, pegar esas letras y ver al instante:
- `aWFAZGFtaWFzb2x2ZS5jb20=` → `ia@damiasolve.com`
- `VFVfQ09OVFJBU0VOQUhBUVVJ` → tu contraseña en texto normal

Esto no requiere conocimientos técnicos. Tarda menos de 10 segundos.

**¿Qué le puede pasar si alguien lo encuentra?**

- Accede a tu cuenta de correo `ia@damiasolve.com` y lee todos tus emails
- Envía correos haciéndose pasar por ti a tus clientes y contactos
- Cambia la contraseña y bloquea tu propio acceso a tu cuenta
- Usa tu cuenta para enviar spam masivo, lo que puede hacer que Microsoft bloquee tu dominio de correo permanentemente
- Si usas Microsoft 365, puede acceder también a OneDrive, Teams y otros servicios asociados

**¿Cómo solucionarlo? (pasos exactos)**

1. Abre el **Administrador de archivos** de Hostinger (Panel de control → Administrador de archivos)
2. Navega a la carpeta `public_html/privacidad/`
3. Haz clic derecho sobre el archivo `smtp_debug.log` → **Eliminar** → confirmar
4. Ve a `account.microsoft.com`, inicia sesión con `ia@damiasolve.com`
5. En "Seguridad" → **Cambiar contraseña** → elige una contraseña nueva y larga (mínimo 14 caracteres)
6. Guarda la nueva contraseña en un gestor de contraseñas (Bitwarden es gratuito)
7. Abre el archivo `config.php` en el servidor y actualiza la línea con la nueva contraseña

> **IMPORTANTE:** Borrar el archivo sin cambiar la contraseña NO es suficiente. La contraseña ya ha estado expuesta y puede haberla visto alguien. Es obligatorio cambiarla.
>
> Una vez subidos los nuevos archivos .htaccess adjuntos, aunque el archivo log volviera a existir por cualquier motivo, el servidor bloquearía su acceso automáticamente.

---

### 🔴 Hallazgo 2 — Contraseña de correo en texto plano dentro del código (CRÍTICO)

**¿Qué está pasando?**

El archivo `enviarderechos.php` (el que procesa el formulario) tenía en su línea 13 la contraseña del correo escrita directamente en el código, sin ninguna protección:

```php
define('SMTP_PASS', 'tu_contraseña_real_aqui');
```

Esto significa que cualquier persona que consiga ver ese archivo — ya sea por un error del servidor, por una copia mal guardada, o si en algún momento se sube a GitHub o se comparte para pedir ayuda técnica — verá la contraseña al instante.

**¿Qué le puede pasar?**

Mismo riesgo que el Hallazgo 1: acceso total a la cuenta de correo corporativo.

**¿Cómo queda solucionado con los archivos adjuntos?**

Se han creado dos archivos nuevos que separan la contraseña del resto del código:

- **`config.php`**: guarda únicamente las credenciales del correo. Está protegido por el `.htaccess` adjunto para que nadie pueda abrirlo desde el navegador. Además, tiene una comprobación interna: si alguien intenta ejecutarlo directamente, recibe un error "Acceso denegado".
- **`enviarderechos.php` (nueva versión)**: ya no contiene la contraseña. La carga desde `config.php`. El formulario sigue funcionando exactamente igual.

**Acción que necesitas hacer tú:**

Después de subir `config.php` al servidor, ábrelo y sustituye el texto `TU_CONTRASEÑA_AQUI` por tu contraseña real de Outlook:

```php
define('SMTP_PASS', 'TU_CONTRASEÑA_AQUI');  ← cambia este texto
```

---

### 🔴 Hallazgo 3 — Sin .htaccess: archivos sensibles accesibles y directorios visibles (CRÍTICO)

**¿Qué está pasando?**

El archivo `.htaccess` es un archivo de configuración que controla el comportamiento del servidor Apache. Sin él, el servidor funciona en "modo abierto" y cualquier visitante puede:

1. Ver la lista completa de archivos de cualquier carpeta (como si fuera el explorador de archivos del ordenador)
2. Acceder directamente a archivos `.log`, `.php`, `.env`, `.sql` y otros archivos internos

**¿Qué le puede pasar?**

Un atacante que visite `https://damiasolve.com/privacidad/` sin especificar un archivo concreto verá una lista con todos los archivos disponibles en esa carpeta: `smtp_debug.log`, `config.php`, `enviarderechos.php`... Sin tener que adivinar nada.

**¿Cómo queda solucionado con los archivos adjuntos?**

Se han preparado dos archivos `.htaccess`:
- Uno para la raíz de `public_html/` que bloquea archivos sensibles en todo el sitio
- Uno específico para la carpeta `privacidad/` que bloquea el acceso al log y a config.php con una capa extra de protección

---

### 🟠 Hallazgo 4 — Sin protección CSRF: el formulario puede ser usado desde otras webs (ALTO)

**¿Qué está pasando?**

El formulario de ejercicio de derechos RGPD no verifica si la persona que lo envía viene realmente de `damiasolve.com`. Cualquier página web del mundo puede crear un formulario que apunte a `https://damiasolve.com/privacidad/enviarderechos.php` y enviarlo en tu nombre.

Esto se llama ataque CSRF (Cross-Site Request Forgery), que en español vendría a ser "falsificación de petición desde otro sitio".

**¿Qué le puede pasar?**

- Alguien crea una página falsa que automáticamente envía solicitudes a través de tu formulario
- Tu cuota diaria de emails de Outlook (Microsoft tiene límites) se agota rápidamente
- Recibes centenares de correos falsos mezclados con los reales
- Microsoft puede suspender tu cuenta por actividad sospechosa de envío masivo

**¿Cómo queda solucionado en el nuevo enviarderechos.php?**

El formulario ahora comprueba de dónde viene la petición. Si no viene de `damiasolve.com`, la rechaza silenciosamente sin avisar al atacante de que fue detectado.

---

### 🟠 Hallazgo 5 — Sin rate limiting: ataques de envío masivo posibles (ALTO)

**¿Qué está pasando?**

Actualmente, un programa automático podría enviar miles de solicitudes a través del formulario en cuestión de minutos. No hay ningún límite que lo detenga.

**¿Qué le puede pasar?**

- Tu bandeja de entrada se llena de correos basura en minutos
- La cuota diaria de envío de Outlook se agota (el formulario deja de funcionar para usuarios reales)
- El servidor puede ralentizarse ante tantas peticiones simultáneas
- Microsoft puede marcar tu cuenta como origen de spam

**¿Cómo queda solucionado en el nuevo enviarderechos.php?**

Se implementa un sistema de límite por dirección IP: cada visitante solo puede enviar 3 solicitudes en una hora. Si supera ese límite, la solicitud se rechaza. El contador se guarda en un archivo temporal del servidor (no accesible desde el navegador) y se reinicia automáticamente cada hora.

---

### 🟠 Hallazgo 6 — Sin cabeceras de seguridad HTTP (ALTO)

**¿Qué está pasando?**

Las cabeceras de seguridad HTTP son instrucciones invisibles que el servidor envía al navegador del visitante para decirle cómo protegerse. Sin ellas, el navegador funciona en modo básico sin esas defensas adicionales.

**¿Qué cubre cada protección?**

| Cabecera | ¿Para qué sirve? |
|----------|-----------------|
| `X-Frame-Options: SAMEORIGIN` | Impide que tu web aparezca dentro de otra web en un iframe. Protege contra "clickjacking": botones trampa invisibles superpuestos sobre tus botones reales. |
| `X-Content-Type-Options: nosniff` | Evita que el navegador "adivine" el tipo de un archivo y lo ejecute de forma inesperada. Protege contra archivos disfrazados. |
| `X-XSS-Protection: 1; mode=block` | Activa el filtro anti-scripts maliciosos en navegadores más antiguos. |
| `Referrer-Policy` | Controla qué información se comparte con otras webs cuando el visitante hace clic en un enlace. |
| `Permissions-Policy` | Desactiva el acceso a micrófono, cámara y localización desde tu web (no los necesitas). |

**¿Cómo queda solucionado?**

El archivo `.htaccess` adjunto para la raíz activa todas estas protecciones automáticamente.

---

### 🟡 Hallazgo 7 — Sin redirección HTTP → HTTPS (MEDIO)

**¿Qué está pasando?**

Si alguien escribe `http://damiasolve.com` (sin la "s"), el servidor sirve la página sin cifrado. Aunque tengas un certificado SSL instalado, si no hay redirección automática, algunos visitantes pueden conectarse sin cifrars sin saberlo.

**¿Qué le puede pasar?**

En redes públicas (cafeterías, hoteles, aeropuertos), alguien en la misma red WiFi podría interceptar los datos que un visitante envía por el formulario si la conexión va sin cifrar.

**¿Cómo queda solucionado?**

El archivo `.htaccess` adjunto incluye una regla que detecta cualquier conexión sin cifrar y redirige automáticamente a la versión `https://`.

---

### 🟡 Hallazgo 8 — Sin archivo robots.txt (MEDIO)

**¿Qué está pasando?**

`robots.txt` es un archivo estándar que le dice a Google, Bing y otros buscadores qué páginas pueden visitar y cuáles no. Sin él, los buscadores pueden intentar indexar cualquier archivo accesible en el servidor, incluyendo archivos internos.

**¿Qué le puede pasar?**

Archivos como `smtp_debug.log` podrían haber sido o pueden ser encontrados por Google. Un atacante podría buscar en Google `site:damiasolve.com smtp_debug.log` y encontrar el archivo directamente en los resultados de búsqueda.

**¿Cómo queda solucionado?**

El archivo `robots.txt` adjunto permite que Google indexe el sitio normalmente e incluye instrucciones explícitas para que no intente indexar los archivos internos de la carpeta `privacidad/`.

---

### 🟡 Hallazgo 9 — Listado de directorios activo (MEDIO)

**¿Qué está pasando?**

Si un visitante escribe en el navegador `https://damiasolve.com/privacidad/` (la carpeta, sin indicar un archivo concreto), el servidor podría mostrar una lista de todos los archivos que contiene esa carpeta, igual que el explorador de archivos del ordenador.

**¿Qué le puede pasar?**

Un atacante descubre sin esfuerzo que existen archivos como `smtp_debug.log` o `config.php`. Sin esta información, tendría que adivinarlos. Con el listado activo, le aparecen directamente.

**¿Cómo queda solucionado?**

Los archivos `.htaccess` adjuntos (tanto el de la raíz como el de la carpeta `privacidad/`) incluyen la instrucción `Options -Indexes`, que hace que el servidor muestre "Forbidden" en lugar de la lista de archivos.

---

### 🟢 Hallazgo 10 — Errores menores en index.html (BAJO)

**Qué está pasando y qué hacer:**

Se han detectado tres pequeñas inconsistencias en `index.html` que conviene corregir aunque no son urgentes:

**a) Email incorrecto en los datos de Google (Schema.org)**
El código tiene un bloque invisible que le da información a Google para la ficha de negocio. En ese bloque, el email figura como `hola@damiasolve.com` cuando el email real de contacto es `ia@damiasolve.com`.
- **Cómo corregirlo:** En `index.html`, usa Ctrl+F para buscar `hola@damiasolve.com` y cámbialo por `ia@damiasolve.com`.

**b) Copyright desactualizado**
El pie de página dice "© 2024" pero estamos en 2026.
- **Cómo corregirlo:** En `index.html`, busca `© 2024` y cámbialo por `© 2026`.

**c) Imagen para redes sociales alojada en CDN externo de Zyro**
La imagen que aparece cuando alguien comparte tu web en redes sociales (la llamada "imagen OG" u Open Graph) está alojada en los servidores de Zyro, el constructor web que usaste anteriormente. Si Zyro cambia o elimina esa URL, la imagen desaparecerá.
- **Cómo corregirlo:** Sube el archivo del logo a tu propio servidor Hostinger (por ejemplo en `public_html/img/logo-damiasolve.jpg`) y actualiza la etiqueta `og:image` en `index.html` para que apunte a `https://damiasolve.com/img/logo-damiasolve.jpg`.

---

## Acciones inmediatas — Hacer HOY MISMO

Las dos primeras son las más urgentes. No esperes.

**Paso 1 — Borrar el archivo con la contraseña expuesta**
1. Abre el Administrador de archivos de Hostinger
2. Ve a `public_html/privacidad/`
3. Selecciona `smtp_debug.log` y elimínalo

**Paso 2 — Cambiar la contraseña de Outlook**
1. Ve a `account.microsoft.com`
2. Inicia sesión con `ia@damiasolve.com`
3. Seguridad → Cambiar contraseña
4. Elige una contraseña nueva, larga (mínimo 14 caracteres), diferente a la anterior
5. Guárdala en un gestor de contraseñas (Bitwarden: gratuito en bitwarden.com)

**Paso 3 — Subir los 5 archivos de seguridad**
1. Edita `config.php` escribiendo tu nueva contraseña donde dice `TU_CONTRASEÑA_AQUI`
2. Sube los 5 archivos al servidor (tabla en la sección siguiente)

**Paso 4 — Verificar que todo funciona**
1. Intenta abrir `https://damiasolve.com/privacidad/smtp_debug.log` → debe aparecer error 403 o 404
2. Intenta abrir `https://damiasolve.com/privacidad/config.php` → debe aparecer error 403
3. Intenta abrir `http://damiasolve.com` (sin la "s") → debe redirigirte solo a `https://`
4. Intenta abrir `https://damiasolve.com/privacidad/` → no debe mostrar lista de archivos
5. Prueba a enviar una solicitud real por el formulario y comprueba que llega el email

---

## Archivos listos para subir

Estos 5 archivos están en la carpeta `public_html/` de este repositorio e incorporan las correcciones de los hallazgos 2 al 9. Solo necesitas editar `config.php` para poner tu contraseña.

| Archivo local | Dónde subirlo en Hostinger | Qué resuelve |
|---------------|---------------------------|--------------|
| `public_html/.htaccess` | Raíz de `public_html/` | Hallazgos 3, 6, 7 y 9 |
| `public_html/robots.txt` | Raíz de `public_html/` | Hallazgo 8 |
| `public_html/privacidad/.htaccess` | Carpeta `public_html/privacidad/` | Hallazgo 3 (capa extra) |
| `public_html/privacidad/config.php` | Carpeta `public_html/privacidad/` | Hallazgo 2 |
| `public_html/privacidad/enviarderechos.php` | Carpeta `public_html/privacidad/` | Hallazgos 2, 4 y 5 |

### ¿Qué hace exactamente cada archivo?

**`.htaccess` (raíz):**
- Redirige todo el tráfico HTTP → HTTPS automáticamente
- Desactiva el listado de carpetas en todo el sitio
- Añade las 5 cabeceras de seguridad HTTP recomendadas
- Bloquea el acceso desde el navegador a cualquier archivo `.log`, `.md`, `.env`, `.bak`, `.sql` y `.sh`

**`robots.txt`:**
- Permite que Google indexe el sitio normalmente
- Indica explícitamente que no indexe `smtp_debug.log`, `config.php` ni `enviarderechos.php`
- Incluye la referencia al mapa del sitio para mejorar el posicionamiento en Google

**`.htaccess` (carpeta privacidad):**
- Bloquea el acceso directo a cualquier archivo `.log` en esa carpeta
- Bloquea el acceso directo a `config.php` — solo puede ser leído por PHP del servidor
- Desactiva el listado de archivos específicamente en esa carpeta

**`config.php`:**
- Guarda únicamente las credenciales del correo (usuario, contraseña, servidor SMTP)
- Protección interna: si alguien intenta abrirlo directamente en el navegador, recibe "Acceso denegado"
- El log SMTP está desactivado por defecto — no generará nuevos archivos con contraseñas
- **Tienes que editar este archivo y poner tu contraseña real** donde dice `TU_CONTRASEÑA_AQUI`

**`enviarderechos.php` (nueva versión):**
- Ya no tiene la contraseña dentro — la carga de `config.php`
- Verifica que las peticiones vienen de `damiasolve.com` (protección CSRF)
- Incluye campo trampa invisible para detectar robots (honeypot)
- Limita a 3 envíos por hora por dirección IP (rate limiting)
- El formulario HTML no necesita ningún cambio — sigue funcionando exactamente igual

---

## Lista de verificación final

Usa esta lista para asegurarte de que no te olvidas ningún paso:

- [ ] `smtp_debug.log` borrado del servidor
- [ ] Contraseña de `ia@damiasolve.com` cambiada en Microsoft 365
- [ ] `config.php` editado con la nueva contraseña y subido a `public_html/privacidad/`
- [ ] `.htaccess` subido a la raíz de `public_html/`
- [ ] `.htaccess` subido a `public_html/privacidad/`
- [ ] `robots.txt` subido a la raíz de `public_html/`
- [ ] `enviarderechos.php` actualizado subido a `public_html/privacidad/`
- [ ] Verificado que `smtp_debug.log` da error 403 desde el navegador
- [ ] Verificado que `config.php` da error 403 desde el navegador
- [ ] Verificado que `http://` redirige automáticamente a `https://`
- [ ] Verificado que la carpeta `/privacidad/` no muestra lista de archivos
- [ ] Formulario de derechos RGPD probado y funcionando
- [ ] (Opcional) Email corregido en Schema.org de `index.html`
- [ ] (Opcional) Copyright actualizado a 2026 en `index.html`
- [ ] (Opcional) Imagen OG movida a tu propio servidor

---

*Informe para uso interno de DamIASolve. Contiene información técnica confidencial.*
