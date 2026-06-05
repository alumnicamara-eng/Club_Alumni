<?php
/**
 * Gestión de solicitudes de registro pendientes (solo admin).
 *
 *  GET                 → lista de usuarios con activo=0
 *  PUT  {id, accion}   → accion = 'approve' | 'reject'
 *                        approve: pone activo=1 y fecha_aprobacion=NOW
 *                        reject:  elimina el usuario
 */

require __DIR__ . '/conexion.php';

requireAdmin();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('
        SELECT id, dni, nombre, apellidos, email, telefono, ciclo, promocion, empresa, puesto, sector, bio, motivos, fecha_registro
        FROM usuarios
        WHERE activo = 0
        ORDER BY fecha_registro DESC
    ');
    jsonOut($stmt->fetchAll());
}

if ($method === 'PUT') {
    $in     = jsonInput();
    $id     = (int)($in['id'] ?? 0);
    $accion = $in['accion'] ?? '';
    if (!$id || !in_array($accion, ['approve', 'reject'], true)) {
        jsonOut(['error' => 'Parámetros inválidos'], 400);
    }

    if ($accion === 'approve') {
        $stmt = $pdo->prepare('UPDATE usuarios SET activo = 1, fecha_aprobacion = CURRENT_TIMESTAMP WHERE id = ? AND activo = 0');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonOut(['error' => 'Usuario no encontrado o ya aprobado'], 404);
    } else {
        $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ? AND activo = 0');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) jsonOut(['error' => 'Usuario no encontrado'], 404);
    }
    jsonOut(['ok' => true, 'accion' => $accion]);
}

jsonOut(['error' => 'Method not allowed'], 405);
