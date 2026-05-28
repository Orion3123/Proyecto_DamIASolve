# CONTEXTO DE SESIÓN — DamIASolve Web
**Última actualización:** 28/05/2026

---

## PROYECTO

Web corporativa de **Damián Rosales Navas / DamIASolve** — consultoría de automatización con IA.

- **Dominio:** damiasolve.com (Hostinger)
- **Email:** ia@damiasolve.com (Microsoft 365 / Outlook)
- **Repo Git:** `orion3123/proyecto_damiasolve`, branch `claude/rebuild-seo-responsive-5P718`
- **Ruta local:** `/home/user/Proyecto_DamIASolve/`

---

## ARCHIVOS CREADOS / MODIFICADOS

| Archivo local | Ubicación en Hostinger | Estado |
|---|---|---|
| `damiasolve.html` | `public_html/index.html` | ✅ Completo — landing page SEO |
| `politica-privacidad-damiasolve.html` | `public_html/privacidad/index.html` | ✅ Con formulario RGPD |
| `terminos/index.html` | `public_html/terminos-y-condiciones/index.html` | ✅ Completo |
| `enviarderechos.php` | `public_html/privacidad/enviarderechos.php` | ✅ Con logging de diagnóstico |

---

## FORMULARIO RGPD — ESTADO ACTUAL

El formulario de ejercicio de derechos (sección 06 de la política de privacidad) envía
solicitudes RGPD a `ia@damiasolve.com` vía SMTP con PHP puro (sin librerías externas).

### Diagnóstico completado
El error era:
```
535 5.7.139 — user is locked by your organization's security defaults policy
```

### Solución aplicada (en curso al cierre de sesión)
1. ✅ SMTP AUTH activado por usuario:
   - admin.microsoft.com → Usuarios → ia@damiasolve.com → Correo → Administrar apps de correo → **SMTP autenticado** ✓
2. ✅ Security Defaults deshabilitado:
   - portal.azure.com → Microsoft Entra ID → Propiedades → Valores predeterminados de seguridad → **Deshabilitado**
   - Motivo seleccionado: "Mi organización planea usar el acceso condicional"
   - Guardado ✓

### ⏳ Pendiente verificar
Esperar 5-10 minutos tras guardar y probar el formulario en `damiasolve.com/privacidad`.
Si sigue fallando, abrir `public_html/privacidad/smtp_debug.log` desde el Administrador
de Archivos de Hostinger y compartir su contenido para diagnosis.

---

## CONFIGURACIÓN SMTP (enviarderechos.php)

```php
SMTP_HOST = smtp.office365.com
SMTP_PORT = 587  // STARTTLS
SMTP_USER = ia@damiasolve.com
SMTP_PASS = [contraseña real ya puesta en el archivo del servidor — NO está en el repo]
DESTINO   = ia@damiasolve.com
PAGINA    = https://damiasolve.com/privacidad
LOG_FILE  = __DIR__ . '/smtp_debug.log'
```

> **Importante:** el archivo PHP en el servidor ya tiene la contraseña correcta.
> El del repo tiene `TU_CONTRASEÑA_AQUI` como placeholder — nunca subir credenciales al repo.

---

## DECISIONES TÉCNICAS TOMADAS

- **SMTP puro sin librerías** (stream_socket_client + STARTTLS manual) para evitar dependencia de Composer/PHPMailer en Hostinger shared hosting.
- **Nombre del PHP sin guion:** `enviarderechos.php` (así está en el servidor). El form usa `action="enviarderechos.php"` con ruta relativa — ambos archivos están en `privacidad/`.
- **Landing page:** HTML/CSS/JS puro, sin frameworks. SEO con Schema.org JSON-LD (ProfessionalService), meta OG/Twitter, canonical URL.
- **Colores de marca:** `#2176ac` (azul), `#060606` (negro), `#ffffff` (blanco).
- **Logo:** `public/Logo_DamIASolve111.png`

---

## PENDIENTES

1. **Verificar formulario RGPD** tras los cambios en Microsoft 365/Azure (probar envío real).
2. **Eliminar `smtp_debug.log`** del servidor una vez confirmado que funciona (contiene info interna).
3. **Comprobar link Términos y Condiciones** en `index.html` → debe apuntar a `/terminos-y-condiciones/` (nombre del directorio real en Hostinger).
4. **Subir landing page** (`damiasolve.html`) a `public_html/index.html` si aún no se ha hecho.

---

## INSTRUCCIONES PARA NUEVA SESIÓN

- Branch de desarrollo: siempre `claude/rebuild-seo-responsive-5P718`
- Repo restringido a: `orion3123/proyecto_damiasolve`
- **Nunca subir la contraseña de correo al repo**
- El nombre del PHP en el servidor es `enviarderechos.php` (sin guion entre "enviar" y "derechos")
- Al hacer push: `git push -u origin claude/rebuild-seo-responsive-5P718`

---

## CONTACTO / DATOS DEL CLIENTE

- **Nombre:** Damián Rosales Navas
- **Marca:** DamIASolve
- **Teléfono:** 633 044 489
- **Email:** ia@damiasolve.com
- **Instagram:** https://www.instagram.com/damiasolve?igsh=MWJtajVneXI1ZTg3aA==
- **Facebook:** https://www.facebook.com/share/1CnYanoxBP/
- **LinkedIn:** https://www.linkedin.com/in/damianrosalesnavas
