class NPC {
    constructor(scene, world, position, type = 'civilian') {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 0, y: 0, z: 0 };
        this.type = type;
        
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.isHostile = false;
        this.alertRadius = 10;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        
        // Add walking animation properties
        this.isWalking = true;
        this.walkSpeed = 0.8;
        this.walkRadius = 8; // Radius of circular walking pattern
        this.walkAngle = Math.random() * Math.PI * 2; // Random starting angle
        this.walkCenter = { x: position.x, z: position.z }; // Center of walking circle
        this.lastPositionUpdate = 0;
        
        // Dialogue interaction properties
        this.canTalk = true;
        this.dialogueCooldown = 0;
        this.lastInteractionTime = 0;
        
        // Use character design system
        this.characterDesign = new CharacterDesign();
        this.name = this.characterDesign.generateCharacterName(type);
        
        console.log(`${type} NPC created: ${this.name} - will walk in circles and can be talked to`);
    }
    
    init() {
        this.createCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        console.log(`${this.type} NPC created:`, this.name);
    }
    
    createCharacter() {
        try {
            // Use the character design system
            this.group = this.characterDesign.createNPCCharacter(this.type);
            this.group.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh = this.group;
            
            // Ensure all facial features are visible
            this.group.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.visible = true;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Ensure materials are properly set
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            console.log(`${this.type} NPC character created with facial features:`, this.name);
        } catch (error) {
            console.error("Error creating NPC character:", error);
            // Fallback to simple character if detailed creation fails
            this.createSimpleFallbackCharacter();
        }
    }
    
    createSimpleFallbackCharacter() {
        // Simple fallback character in case detailed creation fails
        this.group = new THREE.Group();
        
        // Simple body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5568 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        this.group.add(body);
        
        // Simple head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xDDB592 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        this.group.add(head);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
        
        console.log(`Created fallback character for ${this.name}`);
    }
    
    addConeLegs() {
        // Create cone legs (upside down cones - larger size)
        const legGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.4,
            roughness: 0.6
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0.4, 0);
        leftLeg.rotation.x = Math.PI; // Flip upside down
        leftLeg.castShadow = true;
        this.group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0.4, 0);
        rightLeg.rotation.x = Math.PI; // Flip upside down
        rightLeg.castShadow = true;
        this.group.add(rightLeg);
    }
    
    addAccessories() {
        switch(this.type) {
            case 'police':
                // Police badge (small cylinder)
                const badgeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8);
                const badgeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xffd700,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
                badge.position.set(0.25, 1.2, 0.35);
                badge.rotation.x = Math.PI / 2;
                this.group.add(badge);
                break;
                
            case 'criminal':
                // Criminal tattoo/marking (dark cylinder on arm)
                const markGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
                const markMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
                const mark = new THREE.Mesh(markGeometry, markMaterial);
                mark.position.set(0.45, 1.0, 0);
                mark.rotation.z = Math.PI / 2;
                this.group.add(mark);
                break;
        }
    }
    
    createPhysicsBody() {
        try {
            // Create physics body that matches character height and scale
            const characterScale = this.characterDesign ? this.characterDesign.npcScale || 1.8 : 1.8;
            const shape = new CANNON.Cylinder(0.4, 0.4, 1.6, 12);
            
            this.body = new CANNON.Body({ 
                mass: 70,
                material: new CANNON.Material({ 
                    friction: 0.3,
                    restitution: 0.1
                }),
                fixedRotation: true,
                allowSleep: false
            });
            
            this.body.addShape(shape);
            // Position physics body to match visual character height
            this.body.position.set(
                this.position.x, 
                this.position.y + (0.8 * characterScale), 
                this.position.z
            );
            
            this.world.addBody(this.body);
            console.log(`Physics body created for ${this.name} with scale ${characterScale}`);
        } catch (error) {
            console.error(`Error creating physics body for ${this.name}:`, error);
        }
    }
    
    update(playerPosition, delta) {
        if (this.isDead) return;
        
        // Update walking animation
        this.updateWalkingAnimation(delta);
        
        // Update mesh position to match physics body with proper offset
        if (this.body && this.group) {
            this.group.position.copy(this.body.position);
            // Adjust for character scale and center offset
            const characterScale = this.characterDesign ? this.characterDesign.npcScale || 1.8 : 1.8;
            this.group.position.y -= (0.8 * characterScale);
        }
        
        // Check for player interaction with improved distance checking
        if (playerPosition && window.game && window.game.dialogueSystem) {
            const distance = this.getDistanceToPlayer(playerPosition);
            
            // Show interaction prompt when player is close
            if (distance < 4 && this.canTalk && !window.game.dialogueSystem.isActive) {
                window.game.dialogueSystem.showInteractionPrompt(this);
                
                // Store reference for interaction
                window.currentInteractableNPC = this;
            } else if (distance > 4 && window.currentInteractableNPC === this) {
                window.game.dialogueSystem.hideInteractionPrompt();
                window.currentInteractableNPC = null;
            }
        }
        
        // Simple AI behavior if hostile
        if (this.isHostile && playerPosition) {
            this.hostileBehavior(playerPosition, delta);
        }
        
        // Update dialogue cooldown
        if (this.dialogueCooldown > 0) {
            this.dialogueCooldown -= delta * 1000;
        }
        
        // Update health bar visibility
        this.checkHealthBarVisibility();
    }
    
    updateWalkingAnimation(delta) {
        if (!this.isWalking || this.isHostile || this.isDead) return;
        
        const now = Date.now();
        if (now - this.lastPositionUpdate < 50) return; // Throttle updates
        this.lastPositionUpdate = now;
        
        // Update walking angle for circular movement
        this.walkAngle += delta * this.walkSpeed;
        
        // Calculate new position in circle
        const targetX = this.walkCenter.x + Math.cos(this.walkAngle) * this.walkRadius;
        const targetZ = this.walkCenter.z + Math.sin(this.walkAngle) * this.walkRadius;
        
        // Move physics body toward target position
        if (this.body) {
            const currentX = this.body.position.x;
            const currentZ = this.body.position.z;
            
            // Calculate movement direction
            const dirX = targetX - currentX;
            const dirZ = targetZ - currentZ;
            const distance = Math.sqrt(dirX * dirX + dirZ * dirZ);
            
            if (distance > 0.1) {
                // Normalize and apply movement
                const moveSpeed = 2.0;
                this.body.velocity.x = (dirX / distance) * moveSpeed;
                this.body.velocity.z = (dirZ / distance) * moveSpeed;
                
                // Make NPC face movement direction
                const angle = Math.atan2(dirX, dirZ);
                this.group.rotation.y = angle;
                
                // Trigger walking animation if character design supports it
                if (this.characterDesign && this.characterDesign.animateCharacter) {
                    this.characterDesign.animateCharacter(this.group, 'walk');
                }
            } else {
                // Stop movement when close to target
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
                
                // Trigger idle animation
                if (this.characterDesign && this.characterDesign.animateCharacter) {
                    this.characterDesign.animateCharacter(this.group, 'idle');
                }
            }
        }
    }
    
    // Method to start dialogue interaction
    startDialogue() {
        if (!this.canTalk || this.dialogueCooldown > 0 || this.isDead) {
            console.log(`Cannot talk to ${this.name}: cooldown or dead`);
            return false;
        }
        
        if (window.game && window.game.dialogueSystem) {
            console.log(`Starting dialogue with ${this.name} (${this.type})`);
            
            // Stop walking during dialogue
            this.isWalking = false;
            if (this.body) {
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
            }
            
            // Start dialogue
            window.game.dialogueSystem.startDialogue(this);
            
            // Set cooldown to prevent spam
            this.dialogueCooldown = 3000; // 3 second cooldown
            this.lastInteractionTime = Date.now();
            
            return true;
        }
        
        console.error("Dialogue system not available");
        return false;
    }
    
    // Method called when dialogue ends
    endDialogue() {
        console.log(`Dialogue ended with ${this.name}`);
        
        // Resume walking after a short delay
        setTimeout(() => {
            if (!this.isHostile && !this.isDead) {
                this.isWalking = true;
                console.log(`${this.name} resumes walking`);
            }
        }, 1000);
    }
    
    becomeHostile() {
        if (this.isHostile) return;
        
        this.isHostile = true;
        this.isWalking = false; // Stop walking when hostile
        console.log(`${this.name} becomes hostile!`);
        
        // Change appearance to show hostility (red tint) with null checks
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                try {
                    child.material.emissive = new THREE.Color(0x440000);
                } catch (error) {
                    console.warn("Error applying hostile effect:", error);
                }
            }
        });
    }
    
    takeDamage(damage) {
        if (this.isDead) return false;
        
        this.health -= damage;
        console.log(`${this.name} takes ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Update health bar immediately
        this.updateHealthBar();
        
        // Visual damage effect with null checks
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                try {
                    child.material.emissive.setHex(0x440000);
                    setTimeout(() => {
                        if (!this.isDead && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0x000000);
                        }
                    }, 200);
                } catch (error) {
                    console.warn("Error applying damage effect:", error);
                }
            }
        });
        
        if (this.health <= 0) {
            this.die();
            return true; // Killed
        }
        
        // Become hostile when shot
        if (!this.isHostile) {
            this.becomeHostile();
        }
        
        return false; // Still alive
    }
    
    createHealthBar() {
        if (!this.isEnemy || this.healthBarGroup) return;
        
        // Create health bar container
        this.healthBarGroup = new THREE.Group();
        
        // Background bar (red)
        const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x441111,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarGroup.add(this.healthBarBg);
        
        // Health bar (green to red gradient)
        const healthGeometry = new THREE.PlaneGeometry(1.0, 0.1);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x44ff44,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.001; // Slightly in front
        this.healthBarGroup.add(this.healthBar);
        
        // Position health bar above enemy
        this.healthBarGroup.position.set(0, 2.5, 0);
        this.group.add(this.healthBarGroup);
        
        // Store original scale for visibility management
        this.healthBarOriginalScale = this.healthBarGroup.scale.clone();
        
        console.log(`Health bar created for enemy: ${this.name}`);
    }
    
    updateHealthBar() {
        if (!this.healthBar || !this.isEnemy) return;
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        // Update health bar width
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -(1.0 - healthPercent) * 0.5; // Align to left
        
        // Update color based on health
        if (healthPercent > 0.6) {
            this.healthBar.material.color.setHex(0x44ff44); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.material.color.setHex(0xffff44); // Yellow
        } else {
            this.healthBar.material.color.setHex(0xff4444); // Red
        }
        
        // Make health bar face camera
        if (window.game && window.game.camera && this.healthBarGroup) {
            this.healthBarGroup.lookAt(window.game.camera.position);
        }
    }
    
    checkHealthBarVisibility() {
        if (!this.healthBarGroup || !this.isEnemy || this.isDead) return;
        
        // Check distance from player
        if (window.game && window.game.player && window.game.player.body) {
            const playerPos = window.game.player.body.position;
            const enemyPos = this.body.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - enemyPos.x, 2) + 
                Math.pow(playerPos.z - enemyPos.z, 2)
            );
            
            // Hide health bar if too far
            if (distance > 50) {
                this.healthBarGroup.visible = false;
                return;
            }
        }
        
        // Check for nearby enemies to avoid overlapping health bars
        let nearbyEnemyCount = 0;
        const thisPos = this.body.position;
        
        if (window.game && window.game.npcManager) {
            window.game.npcManager.enemies.forEach(enemy => {
                if (enemy !== this && !enemy.isDead && enemy.body) {
                    const otherPos = enemy.body.position;
                    const distance = Math.sqrt(
                        Math.pow(thisPos.x - otherPos.x, 2) + 
                        Math.pow(thisPos.z - otherPos.z, 2)
                    );
                    
                    if (distance < 3) { // Within 3 units
                        nearbyEnemyCount++;
                    }
                }
            });
        }
        
        // Hide health bars if too many enemies are clustered
        if (nearbyEnemyCount >= 2) {
            this.healthBarGroup.visible = false;
        } else {
            this.healthBarGroup.visible = true;
            this.healthBarGroup.scale.copy(this.healthBarOriginalScale);
        }
    }
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.health = 0;
        console.log(`${this.name} has been eliminated!`);
        
        // Hide health bar immediately
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
        
        // Death animation - fall over
        this.group.rotation.z = Math.PI / 2;
        this.group.position.y -= 0.5;
        
        // Change color to indicate death with proper null checks
        this.group.traverse((child) => {
            if (child.isMesh && child.material) {
                try {
                    if (child.material.color) {
                        child.material.color.multiplyScalar(0.3);
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                } catch (error) {
                    console.warn("Error applying death effect:", error);
                }
            }
        });
        
        // Remove physics body
        if (this.body && this.world) {
            this.world.removeBody(this.body);
        }
        
        // Notify mission manager if this was an enemy
        if (this.isEnemy && window.game && window.game.missionManager) {
            window.game.missionManager.enemyEliminated();
        }
        
        // Remove from scene after a delay
        setTimeout(() => {
            if (this.scene && this.group && this.group.parent) {
                this.scene.remove(this.group);
            }
        }, 5000);
    }
    
    hostileBehavior(playerPosition, delta) {
        const distance = this.getDistanceToPlayer(playerPosition);
        
        if (distance < 15) {
            // Move towards player
            const direction = new THREE.Vector3(
                playerPosition.x - this.body.position.x,
                0,
                playerPosition.z - this.body.position.z
            ).normalize();
            
            const speed = 2;
            this.body.velocity.x = direction.x * speed;
            this.body.velocity.z = direction.z * speed;
            
            // Face player
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
            
            if (distance < 2) {
                // Attack player
                console.log(`${this.name} attacks the player!`);
                this.attackPlayer();
            }
        }
        
        // Update health bar visibility during hostile behavior
        if (this.isEnemy) {
            this.checkHealthBarVisibility();
        }
    }
    
    attackPlayer() {
        // NPC melee attack
        if (window.game && window.game.playerTakeDamage) {
            const damage = 15; // NPCs do less damage than enemies
            window.game.playerTakeDamage(damage);
            console.log(`${this.name} attacks player for ${damage} damage!`);
        }
    }
    
    getDistanceToPlayer(playerPosition) {
        return Math.sqrt(
            Math.pow(playerPosition.x - this.body.position.x, 2) +
            Math.pow(playerPosition.z - this.body.position.z, 2)
        );
    }
}

class Enemy {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 5, y: 0, z: 5 };
        
        // Add unique identifier for debugging
        this.id = 'enemy_' + Math.random().toString(36).substr(2, 9);
        this.name = this.generateEnemyName();
        
        // Enemy properties - CRITICAL: Exactly 160 health for 4-shot kills with 40 damage bullets
        this.health = 160;
        this.maxHealth = 160;
        this.speed = 2;
        this.attackDamage = 25;
        this.detectionRange = 15;
        this.attackRange = 2;
        this.isDead = false;
        
        // Weapon properties
        this.hasWeapon = true;
        this.ammo = 15;
        this.weaponRange = 20;
        this.lastShotTime = 0;
        this.shotCooldown = 1200;
        this.accuracy = 0.7;
        
        // 3D objects
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.weaponGroup = new THREE.Group();
        
        // AI state - Enhanced for animations and cover system
        this.state = 'patrol';
        this.previousState = 'patrol';
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000;
        this.playerDetected = false;
        
        // Enhanced movement for automatic patrolling
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.patrolRadius = 25; // Larger patrol area
        this.lastPatrolUpdate = 0;
        this.patrolUpdateInterval = 5000; // Change direction every 5 seconds
        this.isMoving = true; // Always moving unless attacking
        this.patrolSpeed = 0.8; // Patrol movement speed
        
        // Cover system integration
        this.coverThreshold = 60; // Attack when player cover below 60%
        this.suspicionLevel = 0;
        this.maxSuspicion = 100;
        this.suspicionDecayRate = 5; // Suspicion decreases over time
        
        // Animation integration
        this.animationManager = null;
        
        // Use character design system
        this.characterDesign = new CharacterDesign();
        
        console.log(`Enemy ${this.name} created with ID: ${this.id}, Health: ${this.health} - will die in exactly 4 shots (40 damage each)`);
        console.log(`Enemy will attack when player cover drops below ${this.coverThreshold}%`);
        this.init();
    }
    
    generateEnemyName() {
        const names = [
            "REPO-Alpha", "REPO-Bravo", "REPO-Charlie", "REPO-Delta", 
            "REPO-Echo", "REPO-Foxtrot", "REPO-Golf", "REPO-Hotel",
            "REPO-India", "REPO-Juliet", "REPO-Kilo", "REPO-Lima"
        ];
        return names[Math.floor(Math.random() * names.length)] + "-" + Math.floor(Math.random() * 100);
    }

    init() {
        this.createRepoCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        
        // Initialize patrol route with multiple points
        this.generatePatrolRoute();
        
        // Register with animation manager if available
        if (window.game && window.game.animationManager) {
            this.animationManager = window.game.animationManager;
            this.animationManager.registerEnemy(this);
        }
        
        console.log("REPO enemy created at position:", this.position);
        console.log("Patrol route generated with", this.patrolPoints.length, "points");
    }
    
    generatePatrolRoute() {
        // Create a patrol route around the spawn area
        const numPoints = 4 + Math.floor(Math.random() * 4); // 4-8 patrol points
        this.patrolPoints = [];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = this.patrolRadius * (0.5 + Math.random() * 0.5); // Vary distance
            
            const patrolPoint = {
                x: this.position.x + Math.cos(angle) * radius,
                z: this.position.z + Math.sin(angle) * radius,
                waitTime: 1000 + Math.random() * 3000 // Wait 1-4 seconds at each point
            };
            
            this.patrolPoints.push(patrolPoint);
        }
        
        // Add some random patrol points for variety
        for (let i = 0; i < 2; i++) {
            const randomAngle = Math.random() * Math.PI * 2;
            const randomRadius = Math.random() * this.patrolRadius;
            
            this.patrolPoints.push({
                x: this.position.x + Math.cos(randomAngle) * randomRadius,
                z: this.position.z + Math.sin(randomAngle) * randomRadius,
                waitTime: 2000 + Math.random() * 2000
            });
        }
        
        this.currentPatrolIndex = 0;
        console.log(`Generated patrol route with ${this.patrolPoints.length} points for enemy`);
    }
    
    createRepoCharacter() {
        try {
            // Use the character design system with proper scaling
            const result = this.characterDesign.createEnemyCharacter();
            this.group = result.group;
            this.weaponGroup = result.weaponGroup;
            
            this.group.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh = this.group;
            
            console.log(`REPO character created for ${this.name} with scale ${this.characterDesign.enemyScale}`);
        } catch (error) {
            console.error(`Error creating REPO character for ${this.name}:`, error);
            this.createFallbackEnemyCharacter();
        }
    }
    
    createFallbackEnemyCharacter() {
        // Fallback enemy character if detailed creation fails
        console.log(`Creating fallback enemy character for ${this.name}`);
        
        this.group = new THREE.Group();
        const scale = 2.0; // Match enemy scale
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1.4 * scale, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5568 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.7 * scale;
        body.castShadow = true;
        this.group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25 * scale, 12, 12);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.6 * scale;
        head.castShadow = true;
        this.group.add(head);
        
        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.28 * scale, 12, 8);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2A2A2A,
            metalness: 0.7 
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.65 * scale;
        helmet.castShadow = true;
        this.group.add(helmet);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
    }
    
    createPhysicsBody() {
        try {
            // Create physics body for collision (cylinder) that matches character scale
            const characterScale = this.characterDesign ? this.characterDesign.enemyScale || 2.0 : 2.0;
            const shape = new CANNON.Cylinder(0.5, 0.5, 1.8, 12);
            
            this.body = new CANNON.Body({
                mass: 100, // Heavy enemy
                material: new CANNON.Material({
                    friction: 0.3,
                    restitution: 0.1
                }),
                fixedRotation: true // Prevent tumbling
            });
            
            this.body.addShape(shape);
            // Position to match visual character
            this.body.position.set(
                this.position.x, 
                this.position.y + (0.9 * characterScale), 
                this.position.z
            );
            
            // Add to physics world
            this.world.addBody(this.body);
            
            console.log(`Enemy physics body created for ${this.name} with scale ${characterScale}`);
        } catch (error) {
            console.error(`Error creating enemy physics body for ${this.name}:`, error);
        }
    }
    
    update(playerPosition, delta) {
        if (!this.body || !playerPosition) return;
        
        // Update mesh position to match physics body with proper scaling
        if (this.group) {
            this.group.position.copy(this.body.position);
            // Adjust for character scale and center offset
            const characterScale = this.characterDesign ? this.characterDesign.enemyScale || 2.0 : 2.0;
            this.group.position.y -= (0.9 * characterScale);
        }
        
        // Store previous state for animation changes
        this.previousState = this.state;
        
        // Update suspicion level (decay over time)
        if (this.suspicionLevel > 0 && !this.playerDetected) {
            this.suspicionLevel = Math.max(0, this.suspicionLevel - (this.suspicionDecayRate * delta));
        }
        
        // AI behavior and movement
        this.updateAI(playerPosition, delta);
        
        // Update animations based on state
        this.updateAnimations();
        
        // Keep enemy upright
        this.body.angularVelocity.set(0, 0, 0);
    }
    
    takeDamage(damage) {
        if (this.isDead) {
            console.log("Enemy already dead, ignoring damage");
            return false;
        }
        
        // Convert damage to number and ensure it's exactly what we expect
        const actualDamage = Number(damage);
        const oldHealth = this.health;
        
        this.health -= actualDamage;
        
        console.log(`=== ENEMY DAMAGE TRACKING ===`);
        console.log(`Damage received: ${actualDamage}`);
        console.log(`Health before: ${oldHealth}`);
        console.log(`Health after: ${this.health}`);
        console.log(`Shots taken: ${Math.ceil((this.maxHealth - this.health) / 40)}`);
        console.log(`Shots remaining: ${Math.ceil(this.health / 40)}`);
        console.log(`===========================`);
        
        // Trigger hit animation
        if (this.animationManager) {
            this.animationManager.playHitAnimation(this);
        }
        
        // Immediately become aggressive when shot
        if (!this.playerDetected) {
            this.playerDetected = true;
            this.state = 'chase';
            this.suspicionLevel = this.maxSuspicion;
            console.log("Enemy becomes aggressive after being shot!");
            this.alertNearbyEnemies();
        }
        
        // Check for death - exactly at 0 or below
        if (this.health <= 0) {
            console.log(`=== ENEMY KILLED ===`);
            console.log(`Total shots taken: ${Math.ceil(this.maxHealth / actualDamage)}`);
            console.log(`Damage per shot: ${actualDamage}`);
            console.log(`================`);
            this.die();
            return true;
        }
        
        // Become more aggressive when damaged
        this.detectionRange = Math.min(this.detectionRange + 3, 35);
        this.speed = Math.min(this.speed + 0.8, 6);
        
        // Prefer shooting if has ammo
        if (this.ammo > 0 && this.state === 'chase') {
            this.state = 'shoot';
        }
        
        return false;
    }
    
    die() {
        if (this.isDead) return;
        
        console.log(`=== ${this.name} DEATH ===`);
        this.isDead = true;
        this.health = 0;
        
        // Notify mission manager
        if (window.game && window.game.missionManager) {
            window.game.missionManager.enemyEliminated();
        }
        
        // Death animation
        this.group.rotation.z = Math.PI / 2; // Fall over
        this.group.position.y -= 0.5;
        
        // Change appearance with proper null checks
        this.group.traverse((child) => {
            if (child.isMesh && child.material) {
                try {
                    if (child.material.color) {
                        child.material.color.multiplyScalar(0.5); // Darken
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                } catch (error) {
                    console.warn("Error applying death visual effect:", error);
                }
            }
        });
        
        // Remove physics body immediately to prevent further collisions
        if (this.body && this.world) {
            try {
                this.world.removeBody(this.body);
                this.body = null;
            } catch (error) {
                console.warn("Error removing enemy physics body:", error);
            }
        }
        
        // Remove from scene after delay
        setTimeout(() => {
            if (this.group && this.group.parent) {
                try {
                    this.scene.remove(this.group);
                } catch (error) {
                    console.warn("Error removing enemy from scene:", error);
                }
            }
        }, 5000);
        
        console.log(`${this.name} eliminated`);
    }

    // CRITICAL: Add the missing getDistanceToPlayer method
    getDistanceToPlayer(playerPosition) {
        if (!playerPosition || !this.body) {
            return Infinity;
        }
        
        return Math.sqrt(
            Math.pow(playerPosition.x - this.body.position.x, 2) +
            Math.pow(playerPosition.z - this.body.position.z, 2)
        );
    }

    // Add missing methods for cover system integration
    getPlayerCoverLevel() {
        // Get player cover level from game's cover system
        if (window.game && window.game.coverSystem) {
            return window.game.coverSystem.getCoverLevel();
        }
        return 100; // Default to full cover if system not available
    }
    
    calculateCoverDetection(playerCover, distanceToPlayer) {
        // Calculate detection probability based on cover and distance
        let detectionChance = 0;
        
        if (playerCover < 30) {
            detectionChance = 0.9; // Very high chance when cover is very low
        } else if (playerCover < 60) {
            detectionChance = 0.6; // Moderate chance when cover is low
        } else if (playerCover < 80) {
            detectionChance = 0.3; // Low chance when cover is decent
        } else {
            detectionChance = 0.1; // Very low chance when cover is good
        }
        
        // Adjust for distance
        const maxDistance = this.detectionRange;
        const distanceFactor = 1 - (distanceToPlayer / maxDistance);
        detectionChance *= Math.max(0, distanceFactor);
        
        return detectionChance;
    }
    
    alertNearbyEnemies() {
        // Alert other enemies when player is detected
        if (window.game && window.game.npcManager) {
            window.game.npcManager.enemies.forEach(enemy => {
                if (enemy !== this && !enemy.isDead) {
                    const distance = Math.sqrt(
                        Math.pow(this.body.position.x - enemy.body.position.x, 2) +
                        Math.pow(this.body.position.z - enemy.body.position.z, 2)
                    );
                    
                    if (distance < 20) { // Alert radius
                        enemy.playerDetected = true;
                        enemy.state = 'chase';
                        enemy.suspicionLevel = enemy.maxSuspicion;
                        console.log(`${enemy.name} alerted by ${this.name}`);
                    }
                }
            });
        }
    }
    
    updateAI(playerPosition, delta) {
        if (!playerPosition) return;
        
        const distanceToPlayer = this.getDistanceToPlayer(playerPosition);
        
        // Get player cover level from game
        const playerCover = this.getPlayerCoverLevel();
        
        // Determine detection based on cover level and distance
        const coverDetection = this.calculateCoverDetection(playerCover, distanceToPlayer);
        
        // Enhanced detection system
        const baseDetectionRange = this.detectionRange;
        let adjustedDetectionRange = baseDetectionRange;
        
        // Cover-based detection
        if (playerCover < this.coverThreshold) {
            // Cover is blown - much easier to detect
            adjustedDetectionRange *= 2.0;
            this.suspicionLevel = Math.min(this.maxSuspicion, this.suspicionLevel + (50 * delta));
            console.log(`Player cover blown (${playerCover}%) - enemy on high alert!`);
        } else if (playerCover < 80) {
            // Suspicion rising
            adjustedDetectionRange *= 1.3;
            this.suspicionLevel = Math.min(this.maxSuspicion, this.suspicionLevel + (20 * delta));
        }
        
        // Weapon visibility increases detection
        const playerHasWeapon = window.game && window.game.player && window.game.player.weapon && window.game.player.weapon.isEquipped;
        if (playerHasWeapon) {
            adjustedDetectionRange *= 1.5;
            this.suspicionLevel = Math.min(this.maxSuspicion, this.suspicionLevel + (30 * delta));
            console.log("Enemy notices player's weapon - increased suspicion");
        }
        
        // Reset movement flag
        this.isMoving = false;
        
        // State machine with enhanced movement and cover detection
        switch(this.state) {
            case 'patrol':
                this.handlePatrolState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta, playerCover);
                break;
                
            case 'investigate':
                this.handleInvestigateState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta);
                break;
                
            case 'chase':
                this.handleChaseState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta);
                break;
                
            case 'shoot':
                this.handleShootState(playerPosition, distanceToPlayer, delta);
                break;
                
            case 'attack':
                this.handleAttackState(playerPosition, distanceToPlayer, delta);
                break;
        }
    }

    handleChaseState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta) {
        if (distanceToPlayer > adjustedDetectionRange * 2.5) {
            this.state = 'patrol';
            this.playerDetected = false;
            this.suspicionLevel = Math.max(0, this.suspicionLevel - 30);
            console.log("Enemy lost player - returning to patrol");
        } else if (distanceToPlayer < this.weaponRange && this.ammo > 0) {
            this.state = 'shoot';
            console.log(`${this.name} switches to shooting mode`);
        } else {
            // Chase player
            this.moveTowardsTarget(playerPosition, delta, this.speed);
            this.isMoving = true;
        }
    }
    
    handleShootState(playerPosition, distanceToPlayer, delta) {
        if (distanceToPlayer > this.weaponRange || this.ammo <= 0) {
            this.state = 'chase';
        } else {
            // Shoot at player
            this.shootAtPlayer(playerPosition);
        }
    }
    
    handleAttackState(playerPosition, distanceToPlayer, delta) {
        if (distanceToPlayer > this.attackRange) {
            this.state = 'chase';
        } else {
            // Melee attack
            this.attackPlayer();
        }
    }

    shootAtPlayer(playerPosition) {
        const now = Date.now();
        if (now - this.lastShotTime < this.shotCooldown || this.ammo <= 0) return;
        
        this.lastShotTime = now;
        this.ammo--;
        
        console.log(`${this.name} shoots at player! Ammo remaining: ${this.ammo}`);
        
        // Use bullet system to create enemy bullet
        if (window.game && window.game.bulletSystem) {
            window.game.bulletSystem.createEnemyBullet(this, playerPosition);
        }
    }
    
    attackPlayer() {
        const now = Date.now();
        if (now - this.lastAttackTime < this.attackCooldown) return;
        
        this.lastAttackTime = now;
        console.log(`${this.name} attacks player with melee!`);
        
        if (window.game && window.game.playerTakeDamage) {
            window.game.playerTakeDamage(this.attackDamage);
        }
    }
    
    handlePatrolState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta, playerCover) {
        // Enhanced patrol behavior with cover detection
        const coverDetection = this.calculateCoverDetection(playerCover, distanceToPlayer);
        
        // Check if player detected based on distance and cover
        if (distanceToPlayer < adjustedDetectionRange) {
            if (Math.random() < coverDetection) {
                this.playerDetected = true;
                this.state = 'investigate';
                this.suspicionLevel = Math.min(this.maxSuspicion, this.suspicionLevel + 25);
                console.log(`${this.name} detects suspicious activity (Cover: ${playerCover}%)`);
            } else if (playerCover < this.coverThreshold) {
                // Even if not fully detected, become suspicious when cover is blown
                this.suspicionLevel = Math.min(this.maxSuspicion, this.suspicionLevel + (20 * delta));
                if (this.suspicionLevel > 50) {
                    this.state = 'investigate';
                    console.log(`${this.name} becomes suspicious due to blown cover`);
                }
            }
        }
        
        // Continue patrol movement
        this.updatePatrolMovement(delta);
        this.isMoving = true;
    }
    
    handleInvestigateState(playerPosition, distanceToPlayer, adjustedDetectionRange, delta) {
        // Investigation behavior
        if (distanceToPlayer < adjustedDetectionRange * 0.7) {
            // Player is close during investigation - become aggressive
            this.playerDetected = true;
            this.state = 'chase';
            this.suspicionLevel = this.maxSuspicion;
            console.log(`${this.name} confirms threat - engaging!`);
            this.alertNearbyEnemies();
        } else if (this.suspicionLevel < 20) {
            // Suspicion has decreased, return to patrol
            this.state = 'patrol';
            console.log(`${this.name} returns to patrol`);
        } else {
            // Move towards last known player position
            this.moveTowardsTarget(playerPosition, delta, this.patrolSpeed * 1.5);
            this.isMoving = true;
            
            // Decrease suspicion slowly during investigation
            this.suspicionLevel = Math.max(0, this.suspicionLevel - (10 * delta));
        }
    }
    
    updatePatrolMovement(delta) {
        // Enhanced patrol movement with proper pathfinding
        if (!this.patrolPoints || this.patrolPoints.length === 0) {
            this.generatePatrolRoute();
            return;
        }
        
        const currentTarget = this.patrolPoints[this.currentPatrolIndex];
        if (!currentTarget) return;
        
        const currentPos = this.body.position;
        const distance = Math.sqrt(
            Math.pow(currentTarget.x - currentPos.x, 2) +
            Math.pow(currentTarget.z - currentPos.z, 2)
        );
        
        if (distance < 2) {
            // Reached patrol point, move to next one
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            console.log(`${this.name} reached patrol point ${this.currentPatrolIndex}`);
        } else {
            // Move towards current patrol point
            this.moveTowardsTarget(currentTarget, delta, this.patrolSpeed);
        }
    }
    
    moveTowardsTarget(target, delta, speed) {
        if (!target || !this.body) return;
        
        const currentPos = this.body.position;
        const direction = {
            x: target.x - currentPos.x,
            z: target.z - currentPos.z
        };
        
        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        
        if (distance > 0.1) {
            // Normalize direction
            direction.x /= distance;
            direction.z /= distance;
            
            // Apply movement
            this.body.velocity.x = direction.x * speed;
            this.body.velocity.z = direction.z * speed;
            
            // Face movement direction
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
        } else {
            // Stop movement when close to target
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
        }
    }
    
    updateAnimations() {
        // Update animation state based on current behavior
        if (this.animationManager) {
            let animationState = 'idle';
            
            if (this.isMoving) {
                animationState = 'walking';
            }
            
            // Only change animation if state actually changed
            if (this.previousState !== this.state || this.isMoving !== this.wasMoving) {
                this.animationManager.setAnimationState(this, animationState);
            }
            
            this.wasMoving = this.isMoving;
        }
    }
}

class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
        this.enemies = [];
        this.citySize = 400;
    }
    
    spawnCityNPCs() {
        console.log("Spawning NPCs across the city...");
        
        // Spawn more civilians (15-20)
        const civilianCount = 15 + Math.floor(Math.random() * 6);
        for (let i = 0; i < civilianCount; i++) {
            const position = this.getRandomCityPosition();
            const civilian = new NPC(this.scene, this.world, position, 'civilian');
            civilian.init();
            this.npcs.push(civilian);
        }
        
        // Spawn criminals (8-12) - Fixed syntax error
        const criminalCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < criminalCount; i++) {
            const position = this.getRandomCityPosition();
            const criminal = new NPC(this.scene, this.world, position, 'criminal');
            criminal.init();
            this.npcs.push(criminal);
        }
        
        // Spawn police (only 3-5, as requested)
        const policeCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < policeCount; i++) {
            const position = this.getRandomCityPosition();
            const police = new NPC(this.scene, this.world, position, 'police');
            police.init();
            this.npcs.push(police);
        }
        
        console.log(`Spawned ${this.npcs.length} NPCs across the city`);
    }
    
    getRandomCityPosition() {
        // Generate random position within city bounds, avoiding buildings
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: (Math.random() - 0.5) * (this.citySize - 50),
                y: 0,
                z: (Math.random() - 0.5) * (this.citySize - 50)
            };
            attempts++;
        } while (attempts < 10); // Prevent infinite loop
        
        return position;
    }
    
    spawnEnemiesNearParks() {
        // Get park locations from environment
        const environment = window.game.environment;
        if (!environment) {
            console.warn("Environment not available for enemy spawning");
            return this.spawnEnemiesRandomly();
        }
        
        const parkLocations = environment.getParkLocations();
        
        if (!parkLocations || parkLocations.length === 0) {
            console.warn("No park locations found, spawning enemies randomly");
            return this.spawnEnemiesRandomly();
        }
        
        const enemyCount = Math.min(10, Math.max(6, parkLocations.length * 2)); // 6-10 enemies
        
        console.log(`Spawning ${enemyCount} REPO enemies near ${parkLocations.length} parks`);
        
        for (let i = 0; i < enemyCount; i++) {
            const parkIndex = i % parkLocations.length;
            const parkLocation = parkLocations[parkIndex];
            
            // Spawn on roads near parks, not inside parks
            const enemyPosition = this.getPositionNearPark(parkLocation);
            
            if (enemyPosition) {
                const enemy = new Enemy(this.scene, this.world, enemyPosition);
                this.enemies.push(enemy);
                
                console.log(`REPO enemy ${i + 1} spawned near park at (${enemyPosition.x.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
            }
        }
        
        // Start mission with enemy count
        if (window.game && window.game.missionManager) {
            window.game.missionManager.startMission(this.enemies.length);
        }
        
        return this.enemies.length;
    }
    
    spawnUndercoverNPCs() {
        console.log("Spawning undercover NPCs for mission...");
        
        // This method should call the city-wide NPC spawning
        this.spawnCityNPCs();
        
        console.log(`Undercover NPCs spawned: ${this.npcs.length} total NPCs in the city`);
        
        // Log NPC distribution for debugging
        const npcTypes = {};
        this.npcs.forEach(npc => {
            npcTypes[npc.type] = (npcTypes[npc.type] || 0) + 1;
        });
        
        console.log("NPC Distribution:", npcTypes);
        
        return this.npcs.length;
    }
    
    getPositionNearPark(parkLocation) {
        // Generate positions on roads near parks (not inside parks)
        const attempts = 10;
        
        for (let attempt = 0; attempt < attempts; attempt++) {
            // Choose a direction from the park
            const angle = (Math.PI * 2 * attempt) / attempts; // Spread around park
            const distance = 25 + Math.random() * 35; // 25-60 units from park
            
            const position = {
                x: parkLocation.x + Math.cos(angle) * distance,
                y: 0,
                z: parkLocation.z + Math.sin(angle) * distance
            };
            
            // Ensure position is within city bounds
            const cityHalf = this.citySize / 2;
            if (Math.abs(position.x) < cityHalf - 20 && Math.abs(position.z) < cityHalf - 20) {
                console.log(`Enemy position near park: distance ${distance.toFixed(1)} units, angle ${(angle * 180 / Math.PI).toFixed(0)}°`);
                return position;
            }
        }
        
        // Fallback to random position near park center
        console.warn("Could not find suitable position near park, using fallback");
        return {
            x: parkLocation.x + (Math.random() - 0.5) * 40,
            y: 0,
            z: parkLocation.z + (Math.random() - 0.5) * 40
        };
    }
    
    spawnEnemiesRandomly() {
        // Fallback method if parks not available
        const enemyCount = 8;
        console.log(`Spawning ${enemyCount} enemies randomly (fallback)`);
        
        for (let i = 0; i < enemyCount; i++) {
            const position = this.getRandomCityPosition();
            const enemy = new Enemy(this.scene, this.world, position);
            this.enemies.push(enemy);
        }
        
        return enemyCount;
    }
    
    spawnEnemiesInParks() {
        // Updated method name for compatibility
        return this.spawnEnemiesNearParks();
    }
    
    alertNearbyNPCs(position, type) {
        this.npcs.forEach(npc => {
            if (npc.type === type || (type === 'criminal' && npc.type === 'criminal')) {
                const distance = Math.sqrt(
                    Math.pow(position.x - npc.position.x, 2) +
                    Math.pow(position.z - npc.position.z, 2)
                );
                
                if (distance < npc.alertRadius) {
                    npc.becomeHostile();
                }
            }
        });
    }
    
    update(playerPosition, delta) {
        this.npcs.forEach(npc => npc.update(playerPosition, delta));
        
        // Update enemies with player position
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                enemy.update(playerPosition, delta);
            }
        });
    }
    
    getNearestNPC(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.npcs.forEach(npc => {
            const distance = npc.getDistanceToPlayer(position);
            if (distance < minDistance) {
                nearest = npc;
                minDistance = distance;
            }
        });
        
        return { npc: nearest, distance: minDistance };
    }
    
    getNearestEnemy(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                const distance = enemy.getDistanceToPlayer(position);
                if (distance < minDistance) {
                    nearest = enemy;
                    minDistance = distance;
                }
            }
        });
        
        return { enemy: nearest, distance: minDistance };
    }
}

// Make classes globally available
window.NPC = NPC;
window.Enemy = Enemy;
window.NPCManager = NPCManager;

// Add global interaction handler for E key
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyE' && !event.repeat) {
            // Check if we have an interactable NPC nearby
            if (window.currentInteractableNPC && window.currentInteractableNPC.startDialogue) {
                console.log("E key pressed - attempting interaction");
                event.preventDefault();
                
                // Only interact if not already in dialogue
                if (window.game && window.game.dialogueSystem && !window.game.dialogueSystem.isActive) {
                    window.currentInteractableNPC.startDialogue();
                }
            }
        }
    });
    
    console.log("NPC interaction system initialized - press E near NPCs to talk");
}
