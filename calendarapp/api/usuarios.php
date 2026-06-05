<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

/* ===== DELETE: admin elimina un usuario ===== */
if ($method === 'DELETE') {
    $me = requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'id requerido'], 400);
    if ((int)$me['id'] === $id) jsonOut(['error' => 'No puedes eliminarte a ti mismo'], 403);
    $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) jsonOut(['error' => 'Usuario no encontrado'], 404);
    jsonOut(['ok' => true]);
}

if ($method !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);
requireLogin();

/* Email y teléfono solo se devuelven al propio usuario o al admin (privacidad). */
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
