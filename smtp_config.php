<?php
/**
 * DamIASolve – Configuración SMTP
 * ============================================================
 * IMPORTANTE: Este archivo va FUERA de public_html.
 * Estructura correcta en Hostinger:
 *
 *   /home/tu_usuario/
 *   ├── public_html/          ← accesible desde internet
 *   └── smtp_config.php       ← ESTE archivo (no accesible desde internet)
 *
 * Nadie puede abrirlo desde el navegador aunque sepa que existe.
 * ============================================================
 */

// Protección extra: solo puede ser incluido desde enviarderechos.php
if (!defined('DESDE_ENVIAR')) {
    http_response_code(403);
    exit('Acceso denegado.');
}

// ── Servidor de correo (Microsoft Outlook / Office 365)
define('SMTP_HOST', 'smtp.office365.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'ia@damiasolve.com');

// ▼▼▼ PON AQUÍ TU CONTRASEÑA DE OUTLOOK ▼▼▼
define('SMTP_PASS', 'TU_CONTRASEÑA_AQUI');
// ▲▲▲ PON AQUÍ TU CONTRASEÑA DE OUTLOOK ▲▲▲

// ── Destinatario y página de retorno
define('DESTINO', 'ia@damiasolve.com');
define('PAGINA',  'https://damiasolve.com/privacidad');

// ── Log de diagnóstico: desactivado en producción
// Para activarlo temporalmente: cambia null por __DIR__ . '/smtp_debug.log'
define('LOG_FILE', null);
