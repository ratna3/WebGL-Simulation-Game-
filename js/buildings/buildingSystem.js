class BuildingSystem {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.buildings = [];
        this.textures = new BuildingTextures();
        
        console.log("BuildingSystem initialized");
    }
    
    createBuilding(x, z, width = 10, height = 20, depth = 10, type = 'residential') {
        try {
            // Create building geometry
            const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
            const buildingMaterial = this.textures.getMaterial(type);
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            
            // Position building
            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            
            // Add to scene
            this.scene.add(building);
            
            // Create physics body only if CANNON is properly loaded
            if (window.CANNON && window.CANNON.Box && this.world && this.world.addBody) {
                try {
                    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
                    const body = new CANNON.Body({ mass: 0 });
                    body.addShape(shape);
                    body.position.set(x, height/2, z);
                    this.world.addBody(body);
                } catch (physicsError) {
                    console.log("Physics disabled for building:", physicsError.message);
                }
            }
            
            this.buildings.push(building);
            return building;
            
        } catch (error) {
            console.error("Error creating building:", error);
            return null;
        }
    }
    
    createResidentialBuilding(x, z) {
        const width = 8 + Math.random() * 4;
        const height = 15 + Math.random() * 10;
        const depth = 8 + Math.random() * 4;
        return this.createBuilding(x, z, width, height, depth, 'residential');
    }
    
    createCommercialBuilding(x, z) {
        const width = 12 + Math.random() * 8;
        const height = 20 + Math.random() * 15;
        const depth = 12 + Math.random() * 8;
        return this.createBuilding(x, z, width, height, depth, 'commercial');
    }
}

// Make BuildingSystem globally available
window.BuildingSystem = BuildingSystem;
console.log("BuildingSystem.js loaded successfully");
