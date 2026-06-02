<?php
/**
 * Configuración VAPID — Renombra este fichero a vapid.php y rellena las claves.
 * Para generar las claves ejecuta UNA vez: api/generate-vapid.php
 */

return [
    /* Clave pública (66 caracteres base64url aprox) — se expone al frontend */
    'publicKey'  => 'PEGA_AQUÍ_LA_CLAVE_PUBLICA',

    /* Clave privada (43 caracteres base64url aprox) — NUNCA exponer */
    'privateKey' => 'PEGA_AQUÍ_LA_CLAVE_PRIVADA',

    /* Email o URL del contacto del servicio (lo exige el estándar VAPID) */
    'subject'    => 'mailto:alumni@camarafp.es',
];
