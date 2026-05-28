<?php
/**
 * DamIASolve – Procesador de solicitudes de derechos RGPD
 * ============================================================
 * Versión segura con:
 *   - Credenciales en smtp_config.php FUERA de public_html
 *   - Verificación de origen (anti-CSRF básico por Referer)
 *   - Campo honeypot anti-bots
 *   - Rate limiting por IP (máximo 3 envíos por hora)
 *   - Log SMTP desactivado por defecto en producción
 * ============================================================
 */

// ── Marca que permite que smtp_config.php sea incluido
define('DESDE_ENVIAR', true);

// ── Ruta al archivo de configuración (fuera de public_html)
// __DIR__  →  /home/usuario/public_html/privacidad
// dirname(__DIR__)      →  /home/usuario/public_html
// dirname(__DIR__, 2)   →  /home/usuario          ← aquí va smtp_config.php
$config_path = dirname(__DIR__, 2) . '/smtp_config.php';

if (!file_exists($config_path)) {
    // Fallback: si no existe fuera de public_html, busca en la misma carpeta
    // (útil durante la migración)
    $config_path = __DIR__ . '/config.php';
}

require_once $config_path;


/* ══════════════════════════════════════════════════════
   FUNCIONES DE APOYO
   ══════════════════════════════════════════════════════ */

/**
 * Escribe una línea en el log de diagnóstico SMTP.
 * Solo funciona si LOG_FILE está definido y no es null (modo debug).
 */
function smtp_log(string $msg): void {
    if (defined('LOG_FILE') && LOG_FILE !== null) {
        file_put_contents(LOG_FILE, date('[d/m/Y H:i:s] ') . $msg . "\n", FILE_APPEND | LOCK_EX);
    }
}

/**
 * Limpia un texto de caracteres peligrosos.
 */
function limpiar(string $v): string {
    return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8');
}


/* ══════════════════════════════════════════════════════
   SEGURIDAD – COMPROBACIONES ANTES DE PROCESAR NADA
   ══════════════════════════════════════════════════════ */

// ── Solo aceptamos peticiones POST (el formulario siempre usa POST)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . PAGINA);
    exit;
}

// ── Verificación de origen (anti-CSRF básico)
// Comprobamos que la petición viene de damiasolve.com y no de otra web.
// Esto evita que alguien cree un formulario falso en otro sitio que use
// nuestro servidor para enviar emails (gasto de cuota SMTP sin permiso).
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$dominio_permitido = 'damiasolve.com';
if (!str_contains($referer, $dominio_permitido)) {
    // La petición no viene de nuestra web → la ignoramos silenciosamente
    header('Location: ' . PAGINA . '?estado=error#form-derechos');
    exit;
}

// ── Campo honeypot anti-bots
// El campo "website" está oculto en el formulario HTML (display:none).
// Un usuario real nunca lo verá ni lo rellenará.
// Un robot de spam sí lo rellena automáticamente.
// Si llega con contenido → es un bot → redirigimos sin avisar de que fue detectado.
if (!empty($_POST['website'])) {
    // Bot detectado: fingimos éxito para no revelar que tenemos protección
    header('Location: ' . PAGINA . '?estado=ok#form-derechos');
    exit;
}

// ── Rate limiting por IP: máximo 3 envíos por hora
// Usamos un archivo JSON en el directorio temporal del sistema (no accesible desde el navegador).
// Cada IP queda registrada con el número de intentos y la hora del primer intento en la ventana.
$ip_usuario   = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
$ip_hash      = md5($ip_usuario);  // hasheamos la IP para no guardar datos personales en texto plano
$archivo_rl   = sys_get_temp_dir() . '/damiasolve_rl_' . $ip_hash . '.json';
$limite_envios = 3;
$ventana_horas = 3600; // 1 hora en segundos

$ahora   = time();
$datos_rl = ['intentos' => 0, 'primer_intento' => $ahora];

if (file_exists($archivo_rl)) {
    $contenido = json_decode(file_get_contents($archivo_rl), true);
    if (is_array($contenido)) {
        $datos_rl = $contenido;
        // Si ha pasado más de 1 hora desde el primer intento, reiniciamos la ventana
        if (($ahora - $datos_rl['primer_intento']) > $ventana_horas) {
            $datos_rl = ['intentos' => 0, 'primer_intento' => $ahora];
        }
    }
}

if ($datos_rl['intentos'] >= $limite_envios) {
    // Esta IP ha superado el límite de envíos → bloqueamos
    smtp_log("RATE LIMIT superado para IP hash=$ip_hash intentos={$datos_rl['intentos']}");
    header('Location: ' . PAGINA . '?estado=error#form-derechos');
    exit;
}

// Registramos este intento (lo guardaremos definitivamente al final, solo si pasa validación)
$datos_rl['intentos']++;


/* ══════════════════════════════════════════════════════
   RECOGER Y VALIDAR DATOS DEL FORMULARIO
   ══════════════════════════════════════════════════════ */

$nombre      = limpiar($_POST['nombre']      ?? '');
$email       = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$derecho     = limpiar($_POST['derecho']     ?? '');
$descripcion = limpiar($_POST['descripcion'] ?? '');
$procedencia = limpiar($_POST['procedencia'] ?? 'Política de Privacidad – damiasolve.com');

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

// Guardar el contador de rate limiting ahora que la petición pasó validación
file_put_contents($archivo_rl, json_encode($datos_rl), LOCK_EX);


/* ══════════════════════════════════════════════════════
   CONSTRUIR EL MENSAJE DE EMAIL
   ══════════════════════════════════════════════════════ */

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
    smtp_log("=== INICIO SMTP === host=$host port=$port user=$user");

    $ctx = stream_context_create([
        'ssl' => [
            'verify_peer'       => true,
            'verify_peer_name'  => true,
            'allow_self_signed' => false,
        ],
    ]);

    // Conexión: STARTTLS en puerto 587, SSL directo en puerto 465
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

    // Función para leer la respuesta del servidor SMTP
    $read = function () use ($sock): string {
        $buf = '';
        while ($line = fgets($sock, 512)) {
            $buf .= $line;
            if (isset($line[3]) && $line[3] === ' ') break; // última línea de la respuesta SMTP
        }
        return $buf;
    };

    // Función para enviar un comando y registrar la respuesta
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

    // Activar cifrado TLS (obligatorio en puerto 587 de Microsoft)
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

    // Autenticación con usuario y contraseña
    $cmd("AUTH LOGIN");
    $cmd(base64_encode($user));
    $r = $cmd(base64_encode($pass));
    if (strpos($r, '235') === false) {
        smtp_log("AUTENTICACIÓN FALLIDA: $r");
        fclose($sock);
        return false;
    }
    smtp_log("Autenticación OK");

    // Enviar el email
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

/* ── Enviar el email ───────────────────────────────── */
$enviado = smtp_send(
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    SMTP_USER,   // From = nuestra dirección (evita que vaya a spam)
    DESTINO,
    $asunto,
    $cuerpo,
    $email       // Reply-To = email del solicitante (para responderle fácilmente)
);

/* ── Redirigir al usuario ──────────────────────────── */
header('Location: ' . PAGINA . ($enviado ? '?estado=ok' : '?estado=error') . '#form-derechos');
exit;
