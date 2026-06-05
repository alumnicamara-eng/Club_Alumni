<?php
/**
 * Devuelve la lista de usuarios inscritos a un evento (solo admin).
 * Incluye datos de contacto (email, teléfono) para que el admin pueda
 * avisarles si cambia la hora, el lugar, etc.
 *
 *  GET ?id=N → [{ id, dni, nombre, apellidos, email, telefono, ciclo, promocion, fecha_inscripcion }, ...]
 */

require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);

requireAdmin();

$evento = (int)($_GET['id'] ?? 0);
if (!$evento) jsonOut(['error' => 'id requerido'], 400);

$stmt = $pdo->prepare('
    SELECT u.id, u.dni, u.nombre, u.apellidos, u.email, u.telefono,
           u.ciclo, u.promocion, u.empresa, u.puesto, u.foto,
           i.fecha_inscripcion
    FROM inscripciones i
    JOIN usuarios u ON u.id = i.usuario_id
    WHERE i.evento_id = ?
    ORDER BY i.fecha_inscripcion ASC
');
$stmt->execute([$evento]);

jsonOut($stmt->fetchAll());
