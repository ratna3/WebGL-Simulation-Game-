class CharacterDesign {
    constructor() {
        this.materials = {};
        this.geometries = {};
        this.initializeMaterials();
        this.initializeGeometries();
    }
    
    initializeMaterials() {
        // Character materials
        this.materials = {
            // Body materials by type
            criminal: new THREE.MeshStandardMaterial({ 
                color: 0x330000, 
                metalness: 0.3, 
                roughness: 0.7 
            }),
            police: new THREE.MeshStandardMaterial({ 
                color: 0x000066, 
                metalness: 0.3, 
                roughness: 0.7 
            }),
            civilian: new THREE.MeshStandardMaterial({ 
                color: 0x444444, 
                metalness: 0.3, 
                roughness: 0.7 
            }),
            enemy: new THREE.MeshStandardMaterial({ 
                color: 0x444444, 
                metalness: 0.8, 
                roughness: 0.2 
            }),
            
            // Common materials
            skin: new THREE.MeshStandardMaterial({ 
                color: 0xffdbac, 
                metalness: 0.1, 
                roughness: 0.9 
            }),
            legs: new THREE.MeshStandardMaterial({ 
                color: 0x222222, 
                metalness: 0.4, 
                roughness: 0.6 
            }),
            enemyLegs: new THREE.MeshStandardMaterial({ 
                color: 0x111111, 
                metalness: 0.6, 
                roughness: 0.4 
            }),
            
            // Accessory materials
            badge: new THREE.MeshStandardMaterial({ 
                color: 0xffd700, 
                metalness: 0.8, 
                roughness: 0.2 
            }),
            weapon: new THREE.MeshStandardMaterial({
                color: 0x111111,
                metalness: 0.9,
                roughness: 0.1
            })
        };
    }
    
    initializeGeometries() {
        // Character geometries
        this.geometries = {
            // Body parts
            npcBody: new THREE.CylinderGeometry(0.4, 0.4, 1.6, 12),
            enemyBody: new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12),
            head: new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12),
            enemyHead: new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12),
            eye: new THREE.SphereGeometry(0.05, 8, 8),
            enemyEye: new THREE.SphereGeometry(0.08, 8, 8),
            
            // Legs
            npcLeg: new THREE.ConeGeometry(0.15, 0.8, 8),
            enemyLeg: new THREE.ConeGeometry(0.18, 0.9, 8),
            
            // Enemy arms
            arm: new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8),
            
            // Accessories
            badge: new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8),
            mark: new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6),
            
            // Weapons
            gunBarrel: new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8),
            gunBody: new THREE.BoxGeometry(0.1, 0.2, 0.3)
        };
    }
    
    createNPCCharacter(type = 'civilian') {
        const group = new THREE.Group();
        
        // Main body
        const body = new THREE.Mesh(this.geometries.npcBody, this.materials[type]);
        body.position.y = 0.8;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const head = new THREE.Mesh(this.geometries.head, this.materials.skin);
        head.position.y = 1.9;
        head.castShadow = true;
        group.add(head);
        
        // Eyes
        this.addNPCEyes(group, type);
        
        // Cone legs (upside down)
        this.addNPCLegs(group);
        
        // Type-specific accessories
        this.addNPCAccessories(group, type);
        
        return group;
    }
    
    addNPCEyes(group, type) {
        let eyeColor = 0x0000ff; // Default blue
        
        if (type === 'criminal') {
            eyeColor = 0xff0000; // Red eyes for criminals
        } else if (type === 'police') {
            eyeColor = 0x0099ff; // Bright blue for police
        }
        
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: eyeColor,
            emissive: eyeColor,
            emissiveIntensity: 0.3
        });
        
        const leftEye = new THREE.Mesh(this.geometries.eye, eyeMaterial);
        leftEye.position.set(-0.1, 1.95, 0.2);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(this.geometries.eye, eyeMaterial);
        rightEye.position.set(0.1, 1.95, 0.2);
        group.add(rightEye);
    }
    
    addNPCLegs(group) {
        // Left leg (upside down cone)
        const leftLeg = new THREE.Mesh(this.geometries.npcLeg, this.materials.legs);
        leftLeg.position.set(-0.2, 0.4, 0);
        leftLeg.rotation.x = Math.PI; // Flip upside down
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        // Right leg (upside down cone)
        const rightLeg = new THREE.Mesh(this.geometries.npcLeg, this.materials.legs);
        rightLeg.position.set(0.2, 0.4, 0);
        rightLeg.rotation.x = Math.PI; // Flip upside down
        rightLeg.castShadow = true;
        group.add(rightLeg);
    }
    
    addNPCAccessories(group, type) {
        switch(type) {
            case 'police':
                // Police badge
                const badge = new THREE.Mesh(this.geometries.badge, this.materials.badge);
                badge.position.set(0.25, 1.2, 0.35);
                badge.rotation.x = Math.PI / 2;
                group.add(badge);
                break;
                
            case 'criminal':
                // Criminal marking
                const mark = new THREE.Mesh(this.geometries.mark, this.materials.legs);
                mark.position.set(0.45, 1.0, 0);
                mark.rotation.z = Math.PI / 2;
                group.add(mark);
                break;
        }
    }
    
    createEnemyCharacter() {
        const group = new THREE.Group();
        
        // Main body
        const body = new THREE.Mesh(this.geometries.enemyBody, this.materials.enemy);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const head = new THREE.Mesh(this.geometries.enemyHead, this.materials.enemy);
        head.position.y = 2.1;
        head.castShadow = true;
        group.add(head);
        
        // Glowing red eyes
        this.addEnemyEyes(group);
        
        // Arms
        this.addEnemyArms(group);
        
        // Cone legs (upside down, larger)
        this.addEnemyLegs(group);
        
        // Weapon
        const weaponGroup = this.createEnemyWeapon();
        weaponGroup.position.set(0.8, 1.3, 0.2);
        weaponGroup.rotation.y = Math.PI / 2;
        group.add(weaponGroup);
        
        return { group, weaponGroup };
    }
    
    addEnemyEyes(group) {
        const eyeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        
        const leftEye = new THREE.Mesh(this.geometries.enemyEye, eyeMaterial);
        leftEye.position.set(-0.12, 2.15, 0.25);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(this.geometries.enemyEye, eyeMaterial);
        rightEye.position.set(0.12, 2.15, 0.25);
        group.add(rightEye);
    }
    
    addEnemyArms(group) {
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const leftArm = new THREE.Mesh(this.geometries.arm, armMaterial);
        leftArm.position.set(-0.7, 1, 0);
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(this.geometries.arm, armMaterial);
        rightArm.position.set(0.7, 1, 0);
        rightArm.castShadow = true;
        group.add(rightArm);
    }
    
    addEnemyLegs(group) {
        // Left leg (upside down cone, larger)
        const leftLeg = new THREE.Mesh(this.geometries.enemyLeg, this.materials.enemyLegs);
        leftLeg.position.set(-0.25, 0.45, 0);
        leftLeg.rotation.x = Math.PI; // Flip upside down
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        // Right leg (upside down cone, larger)
        const rightLeg = new THREE.Mesh(this.geometries.enemyLeg, this.materials.enemyLegs);
        rightLeg.position.set(0.25, 0.45, 0);
        rightLeg.rotation.x = Math.PI; // Flip upside down
        rightLeg.castShadow = true;
        group.add(rightLeg);
    }
    
    createEnemyWeapon() {
        const weaponGroup = new THREE.Group();
        
        // Gun barrel
        const barrel = new THREE.Mesh(this.geometries.gunBarrel, this.materials.weapon);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.2, 0, 0);
        weaponGroup.add(barrel);
        
        // Gun body
        const gunBody = new THREE.Mesh(this.geometries.gunBody, this.materials.weapon);
        gunBody.position.set(0, 0, -0.1);
        weaponGroup.add(gunBody);
        
        return weaponGroup;
    }
    
    generateCharacterName(type) {
        const names = {
            criminal: ['Tony "The Fish"', 'Marco Volkov', 'Eddie "Knuckles"', 'Vince Romano', 'Sal "The Snake"', 'Tommy Two-Times'],
            police: ['Officer Johnson', 'Detective Martinez', 'Sergeant Williams', 'Captain Davis', 'Lieutenant Brown', 'Detective Chen'],
            civilian: ['Sarah Chen', 'Mike Thompson', 'Lisa Rodriguez', 'James Wilson', 'Emma Davis', 'Alex Parker']
        };
        
        return names[type][Math.floor(Math.random() * names[type].length)];
    }
}

// Make CharacterDesign globally available
window.CharacterDesign = CharacterDesign;
