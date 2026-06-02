<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireLogin();
    /* Mentor + dni del usuario + lista de DNIs de mentees aceptados */
    $stmt = $pdo->query('
        SELECT m.*, u.dni AS usuario_dni,
               GROUP_CONCAT(DISTINCT mu.dni) AS mentees_csv
        FROM mentores m
        JOIN usuarios u ON u.id = m.usuario_id
        LEFT JOIN solicitudes_mentoria sm ON sm.mentor_id = m.id AND sm.estado = "accepted"
        LEFT JOIN usuarios mu ON mu.id = sm.mentee_id
        WHERE m.activo = 1
        GROUP BY m.id
    ');
    $rows = array_map(function ($r) {
        $r['mentees'] = $r['mentees_csv'] ? explode(',', $r['mentees_csv']) : [];
        unset($r['mentees_csv']);
        return $r;
    }, $stmt->fetchAll());
    jsonOut($rows);
}

if ($method === 'POST') {
    $user = requireLogin();
    $in   = jsonInput();
    $ciclo = $in['ciclo'] ?? $user['ciclo'];
    if (!$ciclo) jsonOut(['error' => 'Falta ciclo'], 400);
    try {
        $stmt = $pdo->prepare('INSERT INTO mentores (usuario_id, ciclo, bio, max_mentees) VALUES (?,?,?,?)');
        $stmt->execute([$user['id'], $ciclo, $in['bio'] ?? '', (int)($in['max_mentees'] ?? 5)]);
        jsonOut(['ok' => true], 201);
    } catch (PDOException $e) {
        jsonOut(['error' => 'Ya eres mentor de ese ciclo'], 409);
    }
}

jsonOut(['error' => 'Method not allowed'], 405);
