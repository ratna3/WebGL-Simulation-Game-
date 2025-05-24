class Game {
    constructor() {
        debugLog("Game constructor called");
        
        // Core components
        this.clock = new THREE.Clock();
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.world = null; // Physics world
        
        // Game elements
        this.environment = null;
        this.player = null;
        this.npcManager = null; // Add NPC manager
        
        // Game state
        this.isGameActive = false;
        this._groundCreated = false;
        
        // Initialize the game
        this.init();
    }
    
    init() {
        try {
            debugLog("Game initialization started");
            
            this.setupThreeJS();
            debugLog("Three.js setup complete");
            
            this.setupPhysics();
            debugLog("Physics setup complete");
            
            this.setupBasicEnvironment();
            debugLog("Basic environment setup complete");
            
            // Make instance globally available
            window.game = this;
            
            return true;
        } catch (error) {
            debugLog(`ERROR: Game initialization failed: ${error.message}`);
            showError("Game initialization failed");
            console.error(error);
            return false;
        }
    }
    
    setupThreeJS() {
        try {
            // Create scene
            this.scene = new THREE.Scene();
            
            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = true;
            document.getElementById('game-container').appendChild(this.renderer.domElement);
            
            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75, 
                window.innerWidth / window.innerHeight, 
                0.1, 
                1000
            );
            this.camera.position.set(0, 2, 5);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });
            
            // Start animation loop
            this.animate();
        } catch (error) {
            debugLog(`ERROR: Three.js setup failed: ${error.message}`);
            throw new Error(`Failed to initialize Three.js: ${error.message}`);
        }
    }
    
    setupPhysics() {
        try {
            // Create physics world
            this.world = new CANNON.World();
            this.world.gravity.set(0, -9.8, 0); // Earth gravity
            
            // Configure solver
            this.world.solver.iterations = 10;
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.world.allowSleep = true;
            
            // Add ground plane
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0 }); // Static body
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.addBody(groundBody);
        } catch (error) {
            debugLog(`ERROR: Physics setup failed: ${error.message}`);
            throw new Error(`Failed to initialize physics: ${error.message}`);
        }
    }
    
    setupBasicEnvironment() {
        try {
            // Set sky color
            this.scene.background = new THREE.Color(0x87CEEB);
            
            // Create ground plane
            const planeGeometry = new THREE.PlaneGeometry(100, 100);
            const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x336633 });
            const plane = new THREE.Mesh(planeGeometry, planeMaterial);
            plane.rotation.x = -Math.PI / 2;
            plane.receiveShadow = true;
            this.scene.add(plane);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x666666);
            this.scene.add(ambientLight);
            
            // Add directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            this.scene.add(directionalLight);
            
            // Add some boxes for testing
            for (let i = 0; i < 10; i++) {
                const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
                const boxMaterial = new THREE.MeshStandardMaterial({
                    color: Math.random() * 0xffffff
                });
                const box = new THREE.Mesh(boxGeometry, boxMaterial);
                box.position.set(
                    Math.random() * 20 - 10,
                    0.5,
                    Math.random() * 20 - 10
                );
                box.castShadow = true;
                box.receiveShadow = true;
                this.scene.add(box);
            }
        } catch (error) {
            debugLog(`ERROR: Environment setup failed: ${error.message}`);
            throw new Error(`Failed to set up environment: ${error.message}`);
        }
    }
    
    startGame() {
        console.log("Game.startGame() called");
        try {
            // Hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            
            this.isGameActive = true;
            
            // Create player
            this.setupPlayer();
            
            // Create ground if not already present
            this.createBasicGround();
            
            // Initialize NPC manager and spawn enemy
            this.setupNPCs();
            
            // Lock pointer for first person controls
            if (this.player && this.player.controls) {
                if (typeof this.player.controls.lock === 'function') {
                    console.log("Requesting pointer lock");
                    this.player.controls.lock();
                } else {
                    console.error("Player controls lock function not available");
                }
            } else {
                console.error("Player not properly initialized");
            }
            
            // Show controls help
            console.log("Movement Controls: WASD to move, Space to jump, Shift to sprint");
            console.log("A REPO enemy has been spawned nearby!");
        } catch (error) {
            console.error("Error starting game:", error);
        }
    }
    
    setupPlayer() {
        try {
            // Create player
            this.player = new Player(this.camera, this.scene, this.world);
            
            // Set initial camera position
            this.camera.position.set(0, 2, 5);
            
            console.log("Player setup complete");
        } catch (error) {
            console.error("Error setting up player:", error);
        }
    }
    
    setupNPCs() {
        try {
            // Create NPC manager
            this.npcManager = new NPCManager(this.scene, this.world);
            
            // Spawn one REPO enemy
            this.npcManager.spawnEnemy();
            
            console.log("NPCs and enemies initialized");
        } catch (error) {
            console.error("Error setting up NPCs:", error);
        }
    }
    
    createBasicGround() {
        // Only create if not already present
        if (!this._groundCreated) {
            // Create a simple ground plane
            const groundGeometry = new THREE.PlaneGeometry(100, 100);
            const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Add to physics world if not already
            const groundShape = new CANNON.Plane();
            const groundBody = new CANNON.Body({ mass: 0 }); // Static body
            groundBody.addShape(groundShape);
            groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.addBody(groundBody);
            
            this._groundCreated = true;
            console.log("Basic ground created");
        }
    }
    
    update() {
        try {
            // Get delta time
            const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent large jumps
            
            // Update physics
            if (this.world) {
                this.world.step(1/60, delta, 3);
            }
            
            // Update player
            if (this.isGameActive && this.player) {
                this.player.update(delta);
            }
            
            // Update NPCs and enemies
            if (this.npcManager && this.player && this.player.body) {
                const playerPosition = this.player.body.position;
                this.npcManager.update(playerPosition, delta);
            }
        } catch (error) {
            console.error("Error in game update:", error);
        }
    }
    
    render() {
        try {
            // Render scene
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            debugLog(`ERROR: Render error: ${error.message}`);
        }
    }
    
    animate() {
        // Request next frame
        requestAnimationFrame(() => this.animate());
        
        // Update game state
        this.update();
        
        // Render frame
        this.render();
    }
}

// Create game instance when this script loads
debugLog("Creating game instance");
window.game = new Game();
