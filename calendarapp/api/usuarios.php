<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);
requireLogin();

/* Email y teléfono solo se devuelven al propio usuario o al admin (privacidad).
   El directorio público de alumnis NO debe llevar contactos directos. */
$me     = $_SESSION['user'] ?? [];
$isMe   = fn($id) => (int)($me['id'] ?? 0) === (int)$id;
$isAdmn = ($me['rol'] ?? '') === 'admin';

$stmt = $pdo->query('SELECT id, dni, nombre, apellidos, email, telefono, ciclo, promocion, empresa, puesto, sector, bio, linkedin, github, web, foto, rol FROM usuarios WHERE activo = 1 ORDER BY nombre');
$rows = array_map(function ($u) use ($isMe, $isAdmn) {
    if (!$isMe($u['id']) && !$isAdmn) {
        unset($u['email'], $u['telefono']);
    }
    return $u;
}, $stmt->fetchAll());
jsonOut($rows);
