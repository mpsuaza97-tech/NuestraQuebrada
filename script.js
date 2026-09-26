// --- VARIABLES GLOBALES ---
let mapGeo = null;
let mapMain = null;
let markerGeo = null;
let selectedLocation = "Arrastra el marcador para definir ubicación";

// Datos por defecto (Concuerdan exactamente con las notificaciones y tu diseño)
const defaultReports = [
    { id: '#R-4587', cat: 'Basura', date: '25 SEP 2026 - 10:24 AM', status: 'En proceso', loc: 'Quebrada La Esperanza' },
    { id: '#R-4586', cat: 'Líquidos / químicos', date: '24 SEP 2026 - 4:30 PM', status: 'En proceso', loc: 'Río Medellín' },
    { id: '#R-4585', cat: 'Escombros', date: '20 SEP 2026 - 11:15 AM', status: 'Resuelto', loc: 'Quebrada La Santa' }
];

// Función ultra segura para obtener reportes (evita que la app colapse si hay datos corruptos)
function getSafeReports() {
    try {
        let reports = JSON.parse(localStorage.getItem('nq_reports'));
        // Si no hay reportes o el array está vacío, forzamos los 3 por defecto
        if (!Array.isArray(reports) || reports.length === 0) {
            localStorage.setItem('nq_reports', JSON.stringify(defaultReports));
            return defaultReports;
        }
        return reports;
    } catch (error) {
        // Si el localStorage se corrompió, lo reseteamos
        localStorage.setItem('nq_reports', JSON.stringify(defaultReports));
        return defaultReports;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar reportes base si está vacío
    getSafeReports();
    
    // 2. Configurar fecha actual en el input
    const dtInput = document.getElementById('report-datetime');
    if(dtInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dtInput.value = now.toISOString().slice(0,16);
    }

    // 3. Revisar tema oscuro
    if(localStorage.getItem('nq_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // 4. Iniciar en la pantalla principal
    navigate('home');
});

// --- NAVEGACIÓN Y MENÚ ---
function navigate(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Mostrar la solicitada
    const targetView = document.getElementById(`view-${viewId}`);
    if(targetView) {
        targetView.classList.add('active');
    }
    
    // Cerrar menú en móviles si está abierto
    document.body.classList.remove('sidebar-open');
    document.getElementById('main-content').scrollTop = 0;

    // Ocultar sidebar en pantallas públicas (Inicio, Login, Registro)
    const publicViews = ['home', 'login', 'register'];
    if (publicViews.includes(viewId)) {
        document.body.classList.add('no-sidebar');
    } else {
        document.body.classList.remove('no-sidebar');
    }

    // Lógica específica al entrar a ciertas vistas
    if (viewId === 'geo') {
        setTimeout(initMapGeo, 200); // Retardo crucial para que Leaflet calcule el tamaño
    }
    if (viewId === 'map') {
        setTimeout(initMapMain, 200);
    }
    if (viewId === 'history') {
        // Forzar visualmente el botón "Todos"
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.tab').classList.add('active');
        filterReports('Todos');
    }
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function selectCategory(catName) {
    const radio = document.querySelector(`input[name="cat"][value="${catName}"]`);
    if(radio) radio.checked = true;
    navigate('category');
}

function logout() {
    navigate('home');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('nq_theme', isDark ? 'dark' : 'light');
}

// --- LÓGICA DE MAPAS (LEAFLET) ---
function initMapGeo() {
    if (!mapGeo) {
        mapGeo = L.map('map-geo').setView([6.2442, -75.5812], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapGeo);

        markerGeo = L.marker([6.2442, -75.5812], { draggable: true }).addTo(mapGeo);
        
        markerGeo.on('dragend', function () {
            const lat = markerGeo.getLatLng().lat.toFixed(4);
            const lng = markerGeo.getLatLng().lng.toFixed(4);
            selectedLocation = `Lat: ${lat}, Lng: ${lng}`;
            document.getElementById('location-text').innerText = selectedLocation + " (Ubicación ajustada)";
        });
        
        document.getElementById('location-text').innerText = "Cra. 12 #45-57, Medellín (Puedes mover el pin)";
        selectedLocation = "Cra. 12 #45-57, Medellín";
    }
    // ESTO ES LA MAGIA: Obliga al mapa a redibujarse después de quitarle el display:none
    mapGeo.invalidateSize();
}

function initMapMain() {
    if (!mapMain) {
        mapMain = L.map('map-main').setView([6.2442, -75.5812], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapMain);
        
        L.marker([6.24, -75.58]).addTo(mapMain).bindPopup("<b>#R-4587</b><br>Basura");
        L.marker([6.25, -75.57]).addTo(mapMain).bindPopup("<b>#R-4586</b><br>Líquidos / químicos");
        L.marker([6.23, -75.59]).addTo(mapMain).bindPopup("<b>#R-4585</b><br>Escombros");
    }
    mapMain.invalidateSize();
}

// --- LÓGICA DE REPORTES (GUARDAR Y FILTRAR) ---
function submitReport() {
    try {
        const desc = document.getElementById('report-desc').value;
        const catRadio = document.querySelector('input[name="cat"]:checked');
        const cat = catRadio ? catRadio.value : 'Otro';
        let dateTime = document.getElementById('report-datetime').value;
        
        // Si por error borraron la fecha, ponemos la actual
        if(!dateTime) {
            const now = new Date();
            dateTime = now.toISOString().slice(0,16);
        }
        
        const id = '#R-' + Math.floor(1000 + Math.random() * 9000);
        const dateObj = new Date(dateTime);
        const dateFormatted = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() + ' - ' + dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });

        const newReport = {
            id: id, cat: cat, date: dateFormatted, status: 'En proceso', loc: selectedLocation
        };

        let reports = getSafeReports();
        reports.unshift(newReport); // Añadir al principio
        localStorage.setItem('nq_reports', JSON.stringify(reports));

        document.getElementById('new-report-id').innerText = id;
        document.getElementById('report-desc').value = ''; // Limpiar campo
        
        navigate('confirmation');
    } catch (e) {
        console.error("Error al enviar el reporte: ", e);
        alert("Ocurrió un error guardando el reporte. Inténtalo de nuevo.");
    }
}

function filterReports(status, btnElement = null) {
    if (btnElement) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const reports = getSafeReports();
    const container = document.getElementById('reports-list-container');
    container.innerHTML = '';

    const filtered = status === 'Todos' ? reports : reports.filter(r => r.status === status);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-4">No hay reportes en esta categoría.</p>';
        return;
    }

    filtered.forEach(rep => {
        let icon = 'fa-file-alt';
        if(rep.cat.includes('Basura')) icon = 'fa-trash-alt';
        if(rep.cat.includes('Líquido')) icon = 'fa-tint';
        if(rep.cat.includes('Escombro')) icon = 'fa-hard-hat';
        if(rep.cat.includes('Taponamiento')) icon = 'fa-water';

        const badgeClass = rep.status === 'Resuelto' ? 'resuelto' : 'proceso';

        container.innerHTML += `
            <div class="report-card">
                <div class="report-img"><i class="fas ${icon}"></i></div>
                <div class="report-info">
                    <h4>${rep.id} | ${rep.cat} <span class="badge ${badgeClass}">${rep.status}</span></h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${rep.loc}</p>
                    <p><i class="far fa-clock"></i> ${rep.date}</p>
                </div>
            </div>
        `;
    });
}
