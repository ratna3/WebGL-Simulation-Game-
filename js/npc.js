class NPC {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 0, y: 0, z: 0 };
        
        this.mesh = null;
        this.body = null;
    }
    
    init() {
        // Create a simple NPC representation
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 8);
        const material = new THREE.MeshStandardMaterial({color: 0x996633});
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
        
        // Create physics body
        const shape = new CANNON.Cylinder(0.5, 0.5, 1.8, 8);
        this.body = new CANNON.Body({ mass: 0 });
        this.body.addShape(shape);
        this.body.position.set(this.position.x, this.position.y + 0.9, this.position.z);
        this.world.addBody(this.body);
    }
    
    update() {
        // NPC behavior updates
    }
}

class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
    }
    
    spawnNPCs(count) {
        for (let i = 0; i < count; i++) {
            const position = {
                x: Math.random() * 40 - 20,
                y: 0,
                z: Math.random() * 40 - 20
            };
            
            const npc = new NPC(this.scene, this.world, position);
            npc.init();
            this.npcs.push(npc);
        }
    }
    
    update() {
        this.npcs.forEach(npc => npc.update());
    }
    
    getNearestNPC(position, maxRange) {
        return { npc: null, distance: Infinity };
    }
}

// Make classes globally available
window.NPC = NPC;
window.NPCManager = NPCManager;
