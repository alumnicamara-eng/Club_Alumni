<?php
require __DIR__ . '/conexion.php';
$_SESSION = [];
session_destroy();
jsonOut(['ok' => true]);
