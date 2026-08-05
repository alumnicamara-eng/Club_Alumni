CREATE DATABASE cuestionario;
USE cuestionario;

-- Tabla ciclos
CREATE TABLE ciclos (
    id_ciclo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ciclo VARCHAR(100),
    descripcion VARCHAR(100)
);

-- Tabla alumnos
CREATE TABLE alumnos (
    id_alumno INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    año_graduacion DATE,
    id_ciclo INT,
    FOREIGN KEY (id_ciclo) REFERENCES ciclos(id_ciclo)
);

-- Tabla preguntas
CREATE TABLE preguntas (
    id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
    texto_pregunta VARCHAR(300)
);

-- Tabla respuestas
CREATE TABLE respuestas (
    id_respuesta INT AUTO_INCREMENT PRIMARY KEY,
    id_alumno INT,
    id_pregunta INT,
    respuesta VARCHAR(300),
    fecha_respuesta DATE,
    FOREIGN KEY (id_alumno) REFERENCES alumnos(id_alumno),
    FOREIGN KEY (id_pregunta) REFERENCES preguntas(id_pregunta)
);

INSERT INTO ciclos (nombre_ciclo, descripcion) VALUES
('DAM','Desarrollo de Aplicaciones Multiplataforma'),
('DAW','Desarrollo de Aplicaciones Web'),
('Marketing','Marketing y Publicidad'),
('Comercio Internacional','Comercio Internacional'),
('Otros','Otros estudios');

INSERT INTO preguntas (texto_pregunta) VALUES
('Situación profesional actual'),
('¿Qué te gustaría conseguir con tus estudios?'),
('¿Qué has echado de menos en Cámara FP?'),
('¿Cómo podemos ayudarte ahora mismo desde el centro?'),
('Valoración Opportunity Board'),
('Valoración Comunidad y Tardeos'),
('Valoración Ligas Deportivas'),
('Valoración Ventajas Premium'),
('Programa de Embajadores'),
('Mentoring'),
('Stack tecnológico especializado');

