<?php
/**
 * DamIASolve – Configuración de credenciales SMTP
 * ============================================================
 * INSTRUCCIONES:
 *   1. Cambia 'TU_CONTRASEÑA_AQUI' por la contraseña real de Outlook.
 *   2. Sube este archivo al servidor (carpeta /privacidad/).
 *   3. Asegúrate de que el .htaccess de /privacidad/ esté activo
 *      para que nadie pueda abrir config.php desde el navegador.
 *
 * IMPORTANTE: Nunca compartas este archivo. Nunca lo subas a GitHub.
 * ============================================================
 */

// ── Protección: este archivo solo puede ser incluido desde enviarderechos.php
// Si alguien intenta abrirlo directamente en el navegador, recibe un error 403.
if (!defined('DESDE_ENVIAR')) {
    http_response_code(403);
    exit('Acceso denegado.');
}

// ── Configuración del servidor de correo (SMTP de Microsoft Outlook)
define('SMTP_HOST', 'smtp.office365.com');
define('SMTP_PORT', 587);                        // Puerto estándar de Microsoft con STARTTLS
define('SMTP_USER', 'ia@damiasolve.com');        // Tu dirección de correo de Outlook

// ▼▼▼ CAMBIA ESTO POR TU CONTRASEÑA REAL ▼▼▼
define('SMTP_PASS', 'TU_CONTRASEÑA_AQUI');       // ← pon aquí la contraseña de ia@damiasolve.com
// ▲▲▲ CAMBIA ESTO POR TU CONTRASEÑA REAL ▲▲▲

// ── Destinatario de las solicitudes de derechos RGPD
define('DESTINO', 'ia@damiasolve.com');

// ── URL base de la página de privacidad (para redirecciones)
define('PAGINA', 'https://damiasolve.com/privacidad');

// ── Archivo de log de diagnóstico SMTP
// DESACTIVADO por defecto para evitar que se genere un nuevo log con datos sensibles.
// Solo actívalo temporalmente si tienes un problema de envío y necesitas depurar.
// Para activar: cambia null por: __DIR__ . '/smtp_debug.log'
define('LOG_FILE', null);

// ── Para activar el modo debug (logs detallados), descomenta la línea siguiente:
// define('LOG_FILE', __DIR__ . '/smtp_debug.log');
