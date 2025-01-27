# **AIME & IMAGI-NATION: 3D Interactive Globe**

## **AIME & IMAGI-NATION Overview**

AIME is a global relational organisation that builds bridges between unlikely connections—students, educators, communities, and beyond—to spark **imagination** and **opportunity**. Over the next decade, AIME is constructing **IMAGI-NATION**: a digital (and real-world) “nation” where people from all backgrounds come together to solve the world’s toughest challenges, foster equity, and uplift creativity.

### **Why a 3D Map?**
The **3D interactive globe** in this repository helps embody AIME’s core principle—**that imagination knows no borders**—by visually illustrating:

1. **Embassies**: Points around the world where AIME’s philosophy takes root, serving as local hubs of creative and educational exchange.  
2. **Earth Shots**: Spots highlighting large-scale environmental initiatives, underscoring a global responsibility to our planet.  
3. **Tools**: Various programs, cultural initiatives, and digital solutions that AIME deploys to connect mentors, learners, and communities.  
4. **Network & Collaboration**: Flight paths, markers, and interactive overlays that bring to life the **relational economy**—showing how cooperation across geographies multiplies collective impact.

As you explore the globe, you’ll see how **AIME & IMAGI-NATION** weave imagination into education, culture, and environmental activism, connecting diverse perspectives to build a fairer world.

---

## **Code Overview**

This codebase renders the **3D interactive map** using **Three.js** and provides UI and data structures to showcase AIME & IMAGI-NATION’s global reach and collaborative philosophy.

### **Key Technologies**

- **Three.js** – For 3D rendering of the Earth, markers, atmosphere, and animations.  
- **TWEEN.js** – For smooth transitions (e.g., hover scaling, camera movement).  
- **HTML & CSS** – For UI panels, overlays, tooltips, and interactive controls.

---

## **Main Features**

1. **Scene Initialization**  
   - Sets up a Three.js scene, camera, and renderer.  
   - Uses **OrbitControls** for intuitive click-drag camera rotation and zoom.  
   - Handles window resizing to keep the display responsive.

2. **Globe & Atmosphere**  
   - Loads an Earth texture (with fallback if external sources fail).  
   - Adds a subtle **atmosphere** shader for realism.  
   - Overlays an optional **lat/lon** grid to help pinpoint exact coordinates.

3. **Data Markers**  
   - **Embassies**: Represented by emissive spheres placed at specific lat/lon coordinates (major cities).  
   - **Earth Shots**: Shown as cubes at relevant environmental project locations.  
   - **Tools**: Tetrahedrons orbiting the globe to signify different platforms and programs AIME runs.

4. **Interactivity & UI**  
   - **Tooltip System**: Hovers display short info about each marker or tool.  
   - **Side Panel**: Clicking an item shows detailed data in a collapsible panel.  
   - **Menu & Control Panel**: Toggle layers (flight paths, grid, tools, embassies) on/off, or focus the camera on a specific category.  
   - **2D Mini-Map**: A small overlay that displays the Earth in 2D; clicking on it smoothly “flies” the camera to the corresponding 3D location.

5. **Animations**  
   - **Hover Effects**: Markers scale up to indicate selection.  
   - **Flight Paths**: Arced lines between major city locations, visualizing the “network” aspect of IMAGI-NATION.  
   - **Tools’ Orbits**: Each tool has a unique orbit speed and random offset to illustrate dynamic movement around the globe.  
   - **Shooting Stars**: Adds cosmic ambience with small moving star meshes in the background.

6. **Additional Overlays**  
   - **Tables & Wiki-Style Pages**: A “See Tables” button opens a fullscreen overlay listing Embassies, Earth Shots, and Tools in tabular format.  
   - **GRP Visualization** (optional): Demonstrates the concept of a “Gross Relational Product,” showing how interconnectedness boosts global impact.

---

## **Project Structure & Flow**

1. **Global Variables**  
   - `scene`, `camera`, `renderer`, etc., plus arrays for **Embassies**, **Earth Shots**, and **Tools**.
2. **Setup & Loaders**  
   - **`loadTWEEN()`** ensures TWEEN is available.  
   - **`initBasicScene()`** orchestrates globe creation, lighting, data markers, UI, etc.
3. **Creation Functions**  
   - **`createGlobe()`** & **`createAtmosphere()`**: Sphere geometry with textures and shaders.  
   - **`createEmbassyMarkers()`, `createEarthShotMarkers()`, `createTools()`**: Adds respective 3D objects.  
   - **`createFlightPaths()`**: Arcs between city markers.  
   - **`createTooltip()`, `addTooltipInteraction()`**: Manages the hover info system.  
   - **UI Modules** (`createNavigationMenu()`, `createSidePanel()`, etc.) handle user interface elements and data display.
4. **Animation Loop**  
   - The **`animate()`** function calls `requestAnimationFrame` repeatedly, updating TWEEN animations, orbit controls, and re-rendering.

---

## **Usage**

1. **Installation**  
   - Clone or download this repo.  
   - Ensure you have a local web server to serve the HTML/JS (for texture loading, etc.).
2. **Running the Demo**  
   - Open the main HTML file in your browser (e.g., `http://localhost:8080`).  
   - Enjoy the 3D globe, explore the menu, and interact with markers.
3. **Customization**  
   - **Embassies** / **Earth Shots** / **Tools** arrays can be updated with new data.  
   - Change color schemes, marker shapes, or camera defaults in the relevant creation functions or config objects.

---

## **Contributing**

We welcome contributions that expand or refine this interactive map—adding new features, more data, or improved visuals. Feel free to **fork**, create feature branches, and open pull requests.

---

## **License**

**Open source**---

### **Stay Curious & Creative**

This repository is a window into **IMAGI-NATION**, showing how imagination and mentorship can unite individuals across the globe. If you have questions about **AIME** or would like to get involved, visit our [official site](https://aimementoring.com).

**Thank you** for exploring this project, and we hope it inspires new ways to connect, learn, and innovate for a fairer world.
