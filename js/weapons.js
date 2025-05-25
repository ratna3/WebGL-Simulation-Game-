class Weapon {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.mesh = null;
        
        // Weapon stats
        this.damage = 25;
        this.ammo = 30;
        this.maxAmmo = 30;
        this.totalAmmo = 120;
        this.fireRate = 150; // milliseconds between shots
        this.lastShot = 0;
        this.isReloading = false;
        this.reloadTime = 2000; // 2 seconds
        
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
            // Tab key - Toggle weapon
            document.addEventListener('keydown', (event) => {
                if (event.code === 'Tab') {
                    event.preventDefault();
                    this.toggleWeapon();
                }
                
                // R key - Reload
                if (event.code === 'KeyR') {
                    event.preventDefault();
                    this.reload();
                }
            });
            
            // Mouse click - Shoot (only if pointer is locked)
            document.addEventListener('click', (event) => {
                if (this.isEquipped && !this.isReloading && document.pointerLockElement === document.body) {
                    this.shoot();
                }
            });
            
            console.log("Weapon controls set up");
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
            if (!this.isEquipped || this.isReloading) return;
            
            const now = Date.now();
            if (now - this.lastShot < this.fireRate) return;
            
            if (this.ammo <= 0) {
                console.log("Out of ammo! Press R to reload");
                return;
            }
            
            this.ammo--;
            this.lastShot = now;
            
            // Create muzzle flash effect
            this.createMuzzleFlash();
            
            // Perform raycast to check for hits
            this.performRaycast();
            
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
            // Create bright flash at barrel tip
            const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                transparent: true,
                opacity: 0.8
            });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            
            if (this.weaponGroup) {
                flash.position.set(0, 0, 0.5);
                this.weaponGroup.add(flash);
                
                // Remove flash after short duration
                setTimeout(() => {
                    this.weaponGroup.remove(flash);
                }, 50);
            }
        } catch (error) {
            console.error("Error creating muzzle flash:", error);
        }
    }
    
    performRaycast() {
        try {
            // Create raycaster from camera center
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3(0, 0, -1);
            
            this.camera.getWorldDirection(direction);
            raycaster.set(this.camera.position, direction);
            
            // Check for hits on enemies
            if (window.game && window.game.npcManager) {
                const enemies = window.game.npcManager.enemies;
                const intersectable = [];
                
                enemies.forEach(enemy => {
                    if (enemy.group && !enemy.isDead) {
                        enemy.group.traverse(child => {
                            if (child.isMesh) {
                                intersectable.push(child);
                            }
                        });
                    }
                });
                
                const intersects = raycaster.intersectObjects(intersectable);
                
                if (intersects.length > 0) {
                    // Find which enemy was hit
                    const hitObject = intersects[0].object;
                    
                    enemies.forEach(enemy => {
                        if (enemy.group && enemy.group.children.includes(hitObject)) {
                            this.hitEnemy(enemy, intersects[0].point);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error performing raycast:", error);
        }
    }
    
    hitEnemy(enemy, hitPoint) {
        try {
            console.log(`Hit enemy: ${enemy.name || 'Unknown'}`);
            
            // Create hit effect
            this.createHitEffect(hitPoint);
            
            // Damage enemy
            if (enemy.takeDamage) {
                enemy.takeDamage(this.damage);
            } else if (enemy.health !== undefined) {
                enemy.health -= this.damage;
                if (enemy.health <= 0 && !enemy.isDead) {
                    enemy.die();
                }
            }
        } catch (error) {
            console.error("Error hitting enemy:", error);
        }
    }
    
    createHitEffect(position) {
        try {
            // Create spark effect at hit location
            const sparkGeometry = new THREE.SphereGeometry(0.2, 6, 6);
            const sparkMaterial = new THREE.MeshBasicMaterial({
                color: 0xFF4444,
                transparent: true,
                opacity: 0.8
            });
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.copy(position);
            
            this.scene.add(spark);
            
            // Animate and remove spark
            setTimeout(() => {
                this.scene.remove(spark);
            }, 200);
        } catch (error) {
            console.error("Error creating hit effect:", error);
        }
    }
    
    createRecoilEffect() {
        try {
            if (!this.weaponGroup) return;
            
            // Simple recoil animation
            const originalPosition = this.weaponGroup.position.clone();
            
            // Kick back
            this.weaponGroup.position.z += 0.05;
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
            const ammoElement = document.querySelector('.ammo-count');
            if (ammoElement) {
                if (!this.isEquipped) {
                    ammoElement.textContent = "Weapon Holstered";
                    ammoElement.style.color = "white";
                } else if (this.isReloading) {
                    ammoElement.textContent = "Reloading...";
                    ammoElement.style.color = "yellow";
                } else {
                    ammoElement.textContent = `${this.ammo}/${this.maxAmmo} (${this.totalAmmo})`;
                    ammoElement.style.color = this.ammo <= 5 ? "red" : "white";
                }
            }
        } catch (error) {
            console.error("Error updating ammo display:", error);
        }
    }
    
    update(delta) {
        try {
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