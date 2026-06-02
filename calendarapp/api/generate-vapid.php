<?php
/**
 * Genera un par de claves VAPID y muestra el contenido para pegar en vapid.php
 *
 * Protección: solo accesible si vapid.php NO existe todavía (instalación inicial),
 * o si quien lo invoca es admin autenticado (regeneración controlada).
 */

require __DIR__ . '/conexion.php';

if (file_exists(__DIR__ . '/vapid.php')) {
    /* Ya hay claves — requerimos admin para regenerar (rompería suscripciones existentes) */
    requireAdmin();
}

require __DIR__ . '/lib/WebPush.php';

$keys = WebPush::generateVapidKeys();

header('Content-Type: text/plain; charset=utf-8');
echo "==================================================\n";
echo "  CLAVES VAPID GENERADAS — Cámara FP\n";
echo "==================================================\n\n";
echo "Crea el fichero  api/vapid.php  con este contenido:\n\n";
echo "<?php\n";
echo "return [\n";
echo "    'publicKey'  => '" . $keys['publicKey']  . "',\n";
echo "    'privateKey' => '" . $keys['privateKey'] . "',\n";
echo "    'subject'    => 'mailto:alumni@camarafp.es',\n";
echo "];\n\n";
echo "==================================================\n";
echo "  ⚠️  IMPORTANTE\n";
echo "==================================================\n";
echo "1. Crea api/vapid.php con el contenido de arriba\n";
echo "2. BORRA este fichero del servidor (generate-vapid.php)\n";
echo "3. La clave PRIVADA no debe estar en el repositorio público\n";
echo "==================================================\n";
