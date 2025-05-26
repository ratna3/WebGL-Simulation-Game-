// Remove the import that's causing conflicts
// import Game from '../core/Game.js';

class Game {
    constructor() {
        console.log("Game constructor called");
        
        // Core properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        
        // Game objects
        this.player = null;
        this.environment = null;
        this.npcManager = null;
        this.dialogueSystem = null;
        this.missionManager = null;
        
        // Game state
        this.isGameActive = false;
        this.gameStarted = false;
        
        // Performance tracking
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        
        // Initialize immediately
        this.init();
    }
    
    init() {
        try {
            console.log("Initializing game...");
            
            // Initialize core components
            this.initScene();
            this.setupPhysics();
            this.setupLighting();
            this.setupRenderer();
            
            console.log("Game initialized successfully - ready to start");
        } catch (error) {
            console.error("Game initialization failed:", error);
            this.showError("Game initialization failed: " + error.message);
        }
    }
    
    initScene() {
        console.log("Initializing scene...");
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );
        
        console.log("Scene and camera created");
    }
    
    setupPhysics() {
        try {
            console.log("Setting up physics world...");
            
            if (typeof CANNON === 'undefined') {
                throw new Error("CANNON is not defined");
            }
            
            // Create physics world
            this.world = new CANNON.World();
            this.world.gravity.set(0, -20, 0); // Gravity
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.world.solver.iterations = 10;
            
            console.log("Physics world created successfully");
        } catch (error) {
            console.error("Error setting up physics:", error);
            throw new Error("Failed to initialize physics: " + error.message);
        }
    }
    
    setupLighting() {
        console.log("Setting up lighting...");
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        console.log("Lighting setup complete");
    }
    
    setupRenderer() {
        console.log("Setting up renderer...");
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add to DOM
        document.body.appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log("Renderer setup complete");
    }
    
    startGame() {
        try {
            console.log("Starting game...");
            
            if (this.gameStarted) {
                console.log("Game already started");
                return;
            }
            
            // Initialize game systems
            this.setupEnvironment();
            this.setupPlayer();
            this.setupDialogueSystem();
            this.setupMissionManager();
            this.setupNPCs();
            
            // Mark game as active
            this.isGameActive = true;
            this.gameStarted = true;
            
            // Start game loop
            this.animate();
            
            // Dispatch game started event
            window.dispatchEvent(new CustomEvent('gameStarted'));
            
            console.log("Game started successfully!");
            
        } catch (error) {
            console.error("Error starting game:", error);
            this.showError("Failed to start game: " + error.message);
        }
    }
    
    setupEnvironment() {
        console.log("Setting up environment...");
        
        try {
            this.environment = new Environment(this.scene, this.world);
            this.environment.init();
            
            // Force environment creation if it didn't work
            if (this.environment.getBuildingCount() === 0) {
                console.warn("No buildings detected, forcing fallback environment creation");
                this.environment.generateFallbackEnvironment();
            }
            
            console.log("Environment setup complete with:", {
                buildings: this.environment.getBuildingCount(),
                trees: this.environment.getTreeCount(),
                roads: this.environment.getRoadCount()
            });
        } catch (error) {
            console.error("Error setting up environment:", error);
            // Create minimal fallback environment
            this.createMinimalEnvironment();
        }
    }
    
    createMinimalEnvironment() {
        console.log("Creating minimal fallback environment...");
        
        try {
            // Create simple ground
            const groundGeometry = new THREE.PlaneGeometry(200, 200);
            const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);
            
            // Create simple buildings
            const buildingPositions = [
                { x: 20, z: 20 }, { x: -20, z: 20 }, { x: 20, z: -20 }, { x: -20, z: -20 },
                { x: 40, z: 0 }, { x: -40, z: 0 }, { x: 0, z: 40 }, { x: 0, z: -40 }
            ];
            
            buildingPositions.forEach((pos, i) => {
                const height = 15 + Math.random() * 20;
                const width = 8 + Math.random() * 6;
                const depth = 8 + Math.random() * 6;
                
                const geometry = new THREE.BoxGeometry(width, height, depth);
                const material = new THREE.MeshStandardMaterial({ 
                    color: new THREE.Color().setHSL(0.1, 0.2, 0.3 + Math.random() * 0.4)
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
                body.position.set(pos.x, height / 2, pos.z);
                this.world.addBody(body);
                
                console.log(`Created minimal building ${i + 1} at (${pos.x}, ${pos.z})`);
            });
            
            // Create simple trees
            const treePositions = [
                { x: 10, z: 10 }, { x: -10, z: 10 }, { x: 10, z: -10 }, { x: -10, z: -10 },
                { x: 30, z: 15 }, { x: -30, z: 15 }, { x: 15, z: 30 }, { x: -15, z: 30 }
            ];
            
            treePositions.forEach((pos, i) => {
                const treeGroup = new THREE.Group();
                
                // Trunk
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.5, 0.6, 4, 8),
                    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
                );
                trunk.position.y = 2;
                trunk.castShadow = true;
                treeGroup.add(trunk);
                
                // Leaves
                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(2.5, 8, 6),
                    new THREE.MeshStandardMaterial({ color: 0x228B22 })
                );
                leaves.position.y = 5;
                leaves.castShadow = true;
                treeGroup.add(leaves);
                
                treeGroup.position.set(pos.x, 0, pos.z);
                this.scene.add(treeGroup);
                
                console.log(`Created minimal tree ${i + 1} at (${pos.x}, ${pos.z})`);
            });
            
            console.log("Minimal environment created successfully");
            
        } catch (error) {
            console.error("Error creating minimal environment:", error);
        }
    }

    setupNPCs() {
        console.log("Setting up NPCs...");
        
        try {
            this.npcManager = new NPCManager(this.scene, this.world);
            
            // Spawn NPCs
            this.npcManager.spawnCityNPCs();
            
            // Force NPC creation if none were spawned
            if (this.npcManager.npcs.length === 0) {
                console.warn("No NPCs spawned, creating manual NPCs");
                this.createManualNPCs();
            }
            
            // Spawn enemies
            const enemyCount = this.npcManager.spawnEnemiesInParks();
            
            // Force enemy creation if none were spawned
            if (enemyCount === 0) {
                console.warn("No enemies spawned, creating manual enemies");
                this.createManualEnemies();
            }
            
            console.log("NPCs setup complete with:", {
                npcs: this.npcManager.npcs.length,
                enemies: this.npcManager.enemies.length
            });
        } catch (error) {
            console.error("Error setting up NPCs:", error);
            this.createManualNPCs();
        }
    }
    
    createManualNPCs() {
        try {
            if (!this.npcManager) {
                this.npcManager = new NPCManager(this.scene, this.world);
            }
            
            const npcPositions = [
                { x: 15, z: 5 }, { x: -15, z: 5 }, { x: 5, z: 15 }, { x: -5, z: -15 },
                { x: 25, z: -10 }, { x: -25, z: 10 }, { x: 35, z: 20 }, { x: -35, z: -20 }
            ];
            
            npcPositions.forEach((pos, i) => {
                try {
                    const npc = this.npcManager.createNPC('civilian');
                    if (npc) {
                        // Override position
                        npc.body.position.set(pos.x, 2, pos.z);
                        npc.mesh.position.set(pos.x, 0.5, pos.z);
                        this.npcManager.npcs.push(npc);
                        console.log(`Created manual NPC ${i + 1} at (${pos.x}, ${pos.z})`);
                    }
                } catch (error) {
                    console.error(`Error creating manual NPC ${i + 1}:`, error);
                }
            });
            
        } catch (error) {
            console.error("Error creating manual NPCs:", error);
        }
    }
    
    createManualEnemies() {
        try {
            if (!this.npcManager) {
                this.npcManager = new NPCManager(this.scene, this.world);
            }
            
            const enemyPositions = [
                { x: 50, z: 50 }, { x: -50, z: 50 }, { x: 50, z: -50 }, { x: -50, z: -50 }
            ];
            
            enemyPositions.forEach((pos, i) => {
                try {
                    const enemy = this.npcManager.createEnemy(pos);
                    if (enemy) {
                        this.npcManager.enemies.push(enemy);
                        console.log(`Created manual enemy ${i + 1} at (${pos.x}, ${pos.z})`);
                    }
                } catch (error) {
                    console.error(`Error creating manual enemy ${i + 1}:`, error);
                }
            });
            
        } catch (error) {
            console.error("Error creating manual enemies:", error);
        }
    }
    
    animate() {
        if (!this.isGameActive) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        try {
            // Update physics
            if (this.world && typeof this.world.step === 'function') {
                this.world.step(1/60, delta, 3);
            }
            
            // Update player
            if (this.player) {
                this.player.update(delta);
            }
            
            // Update NPCs
            if (this.npcManager && this.player && this.player.body) {
                const playerPos = this.player.body.position;
                this.npcManager.update(playerPos, delta);
            }
            
            // Render scene
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
            
        } catch (error) {
            console.error("Error in game loop:", error);
        }
    }
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    showError(message) {
        console.error(message);
        
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        // Also show in alert as fallback
        alert("Game Error: " + message);
    }
    
    playerTakeDamage(damage) {
        if (this.player) {
            this.player.health = Math.max(0, this.player.health - damage);
            console.log(`Player took ${damage} damage. Health: ${this.player.health}`);
            
            // Update health display
            this.updateHealthDisplay();
            
            // Check if player died
            if (this.player.health <= 0) {
                this.gameOver();
            }
        }
    }
    
    updateHealthDisplay() {
        const healthValue = document.querySelector('.health-value');
        const healthText = document.querySelector('.health-text');
        
        if (healthValue && this.player) {
            const healthPercent = (this.player.health / this.player.maxHealth) * 100;
            healthValue.style.width = healthPercent + '%';
            
            // Change color based on health
            if (healthPercent > 60) {
                healthValue.style.backgroundColor = '#ff3e3e';
            } else if (healthPercent > 30) {
                healthValue.style.backgroundColor = '#ff9900';
            } else {
                healthValue.style.backgroundColor = '#ff0000';
            }
        }
        
        if (healthText && this.player) {
            healthText.textContent = Math.round(this.player.health);
        }
    }
    
    gameOver() {
        console.log("Game Over!");
        this.isGameActive = false;
        
        // Show game over screen
        const gameOverScreen = document.createElement('div');
        gameOverScreen.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.8); display: flex; flex-direction: column; 
                        justify-content: center; align-items: center; z-index: 1000; 
                        font-family: Arial, sans-serif;">
                <h1 style="color: #ff3e3e; font-size: 48px; margin-bottom: 20px;">MISSION FAILED</h1>
                <p style="color: white; font-size: 18px; margin-bottom: 30px;">Agent down. Cover blown.</p>
                <button onclick="window.location.reload()" 
                        style="background: #ff3e3e; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer;">
                    RESTART MISSION
                </button>
            </div>
        `;
        document.body.appendChild(gameOverScreen);
    }
}

// Create game instance when this script loads
console.log("Creating game instance...");
window.game = new Game();
console.log("App.js loaded successfully");
