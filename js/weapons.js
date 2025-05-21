class Weapon {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        
        this.damage = 10;
        this.ammo = 30;
        this.maxAmmo = 120;
    }
    
    init() {
        // Create a simple weapon model
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const material = new THREE.MeshStandardMaterial({color: 0x333333});
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Position it in front of the camera
        this.mesh.position.set(0.3, -0.2, -0.5);
        this.camera.add(this.mesh);
    }
    
    fire() {
        console.log("Weapon fired");
        
        // Play sound, etc.
        
        return true;
    }
    
    update() {
        // Weapon updates if needed
    }
}

// Make Weapon class globally available
window.Weapon = Weapon;