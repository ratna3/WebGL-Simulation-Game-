class CharacterDesign {
    constructor() {
        this.skinTones = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c4033];
        this.hairColors = [0x8b4513, 0x000000, 0x8b0000, 0xffd700, 0x654321, 0x2f1b14];
        this.eyeColors = [0x8B4513, 0x000080, 0x228B22, 0x808080, 0x000000];
        this.clothingColors = [0x1e90ff, 0x228b22, 0xdc143c, 0x000080, 0x800080, 0x008080, 0x696969];
    }
    
    createCompleteCharacter(type = 'civilian', options = {}) {
        const characterGroup = new THREE.Group();
        
        // Get colors
        const skinTone = options.skinTone || this.getRandomSkinTone();
        const hairColor = options.hairColor || this.getRandomHairColor();
        const eyeColor = options.eyeColor || this.getRandomEyeColor();
        const clothingColor = this.getClothingColorForType(type);
        
        // Create body
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: clothingColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        characterGroup.add(body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: skinTone });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.45;
        characterGroup.add(head);
        
        // Create hair
        const hairGeometry = new THREE.SphereGeometry(0.27, 8, 8);
        const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.5;
        hair.scale.y = 0.8;
        characterGroup.add(hair);
        
        // Create eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: eyeColor });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.48, 0.2);
        characterGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.48, 0.2);
        characterGroup.add(rightEye);
        
        // Create arms
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
        const armMaterial = new THREE.MeshStandardMaterial({ color: skinTone });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.5, 0.8, 0);
        leftArm.rotation.z = 0.3;
        characterGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.5, 0.8, 0);
        rightArm.rotation.z = -0.3;
        characterGroup.add(rightArm);
        
        // Create hands
        const handGeometry = new THREE.SphereGeometry(0.06, 6, 6);
        const handMaterial = new THREE.MeshStandardMaterial({ color: skinTone });
        
        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.65, 0.4, 0.1);
        characterGroup.add(leftHand);
        
        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.65, 0.4, 0.1);
        characterGroup.add(rightHand);
        
        // Create legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F }); // Dark pants
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15, -0.4, 0);
        characterGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15, -0.4, 0);
        characterGroup.add(rightLeg);
        
        // Create feet
        const footGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.25);
        const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black shoes
        
        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(-0.15, -0.84, 0.05);
        characterGroup.add(leftFoot);
        
        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.15, -0.84, 0.05);
        characterGroup.add(rightFoot);
        
        // Store references for animation
        characterGroup.userData = {
            body: body,
            head: head,
            leftArm: leftArm,
            rightArm: rightArm,
            leftLeg: leftLeg,
            rightLeg: rightLeg,
            leftHand: leftHand,
            rightHand: rightHand
        };
        
        return characterGroup;
    }
    
    getClothingColorForType(type) {
        switch(type) {
            case 'police':
                return 0x000080; // Navy blue
            case 'criminal':
                return 0x800000; // Dark red
            default:
                return this.clothingColors[Math.floor(Math.random() * this.clothingColors.length)];
        }
    }
    
    getRandomSkinTone() {
        return this.skinTones[Math.floor(Math.random() * this.skinTones.length)];
    }
    
    getRandomHairColor() {
        return this.hairColors[Math.floor(Math.random() * this.hairColors.length)];
    }
    
    getRandomEyeColor() {
        return this.eyeColors[Math.floor(Math.random() * this.eyeColors.length)];
    }
    
    generateCharacterName(type) {
        const names = {
            civilian: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson'],
            police: ['Officer Martinez', 'Detective Brown', 'Sergeant Davis'],
            criminal: ['Tony Romano', 'Vincent Kane', 'Marco Rossi']
        };
        
        const typeNames = names[type] || names.civilian;
        return typeNames[Math.floor(Math.random() * typeNames.length)];
    }
}

// Make CharacterDesign globally available
window.CharacterDesign = CharacterDesign;
console.log("CharacterDesign.js loaded successfully");
