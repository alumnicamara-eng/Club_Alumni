<?php
/**
 * Envía una notificación push a TODOS los suscriptores activos.
 * Solo admins. Llamado desde el panel Admin > Configuración.
 *
 * Body JSON: { title, body, url? }
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

$in    = jsonInput();
$title = trim($in['title'] ?? '');
$body  = trim($in['body']  ?? '');
$url   = trim($in['url']   ?? '/');
if (!$title || !$body) jsonOut(['error' => 'Faltan title y body'], 400);

$payload = json_encode(['title' => $title, 'body' => $body, 'url' => $url], JSON_UNESCAPED_UNICODE);

$wp = new WebPush($vapid['publicKey'], $vapid['privateKey'], $vapid['subject']);

$subs = $pdo->query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions')->fetchAll();
$sent = 0; $failed = 0;

foreach ($subs as $s) {
    [$ok, $code, $err] = $wp->send([
        'endpoint' => $s['endpoint'],
        'keys'     => ['p256dh' => $s['p256dh'], 'auth' => $s['auth']],
    ], $payload);

    if ($ok) {
        $sent++;
    } else {
        $failed++;
        /* Si el endpoint ya no es válido (410 Gone, 404), lo borramos */
        if (in_array($code, [404, 410], true)) {
            $pdo->prepare('DELETE FROM push_subscriptions WHERE id = ?')->execute([$s['id']]);
        }
    }
}

jsonOut(['sent' => $sent, 'failed' => $failed, 'total' => count($subs)]);
