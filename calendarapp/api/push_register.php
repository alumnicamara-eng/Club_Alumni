<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$user = requireLogin();
$in   = jsonInput();

$endpoint = validateLen($in['endpoint'] ?? '', 500, 'endpoint');
$p256dh   = validateLen($in['keys']['p256dh'] ?? '', 200, 'p256dh');
$auth     = validateLen($in['keys']['auth']   ?? '', 50,  'auth');
if (!$endpoint || !$p256dh || !$auth || !filter_var($endpoint, FILTER_VALIDATE_URL)) {
    jsonOut(['error' => 'Suscripción inválida'], 400);
}

/* Limita el número de subscripciones por usuario para evitar abuso */
$count = $pdo->prepare('SELECT COUNT(*) FROM push_subscriptions WHERE usuario_id = ?');
$count->execute([$user['id']]);
if ((int)$count->fetchColumn() >= ($CFG['push_subs_max_per_user'] ?? 5)) {
    /* Borra la más antigua para no bloquear al usuario que cambia de dispositivo */
    $pdo->prepare('DELETE FROM push_subscriptions WHERE usuario_id = ? ORDER BY fecha_creacion ASC LIMIT 1')->execute([$user['id']]);
}

/* Upsert por endpoint */
$stmt = $pdo->prepare('
    INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), p256dh = VALUES(p256dh), auth = VALUES(auth)
');
$stmt->execute([$user['id'], $endpoint, $p256dh, $auth]);
jsonOut(['ok' => true]);
