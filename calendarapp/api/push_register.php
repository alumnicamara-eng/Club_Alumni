<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$user = requireLogin();
$in   = jsonInput();

$endpoint = $in['endpoint'] ?? null;
$p256dh   = $in['keys']['p256dh'] ?? null;
$auth     = $in['keys']['auth']   ?? null;
if (!$endpoint || !$p256dh || !$auth) jsonOut(['error' => 'Suscripción inválida'], 400);

/* Upsert por endpoint */
$stmt = $pdo->prepare('
    INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), p256dh = VALUES(p256dh), auth = VALUES(auth)
');
$stmt->execute([$user['id'], $endpoint, $p256dh, $auth]);
jsonOut(['ok' => true]);
