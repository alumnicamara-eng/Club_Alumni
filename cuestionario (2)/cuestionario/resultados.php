// js/resultados.js
let charts = {};

async function cargarDatos() {
    try {
        // Obtener total de alumnos
        const { count: totalAlumnos, error: countError } = await _supabase
            .from('alumnos')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        document.getElementById('totalAlumnos').textContent = totalAlumnos || 0;

        // Obtener valoraciones
        const { data: valoraciones, error: valError } = await _supabase
            .from('respuestas')
            .select('id_pregunta, respuesta')
            .in('id_pregunta', [5, 6, 7, 8]);

        if (valError) throw valError;

        // Calcular promedios
        const promedios = { 5: 0, 6: 0, 7: 0, 8: 0 };
        const counts = { 5: 0, 6: 0, 7: 0, 8: 0 };
        
        valoraciones.forEach(v => {
            const val = parseInt(v.respuesta);
            if (!isNaN(val) && val >= 1 && val <= 10) {
                promedios[v.id_pregunta] += val;
                counts[v.id_pregunta]++;
            }
        });

        document.getElementById('avgOpportunity').textContent = (promedios[5] / counts[5] || 0).toFixed(1);
        document.getElementById('avgComunidad').textContent = (promedios[6] / counts[6] || 0).toFixed(1);
        document.getElementById('avgLigas').textContent = (promedios[7] / counts[7] || 0).toFixed(1);

        // Obtener situación profesional
        const { data: situacion, error: sitError } = await _supabase
            .from('respuestas')
            .select('respuesta')
            .eq('id_pregunta', 1);

        if (sitError) throw sitError;

        const situacionCounts = {};
        situacion.forEach(s => {
            if (s.respuesta) situacionCounts[s.respuesta] = (situacionCounts[s.respuesta] || 0) + 1;
        });

        // Gráfico de situación
        if (charts.situacion) charts.situacion.destroy();
        charts.situacion = new Chart(document.getElementById('chartSituacion'), {
            type: 'pie',
            data: {
                labels: Object.keys(situacionCounts),
                datasets: [{ data: Object.values(situacionCounts), backgroundColor: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335'] }]
            }
        });

        // Gráfico de valoraciones
        if (charts.valoraciones) charts.valoraciones.destroy();
        charts.valoraciones = new Chart(document.getElementById('chartValoraciones'), {
            type: 'bar',
            data: {
                labels: ['Opportunity', 'Comunidad', 'Ligas', 'Ventajas'],
                datasets: [{
                    label: 'Valoración Media',
                    data: [
                        (promedios[5] / counts[5] || 0).toFixed(1),
                        (promedios[6] / counts[6] || 0).toFixed(1),
                        (promedios[7] / counts[7] || 0).toFixed(1),
                        (promedios[8] / counts[8] || 0).toFixed(1)
                    ],
                    backgroundColor: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335']
                }]
            },
            options: { scales: { y: { beginAtZero: true, max: 10 } } }
        });

        // Obtener datos de programas
        const { data: programas, error: progError } = await _supabase
            .from('respuestas')
            .select('id_pregunta, respuesta')
            .in('id_pregunta', [9, 10]);

        if (progError) throw progError;

        const embajadores = { 'Sí': 0, 'No': 0, 'Depende': 0 };
        const mentoring = { 'Sí': 0, 'No': 0 };

        programas.forEach(p => {
            if (p.id_pregunta === 9 && p.respuesta) embajadores[p.respuesta] = (embajadores[p.respuesta] || 0) + 1;
            if (p.id_pregunta === 10 && p.respuesta) mentoring[p.respuesta] = (mentoring[p.respuesta] || 0) + 1;
        });

        // Gráfico embajadores
        if (charts.embajadores) charts.embajadores.destroy();
        charts.embajadores = new Chart(document.getElementById('chartEmbajadores'), {
            type: 'pie',
            data: {
                labels: Object.keys(embajadores),
                datasets: [{ data: Object.values(embajadores), backgroundColor: ['#34a853', '#ea4335', '#fbbc04'] }]
            }
        });

        // Gráfico mentoring
        if (charts.mentoring) charts.mentoring.destroy();
        charts.mentoring = new Chart(document.getElementById('chartMentoring'), {
            type: 'pie',
            data: {
                labels: Object.keys(mentoring),
                datasets: [{ data: Object.values(mentoring), backgroundColor: ['#34a853', '#ea4335'] }]
            }
        });

    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

cargarDatos();