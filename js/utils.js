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
    }
};

// Make Utils globally available
window.Utils = Utils;
