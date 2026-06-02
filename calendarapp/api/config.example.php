<?php
/**
 * Configuración del backend — Copia este fichero a config.php y rellénalo.
 * config.php está en .gitignore, NUNCA debe subirse al repo público.
 */

return [
    /* === Base de datos === */
    'db' => [
        'host' => 'localhost',
        'name' => 'club_alumni',
        'user' => 'root',
        'pass' => '',
    ],

    /* === CORS ===
     * Lista de orígenes permitidos. Si el frontend está en el mismo dominio
     * que la API, deja solo ese. Si está en otro, añádelo aquí.
     *
     *   ['https://alumni.camarafp.es']                              ← producción típica
     *   ['http://localhost', 'http://localhost:8080']               ← desarrollo
     *
     * NO uses ['*'] con cookies/credentials — los navegadores lo rechazan
     * y además es un agujero de seguridad enorme.
     */
    'allowed_origins' => [
        'https://alumni.camarafp.es',
        'http://localhost',
        'http://localhost:8080',
    ],

    /* === HTTPS === */
    'force_https' => true,   // redirige HTTP → HTTPS

    /* === Sesiones === */
    'session_name'     => 'ALUMNISESS',
    'session_lifetime' => 7 * 24 * 3600,  // 7 días

    /* === Rate limit del login === */
    'login_max_attempts' => 5,     // intentos
    'login_window'       => 300,   // por ventana de 5 minutos

    /* === Subscripciones push máximas por usuario === */
    'push_subs_max_per_user' => 5,
];
