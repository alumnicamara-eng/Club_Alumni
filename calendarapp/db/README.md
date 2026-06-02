# Base de datos — Alumni Cámara FP

Hay dos esquemas SQL en esta carpeta:

## `club_alumni.sql`
Esquema **mínimo** original de Javier Aljaro (rama `backend-php-mysql`).
Solo cubre: `usuarios`, `eventos`, `inscripciones`, `ofertas_empleo`.

## `club_alumni_full.sql` ⭐ (recomendado)
Esquema **completo** que cubre todas las funcionalidades de la PWA:

| Tabla | Para qué |
|---|---|
| `usuarios` | Alumnis + admin (incluye DNI, ciclo, promoción, perfil profesional) |
| `noticias` | Noticias del club (enlazan a WordPress) |
| `eventos` | Eventos del calendario |
| `inscripciones` | Quién se ha apuntado a qué evento |
| `conferencias` | Charlas grabadas (YouTube privado) |
| `propuestas_conferencias` | Alumnis que se postulan para dar una Alumni Talk |
| `mentores` | Alumnis ofreciéndose como mentor en su ciclo |
| `solicitudes_mentoria` | Alumnos actuales solicitando un mentor |
| `publicaciones` | Comunidad: posts |
| `publicaciones_likes` | Likes de la comunidad |
| `publicaciones_comentarios` | Comentarios de la comunidad |
| `push_subscriptions` | Suscripciones push del navegador |

## Cómo importar

### XAMPP / Laragon (phpMyAdmin)
1. Abre phpMyAdmin → pestaña **Importar**
2. Selecciona `club_alumni_full.sql`
3. Pulsa **Continuar**

### Línea de comandos
```bash
mysql -u root -p < calendarapp/db/club_alumni_full.sql
```

### Producción (FileZilla → hosting)
1. Sube el archivo `.sql` al servidor
2. En el panel del hosting (cPanel/Plesk), entra a **phpMyAdmin**
3. Crea la base de datos `club_alumni`
4. Importa el `.sql`

## Credenciales seed
- Admin: `admin@camarafp.es` / `admin123`
- Alumni: `alumni@camarafp.es` / `user123`

**⚠️ Cambia las contraseñas antes de producción.** Idealmente, hashea con `password_hash()` de PHP (bcrypt) — el seed las deja en plano solo para desarrollo.
