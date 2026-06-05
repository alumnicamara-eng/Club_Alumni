-- ==========================================================
-- Migración 002 — Registro con aprobación + motivos
-- ==========================================================
-- Añade columna 'motivos' a usuarios.
-- Los nuevos registros entran como activo=0 (pendientes de aprobación
-- por admin). Los usuarios ya existentes mantienen su valor actual.
-- ==========================================================

USE `club_alumni`;

ALTER TABLE `usuarios`
  ADD COLUMN `motivos` TEXT DEFAULT NULL AFTER `bio`,
  ADD COLUMN `fecha_aprobacion` TIMESTAMP NULL DEFAULT NULL AFTER `fecha_registro`;

-- Índice para listar pendientes rápido
CREATE INDEX `idx_activo` ON `usuarios`(`activo`);
