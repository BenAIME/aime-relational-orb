// Add console logging to track execution flow
console.log('Starting application...');

// Add imports at the top of the file
const { CSS2DRenderer, CSS2DObject } = THREE;
const { OrbitControls } = THREE;
// const TWEEN = window.TWEEN;

// At the very top of your file, declare these as global variables
window.toolsAnimation = () => {};
window.tradeRoutesAnimation = () => {};

// Global variables
let scene, camera, renderer, controls;

// Add debug helpers
const addDebugHelpers = () => {
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);

    // Add ambient light helper
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    console.log('Debug helpers added');
};

// Add texture loader
const textureLoader = new THREE.TextureLoader();

// Add world map data loading
let worldMapData = null;

const loadWorldMap = async () => {
    try {
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        worldMapData = await response.json();
        console.log('World map data loaded');
    } catch (error) {
        console.error('Error loading world map:', error);
    }
};

// Fix texture loading with proper fallbacks
const loadWorldTexture = async () => {
    const textureLoader = new THREE.TextureLoader();
    const texturePaths = [
        'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        '/assets/earth_texture.jpg'
    ];

    for (const path of texturePaths) {
        try {
            const texture = await new Promise((resolve, reject) => {
                textureLoader.load(path, resolve, undefined, reject);
            });
            console.log('Successfully loaded texture from:', path);
            return texture;
        } catch (error) {
            console.log('Failed to load texture from:', path);
        }
    }
    
    // If all textures fail, return basic texture
    return createBasicEarthTexture();
};

// Add TWEEN loading check and initialization
let tweenLoaded = false;

const loadTWEEN = async () => {
    if (window.TWEEN) {
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';
        script.onload = () => {
            console.log('TWEEN loaded');
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// Wait for DOM and initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    try {
        await loadTWEEN();
        await initBasicScene();
    } catch (error) {
        console.error('Failed to load dependencies:', error);
    }
});

// Updated texture options with only working sources
const EARTH_TEXTURES = [
    {
        name: 'Blue Marble',
        url: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg'
    },
    {
        name: 'Natural Earth',
        url: 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg'
    },
    {
        name: 'Dark Earth',
        url: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg'
    },
    {
        name: 'Night Lights',
        url: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg'
    },
    {
        name: 'Day/Night',
        url: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg'
    }
];

// Add texture selector UI
const createTextureSelector = () => {
    const selector = document.createElement('div');
    selector.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
    `;
    
    const label = document.createElement('div');
    label.textContent = 'Earth Texture:';
    label.style.marginBottom = '5px';
    selector.appendChild(label);
    
    const select = document.createElement('select');
    select.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 5px;
        border-radius: 3px;
        width: 150px;
    `;
    
    EARTH_TEXTURES.forEach((texture, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = texture.name;
        select.appendChild(option);
    });
    
    selector.appendChild(select);
    document.body.appendChild(selector);
    
    return select;
};

// Update embassy data with sustainability focus
const MAJOR_CITIES = [
    // Europe
    { name: 'London', lat: 51.5074, lon: -0.1278, type: 'Major', region: 'Europe', focus: 'Green Finance & Sustainable Banking' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, type: 'Major', region: 'Europe', focus: 'Climate Policy & Urban Sustainability' },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050, type: 'Major', region: 'Europe', focus: 'Renewable Energy Technology' },
    { name: 'Rome', lat: 41.9028, lon: 12.4964, type: 'Major', region: 'Europe', focus: 'Cultural Heritage Preservation' },
    { name: 'Madrid', lat: 40.4168, lon: -3.7038, type: 'Major', region: 'Europe', focus: 'Solar Energy Development' },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, type: 'Major', region: 'Europe', focus: 'Arctic Environmental Protection' },
    
    // Asia
    { name: 'Beijing', lat: 39.9042, lon: 116.4074, type: 'Major', region: 'Asia', focus: 'Air Quality & Clean Technology' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, type: 'Major', region: 'Asia', focus: 'Smart City Innovation' },
    { name: 'Seoul', lat: 37.5665, lon: 126.9780, type: 'Major', region: 'Asia', focus: 'Digital Sustainability Solutions' },
    { name: 'Delhi', lat: 28.6139, lon: 77.2090, type: 'Major', region: 'Asia', focus: 'Sustainable Agriculture' },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, type: 'Major', region: 'Asia', focus: 'Coastal Ecosystem Protection' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, type: 'Major', region: 'Asia', focus: 'Urban Biodiversity' },
    
    // Oceania
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, type: 'Major', region: 'Oceania', focus: 'Marine Conservation' },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631, type: 'Major', region: 'Oceania', focus: 'Sustainable Urban Planning' },
    
    // Africa
    { name: 'Cairo', lat: 30.0444, lon: 31.2357, type: 'Major', region: 'Africa', focus: 'Water Resource Management' },
    { name: 'Lagos', lat: 6.5244, lon: 3.3792, type: 'Major', region: 'Africa', focus: 'Clean Energy Access' },
    { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, type: 'Major', region: 'Africa', focus: 'Sustainable Mining Practices' },
    
    // Americas
    { name: 'New York', lat: 40.7128, lon: -74.0060, type: 'Major', region: 'North America', focus: 'Sustainable Finance Innovation' },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, type: 'Major', region: 'North America', focus: 'Clean Transportation' },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298, type: 'Major', region: 'North America', focus: 'Green Architecture' },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832, type: 'Major', region: 'North America', focus: 'Climate Resilience' },
    { name: 'Mexico City', lat: 19.4326, lon: -99.1332, type: 'Major', region: 'North America', focus: 'Urban Air Quality' },
    { name: 'São Paulo', lat: -23.5505, lon: -46.6333, type: 'Major', region: 'South America', focus: 'Rainforest Conservation' },
    { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, type: 'Major', region: 'South America', focus: 'Sustainable Tourism' },
    
    // New additions (25 more)
    { name: 'Stockholm', lat: 59.3293, lon: 18.0686, type: 'Secondary', region: 'Europe' },
    { name: 'Vienna', lat: 48.2082, lon: 16.3738, type: 'Secondary', region: 'Europe' },
    { name: 'Warsaw', lat: 52.2297, lon: 21.0122, type: 'Secondary', region: 'Europe' },
    { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, type: 'Secondary', region: 'Europe' },
    { name: 'Brussels', lat: 50.8503, lon: 4.3517, type: 'Secondary', region: 'Europe' },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, type: 'Secondary', region: 'Asia' },
    { name: 'Jakarta', lat: -6.2088, lon: 106.8456, type: 'Secondary', region: 'Asia' },
    { name: 'Manila', lat: 14.5995, lon: 120.9842, type: 'Secondary', region: 'Asia' },
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, type: 'Secondary', region: 'Asia' },
    { name: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, type: 'Secondary', region: 'Asia' },
    { name: 'Tel Aviv', lat: 32.0853, lon: 34.7818, type: 'Secondary', region: 'Middle East' },
    { name: 'Riyadh', lat: 24.7136, lon: 46.6753, type: 'Secondary', region: 'Middle East' },
    { name: 'Istanbul', lat: 41.0082, lon: 28.9784, type: 'Secondary', region: 'Middle East' },
    { name: 'Auckland', lat: -36.8485, lon: 174.7633, type: 'Secondary', region: 'Oceania' },
    { name: 'Wellington', lat: -41.2866, lon: 174.7756, type: 'Secondary', region: 'Oceania' },
    { name: 'Nairobi', lat: -1.2921, lon: 36.8219, type: 'Secondary', region: 'Africa' },
    { name: 'Casablanca', lat: 33.5731, lon: -7.5898, type: 'Secondary', region: 'Africa' },
    { name: 'Cape Town', lat: -33.9249, lon: 18.4241, type: 'Secondary', region: 'Africa' },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207, type: 'Secondary', region: 'North America' },
    { name: 'Montreal', lat: 45.5017, lon: -73.5673, type: 'Secondary', region: 'North America' },
    { name: 'Houston', lat: 29.7604, lon: -95.3698, type: 'Secondary', region: 'North America' },
    { name: 'Miami', lat: 25.7617, lon: -80.1918, type: 'Secondary', region: 'North America' },
    { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, type: 'Secondary', region: 'South America' },
    { name: 'Lima', lat: -12.0464, lon: -77.0428, type: 'Secondary', region: 'South America' },
    { name: 'Santiago', lat: -33.4489, lon: -70.6693, type: 'Secondary', region: 'South America' }
];

// Updated Earth Shots data with comprehensive locations
const EARTH_SHOTS = [
    // Renewable Energy Projects
    { name: 'Sahara Solar Farm', lat: 23.4162, lon: 25.6628, type: 'Energy', focus: 'Large-scale Solar Power Generation' },
    { name: 'North Sea Wind Farm', lat: 55.9533, lon: 3.2014, type: 'Energy', focus: 'Offshore Wind Energy Development' },
    { name: 'Iceland Geothermal', lat: 64.9631, lon: -19.0208, type: 'Energy', focus: 'Geothermal Energy Innovation' },
    { name: 'Australian Solar Belt', lat: -23.7041, lon: 133.8751, type: 'Energy', focus: 'Desert Solar Implementation' },
    { name: 'Morocco Solar Complex', lat: 31.0451, lon: -4.0000, type: 'Energy', focus: 'Concentrated Solar Power' },
    { name: 'Chilean Atacama Solar', lat: -24.5000, lon: -69.2500, type: 'Energy', focus: 'High-Altitude Solar Energy' },
    
    // Forest Conservation
    { name: 'Amazon Rainforest', lat: -3.4653, lon: -62.2159, type: 'Forest', focus: 'Primary Rainforest Protection' },
    { name: 'Congo Basin', lat: -0.7893, lon: 21.0936, type: 'Forest', focus: 'Tropical Forest Conservation' },
    { name: 'Borneo Rainforest', lat: 0.9619, lon: 114.5548, type: 'Forest', focus: 'Orangutan Habitat Protection' },
    { name: 'Siberian Taiga', lat: 60.0000, lon: 100.0000, type: 'Forest', focus: 'Boreal Forest Preservation' },
    { name: 'Canadian Boreal', lat: 55.0000, lon: -115.0000, type: 'Forest', focus: 'Northern Forest Conservation' },
    { name: 'Madagascar Forest', lat: -18.7669, lon: 46.8691, type: 'Forest', focus: 'Unique Biodiversity Protection' },
    
    // Ocean Protection
    { name: 'Great Barrier Reef', lat: -18.2871, lon: 147.6992, type: 'Ocean', focus: 'Coral Reef Restoration' },
    { name: 'Galapagos Marine Reserve', lat: -0.9538, lon: -90.9656, type: 'Ocean', focus: 'Marine Biodiversity' },
    { name: 'Mediterranean Sea', lat: 35.9375, lon: 14.3754, type: 'Ocean', focus: 'Marine Conservation' },
    { name: 'Pacific Coral Triangle', lat: -2.0000, lon: 125.0000, type: 'Ocean', focus: 'Marine Ecosystem Protection' },
    { name: 'Arctic Ocean', lat: 78.0000, lon: -155.0000, type: 'Ocean', focus: 'Polar Marine Protection' },
    { name: 'Caribbean Reef System', lat: 17.2707, lon: -87.5351, type: 'Ocean', focus: 'Coral Restoration' },
    
    // Sustainable Agriculture
    { name: 'Brazilian Cerrado', lat: -15.7801, lon: -47.9292, type: 'Agriculture', focus: 'Sustainable Farming' },
    { name: 'Indian Punjab', lat: 31.1471, lon: 75.3412, type: 'Agriculture', focus: 'Water-Efficient Farming' },
    { name: 'Netherlands Greenhouses', lat: 52.1326, lon: 4.5709, type: 'Agriculture', focus: 'Vertical Farming Innovation' },
    { name: 'Kenya Highland Farms', lat: 0.5200, lon: 37.2700, type: 'Agriculture', focus: 'Climate-Smart Agriculture' },
    { name: 'Vietnam Mekong Delta', lat: 10.0634, lon: 105.9000, type: 'Agriculture', focus: 'Sustainable Rice Production' },
    { name: 'USA Midwest', lat: 41.5000, lon: -93.0000, type: 'Agriculture', focus: 'Regenerative Agriculture' },
    
    // Water Management
    { name: 'Nile Delta', lat: 30.0444, lon: 31.2357, type: 'Water', focus: 'River Delta Conservation' },
    { name: 'Ganges River', lat: 25.3176, lon: 82.9739, type: 'Water', focus: 'River Cleanup & Protection' },
    { name: 'Great Lakes', lat: 44.7866, lon: -87.3972, type: 'Water', focus: 'Freshwater Conservation' },
    { name: 'Murray-Darling Basin', lat: -34.9285, lon: 142.2871, type: 'Water', focus: 'Water Resource Management' },
    { name: 'Lake Victoria', lat: -1.2921, lon: 36.8219, type: 'Water', focus: 'Freshwater Ecosystem' },
    { name: 'Yangtze River', lat: 30.7000, lon: 111.0000, type: 'Water', focus: 'River Basin Management' },
    
    // Wildlife Conservation
    { name: 'Serengeti', lat: -2.3333, lon: 34.8333, type: 'Wildlife', focus: 'African Wildlife Protection' },
    { name: 'Yellowstone', lat: 44.4280, lon: -110.5885, type: 'Wildlife', focus: 'Ecosystem Preservation' },
    { name: 'Arctic National Wildlife', lat: 70.0000, lon: -143.0000, type: 'Wildlife', focus: 'Polar Species Protection' },
    { name: 'Great Himalayan', lat: 32.2500, lon: 77.7500, type: 'Wildlife', focus: 'Mountain Wildlife Conservation' },
    { name: 'Pantanal Wetlands', lat: -17.0000, lon: -57.0000, type: 'Wildlife', focus: 'Wetland Species Protection' },
    { name: 'Australian Outback', lat: -25.0000, lon: 130.0000, type: 'Wildlife', focus: 'Desert Wildlife Conservation' }
];

// Tools data structure with categories
const TOOLS = {
    education: [
        {
            name: 'MentorClass',
            focus: 'A global teacher training program to build mentoring into schools',
            category: 'education',
            type: 'platform'
        },
        {
            name: 'IMAGI-NATION {Uni}',
            focus: 'Free university with puppet professors focused on creating a fairer world',
            category: 'education',
            type: 'platform'
        },
        {
            name: 'Custodian Workshop',
            focus: 'Experiential learning program connecting students to nature and Indigenous knowledge',
            category: 'education',
            type: 'program'
        }
    ],
    media: [
        {
            name: 'IMAGI-NATION {TV}',
            focus: 'Live streaming platform connecting unlikely voices across borders',
            category: 'media',
            type: 'platform'
        },
        {
            name: 'IMAGINE: The Feature Film',
            focus: 'A film about imagination and unlikely connections (in development)',
            category: 'media',
            type: 'project'
        }
    ],
    digital: [
        {
            name: 'The Knowledge Tree',
            focus: 'Digital platform for sharing and storing collective intelligence',
            category: 'digital',
            type: 'platform'
        },
        {
            name: 'IMAGI-NATION Digital Platform',
            focus: 'A 10-year digital nation connecting people across borders to solve global challenges',
            category: 'digital',
            type: 'platform'
        }
    ],
    cultural: [
        {
            name: 'Hoodie Exchange',
            focus: 'System using hoodies as tokens of exchange for time, knowledge and opportunities',
            category: 'cultural',
            type: 'program'
        },
        {
            name: '1000 Year Dream Embassy',
            focus: 'Mobile installation collecting dreams from schools for a future exhibition and film',
            category: 'cultural',
            type: 'installation'
        }
    ]
};

// Helper function to get all tools as a flat array
const getAllTools = () => {
    return Object.values(TOOLS).flat();
};

// Add helper function to convert lat/lon to 3D position
const latLonToVector3 = (lat, lon, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
};

// Add function to create embassy markers
const createEmbassyMarkers = (scene, radius = 102) => {
    const markersGroup = new THREE.Group();
    
    MAJOR_CITIES.forEach(city => {
        const markerGeometry = new THREE.SphereGeometry(1, 16, 16);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: 0xff3333,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLonToVector3(city.lat, city.lon, radius);
        marker.position.copy(position);
        
        // Add hover effect
        marker.userData.originalScale = marker.scale.clone();
        marker.userData.hovered = false;
        
        // Add to raycaster targets
        if (!window.raycasterTargets) {
            window.raycasterTargets = [];
        }
        window.raycasterTargets.push(marker);
        
        markersGroup.add(marker);
    });
    
    return markersGroup;
};

// Add mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(window.raycasterTargets || []);
    
    window.raycasterTargets.forEach(target => {
        if (target.userData.hovered) {
            new TWEEN.Tween(target.scale)
                .to(target.userData.originalScale, 200)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start();
            target.userData.hovered = false;
        }
    });
    
    if (intersects.length > 0) {
        const target = intersects[0].object;
        new TWEEN.Tween(target.scale)
            .to({
                x: target.userData.originalScale.x * 2,
                y: target.userData.originalScale.y * 2,
                z: target.userData.originalScale.z * 2
            }, 200)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        target.userData.hovered = true;
    }
});

// Add function to create Earth Shot markers
const createEarthShotMarkers = (scene, radius = 102) => {
    const earthShotsGroup = new THREE.Group();
    
    EARTH_SHOTS.forEach(shot => {
        // Create cube geometry for Earth Shots
        const markerGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const markerMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const position = latLonToVector3(shot.lat, shot.lon, radius);
        marker.position.copy(position);
        
        // Rotate cube to face outward
        marker.lookAt(new THREE.Vector3(0, 0, 0));
        marker.rotateX(Math.PI / 2);
        
        // Set Earth Shot data
        marker.userData.earthShot = {
            name: shot.name,
            type: shot.type,
            focus: shot.focus
        };
        
        earthShotsGroup.add(marker);
        
        // Add pulsing effect (green)
        const pulse = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.2
            })
        );
        pulse.position.copy(position);
        pulse.lookAt(new THREE.Vector3(0, 0, 0));
        pulse.rotateX(Math.PI / 2);
        earthShotsGroup.add(pulse);
        
        // Animate pulse
        const scalePulse = () => {
            pulse.scale.set(1, 1, 1);
            new TWEEN.Tween(pulse.scale)
                .to({ x: 2, y: 2, z: 2 }, 2000)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
                .onComplete(() => {
                    new TWEEN.Tween(pulse.scale)
                        .to({ x: 1, y: 1, z: 1 }, 0)
                        .start()
                        .onComplete(scalePulse);
                });
        };
        scalePulse();
    });
    
    scene.add(earthShotsGroup);
    return earthShotsGroup;
};

// Update createTools function with animation
const createTools = (scene, radius = 150) => {
    const toolsGroup = new THREE.Group();
    const tools = getAllTools();
    
    // Create geometry for all tools
    const tetrahedronGeometry = new THREE.TetrahedronGeometry(2);
    
    tools.forEach((tool, index) => {
        const material = new THREE.MeshPhongMaterial({
            color: getToolColor(tool.category),
            emissive: getToolEmissiveColor(tool.category),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        
        const mesh = new THREE.Mesh(tetrahedronGeometry, material);
        
        // Calculate position on different orbital rings based on category
        const categoryIndex = Object.keys(TOOLS).indexOf(tool.category);
        const ringRadius = radius - (categoryIndex * 15);
        const ringOffset = (index / tools.length) * Math.PI * 2;
        
        mesh.userData = {
            tool: tool,
            orbit: {
                radius: ringRadius,
                speed: 0.002 + (Math.random() * 0.003),
                angle: ringOffset,
                verticalOffset: (Math.random() - 0.5) * 30,
                rotationSpeed: {
                    x: 0.02 + (Math.random() * 0.02),
                    y: 0.02 + (Math.random() * 0.02),
                    z: 0.02 + (Math.random() * 0.02)
                }
            }
        };
        
        toolsGroup.add(mesh);
    });
    
    // Animation function for tools
    const animateTools = () => {
        toolsGroup.children.forEach((tool) => {
            const orbit = tool.userData.orbit;
            
            // Update angle
            orbit.angle += orbit.speed;
            
            // Calculate new position
            tool.position.x = Math.cos(orbit.angle) * orbit.radius;
            tool.position.z = Math.sin(orbit.angle) * orbit.radius;
            tool.position.y = orbit.verticalOffset;
            
            // Rotate tool
            tool.rotation.x += orbit.rotationSpeed.x;
            tool.rotation.y += orbit.rotationSpeed.y;
            tool.rotation.z += orbit.rotationSpeed.z;
        });
    };
    
    // Add to animation loop
    if (!window.animationFunctions) {
        window.animationFunctions = [];
    }
    window.animationFunctions.push(animateTools);
    
    scene.add(toolsGroup);
    return toolsGroup;
};

// Helper function to get tool colors based on category
const getToolColor = (category) => {
    const colors = {
        education: 0x4287f5,
        media: 0xf542aa,
        digital: 0x42f5b9,
        cultural: 0xf5d442
    };
    return colors[category] || 0x0088ff;
};

// Helper function to get tool emissive colors
const getToolEmissiveColor = (category) => {
    const colors = {
        education: 0x2155a8,
        media: 0xa8215f,
        digital: 0x21a87c,
        cultural: 0xa89221
    };
    return colors[category] || 0x0044aa;
};

// Update the animation system
function animate() {
    requestAnimationFrame(animate);
    
    // Run all animation functions
    if (window.animationFunctions) {
        window.animationFunctions.forEach(fn => fn());
    }
    
    if (window.TWEEN) {
        TWEEN.update();
    }
    
    if (controls) {
        controls.update();
    }
    
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Make sure animate is called
window.addEventListener('DOMContentLoaded', () => {
    animate();
});

// Basic scene with textured globe
const initBasicScene = async () => {
    console.log('1. Starting basic scene init');
    
    if (!window.THREE) {
        console.error('THREE not loaded!');
        return;
    }
    
    try {
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            1,
            2000
        );
        camera.position.z = 300;
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Setup container
        const container = document.getElementById('container');
        if (!container) {
            throw new Error('Container element not found');
        }
        container.appendChild(renderer.domElement);
        
        // Create controls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 150;
        controls.maxDistance = 500;
        
        // Create globe and add to scene
        console.log('Basic globe added, loading texture...');
        const globe = await createGlobe();
        scene.add(globe);
        
        // Add atmosphere
        const atmosphere = createAtmosphere();
        scene.add(atmosphere);
        console.log('Atmosphere added');
        
        // Add lat/lon grid
        const grid = createLatLonGrid();
        scene.add(grid);
        console.log('Lat/lon grid added');
        
        // Add markers
        const embassyMarkers = createEmbassyMarkers(scene);
        const earthShotMarkers = createEarthShotMarkers(scene);
        const tools = createTools(scene);
        
        // Create tooltip
        const tooltip = createTooltip();
        addTooltipInteraction(scene, camera, tooltip);
        
        // Wait a short moment for everything to initialize
        setTimeout(() => {
            // Add 2D map overlay
            create2DMapOverlay();
            console.log('Map overlay added');
        }, 1000);
        
        // Start animation
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        createNavigationMenu();
        createSidePanel();
        
        const flightPaths = createFlightPaths(scene);
        animateFlightPaths(flightPaths);
        
        window.flightPaths = flightPaths;
        window.toolsGroup = tools;
        window.earthShots = earthShotMarkers;
        window.embassies = embassyMarkers;
        window.gridLines = grid;
        
        createControlPanel();
        
        createTableButton();
        
        // Add this after scene creation
        const atmosphereEffect = () => {
            const atmosphere = new THREE.Mesh(
                new THREE.SphereGeometry(102.5, 50, 50),
                new THREE.ShaderMaterial({
                    vertexShader: `
                        varying vec3 vNormal;
                        void main() {
                            vNormal = normalize(normalMatrix * normal);
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        varying vec3 vNormal;
                        void main() {
                            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                            gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
                        }
                    `,
                    blending: THREE.AdditiveBlending,
                    side: THREE.BackSide
                })
            );
            scene.add(atmosphere);
        };
        
        addShootingStars();
        
        createGRPButton();
        
    } catch (error) {
        console.error('Scene initialization failed:', error);
        console.error({
            message: error.message,
            stack: error.stack
        });
    }
};

// Create a basic earth texture programmatically
const createBasicEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Create a basic gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#4287f5');    // Ocean blue
    gradient.addColorStop(0.5, '#3ca55c');  // Land green
    gradient.addColorStop(1, '#4287f5');    // Ocean blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
};

// Update createGlobe to handle texture loading more gracefully
const createGlobe = async () => {
    try {
        const worldTexture = await loadWorldTexture();
        
        // Configure texture properly
        worldTexture.wrapS = THREE.ClampToEdgeWrapping;
        worldTexture.wrapT = THREE.ClampToEdgeWrapping;
        worldTexture.minFilter = THREE.LinearFilter;
        worldTexture.magFilter = THREE.LinearFilter;
        worldTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        
        const geometry = new THREE.SphereGeometry(100, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            map: worldTexture,
            bumpScale: 0.005,
            specular: new THREE.Color('grey'),
            shininess: 5,
            transparent: true,
            opacity: 0.9
        });

        const globe = new THREE.Mesh(geometry, material);
        
        // Simplified lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 3, 5);
        scene.add(directionalLight);

        return globe;
    } catch (error) {
        console.error('Error creating globe:', error);
        return createBasicGlobe();
    }
};

// Add a basic fallback globe
const createBasicGlobe = () => {
    console.warn('Creating basic fallback globe');
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
        transparent: true,
        opacity: 0.9,
        shininess: 25
    });
    return new THREE.Mesh(geometry, material);
};

// Fix grid creation with proper geometry handling
const createLatLonGrid = () => {
    const material = new THREE.LineBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.3
    });
    
    const radius = 101;
    const segments = 36;
    const lines = new THREE.Group();
    
    // Create latitude lines
    for (let i = 0; i < segments; i++) {
        const lat = (i / segments) * Math.PI;
        const points = [];
        for (let j = 0; j <= segments; j++) {
            const lon = (j / segments) * Math.PI * 2;
            points.push(
                Math.sin(lat) * Math.cos(lon) * radius,
                Math.cos(lat) * radius,
                Math.sin(lat) * Math.sin(lon) * radius
            );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        lines.add(new THREE.Line(geometry, material));
    }
    
    // Create longitude lines
    for (let i = 0; i < segments; i++) {
        const lon = (i / segments) * Math.PI * 2;
        const points = [];
        for (let j = 0; j <= segments; j++) {
            const lat = (j / segments) * Math.PI;
            points.push(
                Math.sin(lat) * Math.cos(lon) * radius,
                Math.cos(lat) * radius,
                Math.sin(lat) * Math.sin(lon) * radius
            );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        lines.add(new THREE.Line(geometry, material));
    }
    
    return lines;
};

// Create atmosphere effect
const createAtmosphere = () => {
    const geometry = new THREE.SphereGeometry(102, 64, 64);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {},
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
    });
    return new THREE.Mesh(geometry, material);
};

// Add tooltip container to DOM
const createTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.className = 'embassy-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px;
        border-radius: 6px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        pointer-events: none;
        display: none;
        z-index: 1000;
        max-width: 250px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    document.body.appendChild(tooltip);
    return tooltip;
};

// Update tooltip interaction to handle tools
const addTooltipInteraction = (scene, camera, tooltip) => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Find all interactive groups
        const embassyGroup = scene.children.find(child => 
            child.isGroup && child.children.some(c => c.userData && c.userData.embassy)
        );
        const earthShotGroup = scene.children.find(child => 
            child.isGroup && child.children.some(c => c.userData && c.userData.earthShot)
        );
        const toolsGroup = scene.children.find(child => 
            child.isGroup && child.children.some(c => c.userData && c.userData.tool)
        );
        
        let intersectedObject = null;
        let intersectType = '';
        
        // Check all types of intersections
        [
            { group: toolsGroup, type: 'tool' },
            { group: earthShotGroup, type: 'earthShot' },
            { group: embassyGroup, type: 'embassy' }
        ].forEach(({ group, type }) => {
            if (!intersectedObject && group) {
                const meshes = group.children.filter(child => 
                    child.userData && child.userData[type]
                );
                const intersects = raycaster.intersectObjects(meshes);
                if (intersects.length > 0) {
                    intersectedObject = intersects[0].object;
                    intersectType = type;
                }
            }
        });
        
        // Update cursor and tooltip
        document.body.style.cursor = intersectedObject ? 'pointer' : 'default';
        
        if (intersectedObject) {
            const data = intersectedObject.userData[intersectType];
            const color = {
                tool: '#99ccff',
                earthShot: '#99ff99',
                embassy: '#ff9999'
            }[intersectType];
            
            tooltip.style.display = 'block';
            tooltip.style.left = event.clientX + 15 + 'px';
            tooltip.style.top = event.clientY + 15 + 'px';
            tooltip.style.background = {
                tool: 'rgba(0, 30, 60, 0.8)',
                earthShot: 'rgba(0, 50, 0, 0.8)',
                embassy: 'rgba(0, 0, 0, 0.8)'
            }[intersectType];
            
            tooltip.innerHTML = `
                <strong>${data.name}</strong><br>
                <span style="color: ${color};">Focus:</span><br>
                ${data.focus}
            `;
            
            intersectedObject.material.emissiveIntensity = 1.0;
        } else {
            tooltip.style.display = 'none';
            
            // Reset all object highlights
            [embassyGroup, earthShotGroup, toolsGroup].forEach(group => {
                if (group) {
                    group.children.forEach(child => {
                        if (child.material && child.material.emissiveIntensity !== undefined) {
                            child.material.emissiveIntensity = 0.5;
                        }
                    });
                }
            });
        }
    });
};

// Add 2D map overlay
const create2DMapOverlay = () => {
    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 300px;
        height: 150px;
        background: rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    `;

    const mapCanvas = document.createElement('canvas');
    mapCanvas.style.cssText = `
        width: 100%;
        height: 100%;
        cursor: pointer;
    `;
    mapContainer.appendChild(mapCanvas);
    document.body.appendChild(mapContainer);

    const ctx = mapCanvas.getContext('2d');
    const img = new Image();
    img.src = 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg';
    
    img.onload = () => {
        mapCanvas.width = mapContainer.clientWidth;
        mapCanvas.height = mapContainer.clientHeight;
        
        const drawMap = () => {
            ctx.drawImage(img, 0, 0, mapCanvas.width, mapCanvas.height);
            
            // Draw embassy locations
            if (MAJOR_CITIES) {
                MAJOR_CITIES.forEach(city => {
                    const x = (city.lon + 180) * (mapCanvas.width / 360);
                    const y = (90 - city.lat) * (mapCanvas.height / 180);
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#ff3333';
                    ctx.fill();
                });
            }
            
            // Draw Earth Shot locations
            if (EARTH_SHOTS) {
                EARTH_SHOTS.forEach(shot => {
                    const x = (shot.lon + 180) * (mapCanvas.width / 360);
                    const y = (90 - shot.lat) * (mapCanvas.height / 180);
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#33ff33';
                    ctx.fill();
                });
            }
            
            // Draw camera position
            if (camera) {
                const cameraLatLon = vector3ToLatLon(camera.position);
                const camX = (cameraLatLon.lon + 180) * (mapCanvas.width / 360);
                const camY = (90 - cameraLatLon.lat) * (mapCanvas.height / 180);
                ctx.beginPath();
                ctx.arc(camX, camY, 4, 0, Math.PI * 2);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };
        
        drawMap();
        
        // Add click handler
        mapCanvas.addEventListener('click', (event) => {
            const rect = mapCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            // Convert click coordinates to lat/lon
            const lon = (x / mapCanvas.width * 360) - 180;
            const lat = 90 - (y / mapCanvas.height * 180);
            
            // Convert lat/lon to 3D position
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            
            const targetPosition = new THREE.Vector3(
                -Math.sin(phi) * Math.cos(theta) * 300,
                Math.cos(phi) * 300,
                Math.sin(phi) * Math.sin(theta) * 300
            );
            
            // Animate camera movement
            new TWEEN.Tween(camera.position)
                .to(targetPosition, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
                
            // Update controls target to look at globe center
            new TWEEN.Tween(controls.target)
                .to(new THREE.Vector3(0, 0, 0), 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
        });
        
        // Add to animation loop to update camera position indicator
        if (!window.animationFunctions) {
            window.animationFunctions = [];
        }
        window.animationFunctions.push(drawMap);
    };

    return mapContainer;
};

// Helper function to convert Vector3 to lat/lon
const vector3ToLatLon = (position) => {
    const r = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    const lat = 90 - (Math.acos(position.y / r) * 180 / Math.PI);
    const lon = (Math.atan2(position.z, position.x) * 180 / Math.PI);
    return { lat, lon };
};

// Remove all other functions and complexity
window.addEventListener('load', () => {
    console.log('Window loaded');
});

// Log any errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Log any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Add favicon to prevent 404
const addFavicon = () => {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = 'data:,'; // Empty favicon
    document.head.appendChild(link);
};

// Call favicon addition when window loads
window.addEventListener('load', () => {
    addFavicon();
});

// Add menu system
const createNavigationMenu = () => {
    const menuContainer = document.createElement('div');
    menuContainer.setAttribute('data-menu-container', '');
    menuContainer.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px 20px;
        border-radius: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;

    // Track currently active menu item
    let activeItem = null;

    const menuItems = [
        {
            name: 'Embassies',
            color: '#ff9999',
            hoverColor: '#ffcccc',
            description: 'Global network of imagination embassies'
        },
        {
            name: 'Tools',
            color: '#99ccff',
            hoverColor: '#cce6ff',
            description: 'Programs and platforms for change'
        },
        {
            name: 'Earth Shots',
            color: '#99ff99',
            hoverColor: '#ccffcc',
            description: 'Environmental innovation projects'
        }
    ];

    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            color: ${item.color};
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 20px;
            transition: all 0.3s ease;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        menuItem.textContent = item.name;

        // Info panel that appears on hover
        const infoPanel = document.createElement('div');
        infoPanel.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            width: 200px;
            display: none;
            color: white;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            border: 1px solid ${item.color}40;
        `;
        infoPanel.textContent = item.description;
        menuItem.appendChild(infoPanel);

        // Hover effects
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.backgroundColor = `${item.color}20`;
            infoPanel.style.display = 'block';
        });

        menuItem.addEventListener('mouseleave', () => {
            if (activeItem !== item.name) {
                menuItem.style.backgroundColor = 'transparent';
            }
            infoPanel.style.display = 'none';
        });

        // Updated click handler with toggle functionality
        menuItem.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent document click from triggering
            const sidePanel = document.getElementById('sidePanel');
            
            if (activeItem === item.name) {
                // Clicking the same item again - close panel and remove highlight
                sidePanel.style.display = 'none';
                menuItem.style.backgroundColor = 'transparent';
                activeItem = null;
            } else {
                // New item clicked - update active state and show panel
                if (activeItem) {
                    // Remove highlight from previous active item
                    menuItems.forEach(mi => {
                        const el = menuContainer.querySelector(`[data-menu-item="${mi.name}"]`);
                        if (el) el.style.backgroundColor = 'transparent';
                    });
                }
                
                activeItem = item.name;
                menuItem.style.backgroundColor = `${item.color}20`;
                
                // Focus camera and show panel
                switch(item.name) {
                    case 'Embassies':
                        focusOnEmbassies();
                        break;
                    case 'Tools':
                        focusOnTools();
                        break;
                    case 'Earth Shots':
                        focusOnEarthShots();
                        break;
                }
            }
        });

        menuItem.setAttribute('data-menu-item', item.name);
        menuContainer.appendChild(menuItem);
    });

    document.body.appendChild(menuContainer);
};

// Helper functions to focus on different elements
const focusOnEmbassies = () => {
    if (!camera || !controls) return;
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 100, z: 300 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    showSidePanel('Embassies', MAJOR_CITIES);
};

const focusOnTools = () => {
    if (!camera || !controls) return;
    new TWEEN.Tween(camera.position)
        .to({ x: 300, y: 100, z: 0 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    showSidePanel('Tools', getAllTools());
};

const focusOnEarthShots = () => {
    if (!camera || !controls) return;
    new TWEEN.Tween(camera.position)
        .to({ x: 0, y: 100, z: -300 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .start();
    showSidePanel('Earth Shots', EARTH_SHOTS);
};

// Create side panel for detailed information
const createSidePanel = () => {
    const panel = document.createElement('div');
    panel.id = 'sidePanel';
    panel.style.cssText = `
        position: absolute;
        top: 80px;
        right: 20px;
        width: 300px;
        max-height: 70vh;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 10px;
        padding: 20px;
        color: white;
        font-family: Arial, sans-serif;
        display: none;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
        transition: all 0.3s ease;
    `;
    document.body.appendChild(panel);
    return panel;
};

// Update menu click handlers to show relevant information
const showSidePanel = (type, items) => {
    const panel = document.getElementById('sidePanel');
    panel.style.display = 'block';
    
    // Prevent clicks inside panel from closing it
    panel.addEventListener('click', (event) => {
        event.stopPropagation();
    });
    
    const colors = {
        Embassies: '#ff9999',
        Tools: '#99ccff',
        'Earth Shots': '#99ff99'
    };
    
    let content = `
        <h2 style="
            color: ${colors[type]};
            margin: 0 0 15px 0;
            font-size: 18px;
            border-bottom: 1px solid ${colors[type]}40;
            padding-bottom: 10px;
        ">${type}</h2>
    `;
    
    switch(type) {
        case 'Tools':
            content += getAllTools().map(tool => `
                <div class="item" style="
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'"
                   onclick="showToolDetails('${tool.name}')">
                    <h3 style="margin: 0 0 5px 0; color: ${colors.Tools}; font-size: 14px;">
                        ${tool.name}
                    </h3>
                    <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                        ${tool.focus}
                    </p>
                </div>
            `).join('');
            break;
            
        case 'Embassies':
            content += MAJOR_CITIES.map(city => `
                <div class="item" style="
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'"
                   onclick="showEmbassyDetails('${city.name}')">
                    <h3 style="margin: 0; color: ${colors.Embassies}; font-size: 14px;">
                        ${city.name}
                    </h3>
                </div>
            `).join('');
            break;
            
        case 'Earth Shots':
            content += EARTH_SHOTS.map(shot => `
                <div class="item" style="
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'"
                   onclick="showEarthShotDetails('${shot.name}')">
                    <h3 style="margin: 0; color: ${colors['Earth Shots']}; font-size: 14px;">
                        ${shot.name}
                    </h3>
                </div>
            `).join('');
            break;
    }
    
    panel.innerHTML = content;
};

// Add global functions for detailed views
window.showToolDetails = (toolName) => {
    const tool = getAllTools().find(t => t.name === toolName);
    if (tool) {
        const panel = document.getElementById('sidePanel');
        panel.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #99ccff; margin: 0 0 15px 0;">${tool.name}</h2>
                <p style="margin: 0 0 15px 0; line-height: 1.4;">${tool.focus}</p>
                <div style="color: #99ccff80;">
                    <p>Category: ${tool.category}</p>
                    <p>Type: ${tool.type}</p>
                    <p>Status: Active</p>
                    <p>Impact: Global</p>
                </div>
                <button onclick="showSidePanel('Tools', getAllTools())" style="
                    background: none;
                    border: 1px solid #99ccff;
                    color: #99ccff;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#99ccff20'"
                   onmouseout="this.style.background='none'">
                    ← Back to Tools
                </button>
            </div>
        `;
    }
};

window.showEmbassyDetails = (cityName) => {
    const city = MAJOR_CITIES.find(c => c.name === cityName);
    if (city) {
        const panel = document.getElementById('sidePanel');
        panel.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #ff9999; margin: 0 0 15px 0;">${city.name} Embassy</h2>
                <p style="margin: 0 0 15px 0; line-height: 1.4;">
                    The ${city.name} Imagination Embassy serves as a hub for creative 
                    collaboration and cultural exchange in the region.
                </p>
                <div style="color: #ff999980;">
                    <p>Location: ${city.name}</p>
                    <p>Coordinates: ${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°</p>
                    <p>Status: Active</p>
                    <p>Focus Areas: Education, Culture, Innovation</p>
                </div>
                <button onclick="showSidePanel('Embassies', MAJOR_CITIES)" style="
                    background: none;
                    border: 1px solid #ff9999;
                    color: #ff9999;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#ff999920'"
                   onmouseout="this.style.background='none'">
                    ← Back to Embassies
                </button>
            </div>
        `;
    }
};

window.showEarthShotDetails = (shotName) => {
    const shot = EARTH_SHOTS.find(s => s.name === shotName);
    if (shot) {
        const panel = document.getElementById('sidePanel');
        panel.innerHTML = `
            <div style="padding: 20px;">
                <h2 style="color: #99ff99; margin: 0 0 15px 0;">${shot.name}</h2>
                <p style="margin: 0 0 15px 0; line-height: 1.4;">
                    An innovative environmental project focused on sustainable solutions 
                    and community engagement.
                </p>
                <div style="color: #99ff9980;">
                    <p>Location: ${shot.lat.toFixed(2)}°, ${shot.lon.toFixed(2)}°</p>
                    <p>Status: Active</p>
                    <p>Focus Areas: Environment, Community, Innovation</p>
                    <p>Impact: Regional</p>
                </div>
                <button onclick="showSidePanel('Earth Shots', EARTH_SHOTS)" style="
                    background: none;
                    border: 1px solid #99ff99;
                    color: #99ff99;
                    padding: 8px 16px;
                    border-radius: 20px;
                    cursor: pointer;
                    margin-top: 20px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='#99ff9920'"
                   onmouseout="this.style.background='none'">
                    ← Back to Earth Shots
                </button>
            </div>
        `;
    }
};

// Update document click handler to be more specific
document.addEventListener('click', (event) => {
    const sidePanel = document.getElementById('sidePanel');
    const menuContainer = document.querySelector('[data-menu-container]');
    const clickedMenuItem = event.target.closest('[data-menu-item]');
    
    // Only close if click is outside both the side panel and menu, and not on a menu item
    if (sidePanel && 
        !sidePanel.contains(event.target) && 
        !menuContainer.contains(event.target) &&
        !clickedMenuItem) {
        sidePanel.style.display = 'none';
        
        // Reset active menu item highlighting
        const menuItems = document.querySelectorAll('[data-menu-item]');
        menuItems.forEach(item => {
            item.style.backgroundColor = 'transparent';
        });
    }
});

// Add flight paths between embassies with improved connections
const createFlightPaths = (scene) => {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
        color: 0xff9999,
        transparent: true,
        opacity: 0.3,
        linewidth: 1
    });

    // Create paths between major cities
    MAJOR_CITIES.forEach((city, index) => {
        // Connect to more cities (4-5 connections each)
        for (let i = 1; i <= 5; i++) {
            const nextIndex = (index + i) % MAJOR_CITIES.length;
            const nextCity = MAJOR_CITIES[nextIndex];
            
            // Convert lat/lon to 3D positions
            const start = latLonToVector3(city.lat, city.lon, 102); // Slightly above globe
            const end = latLonToVector3(nextCity.lat, nextCity.lon, 102);
            
            // Create curved path with higher arc
            const curve = createCurvedPath(start, end);
            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const line = new THREE.Line(geometry, material);
            group.add(line);
        }
        
        // Add a few random connections to ensure better network
        const randomConnections = 2;
        for (let i = 0; i < randomConnections; i++) {
            const randomIndex = Math.floor(Math.random() * MAJOR_CITIES.length);
            if (randomIndex !== index) {
                const randomCity = MAJOR_CITIES[randomIndex];
                const start = latLonToVector3(city.lat, city.lon, 102);
                const end = latLonToVector3(randomCity.lat, randomCity.lon, 102);
                
                const curve = createCurvedPath(start, end);
                const points = curve.getPoints(50);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                
                const line = new THREE.Line(geometry, material);
                group.add(line);
            }
        }
    });

    scene.add(group);
    return group;
};

// Helper to create curved path between two points with higher arc
const createCurvedPath = (start, end) => {
    // Calculate middle point
    const middle = start.clone().add(end).multiplyScalar(0.5);
    
    // Extend middle point outward with increased height
    const distance = start.distanceTo(end);
    middle.normalize().multiplyScalar(102 + (distance * 0.25)); // Increased multiplier for higher arc
    
    // Create quadratic curve
    const curve = new THREE.QuadraticBezierCurve3(
        start,
        middle,
        end
    );
    
    return curve;
};

// Add animation for flight paths
const animateFlightPaths = (group) => {
    const animate = () => {
        group.children.forEach((line, index) => {
            const material = line.material;
            material.opacity = 0.3 + (0.2 * Math.sin(Date.now() * 0.001 + index * 0.5));
        });
    };
    
    if (!window.animationFunctions) {
        window.animationFunctions = [];
    }
    window.animationFunctions.push(animate);
};

// Create control panel with visibility toggles
const createControlPanel = () => {
    const panel = document.createElement('div');
    panel.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        min-width: 150px;
    `;

    const controls = [
        { name: 'Flight Paths', id: 'flightPaths', color: '#ff9999', default: true },
        { name: 'Tools', id: 'tools', color: '#99ccff', default: true },
        { name: 'Earth Shots', id: 'earthShots', color: '#99ff99', default: true },
        { name: 'Embassies', id: 'embassies', color: '#ff9999', default: true },
        { name: 'Grid Lines', id: 'grid', color: '#666666', default: true }
    ];

    controls.forEach(control => {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            cursor: pointer;
            padding: 5px;
            border-radius: 5px;
            transition: background 0.3s ease;
        `;

        const toggle = document.createElement('div');
        toggle.style.cssText = `
            width: 36px;
            height: 20px;
            background: ${control.default ? control.color + '40' : '#333'};
            border-radius: 10px;
            margin-right: 10px;
            position: relative;
            transition: all 0.3s ease;
        `;

        const slider = document.createElement('div');
        slider.style.cssText = `
            width: 16px;
            height: 16px;
            background: ${control.default ? control.color : '#666'};
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: ${control.default ? '18px' : '2px'};
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        toggle.appendChild(slider);

        const label = document.createElement('span');
        label.textContent = control.name;
        label.style.fontSize = '14px';

        container.appendChild(toggle);
        container.appendChild(label);

        // Hover effect
        container.addEventListener('mouseenter', () => {
            container.style.background = 'rgba(255, 255, 255, 0.1)';
        });

        container.addEventListener('mouseleave', () => {
            container.style.background = 'transparent';
        });

        // Toggle functionality
        let isActive = control.default;
        container.addEventListener('click', () => {
            isActive = !isActive;
            toggle.style.background = isActive ? control.color + '40' : '#333';
            slider.style.left = isActive ? '18px' : '2px';
            slider.style.background = isActive ? control.color : '#666';

            // Toggle visibility of corresponding elements
            switch(control.id) {
                case 'flightPaths':
                    if (window.flightPaths) window.flightPaths.visible = isActive;
                    break;
                case 'tools':
                    if (window.toolsGroup) window.toolsGroup.visible = isActive;
                    break;
                case 'earthShots':
                    if (window.earthShots) window.earthShots.visible = isActive;
                    break;
                case 'embassies':
                    if (window.embassies) window.embassies.visible = isActive;
                    break;
                case 'grid':
                    if (window.gridLines) window.gridLines.visible = isActive;
                    break;
            }
        });

        panel.appendChild(container);
    });

    document.body.appendChild(panel);
};

// Create See Tables button and overlay
const createTableButton = () => {
    // Create the button
    const button = document.createElement('div');
    button.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        padding: 12px 24px;
        border-radius: 25px;
        color: white;
        font-family: Arial, sans-serif;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
        letter-spacing: 1px;
        text-transform: uppercase;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    button.textContent = 'See Tables';

    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(255, 255, 255, 0.1)';
        button.style.transform = 'translateX(-50%) scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(0, 0, 0, 0.7)';
        button.style.transform = 'translateX(-50%) scale(1)';
    });

    // Create the overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 2000;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        overflow-y: auto;
    `;

    // Create overlay content
    const content = document.createElement('div');
    content.style.cssText = `
        max-width: 1200px;
        margin: 40px auto;
        padding: 20px;
        color: white;
        font-family: Arial, sans-serif;
    `;

    // Add close button
    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.3s ease;
    `;
    closeButton.innerHTML = '×';
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    // Add content sections
    content.innerHTML = `
        <h1 style="
            font-size: 32px;
            margin-bottom: 30px;
            text-align: center;
            color: #fff;
        ">AIME Philosophy & Programs</h1>

        <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        ">
            <div class="section">
                <h2 style="color: #ff9999; margin-bottom: 20px;">Embassies</h2>
                <div class="table" style="
                    background: rgba(255, 153, 153, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    ${MAJOR_CITIES.map(city => `
                        <div style="
                            padding: 10px;
                            border-bottom: 1px solid rgba(255, 153, 153, 0.2);
                        ">
                            <h3 style="margin: 0; color: #ff9999;">${city.name}</h3>
                            <p style="margin: 5px 0 0 0; opacity: 0.8;">
                                Coordinates: ${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2 style="color: #99ccff; margin-bottom: 20px;">Tools</h2>
                <div class="table" style="
                    background: rgba(153, 204, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    ${getAllTools().map(tool => `
                        <div style="
                            padding: 10px;
                            border-bottom: 1px solid rgba(153, 204, 255, 0.2);
                        ">
                            <h3 style="margin: 0; color: #99ccff;">${tool.name}</h3>
                            <p style="margin: 5px 0 0 0; opacity: 0.8;">${tool.focus}</p>
                            <p style="margin: 5px 0 0 0; opacity: 0.6;">
                                Category: ${tool.category} | Type: ${tool.type}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2 style="color: #99ff99; margin-bottom: 20px;">Earth Shots</h2>
                <div class="table" style="
                    background: rgba(153, 255, 153, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                ">
                    ${EARTH_SHOTS.map(shot => `
                        <div style="
                            padding: 10px;
                            border-bottom: 1px solid rgba(153, 255, 153, 0.2);
                        ">
                            <h3 style="margin: 0; color: #99ff99;">${shot.name}</h3>
                            <p style="margin: 5px 0 0 0; opacity: 0.8;">
                                Location: ${shot.lat.toFixed(2)}°, ${shot.lon.toFixed(2)}°
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div style="
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-top: 40px;
        ">
            <h2 style="margin-bottom: 20px;">About AIME</h2>
            <p style="
                max-width: 800px;
                margin: 0 auto;
                line-height: 1.6;
                opacity: 0.8;
            ">
                AIME is a global network connecting imagination with opportunity. 
                Through our embassies, tools, and environmental initiatives, we're 
                building bridges between cultures and creating pathways for positive change.
            </p>
        </div>
    `;

    overlay.appendChild(closeButton);
    overlay.appendChild(content);

    // Add click handlers
    button.addEventListener('click', () => {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    });

    closeButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    });

    document.body.appendChild(button);
    document.body.appendChild(overlay);
};

// Add this after scene creation
const addShootingStars = () => {
    const stars = [];
    const starCount = 20;
    
    for(let i = 0; i < starCount; i++) {
        const star = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        
        // Random position far from globe
        star.position.set(
            Math.random() * 1000 - 500,
            Math.random() * 1000 - 500,
            Math.random() * 1000 - 500
        );
        
        stars.push(star);
        scene.add(star);
    }
    
    // Animate stars
    const animateStars = () => {
        stars.forEach(star => {
            star.position.x -= 2;
            star.position.y -= 2;
            star.position.z -= 2;
            
            if(star.position.x < -500) {
                star.position.set(500, 
                    Math.random() * 1000 - 500,
                    Math.random() * 1000 - 500);
            }
        });
    };
    
    if (!window.animationFunctions) {
        window.animationFunctions = [];
    }
    window.animationFunctions.push(animateStars);
};

// Create GRP button function
const createGRPButton = () => {
    const button = document.createElement('div');
    button.style.cssText = 'position: absolute; bottom: 20px; left: 20px; background: rgba(0, 0, 0, 0.7); color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-family: Arial, sans-serif; z-index: 1000; border: 1px solid rgba(255, 255, 255, 0.3)';
    button.textContent = 'GRP Impact';
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); display: none; z-index: 2000; overflow: auto';
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)';
    overlay.appendChild(canvas);
    
    const closeButton = document.createElement('div');
    closeButton.style.cssText = 'position: absolute; top: 20px; right: 20px; color: white; cursor: pointer; font-size: 24px; z-index: 2001';
    closeButton.textContent = '×';
    overlay.appendChild(closeButton);
    
    const visualizeGRP = () => {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        
        // Animation variables
        let time = 0;
        let nodes = [];
        const nodeCount = 30; // Increased from 20 to 30 for more opportunities
        
        // Create nodes with slower movement
        for(let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 1, // Reduced speed
                vy: (Math.random() - 0.5) * 1, // Reduced speed
                connections: new Set()
            });
        }
        
        const animate = () => {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            time += 0.01;
            
            // Update and draw nodes
            nodes.forEach((node, i) => {
                // Update position with smoother movement
                node.x += node.vx;
                node.y += node.vy;
                
                // Bounce off walls
                if(node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if(node.y < 0 || node.y > canvas.height) node.vy *= -1;
                
                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#4287f5';
                ctx.fill();
                
                // Draw connections with increased range
                nodes.forEach((otherNode, j) => {
                    if(i === j) return;
                    
                    const dx = otherNode.x - node.x;
                    const dy = otherNode.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if(distance < 200) { // Increased connection range
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(otherNode.x, otherNode.y);
                        ctx.strokeStyle = `rgba(66, 135, 245, ${1 - distance/200})`;
                        ctx.stroke();
                        
                        node.connections.add(j);
                    } else {
                        node.connections.delete(j);
                    }
                });
            });
            
            // Draw UNCx5 groups with more visibility
            for(let i = 0; i < nodes.length - 4; i++) {
                const group = [nodes[i]];
                
                // Find 4 more connected nodes with relaxed conditions
                for(let j = i + 1; j < nodes.length && group.length < 5; j++) {
                    const allConnected = group.every(node => {
                        const dx = nodes[j].x - node.x;
                        const dy = nodes[j].y - node.y;
                        return Math.sqrt(dx * dx + dy * dy) < 250; // Increased group formation range
                    });
                    
                    if(allConnected) {
                        group.push(nodes[j]);
                    }
                }
                
                // Draw group if we found 5 connected nodes
                if(group.length === 5) {
                    ctx.beginPath();
                    ctx.moveTo(group[0].x, group[0].y);
                    group.forEach(node => {
                        ctx.lineTo(node.x, node.y);
                    });
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(245, 66, 170, 0.2)'; // Increased opacity
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(245, 66, 170, 0.8)'; // Increased line visibility
                    ctx.lineWidth = 2; // Thicker lines
                    ctx.stroke();
                    ctx.lineWidth = 1; // Reset line width
                }
            }
            
            // Draw info panel
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(20, 20, 360, 200);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.strokeRect(20, 20, 360, 200);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('GRP Components Visualization', 40, 50);
            
            ctx.font = '14px Arial';
            ctx.fillStyle = '#4287f5';
            ctx.fillText('Blue Lines: Bilateral Relations', 40, 80);
            ctx.fillStyle = 'white';
            ctx.fillText('Value = n(n-1)/2 × $10,000 per relation', 60, 100);
            
            ctx.fillStyle = '#f542aa';
            ctx.fillText('Pink Areas: UNCx5 Groups', 40, 130);
            ctx.fillStyle = 'white';
            ctx.fillText('Value = C(n,5) × $100,000 per group', 60, 150);
            
            ctx.fillStyle = '#666';
            ctx.fillText('Watch how groups form and dissolve as', 40, 180);
            ctx.fillText('nodes move and create new connections', 40, 200);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    };
    
    button.onclick = () => {
        overlay.style.display = 'block';
        visualizeGRP();
    };
    
    closeButton.onclick = () => {
        overlay.style.display = 'none';
    };
    
    document.body.appendChild(button);
    document.body.appendChild(overlay);

    // Add explanation panel system
    const addExplanations = (overlay) => {
        // Create explanation buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            max-width: calc(100% - 100px); /* Leave space for close button */
            z-index: 2001;
        `;

        // Create and style explanation panel
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: absolute;
            top: 70px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            color: white;
            font-family: Arial, sans-serif;
            width: 300px;
            display: none;
            z-index: 2001;
        `;

        // Create explanation buttons
        const explanations = [
            {
                id: 'overview',
                icon: '🌐',
                title: 'Overview',
                content: `
                    <h3>Understanding GRP (Gross Relational Product)</h3>
                    <p>GRP measures the total value created through network relationships and collaborative groups. 
                    Watch the dynamic visualization to see how value emerges from:</p>
                    <ul>
                        <li>Bilateral connections between participants (blue lines)</li>
                        <li>Formation of UNCx5 groups (pink areas)</li>
                    </ul>
                    <p>The more connections and groups form, the higher the network's total value becomes.</p>
                `
            },
            {
                id: 'bilateral',
                icon: '🔗',
                title: 'Connections',
                content: `
                    <h3>Blue Lines: Network Connections</h3>
                    <p>Each moving dot represents a network participant. When dots come close enough, they form 
                    blue connections representing bilateral relationships.</p>
                    <p><strong>Value Calculation:</strong></p>
                    <ul>
                        <li>Each connection is worth $10,000</li>
                        <li>Total possible connections = n(n-1)/2</li>
                        <li>Example: 20 participants can form up to 190 connections</li>
                        <li>Maximum bilateral value = 190 × $10,000 = $1.9M</li>
                    </ul>
                `
            },
            {
                id: 'uncx5',
                icon: '⭐',
                title: 'UNCx5',
                content: `
                    <h3>Pink Areas: Collaborative Groups</h3>
                    <p>When exactly 5 participants connect, they form a UNCx5 group, shown as a pink pentagon.</p>
                    <p><strong>Group Dynamics:</strong></p>
                    <ul>
                        <li>Each UNCx5 group is worth $100,000</li>
                        <li>Groups form and dissolve as participants move</li>
                        <li>Multiple groups can exist simultaneously</li>
                        <li>The same participant can be part of multiple groups</li>
                    </ul>
                `
            },
            {
                id: 'formula',
                icon: '📊',
                title: 'Formula',
                content: `
                    <h3>GRP Value Calculation</h3>
                    <p><strong>Total GRP = Bilateral Value + Group Value</strong></p>
                    <p>Where:</p>
                    <ul>
                        <li>Bilateral Value = [n(n-1)/2] × $10,000</li>
                        <li>Group Value = [C(n,5)] × $100,000</li>
                        <li>n = number of participants</li>
                        <li>C(n,5) = number of possible groups of 5</li>
                    </ul>
                    <p>As the network grows, group value tends to outpace bilateral value.</p>
                `
            },
            {
                id: 'scenarios',
                icon: '🎯',
                title: 'Examples',
                content: `
                    <h3>Real-World GRP Scenarios</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Scenario 1: University Network</h4>
                        <p><strong>Setting:</strong> 20 universities collaborating globally</p>
                        <ul>
                            <li>190 bilateral connections × $10,000 = $1.9M in relationship value</li>
                            <li>15,504 possible UNCx5 groups × $100,000 = $1.55B in group value</li>
                            <li>Total GRP potential: $1.55B</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ff99;">Scenario 2: Startup Ecosystem</h4>
                        <p><strong>Setting:</strong> 50 tech startups in an innovation hub</p>
                        <ul>
                            <li>1,225 bilateral connections × $10,000 = $12.25M</li>
                            <li>2,118,760 possible UNCx5 groups × $100,000 = $211.88B</li>
                            <li>Shows how group value grows exponentially!</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'roleplay',
                icon: '🎭',
                title: 'Role Play',
                content: `
                    <h3>GRP in Action: Role Play Scenarios</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Scenario A: Global Education Initiative</h4>
                        <p><strong>Players:</strong></p>
                        <ul>
                            <li>University A (Australia) - Digital Learning Expert</li>
                            <li>University B (Brazil) - Content Creation</li>
                            <li>University C (Canada) - Research Lead</li>
                            <li>University D (Denmark) - Technology Platform</li>
                            <li>University E (Egypt) - Local Implementation</li>
                        </ul>
                        <p><strong>Value Created:</strong></p>
                        <ul>
                            <li>10 bilateral connections × $10,000 = $100,000</li>
                            <li>1 UNCx5 group × $100,000 = $100,000</li>
                            <li>Total Value: $200,000</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'value',
                icon: '💰',
                title: 'Value',
                content: `
                    <h3>Understanding Value Creation in GRP</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Bilateral Relations ($10,000 each)</h4>
                        <p><strong>Value Sources:</strong></p>
                        <ul>
                            <li>Knowledge sharing between institutions</li>
                            <li>Student exchange programs</li>
                            <li>Joint research initiatives</li>
                            <li>Resource sharing agreements</li>
                            <li>Best practice exchanges</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ff9999;">UNCx5 Groups ($100,000 each)</h4>
                        <p><strong>Value Multipliers:</strong></p>
                        <ul>
                            <li>Multi-party research projects</li>
                            <li>Global innovation programs</li>
                            <li>Shared technology platforms</li>
                            <li>Joint funding initiatives</li>
                            <li>Collaborative problem-solving</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'impact',
                icon: '🌟',
                title: 'Impact',
                content: `
                    <h3>Network Impact Examples</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Environmental Innovation</h4>
                        <p><strong>UNCx5 Example:</strong> Climate Action Coalition</p>
                        <ul>
                            <li>Research Institution: Climate Science</li>
                            <li>Tech Company: Carbon Tracking</li>
                            <li>Government Agency: Policy Framework</li>
                            <li>NGO: Community Engagement</li>
                            <li>Industry Partner: Implementation</li>
                        </ul>
                        <p>Value amplified through real-world environmental impact</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ff99;">Social Innovation</h4>
                        <p><strong>Impact Areas:</strong></p>
                        <ul>
                            <li>Education Access Programs</li>
                            <li>Healthcare Initiatives</li>
                            <li>Cultural Preservation</li>
                            <li>Community Development</li>
                            <li>Economic Empowerment</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'growth',
                icon: '📈',
                title: 'Growth',
                content: `
                    <h3>Network Growth Dynamics</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ff9999;">Growth Stages</h4>
                        <ul>
                            <li>Stage 1: Initial Connections (1-10 nodes)</li>
                            <li>Stage 2: Network Formation (11-25 nodes)</li>
                            <li>Stage 3: Group Emergence (26-50 nodes)</li>
                            <li>Stage 4: Network Maturity (51+ nodes)</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Value Acceleration</h4>
                        <p>As networks grow, value increases exponentially:</p>
                        <ul>
                            <li>10 nodes: ~$450K potential</li>
                            <li>20 nodes: ~$1.9M potential</li>
                            <li>50 nodes: ~$12.25M potential</li>
                            <li>100 nodes: ~$49.5M potential</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'sectors',
                icon: '🏛️',
                title: 'Sectors',
                content: `
                    <h3>Sector-Specific Applications</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Education Sector</h4>
                        <ul>
                            <li>Research Collaborations</li>
                            <li>Student Exchange Networks</li>
                            <li>Global Learning Platforms</li>
                            <li>Academic Partnerships</li>
                            <li>Innovation Hubs</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ff99;">Cultural Sector</h4>
                        <ul>
                            <li>Museum Networks</li>
                            <li>Arts Collaborations</li>
                            <li>Heritage Preservation</li>
                            <li>Cultural Exchange Programs</li>
                            <li>Creative Industries</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #ff9999;">Innovation Sector</h4>
                        <ul>
                            <li>Technology Hubs</li>
                            <li>Research Networks</li>
                            <li>Startup Ecosystems</li>
                            <li>Industry Partnerships</li>
                            <li>Innovation Districts</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'strategy',
                icon: '🎯',
                title: 'Strategy',
                content: `
                    <h3>Strategic Network Building</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Network Formation</h4>
                        <p><strong>Key Steps:</strong></p>
                        <ul>
                            <li>Identify Strategic Partners</li>
                            <li>Build Initial Connections</li>
                            <li>Foster Group Formation</li>
                            <li>Maintain Active Engagement</li>
                            <li>Scale Thoughtfully</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ff99;">Success Factors</h4>
                        <ul>
                            <li>Clear Shared Purpose</li>
                            <li>Active Participation</li>
                            <li>Resource Sharing</li>
                            <li>Regular Communication</li>
                            <li>Measured Outcomes</li>
                        </ul>
                    </div>
                `
            },
            {
                id: 'future',
                icon: '🚀',
                title: 'Future',
                content: `
                    <h3>Future of Network Value</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ccff;">Emerging Trends</h4>
                        <ul>
                            <li>Digital Transformation</li>
                            <li>Global Connectivity</li>
                            <li>AI Integration</li>
                            <li>Sustainable Networks</li>
                            <li>Cross-Sector Collaboration</li>
                        </ul>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #99ff99;">Innovation Potential</h4>
                        <p><strong>Future Applications:</strong></p>
                        <ul>
                            <li>Virtual Reality Collaborations</li>
                            <li>AI-Enhanced Networks</li>
                            <li>Global Problem Solving</li>
                            <li>Sustainable Development</li>
                            <li>Cultural Innovation</li>
                        </ul>
                    </div>
                `
            }
        ];

        // Create buttons with white text
        explanations.forEach(exp => {
            const button = document.createElement('div');
            button.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: background 0.3s;
                color: white;  /* Added white text color */
            `;
            button.innerHTML = `${exp.icon} ${exp.title}`;
            
            button.onmouseenter = () => {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
            };
            button.onmouseleave = () => {
                button.style.background = 'rgba(255, 255, 255, 0.1)';
            };
            
            button.onclick = (e) => {
                e.stopPropagation(); // Prevent click from bubbling to overlay
                panel.innerHTML = exp.content;
                panel.style.display = 'block';
            };
            
            buttonContainer.appendChild(button);
        });

        // Close panel when clicking outside
        overlay.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !buttonContainer.contains(e.target)) {
                panel.style.display = 'none';
            }
        });

        // Style the content
        panel.innerHTML += `
            <style>
                h3 { color: #4287f5; margin-top: 0; }
                ul { padding-left: 20px; }
                li { margin: 5px 0; }
                p { line-height: 1.4; }
            </style>
        `;

        overlay.appendChild(buttonContainer);
        overlay.appendChild(panel);
    };

    // Add explanations when creating the visualization
    addExplanations(overlay);
};

// Make sure this is called in your initialization
window.addEventListener('load', () => {
    createGRPButton();
});