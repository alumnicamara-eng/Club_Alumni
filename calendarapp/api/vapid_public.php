<?php
/**
 * Devuelve solo la clave VAPID pública para que el frontend pueda suscribirse.
 * La privada NUNCA sale del servidor.
 */
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);

if (!file_exists(__DIR__ . '/vapid.php')) {
    jsonOut(['configured' => false, 'message' => 'Falta api/vapid.php (ejecuta generate-vapid.php)']);
}

$cfg = require __DIR__ . '/vapid.php';
jsonOut(['configured' => true, 'publicKey' => $cfg['publicKey']]);
