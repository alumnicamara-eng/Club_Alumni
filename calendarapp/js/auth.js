/* ==========================================================
   Login / logout / sesión persistente.
   En el backend real se sustituye por llamada a Supabase Auth.
   ========================================================== */

function tryLogin() {
  const u = $('#authUser').value.trim();
  const p = $('#authPass').value;
  const user = DATA.users.find(x => (x.dni === u || x.email === u) && x.password === p);
  if (!user) { toast('Credenciales incorrectas'); return; }
  State.user = user;
  localStorage.setItem('alumni-user', user.dni);
  bootApp();
}

function logout() {
  State.user = null;
  localStorage.removeItem('alumni-user');
  $('#appShell').classList.add('hidden');
  $('#authOverlay').style.display = 'flex';
}

function autoLogin() {
  const dni = localStorage.getItem('alumni-user');
  if (!dni) return false;
  const user = DATA.users.find(x => x.dni === dni);
  if (!user) return false;
  State.user = user;
  return true;
}

// ==================== AUTH.JS ====================

let currentUser = null;
let pushSubscription = null;

async function login() {
    const user = document.getElementById('authUser').value;
    const pass = document.getElementById('authPass').value;
    
    if (!user || !pass) {
        toast('Rellena todos los campos');
        return;
    }

    // Buscar usuario en datos
    const userData = data.users.find(u => (u.dni === user || u.email === user) && u.password === pass);
    
    if (userData || (user === 'admin' && pass === 'admin123')) {
        currentUser = userData || { 
            id: 'admin', 
            name: 'Administrador', 
            email: 'admin@camarafp.es', 
            role: 'admin',
            ciclo: 'ADMIN',
            year: 2024
        };
        
        // Guardar sesión
        localStorage.setItem('alumniUser', JSON.stringify(currentUser));
        
        // Ocultar auth, mostrar app
        document.getElementById('authOverlay').classList.add('hidden');
        document.getElementById('appShell').classList.remove('hidden');
        
        // Inicializar app
        initApp();
        toast('Bienvenido, ' + currentUser.name);
    } else {
        toast('Credenciales incorrectas');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('alumniUser');
    location.reload();
}

function checkSession() {
    const stored = localStorage.getItem('alumniUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        document.getElementById('authOverlay').classList.add('hidden');
        document.getElementById('appShell').classList.remove('hidden');
        initApp();
    }
}

// ==================== NOTIFICACIONES PUSH ====================

async function requestPush() {
    if (!('Notification' in window)) {
        toast('Tu navegador no soporta notificaciones push');
        return;
    }

    // Solicitar permiso
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
        toast('📢 Notificaciones activadas');
        console.log('Notificaciones permitidas');
        
        // Registrar Service Worker para push
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('Service Worker listo');
                
                // Aquí en producción te suscribirías a tu servidor de push (Firebase, etc.)
                // Suscribirse a push manager
                const pushManager = registration.pushManager;
                const subscription = await pushManager.getSubscription();
                
                if (!subscription) {
                    const newSub = await pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfggjX4u76gRb_6iKv0lC2PGQys7f-lBQ') // Ejemplo VAPID
                    });
                    console.log('Suscrito:', newSub);
                }
            } catch (e) {
                console.log('SW no disponible o error:', e);
            }
        }
    } else if (permission === 'denied') {
        toast('❌ Notificaciones bloqueadas. Actívalas en ajustes del navegador.');
    } else {
        toast('Notificaciones canceladas');
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function adminTestPush() {
    if (Notification.permission === 'granted') {
        new Notification('Alumni Cámara FP', {
            body: '¡Esto es una prueba de notificación push!',
            icon: './img/logo.jpeg',
            badge: './img/logo.jpeg',
            tag: 'test'
        });
        toast('📢 Notificación enviada');
    } else {
        toast('Activa primero las notificaciones en tu perfil');
    }
}

// Inicializar listeners
document.getElementById('authLogin').addEventListener('click', login);
document.addEventListener('DOMContentLoaded', checkSession);
