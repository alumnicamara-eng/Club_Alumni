<?php
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    /* Publicaciones + autor + DNIs de likers + comentarios */
    $posts = $pdo->query('
        SELECT p.*, u.dni AS autor_dni,
               (SELECT GROUP_CONCAT(ul.dni)
                FROM publicaciones_likes l
                JOIN usuarios ul ON ul.id = l.usuario_id
                WHERE l.publicacion_id = p.id) AS likes_csv
        FROM publicaciones p
        JOIN usuarios u ON u.id = p.autor_id
        ORDER BY p.fecha_creacion DESC
    ')->fetchAll();

    /* Comentarios por publicación */
    $cs = $pdo->query('
        SELECT c.publicacion_id, c.texto, c.fecha, u.dni AS autor_dni
        FROM publicaciones_comentarios c
        JOIN usuarios u ON u.id = c.autor_id
        ORDER BY c.fecha
    ')->fetchAll();
    $byPost = [];
    foreach ($cs as $c) $byPost[$c['publicacion_id']][] = $c;

    $rows = array_map(function ($p) use ($byPost) {
        $p['likes']       = $p['likes_csv'] ? explode(',', $p['likes_csv']) : [];
        $p['comentarios'] = $byPost[$p['id']] ?? [];
        unset($p['likes_csv']);
        return $p;
    }, $posts);
    jsonOut($rows);
}

if ($method === 'POST') {
    $user = requireLogin();
    $in   = jsonInput();
    if (empty($in['texto'])) jsonOut(['error' => 'Falta texto'], 400);
    $stmt = $pdo->prepare('INSERT INTO publicaciones (autor_id, categoria, texto) VALUES (?,?,?)');
    $stmt->execute([$user['id'], $in['categoria'] ?? 'todas', $in['texto']]);
    jsonOut(['id' => (int)$pdo->lastInsertId(), 'ok' => true], 201);
}

jsonOut(['error' => 'Method not allowed'], 405);
