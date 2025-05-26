class BuildingTextures {
    constructor() {
        this.materials = {};
        this.createMaterials();
    }
    
    createMaterials() {
        // Residential building materials
        this.materials.residential = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Commercial building materials
        this.materials.commercial = new THREE.MeshStandardMaterial({
            color: 0x606060,
            roughness: 0.6,
            metalness: 0.3
        });
        
        // Industrial building materials
        this.materials.industrial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.9,
            metalness: 0.2
        });
        
        console.log("Building textures initialized");
    }
    
    getMaterial(type) {
        return this.materials[type] || this.materials.residential;
    }
}

// Make BuildingTextures globally available
window.BuildingTextures = BuildingTextures;
console.log("BuildingTextures.js loaded successfully");
