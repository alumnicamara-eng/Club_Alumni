<?php

header('Content-Type: application/json');

include("conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$nombre = trim($data['nombre'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($nombre) || empty($email) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Todos los campos son obligatorios"
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Este email ya está registrado"
    ]);
    exit;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$partes = explode(" ", $nombre, 2);
$nombreSolo = $partes[0];
$apellidos = $partes[1] ?? "";

$stmt = $conn->prepare("
    INSERT INTO usuarios
    (nombre, apellidos, email, password, rol, activo)
    VALUES (?, ?, ?, ?, 'alumno', 1)
");

$stmt->bind_param(
    "ssss",
    $nombreSolo,
    $apellidos,
    $email,
    $passwordHash
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Usuario registrado correctamente"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Error al registrar usuario"
    ]);
}

$conn->close();

?>