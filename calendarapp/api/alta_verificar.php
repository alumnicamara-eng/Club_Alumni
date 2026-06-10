<?php
/**
 * Paso 1 del alta: verifica que el DNI + fecha de nacimiento corresponden
 * a un alumni precargado por el centro (activo=0 y sin contraseña).
 *
 * POST { dni, fecha_nacimiento }
 *  - 200 { found:true, datos:{...} }  → devuelve los datos precargados para editar
 *  - 404 si no existe ese DNI+fecha (no está en la lista del centro)
 *  - 409 si ya tiene cuenta activa (debe iniciar sesión)
 */
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

if (!rateLimit('alta:' . clientIp(), 10, 600)) {
    jsonOut(['error' => 'Demasiados intentos, espera unos minutos'], 429);
}

$in    = jsonInput();
$dni   = strtoupper(validateLen($in['dni'] ?? '', 20, 'dni'));
$fnac  = $in['fecha_nacimiento'] ?? '';
if (!$dni || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fnac)) {
    jsonOut(['error' => 'Indica tu DNI y fecha de nacimiento'], 400);
}

$stmt = $pdo->prepare('SELECT id, nombre, apellidos, email, telefono, direccion, ciclo, promocion, activo
                       FROM usuarios WHERE dni = ? AND fecha_nacimiento = ? LIMIT 1');
$stmt->execute([$dni, $fnac]);
$row = $stmt->fetch();

if (!$row) {
    jsonOut(['error' => 'No encontramos tu registro. Si eres antiguo alumno/a y no puedes darte de alta, escribe a alumni@camarafp.es'], 404);
}
if ((int)$row['activo'] === 1) {
    jsonOut(['error' => 'Ya tienes una cuenta activa. Inicia sesión con tu DNI o email.'], 409);
}

jsonOut(['found' => true, 'datos' => [
    'id'        => (int)$row['id'],
    'nombre'    => $row['nombre'],
    'apellidos' => $row['apellidos'],
    'email'     => $row['email'],
    'telefono'  => $row['telefono'],
    'direccion' => $row['direccion'],
    'ciclo'     => $row['ciclo'],
    'promocion' => $row['promocion'],
]]);
