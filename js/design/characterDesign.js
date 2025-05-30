class CharacterDesign {
    constructor() {
        // Standardize character scales for consistency - FIXED HEIGHT CALCULATIONS
        this.npcScale = 1.0; // Base scale - will be applied to entire group
        this.enemyScale = 1.1; // Slightly larger enemies
        this.characterHeight = 3.2; // Standard character height in world units
        
        // CRITICAL: Proper body part positioning ratios
        this.bodyProportions = {
            headHeight: 2.8,      // Head at 2.8 units from ground
            chestHeight: 1.6,     // Chest center at 1.6 units
            armHeight: 1.8,       // Arms at 1.8 units
            legHeight: 0.8        // Legs at 0.8 units
        };
        
        this.nameDatabase = {
            civilian: [
                "Ahmed Hassan", "Fatima Ali", "Omar Khan", "Zara Malik", "Tariq Shah",
                "Layla Rahman", "Saeed Ahmad", "Nadia Qureshi", "Faisal Hussain", "Samira Nazir"
            ],
            criminal: [
                "Black Scorpion", "Desert Wolf", "Iron Fist", "Shadow Hawk", "Red Viper",
                "Storm Rider", "Night Blade", "Fire Snake", "Blood Eagle", "Dark Thunder"
            ],
            police: [
                "Officer Malik", "Sergeant Khan", "Inspector Ahmad", "Captain Hassan", "Lieutenant Shah",
                "Detective Rahman", "Commander Ali", "Chief Qureshi", "Deputy Hussain", "Constable Nazir"
            ],
            enemy: [
                "Alpha-1", "Bravo-2", "Charlie-3", "Delta-4", "Echo-5",
                "Foxtrot-6", "Golf-7", "Hotel-8", "India-9", "Juliet-10"
            ]
        };
        
        console.log("CharacterDesign system initialized with detailed features");
    }
    
    generateCharacterName(type) {
        const names = this.nameDatabase[type] || this.nameDatabase.civilian;
        return names[Math.floor(Math.random() * names.length)];
    }
    
    createNPCCharacter(type) {
        const group = new THREE.Group();
        const scale = 1.0; // Use base scale for creation, apply npcScale to entire group
        
        this.createDetailedHumanoid(group, type, scale);
        
        // Apply NPC scale to entire group for consistency
        group.scale.setScalar(this.npcScale);
        
        console.log(`NPC character created with scale ${this.npcScale}, total height: ${this.characterHeight * this.npcScale}`);
        
        return group;
    }
    
    createEnemyCharacter() {
        const group = new THREE.Group();
        const weaponGroup = new THREE.Group();
        const scale = 1.0; // Use base scale for creation
        
        this.createDetailedHumanoid(group, 'enemy', scale);
        this.createEnemyWeapon(weaponGroup, scale);
        
        weaponGroup.position.set(0.4 * scale, 1.0 * scale, 0);
        group.add(weaponGroup);
        
        // Apply enemy scale to entire group
        group.scale.setScalar(this.enemyScale);
        
        console.log(`Enemy character created with scale ${this.enemyScale}, total height: ${this.characterHeight * this.enemyScale}`);
        
        return { group, weaponGroup };
    }
    
    createDetailedHumanoid(group, type, scale = 1.0) {
        try {
            const colorSchemes = {
                civilian: {
                    skin: 0xDDB592,
                    clothing: 0x4A5568,
                    pants: 0x2D3748,
                    shoes: 0x1A202C,
                    hair: 0x2C1810,
                    eyes: 0x4A90E2
                },
                criminal: {
                    skin: 0xCD9777,
                    clothing: 0x2D3748,
                    pants: 0x1A202C,
                    shoes: 0x000000,
                    hair: 0x1A1A1A,
                    eyes: 0xCC4125
                },
                police: {
                    skin: 0xDDB592,
                    clothing: 0x2B5CE6,
                    pants: 0x1A365D,
                    shoes: 0x000000,
                    hair: 0x3D2914,
                    eyes: 0x4A90E2
                },
                enemy: {
                    skin: 0xA0A0A0,
                    clothing: 0x4A5568,
                    pants: 0x2D3748,
                    shoes: 0x1A202C,
                    hair: 0x2A2A2A,
                    eyes: 0xFF4444
                }
            };
            
            const colors = colorSchemes[type] || colorSchemes.civilian;
            
            // Create detailed head with facial features - FIXED positioning using proportions
            const headGroup = this.createDetailedHead(colors, scale);
            headGroup.position.y = this.bodyProportions.headHeight * scale; // CORRECTED: Use proper head height
            group.add(headGroup);
            
            // Create detailed torso
            const torsoGroup = this.createDetailedTorso(colors, scale);
            torsoGroup.position.y = this.bodyProportions.chestHeight * scale; // Use proportional chest height
            group.add(torsoGroup);
            
            // Create detailed arms with hands - FIXED positioning
            const leftArmGroup = this.createDetailedArm(colors, scale, true);
            leftArmGroup.position.set(-0.55 * scale, this.bodyProportions.armHeight * scale, 0); // CORRECTED: Use arm height
            group.add(leftArmGroup);
            
            const rightArmGroup = this.createDetailedArm(colors, scale, false);
            rightArmGroup.position.set(0.55 * scale, this.bodyProportions.armHeight * scale, 0); // CORRECTED: Use arm height
            group.add(rightArmGroup);
            
            // Create detailed legs with feet - FIXED positioning
            const leftLegGroup = this.createDetailedLeg(colors, scale, true);
            leftLegGroup.position.set(-0.25 * scale, this.bodyProportions.legHeight * scale, 0); // CORRECTED: Use leg height
            group.add(leftLegGroup);
            
            const rightLegGroup = this.createDetailedLeg(colors, scale, false);
            rightLegGroup.position.set(0.25 * scale, this.bodyProportions.legHeight * scale, 0); // CORRECTED: Use leg height
            group.add(rightLegGroup);
            
            // Add character-specific accessories
            this.addCharacterAccessories(group, type, colors, scale);
            
            // Store character data with height information
            group.userData = {
                type: type,
                scale: scale,
                totalHeight: this.characterHeight * scale,
                colors: colors,
                bodyProportions: this.bodyProportions, // Store proportions for collision detection
                components: {
                    head: headGroup,
                    torso: torsoGroup,
                    leftArm: leftArmGroup,
                    rightArm: rightArmGroup,
                    leftLeg: leftLegGroup,
                    rightLeg: rightLegGroup
                }
            };
            
            console.log(`Detailed ${type} character created with height ${this.characterHeight * scale} units`);
            console.log(`Head positioned at: ${this.bodyProportions.headHeight * scale} units (should be visible above chest)`);
            
        } catch (error) {
            console.error("Error creating detailed humanoid character:", error);
            // Create a simple fallback character
            this.createSimpleFallbackCharacter(group, type, scale);
        }
    }
    
    createSimpleFallbackCharacter(group, type, scale) {
        console.log(`Creating simple fallback character for ${type} with CORRECTED head positioning`);
        
        // Clear any existing children
        while(group.children.length > 0) {
            group.remove(group.children[0]);
        }
        
        const colors = {
            skin: 0xDDB592,
            clothing: 0x4A5568,
            pants: 0x2D3748,
            shoes: 0x1A202C
        };
        
        // Simple body
        const bodyGeometry = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1.4 * scale, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.clothing });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = this.bodyProportions.chestHeight * scale; // CORRECTED: Use proper chest height
        body.castShadow = true;
        group.add(body);
        
        // Simple head - ENSURE THIS IS ALWAYS CREATED AT CORRECT HEIGHT
        const headGeometry = new THREE.SphereGeometry(0.25 * scale, 12, 12);
        const headMaterial = new THREE.MeshStandardMaterial({ color: colors.skin });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = this.bodyProportions.headHeight * scale; // CORRECTED: Proper head position above chest
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);
        
        // Simple arms - CORRECTED positioning
        const armGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, 1.0 * scale, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: colors.skin });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5 * scale, this.bodyProportions.armHeight * scale, 0); // CORRECTED
        leftArm.castShadow = true;
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5 * scale, this.bodyProportions.armHeight * scale, 0); // CORRECTED
        rightArm.castShadow = true;
        group.add(rightArm);
        
        // Simple legs - CORRECTED positioning
        const legGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 1.4 * scale, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: colors.pants });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2 * scale, this.bodyProportions.legHeight * scale, 0); // CORRECTED
        leftLeg.castShadow = true;
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2 * scale, this.bodyProportions.legHeight * scale, 0); // CORRECTED
        rightLeg.castShadow = true;
        group.add(rightLeg);
        
        console.log(`Simple fallback character created for ${type} with guaranteed head at height ${this.bodyProportions.headHeight * scale}`);
    }
    
    createDetailedHead(colors, scale) {
        const headGroup = new THREE.Group();
        
        // Main head shape (slightly oval) - Fixed geometry
        const headGeometry = new THREE.SphereGeometry(0.26 * scale, 16, 12);
        headGeometry.scale(1, 1.1, 0.9); // Make it more head-shaped
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8,
            metalness: 0.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.castShadow = true;
        head.receiveShadow = true;
        headGroup.add(head);
        
        // Hair - Positioned correctly on top of head
        const hairGeometry = new THREE.SphereGeometry(0.28 * scale, 12, 8);
        hairGeometry.scale(1, 0.7, 1);
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.hair,
            roughness: 0.9
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.12 * scale; // Moved up to sit properly on head
        hair.castShadow = true;
        headGroup.add(hair);
        
        // Eyes - Fixed positioning to be on face surface
        const eyeGeometry = new THREE.SphereGeometry(0.03 * scale, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.eyes,
            emissive: colors.eyes,
            emissiveIntensity: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.06 * scale, 0.08 * scale, 0.20 * scale); // Adjusted positioning
        headGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.06 * scale, 0.08 * scale, 0.20 * scale); // Adjusted positioning
        headGroup.add(rightEye);
        
        // Pupils - Fixed to be properly aligned with eyes
        const pupilGeometry = new THREE.SphereGeometry(0.015 * scale, 6, 6);
        const pupilMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.2
        });
        
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.06 * scale, 0.08 * scale, 0.22 * scale); // Slightly forward
        headGroup.add(leftPupil);
        
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.06 * scale, 0.08 * scale, 0.22 * scale); // Slightly forward
        headGroup.add(rightPupil);
        
        // Nose - Fixed positioning and size
        const noseGeometry = new THREE.ConeGeometry(0.015 * scale, 0.04 * scale, 6);
        const noseMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.02 * scale, 0.22 * scale); // Centered and positioned properly
        nose.rotation.x = Math.PI; // Point downward
        headGroup.add(nose);
        
        // Mouth - Fixed size and positioning
        const mouthGeometry = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            0.03 * scale, 0.01 * scale, // xRadius, yRadius
            0, Math.PI,      // aStartAngle, aEndAngle
            false,           // aClockwise
            0                // aRotation
        );
        const points = mouthGeometry.getPoints(16);
        const mouthShape = new THREE.BufferGeometry().setFromPoints(points);
        const mouthMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.6
        });
        const mouth = new THREE.Line(mouthShape, mouthMaterial);
        mouth.position.set(0, -0.05 * scale, 0.21 * scale); // Positioned below nose
        headGroup.add(mouth);
        
        // Ears - Fixed size and positioning
        const earGeometry = new THREE.SphereGeometry(0.025 * scale, 8, 8);
        earGeometry.scale(0.6, 1, 0.8);
        const earMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8
        });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.24 * scale, 0.02 * scale, 0); // Positioned on sides of head
        headGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.24 * scale, 0.02 * scale, 0); // Positioned on sides of head
        headGroup.add(rightEar);
        
        // Add eyebrows for better facial definition
        const eyebrowGeometry = new THREE.BoxGeometry(0.04 * scale, 0.005 * scale, 0.01 * scale);
        const eyebrowMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.hair,
            roughness: 0.9
        });
        
        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        leftEyebrow.position.set(-0.06 * scale, 0.12 * scale, 0.21 * scale);
        headGroup.add(leftEyebrow);
        
        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        rightEyebrow.position.set(0.06 * scale, 0.12 * scale, 0.21 * scale);
        headGroup.add(rightEyebrow);
        
        console.log(`Created detailed head with facial features at scale ${scale}`);
        return headGroup;
    }
    
    createDetailedTorso(colors, scale) {
        const torsoGroup = new THREE.Group();
        
        // Main torso
        const torsoGeometry = new THREE.CylinderGeometry(0.35 * scale, 0.4 * scale, 1.4 * scale, 12);
        const torsoMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.clothing,
            roughness: 0.7
        });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.castShadow = true;
        torsoGroup.add(torso);
        
        // Chest details (buttons or patterns)
        for (let i = 0; i < 4; i++) {
            const buttonGeometry = new THREE.SphereGeometry(0.02 * scale, 6, 6);
            const buttonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                metalness: 0.5
            });
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(0, 0.4 * scale - (i * 0.2 * scale), 0.36 * scale);
            torsoGroup.add(button);
        }
        
        // Collar
        const collarGeometry = new THREE.TorusGeometry(0.38 * scale, 0.03 * scale, 8, 16, Math.PI);
        const collarMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(colors.clothing).multiplyScalar(1.2),
            roughness: 0.6
        });
        const collar = new THREE.Mesh(collarGeometry, collarMaterial);
        collar.position.y = 0.65 * scale;
        collar.rotation.x = Math.PI;
        torsoGroup.add(collar);
        
        return torsoGroup;
    }
    
    createDetailedArm(colors, scale, isLeft) {
        const armGroup = new THREE.Group();
        
        // Upper arm (shoulder to elbow)
        const upperArmGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.14 * scale, 0.55 * scale, 12);
        const armMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8
        });
        const upperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        upperArm.position.set(0, 0.18 * scale, 0);
        upperArm.castShadow = true;
        armGroup.add(upperArm);
        
        // Elbow joint
        const elbowGeometry = new THREE.SphereGeometry(0.09 * scale, 8, 8);
        const elbow = new THREE.Mesh(elbowGeometry, armMaterial);
        elbow.position.set(0, -0.09 * scale, 0);
        armGroup.add(elbow);
        
        // Lower arm (elbow to wrist)
        const lowerArmGeometry = new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 0.5 * scale, 12);
        const lowerArm = new THREE.Mesh(lowerArmGeometry, armMaterial);
        lowerArm.position.set(0, -0.34 * scale, 0);
        lowerArm.castShadow = true;
        armGroup.add(lowerArm);
        
        // Wrist
        const wristGeometry = new THREE.SphereGeometry(0.07 * scale, 8, 8);
        const wrist = new THREE.Mesh(wristGeometry, armMaterial);
        wrist.position.set(0, -0.59 * scale, 0);
        armGroup.add(wrist);
        
        // Hand with detailed fingers
        const handGroup = this.createDetailedHand(colors, scale);
        handGroup.position.set(0, -0.68 * scale, 0);
        armGroup.add(handGroup);
        
        return armGroup;
    }
    
    createDetailedHand(colors, scale) {
        const handGroup = new THREE.Group();
        
        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.12 * scale, 0.04 * scale, 0.16 * scale);
        const handMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8
        });
        const palm = new THREE.Mesh(palmGeometry, handMaterial);
        palm.castShadow = true;
        handGroup.add(palm);
        
        // Fingers
        const fingerPositions = [
            { x: -0.045 * scale, z: 0.09 * scale }, // Index
            { x: -0.015 * scale, z: 0.095 * scale }, // Middle
            { x: 0.015 * scale, z: 0.09 * scale }, // Ring
            { x: 0.045 * scale, z: 0.08 * scale }, // Pinky
        ];
        
        fingerPositions.forEach((pos, index) => {
            const fingerLength = index === 3 ? 0.08 * scale : 0.1 * scale; // Pinky is shorter
            const fingerGeometry = new THREE.CylinderGeometry(0.012 * scale, 0.015 * scale, fingerLength, 6);
            const finger = new THREE.Mesh(fingerGeometry, handMaterial);
            finger.position.set(pos.x, fingerLength/2, pos.z);
            finger.castShadow = true;
            handGroup.add(finger);
            
            // Finger tip
            const tipGeometry = new THREE.SphereGeometry(0.012 * scale, 6, 6);
            const tip = new THREE.Mesh(tipGeometry, handMaterial);
            tip.position.set(pos.x, fingerLength, pos.z);
            handGroup.add(tip);
        });
        
        // Thumb
        const thumbGeometry = new THREE.CylinderGeometry(0.015 * scale, 0.018 * scale, 0.08 * scale, 6);
        const thumb = new THREE.Mesh(thumbGeometry, handMaterial);
        thumb.position.set(-0.07 * scale, 0.02 * scale, 0.02 * scale);
        thumb.rotation.z = Math.PI / 4;
        thumb.castShadow = true;
        handGroup.add(thumb);
        
        return handGroup;
    }
    
    createDetailedLeg(colors, scale, isLeft) {
        const legGroup = new THREE.Group();
        
        // Upper leg (thigh)
        const upperLegGeometry = new THREE.CylinderGeometry(0.16 * scale, 0.18 * scale, 0.65 * scale, 12);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.pants,
            roughness: 0.7
        });
        const upperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
        upperLeg.position.set(0, 0.22 * scale, 0);
        upperLeg.castShadow = true;
        legGroup.add(upperLeg);
        
        // Knee joint
        const kneeGeometry = new THREE.SphereGeometry(0.12 * scale, 10, 10);
        const kneeMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.skin,
            roughness: 0.8
        });
        const knee = new THREE.Mesh(kneeGeometry, kneeMaterial);
        knee.position.set(0, -0.11 * scale, 0);
        knee.castShadow = true;
        legGroup.add(knee);
        
        // Lower leg (shin/calf)
        const lowerLegGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.6 * scale, 12);
        const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
        lowerLeg.position.set(0, -0.41 * scale, 0);
        lowerLeg.castShadow = true;
        legGroup.add(lowerLeg);
        
        // Ankle
        const ankleGeometry = new THREE.SphereGeometry(0.08 * scale, 8, 8);
        const ankle = new THREE.Mesh(ankleGeometry, kneeMaterial);
        ankle.position.set(0, -0.71 * scale, 0);
        ankle.castShadow = true;
        legGroup.add(ankle);
        
        // Detailed foot
        const footGroup = this.createDetailedFoot(colors, scale);
        footGroup.position.set(0, -0.78 * scale, 0.08 * scale);
        legGroup.add(footGroup);
        
        return legGroup;
    }
    
    createDetailedFoot(colors, scale) {
        const footGroup = new THREE.Group();
        
        // Main foot body
        const footGeometry = new THREE.BoxGeometry(0.18 * scale, 0.08 * scale, 0.42 * scale);
        const footMaterial = new THREE.MeshStandardMaterial({ 
            color: colors.shoes,
            roughness: 0.9
        });
        const foot = new THREE.Mesh(footGeometry, footMaterial);
        foot.castShadow = true;
        footGroup.add(foot);
        
        // Shoe sole
        const soleGeometry = new THREE.BoxGeometry(0.2 * scale, 0.03 * scale, 0.44 * scale);
        const soleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 1.0
        });
        const sole = new THREE.Mesh(soleGeometry, soleMaterial);
        sole.position.y = -0.055 * scale;
        sole.castShadow = true;
        footGroup.add(sole);
        
        // Shoe laces (decorative)
        for (let i = 0; i < 3; i++) {
            const laceGeometry = new THREE.CylinderGeometry(0.005 * scale, 0.005 * scale, 0.15 * scale, 6);
            const laceMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const lace = new THREE.Mesh(laceGeometry, laceMaterial);
            lace.position.set(0, 0.03 * scale, 0.05 * scale - (i * 0.08 * scale));
            lace.rotation.z = Math.PI / 2;
            footGroup.add(lace);
        }
        
        // Toe cap
        const toeCapGeometry = new THREE.SphereGeometry(0.09 * scale, 8, 8);
        toeCapGeometry.scale(1, 0.5, 1.5);
        const toeCap = new THREE.Mesh(toeCapGeometry, footMaterial);
        toeCap.position.set(0, 0.02 * scale, 0.16 * scale);
        footGroup.add(toeCap);
        
        return footGroup;
    }
    
    addCharacterAccessories(group, type, colors, scale) {
        switch(type) {
            case 'police':
                // Police badge
                const badgeGeometry = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.02 * scale, 8);
                const badgeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xffd700,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
                badge.position.set(0.25 * scale, 1.4 * scale, 0.36 * scale);
                badge.rotation.x = Math.PI / 2;
                group.add(badge);
                
                // Police cap
                const capGeometry = new THREE.CylinderGeometry(0.28 * scale, 0.26 * scale, 0.1 * scale, 12);
                const capMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x1A365D,
                    roughness: 0.6
                });
                const cap = new THREE.Mesh(capGeometry, capMaterial);
                cap.position.set(0, 2.15 * scale, 0);
                group.add(cap);
                break;
                
            case 'criminal':
                // Bandana or hat
                const bandanaGeometry = new THREE.SphereGeometry(0.27 * scale, 12, 8);
                bandanaGeometry.scale(1, 0.6, 1);
                const bandanaMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B0000,
                    roughness: 0.8
                });
                const bandana = new THREE.Mesh(bandanaGeometry, bandanaMaterial);
                bandana.position.set(0, 2.1 * scale, 0);
                group.add(bandana);
                
                // Scar on face
                const scarGeometry = new THREE.BoxGeometry(0.02 * scale, 0.15 * scale, 0.01 * scale);
                const scarMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.9
                });
                const scar = new THREE.Mesh(scarGeometry, scarMaterial);
                scar.position.set(0.1 * scale, 2.05 * scale, 0.24 * scale);
                group.add(scar);
                break;
                
            case 'civilian':
                // Glasses (50% chance)
                if (Math.random() > 0.5) {
                    const glassGroup = new THREE.Group();
                    
                    // Lens frames
                    const lensGeometry = new THREE.TorusGeometry(0.05 * scale, 0.008 * scale, 8, 16);
                    const lensMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0x444444,
                        metalness: 0.5
                    });
                    
                    const leftLens = new THREE.Mesh(lensGeometry, lensMaterial);
                    leftLens.position.set(-0.08 * scale, 0, 0);
                    glassGroup.add(leftLens);
                    
                    const rightLens = new THREE.Mesh(lensGeometry, lensMaterial);
                    rightLens.position.set(0.08 * scale, 0, 0);
                    glassGroup.add(rightLens);
                    
                    // Bridge
                    const bridgeGeometry = new THREE.CylinderGeometry(0.005 * scale, 0.005 * scale, 0.04 * scale, 6);
                    const bridge = new THREE.Mesh(bridgeGeometry, lensMaterial);
                    bridge.rotation.z = Math.PI / 2;
                    glassGroup.add(bridge);
                    
                    glassGroup.position.set(0, 2.05 * scale, 0.22 * scale);
                    group.add(glassGroup);
                }
                break;
                
            case 'enemy':
                // Tactical helmet
                const helmetGeometry = new THREE.SphereGeometry(0.28 * scale, 12, 8);
                helmetGeometry.scale(1, 0.8, 1);
                const helmetMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x2A2A2A,
                    roughness: 0.3,
                    metalness: 0.7
                });
                const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
                helmet.position.set(0, 2.1 * scale, 0);
                group.add(helmet);
                
                // Visor
                const visorGeometry = new THREE.BoxGeometry(0.24 * scale, 0.08 * scale, 0.02 * scale);
                const visorMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.8
                });
                const visor = new THREE.Mesh(visorGeometry, visorMaterial);
                visor.position.set(0, 2.02 * scale, 0.26 * scale);
                group.add(visor);
                break;
        }
    }
    
    createEnemyWeapon(weaponGroup, scale) {
        // Create assault rifle
        const bodyGeometry = new THREE.BoxGeometry(0.08 * scale, 0.15 * scale, 0.6 * scale);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2C2C2C,
            metalness: 0.8,
            roughness: 0.3
        });
        const weaponBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        weaponGroup.add(weaponBody);
        
        // Barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.4 * scale, 8);
        const barrel = new THREE.Mesh(barrelGeometry, bodyMaterial);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.4 * scale, 0, 0); // Position at front for proper bullet spawn
        weaponGroup.add(barrel);
        
        // Stock
        const stockGeometry = new THREE.BoxGeometry(0.06 * scale, 0.12 * scale, 0.2 * scale);
        const stock = new THREE.Mesh(stockGeometry, bodyMaterial);
        stock.position.set(0, 0, -0.4 * scale);
        weaponGroup.add(stock);
        
        // Store barrel reference for muzzle flash positioning
        weaponGroup.userData.barrel = barrel;
        
        console.log("Enemy weapon created with proper barrel positioning");
        return weaponGroup;
    }
    
    animateCharacter(character, animationType = 'idle') {
        if (!character || !character.userData) return;
        
        const time = Date.now() * 0.001;
        
        switch (animationType) {
            case 'idle':
                this.animateIdle(character, time);
                break;
            case 'walk':
                this.animateWalk(character, time);
                break;
        }
    }
    
    animateIdle(character, time) {
        // Subtle breathing animation
        if (character.userData.components && character.userData.components.torso) {
            character.userData.components.torso.scale.y = 1 + Math.sin(time * 2) * 0.02;
        }
        
        // Slight head movement
        if (character.userData.components && character.userData.components.head) {
            character.userData.components.head.rotation.y = Math.sin(time * 0.5) * 0.1;
        }
    }
    
    animateWalk(character, time) {
        const components = character.userData.components;
        if (!components) return;
        
        // Arm swinging
        if (components.leftArm) {
            components.leftArm.rotation.x = Math.sin(time * 8) * 0.3;
        }
        if (components.rightArm) {
            components.rightArm.rotation.x = -Math.sin(time * 8) * 0.3;
        }
        
        // Leg movement
        if (components.leftLeg) {
            components.leftLeg.rotation.x = Math.sin(time * 8) * 0.2;
        }
        if (components.rightLeg) {
            components.rightLeg.rotation.x = -Math.sin(time * 8) * 0.2;
        }
        
        // Head bob
        if (components.head) {
            components.head.position.y = 2.0 + Math.sin(time * 16) * 0.05;
        }
    }
}

window.CharacterDesign = CharacterDesign;
console.log("CharacterDesign class loaded with detailed facial features and limbs");
