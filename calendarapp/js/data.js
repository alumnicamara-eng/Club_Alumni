/* ==========================================================
   Estado global, constantes y datos mock.
   Sustituible por Supabase (o cualquier backend) en una sola capa.
   ========================================================== */

const State = {
  user: null,
  current: 'inicio',
  calDate: new Date(),
  calSelected: null,
  filters: {
    news: 'todas',
    talks: 'todas',
    posts: 'todas',
    mentorCiclo: '',
  },
  notifications: [],
};

const NAV = [
  { id: 'inicio',     label: 'Inicio',        icon: 'fa-house' },
  { id: 'noticias',   label: 'Noticias',      icon: 'fa-newspaper' },
  { id: 'calendario', label: 'Calendario',    icon: 'fa-calendar-days' },
  { id: 'talks',      label: 'Conferencias',  icon: 'fa-video' },
  { id: 'mentoria',   label: 'Mentoría',      icon: 'fa-user-graduate' },
  { id: 'comunidad',  label: 'Comunidad',     icon: 'fa-comments' },
  { id: 'directorio', label: 'Descubre Alumnis', icon: 'fa-address-book' },
];
const MOBILE_NAV_IDS = ['inicio', 'calendario', 'talks', 'mentoria', 'comunidad'];

const CICLOS = ['DAW', 'DAM', 'ASIR', 'Marketing', 'Administración', 'Comercio Internacional'];

const DATA = {
  users: [
    { dni:'12345678', email:'alumni@camarafp.es', name:'Lucía Pérez', password:'user123', role:'user',
      ciclo:'DAW', year:2022, company:'Banco Sabadell', position:'Frontend Developer', sector:'Tecnología',
      bio:'Apasionada del frontend y la accesibilidad. Disponible para networking y compartir experiencia.',
      linkedin:'https://linkedin.com/in/lucia', github:'https://github.com/lucia', web:'',
      interests:['networking','mentoring'], photo:null,
      push:{events:true, news:true, mentor:false} },
    { dni:'admin', email:'admin@camarafp.es', name:'Equipo Alumni', password:'admin123', role:'admin',
      ciclo:'', year:null, company:'Cámara FP', position:'Coordinación Alumni', sector:'Educación',
      bio:'Coordinación del programa Alumni Cámara FP.',
      linkedin:'', github:'', web:'', interests:[], photo:null,
      push:{events:true, news:true, mentor:true} },
    { dni:'87654321', name:'Carlos Ruiz', ciclo:'DAM', year:2020, company:'Indra', position:'Backend Engineer', sector:'Tecnología', bio:'Backend Java/Kotlin, sistemas distribuidos.', linkedin:'https://linkedin.com/in/carlos', github:'', web:'', interests:[], role:'user' },
    { dni:'11223344', name:'Ana Gómez', ciclo:'Marketing', year:2021, company:'Freelance', position:'Brand Strategist', sector:'Marketing', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
    { dni:'55667788', name:'Miguel Soler', ciclo:'ASIR', year:2019, company:'Telefónica Tech', position:'DevOps', sector:'Tecnología', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
    { dni:'99887766', name:'Paula Torres', ciclo:'Administración', year:2023, company:'PwC', position:'Auditora Jr.', sector:'Banca y Finanzas', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
    { dni:'44556677', name:'Javier Núñez', ciclo:'Comercio Internacional', year:2022, company:'Mercadona', position:'Compras internacionales', sector:'Logística', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
    { dni:'33445566', name:'Marta Lillo', ciclo:'DAW', year:2024, company:'Capgemini', position:'Junior Web Developer', sector:'Tecnología', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
    { dni:'22334455', name:'Alberto Vidal', ciclo:'DAM', year:2023, company:'Strands', position:'Mobile Developer', sector:'Tecnología', bio:'', linkedin:'', github:'', web:'', interests:[], role:'user' },
  ],

  news: [
    { id:1, title:'Abrimos inscripciones a la edición 2026 de Alumni Talks', summary:'Una nueva temporada de charlas con ponentes alumni de referencia. Más de 12 sesiones programadas.', tag:'club',     date:'2026-05-12', wpUrl:'https://alumni.camarafp.es/?p=101' },
    { id:2, title:'5 empresas del Vivero buscan talento Alumni',              summary:'Ofertas activas para perfiles de DAW, DAM, ASIR y Marketing. Acceso prioritario a alumni.',                tag:'empleo',   date:'2026-05-08', wpUrl:'https://alumni.camarafp.es/?p=102' },
    { id:3, title:'Nuevo curso bonificado para alumnis: IA aplicada al puesto',summary:'30 plazas exclusivas para antiguos alumnos. Inicio en junio.',                                            tag:'formacion',date:'2026-05-02', wpUrl:'https://alumni.camarafp.es/?p=103' },
    { id:4, title:'Networking de primavera: cena anual el 14 de junio',        summary:'Reservada para alumnis Cámara FP y acompañante. Cupo limitado.',                                          tag:'eventos',  date:'2026-04-28', wpUrl:'https://alumni.camarafp.es/?p=104' },
  ],

  events: [
    { id:1, title:'Mesa redonda: el primer año en el sector tech', desc:'Tres alumnis comparten cómo fue su primer empleo: shocks, aprendizajes y consejos prácticos.', date:'2026-05-28', time:'18:00', place:'Salón de actos Cámara FP', spots:80,  enrolled:['12345678'], category:'tecnologia' },
    { id:2, title:'Taller: preparar tu LinkedIn para conseguir prácticas',     desc:'Sesión práctica: trae tu perfil y lo mejoramos juntos.',                                date:'2026-06-04', time:'17:30', place:'Aula 204',                spots:30,  enrolled:[],            category:'empleabilidad' },
    { id:3, title:'Alumni Talk en directo: emprender desde un ciclo',          desc:'Charla y Q&A con una emprendedora alumni.',                                            date:'2026-06-12', time:'19:00', place:'Online (Zoom)',            spots:200, enrolled:[],            category:'emprendimiento' },
    { id:4, title:'Cena anual Alumni Cámara FP',                               desc:'Encuentro anual de la comunidad alumni. Cupo limitado, requiere confirmación.',         date:'2026-06-14', time:'20:30', place:'Hotel SH Valencia Palace', spots:120, enrolled:[],            category:'networking' },
    { id:5, title:'Workshop: introducción a Kubernetes (ASIR/DAM)',            desc:'Sesión práctica con entornos reales.',                                                  date:'2026-06-20', time:'10:00', place:'Aula B12',                 spots:25,  enrolled:[],            category:'tecnologia' },
    { id:6, title:'Visita guiada: planta de Ford Almussafes para Alumni',      desc:'Visita técnica con explicación de procesos. Aforo limitado.',                           date:'2026-06-20', time:'16:00', place:'Ford Almussafes',          spots:20,  enrolled:[],            category:'industria' },
    { id:7, title:'Mentor Coffee: encuentro abierto mentores ↔ mentees',       desc:'Café informal con todos los mentores del programa.',                                    date:'2026-06-26', time:'18:30', place:'Café Library, Valencia',   spots:40,  enrolled:[],            category:'networking' },
  ],

  talks: [
    { id:1, title:'Frontend moderno: claves para tu primer empleo',  speaker:'Lucía Pérez (DAW 2022)',  cat:'tecnologia',    date:'2026-04-22', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'Repaso de stack, buenas prácticas y errores a evitar.' },
    { id:2, title:'Negocia tu primer sueldo sin miedo',              speaker:'Ana Gómez (Marketing 2021)', cat:'empleabilidad', date:'2026-04-05', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'Cómo investigar, preparar y plantear la conversación.' },
    { id:3, title:'De ciclo a emprender: lecciones del primer año',  speaker:'Javier Núñez (CI 2022)',  cat:'emprendimiento',date:'2026-03-20', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'Recursos, contactos y errores reales.' },
    { id:4, title:'Liderar equipos técnicos siendo junior',          speaker:'Miguel Soler (ASIR 2019)',cat:'liderazgo',     date:'2026-03-02', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'Buenas prácticas de comunicación y delegación.' },
    { id:5, title:'Banca, fintech y oportunidades para alumnis',     speaker:'Paula Torres (ADM 2023)', cat:'empleabilidad', date:'2026-02-14', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'Mapa del sector y perfiles que se buscan.' },
    { id:6, title:'IA generativa: cómo usarla en tu día a día',      speaker:'Carlos Ruiz (DAM 2020)',  cat:'tecnologia',    date:'2026-02-01', url:'https://www.youtube.com/embed/dQw4w9WgXcQ', desc:'De prompts a workflows reales.' },
  ],

  talkProposals: [
    { id:1, dni:'87654321', name:'Carlos Ruiz', email:'carlos@example.com', ciclo:'DAM', year:2020, topic:'Arquitecturas backend escalables con Java y Kafka', duration:'45', format:'Online', desc:'Repaso de patrones que usamos en Indra para sistemas con miles de eventos/segundo.', date:Date.now()-86400e3, status:'pending' },
  ],

  mentors: [
    { id:1, userDni:'87654321', ciclo:'DAM',                    bio:'5 años en backend Java. Ayudo con primer empleo, entrevistas técnicas y trayectoria.', max:5, mentees:['11122233','22233344'] },
    { id:2, userDni:'11223344', ciclo:'Marketing',              bio:'Estrategia de marca y portfolio. Llevo 4 alumnos cada curso.',                          max:5, mentees:[] },
    { id:3, userDni:'55667788', ciclo:'ASIR',                   bio:'DevOps en Telefónica Tech. Mentor desde 2024. Hablo de redes, cloud y certificaciones.',max:5, mentees:['33344455','44455566','55566677'] },
    { id:4, userDni:'99887766', ciclo:'Administración',         bio:'Auditoría y banca. Comparto cómo entré en una Big Four sin ir a la universidad.',       max:5, mentees:['66677788'] },
    { id:5, userDni:'44556677', ciclo:'Comercio Internacional', bio:'Trabajo en compras internacionales. Si te interesa el comercio exterior, hablamos.',    max:4, mentees:[] },
  ],

  posts: [
    { id:1, authorDni:'87654321', cat:'empleo',   body:'En Indra abrimos 3 puestos de backend Java para perfiles junior. Si os interesa, escribidme por LinkedIn.', date:Date.now()-3600e3,    likes:['12345678','11223344'], comments:[{a:'11223344',t:'Te paso CV, gracias por el aviso.',d:Date.now()-1800e3}] },
    { id:2, authorDni:'11223344', cat:'pregunta', body:'¿Alguien que haya hecho freelance de marketing en sus primeros años? Me gustaría hablar antes de dar el paso.', date:Date.now()-7200e3,    likes:[], comments:[] },
    { id:3, authorDni:'99887766', cat:'logro',    body:'Acabo de firmar mi primer contrato indefinido en PwC. Gracias a todo el equipo Alumni por las recomendaciones de prepa de entrevistas.', date:Date.now()-9e6, likes:['12345678','87654321','55667788','44556677'], comments:[] },
    { id:4, authorDni:'55667788', cat:'recurso',  body:'Os dejo un curso gratuito de Kubernetes que me ha gustado mucho: https://kubernetes.io/training — para perfiles ASIR/DAM principalmente.', date:Date.now()-2*86400e3, likes:['12345678'], comments:[] },
  ],

};
