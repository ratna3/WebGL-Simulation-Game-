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
            // Create main body for character torso
            const torsoShape = new CANNON.Cylinder(0.3 * scale, 0.3 * scale, 1.2 * scale, 8);
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
            torsoBody.position.set(position.x, position.y + 0.6 * scale, position.z);
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
            leftLegBody.position.set(position.x - 0.25 * scale, position.y - 0.2 * scale, position.z);
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
            rightLegBody.position.set(position.x + 0.25 * scale, position.y - 0.2 * scale, position.z);
            world.addBody(rightLegBody);
            legBodies.push(rightLegBody);
            
            // Add foot bodies
            const footBodies = this.createFootBodies(world, position, scale);
            legBodies.push(...footBodies);

            return legBodies;
        } catch (error) {
            console.error("Error creating leg collision bodies:", error);
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
            world.addBody(rightFootBody);
            footBodies.push(rightFootBody);

            return footBodies;
        } catch (error) {
            console.error("Error creating foot bodies:", error);
            return [];
        }
    },

    cleanupCharacterPhysics: function(world, physicsData) {
        try {
            if (!physicsData || !world) return;

            if (physicsData.mainBody) {
                world.removeBody(physicsData.mainBody);
            }

            if (physicsData.legBodies) {
                physicsData.legBodies.forEach(body => {
                    world.removeBody(body);
                });
            }
        } catch (error) {
            console.error("Error cleaning up character physics:", error);
        }
    },

    getRandomPosition: function(bounds) {
        return {
            x: (Math.random() - 0.5) * bounds.width,
            y: 0,
            z: (Math.random() - 0.5) * bounds.depth
        };
    },

    calculateDistance: function(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2) +
            Math.pow(pos1.z - pos2.z, 2)
        );
    },

    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    randomChoice: function(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    createMaterial: function(color, options = {}) {
        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: options.metalness || 0.1,
            roughness: options.roughness || 0.8,
            transparent: options.transparent || false,
            opacity: options.opacity || 1.0
        });
    },
    
    // Add specialized material creation for effects
    createEmissiveMaterial: function(color, emissiveColor, options = {}) {
        return new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissiveColor || color,
            emissiveIntensity: options.emissiveIntensity || 1.0,
            metalness: options.metalness || 0.0,
            roughness: options.roughness || 0.0,
            transparent: options.transparent || false,
            opacity: options.opacity || 1.0
        });
    },
    
    // Create basic material without emissive properties
    createBasicMaterial: function(color, options = {}) {
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: options.transparent || false,
            opacity: options.opacity || 1.0,
            side: options.side || THREE.FrontSide
        });
    }
};

window.Utils = Utils;
console.log("Utils object loaded with character physics");
