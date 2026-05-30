// Variables globales
let currentStep = 1;
const totalSteps = 4;
let steps = [];
let nextBtn, prevBtn, progressBar;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos
    steps = document.querySelectorAll(".step");
    nextBtn = document.getElementById("nextBtn");
    prevBtn = document.getElementById("prevBtn");
    progressBar = document.getElementById("progressBar");
    const form = document.getElementById("encuestaForm");
    const themeToggle = document.getElementById("themeToggle");
    
    // Configurar eventos de los sliders
    setupRatingSliders();
    
    // Configurar evento para mostrar campo de stack tecnológico
    const mentoringSelect = document.querySelector('select[name="mentoring"]');
    if (mentoringSelect) {
        mentoringSelect.addEventListener('change', function() {
            const techStackQuestion = document.getElementById('techStackQuestion');
            if (this.value === 'Sí') {
                techStackQuestion.style.display = 'block';
            } else {
                techStackQuestion.style.display = 'none';
            }
        });
    }
    
    // Configurar eventos de los botones
    if (nextBtn) {
        nextBtn.addEventListener("click", handleNext);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener("click", handlePrev);
    }
    
    // Configurar evento de submit del formulario
    if (form) {
        form.addEventListener("submit", handleSubmit);
    }
    
    // Configurar tema oscuro
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo claro';
        }
    }
    
    // Inicializar
    showStep(currentStep);
});

// Configurar sliders de valoración
function setupRatingSliders() {
    const sliders = document.querySelectorAll('.rating-slider');
    sliders.forEach(slider => {
        const valueSpan = slider.parentElement.querySelector('.rating-value');
        if (valueSpan) {
            slider.addEventListener('input', function() {
                valueSpan.textContent = this.value;
            });
        }
    });
}

// Mostrar paso actual
function showStep(step) {
    steps.forEach((el, index) => {
        if (index + 1 === step) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
    
    if (prevBtn) prevBtn.disabled = step === 1;
    if (nextBtn) nextBtn.textContent = step === totalSteps ? "Enviar" : "Siguiente";
    
    const progress = (step / totalSteps) * 100;
    if (progressBar) progressBar.style.width = progress + "%";
}

// Manejar botón siguiente
function handleNext() {
    // Validar paso actual
    if (!validateStep(currentStep)) {
        return;
    }
    
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Enviar formulario
        const form = document.getElementById("encuestaForm");
        if (form) {
            form.dispatchEvent(new Event("submit"));
        }
    }
}

// Manejar botón anterior
function handlePrev() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Validar cada paso
function validateStep(step) {
    if (step === 1) {
        const email = document.getElementById("email");
        if (!email || !email.value.trim()) {
            alert("Por favor, introduce tu email");
            email?.focus();
            return false;
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            alert("Por favor, introduce un email válido");
            email.focus();
            return false;
        }
    }
    return true;
}

// Manejar envío del formulario
async function handleSubmit(event) {
    event.preventDefault();
    
    // Validar email nuevamente
    const email = document.getElementById("email");
    if (!email || !email.value.trim()) {
        alert("El email es obligatorio");
        return;
    }
    
    // Recopilar datos del formulario
    const formData = new FormData(event.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Verificar si tenemos Supabase disponible
    if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
        try {
            // Intentar guardar en Supabase
            const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            
            // Guardar en tabla alumnos
            const { data: alumnoData, error: alumnoError } = await supabaseClient
                .from('alumnos')
                .insert([
                    {
                        email: data.email,
                        nombre: data.nombre || null,
                        ciclo: data.ciclo || null,
                        situacion: data.situacion || null,
                        objetivos: data.objetivos || null,
                        feedback_general: data.feedback_general || null,
                        ayuda: data.ayuda || null,
                        opportunity: parseInt(data.opportunity) || null,
                        comunidad: parseInt(data.comunidad) || null,
                        ligas: parseInt(data.ligas) || null,
                        ventajas: parseInt(data.ventajas) || null,
                        embajadores: data.embajadores || null,
                        mentoring: data.mentoring || null,
                        tech_stack: data.tech_stack || null
                    }
                ]);
            
            if (alumnoError) {
                console.error('Error al guardar:', alumnoError);
                alert('Error al guardar los datos. Por favor, intenta de nuevo.');
                return;
            }
            
            console.log('Datos guardados exitosamente');
            showSuccessMessage();
            
        } catch (error) {
            console.error('Error:', error);
            // Si falla Supabase, guardar localmente
            saveLocally(data);
        }
    } else {
        // Guardar localmente si no hay Supabase
        saveLocally(data);
    }
}

// Guardar datos localmente
function saveLocally(data) {
    try {
        // Obtener respuestas existentes
        let respuestas = localStorage.getItem('encuesta_respuestas');
        respuestas = respuestas ? JSON.parse(respuestas) : [];
        
        // Agregar nueva respuesta con timestamp
        data.fecha = new Date().toISOString();
        respuestas.push(data);
        
        // Guardar
        localStorage.setItem('encuesta_respuestas', JSON.stringify(respuestas));
        console.log('Datos guardados localmente');
        
        showSuccessMessage();
    } catch (error) {
        console.error('Error al guardar localmente:', error);
        alert('Error al guardar los datos. Por favor, intenta de nuevo.');
    }
}

// Mostrar mensaje de éxito
function showSuccessMessage() {
    const formContainer = document.querySelector('.form-container');
    const form = document.getElementById('encuestaForm');
    
    if (formContainer && form) {
        form.style.display = 'none';
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h2>¡Gracias por tu participación!</h2>
            <p>Tus respuestas han sido guardadas correctamente.</p>
            <button onclick="location.reload()">Volver a empezar</button>
        `;
        
        formContainer.appendChild(successDiv);
    } else {
        alert('¡Respuestas guardadas correctamente!');
        location.reload();
    }
}

// Alternar tema oscuro
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo claro';
    } else {
        localStorage.setItem('theme', 'light');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i> Modo oscuro';
    }
}