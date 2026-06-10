<?php
/**
 * Embajadores Cámara FP — alumnos/as que se ofrecen a colaborar con el centro.
 *
 *  GET    → lista de embajadores (admin ve todos con datos de contacto;
 *           alumni ve solo en qué acciones está apuntado él/ella)
 *  POST   { tipo, mensaje }  → apuntarse a una acción
 *  DELETE { tipo }           → darse de baja de una acción
 */
require __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];
$user   = requireLogin();
$isAdmin = ($user['rol'] ?? '') === 'admin';

$TIPOS = ['charla_clase','video_testimonio','video_promo','shooting_fotos','otra'];

if ($method === 'GET') {
    if ($isAdmin) {
        /* Admin: todos los embajadores con datos de contacto para coordinar */
        $rows = $pdo->query('
            SELECT e.id, e.tipo, e.mensaje, e.estado, e.fecha_creacion,
                   u.dni, u.nombre, u.apellidos, u.email, u.telefono, u.ciclo, u.promocion
            FROM embajadores e
            JOIN usuarios u ON u.id = e.usuario_id
            ORDER BY e.fecha_creacion DESC
        ')->fetchAll();
        jsonOut($rows);
    } else {
        /* Alumni: solo sus propias inscripciones */
        $stmt = $pdo->prepare('SELECT tipo, estado FROM embajadores WHERE usuario_id = ?');
        $stmt->execute([$user['id']]);
        jsonOut($stmt->fetchAll());
    }
}

if ($method === 'POST') {
    $in   = jsonInput();
    $tipo = $in['tipo'] ?? '';
    if (!in_array($tipo, $TIPOS, true)) jsonOut(['error' => 'Tipo de acción inválido'], 400);
    $msg = validateLen($in['mensaje'] ?? '', 500, 'mensaje');
    try {
        $pdo->prepare('INSERT INTO embajadores (usuario_id, tipo, mensaje) VALUES (?,?,?)')
            ->execute([$user['id'], $tipo, $msg]);
        jsonOut(['ok' => true], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') jsonOut(['error' => 'Ya estabas apuntado/a a esta acción'], 409);
        jsonOut(['error' => 'No se pudo guardar'], 500);
    }
}

if ($method === 'DELETE') {
    $in   = jsonInput();
    $tipo = $in['tipo'] ?? '';
    $pdo->prepare('DELETE FROM embajadores WHERE usuario_id = ? AND tipo = ?')->execute([$user['id'], $tipo]);
    jsonOut(['ok' => true]);
}

jsonOut(['error' => 'Method not allowed'], 405);
