class Environment {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Initialize texture system first
        try {
            console.log("Initializing texture system...");
            this.textureSystem = BuildingTextures.getInstance();
            console.log("Texture system ready");
        } catch (error) {
            console.error("Error initializing texture system in environment:", error);
            this.textureSystem = new BuildingTextures();
        }
        
        this.cityGenerator = new CityGenerator(scene, world);
    }
    
    init() {
        try {
            console.log("Initializing complete city environment");
            this.createSky();
            
            // Ensure texture system is ready before generating city
            if (!this.textureSystem.isInitialized) {
                console.log("Waiting for texture system initialization...");
                this.textureSystem.createAllTextures();
            }
            
            this.cityGenerator.generateCompleteCity();
            return true;
        } catch (error) {
            console.error("Error initializing environment:", error);
            return false;
        }
    }
    
    createSky() {
        Utils.createSkyBox(this.scene);
    }
    
    getParkLocations() {
        return this.cityGenerator.getParkLocations();
    }
    
    getTreeLocations() {
        return this.cityGenerator.getTreeLocations();
    }
    
    update(delta) {
        // Environment updates if needed
    }
}

// Make Environment class globally available
window.Environment = Environment;
