class AdvancedBuildingTextures {
    constructor() {
        this.textures = {};
        this.isInitialized = false;
        this.loader = new THREE.TextureLoader();
        console.log("AdvancedBuildingTextures constructor called");
        this.createAllTextures();
    }
    
    static getInstance() {
        if (!AdvancedBuildingTextures.instance) {
            AdvancedBuildingTextures.instance = new AdvancedBuildingTextures();
        }
        return AdvancedBuildingTextures.instance;
    }
    
    createAllTextures() {
        try {
            // Create advanced procedural textures
            this.createDetailedBrickTexture();
            this.createDetailedConcreteTexture();
            this.createDetailedGlassTexture();
            this.createDetailedMetalTexture();
            this.createDetailedWoodTexture();
            this.createRoofTexture();
            this.createWindowTexture();
            
            this.isInitialized = true;
            console.log("Advanced building textures initialized successfully");
        } catch (error) {
            console.error("Error creating advanced building textures:", error);
            this.createFallbackTextures();
        }
    }
    
    createDetailedBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base brick color with variation
        const baseColors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E'];
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 512, 512);
        
        // Draw detailed brick pattern
        const brickWidth = 64;
        const brickHeight = 24;
        
        for (let y = 0; y < 512; y += brickHeight) {
            for (let x = 0; x < 512; x += brickWidth) {
                const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                const adjustedX = x + offset;
                
                // Vary brick color
                const colorIndex = Math.floor(Math.random() * baseColors.length);
                ctx.fillStyle = baseColors[colorIndex];
                ctx.fillRect(adjustedX, y, brickWidth - 2, brickHeight - 2);
                
                // Add mortar lines
                ctx.strokeStyle = '#696969';
                ctx.lineWidth = 2;
                ctx.strokeRect(adjustedX, y, brickWidth - 2, brickHeight - 2);
                
                // Add brick texture details
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                for (let i = 0; i < 3; i++) {
                    const detailX = adjustedX + Math.random() * (brickWidth - 4);
                    const detailY = y + Math.random() * (brickHeight - 4);
                    ctx.fillRect(detailX, detailY, 2, 1);
                }
            }
        }
        
        this.textures.detailedBrick = new THREE.CanvasTexture(canvas);
        this.textures.detailedBrick.wrapS = THREE.RepeatWrapping;
        this.textures.detailedBrick.wrapT = THREE.RepeatWrapping;
        this.textures.detailedBrick.repeat.set(2, 2);
    }
    
    createDetailedConcreteTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base concrete color
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add concrete panels
        const panelSize = 128;
        for (let y = 0; y < 512; y += panelSize) {
            for (let x = 0; x < 512; x += panelSize) {
                // Panel variation
                const shade = 0.9 + Math.random() * 0.2;
                ctx.fillStyle = `rgb(${Math.floor(204 * shade)}, ${Math.floor(204 * shade)}, ${Math.floor(204 * shade)})`;
                ctx.fillRect(x + 2, y + 2, panelSize - 4, panelSize - 4);
                
                // Panel lines
                ctx.strokeStyle = '#999999';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, panelSize, panelSize);
            }
        }
        
        // Add weathering effects
        const imageData = ctx.getImageData(0, 0, 512, 512);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        this.textures.detailedConcrete = new THREE.CanvasTexture(canvas);
        this.textures.detailedConcrete.wrapS = THREE.RepeatWrapping;
        this.textures.detailedConcrete.wrapT = THREE.RepeatWrapping;
    }
    
    createDetailedGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base glass color
        ctx.fillStyle = '#E6F3FF';
        ctx.fillRect(0, 0, 512, 512);
        
        // Window grid
        const windowWidth = 64;
        const windowHeight = 80;
        
        for (let y = 0; y < 512; y += windowHeight) {
            for (let x = 0; x < 512; x += windowWidth) {
                // Window frame
                ctx.fillStyle = '#AAAAAA';
                ctx.fillRect(x, y, windowWidth, windowHeight);
                
                // Glass area
                ctx.fillStyle = '#E6F3FF';
                ctx.fillRect(x + 3, y + 3, windowWidth - 6, windowHeight - 6);
                
                // Window reflection
                const gradient = ctx.createLinearGradient(x, y, x + windowWidth, y + windowHeight);
                gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
                gradient.addColorStop(0.5, 'rgba(135,206,235,0.2)');
                gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x + 3, y + 3, windowWidth - 6, windowHeight - 6);
                
                // Window cross
                ctx.strokeStyle = '#999999';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + windowWidth/2, y);
                ctx.lineTo(x + windowWidth/2, y + windowHeight);
                ctx.moveTo(x, y + windowHeight/2);
                ctx.lineTo(x + windowWidth, y + windowHeight/2);
                ctx.stroke();
            }
        }
        
        this.textures.detailedGlass = new THREE.CanvasTexture(canvas);
        this.textures.detailedGlass.wrapS = THREE.RepeatWrapping;
        this.textures.detailedGlass.wrapT = THREE.RepeatWrapping;
        this.textures.detailedGlass.repeat.set(1, 3);
    }
    
    createDetailedMetalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base metal color
        ctx.fillStyle = '#666666';
        ctx.fillRect(0, 0, 512, 512);
        
        // Metal panels
        const panelHeight = 32;
        for (let y = 0; y < 512; y += panelHeight) {
            // Alternate panel shades
            const shade = (y / panelHeight) % 2 === 0 ? 0.9 : 1.1;
            ctx.fillStyle = `rgb(${Math.floor(102 * shade)}, ${Math.floor(102 * shade)}, ${Math.floor(102 * shade)})`;
            ctx.fillRect(0, y, 512, panelHeight);
            
            // Panel rivets
            for (let x = 20; x < 512; x += 40) {
                ctx.fillStyle = '#444444';
                ctx.beginPath();
                ctx.arc(x, y + panelHeight/2, 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#888888';
                ctx.beginPath();
                ctx.arc(x, y + panelHeight/2, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Panel seams
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }
        
        this.textures.detailedMetal = new THREE.CanvasTexture(canvas);
        this.textures.detailedMetal.wrapS = THREE.RepeatWrapping;
        this.textures.detailedMetal.wrapT = THREE.RepeatWrapping;
    }
    
    createDetailedWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base wood color
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 512, 512);
        
        // Wood grain
        for (let y = 0; y < 512; y += 4) {
            const grainIntensity = Math.sin(y * 0.01) * 0.3 + 0.7;
            const grainColor = Math.floor(139 * grainIntensity);
            ctx.fillStyle = `rgb(${grainColor}, ${Math.floor(grainColor * 0.5)}, ${Math.floor(grainColor * 0.14)})`;
            ctx.fillRect(0, y, 512, 2);
            
            // Wood knots
            if (Math.random() < 0.02) {
                const knotX = Math.random() * 512;
                const knotSize = 10 + Math.random() * 20;
                
                ctx.fillStyle = '#654321';
                ctx.beginPath();
                ctx.ellipse(knotX, y, knotSize, knotSize * 0.6, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.ellipse(knotX, y, knotSize * 0.5, knotSize * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        this.textures.detailedWood = new THREE.CanvasTexture(canvas);
        this.textures.detailedWood.wrapS = THREE.RepeatWrapping;
        this.textures.detailedWood.wrapT = THREE.RepeatWrapping;
    }
    
    createRoofTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base roof color
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 0, 512, 512);
        
        // Roof tiles
        const tileWidth = 32;
        const tileHeight = 16;
        
        for (let y = 0; y < 512; y += tileHeight) {
            for (let x = 0; x < 512; x += tileWidth) {
                const offset = (Math.floor(y / tileHeight) % 2) * (tileWidth / 2);
                const adjustedX = x + offset;
                
                // Tile color variation
                const shade = 0.8 + Math.random() * 0.4;
                ctx.fillStyle = `rgb(${Math.floor(74 * shade)}, ${Math.floor(74 * shade)}, ${Math.floor(74 * shade)})`;
                
                // Draw tile shape
                ctx.beginPath();
                ctx.moveTo(adjustedX, y + tileHeight);
                ctx.lineTo(adjustedX + tileWidth/3, y);
                ctx.lineTo(adjustedX + 2*tileWidth/3, y);
                ctx.lineTo(adjustedX + tileWidth, y + tileHeight);
                ctx.closePath();
                ctx.fill();
                
                // Tile outline
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        
        this.textures.roof = new THREE.CanvasTexture(canvas);
        this.textures.roof.wrapS = THREE.RepeatWrapping;
        this.textures.roof.wrapT = THREE.RepeatWrapping;
        this.textures.roof.repeat.set(3, 3);
    }
    
    createWindowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Window frame
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(0, 0, 256, 256);
        
        // Glass area
        ctx.fillStyle = '#E6F3FF';
        ctx.fillRect(8, 8, 240, 240);
        
        // Window cross
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(120, 0, 16, 256);
        ctx.fillRect(0, 120, 256, 16);
        
        // Glass reflection
        const gradient = ctx.createLinearGradient(0, 0, 256, 256);
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.3, 'rgba(135,206,235,0.2)');
        gradient.addColorStop(0.7, 'rgba(0,100,200,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(8, 8, 240, 240);
        
        this.textures.window = new THREE.CanvasTexture(canvas);
        this.textures.window.wrapS = THREE.RepeatWrapping;
        this.textures.window.wrapT = THREE.RepeatWrapping;
    }
    
    createFallbackTextures() {
        this.textures = {
            detailedBrick: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 }),
            detailedConcrete: new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.8 }),
            detailedGlass: new THREE.MeshStandardMaterial({ color: 0xE6F3FF, transparent: true, opacity: 0.7 }),
            detailedMetal: new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 }),
            detailedWood: new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 }),
            roof: new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.9 }),
            window: new THREE.MeshStandardMaterial({ color: 0xE6F3FF, transparent: true, opacity: 0.8 })
        };
        this.isInitialized = true;
        console.log("Fallback advanced building textures created");
    }
    
    getTexture(type) {
        if (!this.isInitialized) {
            this.createFallbackTextures();
        }
        return this.textures[type] || this.textures.detailedConcrete;
    }
    
    getBuildingMaterials(type = 'residential') {
        if (!this.isInitialized) {
            this.createFallbackTextures();
        }
        
        switch (type) {
            case 'residential':
                return [
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedBrick, roughness: 0.9 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedBrick, roughness: 0.9 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.roof, roughness: 0.9 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedBrick, roughness: 0.9 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedBrick, roughness: 0.9 })
                ];
                
            case 'commercial':
                return [
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedMetal, metalness: 0.8, roughness: 0.3 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 })
                ];
                
            case 'office':
                return [
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedMetal, metalness: 0.8, roughness: 0.3 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedGlass, transparent: true, opacity: 0.7 })
                ];
                
            default:
                return [
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 }),
                    new THREE.MeshStandardMaterial({ map: this.textures.detailedConcrete, roughness: 0.8 })
                ];
        }
    }
}

// Make AdvancedBuildingTextures globally available
window.AdvancedBuildingTextures = AdvancedBuildingTextures;
console.log("AdvancedBuildingTextures.js loaded successfully");
