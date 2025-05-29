class BulletSystem {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.bullets = [];
        this.maxBullets = 100; // Limit for performance
        
        // Bullet physics material
        this.bulletMaterial = new CANNON.Material('bullet');
        this.bulletMaterial.friction = 0.1;
        this.bulletMaterial.restitution = 0.2;
        
        console.log("Bullet system initialized");
    }
    
    createBullet(startPosition, direction, speed = 50, damage = 25, shooter = 'player') {
        try {
            // Clean up old bullets if we have too many
            if (this.bullets.length >= this.maxBullets) {
                this.removeOldestBullet();
            }
            
            // Ensure damage is a number and exactly what we expect
            const bulletDamage = Number(damage);
            
            // Create SPHERICAL bullet visual
            const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8); // Sphere instead of cylinder
            const bulletMaterial = new THREE.MeshStandardMaterial({
                color: shooter === 'player' ? 0xffff00 : 0xff4400,
                metalness: 0.9,
                roughness: 0.1,
                emissive: shooter === 'player' ? 0x444400 : 0x441100,
                emissiveIntensity: 0.5
            });
            
            const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bulletMesh.position.copy(startPosition);
            bulletMesh.castShadow = true;
            
            // Create physics body - ALSO SPHERICAL for consistency
            const bulletShape = new CANNON.Sphere(0.05);
            const bulletBody = new CANNON.Body({
                mass: 0.1,
                material: this.bulletMaterial,
                shape: bulletShape
            });
            
            bulletBody.position.set(startPosition.x, startPosition.y, startPosition.z);
            
            // Set bullet velocity
            const velocity = direction.clone().multiplyScalar(speed);
            bulletBody.velocity.set(velocity.x, velocity.y, velocity.z);
            
            // Add some gravity effect for realism
            bulletBody.material.restitution = 0.1;
            
            // Add to scene and world
            this.scene.add(bulletMesh);
            this.world.addBody(bulletBody);
            
            // Create bullet data object with exact damage preserved
            const bullet = {
                mesh: bulletMesh,
                body: bulletBody,
                damage: bulletDamage, // CRITICAL: Preserve exact damage
                shooter: shooter,
                startTime: Date.now(),
                maxLifetime: 5000, // 5 seconds max
                startPosition: startPosition.clone(),
                direction: direction.clone(),
                speed: speed,
                hasHit: false
            };
            
            // Add collision detection
            bulletBody.addEventListener('collide', (event) => {
                this.handleBulletCollision(bullet, event);
            });
            
            this.bullets.push(bullet);
            
            // Create muzzle trail effect
            this.createBulletTrail(bullet);
            
            console.log(`=== BULLET CREATED ===`);
            console.log(`Shooter: ${shooter}`);
            console.log(`Damage: ${bulletDamage} (must be exactly 40 for player bullets)`);
            console.log(`Expected shots to kill: ${160 / bulletDamage}`);
            console.log(`==================`);
            
            return bullet;
            
        } catch (error) {
            console.error("Error creating bullet:", error);
            return null;
        }
    }
    
    createBulletTrail(bullet) {
        try {
            // Create a glowing spherical trail behind the bullet
            const trailGeometry = new THREE.SphereGeometry(0.03, 6, 6); // Smaller sphere for trail
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: bullet.shooter === 'player' ? 0xffff88 : 0xff6644,
                transparent: true,
                opacity: 0.7,
                emissive: bullet.shooter === 'player' ? 0xffff44 : 0xff4422,
                emissiveIntensity: 0.8
            });
            
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.copy(bullet.mesh.position);
            
            this.scene.add(trail);
            
            // Animate trail fade and movement
            let opacity = 0.7;
            const fadeInterval = setInterval(() => {
                opacity -= 0.1;
                if (opacity <= 0) {
                    this.scene.remove(trail);
                    clearInterval(fadeInterval);
                } else {
                    trail.material.opacity = opacity;
                    trail.material.emissiveIntensity = opacity;
                }
            }, 50);
            
        } catch (error) {
            console.error("Error creating bullet trail:", error);
        }
    }
    
    handleBulletCollision(bullet, collisionEvent) {
        if (bullet.hasHit) return; // Prevent multiple hits
        
        try {
            console.log("=== BULLET COLLISION DETECTED ===");
            
            const otherBody = collisionEvent.target === bullet.body ? collisionEvent.body : collisionEvent.target;
            const hitPosition = bullet.mesh.position.clone();
            
            console.log("Collision bodies:", {
                bulletBody: bullet.body.id,
                otherBody: otherBody.id,
                hitPosition: hitPosition
            });
            
            // Check what was hit with better detection
            let hitTarget = null;
            
            // ENHANCED enemy detection
            if (window.game && window.game.npcManager) {
                console.log("Checking enemy collisions...");
                console.log("Available enemies:", window.game.npcManager.enemies.length);
                
                for (let i = 0; i < window.game.npcManager.enemies.length; i++) {
                    const enemy = window.game.npcManager.enemies[i];
                    console.log(`Enemy ${i}:`, {
                        name: enemy.name || 'Unknown',
                        id: enemy.id || 'No ID',
                        bodyId: enemy.body?.id,
                        isDead: enemy.isDead,
                        bodyExists: !!enemy.body
                    });
                    
                    if (enemy.body === otherBody && !enemy.isDead) {
                        hitTarget = { type: 'enemy', target: enemy };
                        console.log("HIT ENEMY:", enemy.name || 'Unknown');
                        break;
                    }
                }
                
                // Check NPCs if no enemy hit
                if (!hitTarget) {
                    console.log("Checking NPC collisions...");
                    console.log("Available NPCs:", window.game.npcManager.npcs.length);
                    
                    for (let i = 0; i < window.game.npcManager.npcs.length; i++) {
                        const npc = window.game.npcManager.npcs[i];
                        console.log(`NPC ${i}:`, {
                            name: npc.name || 'Unknown',
                            bodyId: npc.body?.id,
                            isDead: npc.isDead,
                            bodyExists: !!npc.body
                        });
                        
                        if (npc.body === otherBody && !npc.isDead) {
                            hitTarget = { type: 'npc', target: npc };
                            console.log("HIT NPC:", npc.name || 'Unknown');
                            break;
                        }
                    }
                }
            } else {
                console.error("NPC Manager not available for collision detection!");
            }
            
            // Check if it hit the player (for enemy bullets)
            if (!hitTarget && bullet.shooter !== 'player' && window.game && window.game.player && window.game.player.body === otherBody) {
                hitTarget = { type: 'player', target: window.game.player };
                console.log("HIT PLAYER");
            }
            
            if (!hitTarget) {
                console.log("Bullet hit environment/unknown object");
                console.log("Other body ID:", otherBody.id);
                
                // Check if we can find the target by brute force body matching
                if (window.game && window.game.npcManager) {
                    const allEntities = [...window.game.npcManager.enemies, ...window.game.npcManager.npcs];
                    for (const entity of allEntities) {
                        if (entity.body && entity.body.id === otherBody.id && !entity.isDead) {
                            hitTarget = { 
                                type: entity.health !== undefined && entity.health === 160 ? 'enemy' : 'npc', 
                                target: entity 
                            };
                            console.log("FOUND TARGET BY BRUTE FORCE:", entity.name || entity.id);
                            break;
                        }
                    }
                }
            }
            
            // Handle damage if target found
            if (hitTarget) {
                console.log("Dealing damage to target:", hitTarget.type);
                this.dealDamage(hitTarget, bullet, hitPosition);
            }
            
            // Create impact effect regardless
            this.createImpactEffect(hitPosition, bullet.shooter);
            
            // Mark bullet as hit and remove it
            bullet.hasHit = true;
            this.removeBullet(bullet);
            
            console.log("=================================");
            
        } catch (error) {
            console.error("Error handling bullet collision:", error);
        }
    }

    dealDamage(hitTarget, bullet, hitPosition) {
        try {
            const damage = Number(bullet.damage);
            
            console.log("=== DEALING DAMAGE ===");
            console.log("Target type:", hitTarget.type);
            console.log("Damage amount:", damage);
            console.log("Bullet shooter:", bullet.shooter);
            
            switch (hitTarget.type) {
                case 'enemy':
                    console.log("ENEMY HIT - Processing damage...");
                    console.log("Enemy name:", hitTarget.target.name || 'Unknown');
                    console.log("Enemy ID:", hitTarget.target.id || 'Unknown');
                    console.log("Enemy health before:", hitTarget.target.health);
                    console.log("Enemy has takeDamage method:", typeof hitTarget.target.takeDamage === 'function');
                    
                    if (typeof hitTarget.target.takeDamage === 'function') {
                        const wasKilled = hitTarget.target.takeDamage(damage);
                        console.log("Enemy health after:", hitTarget.target.health);
                        console.log("Enemy was killed:", wasKilled);
                        
                        // Make enemy aggressive if not dead
                        if (!hitTarget.target.isDead && !hitTarget.target.playerDetected) {
                            hitTarget.target.playerDetected = true;
                            hitTarget.target.state = 'chase';
                            console.log("Enemy becomes aggressive!");
                        }
                        
                        // Show hit feedback
                        this.showDamageNumber(hitPosition, damage, '#ff0000');
                        
                        // Show enemy health remaining
                        if (!wasKilled) {
                            console.log(`${hitTarget.target.name} health remaining: ${hitTarget.target.health}/${hitTarget.target.maxHealth}`);
                            console.log(`Shots needed to kill: ${Math.ceil(hitTarget.target.health / 40)}`);
                        }
                    } else {
                        console.error("Enemy missing takeDamage method!");
                    }
                    break;
                    
                case 'npc':
                    console.log("NPC HIT - Processing damage...");
                    console.log("NPC name:", hitTarget.target.name || 'Unknown');
                    
                    if (typeof hitTarget.target.takeDamage === 'function') {
                        hitTarget.target.takeDamage(damage);
                        
                        // NPCs become hostile when shot
                        if (!hitTarget.target.isHostile) {
                            hitTarget.target.becomeHostile();
                            console.log("NPC becomes hostile!");
                        }
                        
                        this.showDamageNumber(hitPosition, damage, '#ffaa00');
                    } else {
                        console.error("NPC missing takeDamage method!");
                    }
                    break;
                    
                case 'player':
                    if (bullet.shooter !== 'player') {
                        console.log("PLAYER HIT by enemy bullet!");
                        if (window.game && typeof window.game.playerTakeDamage === 'function') {
                            window.game.playerTakeDamage(damage);
                            this.showDamageNumber(hitPosition, damage, '#ff6600');
                        }
                    }
                    break;
                    
                default:
                    console.warn("Unknown target type:", hitTarget.type);
            }
            
            console.log("===================");
            
        } catch (error) {
            console.error("Error dealing damage:", error);
        }
    }

    showDamageNumber(position, damage, color) {
        try {
            // Create floating damage number
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            
            context.fillStyle = color;
            context.font = 'bold 32px Arial';
            context.textAlign = 'center';
            context.fillText(`-${damage}`, 64, 40);
            
            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.1
            });
            
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            sprite.position.y += 1; // Float above hit point
            sprite.scale.set(2, 1, 1);
            
            this.scene.add(sprite);
            
            // Animate the damage number
            let startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 1500) {
                    this.scene.remove(sprite);
                    return;
                }
                
                // Float upward and fade
                sprite.position.y += 0.02;
                sprite.material.opacity = 1 - (elapsed / 1500);
                
                requestAnimationFrame(animate);
            };
            animate();
            
        } catch (error) {
            console.error("Error showing damage number:", error);
        }
    }
    
    createImpactEffect(position, shooter) {
        try {
            // Create multiple spherical spark particles
            const sparkCount = 8;
            for (let i = 0; i < sparkCount; i++) {
                const sparkGeometry = new THREE.SphereGeometry(0.03, 6, 6); // Spherical sparks
                const sparkMaterial = new THREE.MeshBasicMaterial({
                    color: shooter === 'player' ? 0xffaa00 : 0xff4400,
                    emissive: shooter === 'player' ? 0xffaa00 : 0xff4400,
                    emissiveIntensity: 1.0
                });
                
                const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
                spark.position.copy(position);
                
                // Random spark direction
                const sparkDirection = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(0.8);
                
                this.scene.add(spark);
                
                // Animate spark
                const startTime = Date.now();
                const animateSpark = () => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed > 400) {
                        this.scene.remove(spark);
                        return;
                    }
                    
                    // Move spark
                    spark.position.add(sparkDirection.clone().multiplyScalar(0.03));
                    
                    // Fade spark
                    const opacity = 1 - (elapsed / 400);
                    spark.material.opacity = opacity;
                    spark.material.transparent = true;
                    spark.material.emissiveIntensity = opacity;
                    
                    requestAnimationFrame(animateSpark);
                };
                animateSpark();
            }
            
            // Create central impact flash
            const flashGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 2.0,
                transparent: true,
                opacity: 1.0
            });
            
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            flash.position.copy(position);
            this.scene.add(flash);
            
            // Animate flash
            let flashOpacity = 1.0;
            const flashInterval = setInterval(() => {
                flashOpacity -= 0.15;
                if (flashOpacity <= 0) {
                    this.scene.remove(flash);
                    clearInterval(flashInterval);
                } else {
                    flash.material.opacity = flashOpacity;
                    flash.material.emissiveIntensity = flashOpacity * 2;
                }
            }, 30);
            
        } catch (error) {
            console.error("Error creating impact effect:", error);
        }
    }
    
    removeBullet(bullet) {
        try {
            // Remove from scene
            if (bullet.mesh) {
                this.scene.remove(bullet.mesh);
            }
            
            // Remove from physics world
            if (bullet.body) {
                this.world.removeBody(bullet.body);
            }
            
            // Remove from bullets array
            const index = this.bullets.indexOf(bullet);
            if (index > -1) {
                this.bullets.splice(index, 1);
            }
            
        } catch (error) {
            console.error("Error removing bullet:", error);
        }
    }
    
    removeOldestBullet() {
        if (this.bullets.length > 0) {
            this.removeBullet(this.bullets[0]);
        }
    }
    
    update(delta) {
        try {
            const currentTime = Date.now();
            
            // Update all bullets
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                
                // Remove bullets that are too old
                if (currentTime - bullet.startTime > bullet.maxLifetime) {
                    this.removeBullet(bullet);
                    continue;
                }
                
                // Update bullet mesh position to match physics body
                if (bullet.body && bullet.mesh) {
                    bullet.mesh.position.copy(bullet.body.position);
                    
                    // Orient bullet in direction of travel
                    const velocity = bullet.body.velocity;
                    if (velocity.length() > 0.1) {
                        const direction = new THREE.Vector3(velocity.x, velocity.y, velocity.z).normalize();
                        bullet.mesh.lookAt(bullet.mesh.position.clone().add(direction));
                    }
                }
                
                // Remove bullets that have traveled too far
                if (bullet.mesh && bullet.startPosition) {
                    const distance = bullet.mesh.position.distanceTo(bullet.startPosition);
                    if (distance > 200) { // 200 unit max range
                        this.removeBullet(bullet);
                        continue;
                    }
                }
                
                // Remove bullets that are moving too slowly (stuck)
                if (bullet.body && bullet.body.velocity.length() < 1) {
                    const timeSinceStart = currentTime - bullet.startTime;
                    if (timeSinceStart > 500) { // Give 0.5 seconds for slow bullets
                        this.removeBullet(bullet);
                    }
                }
            }
            
        } catch (error) {
            console.error("Error updating bullet system:", error);
        }
    }
    
    // Method for enemies to shoot at the player
    createEnemyBullet(enemy, targetPosition) {
        try {
            if (!enemy.group || !enemy.weaponGroup) return;
            
            // Calculate shooting position (weapon barrel)
            const shootPosition = new THREE.Vector3();
            enemy.weaponGroup.getWorldPosition(shootPosition);
            shootPosition.x += 0.3; // Barrel offset
            
            // Calculate direction to target with some inaccuracy
            const direction = new THREE.Vector3();
            direction.subVectors(targetPosition, shootPosition).normalize();
            
            // Add some inaccuracy to enemy shots
            const inaccuracy = 0.1;
            direction.x += (Math.random() - 0.5) * inaccuracy;
            direction.y += (Math.random() - 0.5) * inaccuracy;
            direction.z += (Math.random() - 0.5) * inaccuracy;
            direction.normalize();
            
            // Create the bullet
            const bullet = this.createBullet(shootPosition, direction, 40, 25, 'enemy');
            
            if (bullet) {
                console.log("Enemy fired bullet at player");
                
                // Create enemy muzzle flash
                this.createEnemyMuzzleFlash(enemy);
            }
            
            return bullet;
            
        } catch (error) {
            console.error("Error creating enemy bullet:", error);
            return null;
        }
    }
    
    createEnemyMuzzleFlash(enemy) {
        try {
            if (!enemy.weaponGroup) return;
            
            const flashGeometry = new THREE.SphereGeometry(0.08, 6, 6);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                emissive: 0xff4400,
                emissiveIntensity: 1
            });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            
            // Position at weapon barrel
            flash.position.set(0.3, 0, 0);
            enemy.weaponGroup.add(flash);
            
            // Remove flash after brief moment
            setTimeout(() => {
                if (enemy.weaponGroup) {
                    enemy.weaponGroup.remove(flash);
                }
            }, 100);
            
        } catch (error) {
            console.error("Error creating enemy muzzle flash:", error);
        }
    }
    
    // Clean up all bullets (for game restart)
    cleanup() {
        try {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                this.removeBullet(this.bullets[i]);
            }
            this.bullets = [];
            console.log("Bullet system cleaned up");
        } catch (error) {
            console.error("Error cleaning up bullet system:", error);
        }
    }
}

// Make BulletSystem globally available
window.BulletSystem = BulletSystem;
console.log("BulletSystem class loaded with exact damage preservation");
