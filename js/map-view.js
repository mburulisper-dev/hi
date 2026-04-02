// ===== MAP VIEW =====
let mapInstance = null;
let mapMarkers = [];
let markerClusterGroup = null;
let defaultZoom = 13;
let nairoobiCenter = [-1.2921, 36.8219]; // Nairobi coordinates

// Initialize map
function initializeMap() {
    const mapContainer = document.getElementById('mapContainer');

    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    // Destroy existing map
    if (mapInstance) {
        mapInstance.remove();
        mapMarkers = [];
    }

    // Create new map
    mapInstance = L.map('mapContainer').setView(nairoobiCenter, defaultZoom);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 10
    }).addTo(mapInstance);

    console.log('Map initialized');
}

// Add apartment markers to map
function addApartmentMarkers(apartmentsList, filtered = false) {
    // Clear existing markers
    mapMarkers.forEach(marker => mapInstance.removeLayer(marker));
    mapMarkers = [];

    if (!apartmentsList || apartmentsList.length === 0) {
        console.warn('No apartments to display on map');
        return;
    }

    const markerColor = filtered ? '#10b981' : '#2563eb';
    let bounds = L.latLngBounds();

    apartmentsList.forEach(apt => {
        // Use geocoded coordinates or estimate from location
        const coords = getApartmentCoordinates(apt);

        if (coords) {
            const marker = L.circleMarker([coords.lat, coords.lng], {
                radius: 8,
                fillColor: markerColor,
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(mapInstance);

            // Create popup content
            const popupContent = createMarkerPopup(apt);
            marker.bindPopup(popupContent);

            // Add click event
            marker.on('click', () => {
                marker.openPopup();
                highlightApartmentCard(apt.id);
            });

            mapMarkers.push(marker);
            bounds.extend([coords.lat, coords.lng]);
        }
    });

    // Fit map to show all markers
    if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Get apartment coordinates (hardcoded Nairobi locations or geocode)
function getApartmentCoordinates(apt) {
    // Location to coordinate mapping (Nairobi areas)
    const locationCoords = {
        'westlands': { lat: -1.2656, lng: 36.8043 },
        'karen': { lat: -1.3095, lng: 36.7298 },
        'lavington': { lat: -1.2829, lng: 36.8011 },
        'kilimani': { lat: -1.2892, lng: 36.7847 },
        'upperhill': { lat: -1.2965, lng: 36.8050 },
        'parklands': { lat: -1.2485, lng: 36.8066 },
        'nyari': { lat: -1.3241, lng: 36.7839 },
        'runda': { lat: -1.2438, lng: 36.8308 },
        'muthaiga': { lat: -1.2336, lng: 36.8411 },
        'spring valley': { lat: -1.3018, lng: 36.7648 },
        'nairobi south': { lat: -1.3500, lng: 36.7800 },
        'nairobi north': { lat: -1.2200, lng: 36.8500 },
        'eastleigh': { lat: -1.2480, lng: 36.8621 },
        'donholm': { lat: -1.2979, lng: 36.8571 },
        'thika': { lat: -1.0333, lng: 36.9667 },
        'kiambu': { lat: -1.1705, lng: 36.8110 }
    };

    const location = (apt.location || '').toLowerCase().trim();

    // Check exact match
    if (locationCoords[location]) {
        return locationCoords[location];
    }

    // Check partial match
    for (let [key, coords] of Object.entries(locationCoords)) {
        if (location.includes(key)) {
            return coords;
        }
    }

    // Add small random offset to default location
    return {
        lat: nairoobiCenter[0] + (Math.random() - 0.5) * 0.05,
        lng: nairoobiCenter[1] + (Math.random() - 0.5) * 0.05
    };
}

// Create popup HTML for markers
function createMarkerPopup(apt) {
    const price = Number(apt.price || 0).toLocaleString();
    return `
        <div class="map-popup">
            <h4>${escapeHtml(apt.title)}</h4>
            <p><i class="ri-map-pin-line"></i> ${escapeHtml(apt.location)}</p>
            <p class="map-popup-price">KSh ${price}/month</p>
            <p><i class="ri-door-lock-line"></i> ${apt.room_type}</p>
            ${apt.amenities && apt.amenities.length > 0 ? `
                <p><strong>Amenities:</strong> ${apt.amenities.slice(0, 2).join(', ')}</p>
            ` : ''}
            <button class="map-popup-btn" onclick="viewApartmentFromMap(${apt.id})">View Details</button>
        </div>
    `;
}

// Highlight apartment card when marker is clicked
function highlightApartmentCard(apartmentId) {
    const cards = document.querySelectorAll('.apartments-grid .card');
    cards.forEach(card => card.classList.remove('highlighted'));

    const card = document.querySelector(`[data-apt-id="${apartmentId}"]`);
    if (card) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Navigate to apartment details from map
function viewApartmentFromMap(id) {
    localStorage.setItem('selectedApartmentId', id);
    window.location.href = 'apartmentdetails.html';
}

// Search location on map
function searchLocationOnMap(searchTerm) {
    if (!searchTerm.trim()) {
        console.warn('Empty search term');
        return;
    }

    // Filter apartments by location
    const filtered = apartments.filter(apt =>
        apt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        showToast('No apartments found in this location', 'info');
        return;
    }

    // Update map with filtered results
    addApartmentMarkers(filtered, true);

    // Update apartments list
    displayMapApartmentsList(filtered);

    showToast(`Found ${filtered.length} apartment${filtered.length !== 1 ? 's' : ''}`, 'success');
}

// Display apartments list below map
function displayMapApartmentsList(apartmentsList) {
    const container = document.getElementById('mapApartmentsList');
    if (!container) return;

    container.innerHTML = '';

    if (apartmentsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🏠</div>
                <h3 class="empty-state-title">No apartments found</h3>
                <p class="empty-state-description">Try searching for a different location</p>
            </div>
        `;
        return;
    }

    apartmentsList.forEach(apt => {
        const card = createApartmentCard(apt, true);
        card.setAttribute('data-apt-id', apt.id);
        container.appendChild(card);
    });
}

// Reset map to default view
function resetMapView() {
    if (!mapInstance) return;

    mapInstance.setView(nairoobiCenter, defaultZoom);
    addApartmentMarkers(apartments, false);
    displayMapApartmentsList(apartments);
    document.getElementById('mapSearchLocation').value = '';

    showToast('Map reset to default view', 'info');
}

// Setup map view event listeners
function setupMapViewListeners() {
    const searchInput = document.getElementById('mapSearchLocation');
    const resetBtn = document.getElementById('mapResetView');

    if (searchInput) {
        // Debounced search
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchLocationOnMap(e.target.value);
            }, 500);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetMapView);
    }
}

// Load map view
function loadMapView() {
    console.log('Loading map view...');

    // Initialize map if not already done
    if (!mapInstance) {
        initializeMap();
    }

    // Add apartment markers
    addApartmentMarkers(apartments, false);

    // Display apartments list
    displayMapApartmentsList(apartments);

    // Setup listeners
    setupMapViewListeners();

    console.log('Map view loaded with', apartments.length, 'apartments');
}