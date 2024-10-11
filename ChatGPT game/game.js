// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set spooky fog and background color
scene.fog = new THREE.Fog(0x000000, 10, 200);  // Black fog, larger distance
renderer.setClearColor(0x000000, 1);  // Black background

// Ambient lighting to make the scene darker
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);  // Low intensity ambient light
scene.add(ambientLight);

// Point light for the player (like a dim lantern)
const pointLight = new THREE.PointLight(0xffa500, 0.4, 50);  // Soft orange glow
pointLight.position.set(5, 10, 5);
scene.add(pointLight);

// Ground plane (dark brown for dirt)
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x4b2e1a });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), groundMaterial);  // Larger area
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Camera initial position
const playerHeight = 1.6;
camera.position.set(0, playerHeight, 20);
camera.lookAt(new THREE.Vector3(0, playerHeight, 0));

// Lock pointer to the screen for mouse movement
let pointerLocked = false;
document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    pointerLocked = !!document.pointerLockElement;
});

// Mouse movement sensitivity
const sensitivity = 0.002;
let yaw = 0;

// Mouse move event
document.addEventListener('mousemove', (event) => {
    if (pointerLocked) {
        yaw -= event.movementX * sensitivity;
        camera.rotation.set(0, yaw, 0);
    }
});

// Movement variables
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let running = false;
const walkSpeed = 0.05;  // Increased walking speed
const runSpeed = 0.1;    // Increased running speed

// Keyboard movement controls
document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            running = true;
            break;
        case 'KeyH':  // Press H to toggle trees and rocks visibility
            toggleTreesAndRocks();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            running = false;
            break;
    }
});

// Collision detection array
const collidableObjects = [];

// Create trees with more leaves and natural obstacles (like rocks)
const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x654321 });
const leavesMaterial = new THREE.MeshBasicMaterial({ color: 0x007A33 });
const rockMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });

const treeGeometry = new THREE.CylinderGeometry(0.2, 0.5, 5, 12);
const leavesGeometry = new THREE.SphereGeometry(1.5, 16, 16);
const rockGeometry = new THREE.DodecahedronGeometry(1, 0);

const trees = [];
const rocks = [];

// Create trees and rocks
for (let i = 0; i < 400; i++) {  // More trees over a wider area
    const tree = new THREE.Mesh(treeGeometry, treeMaterial);
    const leavesTop = new THREE.Mesh(leavesGeometry, leavesMaterial);
    const leavesSide1 = new THREE.Mesh(leavesGeometry, leavesMaterial);
    const leavesSide2 = new THREE.Mesh(leavesGeometry, leavesMaterial);
    const leavesSide3 = new THREE.Mesh(leavesGeometry, leavesMaterial);

    let xPos, zPos;
    do {
        xPos = Math.random() * 160 - 80;  // Larger forest area
        zPos = Math.random() * 160 - 80;
    } while ((Math.abs(zPos + 30) < 10 && Math.abs(xPos) < 10));  // Avoid trees near the center

    tree.position.set(xPos, 2.5, zPos);
    leavesTop.position.set(xPos, 6, zPos);
    leavesSide1.position.set(xPos + 1, 6, zPos);
    leavesSide2.position.set(xPos - 1, 6, zPos);
    leavesSide3.position.set(xPos, 6, zPos + 1);

    collidableObjects.push(tree);
    trees.push(tree);
    scene.add(tree);
    scene.add(leavesTop);
    scene.add(leavesSide1);
    scene.add(leavesSide2);
    scene.add(leavesSide3);

    // Randomly add rocks as obstacles
    if (Math.random() > 0.5) {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(xPos + Math.random() * 5 - 2.5, 1, zPos + Math.random() * 5 - 2.5);
        rock.scale.set(1.5, 1.5, 1.5);
        collidableObjects.push(rock);
        rocks.push(rock);
        scene.add(rock);
    }
}

// Create the random purple block with neon effect and player size
const purpleMaterial = new THREE.MeshStandardMaterial({ color: 0xA500FF }); // More neon purple
const purpleBlock = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), purpleMaterial); // Match player height
purpleBlock.position.set(Math.random() * 160 - 80, 0.8, Math.random() * 160 - 80);  // Random position
scene.add(purpleBlock);

// Raycaster for checking visibility
const raycaster = new THREE.Raycaster();
let lookingAtBlock = false;
let blockTimer = 0;

// Function to toggle trees and rocks visibility
function toggleTreesAndRocks() {
    const visible = trees[0].visible;  // Get the visibility state from the first tree

    trees.forEach(tree => {
        tree.visible = !visible;  // Toggle visibility
    });
    rocks.forEach(rock => {
        rock.visible = !visible;  // Toggle visibility
    });
}

// Function to reposition the purple block randomly
function repositionPurpleBlock() {
    purpleBlock.position.set(Math.random() * 160 - 80, 0.8, Math.random() * 160 - 80);
}

// Load Bob 3D Model (GLTFLoader)
const loader = new THREE.GLTFLoader();
let bobModel; // Store the loaded Bob model

loader.load(
    'models/Bob.glb', // Path to your GLB model file
    function(gltf) {
        bobModel = gltf.scene;
        bobModel.scale.set(2, 2, 2);  // Adjust scale
        bobModel.position.set(0, 0, 0);  // Adjust position if necessary
        scene.add(bobModel);
    },
    function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');  // Progress
    },
    function(error) {
        console.error('An error occurred while loading Bob', error);  // Error handling
    }
);

// Bob's movement speed
const bobSpeed = 0.02; // Speed at which Bob moves toward the player

// Update movement and collision detection
function update() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const speed = running ? runSpeed : walkSpeed;
    const newPosition = camera.position.clone();

    if (moveForward) newPosition.add(forward.clone().multiplyScalar(speed));
    if (moveBackward) newPosition.add(forward.clone().multiplyScalar(-speed));
    if (moveLeft) newPosition.add(right.clone().multiplyScalar(-speed));
    if (moveRight) newPosition.add(right.clone().multiplyScalar(speed));

    // Check for collisions with objects in the collidableObjects array
    for (let i = 0; i < collidableObjects.length; i++) {
        const object = collidableObjects[i];
        const box = new THREE.Box3().setFromObject(object);
        if (box.containsPoint(newPosition)) {
            return;  // Stop the movement if collision detected
        }
    }

    camera.position.copy(newPosition);

    // Check if player is looking at the purple block
    raycaster.set(camera.position, forward);
    const intersects = raycaster.intersectObject(purpleBlock);

    if (intersects.length > 0) {
        if (!lookingAtBlock) {
            lookingAtBlock = true;
            blockTimer = 0;  // Reset the timer when first detected
        }

        blockTimer += 1;  // Increment timer while looking at the block

        if (blockTimer >= 100) {  // 100 frames delay before disappearing
            repositionPurpleBlock();
            lookingAtBlock = false;
        }
    } else {
        lookingAtBlock = false;
        blockTimer = 0;
    }

    // Move Bob towards the player
    if (bobModel) {
        const bobPosition = bobModel.position.clone();
        const playerPosition = camera.position.clone();

        // Calculate direction from Bob to player
        const direction = playerPosition.sub(bobPosition).normalize();

        // Move Bob towards the player
        const nextBobPosition = bobPosition.add(direction.multiplyScalar(bobSpeed));

        // Check for collisions with other objects
        let canMoveBob = true;
        for (let i = 0; i < collidableObjects.length; i++) {
            const object = collidableObjects[i];
            const box = new THREE.Box3().setFromObject(object);
            if (box.containsPoint(nextBobPosition)) {
                canMoveBob = false;  // Stop Bob if collision detected
                break;
            }
        }

        // Update Bob's position if there are no collisions
        if (canMoveBob) {
            bobModel.position.copy(nextBobPosition);
        }
    }

    // Render the scene
    renderer.render(scene, camera);

    // Request next animation frame
    requestAnimationFrame(update);
}

// Start the update loop
update();
