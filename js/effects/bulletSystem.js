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
            
            // Create visual bullet
            const bulletGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
            const bulletMaterial = new THREE.MeshStandardMaterial({
                color: shooter === 'player' ? 0xffff00 : 0xff4400,
                metalness: 0.8,
                roughness: 0.2,
                emissive: shooter === 'player' ? 0x444400 : 0x441100,
                emissiveIntensity: 0.3
            });
            
            const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bulletMesh.position.copy(startPosition);
            bulletMesh.castShadow = true;
            
            // Create physics body
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
            
            // Create bullet data object
            const bullet = {
                mesh: bulletMesh,
                body: bulletBody,
                damage: damage,
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
            
            console.log(`Bullet created by ${shooter}`);
            return bullet;
            
        } catch (error) {
            console.error("Error creating bullet:", error);
            return null;
        }
    }
    
    createBulletTrail(bullet) {
        try {
            // Create a glowing trail behind the bullet
            const trailGeometry = new THREE.CylinderGeometry(0.005, 0.015, 0.3, 6);
            const trailMaterial = new THREE.MeshBasicMaterial({
                color: bullet.shooter === 'player' ? 0xffff88 : 0xff6644,
                transparent: true,
                opacity: 0.6
            });
            
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            trail.position.copy(bullet.mesh.position);
            trail.lookAt(bullet.startPosition);
            
            this.scene.add(trail);
            
            // Animate trail fade
            let opacity = 0.6;
            const fadeInterval = setInterval(() => {
                opacity -= 0.1;
                if (opacity <= 0) {
                    this.scene.remove(trail);
                    clearInterval(fadeInterval);
                } else {
                    trail.material.opacity = opacity;
                }
            }, 50);
            
        } catch (error) {
            console.error("Error creating bullet trail:", error);
        }
    }
    
    handleBulletCollision(bullet, collisionEvent) {
        if (bullet.hasHit) return; // Prevent multiple hits
        
        try {
            const otherBody = collisionEvent.target === bullet.body ? collisionEvent.body : collisionEvent.target;
            const hitPosition = bullet.mesh.position.clone();
            
            // Check what was hit
            let hitTarget = null;
            
            // Check if it hit an enemy
            if (window.game && window.game.npcManager) {
                window.game.npcManager.enemies.forEach(enemy => {
                    if (enemy.body === otherBody && !enemy.isDead) {
                        hitTarget = { type: 'enemy', target: enemy };
                    }
                });
                
                // Check if it hit an NPC
                window.game.npcManager.npcs.forEach(npc => {
                    if (npc.body === otherBody && !npc.isDead) {
                        hitTarget = { type: 'npc', target: npc };
                    }
                });
            }
            
            // Check if it hit the player (for enemy bullets)
            if (bullet.shooter !== 'player' && window.game && window.game.player && window.game.player.body === otherBody) {
                hitTarget = { type: 'player', target: window.game.player };
            }
            
            // Handle damage
            if (hitTarget) {
                this.dealDamage(hitTarget, bullet, hitPosition);
            }
            
            // Create impact effect
            this.createImpactEffect(hitPosition, bullet.shooter);
            
            // Mark bullet as hit and remove it
            bullet.hasHit = true;
            this.removeBullet(bullet);
            
        } catch (error) {
            console.error("Error handling bullet collision:", error);
        }
    }
    
    dealDamage(hitTarget, bullet, hitPosition) {
        try {
            switch (hitTarget.type) {
                case 'enemy':
                    console.log(`Bullet hit enemy: ${hitTarget.target.name || 'Unknown'}`);
                    if (hitTarget.target.takeDamage) {
                        hitTarget.target.takeDamage(bullet.damage);
                        
                        // Make enemy aggressive if not already
                        if (!hitTarget.target.playerDetected) {
                            hitTarget.target.playerDetected = true;
                            hitTarget.target.state = 'chase';
                            console.log("Enemy becomes aggressive after being shot!");
                        }
                    }
                    break;
                    
                case 'npc':
                    console.log(`Bullet hit NPC: ${hitTarget.target.name || 'Unknown'}`);
                    if (hitTarget.target.takeDamage) {
                        hitTarget.target.takeDamage(bullet.damage);
                        
                        // NPCs become hostile when shot
                        if (!hitTarget.target.isHostile) {
                            hitTarget.target.becomeHostile();
                            console.log("NPC becomes hostile after being shot!");
                        }
                    }
                    break;
                    
                case 'player':
                    if (bullet.shooter !== 'player') {
                        console.log(`Player hit by ${bullet.shooter} bullet!`);
                        if (window.game && window.game.playerTakeDamage) {
                            window.game.playerTakeDamage(bullet.damage);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error("Error dealing damage:", error);
        }
    }
    
    createImpactEffect(position, shooter) {
        try {
            // Create spark particles
            const sparkCount = 6;
            for (let i = 0; i < sparkCount; i++) {
                const sparkGeometry = new THREE.SphereGeometry(0.02, 4, 4);
                const sparkMaterial = new THREE.MeshBasicMaterial({
                    color: shooter === 'player' ? 0xffaa00 : 0xff4400,
                    emissive: shooter === 'player' ? 0xffaa00 : 0xff4400,
                    emissiveIntensity: 0.8
                });
                
                const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
                spark.position.copy(position);
                
                // Random spark direction
                const sparkDirection = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize().multiplyScalar(0.5);
                
                this.scene.add(spark);
                
                // Animate spark
                const startTime = Date.now();
                const animateSpark = () => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed > 300) {
                        this.scene.remove(spark);
                        return;
                    }
                    
                    // Move spark
                    spark.position.add(sparkDirection.clone().multiplyScalar(0.02));
                    
                    // Fade spark
                    const opacity = 1 - (elapsed / 300);
                    spark.material.opacity = opacity;
                    spark.material.transparent = true;
                    
                    requestAnimationFrame(animateSpark);
                };
                animateSpark();
            }
            
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
console.log("BulletSystem class loaded");
