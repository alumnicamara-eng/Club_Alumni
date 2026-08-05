<?php

header('Content-Type: application/json');

include("conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$activo = intval($data['activo'] ?? 0);

if (empty($email)) {
    echo json_encode([
        "success" => false,
        "message" => "Email no válido"
    ]);
    exit;
}

$stmt = $conn->prepare("
    UPDATE usuarios
    SET activo = ?
    WHERE email = ?
");

$stmt->bind_param("is", $activo, $email);

if ($stmt->execute()) {

    echo json_encode([
        "success" => true
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar"
    ]);

}

$conn->close();

?>