# Seguridad — Alumni Cámara FP

Resumen de medidas implementadas en el backend y pasos obligatorios antes de exponer la app en producción.

## ✅ Lo que ya hace el backend

| Medida | Dónde |
|---|---|
| **CORS estricto** (allowlist por origen, NO `*`) | `api/conexion.php` |
| **Cookies de sesión seguras**: `Secure` + `HttpOnly` + `SameSite=Lax` | `api/conexion.php` |
| **HTTPS forzado** (redirige HTTP→HTTPS automáticamente) | `api/conexion.php` |
| **Anti session fixation**: `session_regenerate_id(true)` tras login | `api/login.php` |
| **Rate limit** en login (5 intentos / 5 min por IP) | `api/login.php` |
| **Rate limit** en registro (5 / hora) | `api/registro.php` |
| **Rate limit** en posts (10 / 10 min) y comentarios (30 / 10 min) | `api/publicaciones.php`, `comentarios.php` |
| **Rate limit** en propuestas de charla (3 / hora) | `api/propuestas.php` |
| **SQL injection**: PDO con prepared statements en TODO el código | todos los endpoints |
| **Mensajes de error genéricos** en login (no leak de qué usuarios existen) | `api/login.php` |
| **Bcrypt** para contraseñas nuevas + auto-upgrade de las legacy del seed | `api/login.php`, `registro.php` |
| **Validación de longitud** en todos los campos texto | helper `validateLen()` |
| **Whitelist de valores** en enums (tag, formato, categoria) | endpoints relevantes |
| **Validación de email** (`filter_var`) y contraseña mínima 8 chars | `api/registro.php` |
| **Auth obligatoria** en todos los GET (la comunidad es cerrada) | todos los GET |
| **Email/teléfono ocultos** a otros alumnis no admin en el directorio | `api/usuarios.php` |
| **Sin escalada de privilegios**: el registro fuerza `rol = 'alumno'` | `api/registro.php` |
| **Inscripciones sin race condition**: `SELECT ... FOR UPDATE` dentro de transacción | `api/inscripcion.php` |
| **Mentoría restringida al mismo ciclo** verificado en backend | `api/solicitudes.php` |
| **Límite de subscripciones push por usuario** (5 por defecto) | `api/push_register.php` |
| **Validación de payload** push (URL válida + longitudes) | `api/push_register.php` |
| **Generate-vapid protegido** (requiere admin si vapid.php ya existe) | `api/generate-vapid.php` |
| **Bloqueo de ficheros sensibles** vía Apache (`conexion.php`, `config.php`, `vapid.php`, `lib/`, `.sql`, `.md`) | `api/.htaccess` |
| **Cabeceras**: `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` | `api/conexion.php` + `.htaccess` |
| **Listado de directorios deshabilitado** | `api/.htaccess` |

## 🔧 Pasos OBLIGATORIOS antes de producción

### 1. Crear `api/config.php`
Copia `api/config.example.php` a `api/config.php` y rellena:
- **`db`** — credenciales reales del MySQL del hosting
- **`allowed_origins`** — SOLO tu dominio real (ej. `['https://alumni.camarafp.es']`). Elimina `localhost`.
- **`force_https`** — déjalo en `true`

`config.php` está en `.gitignore` — NUNCA se sube al repo.

### 2. Activar HTTPS en el hosting
La PWA y la API **no funcionan sin HTTPS**:
- El service worker requiere HTTPS (excepción: `localhost`)
- Las push notifications requieren HTTPS
- Las cookies con `Secure=true` no se envían sin HTTPS

La mayoría de hostings dan **Let's Encrypt gratis** desde el panel.

### 3. Generar claves VAPID
1. Abre **una vez** en el navegador: `https://tu-dominio.com/api/generate-vapid.php`
2. Crea `api/vapid.php` con el contenido que te muestra (cópialo y súbelo por FTP)
3. **Borra `generate-vapid.php`** del servidor (o déjalo — solo se podrá ejecutar siendo admin si vapid.php ya existe)
4. `vapid.php` también está en `.gitignore` y bloqueado por `.htaccess`

### 4. Cambiar contraseñas seed
Los usuarios del SQL seed tienen contraseñas en plano (`admin123`, `user123`). Tras el primer login se rehashean en bcrypt automáticamente, pero **lo recomendable es cambiarlas desde el perfil** antes de dar acceso a alumnis reales.

### 5. Probar
- Login admin → Configuración → API URL
- En el panel **Configuración > Notificaciones push** envía un mensaje de prueba
- Compruébalo en otro dispositivo después de pulsar "Activar notificaciones" desde el perfil

## ⚠️ Limitaciones conocidas

Estas cosas **no son agujeros de seguridad inmediatos** pero conviene saberlo:

1. **No hay verificación de email** en el registro — un usuario puede registrarse con un email ajeno. Si llega a ser problema, añade un flujo de confirmación por mail.
2. **No hay CSRF token explícito** — confiamos en `SameSite=Lax` (que protege la mayoría de casos POST). Si fueras a aceptar tráfico de subdominios distintos, añade tokens CSRF.
3. **El reset de contraseña no está implementado** — si un usuario pierde la suya, el admin tiene que reasignar manualmente desde phpMyAdmin (con `password_hash()`).
4. **El admin puede subir cualquier URL de YouTube** — si el admin se ve comprometido, podría poner contenido malicioso. Asume admin = confiado.
5. **Las fotos de perfil se almacenan como Data URLs en la BD** — si esto crece mucho, mejor subir a `/uploads/` con un endpoint propio.
6. **Logs de error van a `error_log` de PHP** — revisa que el hosting no los exponga vía HTTP.

## 🚨 Si detectas un incidente

1. Cierra acceso temporalmente: renombra `api/config.php` (la app caerá controladamente)
2. Revisa los logs de PHP del hosting
3. Si sospechas password leak: invalida TODAS las sesiones cambiando `session_name` en `config.php`
4. Si sospechas leak de la BD: cambia la contraseña en `config.php` y en phpMyAdmin
5. Si sospechas leak de VAPID privado: borra `api/vapid.php`, ejecuta `generate-vapid.php` y todos los suscriptores tendrán que volver a activar push
