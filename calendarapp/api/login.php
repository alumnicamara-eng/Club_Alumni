<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

$in   = jsonInput();
$user = trim($in['user'] ?? '');
$pass = (string)($in['pass'] ?? '');
if (!$user || !$pass) jsonOut(['error' => 'Faltan credenciales'], 400);

$stmt = $pdo->prepare('SELECT * FROM usuarios WHERE (email = :u OR dni = :u) AND activo = 1 LIMIT 1');
$stmt->execute([':u' => $user]);
$row = $stmt->fetch();

if (!$row) jsonOut(['error' => 'Credenciales incorrectas'], 401);

// Soporta tanto contraseñas hasheadas (password_hash) como en plano (legacy)
$ok = password_get_info($row['password'])['algo']
    ? password_verify($pass, $row['password'])
    : hash_equals($row['password'], $pass);

if (!$ok) jsonOut(['error' => 'Credenciales incorrectas'], 401);

unset($row['password']);
$_SESSION['user'] = $row;
jsonOut($row);
