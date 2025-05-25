class BuildingSystem {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.buildings = [];
        this.textureSystem = new BuildingTextures();
    }
    
    createSkyscrapers() {
        console.log("Creating grounded skyscrapers");
        
        const gridSize = 5;
        const blockSize = 35;
        
        for (let x = -gridSize; x <= gridSize; x++) {
            for (let z = -gridSize; z <= gridSize; z++) {
                // Skip road intersections
                if (this.isRoadIntersection(x, z)) continue;
                
                // Random height > 10 floors
                const floors = Math.floor(Math.random() * 25) + 10; // 10-35 floors
                const height = floors * 3; // 3 units per floor
                
                this.createGroundedBuilding(x * blockSize, height, z * blockSize, floors);
            }
        }
    }
    
    isRoadIntersection(x, z) {
        // Skip road intersections
        if ((x === 0 && Math.abs(z) <= 2) || (z === 0 && Math.abs(x) <= 2)) return true;
        if ((Math.abs(x) === 1 && Math.abs(z) <= 2) || (Math.abs(z) === 1 && Math.abs(x) <= 2)) return true;
        return false;
    }
    
    createGroundedBuilding(x, height, z, floors) {
        const width = Math.random() * 8 + 12; // 12-20 units wide
        const depth = Math.random() * 8 + 12; // 12-20 units deep
        
        // Choose random texture
        const textureTypes = ['windows', 'glass', 'concrete', 'metal'];
        const textureType = textureTypes[Math.floor(Math.random() * textureTypes.length)];
        
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            map: this.textureSystem.getTexture(textureType),
            roughness: textureType === 'glass' ? 0.1 : 0.7,
            metalness: textureType === 'metal' ? 0.8 : 0.1
        });
        
        // Set texture repeat based on floors
        buildingMaterial.map.repeat.set(2, floors / 3);
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        
        // Place building ON the ground (y = height/2 so bottom touches y=0)
        building.position.set(x, height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add static physics body
        this.addBuildingPhysics(x, height, z, width, depth);
        
        // Add building details
        this.addBuildingDetails(x, height, z, width, depth);
        
        console.log(`Created grounded building at (${x}, 0, ${z}) with height ${height}`);
    }
    
    addBuildingPhysics(x, height, z, width, depth) {
        // Create static physics body
        const buildingShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const buildingBody = new CANNON.Body({ 
            mass: 0, // Static body
            material: new CANNON.Material({ friction: 0.5, restitution: 0.1 })
        });
        buildingBody.addShape(buildingShape);
        
        // Position physics body at same location as visual building
        buildingBody.position.set(x, height / 2, z);
        
        this.world.addBody(buildingBody);
    }
    
    addBuildingDetails(x, height, z, width, depth) {
        // Add rooftop details
        if (Math.random() > 0.7) {
            // Add antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
            const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(x, height + 2.5, z);
            antenna.castShadow = true;
            this.scene.add(antenna);
        }
        
        if (Math.random() > 0.8) {
            // Add rooftop structure
            const rooftopGeometry = new THREE.BoxGeometry(width * 0.3, 3, depth * 0.3);
            const rooftopMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x666666,
                map: this.textureSystem.getTexture('concrete')
            });
            const rooftop = new THREE.Mesh(rooftopGeometry, rooftopMaterial);
            rooftop.position.set(x, height + 1.5, z);
            rooftop.castShadow = true;
            this.scene.add(rooftop);
        }
    }
    
    createFloatingBuildings() {
        console.log("Creating floating buildings with ground bases");
        
        const gridSize = 3;
        const blockSize = 45;
        
        for (let x = -gridSize; x <= gridSize; x++) {
            for (let z = -gridSize; z <= gridSize; z++) {
                // Skip center area
                if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue;
                
                // Random chance for floating building
                if (Math.random() > 0.4) {
                    this.createFloatingBuildingSet(x * blockSize, z * blockSize);
                }
            }
        }
    }
    
    createFloatingBuildingSet(x, z) {
        // Create base building (10 floors) - GROUNDED
        const baseHeight = 30; // 10 floors * 3 units
        const baseWidth = Math.random() * 6 + 10;
        const baseDepth = Math.random() * 6 + 10;
        
        const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
        const baseMaterial = new THREE.MeshStandardMaterial({
            map: this.textureSystem.getTexture('windows'),
            roughness: 0.7
        });
        baseMaterial.map.repeat.set(2, 10);
        
        const baseBuilding = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Ground the base building properly
        baseBuilding.position.set(x, baseHeight / 2, z);
        baseBuilding.castShadow = true;
        baseBuilding.receiveShadow = true;
        this.scene.add(baseBuilding);
        
        // Add physics for base - static and grounded
        this.addBuildingPhysics(x, baseHeight, z, baseWidth, baseDepth);
        
        // Create floating section
        this.createFloatingSection(x, z, baseHeight, baseWidth, baseDepth);
        
        this.buildings.push(baseBuilding);
    }
    
    createFloatingSection(baseX, baseZ, baseHeight, baseWidth, baseDepth) {
        const floatHeight = 3; // 1 floor
        const floatWidth = baseWidth * (0.6 + Math.random() * 0.3);
        const floatDepth = baseDepth * (0.6 + Math.random() * 0.3);
        
        // Random position offset for floating part
        const offsetX = (Math.random() - 0.5) * (baseWidth - floatWidth);
        const offsetZ = (Math.random() - 0.5) * (baseDepth - floatDepth);
        
        const floatGeometry = new THREE.BoxGeometry(floatWidth, floatHeight, floatDepth);
        
        // Choose different texture for floating part
        const floatTextureTypes = ['glass', 'metal', 'concrete'];
        const floatTextureType = floatTextureTypes[Math.floor(Math.random() * floatTextureTypes.length)];
        
        const floatMaterial = new THREE.MeshStandardMaterial({
            map: this.textureSystem.getTexture(floatTextureType),
            roughness: floatTextureType === 'glass' ? 0.1 : 0.7,
            metalness: floatTextureType === 'metal' ? 0.8 : 0.1
        });
        
        const floatingBuilding = new THREE.Mesh(floatGeometry, floatMaterial);
        
        // Float above the base building
        const floatY = baseHeight + floatHeight / 2 + 3;
        floatingBuilding.position.set(baseX + offsetX, floatY, baseZ + offsetZ);
        floatingBuilding.castShadow = true;
        floatingBuilding.receiveShadow = true;
        this.scene.add(floatingBuilding);
        
        // Add static physics for floating building
        this.addBuildingPhysics(baseX + offsetX, floatHeight, baseZ + offsetZ, floatWidth, floatDepth);
        
        // Add support structure
        this.addFloatingSupport(baseX, baseHeight, baseZ, baseX + offsetX, floatY - floatHeight/2, baseZ + offsetZ);
        
        this.buildings.push(floatingBuilding);
    }
    
    addFloatingSupport(baseX, baseTop, baseZ, floatX, floatBottom, floatZ) {
        const supportType = Math.random() > 0.5 ? 'beam' : 'pillars';
        
        if (supportType === 'beam') {
            // Energy beam
            const beamHeight = floatBottom - baseTop;
            const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, beamHeight, 8);
            const beamMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                emissive: 0x004444,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.7
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(
                (baseX + floatX) / 2,
                baseTop + beamHeight / 2,
                (baseZ + floatZ) / 2
            );
            this.scene.add(beam);
        } else {
            // Support pillars
            const pillarCount = 2 + Math.floor(Math.random() * 3);
            const pillarHeight = floatBottom - baseTop;
            
            for (let i = 0; i < pillarCount; i++) {
                const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, pillarHeight, 8);
                const pillarMaterial = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
                
                const angle = (i / pillarCount) * Math.PI * 2;
                const radius = 3;
                pillar.position.set(
                    baseX + Math.cos(angle) * radius,
                    baseTop + pillarHeight / 2,
                    baseZ + Math.sin(angle) * radius
                );
                pillar.castShadow = true;
                this.scene.add(pillar);
            }
        }
    }
    
    update(delta) {
        // Animate only floating buildings (not grounded ones)
        this.buildings.forEach((building, index) => {
            if (building.position.y > 30) { // Only floating buildings
                building.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
                building.rotation.y += 0.001;
            }
        });
    }
}

// Make BuildingSystem globally available
window.BuildingSystem = BuildingSystem;
