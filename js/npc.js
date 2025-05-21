class NPC {
    constructor(scene, world, position, type = 'civilian') {
        this.scene = scene;
        this.world = world;
        this.position = position;
        this.type = type;
        
        this.mesh = null;
        this.body = null;
        
        // NPC state
        this.state = 'idle';
        this.health = 100;
        
        this.init();
    }
    
    init() {
        this.createSimpleModel();
    }
    
    createSimpleModel() {
        // Create a simple character model
        const npcGroup = new THREE.Group();
        
        // Determine color based on NPC type
        let bodyColor;
        switch (this.type) {
            case 'guard': bodyColor = 0x335599; break;
            case 'hostile': bodyColor = 0x993333; break;
            default: bodyColor = 0x996633; break;
        }
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.5, 1.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.9;
        npcGroup.add(bodyMesh);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.1;
        npcGroup.add(head);
        
        // Position the NPC
        npcGroup.position.set(this.position.x, this.position.y, this.position.z);
        npcGroup.castShadow = true;
        npcGroup.receiveShadow = true;
        this.scene.add(npcGroup);
        
        this.mesh = npcGroup;
        
        // Add physics body
        const shape = new CANNON.Cylinder(0.7, 0.5, 1.8, 8);
        const body = new CANNON.Body({ mass: 0 }); // Static for now
        body.addShape(shape);
        body.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.world.addBody(body);
        this.body = body;
    }
    
    update(delta, playerPosition) {
        // Simple idle animation - just rotate a bit
        if (this.mesh) {
            this.mesh.rotation.y += delta * 0.5;
        }
    }
    
    interact(player) {
        return {
            type: 'dialogue',
            npcName: `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} NPC`,
            dialogue: [
                { text: "Hello player! This is a simplified NPC.", end: true }
            ]
        };
    }
}

class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
    }
    
    spawnNPCs(count, gridSize, spacing) {
        for (let i = 0; i < count; i++) {
            // Create NPC at random position
            const x = (Math.random() - 0.5) * gridSize * spacing;
            const z = (Math.random() - 0.5) * gridSize * spacing;
            
            // Determine NPC type
            const typeRoll = Math.random();
            let type = 'civilian';
            if (typeRoll > 0.8) type = 'guard';
            else if (typeRoll > 0.6) type = 'hostile';
            
            const npc = new NPC(this.scene, this.world, { x, y: 0, z }, type);
            this.npcs.push(npc);
        }
    }
    
    update(delta, playerPosition) {
        this.npcs.forEach(npc => {
            npc.update(delta, playerPosition);
        });
    }
    
    getNearestNPC(position, maxRange = Infinity) {
        let nearest = null;
        let minDistance = maxRange;
        
        this.npcs.forEach(npc => {
            if (!npc.mesh) return;
            
            const distance = Utils.distance(
                { x: npc.mesh.position.x, y: 0, z: npc.mesh.position.z },
                { x: position.x, y: 0, z: position.z }
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = npc;
            }
        });
        
        return { npc: nearest, distance: minDistance };
    }
}

// Make classes globally available
window.NPC = NPC;
window.NPCManager = NPCManager;
