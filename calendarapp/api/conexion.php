<?php
/**
 * Conexión + bootstrap de seguridad — incluido por todos los endpoints.
 * Carga la configuración de config.php (gitignored) o config.example.php (fallback).
 */

// === CARGA DE CONFIG ===
$cfgPath = file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/config.example.php';
$CFG = require $cfgPath;

// === FORZAR HTTPS ===
if (!empty($CFG['force_https']) &&
    empty($_SERVER['HTTPS']) &&
    ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') !== 'https' &&
    !in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1'], true)
) {
    header('Location: https://' . ($_SERVER['HTTP_HOST'] ?? '') . ($_SERVER['REQUEST_URI'] ?? ''), true, 301);
    exit;
}

// === CORS ESTRICTO ===
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $CFG['allowed_origins'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// === CABECERAS DE SEGURIDAD ===
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// === SESIÓN SEGURA ===
session_name($CFG['session_name']);
session_set_cookie_params([
    'lifetime' => $CFG['session_lifetime'],
    'path'     => '/',
    'domain'   => '',
    'secure'   => !empty($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax',  // 'Strict' rompería navegación entrante; 'Lax' protege CSRF en POST
]);
session_start();

// === CONEXIÓN PDO ===
try {
    $pdo = new PDO(
        "mysql:host={$CFG['db']['host']};dbname={$CFG['db']['name']};charset=utf8mb4",
        $CFG['db']['user'],
        $CFG['db']['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    error_log('DB connect error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

// =================== HELPERS ===================

function jsonInput(): array {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 100_000) { jsonOut(['error' => 'Payload demasiado grande'], 413); }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function jsonOut($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function requireLogin(): array {
    if (empty($_SESSION['user'])) jsonOut(['error' => 'No autenticado'], 401);
    return $_SESSION['user'];
}

function requireAdmin(): array {
    $u = requireLogin();
    if (($u['rol'] ?? '') !== 'admin') jsonOut(['error' => 'No autorizado'], 403);
    return $u;
}

/** Limita la longitud de un campo de texto. */
function validateLen(?string $v, int $max, string $field): string {
    $v = is_string($v) ? trim($v) : '';
    if (mb_strlen($v) > $max) jsonOut(['error' => "$field excede $max caracteres"], 400);
    return $v;
}

/**
 * Rate limiting basado en fichero (suficiente para hosting compartido sin Redis).
 *  $key      = identificador único (ej. 'login:' . $ip)
 *  $max      = nº máx de intentos
 *  $window   = ventana en segundos
 * Devuelve true si está dentro del límite, false si está bloqueado.
 */
function rateLimit(string $key, int $max, int $window): bool {
    $dir = sys_get_temp_dir() . '/alumni-ratelimit';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . '/' . sha1($key);
    $now  = time();

    $hits = [];
    if (file_exists($file)) {
        $hits = array_filter(
            json_decode(file_get_contents($file) ?: '[]', true) ?: [],
            fn($t) => is_int($t) && ($now - $t) < $window
        );
    }
    if (count($hits) >= $max) return false;
    $hits[] = $now;
    file_put_contents($file, json_encode(array_values($hits)), LOCK_EX);
    return true;
}

function clientIp(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        if (!empty($_SERVER[$h])) {
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return 'unknown';
}
