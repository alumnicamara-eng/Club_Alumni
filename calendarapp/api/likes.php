<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$user = requireLogin();
$in   = jsonInput();
$pub  = (int)($in['publicacion_id'] ?? 0);
if (!$pub) jsonOut(['error' => 'publicacion_id requerido'], 400);

/* Toggle: si ya hay like, quitar; si no, añadir */
$stmt = $pdo->prepare('SELECT id FROM publicaciones_likes WHERE publicacion_id = ? AND usuario_id = ?');
$stmt->execute([$pub, $user['id']]);

if ($id = $stmt->fetchColumn()) {
    $pdo->prepare('DELETE FROM publicaciones_likes WHERE id = ?')->execute([$id]);
    jsonOut(['liked' => false]);
} else {
    $pdo->prepare('INSERT INTO publicaciones_likes (publicacion_id, usuario_id) VALUES (?,?)')->execute([$pub, $user['id']]);
    jsonOut(['liked' => true]);
}
