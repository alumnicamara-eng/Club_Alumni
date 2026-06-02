<?php
require __DIR__ . '/conexion.php';

$user = requireLogin();
$in   = jsonInput();
$ev   = (int)($in['evento_id'] ?? 0);
if (!$ev) jsonOut(['error' => 'evento_id requerido'], 400);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    /* Transacción con SELECT ... FOR UPDATE para evitar race condition
       cuando dos usuarios pulsan "Apuntarme" simultáneamente y solo queda 1 plaza. */
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT plazas FROM eventos WHERE id = ? FOR UPDATE');
        $stmt->execute([$ev]);
        $max = $stmt->fetchColumn();
        if ($max === false) { $pdo->rollBack(); jsonOut(['error' => 'Evento no existe'], 404); }

        $cnt = $pdo->prepare('SELECT COUNT(*) FROM inscripciones WHERE evento_id = ?');
        $cnt->execute([$ev]);
        if ((int)$cnt->fetchColumn() >= (int)$max) {
            $pdo->rollBack();
            jsonOut(['error' => 'No quedan plazas'], 409);
        }

        $pdo->prepare('INSERT INTO inscripciones (usuario_id, evento_id) VALUES (?,?)')
            ->execute([$user['id'], $ev]);

        $pdo->commit();
        jsonOut(['ok' => true]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        /* SQLSTATE 23000 = constraint violation (UNIQUE) → ya estaba inscrito */
        if ($e->getCode() === '23000') jsonOut(['error' => 'Ya estás inscrito'], 409);
        error_log('inscripcion.php: ' . $e->getMessage());
        jsonOut(['error' => 'Error al inscribirte'], 500);
    }
}

if ($method === 'DELETE') {
    $pdo->prepare('DELETE FROM inscripciones WHERE usuario_id = ? AND evento_id = ?')->execute([$user['id'], $ev]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
