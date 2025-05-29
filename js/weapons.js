class Weapon {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        this.isEquipped = false; // START HOLSTERED
        this.weaponGroup = null;
        this.bulletSystem = null;
        
        // Weapon stats - EXACTLY 40 damage for 4-shot enemy kills
        this.damage = 40; // CRITICAL: This must be exactly 40 for 4-shot kills (160 enemy health / 40 damage = 4 shots)
        this.maxAmmo = 30;
        this.currentAmmo = this.maxAmmo;
        this.reloadTime = 2000;
        this.fireRate = 200;
        this.lastShotTime = 0;
        this.isReloading = false;
        
        // Visual elements
        this.muzzleFlash = null;
        this.weaponModel = null;
        
        console.log(`Weapon initialized with EXACTLY ${this.damage} damage for 4-shot enemy kills`);
        console.log("Weapon starts HOLSTERED - press Tab to equip when needed");
        this.createWeaponModel();
        
        // Make sure weapon starts holstered by updating display immediately
        setTimeout(() => {
            this.updateAmmoDisplay();
        }, 100);
    }
    
    createWeaponModel() {
        try {
            this.weaponGroup = new THREE.Group();
            
            // Create realistic pistol body (main frame)
            const weaponGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.22);
            const weaponMaterial = new THREE.MeshStandardMaterial({
                color: 0x1A1A1A,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0x0A0A0A,
                emissiveIntensity: 0.05
            });
            
            this.weaponModel = new THREE.Mesh(weaponGeometry, weaponMaterial);
            this.weaponModel.castShadow = true;
            this.weaponModel.receiveShadow = true;
            
            // Position weapon for first-person view (right-handed grip)
            this.weaponModel.position.set(0.25, -0.4, -0.2);
            this.weaponModel.rotation.set(0, Math.PI / 8, 0);
            
            this.weaponGroup.add(this.weaponModel);
            
            // Create detailed barrel
            const barrelGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 12);
            const barrelMaterial = new THREE.MeshStandardMaterial({
                color: 0x0F0F0F,
                metalness: 0.95,
                roughness: 0.1,
                emissive: 0x050505,
                emissiveIntensity: 0.02
            });
            
            const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 2;
            barrel.position.set(0.08, 0.03, 0);
            barrel.castShadow = true;
            this.weaponModel.add(barrel);
            
            // Create slide (upper part of pistol)
            const slideGeometry = new THREE.BoxGeometry(0.04, 0.06, 0.18);
            const slide = new THREE.Mesh(slideGeometry, weaponMaterial);
            slide.position.set(0, 0.04, 0);
            slide.castShadow = true;
            this.weaponModel.add(slide);
            
            // Create grip (handle)
            const gripGeometry = new THREE.BoxGeometry(0.04, 0.16, 0.08);
            const gripMaterial = new THREE.MeshStandardMaterial({
                color: 0x2A2A2A,
                roughness: 0.8,
                metalness: 0.3
            });
            const grip = new THREE.Mesh(gripGeometry, gripMaterial);
            grip.position.set(0, -0.08, -0.07);
            grip.castShadow = true;
            this.weaponModel.add(grip);
            
            // Create trigger guard
            const triggerGuardGeometry = new THREE.TorusGeometry(0.025, 0.004, 8, 16, Math.PI);
            const triggerGuard = new THREE.Mesh(triggerGuardGeometry, barrelMaterial);
            triggerGuard.position.set(0, -0.04, -0.02);
            triggerGuard.rotation.x = Math.PI;
            this.weaponModel.add(triggerGuard);
            
            // Create trigger
            const triggerGeometry = new THREE.BoxGeometry(0.006, 0.02, 0.015);
            const triggerMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.8,
                roughness: 0.3
            });
            const trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
            trigger.position.set(0, -0.04, -0.01);
            this.weaponModel.add(trigger);
            
            // Create front sight
            const frontSightGeometry = new THREE.BoxGeometry(0.006, 0.015, 0.008);
            const sightMaterial = new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.7,
                roughness: 0.4
            });
            const frontSight = new THREE.Mesh(frontSightGeometry, sightMaterial);
            frontSight.position.set(0, 0.075, 0.08);
            this.weaponModel.add(frontSight);
            
            // Create rear sight
            const rearSightGeometry = new THREE.BoxGeometry(0.008, 0.012, 0.004);
            const rearSight = new THREE.Mesh(rearSightGeometry, sightMaterial);
            rearSight.position.set(0, 0.07, -0.08);
            this.weaponModel.add(rearSight);
            
            // Create hammer
            const hammerGeometry = new THREE.BoxGeometry(0.008, 0.02, 0.01);
            const hammer = new THREE.Mesh(hammerGeometry, weaponMaterial);
            hammer.position.set(0, 0.05, -0.09);
            hammer.rotation.x = Math.PI / 6;
            this.weaponModel.add(hammer);
            
            // Create magazine (visible bottom part)
            const magazineGeometry = new THREE.BoxGeometry(0.035, 0.08, 0.06);
            const magazineMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.6,
                roughness: 0.5
            });
            const magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
            magazine.position.set(0, -0.14, -0.02);
            magazine.castShadow = true;
            this.weaponModel.add(magazine);
            
            // Create magazine release button
            const magReleaseGeometry = new THREE.SphereGeometry(0.008, 8, 8);
            const magRelease = new THREE.Mesh(magReleaseGeometry, triggerMaterial);
            magRelease.position.set(-0.03, -0.06, -0.02);
            this.weaponModel.add(magRelease);
            
            // Create safety switch
            const safetyGeometry = new THREE.BoxGeometry(0.004, 0.008, 0.006);
            const safety = new THREE.Mesh(safetyGeometry, triggerMaterial);
            safety.position.set(-0.025, -0.02, -0.04);
            this.weaponModel.add(safety);
            
            // Create slide serrations (decorative lines)
            for (let i = 0; i < 8; i++) {
                const serrationGeometry = new THREE.BoxGeometry(0.001, 0.04, 0.008);
                const serration = new THREE.Mesh(serrationGeometry, new THREE.MeshStandardMaterial({ 
                    color: 0x0A0A0A,
                    metalness: 0.9,
                    roughness: 0.4
                }));
                serration.position.set(0.021, 0.04, -0.06 + (i * 0.012));
                this.weaponModel.add(serration);
            }
            
            // Store barrel reference for muzzle flash positioning
            this.weaponBarrel = barrel;
            
            console.log("Realistic pistol model created with detailed components");
        } catch (error) {
            console.error("Error creating weapon model:", error);
        }
    }
    
    equip() {
        if (this.isEquipped) return;
        
        console.log("Equipping weapon...");
        this.isEquipped = true;
        
        // Add weapon directly to camera so it moves with view
        this.camera.add(this.weaponGroup);
        
        // Make sure weapon is visible
        this.weaponGroup.visible = true;
        this.weaponModel.visible = true;
        
        // Connect to bullet system
        if (window.game && window.game.bulletSystem) {
            this.bulletSystem = window.game.bulletSystem;
        }
        
        this.updateAmmoDisplay();
        console.log("Weapon equipped and should be visible");
        
        // Debug weapon visibility
        this.debugWeaponVisibility();
    }
    
    holster() {
        if (!this.isEquipped) return;
        
        console.log("Holstering weapon...");
        this.isEquipped = false;
        
        // Remove weapon from camera
        if (this.weaponGroup.parent === this.camera) {
            this.camera.remove(this.weaponGroup);
        }
        
        this.updateAmmoDisplay();
        console.log("Weapon holstered");
    }
    
    debugWeaponVisibility() {
        console.log("=== WEAPON DEBUG ===");
        console.log("Weapon equipped:", this.isEquipped);
        console.log("Weapon group exists:", !!this.weaponGroup);
        console.log("Weapon group visible:", this.weaponGroup?.visible);
        console.log("Weapon model exists:", !!this.weaponModel);
        console.log("Weapon model visible:", this.weaponModel?.visible);
        console.log("Weapon group parent:", this.weaponGroup?.parent?.type || "No parent");
        console.log("Weapon group position:", this.weaponGroup?.position);
        console.log("Weapon model position:", this.weaponModel?.position);
        console.log("Camera children count:", this.camera.children.length);
        console.log("==================");
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
            console.log("=== FIRING BULLET ===");
            
            // Ensure bullet system is available
            if (!this.bulletSystem) {
                if (window.game && window.game.bulletSystem) {
                    this.bulletSystem = window.game.bulletSystem;
                } else {
                    console.error("Bullet system not available!");
                    return;
                }
            }
            
            // Calculate accurate bullet start position from barrel tip
            const startPosition = new THREE.Vector3();
            
            if (this.weaponBarrel && this.weaponGroup.parent === this.camera) {
                // Get barrel tip in world coordinates
                const barrelTip = new THREE.Vector3(0.075, 0, 0); // Barrel tip offset
                this.weaponBarrel.localToWorld(barrelTip);
                startPosition.copy(barrelTip);
                console.log("Bullet start from barrel tip:", startPosition);
            } else {
                // Fallback to camera position with offset
                startPosition.copy(this.camera.position);
                const forward = new THREE.Vector3();
                this.camera.getWorldDirection(forward);
                startPosition.add(forward.multiplyScalar(0.5));
                console.log("Bullet start from camera offset:", startPosition);
            }
            
            // Get accurate shooting direction
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);
            
            // Very minimal spread for accuracy
            const spread = 0.005;
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.z += (Math.random() - 0.5) * spread;
            direction.normalize();
            
            console.log("Bullet direction:", direction);
            console.log("Weapon damage:", this.damage);
            
            // Create bullet with exact damage
            const bullet = this.bulletSystem.createBullet(
                startPosition, 
                direction, 
                100, // High speed
                this.damage, // Exact damage (40)
                'player'
            );
            
            if (bullet) {
                console.log("Bullet created successfully:", bullet.damage, "damage");
                console.log("Bullet physics body:", !!bullet.body);
                console.log("Bullet mesh:", !!bullet.mesh);
                
                // CRITICAL: Verify bullet has collision detection enabled
                if (bullet.body) {
                    console.log("Bullet body collision groups:", bullet.body.collisionFilterGroup, bullet.body.collisionFilterMask);
                    
                    // Ensure bullet can collide with everything
                    bullet.body.collisionFilterGroup = 1;
                    bullet.body.collisionFilterMask = -1;
                    
                    console.log("Bullet collision detection enabled");
                } else {
                    console.error("Bullet has no physics body!");
                }
            } else {
                console.error("Failed to create bullet!");
            }
            
            console.log("==================");
            
        } catch (error) {
            console.error("Error firing bullet:", error);
        }
    }
    
    performRaycast() {
        // Fallback raycast implementation with exact damage
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
                        console.log(`Raycast hit with EXACTLY ${this.damage} damage`);
                        target.takeDamage(this.damage); // Use exact weapon damage
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
            // Remove existing muzzle flash
            if (this.muzzleFlash) {
                this.weaponModel.remove(this.muzzleFlash);
            }
            
            // Create bright spherical muzzle flash
            const flashGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const flashMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                emissive: 0xFFFF00,
                emissiveIntensity: 2.0,
                transparent: true,
                opacity: 1.0
            });
            
            this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
            
            if (this.weaponBarrel) {
                // Position at barrel tip
                this.muzzleFlash.position.set(0.075, 0, 0);
                this.weaponBarrel.add(this.muzzleFlash);
            } else {
                // Fallback position
                this.muzzleFlash.position.set(0.08, 0.03, 0);
                this.weaponModel.add(this.muzzleFlash);
            }
            
            // Animate muzzle flash
            let flashIntensity = 2.0;
            const flashInterval = setInterval(() => {
                flashIntensity -= 0.3;
                if (flashIntensity <= 0) {
                    if (this.muzzleFlash) {
                        this.muzzleFlash.parent.remove(this.muzzleFlash);
                        this.muzzleFlash = null;
                    }
                    clearInterval(flashInterval);
                } else {
                    this.muzzleFlash.material.emissiveIntensity = flashIntensity;
                    this.muzzleFlash.material.opacity = flashIntensity / 2;
                }
            }, 15);
            
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
        if (this.isEquipped && this.weaponGroup && this.weaponModel) {
            // Add realistic weapon sway and movement
            const time = Date.now() * 0.001;
            
            // Breathing sway
            this.weaponModel.position.x = 0.4 + Math.sin(time * 1.5) * 0.003;
            this.weaponModel.position.y = -0.3 + Math.cos(time * 1.2) * 0.002;
            
            // Slight rotation sway
            this.weaponModel.rotation.z = Math.sin(time * 0.8) * 0.005;
            
            // Ensure visibility is maintained
            if (!this.weaponGroup.visible) {
                console.warn("Weapon group became invisible, fixing...");
                this.weaponGroup.visible = true;
                this.weaponModel.visible = true;
            }
        }
    }
    
    // Add method to force weapon visibility
    forceVisible() {
        if (this.weaponGroup) {
            this.weaponGroup.visible = true;
            this.weaponGroup.traverse((child) => {
                if (child.isMesh) {
                    child.visible = true;
                    child.material.transparent = false;
                    child.material.opacity = 1.0;
                }
            });
            console.log("Forced weapon visibility");
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
console.log("Weapon class loaded with EXACT 40 damage for 4-shot enemy kills");