<?php
/**
 * Envía push notification SOLO a los usuarios inscritos a un evento.
 * Útil cuando el admin quiere avisar de un cambio de hora/lugar.
 *
 * POST { evento_id, title, body, url? }
 * Devuelve: { sent, failed, total }
 */

require __DIR__ . '/conexion.php';
require __DIR__ . '/lib/WebPush.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

requireAdmin();

if (!file_exists(__DIR__ . '/vapid.php')) {
    jsonOut(['error' => 'Falta api/vapid.php — ejecuta generate-vapid.php'], 500);
}
$vapid = require __DIR__ . '/vapid.php';

$in     = jsonInput();
$evento = (int)($in['evento_id'] ?? 0);
$title  = validateLen($in['title'] ?? '', 100, 'title');
$body   = validateLen($in['body']  ?? '', 300, 'body');
$url    = validateLen($in['url']   ?? '/', 200, 'url');
if (!$evento || !$title || !$body) jsonOut(['error' => 'Faltan campos'], 400);

$payload = json_encode(['title' => $title, 'body' => $body, 'url' => $url], JSON_UNESCAPED_UNICODE);
$wp      = new WebPush($vapid['publicKey'], $vapid['privateKey'], $vapid['subject']);

/* Subscripciones SOLO de los inscritos a este evento */
$stmt = $pdo->prepare('
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN inscripciones i ON i.usuario_id = ps.usuario_id
    WHERE i.evento_id = ?
');
$stmt->execute([$evento]);
$subs = $stmt->fetchAll();

$sent = 0; $failed = 0;
foreach ($subs as $s) {
    [$ok, $code, $err] = $wp->send([
        'endpoint' => $s['endpoint'],
        'keys'     => ['p256dh' => $s['p256dh'], 'auth' => $s['auth']],
    ], $payload);
    if ($ok) $sent++;
    else {
        $failed++;
        if (in_array($code, [404, 410], true)) {
            $pdo->prepare('DELETE FROM push_subscriptions WHERE id = ?')->execute([$s['id']]);
        }
    }
}

jsonOut(['sent' => $sent, 'failed' => $failed, 'total' => count($subs)]);
