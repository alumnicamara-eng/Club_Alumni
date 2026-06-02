<?php
/**
 * Conexión a MySQL — incluido por todos los demás endpoints.
 * Ajusta las credenciales según el entorno (XAMPP local vs hosting).
 */

// === CONFIGURACIÓN ===
$DB_HOST = 'localhost';
$DB_NAME = 'club_alumni';
$DB_USER = 'root';       // ← cambiar en producción
$DB_PASS = '';           // ← cambiar en producción

// === CONEXIÓN PDO ===
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DB connection failed']);
    exit;
}

// === CABECERAS COMUNES (CORS + JSON) ===
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// === SESIÓN ===
session_start();

// === HELPERS ===
function jsonInput(): array {
    $raw = file_get_contents('php://input');
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
