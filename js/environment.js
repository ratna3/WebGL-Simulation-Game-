class Environment {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.cityGenerator = null;
        this.buildings = [];
        this.trees = [];
        this.roads = [];
        
        console.log("Environment system initialized");
    }
    
    init() {
        try {
            console.log("Initializing Kandahar Extraction environment...");
            
            // Create city generator
            this.cityGenerator = new CityGenerator(this.scene, this.world);
            
            // Generate the complete city
            this.cityGenerator.generateCompleteCity();
            
            // Store references for easy access
            this.buildings = this.cityGenerator.buildings;
            this.trees = this.cityGenerator.trees;
            this.roads = this.cityGenerator.roads;
            
            console.log("Kandahar city environment created successfully");
            
        } catch (error) {
            console.error("Error initializing environment:", error);
            this.generateFallbackEnvironment();
        }
    }
    
    generateFallbackEnvironment() {
        console.log("Generating fallback environment for Kandahar Extraction...");
        
        try {
            // Create ground
            const groundGeometry = new THREE.PlaneGeometry(500, 500);
            const groundMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B7355,
                roughness: 0.9
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Add ground physics
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0 });
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.addBody(groundBody);
            
            // Create simple buildings around the area
            this.createFallbackBuildings();
            
            console.log("Fallback environment created");
            
        } catch (error) {
            console.error("Error creating fallback environment:", error);
        }
    }
    
    createFallbackBuildings() {
        const buildingPositions = [
            { x: 30, z: 30 }, { x: -30, z: 30 }, { x: 30, z: -30 }, { x: -30, z: -30 },
            { x: 60, z: 0 }, { x: -60, z: 0 }, { x: 0, z: 60 }, { x: 0, z: -60 },
            { x: 50, z: 50 }, { x: -50, z: 50 }, { x: 50, z: -50 }, { x: -50, z: -50 }
        ];
        
        buildingPositions.forEach((pos, i) => {
            const height = 20 + Math.random() * 30;
            const width = 15 + Math.random() * 10;
            const depth = 15 + Math.random() * 10;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.1, 0.3, 0.2 + Math.random() * 0.3)
            });
            
            const building = new THREE.Mesh(geometry, material);
            building.position.set(pos.x, height / 2, pos.z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
            
            // Add physics
            const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape);
            body.position.set(pos.x, height/2, pos.z);
            this.world.addBody(body);
            
            this.buildings.push(building);
        });
    }
    
    getBuildingCount() {
        return this.buildings.length;
    }
    
    getTreeCount() {
        return this.trees.length;
    }
    
    getRoadCount() {
        return this.roads.length;
    }
    
    getTreeLocations() {
        return this.trees.map(tree => ({ x: tree.x, z: tree.z }));
    }
    
    getParkLocations() {
        if (this.cityGenerator && this.cityGenerator.parks) {
            return this.cityGenerator.parks.map(park => ({ x: park.x, z: park.z }));
        }
        return [
            { x: 40, z: 40 }, { x: -40, z: 40 }, 
            { x: 40, z: -40 }, { x: -40, z: -40 }
        ];
    }
    
    update(delta) {
        // Environment updates if needed
    }
}

window.Environment = Environment;
console.log("Environment class loaded");
