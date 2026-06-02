<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$user = requireLogin();
$in   = jsonInput();
$pub  = (int)($in['publicacion_id'] ?? 0);
$txt  = trim($in['texto'] ?? '');
if (!$pub || !$txt) jsonOut(['error' => 'publicacion_id y texto requeridos'], 400);

$stmt = $pdo->prepare('INSERT INTO publicaciones_comentarios (publicacion_id, autor_id, texto) VALUES (?,?,?)');
$stmt->execute([$pub, $user['id'], $txt]);
jsonOut(['id' => (int)$pdo->lastInsertId(), 'ok' => true], 201);
