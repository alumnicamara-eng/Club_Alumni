<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    /* Eventos con array de DNIs inscritos para que el frontend pinte el estado */
    $stmt = $pdo->query('
        SELECT e.*, GROUP_CONCAT(u.dni) AS inscritos_csv
        FROM eventos e
        LEFT JOIN inscripciones i ON i.evento_id = e.id
        LEFT JOIN usuarios u ON u.id = i.usuario_id
        GROUP BY e.id
        ORDER BY e.fecha, e.hora
    ');
    $rows = array_map(function ($r) {
        $r['inscritos'] = $r['inscritos_csv'] ? explode(',', $r['inscritos_csv']) : [];
        unset($r['inscritos_csv']);
        return $r;
    }, $stmt->fetchAll());
    jsonOut($rows);
}

if ($method === 'POST') {
    requireAdmin();
    $in = jsonInput();
    foreach (['titulo', 'fecha'] as $f) {
        if (empty($in[$f])) jsonOut(['error' => "Falta $f"], 400);
    }
    $stmt = $pdo->prepare('INSERT INTO eventos (titulo, descripcion, fecha, hora, ubicacion, categoria, plazas) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([
        $in['titulo'],
        $in['descripcion'] ?? '',
        $in['fecha'],
        $in['hora']      ?? '18:00:00',
        $in['ubicacion'] ?? '',
        $in['categoria'] ?? 'evento',
        (int)($in['plazas'] ?? 50),
    ]);
    jsonOut(['id' => (int)$pdo->lastInsertId(), 'ok' => true], 201);
}

if ($method === 'DELETE') {
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonOut(['error' => 'id requerido'], 400);
    $pdo->prepare('DELETE FROM eventos WHERE id = ?')->execute([$id]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
