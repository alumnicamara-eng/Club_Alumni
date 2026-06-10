<?php
/**
 * Paso 2 del alta: el alumni completa/edita sus datos, fija contraseña y
 * responde el onboarding. Activa la cuenta (activo=1) e inicia sesión.
 *
 * POST {
 *   dni, fecha_nacimiento, password,
 *   nombre, apellidos, email, telefono, direccion, ciclo, promocion,
 *   situacion_laboral, situacion_academica, motivos (array)
 * }
 */
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

if (!rateLimit('altac:' . clientIp(), 10, 600)) {
    jsonOut(['error' => 'Demasiados intentos, espera unos minutos'], 429);
}

$in   = jsonInput();
$dni  = strtoupper(validateLen($in['dni'] ?? '', 20, 'dni'));
$fnac = $in['fecha_nacimiento'] ?? '';
$pass = (string)($in['password'] ?? '');

if (!$dni || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fnac)) jsonOut(['error' => 'Datos de verificación inválidos'], 400);
if (strlen($pass) < 8 || strlen($pass) > 200) jsonOut(['error' => 'La contraseña debe tener entre 8 y 200 caracteres'], 400);

/* Re-verificar que existe y está inactivo */
$stmt = $pdo->prepare('SELECT id, activo FROM usuarios WHERE dni = ? AND fecha_nacimiento = ? LIMIT 1');
$stmt->execute([$dni, $fnac]);
$row = $stmt->fetch();
if (!$row)               jsonOut(['error' => 'No encontramos tu registro'], 404);
if ((int)$row['activo'] === 1) jsonOut(['error' => 'Tu cuenta ya estaba activa'], 409);

$email = validateLen($in['email'] ?? '', 150, 'email');
if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonOut(['error' => 'Email inválido'], 400);

/* Email único (si lo ponen y ya existe en otra cuenta) */
if ($email) {
    $dup = $pdo->prepare('SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1');
    $dup->execute([$email, $row['id']]);
    if ($dup->fetch()) jsonOut(['error' => 'Ese email ya está en uso por otra cuenta'], 409);
}

/* Onboarding */
$sitLab = in_array($in['situacion_laboral']   ?? '', ['trabajando','buscando','no_buscando'], true) ? $in['situacion_laboral'] : null;
$sitAca = in_array($in['situacion_academica'] ?? '', ['estudiando','buscando_estudios','no_claro'], true) ? $in['situacion_academica'] : null;
$motivosArr = is_array($in['motivos'] ?? null) ? $in['motivos'] : [];
$motivosValid = array_values(array_intersect($motivosArr, ['interactuar','sprintwalks','comunidad','empleo','charlas','contacto']));
$motivos = implode(',', $motivosValid);

$sql = 'UPDATE usuarios SET
          password = :password,
          nombre = :nombre, apellidos = :apellidos, email = :email,
          telefono = :telefono, direccion = :direccion,
          ciclo = :ciclo, promocion = :promocion,
          motivos = :motivos, situacion_laboral = :sl, situacion_academica = :sa,
          onboarding_completo = 1, activo = 1, fecha_aprobacion = CURRENT_TIMESTAMP
        WHERE id = :id';
$upd = $pdo->prepare($sql);
$upd->execute([
    ':password'  => password_hash($pass, PASSWORD_BCRYPT),
    ':nombre'    => validateLen($in['nombre']    ?? '', 100, 'nombre'),
    ':apellidos' => validateLen($in['apellidos'] ?? '', 100, 'apellidos'),
    ':email'     => $email ?: null,
    ':telefono'  => validateLen($in['telefono']  ?? '', 20,  'telefono'),
    ':direccion' => validateLen($in['direccion'] ?? '', 255, 'direccion'),
    ':ciclo'     => $in['ciclo']     ?? null,
    ':promocion' => $in['promocion'] ?? null,
    ':motivos'   => $motivos,
    ':sl'        => $sitLab,
    ':sa'        => $sitAca,
    ':id'        => $row['id'],
]);

/* Login automático tras el alta */
$fresh = $pdo->prepare('SELECT id, dni, nombre, apellidos, email, telefono, direccion, ciclo, promocion,
                               empresa, puesto, sector, bio, linkedin, github, web, foto, rol,
                               push_eventos, push_noticias, push_mentor, activo
                        FROM usuarios WHERE id = ?');
$fresh->execute([$row['id']]);
$user = $fresh->fetch();

session_regenerate_id(true);
$_SESSION['user'] = $user;
jsonOut(['ok' => true, 'user' => $user]);
