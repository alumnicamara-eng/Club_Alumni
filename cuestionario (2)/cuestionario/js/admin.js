// js/admin.js
let dataTable;
let currentUserRole = sessionStorage.getItem('userRole');

// Verificar autenticación
if (currentUserRole !== 'admin') {
    window.location.href = 'login.html';
}

// Cargar datos al iniciar
$(document).ready(async function() {
    await cargarTabla();
});

async function checkAuth() {
    const { data } = await _supabase.auth.getUser();

    if (!data.user) {
        window.location.href = "login.html";
    }
}

checkAuth();

async function cargarTabla() {
    const { data, error } = await _supabase
        .from('alumnos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (dataTable) {
        dataTable.destroy();
    }

    dataTable = $('#tablaAlumnos').DataTable({
        data: data,
        columns: [
            { data: 'id' },
            { 
                data: null,
                render: (data) => data.nombre || '-'
            },
            { data: 'email' },
            { data: 'ciclo' },
            { data: 'situacion' },
            { 
                data: 'created_at',
                render: (data) => data ? new Date(data).toLocaleDateString() : '-'
            },
            {
                data: null,
                render: (data) => `
                    <button class="btn-edit" onclick="editAlumno(${data.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteAlumno(${data.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                `,
                orderable: false
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        pageLength: 10
    });
}

function openModal() {
    document.getElementById('modalTitle').innerText = 'Nuevo Alumno';
    document.getElementById('editId').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('email').value = '';
    document.getElementById('cicloSelect').value = 'DAM';
    document.getElementById('situacionSelect').value = 'Buscando mi primer empleo';
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

async function editAlumno(id) {
    const { data, error } = await _supabase
        .from('alumnos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        alert('Error al cargar los datos');
        return;
    }

    document.getElementById('modalTitle').innerText = 'Editar Alumno';
    document.getElementById('editId').value = data.id;
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('cicloSelect').value = data.ciclo || 'DAM';
    document.getElementById('situacionSelect').value = data.situacion || 'Buscando mi primer empleo';
    document.getElementById('modal').style.display = 'flex';
}

async function saveAlumno() {
    const id = document.getElementById('editId').value;
    const alumnoData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        ciclo: document.getElementById('cicloSelect').value,
        situacion: document.getElementById('situacionSelect').value,
        updated_at: new Date().toISOString()
    };

    let result;
    if (id) {
        // Actualizar
        result = await _supabase
            .from('alumnos')
            .update(alumnoData)
            .eq('id', id);
    } else {
        // Crear nuevo
        result = await _supabase
            .from('alumnos')
            .insert([{ ...alumnoData, created_at: new Date().toISOString() }]);
    }

    if (result.error) {
        alert('Error al guardar: ' + result.error.message);
    } else {
        alert(id ? 'Alumno actualizado' : 'Alumno creado');
        closeModal();
        await cargarTabla();
    }
}

async function deleteAlumno(id) {
    if (!confirm('¿Estás seguro de eliminar este alumno?')) return;

    const { error } = await _supabase
        .from('alumnos')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar: ' + error.message);
    } else {
        alert('Alumno eliminado');
        await cargarTabla();
    }
}

async function logout() {
    await _supabase.auth.signOut();
    window.location.href = "login.html";
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
};

async function cargarGraficos() {

    // 📊 CICLOS
    const { data: ciclos } = await _supabase
        .from("alumnos")
        .select("ciclo");

    const conteoCiclos = {};

    ciclos.forEach(a => {
        conteoCiclos[a.ciclo] = (conteoCiclos[a.ciclo] || 0) + 1;
    });

    new Chart(document.getElementById("graficoCiclo"), {
        type: "bar",
        data: {
            labels: Object.keys(conteoCiclos),
            datasets: [{
                label: "Alumnos por ciclo",
                data: Object.values(conteoCiclos)
            }]
        }
    });


    // 📊 SITUACIÓN
    const { data: situacion } = await _supabase
        .from("alumnos")
        .select("situacion");

    const conteoSituacion = {};

    situacion.forEach(a => {
        conteoSituacion[a.situacion] = (conteoSituacion[a.situacion] || 0) + 1;
    });

    new Chart(document.getElementById("graficoSituacion"), {
        type: "pie",
        data: {
            labels: Object.keys(conteoSituacion),
            datasets: [{
                data: Object.values(conteoSituacion)
            }]
        }
    });
}

cargarGraficos();