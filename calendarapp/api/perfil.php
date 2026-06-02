<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$user = requireLogin();
$in   = jsonInput();

$sql = 'UPDATE usuarios SET
          nombre = :nombre, apellidos = :apellidos, telefono = :telefono,
          ciclo = :ciclo, promocion = :promocion,
          empresa = :empresa, puesto = :puesto, sector = :sector,
          bio = :bio, linkedin = :linkedin, github = :github, web = :web, foto = :foto
        WHERE id = :id';

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':nombre'    => $in['nombre']    ?? $user['nombre'],
    ':apellidos' => $in['apellidos'] ?? $user['apellidos'],
    ':telefono'  => $in['telefono']  ?? null,
    ':ciclo'     => $in['ciclo']     ?? null,
    ':promocion' => $in['promocion'] ?? null,
    ':empresa'   => $in['empresa']   ?? null,
    ':puesto'    => $in['puesto']    ?? null,
    ':sector'    => $in['sector']    ?? null,
    ':bio'       => $in['bio']       ?? null,
    ':linkedin'  => $in['linkedin']  ?? null,
    ':github'    => $in['github']    ?? null,
    ':web'       => $in['web']       ?? null,
    ':foto'      => $in['foto']      ?? null,
    ':id'        => $user['id'],
]);
jsonOut(['ok' => true]);
