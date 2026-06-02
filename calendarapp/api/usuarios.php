<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonOut(['error' => 'Method not allowed'], 405);

$stmt = $pdo->query('SELECT id, dni, nombre, apellidos, email, telefono, ciclo, promocion, empresa, puesto, sector, bio, linkedin, github, web, foto, rol FROM usuarios WHERE activo = 1 ORDER BY nombre');
jsonOut($stmt->fetchAll());
