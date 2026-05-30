<?php

header('Content-Type: application/json');

include("conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode([
        "success" => false,
        "message" => "Email y contraseña obligatorios"
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? AND activo = 1");
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado"
    ]);
    exit;
}

$usuario = $result->fetch_assoc();

if (!password_verify($password, $usuario['password'])) {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña incorrecta"
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "rol" => $usuario['rol'],
    "nombre" => $usuario['nombre']
]);

$conn->close();

?>