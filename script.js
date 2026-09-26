// Variables Globales
let mapGeo = null;
let mapMain = null;
let markerGeo = null;
let selectedLocation = "Cra. 12 #45-57, Medellín";

const defaultReports = [
    { id: '#R-4587', cat: 'Basura', date: '25 SEP 2026 - 10:24 AM', status: 'En proceso', loc: 'Quebrada La Esperanza' },
    { id: '#R-4586', cat: 'Líquidos / químicos', date: '24 SEP 2026 - 4:30 PM', status: 'En proceso', loc: 'Río Medellín' },
    { id: '#R-4585', cat: 'Escombros', date: '20 SEP 2026 - 11:15 AM', status: 'Resuelto', loc: 'Quebrada La Santa' }
];

function getSafeReports() {
    try {
        let reports = JSON.parse(localStorage.getItem('nq_reports'));
        if (!Array.isArray(reports) || reports.length === 0) {
            localStorage.setItem('nq_reports', JSON.stringify(defaultReports));
            return defaultReports;
        }
        return reports;
    } catch (e) {
        localStorage.setItem('nq_reports', JSON.stringify(defaultReports));
        return defaultReports;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getSafeReports();
    if(localStorage.getItem('nq_theme') === 'dark') document.body.classList.add('dark-mode');
    
    let dtInput = document.getElementById('report-datetime');
    if(dtInput) {
        let now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        dtInput.value = now.toISOString().slice(0,16);
    }
    navigate('home');
});

// Forzamos que las funciones sean globales para que el HTML siempre las encuentre
window.navigate = function(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    let target = document.getElementById(`view-${viewId}`);
    if(target) target.classList.add('active');
    
    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, 0);

    const publicViews = ['home', 'login', 'register'];
    if (publicViews.includes(viewId)) {
        document.body.classList.add('no-sidebar');
    } else {
        document.body.classList.remove('no-sidebar');
    }

    // Retardos para asegurar que el DOM cargó el flexbox antes de pintar el mapa
    if (viewId === 'geo') setTimeout(initMapGeo, 400);
    if (viewId === 'map') setTimeout(initMapMain, 400);
    if (viewId === 'history') {
        let firstTab = document.querySelector('.tab');
        if(firstTab) filterReports('Todos', firstTab);
    }
};

window.toggleSidebar = function() {
    document.body.classList.toggle('sidebar-open');
};

window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('nq_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
};

window.selectCategory = function(catName) {
    let radio = document.querySelector(`input[name="cat"][value="${catName}"]`);
    if(radio) radio.checked = true;
    navigate('category');
};

window.submitReport = function() {
    try {
        let catRadio = document.querySelector('input[name="cat"]:checked');
        let cat = catRadio ? catRadio.value : 'Basura';
        let dateTime = document.getElementById('report-datetime').value || new Date().toISOString();
        
        let id = '#R-' + Math.floor(1000 + Math.random() * 9000);
        let d = new Date(dateTime);
        let dateF = `${d.getDate()} ${d.toLocaleString('es-ES', {month:'short'}).toUpperCase()} ${d.getFullYear()} - ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

        let newRep = { id: id, cat: cat, date: dateF, status: 'En proceso', loc: selectedLocation };
        
        let reports = getSafeReports();
        reports.unshift(newRep);
        localStorage.setItem('nq_reports', JSON.stringify(reports));

        document.getElementById('new-report-id').innerText = id;
        document.getElementById('report-desc').value = '';
        navigate('confirmation');
    } catch(e) {
        alert("Ocurrió un error guardando el reporte. Intenta nuevamente.");
        console.error(e);
    }
};

window.filterReports = function(status, btnElement) {
    if (btnElement) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        btnElement.classList.add('active');
    }
    let reports = getSafeReports();
    let container = document.getElementById('reports-list-container');
    if(!container) return;
    
    container.innerHTML = '';
    let filtered = status === 'Todos' ? reports : reports.filter(r => r.status === status);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-4">No hay reportes.</p>';
        return;
    }

    filtered.forEach(rep => {
        let icon = rep.cat.includes('Basura') ? 'fa-trash-alt' : rep.cat.includes('Líquido') ? 'fa-tint' : rep.cat.includes('Escombro') ? 'fa-hard-hat' : 'fa-water';
        let badge = rep.status === 'Resuelto' ? 'resuelto' : 'proceso';
        container.innerHTML += `
            <div class="report-card">
                <div class="report-img"><i class="fas ${icon}"></i></div>
                <div class="report-info">
                    <h4>${rep.id} | ${rep.cat} <span class="badge ${badge}">${rep.status}</span></h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${rep.loc}</p>
                    <p><i class="far fa-clock"></i> ${rep.date}</p>
                </div>
            </div>`;
    });
};

function initMapGeo() {
    try {
        if (typeof L === 'undefined') return;
        if (!mapGeo) {
            mapGeo = L.map('map-geo').setView([6.2442, -75.5812], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapGeo);
            markerGeo = L.marker([6.2442, -75.5812], { draggable: true }).addTo(mapGeo);
            markerGeo.on('dragend', function () {
                selectedLocation = `Lat: ${markerGeo.getLatLng().lat.toFixed(4)}, Lng: ${markerGeo.getLatLng().lng.toFixed(4)}`;
                document.getElementById('location-text').innerText = selectedLocation + " (Ajustado)";
            });
            document.getElementById('location-text').innerText = "Cra. 12 #45-57, Medellín (Puedes mover el pin)";
        }
        mapGeo.invalidateSize();
    } catch(e) { console.error(e); }
}

function initMapMain() {
    try {
        if (typeof L === 'undefined') return;
        if (!mapMain) {
            mapMain = L.map('map-main').setView([6.2442, -75.5812], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapMain);
            L.marker([6.24, -75.58]).addTo(mapMain).bindPopup("<b>#R-4587</b><br>Basura");
            L.marker([6.25, -75.57]).addTo(mapMain).bindPopup("<b>#R-4586</b><br>Líquidos");
            L.marker([6.23, -75.59]).addTo(mapMain).bindPopup("<b>#R-4585</b><br>Escombros");
        }
        mapMain.invalidateSize();
    } catch(e) { console.error(e); }
}
