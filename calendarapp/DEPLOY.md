# 🚀 Despliegue a FileZilla — Alumni Cámara FP

Guía paso a paso para subir la app al hosting. Tiempo estimado: **30-40 min** la primera vez.

---

## 0. Antes de empezar — Requisitos del hosting

Comprueba que el hosting tiene:
- ✅ **PHP 7.3 o superior** (mira en cPanel → "PHP Selector" o "MultiPHP Manager")
- ✅ Extensiones PHP: `pdo_mysql`, `openssl`, `curl` (las tienen todos los hostings modernos)
- ✅ **MySQL** o **MariaDB**
- ✅ **HTTPS / SSL gratis** (Let's Encrypt) — si no, no hay app
- ✅ Acceso por **FTP** (FileZilla)
- ✅ **phpMyAdmin** o similar para crear la BD

Si el hosting tiene cPanel, todo esto suele venir incluido en cualquier plan básico (5-10€/mes).

---

## 1. Descarga el código del repo

En tu PC, abre una terminal y:

```bash
git clone https://github.com/alumnicamara-eng/Club_Alumni.git
cd Club_Alumni
git checkout develop
```

Si ya lo tenías clonado, basta con:
```bash
git checkout develop
git pull
```

La carpeta que vas a subir es **`calendarapp/`** entera.

---

## 2. Crea la base de datos en el hosting

1. Entra al **panel del hosting** (cPanel / Plesk / DirectAdmin…)
2. Busca **"MySQL Databases"** o **"Bases de datos MySQL"**
3. **Crea una base de datos** llamada por ejemplo `xxxxx_alumni` (donde `xxxxx_` suele ser un prefijo que añade el hosting)
4. **Crea un usuario MySQL** y dale **contraseña fuerte** (genera una larga, guárdala)
5. **Asocia el usuario a la base de datos** con TODOS los privilegios
6. Apunta:
   - Nombre real de la BD: `xxxxx_alumni`
   - Usuario: `xxxxx_alumniuser`
   - Contraseña: `LaQueGenraste123!`
   - Host: normalmente `localhost` (a veces el hosting da otro, ej. `mysql.tudominio.com`)

7. Entra a **phpMyAdmin** (botón en cPanel)
8. Selecciona la base de datos que creaste
9. Pestaña **"Importar"** → elige el archivo `calendarapp/db/club_alumni_full.sql` → **Continuar**

✅ Resultado: 11 tablas creadas + datos seed (admin@camarafp.es / admin123 ya existe).

---

## 3. Crea los archivos de configuración LOCALES

Estos NO están en GitHub (por seguridad). Los creas en tu PC y los subes por FTP solo a producción.

### 3.1. `calendarapp/api/config.php`

Copia `calendarapp/api/config.example.php` y renómbralo a `config.php`. Edítalo así:

```php
<?php
return [
    'db' => [
        'host' => 'localhost',                       // o el host que te dio el hosting
        'name' => 'xxxxx_alumni',                    // el nombre REAL de la BD
        'user' => 'xxxxx_alumniuser',
        'pass' => 'LaQueGeneraste123!',
    ],

    'allowed_origins' => [
        'https://alumni.camarafp.es',                // ← TU dominio real
    ],

    'force_https' => true,

    'session_name'     => 'ALUMNISESS',
    'session_lifetime' => 7 * 24 * 3600,

    'login_max_attempts' => 5,
    'login_window'       => 300,

    'push_subs_max_per_user' => 5,
];
```

**IMPORTANTE:** en `allowed_origins` pon SOLO tu dominio real. Quita `localhost`.

### 3.2. `calendarapp/api/vapid.php`

Este se genera en el servidor más adelante (paso 6). Por ahora no lo crees.

---

## 4. Sube todo por FileZilla

1. Abre FileZilla
2. Conecta al hosting (host, usuario, contraseña FTP — los da el panel del hosting)
3. **En el panel derecho** (servidor), navega a `public_html/` (o `www/`, depende del hosting)
4. **En el panel izquierdo** (tu PC), navega a la carpeta `Club_Alumni/calendarapp/`
5. **Selecciona TODO el contenido de `calendarapp/`** (no la carpeta, el contenido)
6. **Arrástralo al panel derecho** dentro de `public_html/`

Deberías acabar con esta estructura en el servidor:

```
public_html/
├── index.html
├── manifest.json
├── sw.js
├── SECURITY.md          ← bloqueado por .htaccess, no se sirve
├── DEPLOY.md            ← idem
├── img/
│   └── logo.jpeg
├── css/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   └── screens.css
├── js/
│   ├── api.js
│   ├── app.js
│   ├── auth.js
│   ├── data.js
│   ├── router.js
│   ├── ui.js
│   ├── utils.js
│   └── screens/
│       └── (varios .js)
├── api/
│   ├── .htaccess        ← OJO: FileZilla suele ocultar archivos que empiezan por punto.
│   │                       Activa "Servidor > Mostrar archivos ocultos"
│   ├── config.php       ← el que creaste en el paso 3.1
│   ├── config.example.php
│   ├── conexion.php
│   ├── login.php
│   ├── logout.php
│   ├── registro.php
│   ├── usuarios.php
│   ├── perfil.php
│   ├── noticias.php
│   ├── eventos.php
│   ├── inscripcion.php
│   ├── conferencias.php
│   ├── propuestas.php
│   ├── mentores.php
│   ├── solicitudes.php
│   ├── publicaciones.php
│   ├── likes.php
│   ├── comentarios.php
│   ├── push_register.php
│   ├── push_send.php
│   ├── generate-vapid.php
│   ├── vapid_public.php
│   ├── vapid.example.php
│   └── lib/
│       └── WebPush.php
└── db/                  ← bloqueado por .htaccess (ficheros .sql)
    ├── club_alumni.sql
    ├── club_alumni_full.sql
    └── README.md
```

**TRUCO FileZilla:** si no ves los archivos que empiezan por punto (`.htaccess`, `.gitignore`):
- Menú **Servidor → Forzar mostrar archivos ocultos**

---

## 5. Activa HTTPS

1. Entra al panel del hosting
2. Busca **"SSL/TLS"** o **"Let's Encrypt"**
3. Selecciona tu dominio y pulsa **Instalar / Issue**
4. Espera 1-2 minutos
5. (Opcional) Activa **"Forzar HTTPS"** desde el panel — aunque PHP ya lo hace por código

Verifica: abre `https://tu-dominio.com` en el navegador. Debe cargar la pantalla de login con el candado verde.

---

## 6. Genera las claves de push notifications (VAPID)

Las claves VAPID firman las notificaciones push. Hay que generarlas UNA VEZ.

1. Abre en el navegador: `https://tu-dominio.com/api/generate-vapid.php`
2. Te aparecerá un texto como este:
   ```
   <?php
   return [
       'publicKey'  => 'BAxxxxxxxxxxxxx...',
       'privateKey' => 'xxxxxxxxxxxx...',
       'subject'    => 'mailto:alumni@camarafp.es',
   ];
   ```
3. **Copia ese bloque entero**
4. En tu PC, crea un archivo nuevo llamado `vapid.php` con ese contenido
5. **Súbelo por FileZilla** a `public_html/api/vapid.php`
6. **Borra `generate-vapid.php` del servidor** (importante por seguridad)

✅ Las push notifications están listas.

---

## 7. Configura la URL de la API en el panel admin

1. Abre `https://tu-dominio.com` en el navegador
2. Login con:
   - Email: `admin@camarafp.es`
   - Contraseña: `admin123`
3. Ve al menú **Administración** → pestaña **Configuración**
4. En **Backend PHP / API** pega:
   ```
   https://tu-dominio.com/api/
   ```
   (con la barra `/` al final)
5. Pulsa **Conectar y sincronizar**
6. Debería aparecer "✓ Conectado correctamente"

A partir de aquí TODO se guarda en MySQL.

---

## 8. Cambia las contraseñas seed

1. Estando logueado como admin, ve a **Mi perfil**
2. Cambia datos / añade tu información real
3. (La contraseña se rehashea automáticamente en bcrypt al guardar)
4. Repite con el usuario `alumni@camarafp.es` o bórralo si no lo necesitas

Si quieres añadir alumnis en lote, usa el archivo CSV que ya tenéis y un script de importación (lo podemos hacer si lo necesitáis).

---

## 9. Verificación final

Recorre estos puntos para asegurar que todo funciona:

| Prueba | Cómo |
|---|---|
| **PWA instalable** | Abre la web en Chrome móvil → menú → "Añadir a pantalla de inicio" |
| **Login funciona** | Logout, vuelve a entrar con admin y con un alumni |
| **Crear noticia** | Admin → Noticias → Añadir → comprueba que sale en Inicio |
| **Crear evento** | Admin → Eventos → Crear → comprueba que sale en el calendario |
| **Apuntarse evento** | Login alumni → pulsa un evento → Apuntarme → al volver al admin debe contar el inscrito |
| **Push notifications** | Logueado, perfil → Activar push → admin → Configuración → Probar push → debería llegar al móvil aunque cierres la app |
| **Calendario externo** | En un evento, pulsa Google Calendar / Apple Calendar |
| **Comunidad** | Publica un post, da like, comenta — recarga, debe persistir |
| **Mentoría** | Postúlate como mentor en tu ciclo, otro usuario te debería poder pedir |

---

## 🆘 Si algo falla

### "DB connection failed" / pantalla en blanco
- Revisa `api/config.php`: ¿credenciales correctas?
- En el panel del hosting, ¿el usuario MySQL tiene permisos en la BD?

### "CORS error" en la consola del navegador
- Revisa `api/config.php` → `allowed_origins`: ¿está el dominio que estás usando?
- ¿Lo escribiste con `https://` y sin barra final?

### Login no funciona aunque las credenciales sean correctas
- Mira si el hosting tiene **Cookies HTTPS Only** activado y estás en HTTP
- Verifica que tienes HTTPS y `force_https = true`

### Push notifications no llegan
- ¿Generaste `vapid.php`? ¿Está en `public_html/api/`?
- ¿Borrarste `generate-vapid.php` del servidor?
- ¿El navegador del usuario tiene los permisos concedidos? (chrome://settings/content/notifications)
- iOS: las push solo funcionan si el usuario ha **instalado la PWA** (Añadir a pantalla de inicio)

### `.htaccess` no funciona / errores 500
- Revisa que Apache tenga `mod_rewrite` y `AllowOverride All` activado
- Algunos hostings necesitan que pidas activarlo por ticket

### Error 403 al subir archivos
- Permisos de carpeta: ponlos a **755** en FileZilla (clic derecho → Permisos de archivo)
- Permisos de PHP: **644**

### Necesito borrar todo y empezar de cero
- En phpMyAdmin, "Dejar caer" todas las tablas y reimportar `club_alumni_full.sql`
- En FileZilla, borra todo dentro de `public_html/` y resube

---

## 📞 Soporte

Si te encallas, comparte:
1. El error exacto (consola del navegador, F12 → pestaña Console + Network)
2. La URL donde falla
3. El log de errores PHP del hosting (suele estar en `~/logs/` o accesible desde cPanel)
