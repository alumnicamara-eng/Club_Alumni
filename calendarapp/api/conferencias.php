<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireLogin();
    jsonOut($pdo->query('SELECT * FROM conferencias ORDER BY fecha DESC LIMIT 200')->fetchAll());
}

if ($method === 'POST') {
    requireAdmin();
    $in = jsonInput();
    foreach (['titulo', 'ponente', 'youtube_url', 'fecha'] as $f) {
        if (empty($in[$f])) jsonOut(['error' => "Falta $f"], 400);
    }
    $stmt = $pdo->prepare('INSERT INTO conferencias (titulo, descripcion, ponente, categoria, youtube_url, fecha) VALUES (?,?,?,?,?,?)');
    $stmt->execute([
        $in['titulo'],
        $in['descripcion'] ?? '',
        $in['ponente'],
        $in['categoria'] ?? 'tecnologia',
        $in['youtube_url'],
        $in['fecha'],
    ]);
    jsonOut(['id' => (int)$pdo->lastInsertId(), 'ok' => true], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'id requerido'], 400);
    $pdo->prepare('DELETE FROM conferencias WHERE id = ?')->execute([$id]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
