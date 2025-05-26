class Weapon {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.mesh = null;
        
        // Weapon stats
        this.damage = 25; // Will be overridden by dynamic damage calculation
        this.ammo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 120;
        this.fireRate = 150; // milliseconds between shots
        this.lastShot = 0;
        this.isReloading = false;
        this.reloadTime = 2000; // 2 seconds
        
        // Bullet system
        this.bullets = [];
        this.bulletSpeed = 100; // Units per second
        this.bulletLifetime = 3000; // 3 seconds max flight time
        
        // Weapon state
        this.isEquipped = false;
        
        this.init();
    }
    
    init() {
        this.createWeaponModel();
        this.setupControls();
        console.log("Weapon system initialized");
    }
    
    createWeaponModel() {
        try {
            // Create weapon group
            this.weaponGroup = new THREE.Group();
            
            // Gun body
            const bodyGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.4);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x222222,
                metalness: 0.8,
                roughness: 0.2
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(0, 0, 0);
            this.weaponGroup.add(body);
            
            // Gun barrel
            const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const barrelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.1
            });
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(0, 0, 0.35);
            this.weaponGroup.add(barrel);
            
            // Position weapon relative to camera
            this.weaponGroup.position.set(0.3, -0.2, -0.5);
            this.weaponGroup.rotation.x = 0.1;
            this.weaponGroup.scale.set(2, 2, 2);
            
            // Initially hide weapon
            this.weaponGroup.visible = false;
            
            // Add to camera so it moves with player view
            this.camera.add(this.weaponGroup);
            
            console.log("Weapon model created");
        } catch (error) {
            console.error("Error creating weapon model:", error);
        }
    }
    
    setupControls() {
        try {
            // Store reference to this weapon instance
            const weapon = this;
            
            // Tab key - Toggle weapon
            document.addEventListener('keydown', (event) => {
                if (event.code === 'Tab') {
                    event.preventDefault();
                    weapon.toggleWeapon();
                }
                
                // R key - Reload
                if (event.code === 'KeyR') {
                    event.preventDefault();
                    weapon.reload();
                }
            });
            
            // Mouse click - Shoot (improved event handling)
            document.addEventListener('mousedown', (event) => {
                // Only shoot on left mouse button
                if (event.button === 0) {
                    // Check if weapon is equipped and pointer is locked
                    if (weapon.isEquipped && !weapon.isReloading) {
                        // Check if game is active and not in dialogue
                        if (window.game && window.game.isGameActive && 
                            (!window.playerInstance || !window.playerInstance.dialogueLocked)) {
                            
                            console.log("Attempting to shoot...");
                            weapon.shoot();
                        } else {
                            console.log("Cannot shoot - game not active or in dialogue");
                        }
                    } else {
                        if (!weapon.isEquipped) {
                            console.log("Weapon not equipped - press Tab to equip");
                        } else if (weapon.isReloading) {
                            console.log("Currently reloading...");
                        }
                    }
                }
            });
            
            console.log("Weapon controls set up - Tab to equip, Left Click to shoot, R to reload");
        } catch (error) {
            console.error("Error setting up weapon controls:", error);
        }
    }
    
    toggleWeapon() {
        try {
            this.isEquipped = !this.isEquipped;
            
            if (this.weaponGroup) {
                this.weaponGroup.visible = this.isEquipped;
            }
            
            // Update HUD
            this.updateAmmoDisplay();
            
            console.log(`Weapon ${this.isEquipped ? 'equipped' : 'holstered'}`);
            
            // Update cover status when weapon is drawn
            if (window.game && window.game.dialogueSystem) {
                if (this.isEquipped) {
                    window.game.dialogueSystem.playerCover -= 20; // Drawing weapon reduces cover
                    window.game.dialogueSystem.updateCoverStatus();
                }
            }
        } catch (error) {
            console.error("Error toggling weapon:", error);
        }
    }
    
    shoot() {
        try {
            console.log("Shoot function called");
            
            if (!this.isEquipped) {
                console.log("Cannot shoot - weapon not equipped");
                return;
            }
            
            if (this.isReloading) {
                console.log("Cannot shoot - currently reloading");
                return;
            }
            
            const now = Date.now();
            if (now - this.lastShot < this.fireRate) {
                console.log("Cannot shoot - fire rate cooldown");
                return;
            }
            
            if (this.ammo <= 0) {
                console.log("Out of ammo! Press R to reload");
                this.playEmptyClickSound();
                return;
            }
            
            console.log("FIRING WEAPON!");
            
            this.ammo--;
            this.lastShot = now;
            
            // Create muzzle flash effect
            this.createMuzzleFlash();
            
            // Create and fire bullet
            this.createBullet();
            
            // Update ammo display
            this.updateAmmoDisplay();
            
            // Weapon recoil animation
            this.createRecoilEffect();
            
            console.log(`Shot fired! Ammo: ${this.ammo}/${this.maxAmmo}`);
            
            // Blow cover when shooting
            if (window.game && window.game.dialogueSystem) {
                window.game.dialogueSystem.blowCover();
            }
        } catch (error) {
            console.error("Error shooting:", error);
        }
    }
    
    createMuzzleFlash() {
        try {
            if (!this.weaponGroup) return;
            
            // Create bright flash at weapon barrel
            const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                transparent: true,
                opacity: 0.8
            });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            
            // Position at barrel tip
            flash.position.set(0, 0, 0.4);
            this.weaponGroup.add(flash);
            
            // Remove flash quickly
            setTimeout(() => {
                if (this.weaponGroup && flash.parent) {
                    this.weaponGroup.remove(flash);
                }
            }, 50);
            
            console.log("Muzzle flash created");
        } catch (error) {
            console.error("Error creating muzzle flash:", error);
        }
    }
    
    createRecoilEffect() {
        try {
            if (!this.weaponGroup) return;
            
            // Simple recoil animation
            const originalPosition = this.weaponGroup.position.clone();
            
            // Quick recoil back
            this.weaponGroup.position.z -= 0.1;
            this.weaponGroup.rotation.x += 0.1;
            
            // Return to original position
            setTimeout(() => {
                if (this.weaponGroup) {
                    this.weaponGroup.position.copy(originalPosition);
                    this.weaponGroup.rotation.x -= 0.1;
                }
            }, 100);
            
        } catch (error) {
            console.error("Error creating recoil effect:", error);
        }
    }
    
    playEmptyClickSound() {
        try {
            // Simple audio feedback for empty weapon
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Audio not critical for gameplay
            console.log("Audio not available for empty click sound");
        }
    }
    
    createBullet() {
        try {
            // Get shooting direction from camera
            const direction = new THREE.Vector3(0, 0, -1);
            this.camera.getWorldDirection(direction);
            direction.normalize();
            
            // Get starting position (from weapon barrel)
            const startPosition = this.camera.position.clone();
            if (this.weaponGroup) {
                // Offset to weapon barrel position
                const weaponWorldPos = new THREE.Vector3();
                this.weaponGroup.getWorldPosition(weaponWorldPos);
                startPosition.copy(weaponWorldPos);
                
                // Adjust for barrel tip
                const barrelOffset = direction.clone().multiplyScalar(0.5);
                startPosition.add(barrelOffset);
            }
            
            // Create bullet visual
            const bulletGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const bulletMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffff00,
                emissive: 0xffaa00,
                transparent: true,
                opacity: 0.9
            });
            const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
            
            // Position bullet at barrel
            bulletMesh.position.copy(startPosition);
            
            // Add bullet to scene
            this.scene.add(bulletMesh);
            
            // Create bullet trail effect
            const trailGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.2, 6);
            const trailMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.6
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
                startPosition: startPosition.clone(),
                damage: this.calculateDynamicDamage() // Use dynamic damage
            };
            
            // Add to bullets array
            this.bullets.push(bullet);
            
            console.log(`Bullet created with damage: ${bullet.damage}`);
            
        } catch (error) {
            console.error("Error creating bullet:", error);
        }
    }
    
    calculateDynamicDamage() {
        // Calculate 1/4 of enemy total health as damage
        // We'll use a standard enemy health value, but this could be adjusted per enemy type
        const standardEnemyHealth = 150; // Standard REPO enemy health
        const quarterDamage = Math.floor(standardEnemyHealth / 4); // 37.5 -> 37 damage
        
        return quarterDamage;
    }
    
    updateBullets(delta) {
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
                if (this.checkBulletCollisions(bullet, i)) {
                    // Bullet hit something, remove it
                    this.scene.remove(bullet.mesh);
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                // Fade bullet over time for visual effect
                const fadeStart = this.bulletLifetime * 0.8; // Start fading at 80% of lifetime
                if (age > fadeStart) {
                    const fadeProgress = (age - fadeStart) / (this.bulletLifetime - fadeStart);
                    bullet.mesh.material.opacity = 1 - fadeProgress;
                }
            }
        } catch (error) {
            console.error("Error updating bullets:", error);
        }
    }
    
    checkBulletCollisions(bullet, bulletIndex) {
        try {
            // Create raycaster for collision detection
            const raycaster = new THREE.Raycaster();
            const bulletPos = bullet.mesh.position;
            const lastPos = bullet.mesh.position.clone().sub(
                bullet.direction.clone().multiplyScalar(bullet.speed * 0.016) // Approximate last frame position
            );
            
            // Set up raycaster
            const rayDirection = bullet.direction.clone();
            const rayDistance = bulletPos.distanceTo(lastPos) + 1; // Add small buffer
            
            raycaster.set(lastPos, rayDirection);
            
            // Check collision with enemies
            if (window.game && window.game.npcManager) {
                const enemies = window.game.npcManager.enemies;
                const intersectable = [];
                
                enemies.forEach(enemy => {
                    if (enemy.group && enemy.health > 0 && !enemy.isDead) {
                        enemy.group.traverse(child => {
                            if (child.isMesh) {
                                intersectable.push({
                                    mesh: child,
                                    enemy: enemy
                                });
                            }
                        });
                    }
                });
                
                // Get mesh objects only for raycasting
                const meshes = intersectable.map(item => item.mesh);
                const intersects = raycaster.intersectObjects(meshes);
                
                if (intersects.length > 0 && intersects[0].distance <= rayDistance) {
                    // Find which enemy was hit
                    const hitMesh = intersects[0].object;
                    const hitItem = intersectable.find(item => item.mesh === hitMesh);
                    
                    if (hitItem && hitItem.enemy) {
                        this.hitEnemy(hitItem.enemy, intersects[0].point, bullet.damage);
                        return true; // Bullet hit, should be removed
                    }
                }
                
                // Check collision with NPCs (non-lethal hits for civilians/police)
                const npcs = window.game.npcManager.npcs;
                const npcIntersectable = [];
                
                npcs.forEach(npc => {
                    if (npc.group && !npc.isDead) {
                        npc.group.traverse(child => {
                            if (child.isMesh) {
                                npcIntersectable.push({
                                    mesh: child,
                                    npc: npc
                                });
                            }
                        });
                    }
                });
                
                const npcMeshes = npcIntersectable.map(item => item.mesh);
                const npcIntersects = raycaster.intersectObjects(npcMeshes);
                
                if (npcIntersects.length > 0 && npcIntersects[0].distance <= rayDistance) {
                    const hitMesh = npcIntersects[0].object;
                    const hitItem = npcIntersectable.find(item => item.mesh === hitMesh);
                    
                    if (hitItem && hitItem.npc) {
                        this.hitNPC(hitItem.npc, npcIntersects[0].point, bullet.damage);
                        return true;
                    }
                }
            }
            
            // Check collision with buildings/environment (simple ground check)
            if (bulletPos.y <= 0.1) {
                this.createGroundHitEffect(bulletPos);
                return true;
            }
            
            return false; // No collision
            
        } catch (error) {
            console.error("Error checking bullet collisions:", error);
            return false;
        }
    }
    
    hitEnemy(enemy, hitPoint, damage) {
        try {
            console.log(`Bullet hit enemy with ${damage} damage (1/4 of ${enemy.maxHealth || 150} total health)`);
            
            // Create enhanced hit effect
            this.createBulletHitEffect(hitPoint);
            
            // Apply dynamic damage based on enemy's max health
            let actualDamage = damage;
            if (enemy.maxHealth) {
                actualDamage = Math.floor(enemy.maxHealth / 4); // Exactly 1/4 of enemy's max health
            }
            
            // Damage enemy
            if (enemy.takeDamage) {
                const wasKilled = enemy.takeDamage(actualDamage);
                
                if (wasKilled && window.game && window.game.missionManager) {
                    // Notify mission manager of enemy elimination
                    window.game.missionManager.enemyEliminated();
                }
                
                if (!wasKilled) {
                    console.log(`Enemy took ${actualDamage} damage, ${enemy.health}/${enemy.maxHealth} health remaining`);
                }
            } else if (enemy.health !== undefined) {
                enemy.health = Math.max(0, enemy.health - actualDamage);
                console.log(`Enemy health: ${enemy.health}/${enemy.maxHealth || 150}`);
                
                if (enemy.health <= 0 && !enemy.isDead) {
                    if (enemy.die) {
                        enemy.die();
                    } else {
                        enemy.isDead = true;
                    }
                    
                    if (window.game && window.game.missionManager) {
                        window.game.missionManager.enemyEliminated();
                    }
                }
            }
        } catch (error) {
            console.error("Error hitting enemy:", error);
        }
    }
    
    hitNPC(npc, hitPoint, damage) {
        try {
            console.log(`Bullet hit NPC: ${npc.name} (${npc.type})`);
            
            // Create hit effect
            this.createBulletHitEffect(hitPoint);
            
            // Different damage for different NPC types
            let actualDamage;
            switch(npc.type) {
                case 'criminal':
                    actualDamage = Math.floor(npc.maxHealth / 4); // 1/4 damage to criminals
                    break;
                case 'police':
                    actualDamage = Math.floor(npc.maxHealth / 6); // Less damage to police (friendly fire)
                    break;
                case 'civilian':
                    actualDamage = Math.floor(npc.maxHealth / 8); // Minimal damage to civilians
                    break;
                default:
                    actualDamage = Math.floor(npc.maxHealth / 4);
            }
            
            // Apply damage
            if (npc.takeDamage) {
                npc.takeDamage(actualDamage);
            }
            
            // Shooting NPCs has consequences
            if (window.game && window.game.dialogueSystem) {
                if (npc.type === 'civilian') {
                    window.game.dialogueSystem.playerCover -= 50; // Heavy cover loss for shooting civilians
                    console.log("WARNING: Civilian casualty! Cover blown!");
                } else if (npc.type === 'police') {
                    window.game.dialogueSystem.playerCover -= 30; // Cover loss for shooting police
                    console.log("WARNING: Police casualty! Cover compromised!");
                }
                window.game.dialogueSystem.updateCoverStatus();
            }
        } catch (error) {
            console.error("Error hitting NPC:", error);
        }
    }
    
    createBulletHitEffect(position) {
        try {
            // Create spark burst effect
            const sparkCount = 8;
            const sparkGroup = new THREE.Group();
            
            for (let i = 0; i < sparkCount; i++) {
                const sparkGeometry = new THREE.SphereGeometry(0.02, 4, 4);
                const sparkMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.5), // Yellow-orange sparks
                    transparent: true,
                    opacity: 0.8
                });
                const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
                
                // Random spark direction
                const angle = (i / sparkCount) * Math.PI * 2;
                const distance = Math.random() * 0.3 + 0.1;
                spark.position.set(
                    Math.cos(angle) * distance,
                    Math.random() * 0.2,
                    Math.sin(angle) * distance
                );
                
                sparkGroup.add(spark);
            }
            
            sparkGroup.position.copy(position);
            this.scene.add(sparkGroup);
            
            // Animate and remove sparks
            const startTime = Date.now();
            const animateSparks = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 500; // 500ms animation
                
                if (progress >= 1) {
                    this.scene.remove(sparkGroup);
                    return;
                }
                
                // Animate sparks falling and fading
                sparkGroup.children.forEach((spark, index) => {
                    spark.position.y -= 0.01; // Fall down
                    spark.material.opacity = 0.8 * (1 - progress); // Fade out
                });
                
                requestAnimationFrame(animateSparks);
            };
            
            animateSparks();
            
        } catch (error) {
            console.error("Error creating bullet hit effect:", error);
        }
    }
    
    createGroundHitEffect(position) {
        try {
            // Create dust cloud effect
            const dustGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const dustMaterial = new THREE.MeshBasicMaterial({
                color: 0x8B7355, // Dusty brown
                transparent: true,
                opacity: 0.4
            });
            const dust = new THREE.Mesh(dustGeometry, dustMaterial);
            dust.position.copy(position);
            dust.position.y = 0.05; // Slightly above ground
            
            this.scene.add(dust);
            
            // Animate dust expanding and fading
            let scale = 0.1;
            const expandDust = () => {
                scale += 0.02;
                dust.scale.setScalar(scale);
                dust.material.opacity *= 0.95;
                
                if (dust.material.opacity < 0.01) {
                    this.scene.remove(dust);
                } else {
                    requestAnimationFrame(expandDust);
                }
            };
            
            expandDust();
            
        } catch (error) {
            console.error("Error creating ground hit effect:", error);
        }
    }
    
    reload() {
        try {
            if (this.isReloading || this.ammo === this.maxAmmo || this.totalAmmo <= 0) {
                return;
            }
            
            this.isReloading = true;
            console.log("Reloading...");
            
            // Update UI to show reloading
            this.updateAmmoDisplay();
            
            setTimeout(() => {
                const ammoNeeded = this.maxAmmo - this.ammo;
                const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
                
                this.ammo += ammoToAdd;
                this.totalAmmo -= ammoToAdd;
                this.isReloading = false;
                
                console.log(`Reload complete! Ammo: ${this.ammo}/${this.maxAmmo}, Total: ${this.totalAmmo}`);
                this.updateAmmoDisplay();
            }, this.reloadTime);
        } catch (error) {
            console.error("Error reloading:", error);
        }
    }
    
    updateAmmoDisplay() {
        try {
            let ammoElement = document.querySelector('.ammo-count');
            if (!ammoElement) {
                // Create ammo display if it doesn't exist
                ammoElement = document.createElement('div');
                ammoElement.className = 'ammo-count';
                ammoElement.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    color: white;
                    font-size: 20px;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px #000;
                    font-family: 'Courier New', monospace;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 10px 15px;
                    border-radius: 5px;
                    border: 1px solid rgba(255, 62, 62, 0.3);
                    z-index: 100;
                `;
                document.body.appendChild(ammoElement);
            }
            
            if (!this.isEquipped) {
                ammoElement.textContent = "Weapon Holstered (Press Tab to equip)";
                ammoElement.style.color = "#888888";
            } else if (this.isReloading) {
                ammoElement.textContent = "Reloading...";
                ammoElement.style.color = "#ffff00";
            } else {
                ammoElement.textContent = `${this.ammo}/${this.maxAmmo} (${this.totalAmmo})`;
                
                // Color coding based on ammo level
                if (this.ammo <= 0) {
                    ammoElement.style.color = "#ff0000"; // Red - empty
                } else if (this.ammo <= 5) {
                    ammoElement.style.color = "#ff6600"; // Orange - low
                } else {
                    ammoElement.style.color = "#ffffff"; // White - normal
                }
            }
        } catch (error) {
            console.error("Error updating ammo display:", error);
        }
    }
    
    update(delta) {
        try {
            // Update bullets
            this.updateBullets(delta);
            
            // Weapon updates if needed
            if (this.isEquipped && this.weaponGroup) {
                // Subtle weapon sway or breathing effect
                const time = Date.now() * 0.001;
                this.weaponGroup.position.y = -0.2 + Math.sin(time * 2) * 0.005;
            }
        } catch (error) {
            console.error("Error updating weapon:", error);
        }
    }
}

// Make Weapon class globally available
window.Weapon = Weapon;