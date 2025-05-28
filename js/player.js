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
        this.dialogueLocked = false; // For dialogue system
        
        // Add weapon
        this.weapon = null;
        
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
            sprint: false,
            interact: false // Add interaction key
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
            
            // Initialize weapon
            this.setupWeapon();
            
            console.log("Player initialized successfully");
        } catch (error) {
            console.error("Error initializing player:", error);
        }
    }
    
    setupWeapon() {
        try {
            this.weapon = new Weapon(this.scene, this.camera, this.world);
            console.log("Player weapon initialized");
        } catch (error) {
            console.error("Error setting up weapon:", error);
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
            // Check if PointerLockControls is available
            if (typeof THREE.PointerLockControls === 'function') {
                console.log("Creating PointerLockControls");
                this.controls = new THREE.PointerLockControls(this.camera, document.body);
                
                // Add controls to scene so they work properly
                this.scene.add(this.controls.getObject());
                
                // Set up pointer lock event handlers
                this.setupPointerLockEvents();
                
            } else {
                console.warn("THREE.PointerLockControls not available - using fallback");
                // Create a fallback object that won't break the game
                this.controls = {
                    lock: () => console.log("Pointer lock not available"),
                    unlock: () => console.log("Pointer lock not available"),
                    isLocked: false,
                    getObject: () => new THREE.Object3D()
                };
            }
        } catch (error) {
            console.error("Error setting up controls:", error);
            // Create fallback controls
            this.controls = {
                lock: () => console.log("Controls unavailable"),
                unlock: () => console.log("Controls unavailable"),
                isLocked: false,
                getObject: () => new THREE.Object3D()
            };
        }
    }
    
    setupPointerLockEvents() {
        // Add a small delay to prevent immediate pointer lock requests
        this.pointerLockCooldown = 0;
        this.lastPointerLockRequest = 0;
        
        // Handle pointer lock changes
        const onPointerLockChange = () => {
            if (document.pointerLockElement === document.body) {
                this.controls.isLocked = true;
                console.log("Pointer lock acquired successfully");
                // Hide cursor and show game UI
                document.body.style.cursor = 'none';
            } else {
                this.controls.isLocked = false;
                console.log("Pointer lock released");
                // Show cursor
                document.body.style.cursor = 'default';
            }
        };
        
        const onPointerLockError = (event) => {
            console.warn("Pointer lock error (this is normal):", event.type);
            this.controls.isLocked = false;
            // Reset cooldown on error
            this.pointerLockCooldown = Date.now() + 1000; // 1 second cooldown
        };
        
        // Add event listeners for all browsers
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('pointerlockerror', onPointerLockError);
        
        // Vendor prefixes
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockerror', onPointerLockError);
        document.addEventListener('webkitpointerlockerror', onPointerLockError);
    }
    
    setupInputHandlers() {
        console.log("Setting up player input handlers");
        
        // Safe pointer lock request function
        const requestPointerLockSafely = () => {
            const now = Date.now();
            
            // Check cooldown to prevent spam requests
            if (now < this.pointerLockCooldown) {
                console.log("Pointer lock request on cooldown");
                return false;
            }
            
            // Check if already locked
            if (document.pointerLockElement === document.body) {
                console.log("Pointer lock already active");
                return true;
            }
            
            // Check if dialogue is active
            if (this.dialogueLocked) {
                console.log("Cannot lock pointer during dialogue");
                return false;
            }
            
            // Check if controls are available
            if (!this.controls || typeof this.controls.lock !== 'function') {
                console.log("Controls not available for pointer lock");
                return false;
            }
            
            // Prevent rapid requests
            if (now - this.lastPointerLockRequest < 500) {
                console.log("Too soon since last pointer lock request");
                return false;
            }
            
            try {
                console.log("Requesting pointer lock...");
                this.lastPointerLockRequest = now;
                this.controls.lock();
                return true;
            } catch (error) {
                console.warn("Pointer lock request failed:", error);
                this.pointerLockCooldown = now + 2000; // 2 second cooldown on error
                return false;
            }
        };
        
        // Handle click events for pointer lock
        document.addEventListener('click', (event) => {
            // Only try to lock if game is active and not in dialogue
            if (!this.dialogueLocked && document.pointerLockElement !== document.body) {
                // Add delay to ensure click event is complete
                setTimeout(() => {
                    requestPointerLockSafely();
                }, 100);
            }
        });
        
        // Add a specific game area click handler
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.addEventListener('click', (event) => {
                if (!this.dialogueLocked) {
                    setTimeout(() => {
                        requestPointerLockSafely();
                    }, 150);
                }
            });
        }
        
        // KEYBOARD INPUT HANDLERS
        
        // Handle key down events
        document.addEventListener('keydown', (event) => {
            if (!this.alive) return;
            
            // Don't process movement if dialogue is active (except weapon controls)
            if (this.dialogueLocked && !['KeyE', 'Tab', 'KeyR', 'Escape'].includes(event.code)) {
                return;
            }
            
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    if (!this.dialogueLocked) {
                        this.keys.forward = true;
                        // Auto-request pointer lock when starting to move
                        if (!document.pointerLockElement) {
                            setTimeout(() => requestPointerLockSafely(), 100);
                        }
                    }
                    event.preventDefault();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    if (!this.dialogueLocked) this.keys.backward = true;
                    event.preventDefault();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    if (!this.dialogueLocked) this.keys.left = true;
                    event.preventDefault();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    if (!this.dialogueLocked) this.keys.right = true;
                    event.preventDefault();
                    break;
                case 'Space':
                    if (!this.dialogueLocked) this.keys.jump = true;
                    event.preventDefault();
                    break;
                case 'ShiftLeft': 
                case 'ShiftRight': 
                    if (!this.dialogueLocked) this.keys.sprint = true;
                    event.preventDefault();
                    break;
                case 'KeyE':
                    this.keys.interact = true;
                    this.handleInteraction();
                    event.preventDefault();
                    break;
                case 'Escape':
                    // Release pointer lock on Escape
                    if (document.pointerLockElement === document.body) {
                        document.exitPointerLock();
                    }
                    event.preventDefault();
                    break;
                case 'Tab':
                    // Toggle weapon - FIX: Make sure this works properly
                    if (this.weapon) {
                        console.log(`Current weapon state: ${this.weapon.isEquipped ? 'equipped' : 'holstered'}`);
                        if (this.weapon.isEquipped) {
                            this.weapon.holster();
                            console.log("Weapon holstered via Tab key");
                        } else {
                            this.weapon.equip();
                            console.log("Weapon equipped via Tab key");
                        }
                    } else {
                        console.log("No weapon available to toggle");
                    }
                    event.preventDefault();
                    break;
                case 'KeyR':
                    // Reload weapon
                    if (this.weapon && this.weapon.isEquipped) {
                        this.weapon.reload();
                    }
                    event.preventDefault();
                    break;
            }
            
            if (this.debug && event.code === 'KeyP') {
                // Debug key
                console.log("=== PLAYER DEBUG INFO ===");
                console.log("Position:", this.body.position);
                console.log("Velocity:", this.body.velocity);
                console.log("Movement states:", this.keys);
                console.log("On ground:", this.onGround);
                console.log("Pointer lock:", document.pointerLockElement === document.body);
                console.log("Controls locked:", this.controls.isLocked);
                if (this.weapon) {
                    console.log("Weapon equipped:", this.weapon.isEquipped);
                    console.log("Weapon ammo:", this.weapon.currentAmmo + "/" + this.weapon.maxAmmo);
                }
                console.log("========================");
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
                case 'KeyE':
                    this.keys.interact = false;
                    break;
                // Don't handle Tab in keyup to avoid conflicts
            }
        });
        
        // Handle mouse events for weapon firing
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.weapon && this.weapon.isEquipped && document.pointerLockElement === document.body) {
                // Left click to fire
                this.weapon.fire();
            }
        });
        
        // Show helpful messages
        console.log("Input handlers initialized");
        console.log("Controls: W/A/S/D to move, Space to jump, Shift to sprint, E to interact");
        console.log("Weapon Controls: Tab to equip/holster, Left Click to shoot, R to reload");
        console.log("Click in the game area to enable mouse look (Escape to release)");
    }
    
    handleInteraction() {
        if (!window.game || !window.game.npcManager || !window.game.dialogueSystem) return;
        
        const playerPos = this.body.position;
        const nearestNPC = window.game.npcManager.getNearestNPC(playerPos, 3);
        
        if (nearestNPC.npc && nearestNPC.distance < 3) {
            console.log("Interacting with", nearestNPC.npc.name);
            window.game.dialogueSystem.startDialogue(nearestNPC.npc);
        } else {
            console.log("No NPC nearby to interact with");
        }
    }
    
    update(delta) {
        if (!this.alive || !this.body) return;
        
        try {
            // Check for ground contact
            this.checkGround();
            
            // Process movement only if not in dialogue
            if (!this.dialogueLocked) {
                this.processMovement(delta);
            }
            
            // Update camera position to match physics body
            this.updateCamera();
            
            // Update weapon
            if (this.weapon) {
                this.weapon.update(delta);
            }
            
            // Hide interaction prompt if moving away from NPCs
            if (window.game && window.game.dialogueSystem) {
                const playerPos = this.body.position;
                const nearestNPC = window.game.npcManager ? 
                    window.game.npcManager.getNearestNPC(playerPos, 3) : { distance: Infinity };
                
                if (nearestNPC.distance > 3) {
                    window.game.dialogueSystem.hideInteractionPrompt();
                }
            }
            
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
