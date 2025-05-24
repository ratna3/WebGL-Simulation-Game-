class Player {
    constructor(camera, scene, world) {
        console.log("Creating player");
        this.camera = camera;
        this.scene = scene;
        this.world = world;
        
        // Player state
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;
        
        // Movement properties
        this.moveSpeed = 50;      // Increased for better responsiveness
        this.sprintSpeed = 80;    // Sprint speed
        this.jumpForce = 20;      // Stronger jump
        
        // Physics properties
        this.body = null;
        this.height = 1.8;
        this.radius = 0.4;
        this.eyeHeight = 1.7;
        
        // Movement flags - simplified and more reliable
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            sprint: false
        };
        
        this.onGround = false;
        
        // Controls
        this.controls = null;
        
        // Debug
        this.debug = true;
        this.lastLogTime = 0;
        
        // Initialize
        this.init();
        
        // Make player accessible for debugging
        window.playerInstance = this;
    }
    
    init() {
        try {
            console.log("Initializing player");
            
            // Create physics body first
            this.setupPhysics();
            
            // Set up controls
            this.setupControls();
            
            // Set up input handlers
            this.setupInputHandlers();
            
            console.log("Player initialized successfully");
        } catch (error) {
            console.error("Error initializing player:", error);
        }
    }
    
    setupPhysics() {
        try {
            // Create physics body
            const shape = new CANNON.Sphere(this.radius);
            
            this.body = new CANNON.Body({
                mass: 70,  // kg
                material: new CANNON.Material({
                    friction: 0.1,     // Low friction for smooth movement
                    restitution: 0.0   // No bounce
                }),
                fixedRotation: true,   // Prevent rotation
                allowSleep: false      // Never sleep for consistent updates
            });
            
            // Add shape to body
            this.body.addShape(shape);
            
            // Position body above ground
            this.body.position.set(0, this.height / 2 + 2, 0);
            
            // Add to physics world
            this.world.addBody(this.body);
            
            console.log("Player physics initialized");
        } catch (error) {
            console.error("Error setting up player physics:", error);
        }
    }
    
    setupControls() {
        try {
            if (typeof THREE.PointerLockControls === 'function') {
                console.log("Creating PointerLockControls");
                this.controls = new THREE.PointerLockControls(this.camera, document.body);
            } else {
                console.error("THREE.PointerLockControls not found!");
                alert("Movement controls could not be initialized. Please refresh the page.");
            }
        } catch (error) {
            console.error("Error setting up controls:", error);
        }
    }
    
    setupInputHandlers() {
        console.log("Setting up player input handlers");
        
        // KEYBOARD INPUT HANDLERS - Simplified and more reliable
        
        // Handle key down events
        document.addEventListener('keydown', (event) => {
            if (!this.alive) return;
            
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    event.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    event.preventDefault();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    event.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    event.preventDefault();
                    break;
                case 'Space':
                    this.keys.jump = true;
                    event.preventDefault();
                    break;
                case 'ShiftLeft': 
                case 'ShiftRight': 
                    this.keys.sprint = true;
                    event.preventDefault();
                    break;
            }
            
            if (this.debug && event.code === 'KeyP') {
                // Debug key
                console.log("Player position:", this.body.position);
                console.log("Player velocity:", this.body.velocity);
                console.log("Movement states:", this.keys);
                console.log("On ground:", this.onGround);
            }
        });
        
        // Handle key up events
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.jump = false;
                    break;
                case 'ShiftLeft': 
                case 'ShiftRight': 
                    this.keys.sprint = false;
                    break;
            }
        });
        
        // Handle pointer lock for camera control
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body && this.controls) {
                this.controls.lock();
            }
        });
        
        // Listen for pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            console.log("Pointer lock state changed:", document.pointerLockElement === document.body ? "locked" : "unlocked");
        });
        
        console.log("Input handlers initialized");
        console.log("Controls: W/A/S/D to move, Space to jump, Shift to sprint, P for debug info");
    }
    
    update(delta) {
        if (!this.alive || !this.body) return;
        
        try {
            // Check for ground contact
            this.checkGround();
            
            // Process movement regardless of pointer lock for testing
            this.processMovement(delta);
            
            // Update camera position to match physics body
            this.updateCamera();
            
            // Periodic debug logging
            if (this.debug && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right)) {
                const now = Date.now();
                if (now - this.lastLogTime > 2000) { // Log every 2 seconds
                    console.log("Movement active:", {
                        position: this.body.position,
                        velocity: this.body.velocity,
                        onGround: this.onGround,
                        keys: this.keys
                    });
                    this.lastLogTime = now;
                }
            }
            
            // Check if player has fallen out of world
            if (this.body.position.y < -20) {
                this.resetPosition();
            }
        } catch (error) {
            console.error("Error in player update:", error);
        }
    }
    
    processMovement(delta) {
        // Skip if no body
        if (!this.body) return;
        
        // Get velocity
        const velocity = this.body.velocity;
        
        // Apply horizontal damping for better control
        velocity.x *= 0.8;
        velocity.z *= 0.8;
        
        // Calculate movement speed
        const currentSpeed = this.keys.sprint ? this.sprintSpeed : this.moveSpeed;
        
        // Get camera direction for movement relative to look direction
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Create forward and right vectors
        const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
        
        // Calculate movement vector
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.forward) {
            moveVector.add(forward);
        }
        if (this.keys.backward) {
            moveVector.sub(forward);
        }
        if (this.keys.right) {
            moveVector.add(right);
        }
        if (this.keys.left) {
            moveVector.sub(right);
        }
        
        // Normalize diagonal movement
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply movement force
            const force = currentSpeed * delta * 10; // Adjust multiplier as needed
            velocity.x += moveVector.x * force;
            velocity.z += moveVector.z * force;
        }
        
        // Handle jumping - only if on ground
        if (this.keys.jump && this.onGround) {
            velocity.y = this.jumpForce;
            this.onGround = false;
            console.log("Jump! Force:", this.jumpForce);
        }
        
        // Cap horizontal velocity to prevent excessive speed
        const maxSpeed = currentSpeed / 2;
        const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (horizontalSpeed > maxSpeed) {
            velocity.x = (velocity.x / horizontalSpeed) * maxSpeed;
            velocity.z = (velocity.z / horizontalSpeed) * maxSpeed;
        }
    }
    
    checkGround() {
        // Cast a ray downward to detect ground
        const start = this.body.position.clone();
        const end = new CANNON.Vec3(start.x, start.y - (this.radius + 0.3), start.z);
        
        // Simple ground check based on velocity and position
        const wasOnGround = this.onGround;
        this.onGround = this.body.position.y <= (this.radius + 0.1) && Math.abs(this.body.velocity.y) < 1;
        
        if (!wasOnGround && this.onGround) {
            console.log("Landed on ground");
        }
    }
    
    updateCamera() {
        if (!this.camera || !this.body) return;
        
        // Position camera at eye height
        const pos = this.body.position;
        this.camera.position.set(pos.x, pos.y + this.eyeHeight - this.radius, pos.z);
    }
    
    resetPosition() {
        if (!this.body) return;
        
        // Reset player if they fall out of the world
        this.body.position.set(0, 5, 0);
        this.body.velocity.set(0, 0, 0);
        console.log("Player position reset");
    }
}

// Export Player class
window.Player = Player;
