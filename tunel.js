document.addEventListener('DOMContentLoaded', function () {

    // ===============================
    // 1. AVISO INICIAL
    // ===============================
    Swal.fire({
        title: 'Instrucciones de uso / Instructions d\'utilisation',
        html: `
            <div style="text-align: left; font-size: 0.95rem; line-height: 1.5;">
                <p><b>Español:</b></p>
                <p>Bienvenido al <b>Visor Cartográfico del paso transfronterizo de Bielsa-Aragnouet</b>.</p>
                <ul style="list-style-type: disc; padding-left: 20px; margin-top: 10px;">
                    <li>Pinche en los distintos elementos para acceder a su información.</li>
                    <li>Los datos pueden tener un desfase temporal.</li>
                    <li>La información mostrada es informativa.</li>
                </ul>
            </div>
            <hr>
            <div style="text-align: left; font-size: 0.95rem; line-height: 1.5;">
                <p><b>Français :</b></p>
                <p>Bienvenue dans le <b>Visionneur Cartographique du passage transfrontalier de Bielsa-Aragnouet</b>.</p>
                <ul style="list-style-type: disc; padding-left: 20px; margin-top: 10px;">
                    <li>Appuyez sur les différents éléments pour accéder à leurs informations.</li>
                    <li>Les données peuvent présenter un décalage temporel.</li>
                    <li>Les informations affichées sont à titre informatif uniquement.</li>
                </ul>
            </div>
        `,
                icon: 'warning',
        confirmButtonText: 'He leído y acepto / Je ai lu et j\'accepte',
        confirmButtonColor: '#8e5938',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Solo si acepta, arrancamos el visor
            inicializarVisor();
        }
    });

    // ===============================
    // 2. FUNCIÓN PRINCIPAL DEL VISOR
    // ===============================
    function inicializarVisor() {
        
        // --- SIDENAV ---
        M.Sidenav.init(document.querySelectorAll('.sidenav'));

        // --- MAPA ---
        const map = L.map('contenedor-mapa').setView([42.712296, 0.198962], 12.5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // --- FUNCIONES AUXILIARES ---
        function actualizarFotoEnSidebar(rutaFoto) {
            const foto = document.getElementById('foto');
            if (!foto) return;
            if (rutaFoto) {
                foto.src = rutaFoto.startsWith('http') ? `${rutaFoto}?_=${Date.now()}` : rutaFoto;
                foto.style.display = 'block';
            } else {
                foto.src = '';
                foto.style.display = 'none';
            }
        }

        function mostrarInfoEnSidebar(feature, propiedadesSidebar) {
            const lista = document.getElementById('propiedades-list');
            const latlon = document.getElementById('latlon');
            lista.innerHTML = '';
            latlon.innerHTML = '';

            propiedadesSidebar.forEach(({ key, label }) => {
                if (feature.properties[key] !== undefined) {
                    const li = document.createElement('li');
                    li.innerHTML = `<b>${label}:</b><br>${feature.properties[key]}`;
                    lista.appendChild(li);
                }
            });

            actualizarFotoEnSidebar(feature.properties.foto);
            M.Sidenav.getInstance(document.getElementById('info-panel')).open();
        }

        // --- CLICK EN MAPA VACÍO ---
        map.on('click', e => {
            document.getElementById('propiedades-list').innerHTML = '';
            actualizarFotoEnSidebar(null);
            document.getElementById('latlon').innerHTML =
                `<strong>Latitud:</strong> ${e.latlng.lat.toFixed(5)}<br>
                 <strong>Longitud:</strong> ${e.latlng.lng.toFixed(5)}`;
            M.Sidenav.getInstance(document.getElementById('info-panel')).open();
        });

        // --- CREAR CLUSTERS ---
        const clusterBocas = L.markerClusterGroup();
        const clusterCentros = L.markerClusterGroup();
        const clusterGazex = L.markerClusterGroup();
        const clusterEstaciones = L.markerClusterGroup();
        const clusterNivex = L.markerClusterGroup();
        const clustervarios = L.markerClusterGroup();
        const clusterPuestoMedico = L.markerClusterGroup();

        function cargarPuntosEnCluster(geojsonData, cluster, icono, propiedadesSidebar) {
            const icon = L.icon({
                iconUrl: icono,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            });

            geojsonData.features.forEach(feature => {
                const [lng, lat] = feature.geometry.coordinates;
                const marker = L.marker([lat, lng], { icon });
                marker.on('click', e => {
                    L.DomEvent.stopPropagation(e);
                    mostrarInfoEnSidebar(feature, propiedadesSidebar);
                });
                cluster.addLayer(marker);
            });
        }

        // --- CARGAR CAPAS PUNTUALES ---
        const capasPuntuales = [
            { url: 'datos/puntual/bocas_tunel.geojson', cluster: clusterBocas, icono: 'iconos/equipamientos/boca_tunel.svg', propiedadesSidebar: [{ key: 'nombre', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }, { key: 'descripcion', label: 'Descripción' }] },
            { url: 'datos/puntual/centros_control.geojson', cluster: clusterCentros, icono: 'iconos/equipamientos/edificacion.svg', propiedadesSidebar: [{ key: 'nombre', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] },
            { url: 'datos/puntual/edificios_varios.geojson', cluster: clustervarios, icono: 'iconos/equipamientos/edificacion.svg', propiedadesSidebar: [{ key: 'nombre', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] },
            { url: 'datos/puntual/gazex.geojson', cluster: clusterGazex, icono: 'iconos/equipamientos_anexos/gazex.svg', propiedadesSidebar: [{ key: 'lugar', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] },
            { url: 'datos/puntual/estaciones_meteorologicas.geojson', cluster: clusterEstaciones, icono: 'iconos/equipamientos_anexos/estaciones_meteorologicas.svg', propiedadesSidebar: [{ key: 'lugar', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] },
            { url: 'datos/puntual/nivex.geojson', cluster: clusterNivex, icono: 'iconos/equipamientos_anexos/nivex.svg', propiedadesSidebar: [{ key: 'lugar', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] },
            { url: 'datos/puntual/puesto_medico.geojson', cluster: clusterPuestoMedico, icono: 'iconos/equipamientos/puesto_medico.svg', propiedadesSidebar: [{ key: 'nombre', label: 'Nombre' }, { key: 'tipo_equip', label: 'Tipo de instalación' }] }
        ];

        // Promesas para cargar todos los datos antes de activar el control de capas
        const promesas = capasPuntuales.map(capa => 
            fetch(capa.url)
                .then(r => r.json())
                .then(data => cargarPuntosEnCluster(data, capa.cluster, capa.icono, capa.propiedadesSidebar))
        );

        // --- CAPA POLIGONAL Y LINEAL ---
        fetch('datos/poligonal/dominio_aect.geojson')
            .then(r => r.json())
            .then(data => {
                L.geoJSON(data, { style: { color: '#8e5938', fillColor: '#d6bba5', fillOpacity: 0.6, weight: 2 } }).addTo(map);
            });

        fetch('datos/lineas.geojson')
            .then(r => r.json())
            .then(data => L.geoJSON(data, { style: { color: '#ff5722', weight: 3 } }).addTo(map));

        // --- ACTIVAR CAPAS SIEMPRE VISIBLES ---
        clusterBocas.addTo(map);

        // --- CONFIGURAR GRUPOS Y CONTROL DE CAPAS ---
        Promise.all(promesas).then(() => {
            const groupedOverlays = {
                "Instalaciones Principales / Installations Principales": {
                    "Centros de control / Centres de contrôle": clusterCentros,
                    "Puesto médico / Poste médical": clusterPuestoMedico,
                    "Otros equipamientos / Diverses équipements": clustervarios
                },
                "Equipamiento de Montaña / Équipement de Montagne": {
                    "Gazex": clusterGazex,
                    "Estaciones meteorológicas / Stations météorologiques": clusterEstaciones,
                    "Nivex / Nivex": clusterNivex
                }
            };

            const options = {
                exclusiveGroups: [],
                groupCheckboxes: false,
                collapsed: false
            };

            L.control.groupedLayers(null, groupedOverlays, options).addTo(map);
        });
    }
});