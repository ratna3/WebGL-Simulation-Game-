class Weapon {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.isEquipped = false;
        this.weaponGroup = null;
        this.bulletSystem = null;
        
        // Weapon stats
        this.damage = 30;
        this.maxAmmo = 30;
        this.currentAmmo = this.maxAmmo;
        this.reloadTime = 2000; // 2 seconds
        this.fireRate = 200; // ms between shots
        this.lastShotTime = 0;
        this.isReloading = false;
        
        // Visual elements
        this.muzzleFlash = null;
        this.weaponModel = null;
        
        console.log("Weapon system initialized");
        this.createWeaponModel();
        // DON'T setup event listeners here - let player handle them
    }
    
    // Remove setupEventListeners to avoid duplicate handlers
    // The player.js will handle all input events
    
    createWeaponModel() {
        try {
            this.weaponGroup = new THREE.Group();
            
            // Create weapon body (simple box for now)
            const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
            const weaponMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.8,
                roughness: 0.2
            });
            
            this.weaponModel = new THREE.Mesh(weaponGeometry, weaponMaterial);
            this.weaponModel.position.set(0.3, -0.2, 0.3);
            this.weaponGroup.add(this.weaponModel);
            
            // Add weapon barrel
            const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const barrelMaterial = new THREE.MeshStandardMaterial({
                color: 0x222222,
                metalness: 0.9,
                roughness: 0.1
            });
            
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(0.15, 0, 0);
            this.weaponModel.add(barrel);
            
            console.log("Weapon model created");
        } catch (error) {
            console.error("Error creating weapon model:", error);
        }
    }
    
    equip() {
        if (this.isEquipped) return;
        
        this.isEquipped = true;
        this.camera.add(this.weaponGroup);
        
        // Connect to bullet system
        if (window.game && window.game.bulletSystem) {
            this.bulletSystem = window.game.bulletSystem;
        }
        
        this.updateAmmoDisplay();
        console.log("Weapon equipped");
    }
    
    holster() {
        if (!this.isEquipped) return;
        
        this.isEquipped = false;
        this.camera.remove(this.weaponGroup);
        this.updateAmmoDisplay();
        console.log("Weapon holstered");
    }
    
    fire() {
        if (!this.isEquipped || this.isReloading) return false;
        
        const now = Date.now();
        if (now - this.lastShotTime < this.fireRate) return false;
        
        if (this.currentAmmo <= 0) {
            this.reload();
            return false;
        }
        
        this.currentAmmo--;
        this.lastShotTime = now;
        
        // Fire bullet
        this.fireBullet();
        
        // Create muzzle flash
        this.createMuzzleFlash();
        
        // Update ammo display
        this.updateAmmoDisplay();
        
        console.log(`Shot fired! Ammo: ${this.currentAmmo}/${this.maxAmmo}`);
        return true;
    }
    
    fireBullet() {
        try {
            // Ensure bullet system is available with multiple checks
            if (!this.bulletSystem) {
                if (window.game && window.game.bulletSystem) {
                    this.bulletSystem = window.game.bulletSystem;
                    console.log("Bullet system connected to weapon");
                } else {
                    console.warn("Bullet system not available, falling back to raycast");
                    this.performRaycast();
                    return;
                }
            }
            
            if (!this.bulletSystem || typeof this.bulletSystem.createBullet !== 'function') {
                console.warn("Bullet system not properly initialized, falling back to raycast");
                this.performRaycast();
                return;
            }
            
            // Calculate bullet start position (weapon barrel)
            const startPosition = new THREE.Vector3();
            if (this.weaponGroup) {
                // Get weapon barrel position in world space
                const barrelOffset = new THREE.Vector3(0.3, 0, 0.35); // Barrel tip position
                this.weaponGroup.localToWorld(barrelOffset);
                startPosition.copy(barrelOffset);
            } else {
                // Fallback to camera position with offset
                startPosition.copy(this.camera.position);
                const cameraDirection = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDirection);
                startPosition.add(cameraDirection.multiplyScalar(0.5));
            }
            
            // Get shooting direction
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            
            // Add slight random spread for realism
            const spread = 0.02;
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.z += (Math.random() - 0.5) * spread;
            direction.normalize();
            
            // Create bullet
            const bullet = this.bulletSystem.createBullet(
                startPosition, 
                direction, 
                60, // bullet speed
                this.damage, 
                'player'
            );
            
            if (bullet) {
                console.log("Player bullet fired successfully");
            } else {
                console.warn("Failed to create bullet, using raycast fallback");
                this.performRaycast();
            }
            
        } catch (error) {
            console.error("Error firing bullet:", error);
            // Fallback to raycast
            this.performRaycast();
        }
    }
    
    performRaycast() {
        // Fallback raycast implementation
        try {
            const raycaster = new THREE.Raycaster();
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            
            raycaster.set(this.camera.position, direction);
            
            // Check for intersections with NPCs/enemies
            if (window.game && window.game.npcManager) {
                const targets = [...window.game.npcManager.npcs, ...window.game.npcManager.enemies];
                const intersections = [];
                
                targets.forEach(target => {
                    if (target.group) {
                        const targetIntersects = raycaster.intersectObject(target.group, true);
                        if (targetIntersects.length > 0) {
                            intersections.push({
                                object: target,
                                distance: targetIntersects[0].distance,
                                point: targetIntersects[0].point
                            });
                        }
                    }
                });
                
                // Sort by distance and hit the closest
                if (intersections.length > 0) {
                    intersections.sort((a, b) => a.distance - b.distance);
                    const target = intersections[0].object;
                    
                    if (typeof target.takeDamage === 'function') {
                        target.takeDamage(this.damage);
                        console.log("Raycast hit target!");
                    }
                }
            }
        } catch (error) {
            console.error("Error performing raycast:", error);
        }
    }
    
    createMuzzleFlash() {
        try {
            if (this.muzzleFlash) {
                this.weaponModel.remove(this.muzzleFlash);
            }
            
            // Create muzzle flash effect
            const flashGeometry = new THREE.SphereGeometry(0.05, 6, 4);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF00,
                emissive: 0xFFAA00,
                transparent: true,
                opacity: 0.8
            });
            
            this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
            this.muzzleFlash.position.set(0.3, 0, 0);
            this.weaponModel.add(this.muzzleFlash);
            
            // Remove flash after short time
            setTimeout(() => {
                if (this.muzzleFlash && this.weaponModel) {
                    this.weaponModel.remove(this.muzzleFlash);
                    this.muzzleFlash = null;
                }
            }, 50);
            
        } catch (error) {
            console.error("Error creating muzzle flash:", error);
        }
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.maxAmmo) return;
        
        this.isReloading = true;
        console.log("Reloading weapon...");
        
        setTimeout(() => {
            this.currentAmmo = this.maxAmmo;
            this.isReloading = false;
            this.updateAmmoDisplay();
            console.log("Reload complete!");
        }, this.reloadTime);
    }
    
    updateAmmoDisplay() {
        const ammoElement = document.querySelector('.ammo-count');
        if (ammoElement) {
            if (!this.isEquipped) {
                ammoElement.textContent = "Weapon Holstered";
                ammoElement.style.color = "#888";
            } else if (this.isReloading) {
                ammoElement.textContent = "Reloading...";
                ammoElement.style.color = "#ffaa00";
            } else {
                ammoElement.textContent = `Ammo: ${this.currentAmmo}/${this.maxAmmo}`;
                ammoElement.style.color = this.currentAmmo > 5 ? "#fff" : "#ff3e3e";
            }
        }
    }
    
    update(delta) {
        if (this.isEquipped && this.weaponGroup) {
            // Add slight weapon sway for realism
            const time = Date.now() * 0.001;
            this.weaponModel.position.x = 0.3 + Math.sin(time * 2) * 0.002;
            this.weaponModel.position.y = -0.2 + Math.cos(time * 1.5) * 0.001;
        }
    }
    
    destroy() {
        // Clean up 3D objects only (no event listeners to remove)
        if (this.weaponGroup && this.camera) {
            this.camera.remove(this.weaponGroup);
        }
        
        console.log("Weapon destroyed");
    }
}

// Make Weapon globally available
window.Weapon = Weapon;
console.log("Weapon class loaded successfully");