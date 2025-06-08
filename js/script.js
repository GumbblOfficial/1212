const locations = [
    {coords: [40.4168, -3.7038], name: "Madrid", users: 1, type: "major"},
    {coords: [41.3851, 2.1734], name: "Barcelona", users: 1, type: "minor"}
];

const countryData = {
    'spain': { coords: [40.4168, -3.7038], zoom: 5, cities: [
        {name: 'Barcelona', coords: [41.3851, 2.1734], users: 100},
        {name: 'Madrid', coords: [40.4168, -3.7038], users: 150},
        {name: 'Valencia', coords: [39.4699, -0.3763], users: 40},
        {name: 'Zaragoza', coords: [41.6488, -0.8891], users: 30},
        {name: 'Sevilla', coords: [37.3886, -5.9823], users: 35}
    ]},
    'france': { coords: [46.603354, 1.888334], zoom: 5, cities: [
        {name: 'Paris', coords: [48.8566, 2.3522], users: 120},
        {name: 'Lyon', coords: [45.7640, 4.8357], users: 45},
        {name: 'Marseille', coords: [43.2965, 5.3698], users: 35}
    ]}
};

// Firebase configuration (replace with your Firebase project details)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Initialize map
const map = L.map('map', {
    maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
    maxBoundsViscosity: 1.0,
    minZoom: 2,
    maxZoom: 18
}).setView([40.4168, -3.7038], 5);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    noWrap: true
}).addTo(map);

// Custom marker icons
const majorIcon = L.divIcon({
    html: '<div class="dot-pulse"><div class="dot-pulse"></div></div>',
    className: '',
    iconSize: [15, 15],
    iconAnchor: [7, 7]
});

const minorIcon = L.divIcon({
    html: '<div class="w-3 h-3 rounded-full border-2 border-white bg-red-500 animate-pulse"></div>',
    className: 'shadow-lg',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

function createNumberedMarker(num) {
    return L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs text-white border-2 border-white font-bold shadow-lg">${num}</div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

const markerGroup = L.layerGroup().addTo(map);

// Add sample markers
locations.forEach(loc => {
    let marker;
    if (loc.users > 1) {
        marker = L.marker(loc.coords, {icon: createNumberedMarker(loc.users)})
            .bindPopup(`<div class="font-medium">${loc.name}</div><div>${loc.users} users exploring</div>`);
    } else if (loc.type === "major") {
        marker = L.marker(loc.coords, {icon: majorIcon})
            .bindPopup(`<div class="font-medium">${loc.name}</div><div>${loc.users} ${loc.users === 1 ? 'user' : 'users'} exploring</div>`);
    } else {
        marker = L.marker(loc.coords, {icon: minorIcon})
            .bindPopup(`<div class="font-medium">${loc.name}</div>`);
    }
    marker.addTo(markerGroup);
    marker.on('click', function() {
        document.getElementById('profileModal').classList.remove('hidden');
    });
});

// Add country markers
const countries = [
    {coords: [51.0, 9.0], name: "Germany", users: 27},
    {coords: [46.0, 2.0], name: "France", users: 42},
    {coords: [39.0, -100.0], name: "United States", users: 56},
    {coords: [35.0, 104.0], name: "China", users: 38},
    {coords: [20.0, 77.0], name: "India", users: 45}
];

countries.forEach(country => {
    if (country.users > 10) {
        L.marker(country.coords, {icon: createNumberedMarker(country.users)})
            .bindPopup(`<div class="font-medium text-center">${country.name}</div><div class="text-center">${country.users} users exploring</div>`)
            .addTo(markerGroup);
    }
});

// Map controls
document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
document.getElementById('centerMap').addEventListener('click', () => map.setView([40.4168, -3.7038], 5));

// Search functionality
document.getElementById('searchButton').addEventListener('click', () => performSearch(document.getElementById('searchInput').value));
document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') performSearch(e.target.value);
});

function updateMarkersForView() {
    markerGroup.clearLayers();
    const zoom = map.getZoom();
    const center = map.getCenter();

    if (zoom <= 6) {
        Object.entries(countryData).forEach(([countryName, data]) => {
            if (map.getBounds().contains(data.coords)) {
                L.marker(data.coords, {
                    icon: createNumberedMarker(data.cities.reduce((sum, city) => sum + city.users, 0))
                }).bindPopup(`<div class="font-medium">${countryName.charAt(0).toUpperCase() + countryName.slice(1)}</div>
                              <div>Total users: ${data.cities.reduce((sum, city) => sum + city.users, 0)}</div>`)
                .addTo(markerGroup);
            }
        });
    } else {
        Object.entries(countryData).forEach(([_, data]) => {
            data.cities.forEach(city => {
                if (map.getBounds().contains(city.coords)) {
                    L.marker(city.coords, {
                        icon: createNumberedMarker(city.users)
                    }).bindPopup(`<div class="font-medium">${city.name}</div>
                                  <div>Users: ${city.users}</div>`)
                    .addTo(markerGroup);
                }
            });
        });
    }
}

function performSearch(query) {
    const lowerQuery = query.toLowerCase();
    
    if (countryData[lowerQuery]) {
        const country = countryData[lowerQuery];
        map.setView(country.coords, country.zoom);
        updateMarkersForView();
    } else {
        let found = false;
        Object.entries(countryData).forEach(([_, data]) => {
            data.cities.forEach(city => {
                if (city.name.toLowerCase().includes(lowerQuery)) {
                    map.setView(city.coords, 12);
                    found = true;
                }
            });
        });
        
        if (!found) {
            map.setView([0, 0], 2);
            const marker = L.marker(map.getCenter(), {icon: majorIcon})
                .bindPopup(`<div class="text-center">Location not found: ${query}</div>`)
                .addTo(markerGroup);
            marker.openPopup();
        }
    }
    updateMarkersForView();
}

map.on('moveend', updateMarkersForView);

// Full-screen user view
const userCards = document.querySelectorAll('.user-card');
const sidebar = document.getElementById('sidebar');
const mapContainer = document.getElementById('mapContainer');

userCards.forEach(card => {
    card.addEventListener('click', () => {
        sidebar.classList.add('fixed', 'inset-0', 'z-50', 'bg-white');
        mapContainer.classList.add('hidden');
        const userId = card.getAttribute('data-user-id');
        // Simular carga de datos del usuario (puedes conectar con Firebase aquí)
        const userData = {
            1: {name: "Alex Johnson", location: "Tokyo, Japan", bio: "Digital nomad and UX designer.", image: "https://randomuser.me/api/portraits/men/41.jpg", social: ["twitter", "linkedin", "instagram"]},
            2: {name: "Maria Rodriguez", location: "Madrid, Spain", bio: "Cycling enthusiast and crypto trader.", image: "https://randomuser.me/api/portraits/women/32.jpg", social: ["twitter", "linkedin"]},
            3: {name: "Sam Williams", location: "New York, USA", bio: "Esports player and fashion lover.", image: "https://randomuser.me/api/portraits/men/9.jpg", social: ["github", "linkedin"]}
        };
        
        const user = userData[userId];
        document.getElementById('modalUserName').textContent = user.name;
        document.getElementById('modalUserLocation').textContent = user.location;
        document.getElementById('modalUserBio').textContent = user.bio;
        document.getElementById('modalUserImage').src = user.image;
        
        const socialContainer = document.getElementById('modalUserSocial');
        socialContainer.innerHTML = user.social.map(s => `
            <a href="#" class="w-9 h-9 rounded-full bg-${s === 'twitter' ? 'blue-100' : s === 'linkedin' ? 'blue-600' : s === 'instagram' ? 'pink-500' : 'gray-800'} flex items-center justify-center text-${s === 'twitter' ? 'blue-600' : 'white'} hover:bg-${s === 'twitter' ? 'blue-200' : s === 'linkedin' ? 'blue-700' : s === 'instagram' ? 'pink-600' : 'black'}">
                <i class="fab fa-${s}"></i>
            </a>
        `).join('');
        
        document.getElementById('profileModal').classList.remove('hidden');
    });
});

// Close profile modal
document.getElementById('closeProfile').addEventListener('click', () => {
    document.getElementById('profileModal').classList.add('hidden');
    sidebar.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white');
    mapContainer.classList.remove('hidden');
});

// Authentication
document.getElementById('profileButton').addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('hidden');
});

document.getElementById('closeLogin').addEventListener('click', () => {
    document.getElementById('loginModal').classList.add('hidden');
});

document.getElementById('googleLogin').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            document.getElementById('profileButton').innerHTML = `<i class="fas fa-user-circle mr-2"></i> ${user.displayName}`;
            document.getElementById('loginModal').classList.add('hidden');
        })
        .catch(error => console.error('Google login error:', error));
});

document.getElementById('discordLogin').addEventListener('click', () => {
    const provider = new firebase.auth.OAuthProvider('discord.com');
    auth.signInWithPopup(provider)
        .then(result => {
            const user = result.user;
            document.getElementById('profileButton').innerHTML = `<i class="fas fa-user-circle mr-2"></i> ${user.displayName}`;
            document.getElementById('loginModal').classList.add('hidden');
        })
        .catch(error => console.error('Discord login error:', error));
});

// Update online users count (mock)
setInterval(() => {
    document.getElementById('onlineUsersCount').textContent = `${Math.floor(Math.random() * 100) + 20} users online`;
}, 5000);
