class CharacterDesign {
    constructor() {
        this.npcScale = 1.8; // Increased from 1.5 to 1.8 - much bigger NPCs
        this.enemyScale = 2.0; // Increased from 1.7 to 2.0 - even bigger enemies
        
        this.materials = {};
        this.geometries = {};
        this.initializeMaterials();
        this.initializeGeometries();
        
        console.log("CharacterDesign system initialized with much bigger NPCs");
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
    
    createEnhancedHumanoid(group, type, scale = 1.0) {
        try {
            // ...existing colorSchemes...
            
            const colors = colorSchemes[type] || colorSchemes.civilian;
            
            // Head - much larger and more visible
            const headGeometry = new THREE.SphereGeometry(0.26 * scale, 12, 12); // Increased from 0.22
            const headMaterial = new THREE.MeshStandardMaterial({ 
                color: colors.body,
                roughness: 0.8
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 2.0 * scale; // Adjusted for larger head
            head.castShadow = true;
            group.add(head);
            
            // Body (torso) - much wider and taller
            const bodyGeometry = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1.4 * scale, 12); // Increased
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: colors.clothing,
                roughness: 0.7
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 1.1 * scale; // Adjusted for larger body
            body.castShadow = true;
            group.add(body);
            
            // Enhanced Arms with proper segments - much larger
            const leftArm = this.createDetailedArm(group, -0.5 * scale, 1.2 * scale, 0, scale, colors, true);
            const rightArm = this.createDetailedArm(group, 0.5 * scale, 1.2 * scale, 0, scale, colors, false);
            
            // Enhanced Legs with proper segments and feet - much larger
            const leftLeg = this.createDetailedLeg(group, -0.25 * scale, 0.45 * scale, 0, scale, colors, true);
            const rightLeg = this.createDetailedLeg(group, 0.25 * scale, 0.45 * scale, 0, scale, colors, false);
            
            // ...existing userData storage...
            
            console.log(`Enhanced ${type} character created with much bigger proportions (scale: ${scale})`);
            
        } catch (error) {
            console.error("Error creating enhanced humanoid character:", error);
        }
    }
    
    createDetailedArm(group, x, y, z, scale, colors, isLeft = true) {
        const armGroup = new THREE.Group();
        
        // Upper arm - much larger
        const upperArmGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.14 * scale, 0.5 * scale, 8); // Increased
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.body,
            roughness: 0.8
        });
        const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        upperArm.position.set(0, 0.16 * scale, 0);
        upperArm.castShadow = true;
        armGroup.add(upperArm);
        
        // Lower arm (forearm) - much larger
        const lowerArmGeometry = new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 0.45 * scale, 8); // Increased
        const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
        lowerArm.position.set(0, -0.35 * scale, 0);
        lowerArm.castShadow = true;
        armGroup.add(lowerArm);
        
        // Hand - much larger
        const handGeometry = new THREE.SphereGeometry(0.09 * scale, 8, 8); // Increased
        const hand = new THREE.Mesh(handGeometry, armMaterial);
        hand.position.set(0, -0.6 * scale, 0);
        hand.castShadow = true;
        armGroup.add(hand);
        
        // Add fingers (simplified) - much larger
        for (let i = 0; i < 4; i++) {
            const fingerGeometry = new THREE.CylinderGeometry(0.014 * scale, 0.02 * scale, 0.07 * scale, 6); // Increased
            const finger = new THREE.Mesh(fingerGeometry, armMaterial);
            const angle = (i - 1.5) * 0.3;
            finger.position.set(
                Math.sin(angle) * 0.07 * scale,
                -0.62 * scale,
                Math.cos(angle) * 0.07 * scale
            );
            finger.rotation.z = angle;
            finger.castShadow = true;
            armGroup.add(finger);
        }
        
        // ...existing positioning and userData...
        
        return armGroup;
    }
    
    createDetailedLeg(group, x, y, z, scale, colors, isLeft = true) {
        const legGroup = new THREE.Group();
        
        // Upper leg (thigh) - much larger
        const upperLegGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.55 * scale, 8); // Increased
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.pants,
            roughness: 0.7
        });
        const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        upperLeg.position.set(0, 0.16 * scale, 0);
        upperLeg.castShadow = true;
        legGroup.add(upperLeg);
        
        // Lower leg (shin) - much larger
        const lowerLegGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.5 * scale, 8); // Increased
        const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        lowerLeg.position.set(0, -0.35 * scale, 0);
        lowerLeg.castShadow = true;
        legGroup.add(lowerLeg);
        
        // Foot - much larger
        const footGeometry = new THREE.BoxGeometry(0.14 * scale, 0.08 * scale, 0.35 * scale); // Increased
        const footMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.shoes,
            roughness: 0.9
        });
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.position.set(0, -0.6 * scale, 0.08 * scale); // Slightly forward
        foot.castShadow = true;
        legGroup.add(foot);
        
        // Ankle connection - larger
        const ankleGeometry = new THREE.SphereGeometry(0.07 * scale, 6, 6); // Increased
        const ankleMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.body,
            roughness: 0.8
        });
        const ankle = new THREE.Mesh(ankleGeometry, ankleMaterial);
        ankle.position.set(0, -0.56 * scale, 0);
        ankle.castShadow = true;
        legGroup.add(ankle);
        
        // ...existing positioning and userData...
        
        return legGroup;
    }
    
    // ...existing animation methods...
}

// Make CharacterDesign globally available
window.CharacterDesign = CharacterDesign;
console.log("CharacterDesign class loaded with much bigger NPCs");
