class Environment {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // Simple environment parameters
        this.floorSize = 100;
    }
    
    init() {
        this.createFloor();
        this.createObstacles();
        this.addLighting();
    }
    
    createFloor() {
        // Create a large floor
        const floorGeometry = new THREE.PlaneGeometry(this.floorSize, this.floorSize);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.8
        });
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Create physics for the floor
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 });
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(floorBody);
    }
    
    createObstacles() {
        // Create some simple obstacle boxes
        for (let i = 0; i < 20; i++) {
            this.createBox(
                Math.random() * 40 - 20, // x
                1, // y
                Math.random() * 40 - 20, // z
                Math.random() * 2 + 1, // width
                Math.random() * 3 + 1, // height
                Math.random() * 2 + 1, // depth
                0x777777 // color
            );
        }
    }
    
    createBox(x, y, z, width, height, depth, color) {
        // Create visual box
        const boxGeometry = new THREE.BoxGeometry(width, height, depth);
        const boxMaterial = new THREE.MeshStandardMaterial({ color });
        const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
        
        boxMesh.position.set(x, y + height/2, z);
        boxMesh.castShadow = true;
        boxMesh.receiveShadow = true;
        this.scene.add(boxMesh);
        
        // Create physics body
        const boxShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const boxBody = new CANNON.Body({ mass: 0 }); // Static body
        boxBody.addShape(boxShape);
        boxBody.position.set(x, y + height/2, z);
        this.world.addBody(boxBody);
        
        return { mesh: boxMesh, body: boxBody };
    }
    
    addLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        
        // Configure shadow camera
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        
        // High resolution shadows
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        
        this.scene.add(directionalLight);
    }
    
    update() {
        // Will be used for any dynamic environment updates
    }
}

// Make Environment class globally available
window.Environment = Environment;
