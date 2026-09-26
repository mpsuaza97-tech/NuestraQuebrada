// --- VARIABLES GLOBALES ---
let mapGeo = null;
let mapMain = null;
let markerGeo = null;
let selectedLocation = "Arrastra el marcador para definir ubicación";

// Datos iniciales si el usuario no tiene nada guardado
const defaultReports = [
    { id: '#R-4587', cat: 'Basura', date: '25 SEP 2026 - 10:24 AM', status: 'En proceso', loc: 'Quebrada La Esperanza' },
    { id: '#R-4586', cat: 'Líquidos / químicos', date: '24 SEP 2026 - 4:30 PM', status: 'En proceso', loc: 'Quebrada La Iguaná' },
    { id: '#R-4585', cat: 'Escombros', date: '20 SEP 2026 - 11:15 AM', status: 'Resuelto', loc: 'Quebrada La Santa' }
];

document.addEventListener("DOMContentLoaded", () => {
    // Cargar reportes de localStorage
    if (!localStorage.getItem('nq_reports')) {
        localStorage.setItem('nq_reports', JSON.stringify(defaultReports));
    }
    
    // Configurar fecha actual en el input
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('report-datetime').value = now.toISOString().slice(0,16);

    // Revisar tema oscuro
    if(localStorage.getItem('nq_theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    navigate('home');
});

// --- NAVEGACIÓN Y MENÚ ---
function navigate(viewId) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    // Mostrar la solicitada
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    // Cerrar menú en móviles si está abierto
    document.body.classList.remove('sidebar-open');
    document.getElementById('main-content').scrollTop = 0;

    // Lógica específica por vista
    if (viewId === 'geo') initMapGeo();
    if (viewId === 'map') initMapMain();
    if (viewId === 'history') renderReports('Todos');
}

function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

function selectCategory(catName) {
    // Seleccionar radio button por valor
    const radio = document.querySelector(`input[name="cat"][value="${catName}"]`);
    if(radio) radio.checked = true;
    navigate('category');
}

function logout() {
    // Simula cerrar sesión
    navigate('home');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('nq_theme', isDark ? 'dark' : 'light');
}

// --- LÓGICA DE MAPAS (LEAFLET) ---
function initMapGeo() {
    // Esperar a que el div esté visible
    setTimeout(() => {
        if (!mapGeo) {
            // Inicializar mapa centrado en Medellín
            mapGeo = L.map('map-geo').setView([6.2442, -75.5812], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(mapGeo);

            // Marcador arrastrable
            markerGeo = L.marker([6.2442, -75.5812], { draggable: true }).addTo(mapGeo);
            
            // Evento al arrastrar
            markerGeo.on('dragend', function (e) {
                const lat = markerGeo.getLatLng().lat.toFixed(4);
                const lng = markerGeo.getLatLng().lng.toFixed(4);
                selectedLocation = `Lat: ${lat}, Lng: ${lng} (Quebrada cercana)`;
                document.getElementById('location-text').innerText = selectedLocation;
            });
            
            // Simular ubicación encontrada
            document.getElementById('location-text').innerText = "Cra. 12 #45-57, Medellín (Puedes mover el pin)";
            selectedLocation = "Cra. 12 #45-57, Medellín";
        } else {
            mapGeo.invalidateSize(); // Crucial cuando el mapa estaba en display:none
        }
    }, 200);
}

function initMapMain() {
    setTimeout(() => {
        if (!mapMain) {
            mapMain = L.map('map-main').setView([6.2442, -75.5812], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapMain);
            
            // Poner algunos pines de ejemplo
            L.marker([6.24, -75.58]).addTo(mapMain).bindPopup("<b>#R-4587</b><br>Basura");
            L.marker([6.25, -75.57]).addTo(mapMain).bindPopup("<b>#R-4586</b><br>Líquidos");
        } else {
            mapMain.invalidateSize();
        }
    }, 200);
}

// --- LÓGICA DE REPORTES (GUARDAR Y FILTRAR) ---
function submitReport() {
    const desc = document.getElementById('report-desc').value;
    const cat = document.querySelector('input[name="cat"]:checked')?.value || 'Otro';
    const dateTime = document.getElementById('report-datetime').value;
    
    // Crear ID aleatorio
    const id = '#R-' + Math.floor(1000 + Math.random() * 9000);
    
    // Formatear fecha para guardarla
    const dateObj = new Date(dateTime);
    const dateFormatted = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() + ' - ' + dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });

    const newReport = {
        id: id,
        cat: cat,
        date: dateFormatted,
        status: 'En proceso',
        loc: selectedLocation
    };

    // Guardar en localStorage
    let reports = JSON.parse(localStorage.getItem('nq_reports'));
    reports.unshift(newReport); // Añadir al principio
    localStorage.setItem('nq_reports', JSON.stringify(reports));

    // Actualizar vista de confirmación
    document.getElementById('new-report-id').innerText = id;
    
    // Limpiar form
    document.getElementById('report-desc').value = '';
    
    navigate('confirmation');
}

function filterReports(status, btnElement = null) {
    // Cambiar clase activa en las pestañas si se hace clic
    if (btnElement) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const reports = JSON.parse(localStorage.getItem('nq_reports')) || [];
    const container = document.getElementById('reports-list-container');
    container.innerHTML = '';

    // Filtrar array
    const filtered = status === 'Todos' ? reports : reports.filter(r => r.status === status);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-4">No hay reportes en esta categoría.</p>';
        return;
    }

    // Renderizar HTML
    filtered.forEach(rep => {
        // Asignar icono según categoría
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
