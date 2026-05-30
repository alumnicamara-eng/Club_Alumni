// 1. Configuración de Supabase
const SUPABASE_URL = 'https://fkwaqdhlyiyqgjuurbwo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrd2FxZGhseWl5cWdqdXVyYndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTU0MzgsImV4cCI6MjA4OTgzMTQzOH0.C_dXY4_Je7ntYW0xAKIrQ8O__5mt_zxaNuW7sAllJSc';

// Inicialización segura del cliente
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

if (!supabase) {
    console.error("❌ Error: No se pudo cargar la librería de Supabase.");
}

let currentStep = 1;
const totalSteps = 4;

const steps = document.querySelectorAll(".step");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const progressBar = document.getElementById("progressBar");

// --- FUNCIONALIDAD UI ---

// Sincronizar Sliders
document.querySelectorAll('.rating-slider').forEach(slider => {
    const output = slider.nextElementSibling;
    slider.addEventListener('input', () => {
        if (output) output.textContent = slider.value;
    });
});

// Mostrar/ocultar campo de tech_stack
function setupTechStackToggle() {
    const mentoringSelect = document.getElementById("mentoringSelect");
    const techStackQuestion = document.getElementById("techStackQuestion");
    
    if (mentoringSelect && techStackQuestion) {
        const toggleTechStack = () => {
            const value = mentoringSelect.value.toLowerCase();
            const show = value.includes("sí") || value.includes("si");
            techStackQuestion.style.display = show ? "block" : "none";
        };
        mentoringSelect.addEventListener("change", toggleTechStack);
    }
}

// Navegación
function showStep(step) {
    steps.forEach((el, index) => {
        el.classList.toggle("active", index + 1 === step);
    });

    prevBtn.disabled = step === 1;
    nextBtn.textContent = step === totalSteps ? "📨 Enviar" : "➡️ Siguiente";

    const progress = (step / totalSteps) * 100;
    progressBar.style.width = progress + "%";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validación básica
function validateStep(step) {
    if (step === 1) {
        const email = document.getElementById("email")?.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showToast("❌ Introduce un email válido", true);
            return false;
        }
    }
    if (step === 4) {
        const embajadores = document.getElementById("embajadoresSelect")?.value;
        const mentoring = document.getElementById("mentoringSelect")?.value;
        if (!embajadores || !mentoring) {
            showToast("⚠️ Por favor, completa las opciones de participación", true);
            return false;
        }
    }
    return true;
}

// --- GESTIÓN DE DATOS ---

function gatherFormData() {
    return {
        email: document.getElementById("email")?.value.trim() || "",
        nombre: document.getElementById("nombre")?.value.trim() || "",
        ciclo: document.getElementById("ciclo")?.value || "",
        promocion: document.getElementById("promocion")?.value || "",
        situacion: document.getElementById("situacion")?.value || "",
        objetivos: document.querySelector('textarea[name="objetivos"]')?.value || "",
        feedback_general: document.querySelector('textarea[name="feedback_general"]')?.value || "",
        ayuda: document.querySelector('textarea[name="ayuda"]')?.value || "",
        opportunity: document.querySelector('input[name="opportunity"]')?.value || "5",
        comunidad: document.querySelector('input[name="comunidad"]')?.value || "5",
        ligas: document.querySelector('input[name="ligas"]')?.value || "5",
        ventajas: document.querySelector('input[name="ventajas"]')?.value || "5",
        embajadores: document.getElementById("embajadoresSelect")?.value || "",
        mentoring: document.getElementById("mentoringSelect")?.value || "",
        tech_stack: document.querySelector('textarea[name="tech_stack"]')?.value || ""
    };
}

async function saveToSupabase(formData) {
    try {
        // 1. Upsert del alumno
        // Nota: Asegúrate de que 'email' sea UNIQUE en la tabla 'alumnos' de Supabase
        const { data: alumnoData, error: alumnoError } = await supabase
            .from('alumnos')
            .upsert({
                email: formData.email,
                nombre: formData.nombre,
                ciclo: formData.ciclo,
                updated_at: new Date().toISOString()
            }, { onConflict: 'email' })
            .select();
        
        if (alumnoError) throw alumnoError;
        
        // Manejo flexible de nombres de columna (id vs id_alumno)
        const id_alumno = alumnoData?.[0]?.id || alumnoData?.[0]?.id_alumno;
        if (!id_alumno) throw new Error("No se pudo obtener el ID del alumno");
        
        // 2. Mapear respuestas
        const respuestasRaw = [
            { id_pregunta: 1, respuesta: formData.situacion },
            { id_pregunta: 2, respuesta: formData.objetivos },
            { id_pregunta: 3, respuesta: formData.feedback_general },
            { id_pregunta: 4, respuesta: formData.ayuda },
            { id_pregunta: 5, respuesta: formData.opportunity },
            { id_pregunta: 6, respuesta: formData.comunidad },
            { id_pregunta: 7, respuesta: formData.ligas },
            { id_pregunta: 8, respuesta: formData.ventajas },
            { id_pregunta: 9, respuesta: formData.embajadores },
            { id_pregunta: 10, respuesta: formData.mentoring },
            { id_pregunta: 11, respuesta: formData.tech_stack }
        ];

        const fecha_respuesta = new Date().toISOString().split('T')[0];

        const respuestasParaInsertar = respuestasRaw
            .filter(resp => resp.respuesta && String(resp.respuesta).trim() !== "")
            .map(resp => ({
                id_alumno: id_alumno,
                id_pregunta: resp.id_pregunta,
                respuesta: String(resp.respuesta),
                fecha_respuesta: fecha_respuesta
            }));

        if (respuestasParaInsertar.length > 0) {
            const { error: respError } = await supabase
                .from('respuestas')
                .upsert(respuestasParaInsertar, { onConflict: 'id_alumno, id_pregunta' });

            if (respError) throw respError;
        }

        return { success: true };
    } catch (error) {
        console.error("Error detallado:", error);
        return { success: false, error: error.message };
    }
}

// --- CONTROLADORES ---

async function submitForm() {
    const formData = gatherFormData();
    
    nextBtn.disabled = true;
    const originalText = nextBtn.textContent;
    nextBtn.innerHTML = 'Enviando...';
    
    const result = await saveToSupabase(formData);
    
    if (result.success) {
        showToast("✅ ¡Encuesta enviada con éxito!");
        setTimeout(() => {
            window.location.reload(); // O index.html
        }, 2000);
    } else {
        showToast("❌ Error al guardar: " + result.error, true);
        nextBtn.disabled = false;
        nextBtn.textContent = "Reintentar";
    }
}

nextBtn.addEventListener("click", async () => {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    } else {
        await submitForm();
    }
});

prevBtn.addEventListener("click", () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
});

function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = "custom-toast";
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; 
        bottom: 30px; 
        left: 50%; 
        transform: translateX(-50%); 
        background: ${isError ? '#dc3545' : '#1f6b4f'}; 
        color: white; 
        padding: 12px 24px; 
        border-radius: 8px; 
        z-index: 10000; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: sans-serif;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function init() {
    setupTechStackToggle();
    showStep(currentStep);
}

document.addEventListener("DOMContentLoaded", init);