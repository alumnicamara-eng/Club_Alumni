// Configuración de Supabase
const SUPABASE_URL = 'https://fkwaqdhlyiyqgjuurbwo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_f_cY7KyntJ5BaghxEqL9aw_4GCvCOHj';

// Inicializar Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar conexión
async function checkSupabaseConnection() {
    try {
        const { data, error } = await _supabase.from('alumnos').select('count', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Conectado a Supabase correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error);
        return false;
    }
}