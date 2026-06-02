<?php
require __DIR__ . '/conexion.php';

$user = requireLogin();
$in   = jsonInput();
$ev   = (int)($in['evento_id'] ?? 0);
if (!$ev) jsonOut(['error' => 'evento_id requerido'], 400);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    /* Comprobar que quedan plazas */
    $cnt = $pdo->prepare('SELECT COUNT(*) FROM inscripciones WHERE evento_id = ?');
    $cnt->execute([$ev]);
    $plazas = $pdo->prepare('SELECT plazas FROM eventos WHERE id = ?');
    $plazas->execute([$ev]);
    $max = (int)$plazas->fetchColumn();
    if ((int)$cnt->fetchColumn() >= $max) jsonOut(['error' => 'No quedan plazas'], 409);

    try {
        $pdo->prepare('INSERT INTO inscripciones (usuario_id, evento_id) VALUES (?,?)')->execute([$user['id'], $ev]);
    } catch (PDOException $e) {
        /* Inscripción duplicada */
        jsonOut(['error' => 'Ya estás inscrito'], 409);
    }
    jsonOut(['ok' => true]);
}

if ($method === 'DELETE') {
    $pdo->prepare('DELETE FROM inscripciones WHERE usuario_id = ? AND evento_id = ?')->execute([$user['id'], $ev]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
