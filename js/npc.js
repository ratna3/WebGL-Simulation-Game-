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
        const shape = new CANNON.Cylinder(0.5, 0.5, 2.0, 12); // Increased from previous values
        this.body = new CANNON.Body({ 
            mass: 90, // Heavier for much bigger NPCs
            material: new CANNON.Material({ friction: 0.3 })
        });
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 1.0, this.position.z); // Adjusted height
        this.body.fixedRotation = true;
        this.world.addBody(this.body);
    }
    
    update(playerPosition, delta) {
        // Update mesh position
        if (this.body) {
            this.group.position.copy(this.body.position);
            this.group.position.y -= 1.0; // Adjusted for bigger NPCs
        }
        
        // Check for player interaction
        if (playerPosition && window.game && window.game.dialogueSystem) {
            const distance = this.getDistanceToPlayer(playerPosition);
            window.game.dialogueSystem.checkInteraction(this, distance);
        }
        
        // Simple AI behavior if hostile
        if (this.isHostile && playerPosition) {
            this.hostileBehavior(playerPosition, delta);
        }
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
    
    becomeHostile() {
        if (this.isHostile) return;
        
        this.isHostile = true;
        console.log(`${this.name} becomes hostile!`);
        
        // Change appearance to show hostility (red tint)
        this.group.traverse((child) => {
            if (child.material) {
                child.material.emissive = new THREE.Color(0x440000);
            }
        });
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
        
        // Enemy properties
        this.health = 150;
        this.maxHealth = 150;
        this.speed = 2;
        this.attackDamage = 25; // 4 hits to kill player (100 health / 25 damage)
        this.detectionRange = 15; // Increased detection range
        this.attackRange = 2;
        this.isDead = false;
        
        // Weapon properties
        this.hasWeapon = true;
        this.ammo = 10; // More ammo
        this.weaponRange = 20; // Longer range
        this.lastShotTime = 0;
        this.shotCooldown = 1000; // Faster shooting (1 second)
        this.accuracy = 0.8; // 80% accuracy
        
        // 3D objects
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.weaponGroup = new THREE.Group();
        
        // AI state
        this.state = 'patrol';
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000;
        this.playerDetected = false;
        
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
        // Use the character design system
        const result = this.characterDesign.createEnemyCharacter();
        this.group = result.group;
        this.weaponGroup = result.weaponGroup;
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
    }
    
    createPhysicsBody() {
        // Create physics body for collision (cylinder) - much larger for bigger enemies
        const shape = new CANNON.Cylinder(0.7, 0.7, 2.4, 12); // Increased significantly
        
        this.body = new CANNON.Body({
            mass: 120, // Much heavier enemy
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.1
            }),
            fixedRotation: true // Prevent tumbling
        });
        
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 1.2, this.position.z); // Adjusted height
        
        // Add to physics world
        this.world.addBody(this.body);
        
        console.log("Much bigger enemy physics body created");
    }
    
    update(playerPosition, delta) {
        if (!this.body || !playerPosition) return;
        
        // Update mesh position to match physics body
        this.group.position.copy(this.body.position);
        this.group.position.y -= 1.2; // Adjusted for much bigger center offset
        
        // Simple AI behavior
        this.updateAI(playerPosition, delta);
        
        // Keep enemy upright
        this.body.angularVelocity.set(0, 0, 0);
    }
    
    updateAI(playerPosition, delta) {
        const distanceToPlayer = this.getDistanceToPlayer(playerPosition);
        
        // Check if player has weapon equipped (makes them more detectable)
        const playerHasWeapon = window.game && window.game.player && window.game.player.weaponEquipped;
        const detectionMultiplier = playerHasWeapon ? 1.5 : 1.0;
        const adjustedDetectionRange = this.detectionRange * detectionMultiplier;
        
        // State machine
        switch(this.state) {
            case 'patrol':
                if (distanceToPlayer < adjustedDetectionRange) {
                    this.state = 'chase';
                    this.playerDetected = true;
                    console.log("Enemy detected player - switching to chase");
                }
                break;
                
            case 'chase':
                if (distanceToPlayer > adjustedDetectionRange * 2) {
                    this.state = 'patrol';
                    this.playerDetected = false;
                } else if (distanceToPlayer < this.weaponRange && this.ammo > 0) {
                    this.state = 'shoot';
                } else if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                } else {
                    this.moveTowardsPlayer(playerPosition, delta);
                }
                break;
                
            case 'shoot':
                if (distanceToPlayer > this.weaponRange || this.ammo <= 0) {
                    this.state = 'chase';
                } else {
                    this.shootAtPlayer(playerPosition);
                }
                break;
                
            case 'attack':
                if (distanceToPlayer > this.attackRange) {
                    this.state = 'chase';
                } else {
                    this.attackPlayer();
                }
                break;
        }
    }
    
    moveTowardsPlayer(playerPosition, delta) {
        // Calculate direction to player
        const direction = new THREE.Vector3(
            playerPosition.x - this.body.position.x,
            0,
            playerPosition.z - this.body.position.z
        ).normalize();
        
        // Apply movement force
        const force = this.speed * delta * 100;
        this.body.velocity.x = direction.x * force;
        this.body.velocity.z = direction.z * force;
        
        // Make enemy face the player
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;
    }
    
    attackPlayer() {
        const now = Date.now();
        if (now - this.lastAttackTime > this.attackCooldown) {
            console.log("Enemy attacks player for", this.attackDamage, "damage!");
            this.lastAttackTime = now;
            
            // Here you could trigger damage to player
            if (window.playerInstance) {
                // You can add player damage logic here
            }
        }
    }
    
    shootAtPlayer(playerPosition) {
        const now = Date.now();
        if (now - this.lastShotTime > this.shotCooldown && this.ammo > 0) {
            this.ammo--;
            this.lastShotTime = now;
            
            // Create muzzle flash
            this.createMuzzleFlash();
            
            // Face player when shooting
            const direction = new THREE.Vector3(
                playerPosition.x - this.body.position.x,
                0,
                playerPosition.z - this.body.position.z
            ).normalize();
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
            
            // Check if shot hits player
            const hitRoll = Math.random();
            
            if (hitRoll < this.accuracy) {
                console.log(`Enemy shoots player! Ammo left: ${this.ammo}`);
                this.damagePlayer();
                
                // Create hit effect
                this.createHitEffect(playerPosition);
            } else {
                console.log(`Enemy missed! Ammo left: ${this.ammo}`);
            }
            
            if (this.ammo <= 0) {
                console.log("Enemy out of ammo!");
            }
        }
    }
    
    createMuzzleFlash() {
        // Create muzzle flash at weapon barrel
        const flashGeometry = new THREE.SphereGeometry(0.08, 6, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        
        // Position at weapon barrel
        const weaponPos = this.weaponGroup.position.clone();
        flash.position.copy(weaponPos);
        flash.position.x += 0.3; // Barrel tip
        
        this.group.add(flash);
        
        // Remove flash after brief moment
        setTimeout(() => {
            this.group.remove(flash);
        }, 100);
    }
    
    createHitEffect(playerPosition) {
        // Create blood/impact effect at player position
        const effectGeometry = new THREE.SphereGeometry(0.2, 6, 6);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.set(playerPosition.x, playerPosition.y + 1, playerPosition.z);
        this.scene.add(effect);
        
        // Remove effect after short time
        setTimeout(() => {
            this.scene.remove(effect);
        }, 500);
    }
    
    damagePlayer() {
        // Damage player with exactly 25 damage (4 hits to kill)
        if (window.game && window.game.playerTakeDamage) {
            window.game.playerTakeDamage(this.attackDamage);
            console.log(`Player takes ${this.attackDamage} damage from enemy weapon!`);
        }
    }
    
    takeDamage(damage) {
        if (this.isDead) return false;
        
        this.health -= damage;
        console.log(`REPO Enemy takes ${damage} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Visual damage effect
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                const originalEmissive = child.material.emissive.getHex();
                child.material.emissive.setHex(0xff4400);
                setTimeout(() => {
                    if (!this.isDead) {
                        child.material.emissive.setHex(originalEmissive);
                    }
                }, 300);
            }
        });
        
        if (this.health <= 0) {
            this.die();
            return true; // Killed
        }
        
        // Become more aggressive when damaged
        this.detectionRange = Math.min(this.detectionRange + 2, 20);
        this.speed = Math.min(this.speed + 0.5, 5);
        
        return false; // Still alive
    }
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.health = 0;
        console.log("REPO Enemy eliminated!");
        
        // Notify mission manager FIRST before anything else
        if (window.game && window.game.missionManager) {
            console.log("Notifying mission manager of enemy elimination");
            window.game.missionManager.enemyEliminated();
        } else {
            console.error("Mission manager not available for enemy elimination notification");
        }
        
        // Death animation - sparks and fall
        this.group.rotation.z = Math.PI / 2;
        this.group.position.y -= 0.5;
        
        // Change appearance to show destruction
        this.group.traverse((child) => {
            if (child.material) {
                child.material.color.multiplyScalar(0.2);
                if (child.material.emissive) {
                    child.material.emissive.setHex(0x440000);
                }
            }
        });
        
        // Remove physics body
        if (this.body) {
            this.world.removeBody(this.body);
        }
        
        // Remove from scene after delay
        setTimeout(() => {
            if (this.group && this.scene) {
                this.scene.remove(this.group);
            }
        }, 8000);
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
    
    spawnEnemiesInParks() {
        // Get park and tree locations from environment
        const environment = window.game.environment;
        if (!environment) return;
        
        const treeLocations = environment.getTreeLocations();
        const parkLocations = environment.getParkLocations();
        
        // Spawn enemies in parks and near trees
        const enemyCount = Math.min(8, Math.max(5, treeLocations.length)); // 5-8 enemies
        
        console.log(`Spawning ${enemyCount} REPO enemies in parks`);
        
        for (let i = 0; i < enemyCount; i++) {
            let enemyPosition;
            
            if (i < treeLocations.length && treeLocations[i]) {
                // Spawn near tree
                const treeLocation = treeLocations[i];
                const offsetX = (Math.random() - 0.5) * 8;
                const offsetZ = (Math.random() - 0.5) * 8;
                
                enemyPosition = {
                    x: treeLocation.x + offsetX,
                    y: 0,
                    z: treeLocation.z + offsetZ
                };
            } else if (i < parkLocations.length && parkLocations[i]) {
                // Spawn in park
                const parkLocation = parkLocations[i];
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetZ = (Math.random() - 0.5) * 20;
                
                enemyPosition = {
                    x: parkLocation.x + offsetX,
                    y: 0,
                    z: parkLocation.z + offsetZ
                };
            } else {
                // Spawn randomly in city
                enemyPosition = this.getRandomCityPosition();
            }
            
            const enemy = new Enemy(this.scene, this.world, enemyPosition);
            this.enemies.push(enemy);
            
            console.log(`REPO enemy spawned at (${enemyPosition.x}, ${enemyPosition.z})`);
        }
        
        // Start mission with enemy count
        if (window.game && window.game.missionManager) {
            window.game.missionManager.startMission(this.enemies.length);
        }
        
        return this.enemies.length;
    }
    
    spawnUndercoverNPCs() {
        // Use the new city-wide NPC spawning
        this.spawnCityNPCs();
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
