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
            console.log("Setting up player weapon...");
            this.weapon = new Weapon(this.scene, this.camera, this.world);
            
            // Add debugging for weapon setup
            if (this.weapon) {
                console.log("Weapon created successfully");
                console.log("Weapon group exists:", !!this.weapon.weaponGroup);
                console.log("Weapon model exists:", !!this.weapon.weaponModel);
                
                // DO NOT auto-equip weapon - player should start with weapon holstered
                console.log("Weapon created but remains holstered (press Tab to equip)");
                
                // Update ammo display to show holstered state
                setTimeout(() => {
                    this.weapon.updateAmmoDisplay();
                }, 100);
                
                // Add periodic weapon visibility check
                this.weaponVisibilityInterval = setInterval(() => {
                    if (this.weapon && this.weapon.isEquipped) {
                        if (!this.weapon.weaponGroup.visible || !this.weapon.weaponModel.visible) {
                            console.warn("Weapon visibility lost, forcing visible...");
                            this.weapon.forceVisible();
                        }
                    }
                }, 2000); // Check every 2 seconds
                
            } else {
                console.error("Failed to create weapon");
            }
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
            const isLocked = document.pointerLockElement === document.body;
            
            if (this.controls) {
                this.controls.isLocked = isLocked;
            }
            
            console.log("Pointer lock changed:", isLocked);
            
            if (isLocked) {
                console.log("Mouse locked - WASD to move, mouse to look");
            } else {
                console.log("Mouse unlocked - click to re-enable mouse look");
            }
        };
        
        const onPointerLockError = (event) => {
            console.error("Pointer lock error:", event);
        };
        
        // Add event listeners for pointer lock
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', onPointerLockChange);
        
        document.addEventListener('pointerlockerror', onPointerLockError);
        document.addEventListener('mozpointerlockerror', onPointerLockError);
        document.addEventListener('webkitpointerlockerror', onPointerLockError);
        
        // Click to enable pointer lock
        document.addEventListener('click', () => {
            const now = Date.now();
            if (now - this.lastPointerLockRequest > this.pointerLockCooldown && !document.pointerLockElement) {
                this.lastPointerLockRequest = now;
                this.pointerLockCooldown = 1000; // 1 second cooldown
                
                if (this.controls && typeof this.controls.lock === 'function') {
                    try {
                        this.controls.lock();
                    } catch (error) {
                        console.warn("Could not enable pointer lock:", error);
                    }
                }
            }
        });
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
        
        // Keyboard event handlers
        const keyHandler = (event, pressed) => {
            if (this.dialogueLocked) return; // Don't process movement when in dialogue
            
            switch (event.code) {
                case 'KeyW':
                    this.keys.forward = pressed;
                    break;
                case 'KeyS':
                    this.keys.backward = pressed;
                    break;
                case 'KeyA':
                    this.keys.left = pressed;
                    break;
                case 'KeyD':
                    this.keys.right = pressed;
                    break;
                case 'Space':
                    this.keys.jump = pressed;
                    event.preventDefault();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.sprint = pressed;
                    break;
                case 'KeyE':
                    this.keys.interact = pressed;
                    if (pressed) {
                        console.log("Interact key pressed");
                    }
                    break;
            }
        };
        
        // Key press handlers
        document.addEventListener('keydown', (event) => {
            keyHandler(event, true);
            
            // Handle single-press actions
            if (event.code === 'Tab') {
                event.preventDefault();
                this.toggleWeapon();
            } else if (event.code === 'KeyR') {
                this.reloadWeapon();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            keyHandler(event, false);
        });
        
        // Mouse handlers for shooting
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left click
                this.fireWeapon();
            }
        });
        
        // Click events for pointer lock
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
        
        // Show helpful messages
        console.log("Input handlers initialized");
        console.log("Controls: W/A/S/D to move, Space to jump, Shift to sprint, E to interact");
        console.log("Weapon Controls: Tab to equip/holster, Left Click to shoot, R to reload");
        console.log("Click in the game area to enable mouse look (Escape to release)");
    }
    
    toggleWeapon() {
        if (!this.weapon) {
            console.warn("No weapon available to toggle");
            return;
        }
        
        if (this.weapon.isEquipped) {
            console.log("Holstering weapon...");
            this.weapon.holster();
            
            // Reduce cover loss when weapon is holstered
            if (window.game && window.game.coverSystem) {
                window.game.coverSystem.modifyCover(10); // Small cover boost for holstering
            }
        } else {
            console.log("Equipping weapon...");
            this.weapon.equip();
            
            // Weapon visibility reduces cover
            if (window.game && window.game.coverSystem) {
                window.game.coverSystem.modifyCover(-20); // Immediate cover loss for drawing weapon
            }
        }
    }
    
    fireWeapon() {
        if (!this.weapon || !this.weapon.isEquipped) {
            return; // Can't fire if weapon not equipped
        }
        
        if (this.dialogueLocked) {
            return; // Can't fire during dialogue
        }
        
        if (this.weapon.fire()) {
            console.log("Player fired weapon");
            
            // Firing weapon severely damages cover
            if (window.game && window.game.coverSystem) {
                window.game.coverSystem.modifyCover(-30); // Major cover loss for firing
                console.log("Cover blown by gunfire!");
            }
        }
    }
    
    reloadWeapon() {
        if (!this.weapon || !this.weapon.isEquipped) {
            return;
        }
        
        this.weapon.reload();
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
    
    destroy() {
        // Clean up weapon visibility interval
        if (this.weaponVisibilityInterval) {
            clearInterval(this.weaponVisibilityInterval);
        }
        
        // ...existing cleanup code...
    }
}

// Export Player class
window.Player = Player;
