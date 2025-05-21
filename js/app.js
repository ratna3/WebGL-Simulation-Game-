class Game {
    constructor() {
        console.log("Game constructor called");
        
        // Setup properties
        this.clock = new THREE.Clock();
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.world = null;
        
        this.environment = null;
        this.player = null;
        this.npcManager = null;
        
        this.isGameActive = false;
        this.assetsLoaded = false;
        this.loadingProgress = 0;
        
        // Start initialization
        this.init();
    }
    
    init() {
        console.log("Game initialization started");
        try {
            this.setupThreeJS();
            this.setupPhysics();
            this.setupBasicScene(); // Add a basic scene first
            this.setupEventListeners();
            this.loadingScreen();
            
            // Simulate asset loading
            this.preloadAssets().then(() => {
                this.assetsLoaded = true;
                // Setup actual game world
                this.setupWorld();
                this.animate();
            });
        } catch (err) {
            console.error("Error during game initialization:", err);
        }
    }
    
    setupThreeJS() {
        console.log("Setting up Three.js");
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Gray background instead of black
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 5); // Position it back a bit to see the scene
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupPhysics() {
        console.log("Setting up physics");
        // Create physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Earth gravity
        
        // Configure solver
        this.world.solver.iterations = 10;
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.allowSleep = true;
    }
    
    setupBasicScene() {
        console.log("Setting up basic scene");
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.8
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
        
        // Add ground to physics world
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 }); // mass 0 = static
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
        
        // Add ambient light
        const ambient = new THREE.AmbientLight(0x666666);
        this.scene.add(ambient);
        
        // Add directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        dirLight.shadow.camera.right = 15;
        dirLight.shadow.camera.left = -15;
        dirLight.shadow.camera.top = 15;
        dirLight.shadow.camera.bottom = -15;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);
        
        // Add some cubes to the scene
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        for (let i = 0; i < 10; i++) {
            const boxMaterial = new THREE.MeshStandardMaterial({ 
                color: Math.random() * 0xffffff 
            });
            const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            boxMesh.position.set(
                Math.random() * 20 - 10,
                0.5,
                Math.random() * 20 - 10
            );
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            this.scene.add(boxMesh);
            
            // Add box to physics world
            const boxShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const boxBody = new CANNON.Body({ mass: 1 });
            boxBody.addShape(boxShape);
            boxBody.position.copy(boxMesh.position);
            this.world.addBody(boxBody);
            
            // Store reference to mesh
            boxBody.meshRef = boxMesh;
        }
    }
    
    setupEventListeners() {
        // Handle click on game container to lock pointer
        const gameContainer = document.getElementById('game-container');
        gameContainer.addEventListener('click', () => {
            if (!this.isGameActive && this.assetsLoaded) {
                this.startGame();
            }
        });
        
        // Handle restart button click
        const restartButton = document.getElementById('restart-button');
        restartButton.addEventListener('click', () => {
            location.reload();
        });
        
        // Listen for health updates
        document.addEventListener('healthUpdate', (e) => {
            const healthBar = document.querySelector('.health-value');
            const healthText = document.querySelector('.health-text');
            const percent = (e.detail.current / e.detail.max) * 100;
            
            healthBar.style.width = `${Math.max(0, percent)}%`;
            healthText.textContent = Math.floor(e.detail.current);
            
            // Change color based on health level
            if (percent < 25) {
                healthBar.style.backgroundColor = '#ff0000';
            } else if (percent < 50) {
                healthBar.style.backgroundColor = '#ff7700';
            } else {
                healthBar.style.backgroundColor = '#ff3e3e';
            }
        });
        
        // Listen for ammo updates
        document.addEventListener('ammoUpdate', (e) => {
            const ammoText = document.querySelector('.ammo-count');
            ammoText.textContent = `${e.detail.current}/${e.detail.total}`;
        });
        
        // Listen for weapon reloading
        document.addEventListener('weaponReloading', (e) => {
            const ammoText = document.querySelector('.ammo-count');
            if (e.detail.reloading) {
                ammoText.textContent = 'Reloading...';
            }
        });
        
        // Listen for player death
        document.addEventListener('playerDied', () => {
            const gameOverScreen = document.getElementById('game-over');
            Utils.showElement(gameOverScreen);
            this.isGameActive = false;
        });
    }
    
    loadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'flex';
        
        // Simulate loading progress
        const progressBar = document.querySelector('.progress-value');
        const progressInterval = setInterval(() => {
            if (this.loadingProgress < 100) {
                this.loadingProgress += 1;
                progressBar.style.width = `${this.loadingProgress}%`;
            } else {
                clearInterval(progressInterval);
                const loadingText = document.querySelector('.loading-text');
                loadingText.textContent = 'Click anywhere to start';
            }
        }, 50);
    }
    
    preloadAssets() {
        return new Promise((resolve) => {
            // In a real game, you'd load all your assets here
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }
    
    startGame() {
        console.log("Starting game");
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'none';
        
        this.isGameActive = true;
        
        if (this.player && this.player.controls) {
            console.log("Locking controls");
            this.player.controls.lock();
        } else {
            console.error("Player or controls not initialized properly");
        }
    }
    
    setupWorld() {
        console.log("Setting up game world");
        
        try {
            // Create player
            this.player = new Player(this.camera, this.scene, this.world);
            console.log("Player created successfully");
            
            // Create a simple weapon for the player manually
            this.setupSimpleWeapon();
            
            // For now, skip environment and NPCs to simplify debugging
            // We'll add them later once basic functionality works
            
            // Update health UI
            document.dispatchEvent(new CustomEvent('healthUpdate', {
                detail: { current: this.player.health, max: this.player.maxHealth }
            }));
            
            // Make player globally accessible for debugging
            window.gamePlayer = this.player;
            
        } catch (error) {
            console.error("Error setting up world:", error);
        }
    }
    
    setupSimpleWeapon() {
        // Create a simple weapon for testing
        if (!this.player) return;
        
        try {
            // Create a simple gun
            const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3);
            const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const gunMesh = new THREE.Mesh(gunGeometry, gunMaterial);
            
            // Position it in first-person view
            gunMesh.position.set(0.2, -0.2, -0.5);
            this.camera.add(gunMesh);
            
            // Create a simple weapon object
            this.player.currentWeapon = {
                name: "Debug Pistol",
                damage: 10,
                range: 50,
                fireRate: 2,
                ammoPerClip: 10,
                totalAmmo: 50,
                currentAmmo: 10,
                mesh: gunMesh,
                fire: () => {
                    console.log("Weapon fired");
                    return { hit: false };
                },
                reload: () => {
                    console.log("Weapon reloaded");
                },
                update: () => {}
            };
            
            this.player.weapons = [this.player.currentWeapon];
            
            // Update ammo display
            document.dispatchEvent(new CustomEvent('ammoUpdate', {
                detail: { current: 10, total: 50 }
            }));
            
            console.log("Simple weapon created");
            
        } catch (error) {
            console.error("Error creating simple weapon:", error);
        }
    }
    
    update() {
        try {
            const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta time
            
            // Step physics world
            this.world.step(1/60, delta, 3);
            
            // Update physics objects
            this.world.bodies.forEach(body => {
                if (body.meshRef) {
                    body.meshRef.position.copy(body.position);
                    body.meshRef.quaternion.copy(body.quaternion);
                }
            });
            
            // Update player
            if (this.player) {
                this.player.update(delta);
            }
        } catch (error) {
            console.error("Error in update:", error);
        }
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isGameActive) {
            this.update();
        }
        
        this.render();
    }
}

// Make Game class globally available
window.Game = Game;

// Initialize the game when the window loads
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, waiting for Three.js to be ready");
    // Check if THREE is available at regular intervals
    const checkThree = setInterval(function() {
        if (typeof THREE !== 'undefined') {
            console.log("THREE is ready, initializing game");
            clearInterval(checkThree);
            const game = new Game();
        }
    }, 100);
});
