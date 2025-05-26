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
        
        // Movement properties
        this.walkSpeed = 2.0;
        this.isMoving = false;
        this.moveDirection = new THREE.Vector3();
        this.targetPosition = null;
        this.lastDirectionChange = 0;
        this.directionChangeInterval = Math.random() * 3000 + 2000; // 2-5 seconds
        this.walkRadius = 15; // How far they'll walk from spawn point
        this.spawnPosition = { ...position };
        this.isWalking = false;
        this.walkAnimationTime = 0;
        
        // Animation properties
        this.bodyBob = 0;
        this.armSwing = 0;
        this.legSwing = 0;
        
        // Pathfinding
        this.pathfindingCooldown = 0;
        this.stuckCounter = 0;
        this.lastPosition = new THREE.Vector3();
        
        // Use character design system
        this.characterDesign = new CharacterDesign();
        this.name = this.characterDesign.generateCharacterName(type);
    }
    
    init() {
        this.createCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        console.log(`${this.type} NPC created:`, this.name);
    }
    
    createCharacter() {
        // Use the enhanced character design system with hands and legs
        this.group = this.characterDesign.createCompleteCharacter(this.type, {
            expression: this.getRandomExpression(),
            gender: Math.random() > 0.5 ? 'male' : 'female',
            skinTone: this.characterDesign.getRandomSkinTone(),
            hairColor: this.characterDesign.getRandomHairColor(),
            eyeColor: this.characterDesign.getRandomEyeColor()
        });
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
        
        console.log(`Created detailed ${this.type} character with hands and legs: ${this.name}`);
    }
    
    getRandomExpression() {
        switch(this.type) {
            case 'police':
                return 'serious';
            case 'criminal':
                return 'suspicious';
            default:
                const expressions = ['neutral', 'happy', 'surprised'];
                return expressions[Math.floor(Math.random() * expressions.length)];
        }
    }
    
    createPhysicsBody() {
        // Adjusted physics body size for bigger characters
        const shape = new CANNON.Cylinder(0.6, 0.6, 2.2, 12); // Bigger collision cylinder
        this.body = new CANNON.Body({ 
            mass: 70,
            material: new CANNON.Material({ friction: 0.3 })
        });
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 1.1, this.position.z); // Higher position
        this.body.fixedRotation = true;
        this.world.addBody(this.body);
    }
    
    update(playerPosition, delta) {
        // Update mesh position - adjusted for bigger characters
        if (this.body) {
            this.group.position.copy(this.body.position);
            this.group.position.y -= 1.1; // Adjusted offset for bigger characters
        }
        
        // Check for player interaction
        if (playerPosition && window.game && window.game.dialogueSystem) {
            const distance = this.getDistanceToPlayer(playerPosition);
            window.game.dialogueSystem.checkInteraction(this, distance);
        }
        
        // Update movement and behavior
        if (!this.isDead) {
            if (this.isHostile && playerPosition) {
                this.hostileBehavior(playerPosition, delta);
            } else {
                this.wanderBehavior(delta);
            }
            
            // Update walking animation
            this.updateWalkingAnimation(delta);
        }
        
        // Update pathfinding cooldown
        if (this.pathfindingCooldown > 0) {
            this.pathfindingCooldown -= delta * 1000;
        }
    }
    
    wanderBehavior(delta) {
        if (this.isDead || this.isHostile) return;
        
        const now = Date.now();
        
        // Check if stuck (not moving when supposed to)
        if (this.isMoving) {
            const currentPos = new THREE.Vector3().copy(this.body.position);
            const distanceMoved = currentPos.distanceTo(this.lastPosition);
            
            if (distanceMoved < 0.1) {
                this.stuckCounter++;
                if (this.stuckCounter > 60) { // About 1 second at 60fps
                    this.findNewDirection();
                    this.stuckCounter = 0;
                }
            } else {
                this.stuckCounter = 0;
            }
            
            this.lastPosition.copy(currentPos);
        }
        
        // Change direction periodically or when reaching target
        if (now - this.lastDirectionChange > this.directionChangeInterval || this.hasReachedTarget()) {
            this.findNewDirection();
            this.lastDirectionChange = now;
            this.directionChangeInterval = Math.random() * 4000 + 2000;
        }
        
        // Apply movement
        if (this.isMoving && this.targetPosition) {
            this.moveTowardsTarget(delta);
        }
    }
    
    findNewDirection() {
        // 70% chance to move, 30% chance to stop and idle
        if (Math.random() < 0.7) {
            // Find a random point within walking radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.walkRadius;
            
            this.targetPosition = {
                x: this.spawnPosition.x + Math.cos(angle) * distance,
                z: this.spawnPosition.z + Math.sin(angle) * distance
            };
            
            // Make sure target is within reasonable bounds
            const cityBounds = 180;
            this.targetPosition.x = Math.max(-cityBounds, Math.min(cityBounds, this.targetPosition.x));
            this.targetPosition.z = Math.max(-cityBounds, Math.min(cityBounds, this.targetPosition.z));
            
            this.isMoving = true;
            this.isWalking = true;
            
            // Face the target direction
            const direction = new THREE.Vector3(
                this.targetPosition.x - this.body.position.x,
                0,
                this.targetPosition.z - this.body.position.z
            ).normalize();
            
            if (direction.length() > 0) {
                const angle = Math.atan2(direction.x, direction.z);
                this.group.rotation.y = angle;
            }
            
            // console.log(`${this.name} (${this.type}) moving to:`, this.targetPosition);
        } else {
            // Stop and idle
            this.isMoving = false;
            this.isWalking = false;
            this.targetPosition = null;
            this.body.velocity.x = 0;
            this.body.velocity.z = 0;
            
            // console.log(`${this.name} (${this.type}) stopping to idle`);
        }
    }
    
    hasReachedTarget() {
        if (!this.targetPosition || !this.body) return false;
        
        const distance = Math.sqrt(
            Math.pow(this.targetPosition.x - this.body.position.x, 2) +
            Math.pow(this.targetPosition.z - this.body.position.z, 2)
        );
        
        return distance < 2.0; // Within 2 units of target
    }
    
    moveTowardsTarget(delta) {
        if (!this.targetPosition || !this.body) return;
        
        // Calculate direction to target
        const direction = new THREE.Vector3(
            this.targetPosition.x - this.body.position.x,
            0,
            this.targetPosition.z - this.body.position.z
        ).normalize();
        
        // Apply movement velocity
        const speed = this.walkSpeed;
        this.body.velocity.x = direction.x * speed;
        this.body.velocity.z = direction.z * speed;
        
        // Face movement direction
        if (direction.length() > 0) {
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
        }
        
        // Apply some damping to prevent sliding
        this.body.velocity.x *= 0.9;
        this.body.velocity.z *= 0.9;
        
        // Update sphere leg rolling based on actual movement
        this.updateSpherePhysics(direction, speed, delta);
    }
    
    updateSpherePhysics(direction, speed, delta) {
        // Update proper leg animation instead of sphere physics
        this.updateProperLegAnimation(direction, speed, delta);
    }
    
    updateProperLegAnimation(direction, speed, delta) {
        // Get leg references
        const leftLeg = this.group.userData.leftLeg;
        const rightLeg = this.group.userData.rightLeg;
        
        if (!leftLeg || !rightLeg) return;
        
        if (this.isMoving && speed > 0) {
            // Create walking animation for proper legs
            const walkCycle = Date.now() * 0.005; // Walking cycle timing
            
            // Animate left leg
            if (leftLeg.userData.isProperLeg) {
                const leftThigh = leftLeg.userData.thigh;
                const leftShin = leftLeg.userData.shin;
                
                if (leftThigh && leftShin) {
                    // Thigh rotation (hip movement)
                    leftThigh.rotation.x = Math.sin(walkCycle) * 0.3;
                    // Shin rotation (knee movement)  
                    leftShin.rotation.x = Math.max(0, Math.sin(walkCycle + Math.PI/4) * 0.4);
                }
            }
            
            // Animate right leg (opposite phase)
            if (rightLeg.userData.isProperLeg) {
                const rightThigh = rightLeg.userData.thigh;
                const rightShin = rightLeg.userData.shin;
                
                if (rightThigh && rightShin) {
                    // Thigh rotation (hip movement) - opposite phase
                    rightThigh.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
                    // Shin rotation (knee movement) - opposite phase
                    rightShin.rotation.x = Math.max(0, Math.sin(walkCycle + Math.PI + Math.PI/4) * 0.4);
                }
            }
        } else {
            // Return to rest position when not moving
            const leftLeg = this.group.userData.leftLeg;
            const rightLeg = this.group.userData.rightLeg;
            
            if (leftLeg && leftLeg.userData.isProperLeg) {
                const leftThigh = leftLeg.userData.thigh;
                const leftShin = leftLeg.userData.shin;
                if (leftThigh) leftThigh.rotation.x *= 0.9;
                if (leftShin) leftShin.rotation.x *= 0.9;
            }
            
            if (rightLeg && rightLeg.userData.isProperLeg) {
                const rightThigh = rightLeg.userData.thigh;
                const rightShin = rightLeg.userData.shin;
                if (rightThigh) rightThigh.rotation.x *= 0.9;
                if (rightShin) rightShin.rotation.x *= 0.9;
            }
        }
    }
    
    applySphereWalkingAnimations() {
        if (!this.group) return;
        
        // Find character parts and animate them
        this.group.traverse((child) => {
            if (child.name || child.userData.bodyPart) {
                switch(child.userData.bodyPart || child.name) {
                    case 'body':
                        child.position.y = this.bodyBob;
                        break;
                    case 'leftArm':
                        child.rotation.z = this.armSwing * 0.5;
                        break;
                    case 'rightArm':
                        child.rotation.z = -this.armSwing * 0.5;
                        break;
                    case 'leftLeg':
                        this.animateProperLeg(child, 'left');
                        break;
                    case 'rightLeg':
                        this.animateProperLeg(child, 'right');
                        break;
                }
            }
        });
    }
    
    animateProperLeg(legGroup, side) {
        if (!legGroup.userData.isProperLeg) return;
        
        const thigh = legGroup.userData.thigh;
        const shin = legGroup.userData.shin;
        const foot = legGroup.userData.foot;
        
        if (!thigh || !shin || !foot) return;
        
        if (this.isMoving) {
            // Walking animation is handled in updateProperLegAnimation
            // Add foot positioning here if needed
            const walkCycle = Date.now() * 0.005;
            const phaseOffset = side === 'left' ? 0 : Math.PI;
            
            // Subtle foot lift during walk cycle
            const footLift = Math.max(0, Math.sin(walkCycle + phaseOffset)) * 0.1;
            foot.position.y = -1.14 + footLift;
        } else {
            // Return foot to rest position
            foot.position.y += ((-1.14) - foot.position.y) * 0.1;
        }
    }
    
    // Enhanced hostile behavior that overrides wandering
    hostileBehavior(playerPosition, delta) {
        // Stop wandering when hostile
        this.isMoving = false;
        this.isWalking = false;
        this.targetPosition = null;
        
        const distance = this.getDistanceToPlayer(playerPosition);
        
        if (distance < 15) {
            // Move towards player
            const direction = new THREE.Vector3(
                playerPosition.x - this.body.position.x,
                0,
                playerPosition.z - this.body.position.z
            ).normalize();
            
            this.body.velocity.x = direction.x * this.walkSpeed;
            this.body.velocity.z = direction.z * this.walkSpeed;
            
            // Face the player
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
            
            this.isMoving = true;
            this.isWalking = true;
        }
    }
    
    takeDamage(damage) {
        if (this.isDead) return false;
        
        this.health -= damage;
        console.log(`${this.name} takes ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Visual damage effect
        this.group.traverse((child) => {
            if (child.material) {
                const originalColor = child.material.color ? child.material.color.clone() : new THREE.Color(0xffffff);
                child.material.color.setHex(0xff0000); // Flash red
                
                setTimeout(() => {
                    if (child.material && !this.isDead) {
                        child.material.color.copy(originalColor);
                    }
                }, 200);
            }
        });
        
        if (this.health <= 0) {
            this.die();
            return true; // NPC killed
        }
        
        // Become hostile when shot
        if (!this.isHostile) {
            this.becomeHostile();
        }
        
        return false;
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
                if (child.material.color) child.material.color.setHex(0x666666);
            }
        });
        
        // Remove physics body
        this.world.removeBody(this.body);
        
        // Remove from scene after a delay
        setTimeout(() => {
            if (this.scene && this.group && this.group.parent) {
                this.scene.remove(this.group);
            }
        }, 5000);
    }
    
    becomeHostile() {
        if (this.isHostile) return;
        
        this.isHostile = true;
        // Stop current movement
        this.isMoving = false;
        this.isWalking = false;
        this.targetPosition = null;
        
        console.log(`${this.name} becomes hostile!`);
        
        // Change appearance to show hostility (red tint)
        this.group.traverse((child) => {
            if (child.material && child.material.color) {
                child.material.color.multiplyScalar(1.2);
                child.material.color.r = Math.min(1, child.material.color.r * 1.5);
            }
        });
    }
    
    getDistanceToPlayer(playerPosition) {
        if (!this.body) return Infinity;
        
        return Math.sqrt(
            Math.pow(playerPosition.x - this.body.position.x, 2) +
            Math.pow(playerPosition.y - this.body.position.y, 2) +
            Math.pow(playerPosition.z - this.body.position.z, 2)
        );
    }
}

class Enemy {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 5, y: 0, z: 5 };
        
        // Enemy properties - ensure maxHealth is set
        this.maxHealth = 150;
        this.health = this.maxHealth;
        this.speed = 2;
        this.attackDamage = 25;
        this.detectionRange = 15;
        this.attackRange = 2;
        this.isDead = false;
        
        // Enhanced weapon properties for shooting
        this.hasWeapon = true;
        this.ammo = 50;
        this.weaponRange = 25;
        this.lastShotTime = 0;
        this.shotCooldown = 800;
        this.accuracy = 0.75;
        this.burstMode = false;
        this.burstCount = 0;
        this.maxBurstShots = 3;
        this.burstCooldown = 2000;
        
        // Enemy bullets array
        this.bullets = [];
        this.bulletSpeed = 80;
        this.bulletLifetime = 4000;
        
        // 3D objects
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.weaponGroup = new THREE.Group();
        
        // Enhanced AI state for target locking and shooting
        this.state = 'patrol';
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000;
        this.playerDetected = false;
        this.isTargetLocked = false;
        this.lockOnTime = 0;
        this.lockOnDuration = 1000;
        this.alertness = 'calm';
        this.lastKnownPlayerPosition = null;
        this.searchTime = 0;
        this.maxSearchTime = 5000;
        
        // Group communication for coordinated attacks
        this.alertRadius = 30;
        this.isAlerting = false;
        this.groupCombatMode = false;
        
        // Chasing behavior
        this.isChasing = false;
        this.chaseSpeed = 3.5; // Faster than normal speed
        this.maxChaseDistance = 50; // Max distance to chase player
        this.lastPlayerSighting = 0;
        this.chaseLostTimeout = 5000; // Stop chasing after 5 seconds of no sight
        
        // Use character design system
        this.characterDesign = new CharacterDesign();
        
        this.init();
    }
    
    init() {
        this.createRepoCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        console.log("REPO enemy created at position:", this.position);
    }
    
    createRepoCharacter() {
        // Use the enhanced character design system
        const result = this.characterDesign.createEnemyCharacter();
        this.group = result.group;
        this.weaponGroup = result.weaponGroup;
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
        
        console.log("Created detailed REPO enemy with full body, hands, and legs");
    }
    
    createPhysicsBody() {
        // Create physics body for collision (cylinder) - bigger for larger characters
        const shape = new CANNON.Cylinder(0.7, 0.7, 2.5, 12); // Bigger collision cylinder
        
        this.body = new CANNON.Body({
            mass: 100, // Heavy enemy
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.1
            }),
            fixedRotation: true // Prevent tumbling
        });
        
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 1.25, this.position.z); // Higher position
        
        // Add to physics world
        this.world.addBody(this.body);
        
        console.log("Enemy physics body created with bigger dimensions");
    }
    
    update(playerPosition, delta) {
        if (!this.body || !playerPosition) return;
        
        // Update mesh position to match physics body
        this.group.position.copy(this.body.position);
        this.group.position.y -= 1.25;
        
        // Update enemy bullets
        this.updateEnemyBullets(delta);
        
        // Enhanced AI behavior with shooting
        this.updateAI(playerPosition, delta);
        
        // Keep enemy upright
        this.body.angularVelocity.set(0, 0, 0);
        
        // Update walking animation when moving
        if (this.isMoving) {
            this.updateWalkingAnimation(delta);
        }
    }
    
    updateAI(playerPosition, delta) {
        const distanceToPlayer = this.getDistanceToPlayer(playerPosition);
        
        // Check if player is within detection range
        if (distanceToPlayer <= this.detectionRange && !this.playerDetected) {
            this.detectPlayer(playerPosition);
        }
        
        // Alert nearby enemies when player is detected
        if (this.playerDetected && !this.isAlerting) {
            this.alertNearbyEnemies(playerPosition);
            this.isAlerting = true;
        }
        
        // Enhanced state machine with shooting capabilities
        switch(this.state) {
            case 'patrol':
                this.handlePatrolState(playerPosition, distanceToPlayer);
                break;
                
            case 'investigating':
                this.handleInvestigatingState(playerPosition, distanceToPlayer, delta);
                break;
                
            case 'targeting':
                this.handleTargetingState(playerPosition, distanceToPlayer, delta);
                break;
                
            case 'combat':
                this.handleCombatState(playerPosition, distanceToPlayer, delta);
                break;
        }
    }
    
    handlePatrolState(playerPosition, distanceToPlayer) {
        // Basic patrol behavior
        if (distanceToPlayer <= this.detectionRange) {
            this.detectPlayer(playerPosition);
        }
    }
    
    handleInvestigatingState(playerPosition, distanceToPlayer, delta) {
        // Investigating behavior
        if (distanceToPlayer <= this.detectionRange) {
            this.state = 'targeting';
        }
    }
    
    alertNearbyEnemies(playerPosition) {
        // Alert all enemies in the area
        if (window.game && window.game.npcManager) {
            const enemies = window.game.npcManager.enemies;
            
            enemies.forEach(otherEnemy => {
                if (otherEnemy !== this && !otherEnemy.isDead) {
                    const distance = this.getDistanceToEnemy(otherEnemy);
                    
                    if (distance <= this.alertRadius) {
                        otherEnemy.receiveAlert(playerPosition);
                    }
                }
            });
        }
        
        console.log("Enemy group alerted! All enemies in area now hostile!");
    }
    
    receiveAlert(playerPosition) {
        if (!this.playerDetected && !this.isDead) {
            this.playerDetected = true;
            this.state = 'investigating';
            this.lastKnownPlayerPosition = {
                x: playerPosition.x,
                y: playerPosition.y,
                z: playerPosition.z
            };
            this.groupCombatMode = true;
            
            console.log("Enemy received group alert! Joining combat...");
            
            // Create alert effect
            this.createAlertEffect();
        }
    }
    
    fireAtPlayer(playerPosition) {
        try {
            // Get shooting direction with some inaccuracy
            const direction = new THREE.Vector3(
                playerPosition.x - this.body.position.x,
                playerPosition.y - this.body.position.y + 1, // Aim at player center
                playerPosition.z - this.body.position.z
            ).normalize();
            
            // Add accuracy variation
            const accuracySpread = (1 - this.accuracy) * 0.3; // Max spread of 0.3 radians
            direction.x += (Math.random() - 0.5) * accuracySpread;
            direction.y += (Math.random() - 0.5) * accuracySpread * 0.5; // Less vertical spread
            direction.z += (Math.random() - 0.5) * accuracySpread;
            direction.normalize();
            
            // Create enemy bullet
            this.createEnemyBullet(direction);
            
            // Create muzzle flash
            this.createEnemyMuzzleFlash();
            
            // Weapon recoil animation
            this.createEnemyRecoilEffect();
            
        } catch (error) {
            console.error("Error firing at player:", error);
        }
    }
    
    createEnemyBullet(direction) {
        try {
            // Get weapon position
            const startPosition = this.group.position.clone();
            startPosition.y += 1.5; // Adjust for weapon height
            
            // Weapon barrel offset
            const weaponOffset = direction.clone().multiplyScalar(0.5);
            startPosition.add(weaponOffset);
            
            // Create bullet visual (red for enemy bullets)
            const bulletGeometry = new THREE.SphereGeometry(0.015, 6, 6);
            const bulletMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000, // Red enemy bullets
                emissive: 0x440000,
                transparent: true,
                opacity: 0.9
            });
            const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
            
            // Position bullet at weapon
            bulletMesh.position.copy(startPosition);
            
            // Add bullet to scene
            this.scene.add(bulletMesh);
            
            // Create bullet trail
            const trailGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.15, 4);
            const trailMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff4444,
                transparent: true,
                opacity: 0.7
            });
            const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
            trailMesh.rotation.x = Math.PI / 2;
            bulletMesh.add(trailMesh);
            
            // Create bullet object
            const bullet = {
                mesh: bulletMesh,
                direction: direction.clone(),
                speed: this.bulletSpeed,
                startTime: Date.now(),
                damage: this.attackDamage,
                owner: this
            };
            
            // Add to bullets array
            this.bullets.push(bullet);
            
        } catch (error) {
            console.error("Error creating enemy bullet:", error);
        }
    }
    
    updateEnemyBullets(delta) {
        try {
            const now = Date.now();
            
            // Update each bullet
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                const age = now - bullet.startTime;
                
                // Remove old bullets
                if (age > this.bulletLifetime) {
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                // Move bullet
                const movement = bullet.direction.clone().multiplyScalar(bullet.speed * delta);
                bullet.mesh.position.add(movement);
                
                // Check for collisions
                if (this.checkEnemyBulletCollisions(bullet, i)) {
                    // Bullet hit something, remove it
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                // Fade bullet over time
                const fadeStart = this.bulletLifetime * 0.8;
                if (age > fadeStart) {
                    const fadeProgress = (age - fadeStart) / (this.bulletLifetime - fadeStart);
                    bullet.mesh.material.opacity = 0.9 * (1 - fadeProgress);
                }
            }
        } catch (error) {
            console.error("Error updating enemy bullets:", error);
        }
    }
    
    checkEnemyBulletCollisions(bullet, bulletIndex) {
        try {
            const bulletPos = bullet.mesh.position;
            
            // Check collision with player
            if (window.game && window.game.player && window.game.player.body) {
                const playerPos = window.game.player.body.position;
                const distanceToPlayer = bulletPos.distanceTo(playerPos);
                
                // Player collision radius (adjust as needed)
                const playerRadius = 0.8;
                
                if (distanceToPlayer <= playerRadius) {
                    // Hit player!
                    this.hitPlayer(bullet.damage, bulletPos);
                    return true; // Remove bullet
                }
            }
            
            // Check collision with ground
            if (bulletPos.y <= 0.1) {
                this.createEnemyBulletHitEffect(bulletPos);
                return true;
            }
            
            // Check collision with buildings (basic check)
            if (Math.abs(bulletPos.x) > 200 || Math.abs(bulletPos.z) > 200) {
                return true; // Remove bullets that go out of bounds
            }
            
            return false; // No collision
            
        } catch (error) {
            console.error("Error checking enemy bullet collisions:", error);
            return false;
        }
    }
    
    hitPlayer(damage, hitPoint) {
        try {
            console.log(`Player hit by enemy bullet for ${damage} damage!`);
            
            // Create hit effect at impact point
            this.createPlayerHitEffect(hitPoint);
            
            // Damage player through game instance
            if (window.game && typeof window.game.playerTakeDamage === 'function') {
                window.game.playerTakeDamage(damage);
            } else {
                console.warn("Could not damage player - game.playerTakeDamage not available");
            }
            
        } catch (error) {
            console.error("Error hitting player:", error);
        }
    }
    
    createPlayerHitEffect(position) {
        try {
            // Create blood-like particle effect
            const particleCount = 6;
            const hitGroup = new THREE.Group();
            
            for (let i = 0; i < particleCount; i++) {
                const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
                const particleMaterial = new THREE.MeshBasicMaterial({
                    color: 0x8B0000, // Dark red particles
                    transparent: true,
                    opacity: 0.8
                });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                
                // Random particle direction
                const angle = (i / particleCount) * Math.PI * 2;
                const distance = Math.random() * 0.2 + 0.1;
                particle.position.set(
                    Math.cos(angle) * distance,
                    Math.random() * 0.1,
                    Math.sin(angle) * distance
                );
                
                hitGroup.add(particle);
            }
            
            hitGroup.position.copy(position);
            this.scene.add(hitGroup);
            
            // Animate particles
            const startTime = Date.now();
            const animateHit = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 800; // 800ms animation
                
                if (progress >= 1) {
                    this.scene.remove(hitGroup);
                    return;
                }
                
                hitGroup.children.forEach((particle) => {
                    particle.position.y -= 0.015; // Fall down
                    particle.material.opacity = 0.8 * (1 - progress);
                });
                
                requestAnimationFrame(animateHit);
            };
            
            animateHit();
            
        } catch (error) {
            console.error("Error creating player hit effect:", error);
        }
    }
    
    createEnemyBulletHitEffect(position) {
        try {
            // Create red sparks for enemy bullet impacts
            const sparkCount = 4;
            const sparkGroup = new THREE.Group();
            
            for (let i = 0; i < sparkCount; i++) {
                const sparkGeometry = new THREE.SphereGeometry(0.015, 4, 4);
                const sparkMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff4444,
                    transparent: true,
                    opacity: 0.9
                });
                const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
                
                const angle = (i / sparkCount) * Math.PI * 2;
                const distance = Math.random() * 0.2 + 0.05;
                spark.position.set(
                    Math.cos(angle) * distance,
                    Math.random() * 0.1,
                    Math.sin(angle) * distance
                );
                
                sparkGroup.add(spark);
            }
            
            sparkGroup.position.copy(position);
            this.scene.add(sparkGroup);
            
            // Animate sparks
            const startTime = Date.now();
            const animateSparks = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 300;
                
                if (progress >= 1) {
                    this.scene.remove(sparkGroup);
                    return;
                }
                
                sparkGroup.children.forEach((spark) => {
                    spark.position.y -= 0.01;
                    spark.material.opacity = 0.9 * (1 - progress);
                });
                
                requestAnimationFrame(animateSparks);
            };
            
            animateSparks();
            
        } catch (error) {
            console.error("Error creating enemy bullet hit effect:", error);
        }
    }
    
    createEnemyMuzzleFlash() {
        try {
            if (!this.weaponGroup && !this.group) return;
            
            // Create red muzzle flash
            const flashGeometry = new THREE.SphereGeometry(0.08, 6, 6);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF4400,
                transparent: true,
                opacity: 0.9
            });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            
            // Position at weapon barrel
            flash.position.set(0, 1.5, 0.6); // Adjust based on enemy weapon position
            this.group.add(flash);
            
            // Remove flash quickly
            setTimeout(() => {
                if (this.group && flash.parent) {
                    this.group.remove(flash);
                }
            }, 60);
            
        } catch (error) {
            console.error("Error creating enemy muzzle flash:", error);
        }
    }
    
    createEnemyRecoilEffect() {
        try {
            if (!this.group) return;
            
            // Simple recoil animation for enemy
            const originalRotation = this.group.rotation.x;
            
            // Quick recoil
            this.group.rotation.x += 0.05;
            
            // Return to original rotation
            setTimeout(() => {
                if (this.group) {
                    this.group.rotation.x = originalRotation;
                }
            }, 80);
            
        } catch (error) {
            console.error("Error creating enemy recoil effect:", error);
        }
    }
    
    createAlertEffect() {
        try {
            // Create red alert light above enemy
            const alertGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const alertMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.8
            });
            const alertLight = new THREE.Mesh(alertGeometry, alertMaterial);
            
            alertLight.position.set(0, 3, 0); // Above enemy
            this.group.add(alertLight);
            
            // Pulsing alert animation
            let pulseDirection = 1;
            const pulseInterval = setInterval(() => {
                if (!this.group || this.isDead) {
                    clearInterval(pulseInterval);
                    return;
                }
                
                alertLight.material.opacity += pulseDirection * 0.1;
                if (alertLight.material.opacity >= 1 || alertLight.material.opacity <= 0.3) {
                    pulseDirection *= -1;
                }
            }, 100);
            
            // Remove alert after 3 seconds
            setTimeout(() => {
                if (this.group && alertLight.parent) {
                    this.group.remove(alertLight);
                    clearInterval(pulseInterval);
                }
            }, 3000);
            
        } catch (error) {
            console.error("Error creating alert effect:", error);
        }
    }
    
    createLockOnEffect() {
        try {
            // Create targeting reticle above enemy
            const reticleGeometry = new THREE.RingGeometry(0.2, 0.25, 8);
            const reticleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
            
            reticle.position.set(0, 2.5, 0);
            reticle.rotation.x = Math.PI / 2; // Lay flat
            this.group.add(reticle);
            
            // Remove reticle after 1 second
            setTimeout(() => {
                if (this.group && reticle.parent) {
                    this.group.remove(reticle);
                }
            }, 1000);
            
        } catch (error) {
            console.error("Error creating lock-on effect:", error);
        }
    }
    
    facePosition(position) {
        if (!this.body) return;
        
        const direction = new THREE.Vector3(
            position.x - this.body.position.x,
            0,
            position.z - this.body.position.z
        ).normalize();
        
        if (direction.length() > 0) {
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
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
        
        // Movement debugging
        this.debugMovement = false;
    }
    
    spawnCityNPCs() {
        console.log("Spawning NPCs with sphere legs across the city...");
        
        // Spawn more civilians (15-20) with sphere leg movement
        const civilianCount = 15 + Math.floor(Math.random() * 6);
        for (let i = 0; i < civilianCount; i++) {
            const position = this.getRandomCityPosition();
            this.spawnNPC(position, 'civilian');
        }
        
        // Spawn criminals (8-12) with more erratic sphere movement
        const criminalCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < criminalCount; i++) {
            const position = this.getRandomCityPosition();
            this.spawnNPC(position, 'criminal');
        }
        
        // Spawn police (only 3-5) with patrol-like sphere movement
        const policeCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < policeCount; i++) {
            const position = this.getRandomCityPosition();
            this.spawnNPC(position, 'police');
        }
        
        console.log(`Spawned ${this.npcs.length} NPCs with sphere legs and rolling animations`);
    }
    
    spawnNPC(position, type) {
        try {
            const npc = new NPC(this.scene, this.world, position, type);
            npc.init();
            this.npcs.push(npc);
            console.log(`Spawned ${type} NPC at position:`, position);
        } catch (error) {
            console.error(`Error spawning ${type} NPC:`, error);
        }
    }
    
    getRandomCityPosition() {
        // Generate random position within city bounds, avoiding buildings
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: (Math.random() - 0.5) * 180, // Within city bounds
                y: 2, // Above ground
                z: (Math.random() - 0.5) * 180
            };
            attempts++;
        } while (attempts < 10);
        
        return position;
    }
    
    spawnEnemiesInParks() {
        // Get park and tree locations from environment
        const environment = window.game.environment;
        if (!environment) return 0;
        
        const treeLocations = environment.getTreeLocations();
        const parkLocations = environment.getParkLocations();
        const parkEntrances = environment.getParkEntrances();
        
        // Spawn enemies in parks and near trees
        const enemyCount = Math.min(8, Math.max(5, treeLocations.length));
        console.log(`Spawning ${enemyCount} REPO enemies in parks with chase and entrance behavior`);
        
        for (let i = 0; i < enemyCount; i++) {
            let spawnPosition;
            let associatedPark = null;
            
            if (i < parkLocations.length) {
                // Spawn in park center initially
                const park = parkLocations[i];
                spawnPosition = {
                    x: park.x + (Math.random() - 0.5) * 8, // Random position within park
                    y: 2,
                    z: park.z + (Math.random() - 0.5) * 8
                };
                associatedPark = park;
            } else if (treeLocations.length > 0) {
                // Spawn near trees as fallback
                const tree = treeLocations[i % treeLocations.length];
                spawnPosition = {
                    x: tree.x + (Math.random() - 0.5) * 4,
                    y: 2,
                    z: tree.z + (Math.random() - 0.5) * 4
                };
            } else {
                // Random spawn as final fallback
                spawnPosition = {
                    x: (Math.random() - 0.5) * 180,
                    y: 2,
                    z: (Math.random() - 0.5) * 180
                };
            }
            
            const enemy = new Enemy(this.scene, this.world, spawnPosition);
            
            // Associate enemy with park and entrances for AI
            if (associatedPark) {
                enemy.homePark = associatedPark;
                enemy.parkEntrances = parkEntrances.filter(entrance => 
                    entrance.parkCenter.x === associatedPark.x && 
                    entrance.parkCenter.z === associatedPark.z
                );
                console.log(`Enemy ${i} assigned to park at (${associatedPark.x}, ${associatedPark.z}) with ${enemy.parkEntrances.length} entrances`);
            }
            
            this.enemies.push(enemy);
        }
        
        // Start mission with enemy count
        if (window.game && window.game.missionManager) {
            window.game.missionManager.startMission(this.enemies.length);
        }
        
        console.log(`Spawned ${this.enemies.length} enemies with park entrance awareness`);
        return this.enemies.length;
    }
    
    update(playerPosition, delta) {
        // Update NPCs with movement
        this.npcs.forEach(npc => {
            if (npc && !npc.isDead) {
                try {
                    npc.update(playerPosition, delta);
                } catch (error) {
                    console.error("Error updating NPC:", error);
                }
            }
        });
        
        // Update enemies with movement and AI - filter out dead enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy) {
                console.log("Removing null enemy from array");
                this.enemies.splice(i, 1);
                continue;
            }
            
            if (enemy.isDead) {
                console.log("Removing dead enemy from active list");
                // Don't remove immediately to allow death animation
                // but skip updating dead enemies
                continue;
            }
            
            try {
                enemy.update(playerPosition, delta);
            } catch (error) {
                console.error("Error updating enemy:", error);
                // Remove problematic enemy
                this.enemies.splice(i, 1);
            }
        }
        
        // Clean up dead enemies periodically
        if (Math.random() < 0.01) { // 1% chance per frame to clean up
            this.cleanupDeadEnemies();
        }
        
        // Debug movement info occasionally
        if (this.debugMovement && Math.random() < 0.001) {
            const aliveEnemies = this.enemies.filter(e => e && !e.isDead).length;
            console.log(`NPCManager: ${this.npcs.length} NPCs, ${aliveEnemies}/${this.enemies.length} enemies alive`);
        }
    }
    
    cleanupDeadEnemies() {
        const initialCount = this.enemies.length;
        this.enemies = this.enemies.filter(enemy => enemy && !enemy.isDead);
        const finalCount = this.enemies.length;
        
        if (finalCount < initialCount) {
            console.log(`Cleaned up ${initialCount - finalCount} dead enemies. ${finalCount} enemies remaining.`);
        }
    }
    
    // Method to get living enemies count
    getLivingEnemiesCount() {
        return this.enemies.filter(enemy => enemy && !enemy.isDead).length;
    }
    
    // Method to get all living enemies
    getLivingEnemies() {
        return this.enemies.filter(enemy => enemy && !enemy.isDead);
    }
    
    getNearestNPC(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.npcs.forEach(npc => {
            if (npc && !npc.isDead && npc.body) {
                const distance = Math.sqrt(
                    Math.pow(npc.body.position.x - position.x, 2) +
                    Math.pow(npc.body.position.z - position.z, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = npc;
                }
            }
        });
        
        return { npc: nearest, distance: minDistance };
    }
    
    getNearestEnemy(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.enemies.forEach(enemy => {
            if (enemy && !enemy.isDead && enemy.body) {
                const distance = Math.sqrt(
                    Math.pow(enemy.body.position.x - position.x, 2) +
                    Math.pow(enemy.body.position.z - position.z, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = enemy;
                }
            }
        });
        
        return { enemy: nearest, distance: minDistance };
    }
    
    spawnUndercoverNPCs() {
        // Alias for spawnCityNPCs to maintain compatibility
        console.log("spawnUndercoverNPCs called - redirecting to spawnCityNPCs");
        return this.spawnCityNPCs();
    }
    
    alertNearbyNPCs(position, type) {
        this.npcs.forEach(npc => {
            if (npc && !npc.isDead && npc.body) {
                const distance = Math.sqrt(
                    Math.pow(npc.body.position.x - position.x, 2) +
                    Math.pow(npc.body.position.z - position.z, 2)
                );
                
                if (distance <= 20 && npc.type === type) {
                    npc.becomeHostile();
                }
            }
        });
    }
}

// Make classes globally available
window.NPC = NPC;
window.Enemy = Enemy;
window.NPCManager = NPCManager;
