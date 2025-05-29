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
        // Use the character design system
        this.group = this.characterDesign.createNPCCharacter(this.type);
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
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
        const shape = new CANNON.Cylinder(0.4, 0.4, 1.6, 12);
        this.body = new CANNON.Body({ 
            mass: 70,
            material: new CANNON.Material({ friction: 0.3 })
        });
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 0.8, this.position.z);
        this.body.fixedRotation = true;
        this.world.addBody(this.body);
    }
    
    update(playerPosition, delta) {
        if (this.isDead) return;
        
        // Update walking animation
        this.updateWalkingAnimation(delta);
        
        // Update mesh position to match physics body
        if (this.body) {
            this.group.position.copy(this.body.position);
            this.group.position.y -= 0.8;
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
        
        // Change appearance to show hostility (red tint)
        this.group.traverse((child) => {
            if (child.material) {
                child.material.emissive = new THREE.Color(0x440000);
            }
        });
    }
    
    takeDamage(damage) {
        if (this.isDead) return false;
        
        this.health -= damage;
        console.log(`${this.name} takes ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Visual damage effect
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                child.material.emissive.setHex(0x440000);
                setTimeout(() => {
                    if (!this.isDead) {
                        child.material.emissive.setHex(0x000000);
                    }
                }, 200);
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
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.health = 0;
        console.log(`${this.name} has been eliminated!`);
        
        // Death animation - fall over
        this.group.rotation.z = Math.PI / 2;
        this.group.position.y -= 0.5;
        
        // Change color to indicate death
        this.group.traverse((child) => {
            if (child.material) {
                child.material.color.multiplyScalar(0.3);
                child.material.emissive.setHex(0x000000);
            }
        });
        
        // Remove physics body
        this.world.removeBody(this.body);
        
        // Remove from scene after a delay
        setTimeout(() => {
            this.scene.remove(this.group);
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
        // Use the character design system
        const result = this.characterDesign.createEnemyCharacter();
        this.group = result.group;
        this.weaponGroup = result.weaponGroup;
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
    }
    
    createPhysicsBody() {
        // Create physics body for collision (cylinder)
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
        this.body.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        
        // Add to physics world
        this.world.addBody(this.body);
        
        console.log("Enemy physics body created");
    }
    
    update(playerPosition, delta) {
        if (!this.body || !playerPosition) return;
        
        // Update mesh position to match physics body
        this.group.position.copy(this.body.position);
        this.group.position.y -= 0.9; // Adjust for center offset
        
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
        
        // Change appearance
        this.group.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.color.multiplyScalar(0.5); // Darken
                child.material.emissive.setHex(0x000000);
            }
        });
        
        // Remove physics body immediately to prevent further collisions
        if (this.body) {
            this.world.removeBody(this.body);
            this.body = null;
        }
        
        // Remove from scene after delay
        setTimeout(() => {
            if (this.group && this.group.parent) {
                this.scene.remove(this.group);
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
