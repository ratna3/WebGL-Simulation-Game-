class Environment {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.isInitialized = false;
        this.parks = [];
        this.trees = [];
        this.parkEntrances = [];
        this.cityGenerator = null;
        
        console.log("Environment constructor called");
    }
    
    init() {
        try {
            console.log("Initializing environment...");
            this.createBasicEnvironment();
            this.isInitialized = true;
            console.log("Environment initialized successfully");
        } catch (error) {
            console.error("Error initializing environment:", error);
            this.createMinimalEnvironment();
            this.isInitialized = true;
        }
    }
    
    createBasicEnvironment() {
        try {
            // Create ground
            const groundGeometry = new THREE.PlaneGeometry(800, 800);
            const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Create ground physics only if CANNON is available
            if (window.CANNON && window.CANNON.Plane && this.world && this.world.addBody) {
                try {
                    const groundShape = new CANNON.Plane();
                    const groundBody = new CANNON.Body({ mass: 0 });
                    groundBody.addShape(groundShape);
                    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
                    this.world.addBody(groundBody);
                } catch (physicsError) {
                    console.log("Ground physics disabled:", physicsError.message);
                }
            }
            
            // Generate city
            this.generateCity();
            
            // Create parks
            this.createBasicParks();
            
            console.log("Basic environment created successfully");
        } catch (error) {
            console.error("Error creating basic environment:", error);
            throw error;
        }
    }
    
    generateCity() {
        if (typeof CityGenerator !== 'undefined') {
            this.cityGenerator = new CityGenerator(this.scene, this.world);
            this.cityGenerator.generateCity();
        } else {
            console.log("CityGenerator not available, creating basic buildings");
            this.createBasicBuildings();
        }
    }
    
    createBasicBuildings() {
        if (typeof BuildingSystem !== 'undefined') {
            const buildingSystem = new BuildingSystem(this.scene, this.world);
            
            for (let i = 0; i < 15; i++) {
                const x = (Math.random() - 0.5) * 300;
                const z = (Math.random() - 0.5) * 300;
                
                if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
                
                buildingSystem.createResidentialBuilding(x, z);
            }
        } else {
            console.log("BuildingSystem not available, skipping buildings");
        }
    }
    
    createMinimalEnvironment() {
        try {
            // Minimal fallback - just a ground plane
            const groundGeometry = new THREE.PlaneGeometry(400, 400);
            const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            this.scene.add(ground);
            
            console.log("Minimal environment created");
        } catch (error) {
            console.error("Error creating minimal environment:", error);
        }
    }
    
    createBasicParks() {
        const parkPositions = [
            { x: 60, z: 60 },
            { x: -60, z: 60 },
            { x: 60, z: -60 },
            { x: -60, z: -60 },
            { x: 0, z: 80 },
            { x: 80, z: 0 }
        ];
        
        parkPositions.forEach((pos, index) => {
            // Create park ground
            const parkGeometry = new THREE.PlaneGeometry(35, 35);
            const parkMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const park = new THREE.Mesh(parkGeometry, parkMaterial);
            park.rotation.x = -Math.PI / 2;
            park.position.set(pos.x, 0.1, pos.z);
            this.scene.add(park);
            
            // Create trees in park
            this.createTreesInPark(pos.x, pos.z);
            
            // Store park location
            this.parks.push({ x: pos.x, y: 0, z: pos.z });
            
            // Create park entrances
            const entrancePositions = [
                { x: pos.x + 18, z: pos.z },
                { x: pos.x - 18, z: pos.z },
                { x: pos.x, z: pos.z + 18 },
                { x: pos.x, z: pos.z - 18 }
            ];
            
            entrancePositions.forEach(entrance => {
                this.parkEntrances.push({
                    x: entrance.x,
                    z: entrance.z,
                    parkCenter: { x: pos.x, z: pos.z }
                });
            });
        });
        
        console.log(`Created ${this.parks.length} parks with trees`);
    }
    
    createTreesInPark(parkX, parkZ) {
        const treeCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < treeCount; i++) {
            const offsetX = (Math.random() - 0.5) * 25;
            const offsetZ = (Math.random() - 0.5) * 25;
            
            const treeX = parkX + offsetX;
            const treeZ = parkZ + offsetZ;
            
            // Create tree trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
            const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(treeX, 1.5, treeZ);
            this.scene.add(trunk);
            
            // Create tree foliage
            const foliageGeometry = new THREE.SphereGeometry(2, 8, 6);
            const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.set(treeX, 4, treeZ);
            this.scene.add(foliage);
            
            // Store tree location
            this.trees.push({ x: treeX, y: 0, z: treeZ });
        }
    }
    
    getParkLocations() {
        return this.parks || [];
    }
    
    getTreeLocations() {
        return this.trees || [];
    }
    
    getParkEntrances() {
        return this.parkEntrances || [];
    }
    
    getCitySpawnPoints() {
        if (this.cityGenerator) {
            return this.cityGenerator.getCitySpawnPoints();
        }
        
        // Fallback spawn points
        const spawnPoints = [];
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const distance = 30 + Math.random() * 40;
            
            spawnPoints.push({
                x: Math.cos(angle) * distance,
                y: 1,
                z: Math.sin(angle) * distance
            });
        }
        
        return spawnPoints;
    }
    
    update(delta) {
        // Update environmental elements if needed
    }
}

// Make Environment globally available
window.Environment = Environment;
console.log("Environment.js loaded successfully");
