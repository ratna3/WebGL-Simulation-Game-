class CityGenerator {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.citySize = 400;
        this.blockSize = 40;
        this.roadWidth = 8;
        this.buildings = [];
        this.parks = [];
        this.roads = [];
        this.trees = [];
        
        // Initialize texture system with better error handling
        this.initializeTextureSystem();
        
        // Grid system
        this.gridSize = Math.floor(this.citySize / this.blockSize);
        this.cityGrid = this.createCityGrid();
    }
    
    initializeTextureSystem() {
        try {
            console.log("CityGenerator: Initializing texture system...");
            this.textureSystem = BuildingTextures.getInstance();
            
            // Wait a moment for textures to be ready
            if (!this.textureSystem.isInitialized) {
                console.log("CityGenerator: Waiting for texture system to initialize...");
                setTimeout(() => {
                    if (!this.textureSystem.isInitialized) {
                        console.warn("CityGenerator: Texture system still not ready, creating fallback");
                        this.textureSystem.createFallbackTextures();
                    }
                }, 100);
            }
            
            console.log("CityGenerator: Texture system initialized");
        } catch (error) {
            console.error("CityGenerator: Error initializing texture system:", error);
            this.textureSystem = new BuildingTextures();
        }
    }
    
    createCityGrid() {
        const grid = [];
        const halfGrid = Math.floor(this.gridSize / 2);
        
        for (let x = -halfGrid; x <= halfGrid; x++) {
            grid[x] = {};
            for (let z = -halfGrid; z <= halfGrid; z++) {
                // Determine block type
                if (this.isRoadBlock(x, z)) {
                    grid[x][z] = 'road';
                } else if (this.isParkBlock(x, z)) {
                    grid[x][z] = 'park';
                } else {
                    grid[x][z] = 'building';
                }
            }
        }
        
        return grid;
    }
    
    isRoadBlock(x, z) {
        // Main roads every 3 blocks
        return (x % 3 === 0) || (z % 3 === 0);
    }
    
    isParkBlock(x, z) {
        // Parks in specific locations (away from center)
        const absX = Math.abs(x);
        const absZ = Math.abs(z);
        
        // Create parks at specific coordinates
        const parkLocations = [
            { x: -6, z: -3 }, { x: 6, z: -3 },
            { x: -3, z: 6 }, { x: 3, z: 6 },
            { x: -9, z: 0 }, { x: 9, z: 0 }
        ];
        
        return parkLocations.some(park => 
            Math.abs(x - park.x) <= 1 && Math.abs(z - park.z) <= 1
        );
    }
    
    generateCompleteCity() {
        console.log("Generating complete city...");
        
        // Create ground first
        this.createCityGround();
        
        // Generate all city blocks
        this.generateAllBlocks();
        
        // Add city boundaries
        this.createCityBoundaries();
        
        // Add road trees
        this.addRoadTrees();
        
        console.log("City generation complete!");
    }
    
    createCityGround() {
        // Create a single large ground plane to prevent glitching
        const groundSize = this.citySize + 100;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        
        // Use a simple material if textures fail
        let groundMaterial;
        try {
            const concreteTexture = this.textureSystem.getTexture('concrete');
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2D5016,
                roughness: 0.8,
                map: concreteTexture
            });
        } catch (error) {
            console.warn("Failed to load ground texture, using solid color:", error);
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2D5016,
                roughness: 0.8
            });
        }
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add ground physics
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            material: new CANNON.Material({ friction: 0.8, restitution: 0 })
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -0.1, 0);
        this.world.addBody(groundBody);
        
        console.log("City ground created");
    }
    
    generateAllBlocks() {
        const halfGrid = Math.floor(this.gridSize / 2);
        
        for (let x = -halfGrid; x <= halfGrid; x++) {
            for (let z = -halfGrid; z <= halfGrid; z++) {
                const worldX = x * this.blockSize;
                const worldZ = z * this.blockSize;
                const blockType = this.cityGrid[x][z];
                
                switch (blockType) {
                    case 'road':
                        this.createRoadBlock(worldX, worldZ);
                        break;
                    case 'park':
                        this.createParkBlock(worldX, worldZ);
                        break;
                    case 'building':
                        this.createBuildingBlock(worldX, worldZ);
                        break;
                }
            }
        }
    }
    
    createRoadBlock(x, z) {
        // Create road surface with proper orientation
        const roadGeometry = new THREE.PlaneGeometry(this.blockSize, this.blockSize);
        
        let roadMaterial;
        try {
            const roadTexture = this.textureSystem.getTexture('road');
            roadMaterial = new THREE.MeshStandardMaterial({
                map: roadTexture,
                roughness: 0.9
            });
            
            // Ensure texture repeats properly for road blocks
            if (roadTexture) {
                roadTexture.repeat.set(1, 1);
                roadTexture.needsUpdate = true;
            }
        } catch (error) {
            console.warn("Failed to load road texture, using solid color:", error);
            roadMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.9
            });
        }
        
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(x, 0.01, z);
        road.receiveShadow = true;
        this.scene.add(road);
        this.roads.push(road);
        
        // Add road markings (yellow lines) based on road direction
        this.addRoadMarkings(x, z);
        
        // Add trees alongside roads
        this.addRoadSideTrees(x, z);
    }
    
    addRoadMarkings(x, z) {
        // Determine if this is a horizontal or vertical road
        const gridX = Math.round(x / this.blockSize);
        const gridZ = Math.round(z / this.blockSize);
        
        const isMainHorizontalRoad = (gridZ % 3 === 0);
        const isMainVerticalRoad = (gridX % 3 === 0);
        
        // Create yellow line markings
        const lineWidth = 0.5;
        const lineLength = this.blockSize * 0.8;
        
        if (isMainHorizontalRoad && !isMainVerticalRoad) {
            // Horizontal road - yellow line runs east-west
            const lineGeometry = new THREE.PlaneGeometry(lineLength, lineWidth);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const yellowLine = new THREE.Mesh(lineGeometry, lineMaterial);
            yellowLine.rotation.x = -Math.PI / 2;
            yellowLine.position.set(x, 0.02, z); // Slightly above road
            this.scene.add(yellowLine);
        } else if (isMainVerticalRoad && !isMainHorizontalRoad) {
            // Vertical road - yellow line runs north-south
            const lineGeometry = new THREE.PlaneGeometry(lineWidth, lineLength);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            const yellowLine = new THREE.Mesh(lineGeometry, lineMaterial);
            yellowLine.rotation.x = -Math.PI / 2;
            yellowLine.position.set(x, 0.02, z); // Slightly above road
            this.scene.add(yellowLine);
        } else if (isMainHorizontalRoad && isMainVerticalRoad) {
            // Intersection - add crossing lines
            const lineGeometry1 = new THREE.PlaneGeometry(lineLength, lineWidth);
            const lineGeometry2 = new THREE.PlaneGeometry(lineWidth, lineLength);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
            
            const horizontalLine = new THREE.Mesh(lineGeometry1, lineMaterial);
            horizontalLine.rotation.x = -Math.PI / 2;
            horizontalLine.position.set(x, 0.02, z);
            this.scene.add(horizontalLine);
            
            const verticalLine = new THREE.Mesh(lineGeometry2, lineMaterial);
            verticalLine.rotation.x = -Math.PI / 2;
            verticalLine.position.set(x, 0.02, z);
            this.scene.add(verticalLine);
        }
    }
    
    addRoadSideTrees(x, z) {
        // Add trees on sidewalks (not in intersections)
        const gridX = Math.round(x / this.blockSize);
        const gridZ = Math.round(z / this.blockSize);
        
        const isMainHorizontalRoad = (gridZ % 3 === 0);
        const isMainVerticalRoad = (gridX % 3 === 0);
        
        // Don't add trees at intersections
        if (isMainHorizontalRoad && isMainVerticalRoad) return;
        
        // 40% chance to add trees along road sides
        if (Math.random() > 0.6) {
            const treeOffset = this.blockSize / 2 + 3;
            
            if (isMainHorizontalRoad) {
                // Horizontal road - trees on north and south sides
                if (Math.random() > 0.5) {
                    this.createStreetTree(x, z - treeOffset);
                }
                if (Math.random() > 0.5) {
                    this.createStreetTree(x, z + treeOffset);
                }
            } else if (isMainVerticalRoad) {
                // Vertical road - trees on east and west sides
                if (Math.random() > 0.5) {
                    this.createStreetTree(x - treeOffset, z);
                }
                if (Math.random() > 0.5) {
                    this.createStreetTree(x + treeOffset, z);
                }
            }
        }
    }
    
    generateCompleteCity() {
        console.log("Generating complete city...");
        
        // Create ground first
        this.createCityGround();
        
        // Generate all city blocks
        this.generateAllBlocks();
        
        // Add city boundaries
        this.createCityBoundaries();
        
        // Add road trees
        this.addRoadTrees();
        
        console.log("City generation complete!");
    }
    
    createCityGround() {
        // Create a single large ground plane to prevent glitching
        const groundSize = this.citySize + 100;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        
        // Use a simple material if textures fail
        let groundMaterial;
        try {
            const concreteTexture = this.textureSystem.getTexture('concrete');
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2D5016,
                roughness: 0.8,
                map: concreteTexture
            });
        } catch (error) {
            console.warn("Failed to load ground texture, using solid color:", error);
            groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x2D5016,
                roughness: 0.8
            });
        }
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add ground physics
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            material: new CANNON.Material({ friction: 0.8, restitution: 0 })
        });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -0.1, 0);
        this.world.addBody(groundBody);
        
        console.log("City ground created");
    }
    
    generateAllBlocks() {
        const halfGrid = Math.floor(this.gridSize / 2);
        
        for (let x = -halfGrid; x <= halfGrid; x++) {
            for (let z = -halfGrid; z <= halfGrid; z++) {
                const worldX = x * this.blockSize;
                const worldZ = z * this.blockSize;
                const blockType = this.cityGrid[x][z];
                
                switch (blockType) {
                    case 'road':
                        this.createRoadBlock(worldX, worldZ);
                        break;
                    case 'park':
                        this.createParkBlock(worldX, worldZ);
                        break;
                    case 'building':
                        this.createBuildingBlock(worldX, worldZ);
                        break;
                }
            }
        }
    }
    
    createBuildingBlock(x, z) {
        // Random building configuration
        const buildingCount = Math.random() > 0.3 ? 1 : 2; // Sometimes 2 buildings per block
        
        if (buildingCount === 1) {
            this.createSingleBuilding(x, z);
        } else {
            this.createMultipleBuildings(x, z);
        }
    }
    
    createSingleBuilding(x, z) {
        const floors = Math.floor(Math.random() * 30) + 5; // 5-35 floors
        const height = floors * 3;
        const width = Math.random() * 15 + 20; // 20-35 units
        const depth = Math.random() * 15 + 20;
        
        this.createBuilding(x, height, z, width, depth, floors);
    }
    
    createMultipleBuildings(x, z) {
        // Create 2 smaller buildings
        const offset = this.blockSize * 0.25;
        
        for (let i = 0; i < 2; i++) {
            const buildingX = x + (i === 0 ? -offset : offset);
            const buildingZ = z + (Math.random() - 0.5) * offset;
            
            const floors = Math.floor(Math.random() * 20) + 3; // 3-23 floors
            const height = floors * 3;
            const width = Math.random() * 8 + 12; // 12-20 units
            const depth = Math.random() * 8 + 12;
            
            this.createBuilding(buildingX, height, buildingZ, width, depth, floors);
        }
    }
    
    createBuilding(x, height, z, width, depth, floors) {
        // Choose random texture and style
        const textureTypes = ['windows', 'glass', 'concrete', 'metal'];
        const textureType = textureTypes[Math.floor(Math.random() * textureTypes.length)];
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        
        let buildingMaterial;
        try {
            console.log(`Creating building with ${textureType} texture`);
            const buildingTexture = this.textureSystem.getTexture(textureType);
            
            if (buildingTexture) {
                buildingMaterial = new THREE.MeshStandardMaterial({
                    map: buildingTexture,
                    roughness: textureType === 'glass' ? 0.1 : 0.7,
                    metalness: textureType === 'metal' ? 0.8 : 0.1
                });
                
                // Set texture repeat
                buildingTexture.repeat.set(Math.ceil(width / 10), Math.ceil(floors / 3));
                buildingTexture.needsUpdate = true;
                
                console.log(`Building texture '${textureType}' applied successfully`);
            } else {
                throw new Error(`Failed to get texture: ${textureType}`);
            }
        } catch (error) {
            console.warn(`Failed to load ${textureType} texture, using solid color:`, error);
            
            // Fallback colors based on texture type
            const fallbackColors = {
                windows: 0x2C2C2C,
                glass: 0x87CEEB,
                concrete: 0x8C8C8C,
                metal: 0xC0C0C0
            };
            
            buildingMaterial = new THREE.MeshStandardMaterial({
                color: fallbackColors[textureType] || 0x666666,
                roughness: textureType === 'glass' ? 0.1 : 0.7,
                metalness: textureType === 'metal' ? 0.8 : 0.1
            });
        }
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
        // Add physics
        const buildingShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const buildingBody = new CANNON.Body({ mass: 0 });
        buildingBody.addShape(buildingShape);
        buildingBody.position.set(x, height/2, z);
        this.world.addBody(buildingBody);
        
        // Add building details
        this.addBuildingDetails(x, height, z, width, depth);
        
        this.buildings.push(building);
        
        console.log(`Building created at (${x}, ${z}) with ${textureType} texture - Total buildings: ${this.buildings.length}`);
    }
    
    addBuildingDetails(x, height, z, width, depth) {
        // Antenna (30% chance)
        if (Math.random() > 0.7) {
            const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
            const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(x, height + 2.5, z);
            antenna.castShadow = true;
            this.scene.add(antenna);
        }
        
        // Rooftop structure (20% chance)
        if (Math.random() > 0.8) {
            const rooftopGeometry = new THREE.BoxGeometry(width * 0.3, 3, depth * 0.3);
            
            let rooftopMaterial;
            try {
                const concreteTexture = this.textureSystem.getTexture('concrete');
                rooftopMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    map: concreteTexture
                });
            } catch (error) {
                rooftopMaterial = new THREE.MeshStandardMaterial({
                    color: 0x666666
                });
            }
            
            const rooftop = new THREE.Mesh(rooftopGeometry, rooftopMaterial);
            rooftop.position.set(x, height + 1.5, z);
            rooftop.castShadow = true;
            this.scene.add(rooftop);
        }
    }
    
    createParkBlock(x, z) {
        // Create grass ground for park
        const grassGeometry = new THREE.PlaneGeometry(this.blockSize, this.blockSize);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x2D5016,
            roughness: 0.9
        });
        
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.rotation.x = -Math.PI / 2;
        grass.position.set(x, 0.02, z);
        grass.receiveShadow = true;
        this.scene.add(grass);
        
        // Add park fence
        this.createParkFence(x, z);
        
        // Add trees and flowers
        this.addParkVegetation(x, z);
        
        this.parks.push({ x, z, grass });
    }
    
    createParkFence(x, z) {
        const fenceHeight = 1.5;
        const fenceThickness = 0.1;
        const fenceColor = 0x8B4513; // Brown
        
        const fenceMaterial = new THREE.MeshStandardMaterial({
            color: fenceColor,
            roughness: 0.8
        });
        
        // Create fence around park perimeter
        const halfBlock = this.blockSize / 2;
        const fencePositions = [
            { x: x - halfBlock, z: z, width: fenceThickness, depth: this.blockSize },
            { x: x + halfBlock, z: z, width: fenceThickness, depth: this.blockSize },
            { x: x, z: z - halfBlock, width: this.blockSize, depth: fenceThickness },
            { x: x, z: z + halfBlock, width: this.blockSize, depth: fenceThickness }
        ];
        
        fencePositions.forEach(pos => {
            const fenceGeometry = new THREE.BoxGeometry(pos.width, fenceHeight, pos.depth);
            const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
            fence.position.set(pos.x, fenceHeight / 2, pos.z);
            fence.castShadow = true;
            this.scene.add(fence);
            
            // Add fence physics
            const fenceShape = new CANNON.Box(new CANNON.Vec3(pos.width/2, fenceHeight/2, pos.depth/2));
            const fenceBody = new CANNON.Body({ mass: 0 });
            fenceBody.addShape(fenceShape);
            fenceBody.position.set(pos.x, fenceHeight/2, pos.z);
            this.world.addBody(fenceBody);
        });
    }
    
    addParkVegetation(parkX, parkZ) {
        // Add large trees (enemies will hide here)
        const treeCount = 4 + Math.floor(Math.random() * 4); // 4-8 trees
        
        for (let i = 0; i < treeCount; i++) {
            const offsetX = (Math.random() - 0.5) * (this.blockSize - 5);
            const offsetZ = (Math.random() - 0.5) * (this.blockSize - 5);
            
            this.createLargeTree(parkX + offsetX, parkZ + offsetZ);
        }
        
        // Add flowers
        this.addFlowers(parkX, parkZ);
    }
    
    createLargeTree(x, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 4, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Tree canopy
        const canopyGeometry = new THREE.SphereGeometry(4, 8, 6);
        const canopyMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22,
            roughness: 0.8
        });
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(x, 10, z);
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        this.scene.add(canopy);
        
        // Add tree physics
        const treeShape = new CANNON.Cylinder(0.7, 0.7, 8, 8);
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(x, 4, z);
        this.world.addBody(treeBody);
        
        this.trees.push({ trunk, canopy, x, z });
        
        console.log(`Large tree created at (${x}, ${z})`);
    }
    
    addFlowers(parkX, parkZ) {
        const flowerCount = 10 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < flowerCount; i++) {
            const offsetX = (Math.random() - 0.5) * (this.blockSize - 2);
            const offsetZ = (Math.random() - 0.5) * (this.blockSize - 2);
            
            // Random flower color
            const colors = [0xFF69B4, 0xFF0000, 0xFFFF00, 0x9370DB, 0xFFA500];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            const flowerGeometry = new THREE.SphereGeometry(0.2, 6, 4);
            const flowerMaterial = new THREE.MeshStandardMaterial({ color });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(parkX + offsetX, 0.2, parkZ + offsetZ);
            this.scene.add(flower);
        }
    }
    
    addRoadTrees() {
        console.log("Adding road trees...");
        
        const halfGrid = Math.floor(this.gridSize / 2);
        
        for (let x = -halfGrid; x <= halfGrid; x++) {
            for (let z = -halfGrid; z <= halfGrid; z++) {
                if (this.cityGrid[x][z] === 'road') {
                    this.addTreesAlongRoad(x * this.blockSize, z * this.blockSize);
                }
            }
        }
    }
    
    addTreesAlongRoad(roadX, roadZ) {
        // Add trees on sidewalks (25% chance per position)
        if (Math.random() > 0.75) {
            const positions = [
                { x: roadX - this.blockSize/2 - 2, z: roadZ },
                { x: roadX + this.blockSize/2 + 2, z: roadZ },
                { x: roadX, z: roadZ - this.blockSize/2 - 2 },
                { x: roadX, z: roadZ + this.blockSize/2 + 2 }
            ];
            
            const position = positions[Math.floor(Math.random() * positions.length)];
            this.createStreetTree(position.x, position.z);
        }
    }
    
    createStreetTree(x, z) {
        // Smaller street tree
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 6);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        this.scene.add(trunk);
        
        // Tree canopy
        const canopyGeometry = new THREE.SphereGeometry(2, 6, 4);
        const canopyMaterial = new THREE.MeshStandardMaterial({
            color: 0x32CD32,
            roughness: 0.8
        });
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(x, 5, z);
        canopy.castShadow = true;
        this.scene.add(canopy);
        
        // Add tree physics
        const treeShape = new CANNON.Cylinder(0.3, 0.3, 4, 6);
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(x, 2, z);
        this.world.addBody(treeBody);
    }
    
    createCityBoundaries() {
        console.log("Creating city boundaries...");
        
        const boundaryHeight = 10;
        const boundaryThickness = 2;
        const cityHalf = this.citySize / 2;
        
        const boundaryMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.7
        });
        
        // Create invisible walls at city edges
        const boundaries = [
            { x: cityHalf, z: 0, width: boundaryThickness, depth: this.citySize + 10 },
            { x: -cityHalf, z: 0, width: boundaryThickness, depth: this.citySize + 10 },
            { x: 0, z: cityHalf, width: this.citySize + 10, depth: boundaryThickness },
            { x: 0, z: -cityHalf, width: this.citySize + 10, depth: boundaryThickness }
        ];
        
        boundaries.forEach(boundary => {
            // Visual boundary (optional - can be made invisible)
            const boundaryGeometry = new THREE.BoxGeometry(boundary.width, boundaryHeight, boundary.depth);
            const boundaryMesh = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            boundaryMesh.position.set(boundary.x, boundaryHeight / 2, boundary.z);
            boundaryMesh.visible = false; // Make invisible
            this.scene.add(boundaryMesh);
            
            // Physics boundary
            const boundaryShape = new CANNON.Box(new CANNON.Vec3(boundary.width/2, boundaryHeight/2, boundary.depth/2));
            const boundaryBody = new CANNON.Body({ mass: 0 });
            boundaryBody.addShape(boundaryShape);
            boundaryBody.position.set(boundary.x, boundaryHeight/2, boundary.z);
            this.world.addBody(boundaryBody);
        });
        
        console.log("City boundaries created");
    }
    
    getParkLocations() {
        // Return all park locations for enemy spawning
        return this.parks.map(park => ({ x: park.x, z: park.z }));
    }
    
    getTreeLocations() {
        // Return tree locations in parks for enemy hiding spots
        return this.trees.map(tree => ({ x: tree.x, z: tree.z }));
    }
}

// Make CityGenerator globally available
window.CityGenerator = CityGenerator;
