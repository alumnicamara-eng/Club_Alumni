-- ==========================================================
-- Migración 003 — Alta con DNI+fecha nacimiento, onboarding y Embajadores
-- ==========================================================
-- Cambios pedidos en la reunión con Andrea:
--  - Datos de alta: DNI + fecha de nacimiento
--  - Onboarding: situación laboral, situación académica, motivos
--  - Dirección como dato editable
--  - Embajadores Cámara FP (sustituye Mentoría)
-- ==========================================================

USE `club_alumni`;

-- ---------- Nuevas columnas en usuarios ----------
ALTER TABLE `usuarios`
  ADD COLUMN `fecha_nacimiento`    DATE        DEFAULT NULL AFTER `dni`,
  ADD COLUMN `direccion`           VARCHAR(255) DEFAULT NULL AFTER `telefono`,
  ADD COLUMN `situacion_laboral`   VARCHAR(40) DEFAULT NULL AFTER `motivos`,
  ADD COLUMN `situacion_academica` VARCHAR(40) DEFAULT NULL AFTER `situacion_laboral`,
  ADD COLUMN `onboarding_completo` TINYINT(1)  DEFAULT 0    AFTER `situacion_academica`;

-- ---------- Tabla de Embajadores ----------
-- Un alumni se ofrece a colaborar con el centro en distintas acciones.
CREATE TABLE IF NOT EXISTS `embajadores` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `tipo` VARCHAR(40) NOT NULL,          -- charla_clase | video_testimonio | video_promo | shooting_fotos | otra
  `mensaje` TEXT DEFAULT NULL,           -- disponibilidad, comentarios
  `estado` ENUM('pending','contacted','done') DEFAULT 'pending',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_tipo` (`usuario_id`,`tipo`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `embajadores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
