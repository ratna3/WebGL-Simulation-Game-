class BuildingTextures {
    constructor() {
        this.textures = {};
        this.isInitialized = false;
        this.loader = new THREE.TextureLoader();
        console.log("BuildingTextures constructor called");
        this.createAllTextures();
    }
    
    createAllTextures() {
        try {
            console.log("Creating building textures...");
            
            // Create textures synchronously to ensure they're available immediately
            this.textures = {
                glass: this.createGlassTexture(),
                concrete: this.createConcreteTexture(),
                metal: this.createMetalTexture(),
                windows: this.createWindowsTexture(),
                road: this.createRoadTexture()
            };
            
            // Ensure all textures are properly configured
            Object.keys(this.textures).forEach(key => {
                const texture = this.textures[key];
                if (texture) {
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.needsUpdate = true;
                    console.log(`Texture '${key}' created successfully`);
                } else {
                    console.error(`Failed to create texture '${key}'`);
                }
            });
            
            this.isInitialized = true;
            console.log("Building textures created successfully");
        } catch (error) {
            console.error("Error creating building textures:", error);
            this.createFallbackTextures();
        }
    }
    
    createFallbackTextures() {
        console.log("Creating fallback textures...");
        
        this.textures = {
            glass: this.createSolidColorTexture(0x87CEEB),
            concrete: this.createSolidColorTexture(0x8C8C8C),
            metal: this.createSolidColorTexture(0xC0C0C0),
            windows: this.createSolidColorTexture(0x2C2C2C),
            road: this.createSolidColorTexture(0x333333)
        };
        
        this.isInitialized = true;
        console.log("Fallback textures created");
    }
    
    createSolidColorTexture(color) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            // Convert hex color to CSS color
            const cssColor = `#${color.toString(16).padStart(6, '0')}`;
            ctx.fillStyle = cssColor;
            ctx.fillRect(0, 0, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            return texture;
        } catch (error) {
            console.error("Error creating solid color texture:", error);
            return null;
        }
    }
    
    createGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        try {
            // Create glass-like texture
            const gradient = ctx.createLinearGradient(0, 0, 256, 256);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.5, '#4682B4');
            gradient.addColorStop(1, '#1E90FF');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            
            // Add window reflections
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(i * 32, j * 32, 30, 30);
                    }
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            return texture;
        } catch (error) {
            console.error("Error creating glass texture:", error);
            return this.createSolidColorTexture(0x87CEEB);
        }
    }
    
    createConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        try {
            // Base concrete color
            ctx.fillStyle = '#8C8C8C';
            ctx.fillRect(0, 0, 256, 256);
            
            // Add noise for concrete texture
            for (let i = 0; i < 1000; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const brightness = Math.random() * 60 - 30;
                const gray = Math.max(0, Math.min(255, 140 + brightness));
                ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.3)`;
                ctx.fillRect(x, y, 2, 2);
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            return texture;
        } catch (error) {
            console.error("Error creating concrete texture:", error);
            return this.createSolidColorTexture(0x8C8C8C);
        }
    }
    
    createMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        try {
            // Metal gradient
            const gradient = ctx.createLinearGradient(0, 0, 256, 0);
            gradient.addColorStop(0, '#C0C0C0');
            gradient.addColorStop(0.5, '#808080');
            gradient.addColorStop(1, '#404040');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            
            // Add metallic streaks
            for (let i = 0; i < 50; i++) {
                const y = Math.random() * 256;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
                ctx.fillRect(0, y, 256, 1);
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            return texture;
        } catch (error) {
            console.error("Error creating metal texture:", error);
            return this.createSolidColorTexture(0xC0C0C0);
        }
    }
    
    createWindowsTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        try {
            // Dark building base
            ctx.fillStyle = '#2C2C2C';
            ctx.fillRect(0, 0, 256, 256);
            
            // Add windows
            const windowsPerRow = 8;
            const windowsPerCol = 12;
            const windowWidth = 24;
            const windowHeight = 16;
            const windowSpacingX = 32;
            const windowSpacingY = 21;
            
            for (let i = 0; i < windowsPerRow; i++) {
                for (let j = 0; j < windowsPerCol; j++) {
                    const x = i * windowSpacingX + 4;
                    const y = j * windowSpacingY + 4;
                    
                    // Random chance for lit window
                    const isLit = Math.random() > 0.3;
                    ctx.fillStyle = isLit ? '#FFFF99' : '#404040';
                    ctx.fillRect(x, y, windowWidth, windowHeight);
                    
                    // Window frame
                    ctx.strokeStyle = '#1C1C1C';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, windowWidth, windowHeight);
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            console.log("Windows texture created successfully");
            return texture;
        } catch (error) {
            console.error("Error creating windows texture:", error);
            return this.createSolidColorTexture(0x2C2C2C);
        }
    }
    
    createRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        try {
            // Asphalt base
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, 256, 256);
            
            // Add road texture noise for realistic asphalt
            for (let i = 0; i < 800; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const brightness = Math.random() * 30 - 15;
                const gray = Math.max(0, Math.min(255, 51 + brightness));
                ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.6)`;
                ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
            }
            
            // Add some wear patterns
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * 256;
                const y = Math.random() * 256;
                const size = Math.random() * 10 + 5;
                ctx.fillStyle = `rgba(40, 40, 40, 0.3)`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            
            return texture;
        } catch (error) {
            console.error("Error creating road texture:", error);
            return this.createSolidColorTexture(0x333333);
        }
    }
    
    getTexture(type) {
        if (!this.isInitialized) {
            console.warn("Textures not initialized yet, initializing now...");
            this.createAllTextures();
        }
        
        if (this.textures[type]) {
            console.log(`Returning texture: ${type}`);
            return this.textures[type];
        } else {
            console.warn(`Texture type '${type}' not found, using concrete as fallback`);
            return this.textures.concrete || this.createSolidColorTexture(0x8C8C8C);
        }
    }
    
    // Static method to get a global instance
    static getInstance() {
        if (!BuildingTextures._instance) {
            console.log("Creating BuildingTextures singleton instance");
            BuildingTextures._instance = new BuildingTextures();
        }
        return BuildingTextures._instance;
    }
}

// Make BuildingTextures globally available
window.BuildingTextures = BuildingTextures;
console.log("BuildingTextures class registered globally");
