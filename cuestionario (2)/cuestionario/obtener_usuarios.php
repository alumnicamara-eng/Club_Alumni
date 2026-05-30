<?php

header('Content-Type: application/json');

include("conexion.php");

$sql = "SELECT * FROM usuarios";
$result = $conn->query($sql);

$usuarios = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
}

echo json_encode($usuarios);