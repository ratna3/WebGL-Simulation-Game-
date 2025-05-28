class Game {
    constructor() {
        debugLog("Game constructor called");
        
        // Core components
        this.clock = new THREE.Clock();
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.world = null;
        
        // Game elements
        this.environment = null;
        this.player = null;
        this.npcManager = null;
        this.dialogueSystem = null;
        this.missionManager = null;
        this.bulletSystem = null; // Add bullet system
        
        // Game state
        this.isGameActive = false;
        
        // Player health system
        this.playerHealth = 100;
        this.maxPlayerHealth = 100;
        
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
            
            // Initialize bullet system with error handling
            try {
                if (typeof BulletSystem !== 'undefined') {
                    this.bulletSystem = new BulletSystem(this.scene, this.world);
                    debugLog("Bullet system initialized successfully");
                } else {
                    console.error("BulletSystem class not available - check if bulletSystem.js loaded");
                    throw new Error("BulletSystem class not found");
                }
            } catch (bulletError) {
                console.error("Failed to initialize bullet system:", bulletError);
                // Create a dummy bullet system to prevent crashes
                this.bulletSystem = {
                    createBullet: () => {
                        console.warn("Dummy bullet system - bullets disabled");
                        return null;
                    },
                    update: () => {},
                    cleanup: () => {}
                };
            }
            
            // Initialize mission manager
            if (typeof MissionManager !== 'undefined') {
                this.missionManager = new MissionManager(this);
                debugLog("Mission manager initialized");
            } else {
                console.error("MissionManager class not available");
            }
            
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
            // Create physics world with better settings
            this.world = new CANNON.World();
            this.world.gravity.set(0, -9.8, 0);
            
            // Better solver configuration
            this.world.solver.iterations = 15;
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.world.allowSleep = true;
            
            // Set default contact material for better stability
            const defaultMaterial = new CANNON.Material('default');
            const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
                friction: 0.3,
                restitution: 0.0,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            });
            this.world.addContactMaterial(defaultContactMaterial);
            this.world.defaultContactMaterial = defaultContactMaterial;
            
        } catch (error) {
            debugLog(`ERROR: Physics setup failed: ${error.message}`);
            throw new Error(`Failed to initialize physics: ${error.message}`);
        }
    }
    
    setupBasicEnvironment() {
        try {
            // Set sky color
            this.scene.background = new THREE.Color(0x87CEEB);
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
            this.scene.add(ambientLight);
            
            // Add directional light (sun)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 100, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 200;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
            this.scene.add(directionalLight);
            
            // Add secondary light for better illumination
            const secondaryLight = new THREE.DirectionalLight(0x6677aa, 0.3);
            secondaryLight.position.set(-30, 50, -30);
            this.scene.add(secondaryLight);
            
            // Create complete city environment
            this.environment = new Environment(this.scene, this.world);
            this.environment.init();
            
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
            
            // Initialize dialogue system
            this.setupDialogueSystem();
            
            // Initialize NPC manager and spawn undercover NPCs
            this.setupNPCs();
            
            // Don't immediately request pointer lock - let user click first
            console.log("Game started - click in the game area to enable mouse look");
            
            // Show mission briefing
            this.showMissionBriefing();
            
        } catch (error) {
            console.error("Error starting game:", error);
            showError(`Failed to start game: ${error.message}`);
        }
    }
    
    setupDialogueSystem() {
        try {
            this.dialogueSystem = new DialogueSystem();
            console.log("Dialogue system initialized");
        } catch (error) {
            console.error("Error setting up dialogue system:", error);
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
            // Check if NPCManager is available
            if (typeof NPCManager === 'undefined') {
                console.error("NPCManager class not loaded");
                throw new Error("NPCManager class not available - check if npc.js loaded correctly");
            }
            
            // Create NPC manager
            this.npcManager = new NPCManager(this.scene, this.world);
            console.log("NPC Manager created successfully");
            
            // Spawn undercover mission NPCs
            this.npcManager.spawnUndercoverNPCs();
            console.log("Undercover NPCs spawned");
            
            // Spawn enemies in parks near trees
            const enemyCount = this.npcManager.spawnEnemiesInParks();
            console.log(`${enemyCount} enemies spawned in parks`);
            
            console.log("City NPCs and enemies initialized");
        } catch (error) {
            console.error("Error setting up NPCs:", error);
            throw error; // Re-throw to handle in startGame
        }
    }
    
    restartMission() {
        // Reset player health
        this.playerHealth = this.maxPlayerHealth;
        this.updateHealthBar();
        
        // Clean up bullet system
        if (this.bulletSystem) {
            this.bulletSystem.cleanup();
        }
        
        // Reset mission state
        this.missionManager = new MissionManager(this);
        
        // Clear existing NPCs and enemies
        this.npcManager.npcs.forEach(npc => {
            if (npc.body) this.world.removeBody(npc.body);
            if (npc.group) this.scene.remove(npc.group);
        });
        this.npcManager.enemies.forEach(enemy => {
            if (enemy.body) this.world.removeBody(enemy.body);
            if (enemy.group) this.scene.remove(enemy.group);
        });
        
        // Reset arrays
        this.npcManager.npcs = [];
        this.npcManager.enemies = [];
        
        // Respawn
        this.setupNPCs();
        
        // Reset player position and state
        if (this.player) {
            this.player.body.position.set(0, 5, 0);
            this.player.body.velocity.set(0, 0, 0);
        }
        
        this.isGameActive = true;
        console.log("Mission restarted");
    }
    
    showMissionBriefing() {
        // Get agent name from the naming screen
        const agentName = window.getAgentName ? window.getAgentName() : "Agent Smith";
        
        // Create mission briefing overlay
        const briefing = document.createElement('div');
        briefing.id = 'mission-briefing';
        briefing.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 200;
            font-family: 'Courier New', monospace;
        `;
        
        briefing.innerHTML = `
            <div style="max-width: 700px; text-align: center; padding: 20px;">
                <h1 style="color: #ff3e3e; margin-bottom: 30px;">MISSION BRIEFING</h1>
                <h2 style="margin-bottom: 20px;">Operation: Undercover Agent</h2>
                
                <div style="text-align: left; margin-bottom: 30px; line-height: 1.6;">
                    <p><strong>${agentName},</strong></p>
                    <p>You are tasked with infiltrating a criminal organization. Use dialogue to gather intel, but be prepared to defend yourself.</p>
                    
                    <p><strong>Objectives:</strong></p>
                    <ul>
                        <li>Gather intelligence from criminal contacts</li>
                        <li>Maintain your cover identity as ${agentName}</li>
                        <li>Eliminate hostile targets when discovered</li>
                        <li>Avoid civilian casualties</li>
                    </ul>
                    
                    <p><strong>Key Personnel:</strong></p>
                    <ul>
                        <li><span style="color: #ff4444;">Criminals</span> - Your targets, gather intel or eliminate</li>
                        <li><span style="color: #4444ff;">Police</span> - Avoid suspicion, maintain cover</li>
                        <li><span style="color: #888888;">Civilians</span> - Innocent bystanders, do not harm</li>
                        <li><span style="color: #ff6600;">REPO Units</span> - Highly dangerous, eliminate on sight</li>
                    </ul>
                    
                    <p><strong>Controls:</strong></p>
                    <ul>
                        <li>WASD - Move around</li>
                        <li>Mouse - Look around</li>
                        <li>E - Interact with people</li>
                        <li>Tab - Equip/Holster weapon</li>
                        <li>Left Click - Shoot (when weapon equipped)</li>
                        <li>R - Reload weapon</li>
                    </ul>
                    
                    <p><strong>WARNING:</strong> Using your weapon will blow your cover. Use it only when necessary!</p>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #ff3e3e; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer;">
                    BEGIN MISSION
                </button>
            </div>
        `;
        
        document.body.appendChild(briefing);
        
        console.log(`Mission Controls: WASD to move, E to interact, Tab for weapon, Left Click to shoot`);
        console.log(`Your cover identity: ${agentName} working undercover`);
        console.log("Weapon is initially holstered - press Tab to equip when needed");
    }
    
    showGameOverScreen() {
        const agentName = window.getAgentName ? window.getAgentName() : "Agent Smith";
        
        const gameOverOverlay = document.createElement('div');
        gameOverOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        gameOverOverlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <h1 style="color: #ff0000; font-size: 64px; margin-bottom: 20px; text-shadow: 0 0 20px #ff0000;">
                    MISSION FAILED
                </h1>
                
                <h2 style="color: #ff3e3e; font-size: 32px; margin-bottom: 30px;">
                    Agent ${agentName} - K.I.A.
                </h2>
                
                <p style="font-size: 18px; margin-bottom: 30px; color: #ccc;">
                    ${agentName} was eliminated by REPO forces.<br>
                    The criminal organization remains active.
                </p>
                
                <button onclick="this.restartGame()" 
                        style="background: #ff3e3e; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer; margin-right: 15px;">
                    RETRY MISSION
                </button>
                
                <button onclick="window.location.reload()" 
                        style="background: #666; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer;">
                    NEW AGENT
                </button>
            </div>
        `;
        
        // Add restart functionality
        gameOverOverlay.querySelector('button').onclick = () => {
            document.body.removeChild(gameOverOverlay);
            this.restartMission();
        };
        
        document.body.appendChild(gameOverOverlay);
    }
    
    update() {
        try {
            // Get delta time
            const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent large jumps
            
            // Update physics
            if (this.world) {
                this.world.step(1/60, delta, 3);
            }
            
            // Update bullet system with error handling
            if (this.bulletSystem && typeof this.bulletSystem.update === 'function') {
                try {
                    this.bulletSystem.update(delta);
                } catch (bulletError) {
                    console.error("Bullet system update error:", bulletError);
                }
            }
            
            // Update environment
            if (this.environment) {
                this.environment.update(delta);
            }
            
            // Update player
            if (this.isGameActive && this.player) {
                this.player.update(delta);
            }
            
            // Update NPCs and enemies with error handling
            if (this.npcManager && this.player && this.player.body) {
                try {
                    const playerPosition = this.player.body.position;
                    this.npcManager.update(playerPosition, delta);
                } catch (npcError) {
                    console.error("NPC update error:", npcError);
                }
            }
        } catch (error) {
            console.error("Error in game update:", error);
        }
    }
    
    playerTakeDamage(damage) {
        if (this.playerHealth <= 0) return; // Already dead
        
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        console.log(`Player takes ${damage} damage. Health: ${this.playerHealth}/${this.maxPlayerHealth}`);
        
        // Update health bar UI
        this.updateHealthBar();
        
        // Screen flash effect for damage
        this.createDamageEffect();
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    updateHealthBar() {
        const healthBar = document.querySelector('.health-value');
        const healthText = document.querySelector('.health-text');
        
        if (healthBar && healthText) {
            const healthPercent = (this.playerHealth / this.maxPlayerHealth) * 100;
            healthBar.style.width = `${healthPercent}%`;
            healthText.textContent = `${this.playerHealth}`;
            
            // Change color based on health level
            if (healthPercent > 60) {
                healthBar.style.backgroundColor = '#ff3e3e'; // Red
            } else if (healthPercent > 30) {
                healthBar.style.backgroundColor = '#ff8800'; // Orange
            } else {
                healthBar.style.backgroundColor = '#ff0000'; // Dark red
            }
        }
    }
    
    createDamageEffect() {
        // Create red screen flash effect
        const damageOverlay = document.createElement('div');
        damageOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            pointer-events: none;
            z-index: 200;
            animation: damageFlash 0.3s ease-out;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageFlash {
                0% { opacity: 0.6; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(damageOverlay);
        
        // Remove overlay after animation
        setTimeout(() => {
            document.body.removeChild(damageOverlay);
        }, 300);
    }
    
    gameOver() {
        console.log("Game Over - Player died!");
        this.isGameActive = false;
        
        // Show game over screen
        this.showGameOverScreen();
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
