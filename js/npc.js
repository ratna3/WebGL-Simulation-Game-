class NPC {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 0, y: 0, z: 0 };
        
        this.mesh = null;
        this.body = null;
    }
    
    init() {
        // Create a simple NPC representation
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshStandardMaterial({color: 0x996633});
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Create physics body
        const shape = new CANNON.Cylinder(0.5, 0.5, 1.8, 8);
        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.world.addBody(this.body);
    }
    
    update() {
        // NPC behavior updates
    }
}

class Enemy {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 5, y: 0, z: 5 };
        
        // Enemy properties
        this.health = 100;
        this.speed = 2;
        this.attackDamage = 25;
        this.detectionRange = 10;
        this.attackRange = 2;
        
        // 3D objects
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        
        // AI state
        this.state = 'patrol'; // patrol, chase, attack
        this.target = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000; // 2 seconds
        
        this.init();
    }
    
    init() {
        this.createRepoCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        console.log("REPO enemy created at position:", this.position);
    }
    
    createRepoCharacter() {
        // Create REPO-style character (robot/android look)
        
        // Main body (torso)
        const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1;
        body.castShadow = true;
        this.group.add(body);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.1;
        head.castShadow = true;
        this.group.add(head);
        
        // Eyes (glowing red - REPO style)
        const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 2.15, 0.25);
        this.group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 2.15, 0.25);
        this.group.add(rightEye);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            metalness: 0.6,
            roughness: 0.4
        });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.7, 1, 0);
        leftArm.castShadow = true;
        this.group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.7, 1, 0);
        rightArm.castShadow = true;
        this.group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, 0, 0);
        leftLeg.castShadow = true;
        this.group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, 0, 0);
        rightLeg.castShadow = true;
        this.group.add(rightLeg);
        
        // Set initial position
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        
        // Store main mesh reference
        this.mesh = this.group;
    }
    
    createPhysicsBody() {
        // Create physics body for collision
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1.25, 0.3));
        
        this.body = new CANNON.Body({
            mass: 80, // Heavy enemy
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.1
            }),
            fixedRotation: true // Prevent tumbling
        });
        
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 1.25, this.position.z);
        
        // Add to physics world
        this.world.addBody(this.body);
        
        console.log("Enemy physics body created");
    }
    
    update(playerPosition, delta) {
        if (!this.body || !playerPosition) return;
        
        // Update mesh position to match physics body
        this.group.position.copy(this.body.position);
        this.group.position.y -= 1.25; // Adjust for center offset
        
        // Simple AI behavior
        this.updateAI(playerPosition, delta);
        
        // Keep enemy upright
        this.body.angularVelocity.set(0, 0, 0);
    }
    
    updateAI(playerPosition, delta) {
        const distanceToPlayer = this.getDistanceToPlayer(playerPosition);
        
        // State machine
        switch(this.state) {
            case 'patrol':
                if (distanceToPlayer < this.detectionRange) {
                    this.state = 'chase';
                    console.log("Enemy detected player - switching to chase");
                }
                break;
                
            case 'chase':
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    this.state = 'patrol';
                } else if (distanceToPlayer < this.attackRange) {
                    this.state = 'attack';
                } else {
                    this.moveTowardsPlayer(playerPosition, delta);
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
                console.log("Player takes damage!");
            }
        }
    }
    
    getDistanceToPlayer(playerPosition) {
        return Math.sqrt(
            Math.pow(playerPosition.x - this.body.position.x, 2) +
            Math.pow(playerPosition.z - this.body.position.z, 2)
        );
    }
    
    takeDamage(damage) {
        this.health -= damage;
        console.log("Enemy takes", damage, "damage. Health:", this.health);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        console.log("Enemy defeated!");
        
        // Remove from scene
        this.scene.remove(this.group);
        
        // Remove from physics world
        this.world.removeBody(this.body);
        
        // Mark as dead
        this.health = 0;
    }
}

class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
        this.enemies = []; // Add enemies array
    }
    
    spawnNPCs(count) {
        for (let i = 0; i < count; i++) {
            const position = {
                x: Math.random() * 40 - 20,
                y: 0,
                z: Math.random() * 40 - 20
            };
            
            const npc = new NPC(this.scene, this.world, position);
            npc.init();
            this.npcs.push(npc);
        }
    }
    
    spawnEnemy() {
        // Spawn one REPO enemy
        const enemy = new Enemy(this.scene, this.world, { x: 5, y: 0, z: 5 });
        this.enemies.push(enemy);
        console.log("REPO enemy spawned!");
        return enemy;
    }
    
    update(playerPosition, delta) {
        this.npcs.forEach(npc => npc.update());
        
        // Update enemies with player position
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                enemy.update(playerPosition, delta);
            }
        });
    }
    
    getNearestNPC(position, maxRange) {
        return { npc: null, distance: Infinity };
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
