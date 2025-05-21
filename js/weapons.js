class Weapon {
    constructor(scene, camera, world) {
        this.scene = scene;
        this.camera = camera;
        this.world = world;
        
        this.mesh = null;
        this.name = 'Generic Weapon';
        this.damage = 10;
        this.range = 100;
        this.fireRate = 1; // shots per second
        this.ammoPerClip = 10;
        this.totalAmmo = 50;
        this.currentAmmo = this.ammoPerClip;
        this.reloadTime = 2000; // in milliseconds
        
        this.isReloading = false;
        this.lastFireTime = 0;
    }
    
    init() {
        // Create weapon model
        this.createWeaponModel();
    }
    
    createWeaponModel() {
        // Default weapon model
        const gunGroup = new THREE.Group();
        
        // Gun body
        const bodyGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.5;
        gunGroup.add(body);
        
        // Gun handle
        const handleGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.2);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.3;
        handle.position.z = -0.2;
        gunGroup.add(handle);
        
        // Position the weapon in front of the camera
        gunGroup.position.set(0.3, -0.2, -0.5);
        
        this.mesh = gunGroup;
    }
    
    fire() {
        const now = Date.now();
        if (now - this.lastFireTime < 1000 / this.fireRate) return false;
        if (this.isReloading) return false;
        
        if (this.currentAmmo <= 0) {
            console.log("Click - out of ammo");
            this.reload();
            return false;
        }
        
        this.lastFireTime = now;
        this.currentAmmo--;
        
        console.log(`Fired weapon! Ammo: ${this.currentAmmo}/${this.totalAmmo}`);
        
        // Apply weapon recoil
        this.applyRecoil();
        
        // Perform raycast for hit detection
        return this.performRaycast();
    }
    
    reload() {
        if (this.isReloading || this.currentAmmo === this.ammoPerClip || this.totalAmmo <= 0) return;
        
        this.isReloading = true;
        console.log("Reloading...");
        
        // Update UI to show reloading
        document.dispatchEvent(new CustomEvent('weaponReloading', {
            detail: { reloading: true }
        }));
        
        setTimeout(() => {
            const ammoNeeded = this.ammoPerClip - this.currentAmmo;
            const ammoToAdd = Math.min(this.totalAmmo, ammoNeeded);
            
            this.currentAmmo += ammoToAdd;
            this.totalAmmo -= ammoToAdd;
            
            this.isReloading = false;
            
            console.log(`Reload complete! Ammo: ${this.currentAmmo}/${this.totalAmmo}`);
            
            // Update UI to show reloading complete
            document.dispatchEvent(new CustomEvent('weaponReloading', {
                detail: { reloading: false }
            }));
            
            // Update ammo display
            document.dispatchEvent(new CustomEvent('ammoUpdate', {
                detail: { current: this.currentAmmo, total: this.totalAmmo }
            }));
        }, this.reloadTime);
    }
    
    performRaycast() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Get objects that can be hit
        const objects = this.scene.children.filter(obj => {
            return (obj.isMesh && obj !== this.mesh);
        });
        
        const intersects = raycaster.intersectObjects(objects);
        
        if (intersects.length > 0) {
            const hit = intersects[0];
            console.log("Hit something at distance:", hit.distance);
            return { hit: true, point: hit.point };
        }
        
        return { hit: false };
    }
    
    applyRecoil() {
        // Simulate weapon recoil
        const recoilAmount = 0.03;
        const recoveryTime = 200;
        
        // Apply recoil to weapon position
        if (this.mesh) {
            this.mesh.position.z += recoilAmount;
            
            // Recover from recoil
            setTimeout(() => {
                if (this.mesh) {
                    this.mesh.position.z -= recoilAmount;
                }
            }, recoveryTime);
        }
    }
    
    update() {
        // Update weapon position and orientation if needed
    }
}

class Pistol extends Weapon {
    constructor(scene, camera, world) {
        super(scene, camera, world);
        
        this.name = 'Pistol';
        this.damage = 20;
        this.range = 50;
        this.fireRate = 2; // shots per second
        this.ammoPerClip = 15;
        this.totalAmmo = 60;
        this.currentAmmo = this.ammoPerClip;
        this.reloadTime = 1500;
    }
    
    createWeaponModel() {
        const gunGroup = new THREE.Group();
        
        // Gun body
        const bodyGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.z = -0.3;
        gunGroup.add(body);
        
        // Gun handle
        const handleGeometry = new THREE.BoxGeometry(0.12, 0.3, 0.15);
        const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.2;
        handle.position.z = -0.15;
        gunGroup.add(handle);
        
        // Position the weapon in front of the camera
        gunGroup.position.set(0.25, -0.2, -0.5);
        
        this.mesh = gunGroup;
    }
}

// Expose WeaponFactory globally
window.WeaponFactory = {
    createWeapon: function(type, scene, camera, world) {
        switch(type.toLowerCase()) {
            case 'pistol':
                return new Pistol(scene, camera, world);
            default:
                return new Weapon(scene, camera, world);
        }
    }
};