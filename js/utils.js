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
    
    // Collision utilities for NPCs
    collision: {
        // Create a compound body for both legs - much larger for bigger NPCs
        createLegCollisionBody: function(world, position, scale = 1) {
            try {
                const legBody = new CANNON.Body({
                    mass: 0, // Static collision body
                    type: CANNON.Body.KINEMATIC, // Moves with NPC but provides collision
                    material: new CANNON.Material({
                        friction: 0.9, // Higher friction for better ground contact
                        restitution: 0.0 // No bouncing
                    })
                });
                
                // Create much wider, lower collision shapes for bigger NPCs
                const leftLegShape = new CANNON.Cylinder(
                    0.18 * scale,  // top radius - increased for much bigger NPCs
                    0.26 * scale, // bottom radius (wider at bottom) - increased
                    1.8 * scale,  // height - increased for much bigger NPCs
                    8             // segments
                );
                legBody.addShape(leftLegShape, new CANNON.Vec3(-0.4 * scale, -0.35 * scale, 0)); // Adjusted spacing
                
                const rightLegShape = new CANNON.Cylinder(
                    0.18 * scale,
                    0.26 * scale,
                    1.8 * scale,
                    8
                );
                legBody.addShape(rightLegShape, new CANNON.Vec3(0.4 * scale, -0.35 * scale, 0)); // Adjusted spacing
                
                // Position the leg collision body lower - adjusted for much bigger NPCs
                legBody.position.set(position.x, position.y - 0.45 * scale, position.z);
                
                world.addBody(legBody);
                return legBody;
                
            } catch (error) {
                console.error("Error creating leg collision body:", error);
                return null;
            }
        },
        
        // Create foot collision bodies - much larger for bigger NPCs
        createFootCollisionBodies: function(world, position, scale = 1) {
            try {
                const footBodies = [];
                
                // Left foot - much larger for bigger NPCs
                const leftFootBody = new CANNON.Body({
                    mass: 0,
                    type: CANNON.Body.KINEMATIC,
                    material: new CANNON.Material({
                        friction: 1.0, // Maximum friction
                        restitution: 0.0
                    })
                });
                
                // Use box instead of sphere for better ground contact - much larger
                const leftFootShape = new CANNON.Box(new CANNON.Vec3(0.26 * scale, 0.08 * scale, 0.35 * scale)); // Increased
                leftFootBody.addShape(leftFootShape);
                leftFootBody.position.set(
                    position.x - 0.4 * scale, // Adjusted spacing for much bigger NPCs
                    position.y - 1.4 * scale, // Lower position for much bigger NPCs
                    position.z
                );
                
                // Right foot - much larger
                const rightFootBody = new CANNON.Body({
                    mass: 0,
                    type: CANNON.Body.KINEMATIC,
                    material: new CANNON.Material({
                        friction: 1.0,
                        restitution: 0.0
                    })
                });
                
                const rightFootShape = new CANNON.Box(new CANNON.Vec3(0.26 * scale, 0.08 * scale, 0.35 * scale)); // Increased
                rightFootBody.addShape(rightFootShape);
                rightFootBody.position.set(
                    position.x + 0.4 * scale, // Adjusted spacing for much bigger NPCs
                    position.y - 1.4 * scale, // Lower position for much bigger NPCs
                    position.z
                );
                
                world.addBody(leftFootBody);
                world.addBody(rightFootBody);
                
                footBodies.push(leftFootBody, rightFootBody);
                return footBodies;
                
            } catch (error) {
                console.error("Error creating foot collision bodies:", error);
                return [];
            }
        },
        
        // Update leg collisions to follow main NPC body - adjusted for much bigger NPCs
        updateLegCollisions: function(mainBody, legBody, footBodies, scale = 1) {
            try {
                if (!mainBody || !legBody) return;
                
                legBody.position.copy(mainBody.position);
                legBody.position.y -= 0.45 * scale; // Keep legs lower for much bigger NPCs
                legBody.quaternion.copy(mainBody.quaternion);
                
                // Ensure legs don't float by clamping Y position
                const groundLevel = 0; // Adjust based on your ground level
                if (legBody.position.y < groundLevel + 0.18 * scale) { // Adjusted for much bigger NPCs
                    legBody.position.y = groundLevel + 0.18 * scale;
                }
                
                // Update foot positions with better ground contact - adjusted spacing for much bigger NPCs
                if (footBodies && footBodies.length >= 2) {
                    const leftFootOffset = new CANNON.Vec3(-0.4 * scale, -1.4 * scale, 0); // Adjusted
                    const rightFootOffset = new CANNON.Vec3(0.4 * scale, -1.4 * scale, 0); // Adjusted
                    
                    footBodies[0].position.copy(legBody.position).vadd(leftFootOffset);
                    footBodies[1].position.copy(legBody.position).vadd(rightFootOffset);
                    
                    // Update foot rotation to align with ground - prevent flipping
                    footBodies[0].quaternion.copy(legBody.quaternion);
                    footBodies[1].quaternion.copy(legBody.quaternion);
                }
            } catch (error) {
                console.error("Error updating leg collisions:", error);
            }
        },
        
        // Enforce ground contact to prevent NPCs from floating - adjusted for much bigger NPCs
        enforceGroundContact: function(body, bodyOffset, tolerance = 0.1) {
            try {
                const groundLevel = 0;
                const minHeight = groundLevel + bodyOffset;
                
                if (body.position.y < minHeight - tolerance) {
                    body.position.y = minHeight;
                    if (body.velocity.y < 0) {
                        body.velocity.y = 0; // Stop downward movement
                    }
                }
            } catch (error) {
                console.error("Error enforcing ground contact:", error);
            }
        }
    }
};

// Make Utils globally available
window.Utils = Utils;
