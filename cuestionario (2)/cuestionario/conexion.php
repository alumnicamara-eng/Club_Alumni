<?php
$host = "localhost";      // Cambia si es diferente
$user = "root";           // Usuario de tu DB
$pass = "";               // Contraseña de tu DB
$db   = "club_alumni";      // Nombre de tu base de datos

// Crear conexión
$conn = new mysqli($host, $user, $pass, $db);

// Revisar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
?>