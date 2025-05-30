const Utils = {
    // Random number generator within a range
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Random integer generator within a range
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },
    
    // Distance between two 3D points
    distance: function(p1, p2) {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) +
            Math.pow(p2.y - p1.y, 2) +
            Math.pow(p2.z - p1.z, 2)
        );
    },
    
    // Check if a point is in the camera's view
    isInView: function(position, camera) {
        const frustum = new THREE.Frustum();
        const cameraViewProjectionMatrix = new THREE.Matrix4();
        
        cameraViewProjectionMatrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );
        frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
        
        return frustum.containsPoint(position);
    },
    
    // Load a 3D model
    loadModel: function(path, onLoad, onProgress, onError) {
        const loader = new THREE.GLTFLoader();
        loader.load(
            path,
            onLoad,
            onProgress,
            onError
        );
    },
    
    // Returns a random position on a city block grid
    randomCityPosition: function(gridSize, blockSize) {
        const halfGrid = (gridSize * blockSize) / 2;
        const x = Utils.randomInt(0, gridSize - 1) * blockSize - halfGrid + blockSize / 2;
        const z = Utils.randomInt(0, gridSize - 1) * blockSize - halfGrid + blockSize / 2;
        return { x, z };
    },
    
    // Generate a random color
    randomColor: function() {
        return new THREE.Color(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
    },
    
    // Animation easing functions
    easing: {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    },
    
    // Show element with fade in
    showElement: function(element) {
        element.style.display = 'block';
        element.style.opacity = 0;
        
        let opacity = 0;
        const fadeIn = setInterval(() => {
            if (opacity >= 1) {
                clearInterval(fadeIn);
            }
            element.style.opacity = opacity;
            opacity += 0.05;
        }, 20);
    },
    
    // Hide element with fade out
    hideElement: function(element) {
        let opacity = 1;
        const fadeOut = setInterval(() => {
            if (opacity <= 0) {
                element.style.display = 'none';
                clearInterval(fadeOut);
            }
            element.style.opacity = opacity;
            opacity -= 0.05;
        }, 20);
    },
    
    // Update loading bar progress
    updateLoadingProgress: function(percentage) {
        const progressBar = document.querySelector('.progress-value');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    },
    
    // Create a skybox with blue sky - simplified version to avoid shader issues
    createSkyBox: function(scene) {
        try {
            console.log("Creating simplified blue sky");
            
            // Use a simple color instead of a shader-based sky to avoid compatibility issues
            scene.background = new THREE.Color(0x87CEEB); // Sky blue
            
            // Create a large sky dome with gradient
            const skyGeometry = new THREE.SphereGeometry(500, 16, 16);
            
            // Create a simple gradient material instead of using shaders
            const skyMaterial = new THREE.MeshBasicMaterial({
                color: 0x87CEEB, // Sky blue
                side: THREE.BackSide,
                fog: false
            });
            
            const sky = new THREE.Mesh(skyGeometry, skyMaterial);
            scene.add(sky);
            
            console.log("Sky created successfully");
            return sky;
        } catch (error) {
            console.error("Error creating sky:", error);
            // Return null instead of failing completely
            return null;
        }
    },
    
    // Add simple clouds to the sky - simplified version
    addClouds: function(scene) {
        try {
            console.log("Adding simplified clouds");
            const cloudGroup = new THREE.Group();
            
            // Create a simpler cloud material
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            // Add just a few simple clouds
            for (let i = 0; i < 10; i++) {
                const cloudGeometry = new THREE.SphereGeometry(10, 8, 8);
                const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
                
                // Position clouds in the sky
                cloud.position.set(
                    Math.random() * 400 - 200,
                    Math.random() * 30 + 100,
                    Math.random() * 400 - 200
                );
                
                // Scale the cloud randomly
                const scale = Math.random() * 2 + 1;
                cloud.scale.set(scale, scale * 0.6, scale);
                
                cloudGroup.add(cloud);
            }
            
            scene.add(cloudGroup);
            console.log("Clouds added successfully");
            return cloudGroup;
        } catch (error) {
            console.error("Error adding clouds:", error);
            return new THREE.Group(); // Return empty group on error
        }
    },
    
    // Character physics utilities
    createCharacterPhysics: function(world, position, scale = 1) {
        try {
            // Create torso shape that was missing
            const torsoShape = new CANNON.Cylinder(0.4 * scale, 0.4 * scale, 1.6 * scale, 12);
            
            const torsoBody = new CANNON.Body({
                mass: 70,
                material: new CANNON.Material({
                    friction: 0.8,
                    restitution: 0.0
                }),
                fixedRotation: true,
                allowSleep: false
            });
            torsoBody.addShape(torsoShape);
            torsoBody.position.set(position.x, position.y + 0.8 * scale, position.z);
            world.addBody(torsoBody);

            // Create leg collision bodies for stability
            const legBodies = this.createLegCollisionBodies(world, position, scale);
            
            return {
                mainBody: torsoBody,
                legBodies: legBodies,
                scale: scale
            };
        } catch (error) {
            console.error("Error creating character physics:", error);
            return null;
        }
    },

    createLegCollisionBodies: function(world, position, scale = 1) {
        try {
            const legBodies = [];
            
            // Left leg
            const leftLegShape = new CANNON.Cylinder(0.12 * scale, 0.15 * scale, 1.0 * scale, 8);
            const leftLegBody = new CANNON.Body({
                mass: 0, // Static for stability
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            leftLegBody.addShape(leftLegShape);
            leftLegBody.position.set(position.x - 0.25 * scale, position.y + 0.5 * scale, position.z);
            leftLegBody.userData = { bodyPart: 'leg', damage: 25 }; // Store body part info
            world.addBody(leftLegBody);
            legBodies.push(leftLegBody);
            
            // Right leg
            const rightLegShape = new CANNON.Cylinder(0.12 * scale, 0.15 * scale, 1.0 * scale, 8);
            const rightLegBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            rightLegBody.addShape(rightLegShape);
            rightLegBody.position.set(position.x + 0.25 * scale, position.y + 0.5 * scale, position.z);
            rightLegBody.userData = { bodyPart: 'leg', damage: 25 }; // Store body part info
            world.addBody(rightLegBody);
            legBodies.push(rightLegBody);
            
            return legBodies;
        } catch (error) {
            console.error("Error creating leg collision bodies:", error);
            return [];
        }
    },

    createHeadCollisionBody: function(world, position, scale = 1) {
        try {
            // Head collision body
            const headShape = new CANNON.Sphere(0.25 * scale);
            const headBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            headBody.addShape(headShape);
            headBody.position.set(position.x, position.y + 2.5 * scale, position.z);
            headBody.userData = { bodyPart: 'head', damage: 40 }; // High damage for headshots
            world.addBody(headBody);
            
            console.log(`Head collision body created at height ${position.y + 2.5 * scale}`);
            return headBody;
        } catch (error) {
            console.error("Error creating head collision body:", error);
            return null;
        }
    },

    createChestCollisionBody: function(world, position, scale = 1) {
        try {
            // Chest collision body (torso)
            const chestShape = new CANNON.Cylinder(0.35 * scale, 0.4 * scale, 1.4 * scale, 12);
            const chestBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            chestBody.addShape(chestShape);
            chestBody.position.set(position.x, position.y + 1.6 * scale, position.z);
            chestBody.userData = { bodyPart: 'chest', damage: 40 }; // High damage for chest shots
            world.addBody(chestBody);
            
            console.log(`Chest collision body created at height ${position.y + 1.6 * scale}`);
            return chestBody;
        } catch (error) {
            console.error("Error creating chest collision body:", error);
            return null;
        }
    },

    createArmCollisionBodies: function(world, position, scale = 1) {
        try {
            const armBodies = [];
            
            // Left arm
            const leftArmShape = new CANNON.Cylinder(0.09 * scale, 0.12 * scale, 1.0 * scale, 8);
            const leftArmBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            leftArmBody.addShape(leftArmShape);
            leftArmBody.position.set(position.x - 0.55 * scale, position.y + 1.8 * scale, position.z);
            leftArmBody.userData = { bodyPart: 'arm', damage: 25 }; // Moderate damage for arms
            world.addBody(leftArmBody);
            armBodies.push(leftArmBody);
            
            // Right arm
            const rightArmShape = new CANNON.Cylinder(0.09 * scale, 0.12 * scale, 1.0 * scale, 8);
            const rightArmBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.0,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            rightArmBody.addShape(rightArmShape);
            rightArmBody.position.set(position.x + 0.55 * scale, position.y + 1.8 * scale, position.z);
            rightArmBody.userData = { bodyPart: 'arm', damage: 25 }; // Moderate damage for arms
            world.addBody(rightArmBody);
            armBodies.push(rightArmBody);
            
            console.log(`Arm collision bodies created`);
            return armBodies;
        } catch (error) {
            console.error("Error creating arm collision bodies:", error);
            return [];
        }
    },

    createFootBodies: function(world, position, scale = 1) {
        try {
            const footBodies = [];
            
            // Left foot
            const leftFootShape = new CANNON.Box(new CANNON.Vec3(0.15 * scale, 0.05 * scale, 0.25 * scale));
            const leftFootBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.2,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            leftFootBody.addShape(leftFootShape);
            leftFootBody.position.set(position.x - 0.25 * scale, position.y - 0.7 * scale, position.z);
            leftFootBody.userData = { bodyPart: 'leg', damage: 25 }; // Legs damage for feet
            world.addBody(leftFootBody);
            footBodies.push(leftFootBody);
            
            // Right foot
            const rightFootShape = new CANNON.Box(new CANNON.Vec3(0.15 * scale, 0.05 * scale, 0.25 * scale));
            const rightFootBody = new CANNON.Body({
                mass: 0,
                material: new CANNON.Material({
                    friction: 1.2,
                    restitution: 0.0
                }),
                type: CANNON.Body.KINEMATIC
            });
            rightFootBody.addShape(rightFootShape);
            rightFootBody.position.set(position.x + 0.25 * scale, position.y - 0.7 * scale, position.z);
            rightFootBody.userData = { bodyPart: 'leg', damage: 25 }; // Legs damage for feet
            world.addBody(rightFootBody);
            footBodies.push(rightFootBody);
            
            return footBodies;
        } catch (error) {
            console.error("Error creating foot collision bodies:", error);
            return [];
        }
    },

    createCompleteCharacterCollision: function(world, position, scale = 1) {
        try {
            console.log(`Creating complete character collision at position:`, position);
            
            const collisionBodies = {
                head: null,
                chest: null,
                arms: [],
                legs: [],
                feet: []
            };
            
            // Create all body part collision bodies
            collisionBodies.head = this.createHeadCollisionBody(world, position, scale);
            collisionBodies.chest = this.createChestCollisionBody(world, position, scale);
            collisionBodies.arms = this.createArmCollisionBodies(world, position, scale);
            collisionBodies.legs = this.createLegCollisionBodies(world, position, scale);
            collisionBodies.feet = this.createFootBodies(world, position, scale);
            
            // Flatten all bodies into a single array for easier management
            const allBodies = [];
            if (collisionBodies.head) allBodies.push(collisionBodies.head);
            if (collisionBodies.chest) allBodies.push(collisionBodies.chest);
            allBodies.push(...collisionBodies.arms);
            allBodies.push(...collisionBodies.legs);
            allBodies.push(...collisionBodies.feet);
            
            console.log(`Created ${allBodies.length} collision bodies for character`);
            
            return {
                bodies: collisionBodies,
                allBodies: allBodies
            };
        } catch (error) {
            console.error("Error creating complete character collision:", error);
            return { bodies: {}, allBodies: [] };
        }
    },

    // ...existing code...
};

window.Utils = Utils;
console.log("Utils object loaded with character physics");
