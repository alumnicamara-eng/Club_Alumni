<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireAdmin();
    jsonOut($pdo->query('SELECT * FROM propuestas_conferencias ORDER BY fecha_creacion DESC')->fetchAll());
}

if ($method === 'POST') {
    $user = requireLogin();
    $in   = jsonInput();
    if (empty($in['tema'])) jsonOut(['error' => 'Falta tema'], 400);
    $stmt = $pdo->prepare('INSERT INTO propuestas_conferencias (usuario_id, nombre, email, ciclo, promocion, tema, duracion, formato, descripcion) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $user['id'],
        $in['nombre']      ?? $user['nombre'],
        $in['email']       ?? $user['email'],
        $in['ciclo']       ?? $user['ciclo'] ?? null,
        $in['promocion']   ?? $user['promocion'] ?? null,
        $in['tema'],
        $in['duracion']    ?? '45',
        $in['formato']     ?? 'Online',
        $in['descripcion'] ?? '',
    ]);
    jsonOut(['ok' => true], 201);
}

if ($method === 'PUT') {
    requireAdmin();
    $in     = jsonInput();
    $id     = (int)($in['id'] ?? 0);
    $estado = $in['estado'] ?? null;
    if (!$id || !in_array($estado, ['approved', 'rejected'], true)) jsonOut(['error' => 'Parámetros inválidos'], 400);
    $pdo->prepare('UPDATE propuestas_conferencias SET estado = ? WHERE id = ?')->execute([$estado, $id]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
