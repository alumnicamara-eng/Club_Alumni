-- ==========================================================
-- Alumni Cámara FP — Esquema completo de base de datos
-- MariaDB / MySQL 5.7+ — compatible con XAMPP / Laragon
-- ==========================================================
-- Amplía el esquema base club_alumni.sql con todas las
-- tablas que necesita la PWA del repo (frontend en calendarapp/).
-- ==========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `club_alumni`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `club_alumni`;

-- ----------------------------------------------------------
-- USUARIOS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `dni` VARCHAR(20) DEFAULT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) DEFAULT '',
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `ciclo` VARCHAR(100) DEFAULT NULL,
  `promocion` VARCHAR(50) DEFAULT NULL,
  `empresa` VARCHAR(150) DEFAULT NULL,
  `puesto` VARCHAR(150) DEFAULT NULL,
  `sector` VARCHAR(100) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `linkedin` VARCHAR(255) DEFAULT NULL,
  `github` VARCHAR(255) DEFAULT NULL,
  `web` VARCHAR(255) DEFAULT NULL,
  `foto` VARCHAR(255) DEFAULT NULL,
  `rol` ENUM('alumno','admin') DEFAULT 'alumno',
  `push_eventos` TINYINT(1) DEFAULT 1,
  `push_noticias` TINYINT(1) DEFAULT 1,
  `push_mentor` TINYINT(1) DEFAULT 0,
  `fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- NOTICIAS (enlazan a artículos de WordPress)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `noticias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `resumen` TEXT DEFAULT NULL,
  `tag` ENUM('club','empleo','formacion','eventos') DEFAULT 'club',
  `fecha` DATE NOT NULL,
  `wp_url` VARCHAR(500) DEFAULT NULL,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `creado_por` INT(11) DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `creado_por` (`creado_por`),
  CONSTRAINT `noticias_ibfk_1` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- EVENTOS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL DEFAULT '18:00:00',
  `ubicacion` VARCHAR(255) DEFAULT NULL,
  `categoria` VARCHAR(50) DEFAULT 'evento',
  `plazas` INT(11) DEFAULT 50,
  `imagen` VARCHAR(255) DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- INSCRIPCIONES A EVENTOS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inscripciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `evento_id` INT(11) NOT NULL,
  `fecha_inscripcion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_evento` (`usuario_id`,`evento_id`),
  KEY `evento_id` (`evento_id`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`evento_id`) REFERENCES `eventos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- CONFERENCIAS GRABADAS (YouTube privado)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conferencias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `ponente` VARCHAR(150) NOT NULL,
  `categoria` ENUM('tecnologia','empleabilidad','emprendimiento','liderazgo') DEFAULT 'tecnologia',
  `youtube_url` VARCHAR(500) NOT NULL,
  `fecha` DATE NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- PROPUESTAS DE ALUMNI TALK (alumnis que quieren dar charla)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `propuestas_conferencias` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) DEFAULT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `ciclo` VARCHAR(100) DEFAULT NULL,
  `promocion` VARCHAR(50) DEFAULT NULL,
  `tema` VARCHAR(255) NOT NULL,
  `duracion` VARCHAR(20) DEFAULT '45',
  `formato` ENUM('Online','Presencial','Híbrido') DEFAULT 'Online',
  `descripcion` TEXT DEFAULT NULL,
  `estado` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `propuestas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- MENTORES (un alumni se presenta como mentor de su ciclo)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mentores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `ciclo` VARCHAR(100) NOT NULL,
  `bio` TEXT DEFAULT NULL,
  `max_mentees` INT(11) DEFAULT 5,
  `activo` TINYINT(1) DEFAULT 1,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_ciclo` (`usuario_id`,`ciclo`),
  CONSTRAINT `mentores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- SOLICITUDES DE MENTORÍA (alumno actual pide mentor)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `solicitudes_mentoria` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `mentor_id` INT(11) NOT NULL,
  `mentee_id` INT(11) NOT NULL,
  `estado` ENUM('pending','accepted','rejected') DEFAULT 'pending',
  `mensaje` TEXT DEFAULT NULL,
  `fecha_solicitud` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mentor_mentee` (`mentor_id`,`mentee_id`),
  KEY `mentee_id` (`mentee_id`),
  CONSTRAINT `mentoria_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `mentores`(`id`) ON DELETE CASCADE,
  CONSTRAINT `mentoria_ibfk_2` FOREIGN KEY (`mentee_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- COMUNIDAD: PUBLICACIONES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `publicaciones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `autor_id` INT(11) NOT NULL,
  `categoria` ENUM('empleo','pregunta','logro','recurso','todas') DEFAULT 'todas',
  `texto` TEXT NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `autor_id` (`autor_id`),
  CONSTRAINT `publicaciones_ibfk_1` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- LIKES SOBRE PUBLICACIONES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `publicaciones_likes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `publicacion_id` INT(11) NOT NULL,
  `usuario_id` INT(11) NOT NULL,
  `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pub_user` (`publicacion_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- COMENTARIOS A PUBLICACIONES
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `publicaciones_comentarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `publicacion_id` INT(11) NOT NULL,
  `autor_id` INT(11) NOT NULL,
  `texto` TEXT NOT NULL,
  `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `publicacion_id` (`publicacion_id`),
  KEY `autor_id` (`autor_id`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones`(`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- SUSCRIPCIONES PUSH (para notificaciones del navegador)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `endpoint` VARCHAR(500) NOT NULL,
  `p256dh` VARCHAR(255) NOT NULL,
  `auth` VARCHAR(255) NOT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `endpoint` (`endpoint`(255)),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `push_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- DATOS SEED INICIALES
-- ==========================================================

-- Admin + usuarios de prueba
INSERT INTO `usuarios` (`dni`,`nombre`,`apellidos`,`email`,`password`,`ciclo`,`promocion`,`empresa`,`puesto`,`sector`,`rol`) VALUES
('admin',     'Equipo','Alumni','admin@camarafp.es','admin123',NULL,            NULL,  'Cámara FP',        'Coordinación Alumni','Educación','admin'),
('12345678',  'Lucía','Pérez',  'alumni@camarafp.es','user123','DAW',            '2022','Banco Sabadell',   'Frontend Developer', 'Tecnología','alumno'),
('87654321',  'Carlos','Ruiz',  'carlos@example.com','user123','DAM',            '2020','Indra',            'Backend Engineer',   'Tecnología','alumno'),
('11223344',  'Ana',  'Gómez',  'ana@example.com',   'user123','Marketing',      '2021','Freelance',        'Brand Strategist',   'Marketing','alumno'),
('55667788',  'Miguel','Soler', 'miguel@example.com','user123','ASIR',           '2019','Telefónica Tech',  'DevOps',             'Tecnología','alumno'),
('99887766',  'Paula','Torres', 'paula@example.com', 'user123','Administración', '2023','PwC',              'Auditora Jr.',       'Banca y Finanzas','alumno'),
('44556677',  'Javier','Núñez', 'javier@example.com','user123','Comercio Internacional','2022','Mercadona','Compras internacionales','Logística','alumno');

-- Noticias de ejemplo (con URL a WordPress del club)
INSERT INTO `noticias` (`titulo`,`resumen`,`tag`,`fecha`,`wp_url`) VALUES
('Abrimos inscripciones a la edición 2026 de Alumni Talks','Nueva temporada con ponentes alumni de referencia. Más de 12 sesiones programadas.','club',    '2026-05-12','https://alumni.camarafp.es/?p=101'),
('5 empresas del Vivero buscan talento Alumni',            'Ofertas activas para perfiles de DAW, DAM, ASIR y Marketing.',                          'empleo',  '2026-05-08','https://alumni.camarafp.es/?p=102'),
('Nuevo curso bonificado para alumnis: IA aplicada al puesto','30 plazas exclusivas para antiguos alumnos. Inicio en junio.',                        'formacion','2026-05-02','https://alumni.camarafp.es/?p=103'),
('Networking de primavera: cena anual el 14 de junio',     'Reservada para alumnis Cámara FP y acompañante. Cupo limitado.',                        'eventos', '2026-04-28','https://alumni.camarafp.es/?p=104');

-- Eventos de ejemplo
INSERT INTO `eventos` (`titulo`,`descripcion`,`fecha`,`hora`,`ubicacion`,`categoria`,`plazas`) VALUES
('Mesa redonda: el primer año en tech','Tres alumnis comparten cómo fue su primer empleo.', '2026-05-28','18:00:00','Salón de actos Cámara FP','tecnologia',80),
('Taller: LinkedIn para conseguir prácticas','Sesión práctica para mejorar tu perfil.',     '2026-06-04','17:30:00','Aula 204','empleabilidad',30),
('Alumni Talk: emprender desde un ciclo','Charla y Q&A con una emprendedora alumni.',       '2026-06-12','19:00:00','Online (Zoom)','emprendimiento',200),
('Cena anual Alumni Cámara FP','Encuentro anual de la comunidad alumni.',                   '2026-06-14','20:30:00','Hotel SH Valencia Palace','networking',120);

-- Conferencias grabadas (URL embed YouTube privado)
INSERT INTO `conferencias` (`titulo`,`descripcion`,`ponente`,`categoria`,`youtube_url`,`fecha`) VALUES
('Frontend moderno: claves para tu primer empleo','Stack, buenas prácticas y errores a evitar.','Lucía Pérez (DAW 2022)','tecnologia',   'https://www.youtube.com/embed/dQw4w9WgXcQ','2026-04-22'),
('Negocia tu primer sueldo sin miedo',           'Investigar, preparar y plantear la conversación.','Ana Gómez (Marketing 2021)','empleabilidad','https://www.youtube.com/embed/dQw4w9WgXcQ','2026-04-05'),
('De ciclo a emprender: lecciones del primer año','Recursos, contactos y errores reales.',     'Javier Núñez (CI 2022)','emprendimiento','https://www.youtube.com/embed/dQw4w9WgXcQ','2026-03-20');

-- Mentores (Carlos para DAM, Ana para Marketing, Miguel para ASIR)
INSERT INTO `mentores` (`usuario_id`,`ciclo`,`bio`,`max_mentees`) VALUES
(3,'DAM','5 años en backend Java. Ayudo con primer empleo y entrevistas técnicas.',5),
(4,'Marketing','Estrategia de marca y portfolio. Llevo 4 alumnos cada curso.',5),
(5,'ASIR','DevOps en Telefónica Tech. Hablo de redes, cloud y certificaciones.',5);

-- Publicaciones de comunidad
INSERT INTO `publicaciones` (`autor_id`,`categoria`,`texto`) VALUES
(3,'empleo',  'En Indra abrimos 3 puestos de backend Java para perfiles junior. Si os interesa, escribidme por LinkedIn.'),
(4,'pregunta','¿Alguien que haya hecho freelance de marketing en sus primeros años? Me gustaría hablar antes de dar el paso.'),
(6,'logro',   'Acabo de firmar mi primer contrato indefinido en PwC. ¡Gracias al equipo Alumni por las recomendaciones!');
