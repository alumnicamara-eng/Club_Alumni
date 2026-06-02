<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM noticias ORDER BY fecha DESC');
    jsonOut($stmt->fetchAll());
}

if ($method === 'POST') {
    requireAdmin();
    $in = jsonInput();
    if (empty($in['titulo']) || empty($in['fecha'])) jsonOut(['error' => 'Faltan campos obligatorios'], 400);
    $stmt = $pdo->prepare('INSERT INTO noticias (titulo, resumen, tag, fecha, wp_url) VALUES (?,?,?,?,?)');
    $stmt->execute([$in['titulo'], $in['resumen'] ?? '', $in['tag'] ?? 'club', $in['fecha'], $in['wp_url'] ?? null]);
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
