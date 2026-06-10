<?php
/**
 * Importación masiva de alumnis precargados (solo admin).
 * Crea cuentas inactivas (activo=0, sin contraseña) que el alumni
 * luego reclama con su DNI + fecha de nacimiento.
 *
 * POST { alumnis: [ { dni, fecha_nacimiento, nombre, apellidos,
 *                     email, telefono, direccion, ciclo, promocion } ] }
 * Devuelve: { creados, actualizados, errores: [...] }
 */
require __DIR__ . '/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonOut(['error' => 'Method not allowed'], 405);
requireAdmin();

$in   = jsonInput();
$rows = $in['alumnis'] ?? [];
if (!is_array($rows) || !count($rows)) jsonOut(['error' => 'No hay filas que importar'], 400);
if (count($rows) > 2000) jsonOut(['error' => 'Máximo 2000 filas por importación'], 400);

$creados = 0; $actualizados = 0; $errores = [];

$insert = $pdo->prepare('INSERT INTO usuarios (dni, fecha_nacimiento, nombre, apellidos, email, telefono, direccion, ciclo, promocion, rol, activo)
                         VALUES (:dni, :fnac, :nombre, :apellidos, :email, :telefono, :direccion, :ciclo, :promocion, "alumno", 0)');
$update = $pdo->prepare('UPDATE usuarios SET fecha_nacimiento=:fnac, nombre=:nombre, apellidos=:apellidos,
                         email=:email, telefono=:telefono, direccion=:direccion, ciclo=:ciclo, promocion=:promocion
                         WHERE dni=:dni AND activo=0');

foreach ($rows as $i => $r) {
    $dni  = strtoupper(trim($r['dni'] ?? ''));
    $fnac = trim($r['fecha_nacimiento'] ?? '');
    $nombre = trim($r['nombre'] ?? '');

    if (!$dni || !$nombre) { $errores[] = "Fila " . ($i+1) . ": falta DNI o nombre"; continue; }
    /* Normaliza fecha: admite dd/mm/yyyy o yyyy-mm-dd */
    if ($fnac && preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})$#', $fnac, $m)) {
        $fnac = sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
    }
    if ($fnac && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fnac)) {
        $errores[] = "Fila " . ($i+1) . " ($dni): fecha de nacimiento inválida ($fnac)"; continue;
    }

    $params = [
        ':dni'       => $dni,
        ':fnac'      => $fnac ?: null,
        ':nombre'    => mb_substr($nombre, 0, 100),
        ':apellidos' => mb_substr(trim($r['apellidos'] ?? ''), 0, 100),
        ':email'     => trim($r['email'] ?? '') ?: null,
        ':telefono'  => mb_substr(trim($r['telefono'] ?? ''), 0, 20),
        ':direccion' => mb_substr(trim($r['direccion'] ?? ''), 0, 255),
        ':ciclo'     => trim($r['ciclo'] ?? '') ?: null,
        ':promocion' => trim($r['promocion'] ?? '') ?: null,
    ];

    try {
        $insert->execute($params);
        $creados++;
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            /* DNI o email duplicado → intentamos actualizar si está inactivo */
            try {
                unset($params[':dni']);
                $params2 = $params; $params2[':dni'] = $dni;
                $update->execute($params2);
                if ($update->rowCount() > 0) $actualizados++;
                else $errores[] = "Fila " . ($i+1) . " ($dni): ya existe y está activo (no se toca)";
            } catch (PDOException $e2) {
                $errores[] = "Fila " . ($i+1) . " ($dni): " . $e2->getMessage();
            }
        } else {
            $errores[] = "Fila " . ($i+1) . " ($dni): " . $e->getMessage();
        }
    }
}

jsonOut(['creados' => $creados, 'actualizados' => $actualizados, 'errores' => $errores]);
