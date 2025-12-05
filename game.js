/**
 * Open World Racing Game
 * Technologies: Three.js (Rendering) + Cannon.es (Physics)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js'; 
import * as CANNON from 'cannon-es';

// ==========================================
// 1. GAME CONFIGURATION & STATE
// ==========================================
const config = {
    worldSize: 4000,
    fogColor: 0x87CEEB,
    gravity: -9.82,
    physicsSteps: 10
};

const keys = { w: false, a: false, s: false, d: false, r: false, c: false, v: false, ' ': false };
let gameActive = true;
let timeLeft = 60; 
let score = 0;
let highScore = localStorage.getItem('gtaHighScore') || 0;

// Vehicle State
let carAngle = 0; 
let currentSpeed = 0; 
let cameraMode = 0; 
let currentCarIndex = 0;
let cKeyPressed = false; 
let vKeyPressed = false;

// DOM Elements
const speedometer = document.getElementById('speedometer');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const loadingScreen = document.getElementById('loading');

// ==========================================
// 2. SCENE & RENDERER SETUP
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(config.fogColor, 200, 1000); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500); 
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8; 
document.body.appendChild(renderer.domElement);

// Mini-Map Setup
const mapSize = 150; 
const mapCamera = new THREE.OrthographicCamera(-mapSize, mapSize, mapSize, -mapSize, 1, 1000);
mapCamera.position.set(0, 200, 0); 
mapCamera.lookAt(0, 0, 0); 

// ==========================================
// 3. LIGHTING & ENVIRONMENT
// ==========================================
// Sky
const sky = new Sky();
sky.scale.setScalar(450000); 
scene.add(sky);

const sunPosition = new THREE.Vector3();
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5); 
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); 

// Configure Sun Position (Static Afternoon)
const elevation = 70; 
const azimuth = 180; 
const phi = THREE.MathUtils.degToRad(90 - elevation);
const theta = THREE.MathUtils.degToRad(azimuth);
sunPosition.setFromSphericalCoords(1, phi, theta);

sky.material.uniforms['sunPosition'].value.copy(sunPosition);
sky.material.uniforms['turbidity'].value = 10;
sky.material.uniforms['rayleigh'].value = 3;

sunLight.position.copy(sunPosition); 
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; 
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -500;
sunLight.shadow.camera.right = 500;
sunLight.shadow.camera.top = 500;
sunLight.shadow.camera.bottom = -500;

scene.add(sky);
scene.add(hemiLight);
scene.add(sunLight);

// Textures
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(400, 400); 

// Procedural Building Texture Generator
function createBuildingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Concrete Wall
    ctx.fillStyle = '#808080'; 
    ctx.fillRect(0, 0, 128, 128);
    // Windows
    ctx.fillStyle = '#1a2a3a'; 
    ctx.fillRect(10, 10, 44, 108); 
    ctx.fillRect(74, 10, 44, 108); 
    // Balcony Trim
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 120, 128, 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}
const cityTexture = createBuildingTexture();

// ==========================================
// 4. PHYSICS WORLD
// ==========================================
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, config.gravity, 0) });
world.solver.iterations = config.physicsSteps; 

const physicsMaterials = {
    ground: new CANNON.Material(),
    box: new CANNON.Material()
};

const boxGroundContact = new CANNON.ContactMaterial(physicsMaterials.ground, physicsMaterials.box, {
    friction: 0.05, 
    restitution: 0.0 
});
world.addContactMaterial(boxGroundContact);

// ==========================================
// 5. WORLD GENERATION
// ==========================================
// Floor
const floorGeo = new THREE.PlaneGeometry(config.worldSize, config.worldSize);
const floorMat = new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.8 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(config.worldSize/2, 5, config.worldSize/2)), 
    material: physicsMaterials.ground
});
floorBody.position.set(0, -5, 0); 
world.addBody(floorBody);

// Road Generation
function createRoad() {
    const roadGeo = new THREE.PlaneGeometry(30, config.worldSize);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.01; 
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);
}
createRoad();

// Building Generator
function createBuilding(x, z, width, height, depth) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const myTexture = cityTexture.clone();
    myTexture.repeat.set(width / 10, height / 5);
    myTexture.needsUpdate = true;
    
    // Randomize color tint
    const tint = Math.random() * 0.4 + 0.6; 
    const color = new THREE.Color().setScalar(tint);
    
    const mat = new THREE.MeshStandardMaterial({ 
        map: myTexture, color: color, roughness: 0.3, metalness: 0.1 
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z); 
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 0, 
        position: new CANNON.Vec3(x, height / 2, z),
        shape: shape
    });
    world.addBody(body);
}

// Procedural City Population
for (let i = 0; i < 400; i++) { 
    let x = (Math.random() - 0.5) * 1800; 
    let z = (Math.random() - 0.5) * 1800;
    if (Math.abs(x) < 20) continue; // Keep main road clear
    
    const w = 15 + Math.random() * 20; 
    const h = 20 + Math.random() * 80; 
    const d = 15 + Math.random() * 20; 
    createBuilding(x, z, w, h, d);
}

// Ramp
const rampGeo = new THREE.BoxGeometry(10, 0.5, 20); 
const rampMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
const rampMesh = new THREE.Mesh(rampGeo, rampMat);
rampMesh.position.set(0, -1, -50); 
rampMesh.rotation.x = -0.3; 
rampMesh.receiveShadow = true;
scene.add(rampMesh);

const rampShape = new CANNON.Box(new CANNON.Vec3(5, 0.25, 10));
const rampBody = new CANNON.Body({
    mass: 0, position: new CANNON.Vec3(0, -1, -50), shape: rampShape
});
rampBody.quaternion.setFromEuler(-0.3, 0, 0); 
world.addBody(rampBody);

// ==========================================
// 6. VEHICLE SYSTEM
// ==========================================
const carConfigs = [
    { name: "F1 RACER", color: 0xdc143c, scale: 2.0, maxSpeed: 30, accel: 0.2, grip: 0.8, mass: 200 },
    { name: "RALLY CAR", color: 0x0055ff, scale: 2.2, maxSpeed: 25, accel: 0.15, grip: 0.2, mass: 300 }, 
    { name: "CYBER TRUCK", color: 0x228b22, scale: 2.5, maxSpeed: 20, accel: 0.1, grip: 0.9, mass: 800 } 
];

let carMesh = null;
let boxBody = null;

function createF1Car(color, scale) {
    const carGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const greyMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });

    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 2.5), bodyMat);
    chassis.position.y = 0.2; chassis.castShadow = true;
    carGroup.add(chassis);

    // Cockpit
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1), blackMat);
    cockpit.position.set(0, 0.5, 0); cockpit.castShadow = true;
    carGroup.add(cockpit);

    // Spoiler
    const spoilerBlade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.4), blackMat);
    spoilerBlade.position.set(0, 0.8, 1.1); spoilerBlade.castShadow = true;
    carGroup.add(spoilerBlade);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 32);
    wheelGeo.rotateZ(Math.PI / 2); 
    const wheelPositions = [
        { x: 0.7, z: 0.8 }, { x: -0.7, z: 0.8 },
        { x: 0.7, z: -1.0 }, { x: -0.7, z: -1.0 }
    ];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, blackMat);
        wheel.position.set(pos.x, 0, pos.z);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });

    // Headlights
    const headLight = new THREE.SpotLight(0xffffff, 400); 
    headLight.position.set(0, 1, -0.5); 
    headLight.target.position.set(0, 0, -10); 
    headLight.angle = 0.6; headLight.penumbra = 0.5; headLight.castShadow = true;
    carGroup.add(headLight); 
    carGroup.add(headLight.target);

    carGroup.scale.set(scale, scale, scale);
    return carGroup;
}

function spawnCar(index) {
    if (carMesh) scene.remove(carMesh);
    if (boxBody) world.removeBody(boxBody);

    const stats = carConfigs[index];
    const uiName = document.getElementById('car-name');
    if(uiName) {
        uiName.innerText = stats.name;
        uiName.style.color = '#' + stats.color.toString(16);
    }

    carMesh = createF1Car(stats.color, stats.scale);
    scene.add(carMesh);

    const startPos = boxBody ? boxBody.position : new CANNON.Vec3(0, 4, 0);
    const startQuat = boxBody ? boxBody.quaternion : new CANNON.Quaternion();

    boxBody = new CANNON.Body({
        mass: stats.mass, 
        shape: new CANNON.Box(new CANNON.Vec3(1, 0.6, 2.5)), 
        position: startPos,
        quaternion: startQuat,
        material: physicsMaterials.box,
        fixedRotation: true,
        linearDamping: 0.5, 
        allowSleep: false
    });
    
    if (currentSpeed) boxBody.velocity = new CANNON.Vec3(0,0,0); 
    world.addBody(boxBody);
}

// Initial Spawn
spawnCar(0);
if (loadingScreen) loadingScreen.style.display = 'none';

// ==========================================
// 7. CONTROLS & INPUT
// ==========================================
function attachTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('mouseup', (e) => { e.preventDefault(); keys[key] = false; });
}

function attachClick(id, action) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); action(); });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); action(); });
}

attachTouch('btn-gas', 'w');
attachTouch('btn-brake', 's');
attachTouch('btn-left', 'a');
attachTouch('btn-right', 'd');
attachTouch('btn-drift', ' ');

attachClick('btn-reset', () => { keys.r = true; setTimeout(() => keys.r = false, 100); });
attachClick('btn-cam', () => { cameraMode = (cameraMode + 1) % 3; });
attachClick('btn-car', () => { 
    currentCarIndex = (currentCarIndex + 1) % carConfigs.length;
    spawnCar(currentCarIndex);
});

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    const key = e.key.toLowerCase();
    if(keys.hasOwnProperty(key) || e.key === ' ') keys[e.key === ' ' ? ' ' : key] = true;
    
    if(key === 'c' && !cKeyPressed) {
        cKeyPressed = true;
        cameraMode = (cameraMode + 1) % 3; 
    }
    if(key === 'v' && !vKeyPressed) {
        vKeyPressed = true;
        currentCarIndex = (currentCarIndex + 1) % carConfigs.length;
        spawnCar(currentCarIndex);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if(keys.hasOwnProperty(key) || e.key === ' ') keys[e.key === ' ' ? ' ' : key] = false;
    if(key === 'c') cKeyPressed = false;
    if(key === 'v') vKeyPressed = false;
});

// ==========================================
// 8. COLLECTIBLES & GAME LOGIC
// ==========================================
const coins = []; 

function createCoin(x, z) {
    const coinGroup = new THREE.Group();
    coinGroup.position.set(x, 1, z);
    
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 20); 
    geo.rotateZ(Math.PI / 2); 
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffaa00, emissiveIntensity: 0.5
    });
    const coinMesh = new THREE.Mesh(geo, mat);
    coinMesh.castShadow = false; 
    coinGroup.add(coinMesh); 

    // Mini-map Icon
    const mapIconGeo = new THREE.CircleGeometry(4, 8); 
    const mapIconMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mapIcon = new THREE.Mesh(mapIconGeo, mapIconMat);
    mapIcon.rotation.x = -Math.PI / 2; 
    mapIcon.position.y = 20; 
    coinGroup.add(mapIcon); 

    scene.add(coinGroup);
    coins.push({ group: coinGroup, mesh: coinMesh }); 
}

for (let i = 0; i < 100; i++) {
    let x = (Math.random() - 0.5) * 900;
    let z = (Math.random() - 0.5) * 900;
    if (Math.abs(x) < 10 && Math.abs(z) < 10) continue; 
    createCoin(x, z);
}

// Timer Loop
const gameTimer = setInterval(() => {
    if (gameActive) {
        timeLeft--;
        timerEl.innerText = "TIME: " + timeLeft;
        if (timeLeft <= 0) endGame();
    }
}, 1000);

function endGame() {
    gameActive = false;
    clearInterval(gameTimer);
    gameOverEl.style.display = 'flex';
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('gtaHighScore', highScore);
    }
    finalScoreEl.innerHTML = score + "<br><span style='font-size:20px; color:#aaa'>High Score: " + highScore + "</span>";
    currentSpeed = 0;
}

// ==========================================
// 9. MAIN GAME LOOP
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    world.fixedStep();

    // World Wrapping Logic
    const limit = 500; 
    const buffer = 490;
    if (boxBody.position.x > limit) boxBody.position.x = -buffer;
    else if (boxBody.position.x < -limit) boxBody.position.x = buffer;
    if (boxBody.position.z > limit) boxBody.position.z = -buffer;
    else if (boxBody.position.z < -limit) boxBody.position.z = buffer;

    // Reset Logic
    if (keys.r) {
        boxBody.position.y += 3; 
        boxBody.quaternion.set(0, 0, 0, 1);
        boxBody.velocity.set(0, 0, 0);
        boxBody.angularVelocity.set(0, 0, 0);
        currentSpeed = 0;
    }

    // Driving Physics
    const stats = carConfigs[currentCarIndex]; 
    if (gameActive) {
        const isDrifting = keys[' '];
        const baseTurn = isDrifting ? 0.08 : 0.04; 
        
        if (keys.a) carAngle += baseTurn;
        if (keys.d) carAngle -= baseTurn;
        boxBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), carAngle);

        if (keys.w) {
            if (currentSpeed > -stats.maxSpeed) currentSpeed -= stats.accel;
        } else if (keys.s) {
            if (currentSpeed < stats.maxSpeed / 2) currentSpeed += stats.accel;
        } else {
            if (Math.abs(currentSpeed) < 0.2) currentSpeed = 0;
            else currentSpeed += (currentSpeed < 0 ? 0.2 : -0.2); // Friction
        }
    } else {
        currentSpeed *= 0.95; // Game over friction
    }

    // Apply Velocity
    const targetVx = Math.sin(carAngle) * currentSpeed;
    const targetVz = Math.cos(carAngle) * currentSpeed;
    const grip = keys[' '] ? 0.02 : stats.grip; 
    
    boxBody.velocity.x = THREE.MathUtils.lerp(boxBody.velocity.x, targetVx, grip);
    boxBody.velocity.z = THREE.MathUtils.lerp(boxBody.velocity.z, targetVz, grip);
    boxBody.velocity.y = boxBody.velocity.y; // Preserve gravity

    // Sync Visuals
    carMesh.position.copy(boxBody.position);
    carMesh.position.y -= 0.6; 
    carMesh.quaternion.copy(boxBody.quaternion);

    // Coin Collision
    if (gameActive) {
        for (let i = 0; i < coins.length; i++) {
            const coinObj = coins[i];
            coinObj.mesh.rotation.x += 0.05;
            if (carMesh.position.distanceTo(coinObj.group.position) < 3) { 
                scene.remove(coinObj.group);
                coins.splice(i, 1);
                i--; 
                score += 10;
                scoreEl.innerHTML = "SCORE: " + score;
            }
        }
    }

    // --- RENDER PIPELINE ---
    renderer.setScissorTest(true);

    // 1. Main Camera Render
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    
    // Camera Follow Logic
    if (cameraMode === 0) { // Third Person
        const offset = 15;
        camera.position.set(
            carMesh.position.x - Math.sin(carAngle) * -offset,
            carMesh.position.y + 6,
            carMesh.position.z - Math.cos(carAngle) * -offset
        );
        camera.lookAt(carMesh.position);
    } else if (cameraMode === 1) { // First Person
        camera.position.copy(carMesh.position);
        camera.position.y += 1.5; 
        camera.lookAt(
            carMesh.position.x - Math.sin(carAngle) * 20,
            carMesh.position.y + 1.5,
            carMesh.position.z - Math.cos(carAngle) * 20
        );
    } else if (cameraMode === 2) { // Top Down
        camera.position.set(carMesh.position.x, carMesh.position.y + 40, carMesh.position.z + 10);
        camera.lookAt(carMesh.position);
    }
    renderer.render(scene, camera);

    // 2. Mini-Map Render
    const mapSizePx = 200; 
    const responsiveMapSize = (window.innerWidth < 400) ? 160 : 200;
    renderer.setViewport(20, 20, responsiveMapSize, responsiveMapSize);
    renderer.setScissor(20, 20, responsiveMapSize, responsiveMapSize);
    
    mapCamera.position.x = carMesh.position.x;
    mapCamera.position.z = carMesh.position.z;
    mapCamera.rotation.z = carAngle; 
    renderer.render(scene, mapCamera);

    renderer.setScissorTest(false);

    // Update Speedometer UI
    const velocityMagnitude = Math.sqrt(boxBody.velocity.x**2 + boxBody.velocity.z**2);
    if(speedometer) speedometer.innerHTML = Math.round(velocityMagnitude * 3.6) + ' <span>km/h</span>';
}

// Window Resize Handler (Responsive FOV)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (camera.aspect < 1) ? 100 : 75; // Wider FOV for portrait mobile
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
// Init resize logic
window.dispatchEvent(new Event('resize'));

animate();
