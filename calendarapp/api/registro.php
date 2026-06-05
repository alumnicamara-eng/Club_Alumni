<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

if (!rateLimit('register:' . clientIp(), 5, 3600)) {
    jsonOut(['error' => 'Demasiados registros desde tu IP, intenta más tarde'], 429);
}

$in      = jsonInput();
$nombre  = validateLen($in['nombre']   ?? '', 100, 'nombre');
$email   = validateLen($in['email']    ?? '', 150, 'email');
$pass    = (string)($in['password']    ?? '');
$motivos = validateLen($in['motivos']  ?? '', 1000, 'motivos');
if (!$nombre || !$email || !$pass) jsonOut(['error' => 'Faltan campos'], 400);
if (!$motivos) jsonOut(['error' => 'Indica el motivo por el que quieres unirte'], 400);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) jsonOut(['error' => 'Email inválido'], 400);
if (strlen($pass) < 8 || strlen($pass) > 200) jsonOut(['error' => 'La contraseña debe tener entre 8 y 200 caracteres'], 400);

$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = :e LIMIT 1');
$stmt->execute([':e' => $email]);
if ($stmt->fetch()) jsonOut(['error' => 'El email ya está registrado'], 409);

$hash = password_hash($pass, PASSWORD_BCRYPT);
$sql = 'INSERT INTO usuarios (dni, nombre, apellidos, email, password, telefono, ciclo, promocion, empresa, puesto, sector, bio, motivos, rol, activo)
        VALUES (:dni, :nombre, :apellidos, :email, :password, :telefono, :ciclo, :promocion, :empresa, :puesto, :sector, :bio, :motivos, :rol, 0)';
$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':dni'       => $in['dni']       ?? null,
    ':nombre'    => $nombre,
    ':apellidos' => validateLen($in['apellidos'] ?? '', 100, 'apellidos'),
    ':email'     => $email,
    ':password'  => $hash,
    ':telefono'  => validateLen($in['telefono']  ?? '', 20,  'telefono'),
    ':ciclo'     => $in['ciclo']     ?? null,
    ':promocion' => $in['promocion'] ?? null,
    ':empresa'   => validateLen($in['empresa']   ?? '', 150, 'empresa'),
    ':puesto'    => validateLen($in['puesto']    ?? '', 150, 'puesto'),
    ':sector'    => $in['sector']    ?? null,
    ':bio'       => validateLen($in['bio']       ?? '', 1000, 'bio'),
    ':motivos'   => $motivos,
    ':rol'       => 'alumno',  // No se permite registrarse como admin
]);
jsonOut([
    'id'      => (int)$pdo->lastInsertId(),
    'ok'      => true,
    'pending' => true,
    'message' => 'Tu solicitud está pendiente de aprobación. El equipo Alumni la revisará en breve y recibirás un email cuando se active tu cuenta.',
], 201);
