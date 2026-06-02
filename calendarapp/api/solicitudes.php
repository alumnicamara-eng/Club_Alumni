<?php
require __DIR__ . '/conexion.php';

$user = requireLogin();
$in   = jsonInput();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $mentor = (int)($in['mentor_id'] ?? 0);
    if (!$mentor) jsonOut(['error' => 'mentor_id requerido'], 400);

    /* Comprobar que el mentor es del mismo ciclo que el mentee */
    $stmt = $pdo->prepare('SELECT ciclo FROM mentores WHERE id = ?');
    $stmt->execute([$mentor]);
    $mciclo = $stmt->fetchColumn();
    if ($mciclo !== $user['ciclo']) jsonOut(['error' => 'Solo puedes pedir mentor del mismo ciclo que cursas'], 400);

    try {
        $pdo->prepare('INSERT INTO solicitudes_mentoria (mentor_id, mentee_id, mensaje) VALUES (?,?,?)')
            ->execute([$mentor, $user['id'], $in['mensaje'] ?? '']);
        jsonOut(['ok' => true], 201);
    } catch (PDOException $e) {
        jsonOut(['error' => 'Ya tienes una solicitud con ese mentor'], 409);
    }
}

if ($method === 'PUT') {
    /* El mentor acepta/rechaza */
    $sol = (int)($in['solicitud_id'] ?? 0);
    $estado = $in['estado'] ?? null;
    if (!$sol || !in_array($estado, ['accepted', 'rejected'], true)) jsonOut(['error' => 'Parámetros inválidos'], 400);
    $pdo->prepare('UPDATE solicitudes_mentoria SET estado = ? WHERE id = ?')->execute([$estado, $sol]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
