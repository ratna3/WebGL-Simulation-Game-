class Environment {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
    }
    
    init() {
        try {
            console.log("Initializing environment");
            this.createSky();
            this.createGround();
            this.createObstacles();
            return true;
        } catch (error) {
            console.error("Error initializing environment:", error);
            return false;
        }
    }
    
    createSky() {
        // Create sky using utility function
        Utils.createSkyBox(this.scene);
    }
    
    createGround() {
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 0.8
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
    }
    
    createObstacles() {
        // Create some basic obstacles
        for (let i = 0; i < 20; i++) {
            // Random position
            const x = Math.random() * 40 - 20;
            const z = Math.random() * 40 - 20;
            
            // Random size
            const width = Math.random() * 2 + 0.5;
            const height = Math.random() * 4 + 1;
            const depth = Math.random() * 2 + 0.5;
            
            // Create box
            const boxGeometry = new THREE.BoxGeometry(width, height, depth);
            const boxMaterial = new THREE.MeshStandardMaterial({
                color: Math.random() * 0xffffff
            });
            const box = new THREE.Mesh(boxGeometry, boxMaterial);
            
            // Position box
            box.position.set(x, height/2, z);
            box.castShadow = true;
            box.receiveShadow = true;
            
            this.scene.add(box);
            
            // Add physics
            const boxShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
            const boxBody = new CANNON.Body({ mass: 0 });
            boxBody.addShape(boxShape);
            boxBody.position.set(x, height/2, z);
            
            this.world.addBody(boxBody);
        }
    }
    
    update(delta) {
        // Nothing to update in basic environment
    }
}

// Make Environment class globally available
window.Environment = Environment;
