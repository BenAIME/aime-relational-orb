// Add console logging to track execution flow
console.log('Starting application...');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Create globe
const createGlobe = () => {
    const geometry = new THREE.SphereGeometry(5, 50, 50);
    const material = new THREE.MeshPhongMaterial({
        color: 0x1a3a4d,
        transparent: true,
        opacity: 0.9,
        specular: 0x555555,
        shininess: 50
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
    return globe;
};

const globe = createGlobe();

// Add embassy nodes
const addEmbassies = (embassies) => {
    if (!embassies || !Array.isArray(embassies)) {
        throw new Error('Invalid embassies data provided to addEmbassies');
    }
    embassies.forEach(embassy => {
        const phi = (90 - embassy.lat) * (Math.PI / 180);
        const theta = (embassy.lng + 180) * (Math.PI / 180);
        const radius = 5.1;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x4CAF50,
            transparent: true,
            opacity: 0.8
        });
        const node = new THREE.Mesh(geometry, material);
        node.position.set(x, y, z);
        node.userData = embassy;
        scene.add(node);
    });
};

// Create connections
const createConnections = (embassies) => {
    if (!embassies || !Array.isArray(embassies)) {
        throw new Error('Invalid embassies data provided to createConnections');
    }
    const material = new THREE.LineBasicMaterial({ 
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.3
    });

    embassies.forEach((startEmbassy, i) => {
        embassies.slice(i + 1).forEach(endEmbassy => {
            const startPos = getPosition(startEmbassy);
            const endPos = getPosition(endEmbassy);
            
            // Create curved path
            const curve = new THREE.QuadraticBezierCurve3(
                startPos,
                new THREE.Vector3(
                    (startPos.x + endPos.x) / 2,
                    (startPos.y + endPos.y) / 2 + 2,
                    (startPos.z + endPos.z) / 2
                ),
                endPos
            );

            const points = curve.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            scene.add(line);
        });
    });
};

const getPosition = (embassy) => {
    const phi = (90 - embassy.lat) * (Math.PI / 180);
    const theta = (embassy.lng + 180) * (Math.PI / 180);
    const radius = 5.1;

    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
};

// Camera position
camera.position.z = 15;

// Animation
gsap.to(globe.rotation, {
    y: Math.PI * 2,
    duration: 120,
    repeat: -1,
    ease: "none"
});

// Wrap main initialization in a try-catch
try {
    // Load data first, then initialize everything else
    fetch('data/locations.json')
        .then(response => {
            console.log('Fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data loaded successfully:', data);
            if (!Array.isArray(data)) {
                throw new Error('Data is not in expected format');
            }
            const embassies = data;
            try {
                addEmbassies(embassies);
                console.log('Embassies added successfully');
                createConnections(embassies);
                console.log('Connections created successfully');
            } catch (error) {
                console.error('Error in processing embassies:', error);
            }
        })
        .catch(error => {
            console.error('Error loading or processing the embassies data:', error);
            // Add visible error message on the page
            const container = document.getElementById('container');
            if (container) {
                container.innerHTML = `<div style="color: red; padding: 20px;">
                    Error loading data: ${error.message}
                </div>`;
            }
        });

} catch (error) {
    console.error('Critical application error:', error);
}

// Interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object.geometry.type === 'SphereGeometry') {
        const embassy = intersects[0].object.userData;
        tooltip.style.left = `${e.clientX + 20}px`;
        tooltip.style.top = `${e.clientY}px`;
        tooltip.innerHTML = `
            <strong>${embassy.name}</strong><br>
            GRP Impact: $10M → $1B
        `;
        tooltip.classList.remove('hidden');
    } else {
        tooltip.classList.add('hidden');
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();
    renderer.render(scene, camera);
}
animate();