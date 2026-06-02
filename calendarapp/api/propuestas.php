<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireAdmin();
    jsonOut($pdo->query('SELECT * FROM propuestas_conferencias ORDER BY fecha_creacion DESC')->fetchAll());
}

if ($method === 'POST') {
    $user = requireLogin();
    if (!rateLimit('prop:' . $user['id'], 3, 3600)) {  // 3 propuestas / hora
        jsonOut(['error' => 'Has enviado demasiadas propuestas hoy'], 429);
    }
    $in   = jsonInput();
    $tema = validateLen($in['tema']        ?? '', 200, 'tema');
    $desc = validateLen($in['descripcion'] ?? '', 1000, 'descripcion');
    if (!$tema) jsonOut(['error' => 'Falta tema'], 400);
    $formato = in_array($in['formato'] ?? 'Online', ['Presencial','Online','Indiferente','Híbrido'], true) ? $in['formato'] : 'Online';
    $stmt = $pdo->prepare('INSERT INTO propuestas_conferencias (usuario_id, nombre, email, ciclo, promocion, tema, duracion, formato, descripcion) VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $user['id'],
        validateLen($in['nombre'] ?? $user['nombre'], 150, 'nombre'),
        validateLen($in['email']  ?? $user['email'],  150, 'email'),
        $in['ciclo']     ?? $user['ciclo'] ?? null,
        $in['promocion'] ?? $user['promocion'] ?? null,
        $tema,
        $in['duracion'] ?? '45',
        $formato,
        $desc,
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
