# API PHP — Alumni Cámara FP

Endpoints REST que consume la PWA del frontend. Conectan con MySQL/MariaDB usando el esquema de `../db/club_alumni_full.sql`.

## Stack
- **PHP 8.0+** con PDO
- **MySQL/MariaDB**
- Apache (XAMPP local o hosting compartido vía FTP)

## Configuración
Edita las credenciales en `conexion.php`:
```php
$DB_HOST = 'localhost';
$DB_NAME = 'club_alumni';
$DB_USER = 'root';
$DB_PASS = '';
```

## Endpoints

### Autenticación
| Endpoint | Método | Body | Devuelve |
|---|---|---|---|
| `login.php`    | POST   | `{user, pass}` (user puede ser email o DNI) | usuario + sesión |
| `logout.php`   | POST   | — | `{ok:true}` |
| `registro.php` | POST   | `{nombre, email, password, ...}` | `{id, ok}` |

### Usuarios
| Endpoint | Método | Body | Devuelve |
|---|---|---|---|
| `usuarios.php` | GET    | — | array de todos los alumnis activos |
| `perfil.php`   | POST   | datos de perfil del usuario logueado | `{ok:true}` |

### Noticias
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `noticias.php`            | GET    | — | público |
| `noticias.php`            | POST   | `{titulo, resumen, tag, fecha, wp_url}` | admin |
| `noticias.php?id={id}`    | DELETE | — | admin |

### Eventos e inscripciones
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `eventos.php`             | GET    | — | público (devuelve `inscritos`: array de DNIs) |
| `eventos.php`             | POST   | `{titulo, descripcion, fecha, hora, ubicacion, plazas}` | admin |
| `eventos.php?id={id}`     | DELETE | — | admin |
| `inscripcion.php`         | POST   | `{evento_id}` | usuario |
| `inscripcion.php`         | DELETE | `{evento_id}` | usuario |

### Conferencias y propuestas
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `conferencias.php`            | GET    | — | público |
| `conferencias.php`            | POST   | `{titulo, ponente, youtube_url, ...}` | admin |
| `conferencias.php?id={id}`    | DELETE | — | admin |
| `propuestas.php`              | GET    | — | admin |
| `propuestas.php`              | POST   | `{tema, duracion, formato, descripcion, ...}` | usuario |
| `propuestas.php`              | PUT    | `{id, estado: approved\|rejected}` | admin |

### Mentoría
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `mentores.php`            | GET    | — | público |
| `mentores.php`            | POST   | `{ciclo, bio, max_mentees}` | usuario |
| `solicitudes.php`         | POST   | `{mentor_id, mensaje}` | usuario (mismo ciclo) |
| `solicitudes.php`         | PUT    | `{solicitud_id, estado}` | mentor |

### Comunidad
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `publicaciones.php`       | GET    | — | público (incluye likes y comentarios) |
| `publicaciones.php`       | POST   | `{texto, categoria}` | usuario |
| `likes.php`               | POST   | `{publicacion_id}` (toggle) | usuario |
| `comentarios.php`         | POST   | `{publicacion_id, texto}` | usuario |

### Push notifications
| Endpoint | Método | Body | Auth |
|---|---|---|---|
| `push_register.php`       | POST   | `{endpoint, keys:{p256dh, auth}}` | usuario |

## Despliegue por FTP (FileZilla)

1. Sube la carpeta `calendarapp/api/` al hosting (ej. `public_html/api/`)
2. Sube `calendarapp/db/club_alumni_full.sql` e impórtalo en phpMyAdmin del hosting
3. Edita `api/conexion.php` con las credenciales del hosting (host, user, password)
4. En la PWA, ve a **Admin > Configuración > Backend PHP / API** y pega la URL: `https://tu-dominio.com/api/`

## Seguridad

Ver `../SECURITY.md` para el listado completo de medidas (CORS estricto, rate limiting,
session fixation, bcrypt, validación, etc.) y los pasos obligatorios antes de producción
(crear `config.php`, generar VAPID, activar HTTPS…).
