document.addEventListener("DOMContentLoaded", () => {
    // Al cargar la app, mostramos la vista inicial (home)
    navigate('home');
});

// Función para navegar entre vistas ocultando las demás
function navigate(viewId) {
    // 1. Ocultar todas las vistas
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        view.classList.remove('active');
    });

    // 2. Mostrar la vista solicitada
    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) {
        activeView.classList.add('active');
    }

    // 3. En dispositivos móviles, ocultar el sidebar si se hizo clic en un enlace
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('hidden')) {
            sidebar.classList.add('hidden');
        }
    }
    
    // Desplazar el scroll arriba al cambiar de pantalla
    document.getElementById('main-content').scrollTop = 0;
}

// Función para abrir/cerrar el menú lateral en móviles
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

// Lógica básica para las pestañas de Historial
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        // Aquí podrías agregar lógica extra para filtrar la lista si estuviera conectada a una base de datos
    });
});