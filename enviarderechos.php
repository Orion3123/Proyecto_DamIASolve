<?php
/**
 * DamIASolve – Procesador de solicitudes de derechos RGPD
 * Versión con logging de diagnóstico SMTP.
 */

/* ══════════════════════════════════════════════════════
   CONFIGURACIÓN
   ══════════════════════════════════════════════════════ */
define('SMTP_HOST',  'smtp.office365.com');
define('SMTP_PORT',  587);
define('SMTP_USER',  'ia@damiasolve.com');
define('SMTP_PASS',  'TU_CONTRASEÑA_AQUI');   // ← pon tu contraseña de Outlook aquí
define('DESTINO',    'ia@damiasolve.com');
define('PAGINA',     'https://damiasolve.com/privacidad');
define('LOG_FILE',   __DIR__ . '/smtp_debug.log');

/* ── Solo aceptamos POST ───────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . PAGINA);
    exit;
}

/* ── Log helper ────────────────────────────────────── */
function smtp_log(string $msg): void {
    file_put_contents(LOG_FILE, date('[d/m/Y H:i:s] ') . $msg . "\n", FILE_APPEND | LOCK_EX);
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
    smtp_log("VALIDACIÓN FALLIDA: nombre=$nombre email=$email derecho=$derecho");
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
   ENVÍO POR SMTP
   ══════════════════════════════════════════════════════ */
function smtp_send(string $host, int $port, string $user, string $pass,
                   string $from, string $to, string $subject, string $body,
                   string $replyTo = ''): bool
{
    smtp_log("=== INICIO SMTP === host=$host port=$port user=$user");

    $ctx = stream_context_create([
        'ssl' => [
            'verify_peer'       => true,
            'verify_peer_name'  => true,
            'allow_self_signed' => false,
        ],
    ]);

    if ($port === 465) {
        $sock = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
    } else {
        $sock = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 15);
    }

    if (!$sock) {
        smtp_log("CONEXIÓN FALLIDA: errno=$errno errstr=$errstr");
        return false;
    }
    smtp_log("Conexión establecida OK");

    $read = function () use ($sock): string {
        $buf = '';
        while ($line = fgets($sock, 512)) {
            $buf .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $buf;
    };

    $cmd = function (string $c) use ($sock, $read): string {
        $label = (strpos($c, "\r\n") !== false) ? '[DATA body]' : $c;
        fwrite($sock, $c . "\r\n");
        $r = $read();
        smtp_log("CMD: $label  |  RESP: " . trim($r));
        return $r;
    };

    $banner = $read();
    smtp_log("BANNER: " . trim($banner));

    $cmd("EHLO " . (gethostname() ?: 'damiasolve.com'));

    if ($port === 587) {
        $r = $cmd("STARTTLS");
        if (strpos($r, '220') === false) {
            smtp_log("STARTTLS rechazado: $r");
            fclose($sock);
            return false;
        }
        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            smtp_log("TLS handshake fallido");
            fclose($sock);
            return false;
        }
        smtp_log("TLS handshake OK");
        $cmd("EHLO " . (gethostname() ?: 'damiasolve.com'));
    }

    $cmd("AUTH LOGIN");
    $cmd(base64_encode($user));
    $r = $cmd(base64_encode($pass));
    if (strpos($r, '235') === false) {
        smtp_log("AUTENTICACIÓN FALLIDA: $r");
        fclose($sock);
        return false;
    }
    smtp_log("Autenticación OK");

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

    $ok = strpos($r, '250') !== false;
    smtp_log("RESULTADO ENVÍO: " . ($ok ? 'OK' : 'FALLIDO') . " resp=$r");
    return $ok;
}

/* ── Enviar ────────────────────────────────────────── */
$enviado = smtp_send(
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    SMTP_USER, DESTINO, $asunto, $cuerpo, $email
);

/* ── Redirigir ─────────────────────────────────────── */
header('Location: ' . PAGINA . ($enviado ? '?estado=ok' : '?estado=error') . '#form-derechos');
exit;
