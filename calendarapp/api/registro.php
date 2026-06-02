<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$in = jsonInput();
$req = ['nombre', 'email', 'password'];
foreach ($req as $f) {
    if (empty($in[$f])) jsonOut(['error' => "Falta $f"], 400);
}

// Comprueba si el email ya existe
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :e LIMIT 1');
$stmt->execute([':e' => $in['email']]);
if ($stmt->fetch()) jsonOut(['error' => 'El email ya está registrado'], 409);

$hash = password_hash($in['password'], PASSWORD_BCRYPT);

$sql = 'INSERT INTO usuarios (dni, nombre, apellidos, email, password, telefono, ciclo, promocion, empresa, puesto, sector, bio, rol)
        VALUES (:dni, :nombre, :apellidos, :email, :password, :telefono, :ciclo, :promocion, :empresa, :puesto, :sector, :bio, :rol)';
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':dni'       => $in['dni']       ?? null,
    ':nombre'    => $in['nombre'],
    ':apellidos' => $in['apellidos'] ?? '',
    ':email'     => $in['email'],
    ':password'  => $hash,
    ':telefono'  => $in['telefono']  ?? null,
    ':ciclo'     => $in['ciclo']     ?? null,
    ':promocion' => $in['promocion'] ?? null,
    ':empresa'   => $in['empresa']   ?? null,
    ':puesto'    => $in['puesto']    ?? null,
    ':sector'    => $in['sector']    ?? null,
    ':bio'       => $in['bio']       ?? null,
    ':rol'       => 'alumno',
]);
$id = (int)$pdo->lastInsertId();
jsonOut(['id' => $id, 'ok' => true], 201);
