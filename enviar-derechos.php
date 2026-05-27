<?php
/**
 * DamIASolve – Procesador de solicitudes de derechos RGPD
 * Envía la solicitud a ia@damiasolve.com y redirige al usuario.
 */

/* ── Configuración ─────────────────────────────────── */
define('DESTINO',    'ia@damiasolve.com');
define('REMITENTE',  'noreply@damiasolve.com');
define('PAGINA',     'https://damiasolve.com/privacidad');

/* ── Solo aceptamos POST ───────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . PAGINA);
    exit;
}

/* ── Función de sanitización ───────────────────────── */
function limpiar(string $valor): string {
    return htmlspecialchars(strip_tags(trim($valor)), ENT_QUOTES, 'UTF-8');
}

/* ── Recoger y limpiar campos ──────────────────────── */
$nombre      = limpiar($_POST['nombre']      ?? '');
$email       = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$derecho     = limpiar($_POST['derecho']     ?? '');
$descripcion = limpiar($_POST['descripcion'] ?? '');
$procedencia = limpiar($_POST['procedencia'] ?? 'Política de Privacidad – damiasolve.com');

/* ── Validación básica ─────────────────────────────── */
$derechos_validos = [
    'Derecho de Acceso',
    'Derecho de Rectificación',
    'Derecho de Supresión',
    'Derecho de Portabilidad',
    'Derecho de Oposición',
    'Derecho de Limitación del tratamiento',
];

if (!$nombre || !$email || !in_array($derecho, $derechos_validos, true) || !$descripcion) {
    header('Location: ' . PAGINA . '?estado=error#form-derechos');
    exit;
}

/* ── Construir el email ────────────────────────────── */
$asunto = '[RGPD] ' . $derecho . ' – ' . $nombre;

$cuerpo  = "=== SOLICITUD DE EJERCICIO DE DERECHOS RGPD ===\n\n";
$cuerpo .= "Procedencia:  " . $procedencia . "\n";
$cuerpo .= "Derecho:      " . $derecho . "\n";
$cuerpo .= "Nombre:       " . $nombre . "\n";
$cuerpo .= "Email:        " . $email . "\n";
$cuerpo .= "Fecha/hora:   " . date('d/m/Y H:i:s') . " (UTC)\n\n";
$cuerpo .= "--- DESCRIPCIÓN DE LA SOLICITUD ---\n";
$cuerpo .= $descripcion . "\n\n";
$cuerpo .= "===========================================\n";
$cuerpo .= "Plazo legal de respuesta: 1 mes desde esta fecha.\n";
$cuerpo .= "Generado automáticamente desde damiasolve.com\n";

$cabeceras  = "From: DamIASolve Privacidad <" . REMITENTE . ">\r\n";
$cabeceras .= "Reply-To: " . $email . "\r\n";
$cabeceras .= "Content-Type: text/plain; charset=UTF-8\r\n";
$cabeceras .= "Content-Transfer-Encoding: 8bit\r\n";
$cabeceras .= "X-Mailer: DamIASolve-RGPD/1.0\r\n";

/* ── Enviar ────────────────────────────────────────── */
$enviado = mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras);

/* ── Redirigir con resultado ───────────────────────── */
if ($enviado) {
    header('Location: ' . PAGINA . '?estado=ok#form-derechos');
} else {
    header('Location: ' . PAGINA . '?estado=error#form-derechos');
}
exit;
