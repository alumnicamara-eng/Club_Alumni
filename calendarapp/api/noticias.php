<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireLogin();
    $stmt = $pdo->query('SELECT * FROM noticias ORDER BY fecha DESC LIMIT 200');
    jsonOut($stmt->fetchAll());
}

if ($method === 'POST') {
    requireAdmin();
    $in     = jsonInput();
    $titulo = validateLen($in['titulo']  ?? '', 200, 'titulo');
    $res    = validateLen($in['resumen'] ?? '', 500, 'resumen');
    $url    = validateLen($in['wp_url']  ?? '', 500, 'wp_url');
    $tag    = in_array($in['tag'] ?? 'club', ['club','empleo','formacion','eventos'], true) ? $in['tag'] : 'club';
    $fecha  = $in['fecha'] ?? '';
    if (!$titulo || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) jsonOut(['error' => 'Faltan campos obligatorios'], 400);
    $stmt = $pdo->prepare('INSERT INTO noticias (titulo, resumen, tag, fecha, wp_url) VALUES (?,?,?,?,?)');
    $stmt->execute([$titulo, $res, $tag, $fecha, $url ?: null]);
    jsonOut(['id' => (int)$pdo->lastInsertId(), 'ok' => true], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'id requerido'], 400);
    $pdo->prepare('DELETE FROM noticias WHERE id = ?')->execute([$id]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
