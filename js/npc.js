class NPC {
    constructor(scene, world, position, type = 'civilian') {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 0, y: 0, z: 0 };
        this.type = type;
        
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.isHostile = false;
        this.alertRadius = 10;
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        
        // Add walking animation properties
        this.isWalking = true;
        this.walkSpeed = 0.8;
        this.walkRadius = 8; // Radius of circular walking pattern
        this.walkAngle = Math.random() * Math.PI * 2; // Random starting angle
        this.walkCenter = { x: position.x, z: position.z }; // Center of walking circle
        this.lastPositionUpdate = 0;
        
        // Dialogue interaction properties
        this.canTalk = true;
        this.dialogueCooldown = 0;
        this.lastInteractionTime = 0;
        this.conversationCount = 0; // Track how many times player has talked to this NPC
        this.mood = 'neutral'; // Current mood affects dialogue options
        this.personality = this.generatePersonality(type); // Unique personality traits
        
        // Enhanced visual distinction properties
        this.visualTheme = this.generateVisualTheme(type);
        
        // Use character design system
        this.characterDesign = new CharacterDesign();
        this.name = this.characterDesign.generateCharacterName(type);
        
        console.log(`${type} NPC created: ${this.name} - ${this.visualTheme.description}`);
    }
    
    generateVisualTheme(type) {
        const themes = {
            civilian: {
                description: 'friendly civilian',
                bodyColor: 0x4A90E2, // Friendly blue
                headColor: 0xDDB592, // Natural skin tone
                clothingColor: 0x2E8B57, // Sea green clothing
                accentColor: 0xFFD700, // Gold accents
                height: 1.5,
                build: 'normal',
                accessory: 'hat'
            },
            criminal: {
                description: 'suspicious criminal',
                bodyColor: 0x8B0000, // Dark red
                headColor: 0xD2B48C, // Tan skin
                clothingColor: 0x2F2F2F, // Dark clothing
                accentColor: 0xFF4500, // Orange red accents
                height: 1.6,
                build: 'broad',
                accessory: 'sunglasses'
            },
            police: {
                description: 'police officer',
                bodyColor: 0x000080, // Navy blue uniform
                headColor: 0xDDB592, // Natural skin
                clothingColor: 0x4169E1, // Royal blue
                accentColor: 0xC0C0C0, // Silver badge
                height: 1.7,
                build: 'fit',
                accessory: 'badge'
            }
        };
        
        return themes[type] || themes.civilian;
    }
    
    init() {
        this.createCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        console.log(`${this.type} NPC created:`, this.name);
    }
    
    createCharacter() {
        try {
            console.log(`Creating enhanced ${this.type} character: ${this.name}`);
            
            // Create main character group
            this.group = new THREE.Group();
            
            // Enhanced character creation with visual themes
            this.createEnhancedCharacterBody();
            this.addDistinctiveFeatures();
            this.addTypeSpecificAccessories();
            
            // Position the group
            this.group.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh = this.group;
            
            console.log(`Enhanced ${this.type} character created successfully: ${this.name}`);
        } catch (error) {
            console.error(`Error creating ${this.type} character:`, error);
            this.createSimpleFallbackCharacter();
        }
    }
    
    createEnhancedCharacterBody() {
        const theme = this.visualTheme;
        
        // Enhanced body with theme colors
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, theme.height, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.bodyColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = theme.height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        
        // Enhanced head with proper positioning
        const headGeometry = new THREE.SphereGeometry(0.28, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.headColor,
            metalness: 0.0,
            roughness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = theme.height + 0.5; // Proper head positioning above body
        head.castShadow = true;
        head.receiveShadow = true;
        this.group.add(head);
        
        // Add facial features for better identification
        this.addFacialFeatures(head, theme);
        
        // Enhanced legs with theme styling
        this.addStyledLegs(theme);
        
        // Add clothing details
        this.addClothingDetails(theme);
    }
    
    addFacialFeatures(head, theme) {
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 0.05, 0.22);
        head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 0.05, 0.22);
        head.add(rightEye);
        
        // Nose
        const noseGeometry = new THREE.SphereGeometry(0.03, 6, 6);
        const noseMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(theme.headColor).multiplyScalar(0.9) 
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, -0.02, 0.25);
        head.add(nose);
        
        // Mouth indicator
        const mouthGeometry = new THREE.SphereGeometry(0.02, 6, 6);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.08, 0.23);
        head.add(mouth);
    }
    
    addStyledLegs(theme) {
        // Enhanced cone legs with theme colors
        const legGeometry = new THREE.ConeGeometry(0.18, 0.9, 10);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(theme.clothingColor).multiplyScalar(0.8),
            metalness: 0.2,
            roughness: 0.7
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0.45, 0);
        leftLeg.rotation.x = Math.PI;
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0.45, 0);
        rightLeg.rotation.x = Math.PI;
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.group.add(rightLeg);
    }
    
    addClothingDetails(theme) {
        // Add a chest piece for clothing detail
        const chestGeometry = new THREE.CylinderGeometry(0.25, 0.28, 0.4, 12);
        const chestMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.clothingColor,
            metalness: 0.0,
            roughness: 0.9
        });
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        chest.position.y = theme.height * 0.8;
        chest.castShadow = true;
        chest.receiveShadow = true;
        this.group.add(chest);
    }
    
    addDistinctiveFeatures() {
        const theme = this.visualTheme;
        
        switch(this.type) {
            case 'civilian':
                this.addCivilianFeatures(theme);
                break;
            case 'criminal':
                this.addCriminalFeatures(theme);
                break;
            case 'police':
                this.addPoliceFeatures(theme);
                break;
        }
    }
    
    addCivilianFeatures(theme) {
        // Friendly hat
        const hatGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12);
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.accentColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = theme.height + 0.8;
        hat.castShadow = true;
        this.group.add(hat);
        
        // Friendly badge/button
        const buttonGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const buttonMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.accentColor,
            metalness: 0.8,
            roughness: 0.2
        });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, theme.height * 0.9, 0.3);
        button.castShadow = true;
        this.group.add(button);
        
        console.log(`Added civilian features for ${this.name}`);
    }
    
    addCriminalFeatures(theme) {
        // Dark sunglasses
        const glassesGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.05);
        const glassesMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.1
        });
        const glasses = new THREE.Mesh(glassesGeometry, glassesMaterial);
        glasses.position.set(0, theme.height + 0.55, 0.22);
        glasses.castShadow = true;
        this.group.add(glasses);
        
        // Weapon holster indication
        const holsterGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.05);
        const holsterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F2F2F,
            metalness: 0.4,
            roughness: 0.6
        });
        const holster = new THREE.Mesh(holsterGeometry, holsterMaterial);
        holster.position.set(0.4, theme.height * 0.7, 0);
        holster.castShadow = true;
        this.group.add(holster);
        
        console.log(`Added criminal features for ${this.name}`);
    }
    
    addPoliceFeatures(theme) {
        // Police badge
        const badgeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const badgeMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.accentColor,
            metalness: 0.9,
            roughness: 0.1
        });
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.position.set(-0.25, theme.height * 0.85, 0.25);
        badge.castShadow = true;
        this.group.add(badge);
        
        // Police hat
        const hatGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.15, 12);
        const hatMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.bodyColor,
            metalness: 0.2,
            roughness: 0.7
        });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = theme.height + 0.82;
        hat.castShadow = true;
        this.group.add(hat);
        
        // Hat badge
        const hatBadgeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const hatBadgeMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.accentColor,
            metalness: 1.0,
            roughness: 0.0
        });
        const hatBadge = new THREE.Mesh(hatBadgeGeometry, hatBadgeMaterial);
        hatBadge.position.set(0, theme.height + 0.87, 0.28);
        hatBadge.castShadow = true;
        this.group.add(hatBadge);
        
        console.log(`Added police features for ${this.name}`);
    }
    
    addTypeSpecificAccessories() {
        // This method is called from addAccessories() in the existing code
        switch(this.type) {
            case 'civilian':
                // Add civilian-specific accessories if needed
                break;
            case 'criminal':
                // Add criminal-specific accessories if needed
                break;
            case 'police':
                // Add police-specific accessories if needed
                break;
        }
    }
    
    createSimpleFallbackCharacter() {
        // Simple fallback character in case detailed creation fails
        this.group = new THREE.Group();
        
        // Simple body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5568 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        this.group.add(body);
        
        // Simple head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xDDB592 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        this.group.add(head);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh = this.group;
        
        console.log(`Created fallback character for ${this.name}`);
    }
    
    addConeLegs() {
        // Create cone legs (upside down cones - larger size)
        const legGeometry = new THREE.ConeGeometry(0.15, 0.8, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x222222,
            metalness: 0.4,
            roughness: 0.6
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.2, 0.4, 0);
        leftLeg.rotation.x = Math.PI; // Flip upside down
        leftLeg.castShadow = true;
        this.group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.2, 0.4, 0);
        rightLeg.rotation.x = Math.PI; // Flip upside down
        rightLeg.castShadow = true;
        this.group.add(rightLeg);
    }
    
    addAccessories() {
        switch(this.type) {
            case 'police':
                // Police badge (small cylinder)
                const badgeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8);
                const badgeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xffd700,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
                badge.position.set(0.25, 1.2, 0.35);
                badge.rotation.x = Math.PI / 2;
                this.group.add(badge);
                break;
                
            case 'criminal':
                // Criminal tattoo/marking (dark cylinder on arm)
                const markGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6);
                const markMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
                const mark = new THREE.Mesh(markGeometry, markMaterial);
                mark.position.set(0.45, 1.0, 0);
                mark.rotation.z = Math.PI / 2;
                this.group.add(mark);
                break;
        }
    }
    
    createPhysicsBody() {
        try {
            // Create physics body that matches character height and scale
            const characterScale = this.characterDesign ? this.characterDesign.npcScale || 1.8 : 1.8;
            const shape = new CANNON.Cylinder(0.4, 0.4, 1.6, 12);
            
            this.body = new CANNON.Body({ 
                mass: 70,
                material: new CANNON.Material({ 
                    friction: 0.3,
                    restitution: 0.1
                }),
                fixedRotation: true,
                allowSleep: false
            });
            
            this.body.addShape(shape);
            // Position physics body to match visual character height
            this.body.position.set(
                this.position.x, 
                this.position.y + (0.8 * characterScale), 
                this.position.z
            );
            
            this.world.addBody(this.body);
            console.log(`Physics body created for ${this.name} with scale ${characterScale}`);
        } catch (error) {
            console.error(`Error creating physics body for ${this.name}:`, error);
        }
    }
    
    update(playerPosition, delta) {
        if (this.isDead) return;
        
        // Update walking animation
        this.updateWalkingAnimation(delta);
        
        // Update mesh position to match physics body with proper offset
        if (this.body && this.group) {
            this.group.position.copy(this.body.position);
            // Adjust for character scale and center offset
            const characterScale = this.characterDesign ? this.characterDesign.npcScale || 1.8 : 1.8;
            this.group.position.y -= (0.8 * characterScale);
        }
        
        // Check for player interaction with improved distance checking
        if (playerPosition && window.game && window.game.dialogueSystem) {
            const distance = this.getDistanceToPlayer(playerPosition);
            
            // Show interaction prompt when player is close
            if (distance < 4 && this.canTalk && !window.game.dialogueSystem.isActive) {
                window.game.dialogueSystem.showInteractionPrompt(this);
                
                // Store reference for interaction
                window.currentInteractableNPC = this;
            } else if (distance > 4 && window.currentInteractableNPC === this) {
                window.game.dialogueSystem.hideInteractionPrompt();
                window.currentInteractableNPC = null;
            }
        }
        
        // Simple AI behavior if hostile
        if (this.isHostile && playerPosition) {
            this.hostileBehavior(playerPosition, delta);
        }
        
        // Update dialogue cooldown
        if (this.dialogueCooldown > 0) {
            this.dialogueCooldown -= delta * 1000;
        }
        
        // Update health bar visibility
        this.checkHealthBarVisibility();
    }
    
    updateWalkingAnimation(delta) {
        if (!this.isWalking || this.isHostile || this.isDead) return;
        
        const now = Date.now();
        if (now - this.lastPositionUpdate < 50) return; // Throttle updates
        this.lastPositionUpdate = now;
        
        // Update walking angle for circular movement
        this.walkAngle += delta * this.walkSpeed;
        
        // Calculate new position in circle
        const targetX = this.walkCenter.x + Math.cos(this.walkAngle) * this.walkRadius;
        const targetZ = this.walkCenter.z + Math.sin(this.walkAngle) * this.walkRadius;
        
        // Move physics body toward target position
        if (this.body) {
            const currentX = this.body.position.x;
            const currentZ = this.body.position.z;
            
            // Calculate movement direction
            const dirX = targetX - currentX;
            const dirZ = targetZ - currentZ;
            const distance = Math.sqrt(dirX * dirX + dirZ * dirZ);
            
            if (distance > 0.1) {
                // Normalize and apply movement
                const moveSpeed = 2.0;
                this.body.velocity.x = (dirX / distance) * moveSpeed;
                this.body.velocity.z = (dirZ / distance) * moveSpeed;
                
                // Make NPC face movement direction
                const angle = Math.atan2(dirX, dirZ);
                this.group.rotation.y = angle;
                
                // Trigger walking animation if character design supports it
                if (this.characterDesign && this.characterDesign.animateCharacter) {
                    this.characterDesign.animateCharacter(this.group, 'walk');
                }
            } else {
                // Stop movement when close to target
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
                
                // Trigger idle animation
                if (this.characterDesign && this.characterDesign.animateCharacter) {
                    this.characterDesign.animateCharacter(this.group, 'idle');
                }
            }
        }
    }
    
    generatePersonality(type) {
        const personalities = {
            civilian: ['friendly', 'nervous', 'chatty', 'suspicious', 'helpful', 'grumpy', 'optimistic'],
            criminal: ['cocky', 'paranoid', 'aggressive', 'cunning', 'boastful', 'secretive', 'sarcastic'],
            police: ['professional', 'tired', 'suspicious', 'friendly', 'by-the-book', 'cynical', 'helpful']
        };
        
        const typePersonalities = personalities[type] || personalities.civilian;
        return typePersonalities[Math.floor(Math.random() * typePersonalities.length)];
    }
    
    // Method to start dialogue interaction
    startDialogue() {
        if (!this.canTalk || this.dialogueCooldown > 0 || this.isDead) {
            console.log(`Cannot talk to ${this.name}: cooldown or dead`);
            return false;
        }
        
        if (window.game && window.game.dialogueSystem) {
            console.log(`Starting dialogue with ${this.name} (${this.type}) - Conversation #${this.conversationCount + 1}`);
            
            // Stop walking during dialogue
            this.isWalking = false;
            if (this.body) {
                this.body.velocity.x = 0;
                this.body.velocity.z = 0;
            }
            
            // Increment conversation count
            this.conversationCount++;
            
            // Update mood based on previous interactions and personality
            this.updateMoodForConversation();
            
            // Start dialogue
            window.game.dialogueSystem.startDialogue(this);
            
            // Set cooldown to prevent spam (shorter for more natural conversation)
            this.dialogueCooldown = 2000; // 2 second cooldown
            this.lastInteractionTime = Date.now();
            
            return true;
        }
        
        console.error("Dialogue system not available");
        return false;
    }
    
    updateMoodForConversation() {
        // Adjust mood based on personality and previous interactions
        if (this.conversationCount > 3) {
            // NPC gets more familiar/annoyed with repeated conversations
            switch(this.personality) {
                case 'friendly':
                case 'chatty':
                    this.mood = 'familiar';
                    break;
                case 'grumpy':
                case 'suspicious':
                    this.mood = 'annoyed';
                    break;
                case 'nervous':
                    this.mood = 'anxious';
                    break;
                default:
                    this.mood = 'neutral';
            }
        } else if (this.conversationCount > 1) {
            switch(this.personality) {
                case 'friendly':
                    this.mood = 'warming_up';
                    break;
                case 'suspicious':
                    this.mood = 'cautious';
                    break;
                case 'chatty':
                    this.mood = 'excited';
                    break;
                default:
                    this.mood = 'neutral';
            }
        }
        
        // Random mood variations for more variety
        if (Math.random() < 0.2) {
            const randomMoods = ['tired', 'energetic', 'confused', 'amused'];
            this.mood = randomMoods[Math.floor(Math.random() * randomMoods.length)];
        }
    }
    
    // Method called when dialogue ends
    endDialogue() {
        console.log(`Dialogue ended with ${this.name} (Total conversations: ${this.conversationCount})`);
        
        // Resume walking after a short delay
        setTimeout(() => {
            if (!this.isHostile && !this.isDead) {
                this.isWalking = true;
                console.log(`${this.name} resumes walking`);
            }
        }, 1000);
    }
    
    becomeHostile() {
        if (this.isHostile) return;
        
        this.isHostile = true;
        this.isWalking = false; // Stop walking when hostile
        console.log(`${this.name} becomes hostile!`);
        
        // Change appearance to show hostility (red tint) with null checks
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                try {
                    child.material.emissive = new THREE.Color(0x440000);
                } catch (error) {
                    console.warn("Error applying hostile effect:", error);
                }
            }
        });
    }
    
    takeDamage(damage, bodyPart = 'body') {
        if (this.isDead) return false;
        
        // Apply body part specific damage multipliers
        let finalDamage = damage;
        let hitDescription = '';
        
        switch(bodyPart) {
            case 'head':
                finalDamage = 40; // Always 40 for headshots
                hitDescription = 'HEADSHOT';
                break;
            case 'chest':
                finalDamage = 40; // Always 40 for chest shots
                hitDescription = 'CHEST HIT';
                break;
            case 'arm':
                finalDamage = 25; // Always 25 for arm shots
                hitDescription = 'ARM HIT';
                break;
            case 'leg':
                finalDamage = 25; // Always 25 for leg shots
                hitDescription = 'LEG HIT';
                break;
            default:
                finalDamage = damage; // Use original damage for unknown parts
                hitDescription = 'BODY HIT';
        }
        
        this.health -= finalDamage;
        console.log(`${this.name} takes ${finalDamage} ${hitDescription} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Update health bar immediately
        this.updateHealthBar();
        
        // Visual damage effect with null checks
        this.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                try {
                    child.material.emissive.setHex(0x440000);
                    setTimeout(() => {
                        if (!this.isDead && child.material && child.material.emissive) {
                            child.material.emissive.setHex(0x000000);
                        }
                    }, 200);
                } catch (error) {
                    console.warn("Error applying damage effect:", error);
                }
            }
        });
        
        if (this.health <= 0) {
            this.die();
            return true; // Killed
        }
        
        // Become hostile when shot
        if (!this.isHostile) {
            this.becomeHostile();
        }
        
        return false; // Not killed
    }
    
    createHealthBar() {
        if (!this.isEnemy || this.healthBarGroup) return;
        
        // Create health bar container
        this.healthBarGroup = new THREE.Group();
        
        // Background bar (red)
        const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x441111,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarGroup.add(this.healthBarBg);
        
        // Health bar (green to red gradient)
        const healthGeometry = new THREE.PlaneGeometry(1.0, 0.1);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x44ff44,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.z = 0.001; // Slightly in front
        this.healthBarGroup.add(this.healthBar);
        
        // Position health bar above enemy
        this.healthBarGroup.position.set(0, 2.5, 0);
        this.group.add(this.healthBarGroup);
        
        // Store original scale for visibility management
        this.healthBarOriginalScale = this.healthBarGroup.scale.clone();
        
        console.log(`Health bar created for enemy: ${this.name}`);
    }
    
    updateHealthBar() {
        if (!this.healthBar || !this.isEnemy) return;
        
        const healthPercent = Math.max(0, this.health / this.maxHealth);
        
        // Update health bar width
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -(1.0 - healthPercent) * 0.5; // Align to left
        
        // Update color based on health
        if (healthPercent > 0.6) {
            this.healthBar.material.color.setHex(0x44ff44); // Green
        } else if (healthPercent > 0.3) {
            this.healthBar.material.color.setHex(0xffff44); // Yellow
        } else {
            this.healthBar.material.color.setHex(0xff4444); // Red
        }
        
        // Make health bar face camera
        if (window.game && window.game.camera && this.healthBarGroup) {
            this.healthBarGroup.lookAt(window.game.camera.position);
        }
    }
    
    checkHealthBarVisibility() {
        if (!this.healthBarGroup || !this.isEnemy || this.isDead) return;
        
        // Check distance from player
        if (window.game && window.game.player && window.game.player.body) {
            const playerPos = window.game.player.body.position;
            const enemyPos = this.body.position;
            const distance = Math.sqrt(
                Math.pow(playerPos.x - enemyPos.x, 2) + 
                Math.pow(playerPos.z - enemyPos.z, 2)
            );
            
            // Hide health bar if too far
            if (distance > 50) {
                this.healthBarGroup.visible = false;
                return;
            }
        }
        
        // Check for nearby enemies to avoid overlapping health bars
        let nearbyEnemyCount = 0;
        const thisPos = this.body.position;
        
        if (window.game && window.game.npcManager) {
            window.game.npcManager.enemies.forEach(enemy => {
                if (enemy !== this && !enemy.isDead && enemy.body) {
                    const otherPos = enemy.body.position;
                    const distance = Math.sqrt(
                        Math.pow(thisPos.x - otherPos.x, 2) + 
                        Math.pow(thisPos.z - otherPos.z, 2)
                    );
                    
                    if (distance < 3) { // Within 3 units
                        nearbyEnemyCount++;
                    }
                }
            });
        }
        
        // Hide health bars if too many enemies are clustered
        if (nearbyEnemyCount >= 2) {
            this.healthBarGroup.visible = false;
        } else {
            this.healthBarGroup.visible = true;
            this.healthBarGroup.scale.copy(this.healthBarOriginalScale);
        }
    }
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.health = 0;
        console.log(`${this.name} has been eliminated!`);
        
        // Hide health bar immediately
        if (this.healthBarGroup) {
            this.healthBarGroup.visible = false;
        }
        
        // Death animation - fall over
        this.group.rotation.z = Math.PI / 2;
        this.group.position.y -= 0.5;
        
        // Change color to indicate death with proper null checks
        this.group.traverse((child) => {
            if (child.isMesh && child.material) {
                try {
                    if (child.material.color) {
                        child.material.color.multiplyScalar(0.3);
                    }
                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x000000);
                    }
                } catch (error) {
                    console.warn("Error applying death effect:", error);
                }
            }
        });
        
        // Remove physics body
        if (this.body && this.world) {
            this.world.removeBody(this.body);
        }
        
        // Notify mission manager if this was an enemy
        if (this.isEnemy && window.game && window.game.missionManager) {
            window.game.missionManager.enemyEliminated();
        }
        
        // Remove from scene after a delay
        setTimeout(() => {
            if (this.scene && this.group && this.group.parent) {
                this.scene.remove(this.group);
            }
        }, 5000);
    }
    
    hostileBehavior(playerPosition, delta) {
        const distance = this.getDistanceToPlayer(playerPosition);
        
        if (distance < 15) {
            // Move towards player
            const direction = new THREE.Vector3(
                playerPosition.x - this.body.position.x,
                0,
                playerPosition.z - this.body.position.z
            ).normalize();
            
            const speed = 2;
            this.body.velocity.x = direction.x * speed;
            this.body.velocity.z = direction.z * speed;
            
            // Face player
            const angle = Math.atan2(direction.x, direction.z);
            this.group.rotation.y = angle;
            
            if (distance < 2) {
                // Attack player
                console.log(`${this.name} attacks the player!`);
                this.attackPlayer();
            }
        }
        
        // Update health bar visibility during hostile behavior
        if (this.isEnemy) {
            this.checkHealthBarVisibility();
        }
    }
    
    attackPlayer() {
        // NPC melee attack
        if (window.game && window.game.playerTakeDamage) {
            const damage = 15; // NPCs do less damage than enemies
            window.game.playerTakeDamage(damage);
            console.log(`${this.name} attacks player for ${damage} damage!`);
        }
    }
    
    getDistanceToPlayer(playerPosition) {
        return Math.sqrt(
            Math.pow(playerPosition.x - this.body.position.x, 2) +
            Math.pow(playerPosition.z - this.body.position.z, 2)
        );
    }
}

class Enemy {
    constructor(scene, world, position) {
        this.scene = scene;
        this.world = world;
        this.position = position || { x: 0, y: 0, z: 0 };
        this.type = 'enemy';
        
        this.mesh = null;
        this.body = null;
        this.group = new THREE.Group();
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        this.isEnemy = true; // Important identifier
        
        // Enhanced enemy visual theme
        this.visualTheme = {
            description: 'dangerous enemy operative',
            bodyColor: 0x8B0000, // Dark red
            headColor: 0x696969, // Dark gray skin
            clothingColor: 0x000000, // Black tactical gear
            accentColor: 0xFF0000, // Bright red accents
            height: 1.8, // Taller than civilians
            build: 'muscular',
            accessory: 'tactical_gear'
        };
        
        // AI and combat properties
        this.alertRadius = 15;
        this.detectionRange = 20;
        this.shootRange = 25;
        this.lastShotTime = 0;
        this.shotCooldown = 1000;
        
        this.state = 'patrol';
        this.target = null;
        this.isHostile = true;
        this.moveSpeed = 3;
        
        // Generate enemy name
        this.name = this.generateEnemyName();
        
        console.log(`Enhanced enemy created: ${this.name} - ${this.visualTheme.description}`);
    }
    
    generateEnemyName() {
        const names = [
            "Alpha", "Bravo", "Charlie", "Delta", 
            "Echo", "Foxtrot", "Golf", "Hotel",
            "India", "Juliet", "Kilo", "Lima"
        ];
        return names[Math.floor(Math.random() * names.length)] + "-" + Math.floor(Math.random() * 100);
    }

    init() {
        this.createEnemyCharacter();
        this.createPhysicsBody();
        this.scene.add(this.group);
        
        // Initialize patrol route with multiple points
        this.generatePatrolRoute();
        
        // Register with animation manager if available
        if (window.game && window.game.animationManager) {
            this.animationManager = window.game.animationManager;
            this.animationManager.registerEnemy(this);
        }
        
        console.log("Enemy created at position:", this.position);
        console.log("Patrol route generated with", this.patrolPoints.length, "points");
    }
    
    createEnemyCharacter() {
        try {
            console.log(`Creating enhanced enemy character: ${this.name}`);
            
            this.group = new THREE.Group();
            
            // Create distinctive enemy appearance
            this.createTacticalBody();
            this.addTacticalGear();
            this.addEnemyIdentifiers();
            
            this.group.position.set(this.position.x, this.position.y, this.position.z);
            this.mesh = this.group;
            
            console.log(`Enhanced enemy character created: ${this.name}`);
        } catch (error) {
            console.error(`Error creating enemy character:`, error);
            this.createFallbackEnemyCharacter();
        }
    }
    
    createTacticalBody() {
        const theme = this.visualTheme;
        
        // Larger, more intimidating body
        const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.4, theme.height, 12);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.bodyColor,
            metalness: 0.3,
            roughness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = theme.height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        
        // Menacing head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.headColor,
            metalness: 0.1,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = theme.height + 0.55; // Proper positioning
        head.castShadow = true;
        head.receiveShadow = true;
        this.group.add(head);
        
        // Add menacing facial features
        this.addEnemyFacialFeatures(head, theme);
        
        // Tactical legs
        this.addTacticalLegs(theme);
    }
    
    addEnemyFacialFeatures(head, theme) {
        // Red glowing eyes for identification
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF0000,
            emissive: 0x330000,
            metalness: 0.0,
            roughness: 0.3
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 0.05, 0.25);
        head.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 0.05, 0.25);
        head.add(rightEye);
        
        // Scar or tactical face paint
        const scarGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.01);
        const scarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B0000,
            metalness: 0.0,
            roughness: 1.0
        });
        const scar = new THREE.Mesh(scarGeometry, scarMaterial);
        scar.position.set(0.12, 0.0, 0.24);
        scar.rotation.z = Math.PI / 6;
        head.add(scar);
    }
    
    addTacticalLegs(theme) {
        // Heavy tactical boots/legs
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.0, 12);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.clothingColor,
            metalness: 0.4,
            roughness: 0.5
        });
        
        // Left leg
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.22, 0.5, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.group.add(leftLeg);
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.22, 0.5, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.group.add(rightLeg);
    }
    
    addTacticalGear() {
        const theme = this.visualTheme;
        
        // Tactical vest
        const vestGeometry = new THREE.CylinderGeometry(0.32, 0.37, 0.6, 12);
        const vestMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.clothingColor,
            metalness: 0.5,
            roughness: 0.4
        });
        const vest = new THREE.Mesh(vestGeometry, vestMaterial);
        vest.position.y = theme.height * 0.75;
        vest.castShadow = true;
        vest.receiveShadow = true;
        this.group.add(vest);
        
        // Weapon attachment
        const weaponGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const weaponMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2F2F2F,
            metalness: 0.8,
            roughness: 0.2
        });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.4, theme.height * 0.8, 0);
        weapon.castShadow = true;
        this.group.add(weapon);
    }
    
    addEnemyIdentifiers() {
        const theme = this.visualTheme;
        
        // Red identification stripe
        const stripeGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.02);
        const stripeMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.accentColor,
            emissive: 0x220000,
            metalness: 0.0,
            roughness: 0.5
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, theme.height * 0.9, 0.32);
        stripe.castShadow = true;
        this.group.add(stripe);
        
        // Tactical helmet
        const helmetGeometry = new THREE.SphereGeometry(0.32, 12, 8);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: theme.clothingColor,
            metalness: 0.6,
            roughness: 0.3
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = theme.height + 0.6;
        helmet.scale.y = 0.8; // Flatten slightly for helmet look
        helmet.castShadow = true;
        this.group.add(helmet);
        
        console.log(`Added enemy identifiers for ${this.name}`);
    }
}

class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = [];
        this.enemies = [];
        this.citySize = 400;
        this.currentLevel = 1;
    }
    
    spawnCityNPCs() {
        console.log("Spawning NPCs across the city...");
        
        // Spawn more civilians (15-20)
        const civilianCount = 15 + Math.floor(Math.random() * 6);
        for (let i = 0; i < civilianCount; i++) {
            const position = this.getRandomCityPosition();
            const civilian = new NPC(this.scene, this.world, position, 'civilian');
            civilian.init();
            this.npcs.push(civilian);
        }
        
        // Spawn criminals (8-12) - Fixed syntax error
        const criminalCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < criminalCount; i++) {
            const position = this.getRandomCityPosition();
            const criminal = new NPC(this.scene, this.world, position, 'criminal');
            criminal.init();
            this.npcs.push(criminal);
        }
        
        // Spawn police (only 3-5, as requested)
        const policeCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < policeCount; i++) {
            const position = this.getRandomCityPosition();
            const police = new NPC(this.scene, this.world, position, 'police');
            police.init();
            this.npcs.push(police);
        }
        
        console.log(`Spawned ${this.npcs.length} NPCs across the city`);
    }
    
    getRandomCityPosition() {
        // Generate random position within city bounds, avoiding buildings
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: (Math.random() - 0.5) * (this.citySize - 50),
                y: 0,
                z: (Math.random() - 0.5) * (this.citySize - 50)
            };
            attempts++;
        } while (attempts < 10); // Prevent infinite loop
        
        return position;
    }
    
    spawnEnemiesNearParks() {
        // Get park locations from environment
        const environment = window.game.environment;
        if (!environment) {
            console.warn("Environment not available for enemy spawning");
            return this.spawnEnemiesRandomly();
        }
        
        const parkLocations = environment.getParkLocations();
        
        if (!parkLocations || parkLocations.length === 0) {
            console.warn("No park locations found, spawning enemies randomly");
            return this.spawnEnemiesRandomly();
        }
        
        const enemyCount = Math.min(10, Math.max(6, parkLocations.length * 2)); // 6-10 enemies
        
        console.log(`Spawning ${enemyCount} enemies near ${parkLocations.length} parks`);
        
        for (let i = 0; i < enemyCount; i++) {
            const parkIndex = i % parkLocations.length;
            const parkLocation = parkLocations[parkIndex];
            
            // Spawn on roads near parks, not inside parks
            const enemyPosition = this.getPositionNearPark(parkLocation);
            
            if (enemyPosition) {
                const enemy = new Enemy(this.scene, this.world, enemyPosition);
                this.enemies.push(enemy);
                
                console.log(`Enemy ${i + 1} spawned near park at (${enemyPosition.x.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
            }
        }
        
        // Start mission with enemy count
        if (window.game && window.game.missionManager) {
            window.game.missionManager.startMission(this.enemies.length);
        }
        
        return this.enemies.length;
    }
    
    spawnUndercoverNPCs() {
        console.log("Spawning undercover NPCs for mission...");
        
        // This method should call the city-wide NPC spawning
        this.spawnCityNPCs();
        
        console.log(`Undercover NPCs spawned: ${this.npcs.length} total NPCs in the city`);
        
        // Log NPC distribution for debugging
        const npcTypes = {};
        this.npcs.forEach(npc => {
            npcTypes[npc.type] = (npcTypes[npc.type] || 0) + 1;
        });
        
        console.log("NPC Distribution:", npcTypes);
        
        return this.npcs.length;
    }
    
    getPositionNearPark(parkLocation) {
        // Generate positions on roads near parks (not inside parks)
        const attempts = 10;
        
        for (let attempt = 0; attempt < attempts; attempt++) {
            // Choose a direction from the park
            const angle = (Math.PI * 2 * attempt) / attempts; // Spread around park
            const distance = 25 + Math.random() * 35; // 25-60 units from park
            
            const position = {
                x: parkLocation.x + Math.cos(angle) * distance,
                y: 0,
                z: parkLocation.z + Math.sin(angle) * distance
            };
            
            // Ensure position is within city bounds
            const cityHalf = this.citySize / 2;
            if (Math.abs(position.x) < cityHalf - 20 && Math.abs(position.z) < cityHalf - 20) {
                console.log(`Enemy position near park: distance ${distance.toFixed(1)} units, angle ${(angle * 180 / Math.PI).toFixed(0)}°`);
                return position;
            }
        }
        
        // Fallback to random position near park center
        console.warn("Could not find suitable position near park, using fallback");
        return {
            x: parkLocation.x + (Math.random() - 0.5) * 40,
            y: 0,
            z: parkLocation.z + (Math.random() - 0.5) * 40
        };
    }
    
    spawnEnemiesRandomly() {
        // Fallback method if parks not available
        const enemyCount = 8;
        console.log(`Spawning ${enemyCount} enemies randomly (fallback)`);
        
        for (let i = 0; i < enemyCount; i++) {
            const position = this.getRandomCityPosition();
            const enemy = new Enemy(this.scene, this.world, position);
            this.enemies.push(enemy);
        }
        
        return enemyCount;
    }
    
    spawnEnemiesInParks() {
        // Updated method name for compatibility
        return this.spawnEnemiesNearParks();
    }
    
    alertNearbyNPCs(position, type) {
        this.npcs.forEach(npc => {
            if (npc.type === type || (type === 'criminal' && npc.type === 'criminal')) {
                const distance = Math.sqrt(
                    Math.pow(position.x - npc.position.x, 2) +
                    Math.pow(position.z - npc.position.z, 2)
                );
                
                if (distance < npc.alertRadius) {
                    npc.becomeHostile();
                }
            }
        });
    }
    
    update(playerPosition, delta) {
        this.npcs.forEach(npc => npc.update(playerPosition, delta));
        
        // Update enemies with player position
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                enemy.update(playerPosition, delta);
            }
        });
    }
    
    getNearestNPC(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.npcs.forEach(npc => {
            const distance = npc.getDistanceToPlayer(position);
            if (distance < minDistance) {
                nearest = npc;
                minDistance = distance;
            }
        });
        
        return { npc: nearest, distance: minDistance };
    }
    
    getNearestEnemy(position, maxRange) {
        let nearest = null;
        let minDistance = maxRange || Infinity;
        
        this.enemies.forEach(enemy => {
            if (enemy.health > 0) {
                const distance = enemy.getDistanceToPlayer(position);
                if (distance < minDistance) {
                    nearest = enemy;
                    minDistance = distance;
                }
            }
        });
        
        return { enemy: nearest, distance: minDistance };
    }
    
    spawnEnemiesForLevel(level = 1) {
        // Clear existing enemies first
        this.clearEnemies();
        
        // Calculate enemy count based on level (starts low, increases gradually)
        let enemyCount;
        if (level === 1) {
            enemyCount = 3; // Very easy start
        } else if (level === 2) {
            enemyCount = 5;
        } else if (level === 3) {
            enemyCount = 7;
        } else if (level === 4) {
            enemyCount = 9;
        } else {
            enemyCount = Math.min(15, 9 + (level - 4) * 2); // Cap at 15 enemies
        }
        
        console.log(`Spawning ${enemyCount} enemies for level ${level}`);
        
        // Try to get park locations for strategic spawning
        const environment = window.game.environment;
        let spawnPositions = [];
        
        if (environment && environment.getParkLocations) {
            const parkLocations = environment.getParkLocations();
            
            if (parkLocations && parkLocations.length > 0) {
                // Spawn enemies near parks
                for (let i = 0; i < enemyCount; i++) {
                    const parkIndex = i % parkLocations.length;
                    const parkLocation = parkLocations[parkIndex];
                    const enemyPosition = this.getPositionNearPark(parkLocation);
                    spawnPositions.push(enemyPosition);
                }
            } else {
                spawnPositions = this.generateRandomSpawnPositions(enemyCount);
            }
        } else {
            spawnPositions = this.generateRandomSpawnPositions(enemyCount);
        }
        
        // Create enemies at calculated positions
        for (let i = 0; i < enemyCount; i++) {
            const position = spawnPositions[i];
            if (position) {
                const enemy = new Enemy(this.scene, this.world, position);
                this.enemies.push(enemy);
                console.log(`Enemy ${i + 1} spawned at (${position.x.toFixed(1)}, ${position.z.toFixed(1)})`);
            }
        }
        
        // Start mission with enemy count
        if (window.game && window.game.missionManager) {
            window.game.missionManager.startMission(this.enemies.length, level);
        }
        
        this.currentLevel = level;
        console.log(`Level ${level} started with ${this.enemies.length} enemies`);
        
        return this.enemies.length;
    }
    
    generateRandomSpawnPositions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push(this.getRandomCityPosition());
        }
        return positions;
    }
    
    clearEnemies() {
        // Remove existing enemies from scene and physics world
        this.enemies.forEach(enemy => {
            if (enemy.body && this.world) {
                try {
                    this.world.removeBody(enemy.body);
                } catch (error) {
                    console.warn("Error removing enemy physics body:", error);
                }
            }
            if (enemy.group && this.scene) {
                try {
                    this.scene.remove(enemy.group);
                } catch (error) {
                    console.warn("Error removing enemy from scene:", error);
                }
            }
        });
        
        this.enemies = [];
        console.log("All enemies cleared");
    }

    // Keep existing spawnEnemiesNearParks method for compatibility
    spawnEnemiesNearParks() {
        return this.spawnEnemiesForLevel(1);
    }
    
    // ...existing code...
}

// Make classes globally available
window.NPC = NPC;
window.Enemy = Enemy;
window.NPCManager = NPCManager;

// Add global interaction handler for E key
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => {
        if (event.code === 'KeyE' && !event.repeat) {
            // Check if we have an interactable NPC nearby
            if (window.currentInteractableNPC && window.currentInteractableNPC.startDialogue) {
                console.log("E key pressed - attempting interaction");
                event.preventDefault();
                
                // Only interact if not already in dialogue
                if (window.game && window.game.dialogueSystem && !window.game.dialogueSystem.isActive) {
                    window.currentInteractableNPC.startDialogue();
                }
            }
        }
    });
    
    console.log("NPC interaction system initialized - press E near NPCs to talk");
}
