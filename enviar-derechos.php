<?php
/**
 * DamIASolve – Procesador de solicitudes de derechos RGPD
 * Usa SMTP de Hostinger para evitar correo no deseado.
 */

/* ══════════════════════════════════════════════════════
   CONFIGURACIÓN — ajusta estos valores con tus datos
   ══════════════════════════════════════════════════════ */
define('SMTP_HOST',  'smtp.office365.com');
define('SMTP_PORT',  587);                       // Microsoft usa siempre 587 + STARTTLS
define('SMTP_USER',  'ia@damiasolve.com');       // tu cuenta de Microsoft/Outlook
define('SMTP_PASS',  'TU_CONTRASEÑA_AQUI');      // contraseña de tu cuenta de Outlook
define('DESTINO',    'ia@damiasolve.com');
define('PAGINA',     'https://damiasolve.com/privacidad');

/* ── Solo aceptamos POST ───────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . PAGINA);
    exit;
}

/* ── Sanitización ──────────────────────────────────── */
function limpiar(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}

/* ── Recoger campos ────────────────────────────────── */
$nombre      = limpiar($_POST['nombre']      ?? '');
$email       = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$derecho     = limpiar($_POST['derecho']     ?? '');
$descripcion = limpiar($_POST['descripcion'] ?? '');
$procedencia = limpiar($_POST['procedencia'] ?? 'Política de Privacidad – damiasolve.com');

/* ── Validación ────────────────────────────────────── */
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

/* ── Construir mensaje ─────────────────────────────── */
$asunto  = '[RGPD] ' . $derecho . ' - ' . $nombre;

$cuerpo  = "=== SOLICITUD DE EJERCICIO DE DERECHOS RGPD ===\r\n\r\n";
$cuerpo .= "Procedencia:  " . $procedencia . "\r\n";
$cuerpo .= "Derecho:      " . $derecho . "\r\n";
$cuerpo .= "Nombre:       " . $nombre . "\r\n";
$cuerpo .= "Email:        " . $email . "\r\n";
$cuerpo .= "Fecha/hora:   " . date('d/m/Y H:i:s') . " (UTC)\r\n\r\n";
$cuerpo .= "--- DESCRIPCION DE LA SOLICITUD ---\r\n";
$cuerpo .= $descripcion . "\r\n\r\n";
$cuerpo .= "===========================================\r\n";
$cuerpo .= "Plazo legal de respuesta: 1 mes desde esta fecha.\r\n";
$cuerpo .= "Generado automaticamente desde damiasolve.com\r\n";

/* ══════════════════════════════════════════════════════
   ENVÍO POR SMTP (sin librerías externas)
   ══════════════════════════════════════════════════════ */
function smtp_send(string $host, int $port, string $user, string $pass,
                   string $from, string $to, string $subject, string $body,
                   string $replyTo = ''): bool
{
    $ctx = stream_context_create([
        'ssl' => [
            'verify_peer'       => true,
            'verify_peer_name'  => true,
            'allow_self_signed' => false,
        ],
    ]);

    /* Conexión: TLS en puerto 587, SSL directo en 465 */
    if ($port === 465) {
        $sock = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    } else {
        $sock = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 15);
    }

    if (!$sock) return false;

    $read = function () use ($sock): string {
        $buf = '';
        while ($line = fgets($sock, 512)) {
            $buf .= $line;
            if ($line[3] === ' ') break;  // última línea de respuesta SMTP
        }
        return $buf;
    };

    $cmd = function (string $c) use ($sock, $read): string {
        fwrite($sock, $c . "\r\n");
        return $read();
    };

    $read(); // banner de bienvenida

    $cmd("EHLO " . (gethostname() ?: 'damiasolve.com'));

    /* STARTTLS solo en puerto 587 */
    if ($port === 587) {
        $cmd("STARTTLS");
        stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $cmd("EHLO " . (gethostname() ?: 'damiasolve.com'));
    }

    $cmd("AUTH LOGIN");
    $cmd(base64_encode($user));
    $r = $cmd(base64_encode($pass));
    if (strpos($r, '235') === false) { fclose($sock); return false; }

    $cmd("MAIL FROM:<{$from}>");
    $cmd("RCPT TO:<{$to}>");
    $cmd("DATA");

    $replyHeader = $replyTo ? "Reply-To: {$replyTo}\r\n" : '';

    $message  = "From: DamIASolve Privacidad <{$from}>\r\n";
    $message .= "To: {$to}\r\n";
    $message .= $replyHeader;
    $message .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $message .= "MIME-Version: 1.0\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n";
    $message .= "\r\n";
    $message .= chunk_split(base64_encode($body));
    $message .= "\r\n.";

    $r = $cmd($message);
    $cmd("QUIT");
    fclose($sock);

    return strpos($r, '250') !== false;
}

/* ── Enviar ────────────────────────────────────────── */
$enviado = smtp_send(
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_USER,   // From = tu propio correo (evita spam)
    DESTINO,
    $asunto,
    $cuerpo,
    $email       // Reply-To = email del solicitante
);

/* ── Redirigir ─────────────────────────────────────── */
header('Location: ' . PAGINA . ($enviado ? '?estado=ok' : '?estado=error') . '#form-derechos');
exit;
