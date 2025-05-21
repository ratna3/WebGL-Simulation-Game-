class Player {
    constructor(camera, scene, world) {
        debugLog("Player constructor called");
        
        this.camera = camera;
        this.scene = scene;
        this.world = world;
        
        // Player state
        this.health = 100;
        this.alive = true;
        
        // Movement properties
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.speed = 10;
        
        // Physics body
        this.body = null;
        
        // Controls
        this.controls = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        try {
            debugLog("Initializing player");
            
            // Set up physics body
            this.setupPhysics();
            
            // Set up controls
            this.setupControls();
            
            // Set up input handlers
            this.setupInputHandlers();
            
            debugLog("Player initialized successfully");
        } catch (error) {
            debugLog(`ERROR: Player initialization failed: ${error.message}`);
            console.error(error);
        }
    }
    
    setupPhysics() {
        // Create simple physics body for player
        const radius = 0.5;
        const playerShape = new CANNON.Sphere(radius);
        
        this.body = new CANNON.Body({
            mass: 70, // kg
            position: new CANNON.Vec3(0, 2, 0)
        });
        this.body.addShape(playerShape);
        
        // Prevent rotation
        this.body.fixedRotation = true;
        this.body.updateMassProperties();
        
        // Add to physics world
        this.world.addBody(this.body);
    }
    
    setupControls() {
        try {
            // Check if PointerLockControls is available
            if (typeof THREE.PointerLockControls === 'function') {
                debugLog("Creating PointerLockControls");
                this.controls = new THREE.PointerLockControls(this.camera, document.body);
                
                // Listen for pointer lock changes
                document.addEventListener('pointerlockchange', () => {
                    const locked = document.pointerLockElement === document.body;
                    debugLog(`Pointer lock state changed: ${locked ? 'locked' : 'unlocked'}`);
                });
            } else {
                debugLog("WARNING: THREE.PointerLockControls not available");
                
                // Create simple controls object as fallback
                this.controls = {
                    isLocked: false,
                    lock: function() {
                        debugLog("Mock controls lock called");
                        document.body.requestPointerLock();
                    },
                    unlock: function() {
                        debugLog("Mock controls unlock called");
                    }
                };
            }
        } catch (error) {
            debugLog(`ERROR: Failed to setup controls: ${error.message}`);
            console.error(error);
        }
    }
    
    setupInputHandlers() {
        debugLog("Setting up input handlers");
        
        // Keyboard handlers
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space': this.jump = true; break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyD': this.moveRight = false; break;
                case 'Space': this.jump = false; break;
            }
        });
        
        // Handle pointer lock for first-person view
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                this.controls.lock();
            }
        });
    }
    
    update(delta) {
        if (!this.alive) return;
        
        try {
            // Process movement
            this.processMovement(delta);
            
            // Update camera position based on physics body
            if (this.body) {
                this.camera.position.x = this.body.position.x;
                this.camera.position.y = this.body.position.y + 1.7; // Eye height
                this.camera.position.z = this.body.position.z;
            }
            
            // Handle falling out of world
            if (this.body && this.body.position.y < -10) {
                // Reset position
                this.body.position.set(0, 5, 0);
                this.body.velocity.set(0, 0, 0);
            }
        } catch (error) {
            debugLog(`ERROR: Player update failed: ${error.message}`);
        }
    }
    
    processMovement(delta) {
        // Only process movement if controls are locked (first person active)
        const isLocked = document.pointerLockElement === document.body;
        if (!isLocked || !this.body) return;
        
        // Get current velocity
        const velocity = this.body.velocity;
        
        // Apply friction
        velocity.x *= 0.9;
        velocity.z *= 0.9;
        
        // Get movement direction from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        direction.y = 0; // Keep it horizontal
        direction.normalize();
        
        // Calculate right vector
        const right = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Apply movement based on keys
        const moveSpeed = this.speed * delta;
        
        if (this.moveForward) {
            velocity.x += direction.x * moveSpeed;
            velocity.z += direction.z * moveSpeed;
        }
        
        if (this.moveBackward) {
            velocity.x -= direction.x * moveSpeed;
            velocity.z -= direction.z * moveSpeed;
        }
        
        if (this.moveRight) {
            velocity.x += right.x * moveSpeed;
            velocity.z += right.z * moveSpeed;
        }
        
        if (this.moveLeft) {
            velocity.x -= right.x * moveSpeed;
            velocity.z -= right.z * moveSpeed;
        }
        
        // Handle jumping - check if on ground first
        if (this.jump) {
            // Simple ground check
            const ray = new CANNON.Ray(this.body.position, new CANNON.Vec3(0, -1, 0));
            const result = this.world.rayTest(ray.from, ray.to);
            
            if (result.length > 0 && result[0].distance < 1.5) {
                velocity.y = 10; // Jump force
                debugLog("Player jumped");
            }
            
            this.jump = false;
        }
    }
}
