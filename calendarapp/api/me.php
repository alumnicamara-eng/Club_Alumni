<?php
/**
 * Devuelve el usuario asociado a la cookie de sesión actual.
 * 401 si no hay sesión válida.
 */
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);

$session = requireLogin();  // 401 si no hay sesión

/* Devolvemos los datos frescos de la BD (no los cacheados en $_SESSION) */
$stmt = $pdo->prepare('SELECT id, dni, nombre, apellidos, email, telefono, ciclo, promocion,
                              empresa, puesto, sector, bio, linkedin, github, web, foto, rol,
                              push_eventos, push_noticias, push_mentor, activo
                       FROM usuarios WHERE id = ? LIMIT 1');
$stmt->execute([$session['id']]);
$row = $stmt->fetch();

if (!$row || (int)$row['activo'] !== 1) {
    /* Si el admin desactivó la cuenta mientras estaba logueado */
    session_destroy();
    jsonOut(['error' => 'Sesión inválida'], 401);
}

/* Refresca la sesión con los datos actualizados */
$_SESSION['user'] = array_merge($_SESSION['user'], $row);
jsonOut($row);
