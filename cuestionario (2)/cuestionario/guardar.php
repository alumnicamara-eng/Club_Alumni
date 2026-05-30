<?php
include "conexion.php";

// Recibir datos del formulario
$email = $_POST['email'] ?? '';
$nombre = $_POST['nombre'] ?? '';
$ciclo = $_POST['ciclo'] ?? '';
$situacion = $_POST['situacion'] ?? '';
$objetivos = $_POST['objetivos'] ?? '';
$feedback_general = $_POST['feedback_general'] ?? '';
$ayuda = $_POST['ayuda'] ?? '';
$opportunity = $_POST['opportunity'] ?? '';
$comunidad = $_POST['comunidad'] ?? '';
$ligas = $_POST['ligas'] ?? '';
$ventajas = $_POST['ventajas'] ?? '';
$embajadores = $_POST['embajadores'] ?? '';
$mentoring = $_POST['mentoring'] ?? '';
$tech_stack = $_POST['tech_stack'] ?? '';

// 1. Insertar alumno si no existe
$stmt = $conn->prepare("INSERT INTO alumnos (nombre, apellidos, email, id_ciclo, año_graduacion) VALUES (?, ?, ?, (SELECT id_ciclo FROM ciclos WHERE nombre_ciclo=? LIMIT 1), NULL) ON DUPLICATE KEY UPDATE id_alumno=LAST_INSERT_ID(id_alumno)");
$stmt->bind_param("ssss", $nombre, $nombre, $email, $ciclo);
$stmt->execute();
$id_alumno = $conn->insert_id;
$stmt->close();

// 2. Insertar respuestas
$respuestas = [
    1 => $situacion,
    2 => $objetivos,
    3 => $feedback_general,
    4 => $ayuda,
    5 => $opportunity,
    6 => $comunidad,
    7 => $ligas,
    8 => $ventajas,
    9 => $embajadores,
    10 => $mentoring,
    11 => $tech_stack
];

$fecha = date("Y-m-d");

$stmt = $conn->prepare("INSERT INTO respuestas (id_alumno, id_pregunta, respuesta, fecha_respuesta) VALUES (?, ?, ?, ?)");

foreach($respuestas as $id_pregunta => $respuesta) {
    if(!empty($respuesta)){
        $stmt->bind_param("iiss", $id_alumno, $id_pregunta, $respuesta, $fecha);
        $stmt->execute();
    }
}

$stmt->close();
$conn->close();

echo "Datos guardados correctamente.";
?>