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
        
        // Physics properties - adjusted for bigger characters in the world
        this.body = null;
        this.height = 2.5; // Increased height to match bigger characters
        this.radius = 0.6; // Increased radius
        this.eyeHeight = 2.3; // Higher eye height
        
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
            console.log("Player weapon initialized successfully");
            
            // Make weapon accessible for debugging
            window.playerWeapon = this.weapon;
            
        } catch (error) {
            console.error("Error setting up weapon:", error);
        }
    }
    
    setupPhysics() {
        try {
            // Create physics body - bigger to match character scale
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
            
            // Position body above ground - higher for bigger character
            this.body.position.set(0, this.height / 2 + 3, 0);
            
            // Add to physics world
            this.world.addBody(this.body);
            
            console.log("Player physics initialized with bigger dimensions");
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
                
                // Set up event listeners for controls
                this.controls.addEventListener('lock', () => {
                    console.log("Controls locked");
                    this.controlsLocked = true;
                });
                
                this.controls.addEventListener('unlock', () => {
                    console.log("Controls unlocked");
                    this.controlsLocked = false;
                });
                
                // Connect the controls
                this.controls.connect();
                
                // Set up safer pointer lock event handlers
                this.setupSaferPointerLockEvents();
                
            } else {
                console.warn("THREE.PointerLockControls not available - using fallback");
                this.createFallbackControls();
            }
        } catch (error) {
            console.error("Error setting up controls:", error);
            this.createFallbackControls();
        }
    }
    
    createFallbackControls() {
        // Create a fallback object that won't break the game
        this.controls = {
            lock: () => {
                console.log("Fallback controls - attempting pointer lock");
                this.requestSafePointerLock();
            },
            unlock: () => {
                if (document.exitPointerLock) {
                    document.exitPointerLock();
                }
            },
            isLocked: false,
            connect: () => {},
            disconnect: () => {},
            dispose: () => {}
        };
        
        // Set up basic mouse look
        this.setupFallbackMouseLook();
    }
    
    setupFallbackMouseLook() {
        let mouseX = 0;
        let mouseY = 0;
        const sensitivity = 0.002;
        
        const onMouseMove = (event) => {
            if (document.pointerLockElement === document.body) {
                const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
                
                mouseX -= movementX * sensitivity;
                mouseY -= movementY * sensitivity;
                mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouseY));
                
                // Apply rotation to camera
                this.camera.rotation.order = 'YXZ';
                this.camera.rotation.y = mouseX;
                this.camera.rotation.x = mouseY;
            }
        };
        
        document.addEventListener('mousemove', onMouseMove);
    }
    
    setupSaferPointerLockEvents() {
        // Handle pointer lock changes more safely
        const onPointerLockChange = () => {
            if (this.controls) {
                const isLocked = document.pointerLockElement === document.body;
                this.controls.isLocked = isLocked;
                
                if (isLocked) {
                    console.log("Pointer lock acquired successfully");
                } else {
                    console.log("Pointer lock released");
                }
            }
        };
        
        const onPointerLockError = (event) => {
            // Don't log this as an error since it's expected on page load
            console.log("Pointer lock not available (waiting for user interaction)");
        };
        
        // Add event listeners with proper cleanup
        document.addEventListener('pointerlockchange', onPointerLockChange);
        document.addEventListener('pointerlockerror', onPointerLockError);
        
        // Also handle vendor prefixes
        document.addEventListener('mozpointerlockchange', onPointerLockChange);
        document.addEventListener('webkitpointerlockchange', onPointerLockChange);
        document.addEventListener('mozpointerlockerror', onPointerLockError);
        document.addEventListener('webkitpointerlockerror', onPointerLockError);
        
        // Store cleanup function
        this.cleanupPointerLockEvents = () => {
            document.removeEventListener('pointerlockchange', onPointerLockChange);
            document.removeEventListener('pointerlockerror', onPointerLockError);
            document.removeEventListener('mozpointerlockchange', onPointerLockChange);
            document.removeEventListener('webkitpointerlockchange', onPointerLockChange);
            document.removeEventListener('mozpointerlockerror', onPointerLockError);
            document.removeEventListener('webkitpointerlockerror', onPointerLockError);
        };
    }
    
    requestSafePointerLock() {
        // Only request pointer lock if user has interacted with the page
        if (!this.hasUserInteracted) {
            console.log("Waiting for user interaction before requesting pointer lock");
            return false;
        }
        
        try {
            if (document.body.requestPointerLock) {
                document.body.requestPointerLock();
                return true;
            }
        } catch (error) {
            console.log("Pointer lock request failed (this is normal):", error.message);
        }
        return false;
    }
    
    setupInputHandlers() {
        console.log("Setting up player input handlers");
        
        // Track user interaction
        this.hasUserInteracted = false;
        
        // Mark user interaction on any click or key press
        const markInteraction = () => {
            this.hasUserInteracted = true;
        };
        
        document.addEventListener('click', markInteraction, { once: true });
        document.addEventListener('keydown', markInteraction, { once: true });
        
        // Handle pointer lock request more safely
        document.addEventListener('click', (event) => {
            // Only request pointer lock if:
            // 1. Not already locked
            // 2. Not in dialogue
            // 3. User has interacted
            // 4. Game is active
            if (!this.dialogueLocked && 
                document.pointerLockElement !== document.body && 
                this.hasUserInteracted &&
                window.game && window.game.isGameActive) {
                
                // Small delay to ensure click event is processed
                setTimeout(() => {
                    if (this.controls && typeof this.controls.lock === 'function') {
                        try {
                            this.controls.lock();
                        } catch (error) {
                            console.log("Pointer lock request failed:", error.message);
                        }
                    } else {
                        this.requestSafePointerLock();
                    }
                }, 100);
            }
        });
        
        // KEYBOARD INPUT HANDLERS - Simplified and more reliable
        
        // Handle key down events
        document.addEventListener('keydown', (event) => {
            if (!this.alive) return;
            
            // Mark interaction
            this.hasUserInteracted = true;
            
            // Don't process movement if dialogue is active (except weapon controls)
            if (this.dialogueLocked && !['KeyE', 'Tab', 'KeyR'].includes(event.code)) {
                return;
            }
            
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    if (!this.dialogueLocked) this.keys.forward = true;
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
                // Weapon controls work even during dialogue for emergency situations
                case 'Tab':
                    // Log weapon toggle attempt
                    console.log("Tab pressed - weapon toggle");
                    event.preventDefault();
                    break;
                case 'KeyR':
                    // Log reload attempt
                    console.log("R pressed - weapon reload");
                    event.preventDefault();
                    break;
                case 'Escape':
                    // Allow escape to exit pointer lock
                    if (document.exitPointerLock) {
                        document.exitPointerLock();
                    }
                    event.preventDefault();
                    break;
            }
            
            if (this.debug && event.code === 'KeyP') {
                // Debug key - enhanced info
                console.log("=== PLAYER DEBUG INFO ===");
                console.log("Player position:", this.body.position);
                console.log("Player velocity:", this.body.velocity);
                console.log("Movement states:", this.keys);
                console.log("On ground:", this.onGround);
                console.log("Dialogue locked:", this.dialogueLocked);
                console.log("User interacted:", this.hasUserInteracted);
                console.log("Pointer locked:", document.pointerLockElement === document.body);
                console.log("Controls available:", !!this.controls);
                if (this.weapon) {
                    console.log("Weapon equipped:", this.weapon.isEquipped);
                    console.log("Weapon ammo:", this.weapon.ammo + "/" + this.weapon.maxAmmo);
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
            }
        });
        
        console.log("Input handlers initialized with safer pointer lock");
        console.log("Controls: W/A/S/D to move, Space to jump, Shift to sprint, E to interact");
        console.log("Weapon Controls: Tab to equip/holster, Left Click to shoot, R to reload");
        console.log("Click anywhere to enable mouse look (after interacting with the page)");
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
        // Cast a ray downward to detect ground - adjusted for bigger character
        const start = this.body.position.clone();
        const end = new CANNON.Vec3(start.x, start.y - (this.radius + 0.4), start.z);
        
        // Simple ground check based on velocity and position
        const wasOnGround = this.onGround;
        this.onGround = this.body.position.y <= (this.radius + 0.15) && Math.abs(this.body.velocity.y) < 1;
        
        if (!wasOnGround && this.onGround) {
            console.log("Landed on ground");
        }
    }
    
    updateCamera() {
        if (!this.camera || !this.body) return;
        
        // Position camera at eye height - adjusted for bigger character
        const pos = this.body.position;
        this.camera.position.set(pos.x, pos.y + this.eyeHeight - this.radius, pos.z);
    }
    
    resetPosition() {
        if (!this.body) return;
        
        // Reset player if they fall out of the world - higher position
        this.body.position.set(0, 7, 0); // Higher reset position
        this.body.velocity.set(0, 0, 0);
        console.log("Player position reset to accommodate bigger character size");
    }
    
    // Add cleanup method
    dispose() {
        if (this.cleanupPointerLockEvents) {
            this.cleanupPointerLockEvents();
        }
        
        if (this.controls && this.controls.dispose) {
            this.controls.dispose();
        }
        
        if (this.body && this.world) {
            this.world.removeBody(this.body);
        }
    }
}

// Export Player class
window.Player = Player;
