<?php
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);

/* === Rate limit: 5 intentos / 5 min por IP === */
$ip = clientIp();
if (!rateLimit('login:' . $ip, $CFG['login_max_attempts'], $CFG['login_window'])) {
    jsonOut(['error' => 'Demasiados intentos. Vuelve a intentarlo en unos minutos.'], 429);
}

$in   = jsonInput();
$user = validateLen($in['user'] ?? '', 150, 'user');
$pass = (string)($in['pass'] ?? '');
if (!$user || !$pass || mb_strlen($pass) > 200) {
    jsonOut(['error' => 'Credenciales incorrectas'], 401);
}

/* Buscamos sin filtrar por activo para poder diferenciar "cuenta pendiente".
   Usamos ? posicional porque PDO no permite reusar el mismo :placeholder nombrado. */
$stmt = $pdo->prepare('SELECT * FROM usuarios WHERE (email = ? OR dni = ?) LIMIT 1');
$stmt->execute([$user, $user]);
$row = $stmt->fetch();

/* Mensaje genérico (no leak de si el usuario existe) */
if (!$row) jsonOut(['error' => 'Credenciales incorrectas'], 401);

$ok = password_get_info($row['password'])['algo']
    ? password_verify($pass, $row['password'])
    : hash_equals($row['password'], $pass);

if (!$ok) jsonOut(['error' => 'Credenciales incorrectas'], 401);

/* Las credenciales son correctas pero la cuenta no está activa */
if ((int)$row['activo'] !== 1) {
    jsonOut([
        'error'   => 'pending',
        'message' => 'Tu cuenta está pendiente de aprobación por el equipo Alumni. Te avisaremos cuando se active.',
    ], 403);
}

/* Si la contraseña aún está en plano (seed legacy), la rehasheamos en bcrypt */
if (!password_get_info($row['password'])['algo']) {
    $upd = $pdo->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
    $upd->execute([password_hash($pass, PASSWORD_BCRYPT), $row['id']]);
}

/* === Anti session fixation: nuevo session_id tras autenticar === */
session_regenerate_id(true);

unset($row['password']);
$_SESSION['user'] = $row;
jsonOut($row);
