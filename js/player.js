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
        this.interacting = false;
        
        // Movement properties
        this.moveSpeed = 5;
        this.sprintSpeed = 10;
        this.jumpForce = 10;
        this.gravity = 30;
        
        // Physics body
        this.body = null;
        this.height = 1.8;
        this.radius = 0.4;
        this.eyeHeight = 1.7;
        
        // Controls
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.sprint = false;
        this.jump = false;
        
        // Weapon
        this.weapons = [];
        this.currentWeaponIndex = 0;
        this.currentWeapon = null;
        
        // Interaction
        this.interactionDistance = 3;
        this.interactingWithNPC = null;
        this.dialogueIndex = 0;
        
        // Camera effects
        this.bobAmount = 0.03;
        this.bobSpeed = 0.015;
        
        // Init
        this.init();
    }
    
    init() {
        try {
            this.setupPhysics();
            this.setupControls();
            this.setupEventListeners();
            console.log("Player initialized");
        } catch (error) {
            console.error("Error initializing player:", error);
        }
    }
    
    setupPhysics() {
        // Create a physics body for the player
        const shape = new CANNON.Sphere(this.radius);
        this.body = new CANNON.Body({
            mass: 70, // kg
            position: new CANNON.Vec3(0, this.height / 2, 0),
            shape: shape,
            material: new CANNON.Material({
                friction: 0.1,
                restitution: 0.1
            })
        });
        
        // Disable rotation (prevent player from tipping over)
        this.body.fixedRotation = true;
        this.body.updateMassProperties();
        
        this.world.addBody(this.body);
        
        // Set up contact materials to control friction with other objects
        const playerContactMaterial = new CANNON.ContactMaterial(
            this.body.material,
            new CANNON.Material(), // Default material for other objects
            {
                friction: 0.1,
                restitution: 0.1
            }
        );
        this.world.addContactMaterial(playerContactMaterial);
    }
    
    setupControls() {
        try {
            console.log("Setting up player controls");
            // Check if PointerLockControls is available
            if (typeof THREE.PointerLockControls === 'function') {
                this.controls = new THREE.PointerLockControls(this.camera, document.body);
                console.log("PointerLockControls initialized");
            } else {
                console.error("THREE.PointerLockControls is not available");
                // Fallback to simple camera controls
                this.controls = {
                    isLocked: false,
                    lock: function() { 
                        this.isLocked = true;
                        document.body.requestPointerLock = document.body.requestPointerLock || 
                            document.body.mozRequestPointerLock ||
                            document.body.webkitRequestPointerLock;
                        document.body.requestPointerLock();
                    },
                    unlock: function() { 
                        this.isLocked = false;
                        document.exitPointerLock = document.exitPointerLock ||
                            document.mozExitPointerLock ||
                            document.webkitExitPointerLock;
                        document.exitPointerLock();
                    },
                    getObject: () => this.camera
                };
            }
        } catch (error) {
            console.error("Error setting up controls:", error);
            // Create dummy controls as fallback
            this.controls = {
                isLocked: false,
                lock: function() { console.log("Mock lock called"); },
                unlock: function() { console.log("Mock unlock called"); },
                getObject: () => this.camera
            };
        }
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (event) => {
            if (!this.alive) return;
            
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = true;
                    break;
                case 'ShiftLeft':
                    this.sprint = true;
                    break;
                case 'Space':
                    this.jump = true;
                    break;
                case 'KeyR':
                    if (this.currentWeapon && typeof this.currentWeapon.reload === 'function') {
                        this.currentWeapon.reload();
                    }
                    break;
                case 'KeyE':
                    this.tryInteract();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                    this.sprint = false;
                    break;
                case 'Space':
                    this.jump = false;
                    break;
            }
        });
        
        // Mouse click for weapon fire
        document.addEventListener('click', (event) => {
            if (this.controls && this.controls.isLocked && this.currentWeapon) {
                this.fire();
            }
        });
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            console.log('Pointer lock change event fired');
            const isLocked = document.pointerLockElement === document.body;
            if (this.controls) {
                this.controls.isLocked = isLocked;
            }
        });
    }
    
    fire() {
        if (!this.alive || !this.currentWeapon) return;
        
        console.log("Player fired weapon");
        
        if (typeof this.currentWeapon.fire === 'function') {
            const result = this.currentWeapon.fire();
            
            // Update ammo display
            if (this.currentWeapon.currentAmmo !== undefined) {
                document.dispatchEvent(new CustomEvent('ammoUpdate', {
                    detail: { 
                        current: this.currentWeapon.currentAmmo, 
                        total: this.currentWeapon.totalAmmo 
                    }
                }));
            }
        }
    }
    
    takeDamage(amount) {
        if (!this.alive) return;
        
        this.health -= amount;
        
        // Update health bar
        document.dispatchEvent(new CustomEvent('healthUpdate', {
            detail: { current: this.health, max: this.maxHealth }
        }));
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Update health bar
        document.dispatchEvent(new CustomEvent('healthUpdate', {
            detail: { current: this.health, max: this.maxHealth }
        }));
    }
    
    die() {
        this.alive = false;
        
        if (this.controls && typeof this.controls.unlock === 'function') {
            this.controls.unlock();
        }
        
        // Show game over screen
        document.dispatchEvent(new CustomEvent('playerDied'));
    }
    
    tryInteract() {
        console.log("Trying to interact");
        // We'll implement NPC interaction later
    }
    
    update(delta) {
        if (!this.alive) return;
        
        try {
            // Only move if controls are active
            if (this.controls && this.controls.isLocked) {
                this.updateMovement(delta);
                this.updateCameraEffects(delta);
            }
            
            // Update camera position to follow physics body
            if (this.controls && this.controls.getObject) {
                const controlObject = this.controls.getObject();
                controlObject.position.copy(this.body.position);
                controlObject.position.y = this.body.position.y + this.eyeHeight - this.height / 2;
            }
            
            // Check if player has fallen out of the world
            if (this.body.position.y < -20) {
                this.takeDamage(this.health); // Kill the player
            }
        } catch (error) {
            console.error("Error in player update:", error);
        }
    }
    
    updateMovement(delta) {
        const speedFactor = this.sprint ? this.sprintSpeed : this.moveSpeed;
        const velocity = this.body.velocity;
        
        // Get movement direction from camera
        const direction = new THREE.Vector3();
        const rotation = this.camera.getWorldDirection(direction);
        
        // Create forward and right vectors based on camera direction
        const forward = new THREE.Vector3(
            direction.x,
            0,
            direction.z
        ).normalize();
        
        const right = new THREE.Vector3(
            forward.z,
            0,
            -forward.x
        );
        
        // Reset velocity
        const damping = 0.9;
        velocity.x *= damping;
        velocity.z *= damping;
        
        // Apply movement
        if (this.moveForward) {
            velocity.x += forward.x * speedFactor * delta;
            velocity.z += forward.z * speedFactor * delta;
        }
        if (this.moveBackward) {
            velocity.x -= forward.x * speedFactor * delta;
            velocity.z -= forward.z * speedFactor * delta;
        }
        if (this.moveRight) {
            velocity.x += right.x * speedFactor * delta;
            velocity.z += right.z * speedFactor * delta;
        }
        if (this.moveLeft) {
            velocity.x -= right.x * speedFactor * delta;
            velocity.z -= right.z * speedFactor * delta;
        }
        
        // Check if player is on ground
        const rayCastToGround = new CANNON.Ray();
        rayCastToGround.from.copy(this.body.position);
        rayCastToGround.to.copy(this.body.position);
        rayCastToGround.to.y -= this.height / 2 + 0.1;
        
        const result = this.world.rayTest(rayCastToGround.from, rayCastToGround.to);
        const onGround = result.length > 0;
        
        // Handle jumping
        if (this.jump && onGround) {
            velocity.y = this.jumpForce;
            this.jump = false;
        }
        
        // Apply gravity if not on ground
        if (!onGround) {
            velocity.y -= this.gravity * delta;
        }
        
        // Limit horizontal velocity
        const horizontalVelocity = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const maxVelocity = this.sprint ? this.sprintSpeed : this.moveSpeed;
        
        if (horizontalVelocity > maxVelocity) {
            const scale = maxVelocity / horizontalVelocity;
            velocity.x *= scale;
            velocity.z *= scale;
        }
    }
    
    updateCameraEffects(delta) {
        // Simple camera bobbing effect while moving
        if ((this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) && 
            this.controls && this.controls.isLocked) {
            const bobFrequency = this.sprint ? this.bobSpeed * 2 : this.bobSpeed;
            const bobAmplitude = this.sprint ? this.bobAmount * 1.5 : this.bobAmount;
            
            const bobOffset = Math.sin(Date.now() * bobFrequency) * bobAmplitude;
            // Apply bobbing to camera Y position
            this.camera.position.y = this.eyeHeight + bobOffset;
        }
    }
}
