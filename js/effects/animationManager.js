class EnemyAnimationManager {
    constructor() {
        this.animations = new Map(); // Store animations per enemy
        this.bloodParticles = [];
        this.shellCasings = [];
        
        console.log("Enemy Animation Manager initialized");
    }
    
    registerEnemy(enemy) {
        if (!enemy || this.animations.has(enemy)) return;
        
        const animationData = {
            enemy: enemy,
            currentAnimation: 'idle',
            animationTime: 0,
            isDying: false,
            isHit: false,
            isShooting: false,
            walkCycle: 0,
            originalPositions: this.saveOriginalPositions(enemy),
            deathStartTime: 0,
            hitStartTime: 0,
            shootStartTime: 0
        };
        
        this.animations.set(enemy, animationData);
        console.log("Enemy registered for animations");
    }
    
    saveOriginalPositions(enemy) {
        const positions = {};
        
        if (enemy.group && enemy.group.userData && enemy.group.userData.components) {
            const components = enemy.group.userData.components;
            
            Object.keys(components).forEach(key => {
                const component = components[key];
                if (component) {
                    positions[key] = {
                        position: component.position.clone(),
                        rotation: component.rotation.clone(),
                        scale: component.scale.clone()
                    };
                }
            });
        }
        
        return positions;
    }
    
    playDeathAnimation(enemy) {
        const animData = this.animations.get(enemy);
        if (!animData || animData.isDying) return;
        
        console.log("Playing death animation for enemy");
        animData.isDying = true;
        animData.currentAnimation = 'dying';
        animData.deathStartTime = Date.now();
        animData.animationTime = 0;
        
        // Create blood splatter effect
        this.createBloodSplatter(enemy);
        
        // Create death sound effect
        this.playDeathSound();
    }
    
    playHitAnimation(enemy) {
        const animData = this.animations.get(enemy);
        if (!animData || animData.isDying) return;
        
        console.log("Playing hit animation for enemy");
        animData.isHit = true;
        animData.hitStartTime = Date.now();
        
        // Create blood splatter
        this.createBloodSplatter(enemy, 0.5); // Smaller splatter for hit
        
        // Create hit sound
        this.playHitSound();
    }
    
    playShootAnimation(enemy) {
        const animData = this.animations.get(enemy);
        if (!animData || animData.isDying) return;
        
        console.log("Playing shoot animation for enemy");
        animData.isShooting = true;
        animData.shootStartTime = Date.now();
        
        // Create enhanced muzzle flash
        this.createEnhancedMuzzleFlash(enemy);
        
        // Create shell casing
        this.createShellCasing(enemy);
        
        // Create shooting sound
        this.playShootSound();
    }
    
    update(delta) {
        this.animations.forEach((animData, enemy) => {
            if (!enemy || !enemy.group) return;
            
            animData.animationTime += delta;
            
            switch(animData.currentAnimation) {
                case 'idle':
                    this.updateIdleAnimation(enemy, animData, delta);
                    break;
                case 'walking':
                    this.updateWalkingAnimation(enemy, animData, delta);
                    break;
                case 'dying':
                    this.updateDeathAnimation(enemy, animData, delta);
                    break;
            }
            
            // Handle temporary animations
            if (animData.isHit) {
                this.updateHitAnimation(enemy, animData, delta);
            }
            
            if (animData.isShooting) {
                this.updateShootAnimation(enemy, animData, delta);
            }
        });
        
        // Update particle effects
        this.updateBloodParticles(delta);
        this.updateShellCasings(delta);
    }
    
    updateIdleAnimation(enemy, animData, delta) {
        const components = enemy.group.userData.components;
        if (!components) return;
        
        const time = animData.animationTime;
        
        // Subtle breathing animation
        if (components.torso) {
            components.torso.scale.y = 1 + Math.sin(time * 2) * 0.02;
        }
        
        // Slight head movement
        if (components.head) {
            components.head.rotation.y = Math.sin(time * 0.5) * 0.1;
            components.head.position.y = animData.originalPositions.head.position.y + Math.sin(time * 1.5) * 0.01;
        }
        
        // Weapon sway if available
        if (enemy.weaponGroup) {
            enemy.weaponGroup.rotation.x = Math.sin(time * 0.8) * 0.02;
            enemy.weaponGroup.rotation.z = Math.sin(time * 0.6) * 0.01;
        }
    }
    
    updateWalkingAnimation(enemy, animData, delta) {
        const components = enemy.group.userData.components;
        if (!components) return;
        
        animData.walkCycle += delta * 8; // Walking speed
        const walkTime = animData.walkCycle;
        
        // Arm swinging (opposite to legs)
        if (components.leftArm) {
            components.leftArm.rotation.x = Math.sin(walkTime) * 0.4;
        }
        if (components.rightArm) {
            components.rightArm.rotation.x = -Math.sin(walkTime) * 0.4;
        }
        
        // Leg movement
        if (components.leftLeg) {
            components.leftLeg.rotation.x = Math.sin(walkTime) * 0.3;
        }
        if (components.rightLeg) {
            components.rightLeg.rotation.x = -Math.sin(walkTime) * 0.3;
        }
        
        // Body bob and sway
        if (components.torso) {
            components.torso.position.y = animData.originalPositions.torso.position.y + Math.sin(walkTime * 2) * 0.05;
            components.torso.rotation.z = Math.sin(walkTime) * 0.05;
        }
        
        // Head bob
        if (components.head) {
            components.head.position.y = animData.originalPositions.head.position.y + Math.sin(walkTime * 2) * 0.08;
            components.head.rotation.x = Math.sin(walkTime * 2) * 0.03;
        }
        
        // Weapon movement during walk
        if (enemy.weaponGroup) {
            enemy.weaponGroup.position.y = 1.0 + Math.sin(walkTime * 2) * 0.05;
            enemy.weaponGroup.rotation.x = Math.sin(walkTime) * 0.1;
        }
    }
    
    updateDeathAnimation(enemy, animData, delta) {
        const deathDuration = 2.0; // 2 seconds death animation
        const progress = Math.min(animData.animationTime / deathDuration, 1.0);
        
        const components = enemy.group.userData.components;
        if (!components) return;
        
        // Falling animation
        if (progress < 0.5) {
            // First half: stagger backwards
            const staggerProgress = progress * 2;
            
            if (components.torso) {
                components.torso.rotation.x = staggerProgress * 0.2;
                components.torso.position.y = animData.originalPositions.torso.position.y - (staggerProgress * 0.3);
            }
            
            if (components.head) {
                components.head.rotation.x = staggerProgress * 0.3;
            }
            
            // Arms flail
            if (components.leftArm) {
                components.leftArm.rotation.x = -staggerProgress * 1.2;
                components.leftArm.rotation.z = staggerProgress * 0.5;
            }
            if (components.rightArm) {
                components.rightArm.rotation.x = -staggerProgress * 1.0;
                components.rightArm.rotation.z = -staggerProgress * 0.4;
            }
        } else {
            // Second half: fall to ground
            const fallProgress = (progress - 0.5) * 2;
            
            // Rotate entire body
            enemy.group.rotation.z = fallProgress * (Math.PI / 2);
            enemy.group.position.y = animData.originalPositions.torso.position.y - (fallProgress * 1.5);
            
            // Limbs settle
            if (components.leftArm) {
                components.leftArm.rotation.x = -1.2 + (fallProgress * 0.5);
            }
            if (components.rightArm) {
                components.rightArm.rotation.x = -1.0 + (fallProgress * 0.3);
            }
            
            if (components.leftLeg) {
                components.leftLeg.rotation.x = fallProgress * 0.3;
            }
            if (components.rightLeg) {
                components.rightLeg.rotation.x = fallProgress * 0.2;
            }
        }
        
        // Color fade to gray
        enemy.group.traverse((child) => {
            if (child.material && child.material.color) {
                const grayValue = 1 - (progress * 0.7);
                child.material.color.setRGB(grayValue, grayValue, grayValue);
            }
        });
    }
    
    updateHitAnimation(enemy, animData, delta) {
        const hitDuration = 0.3; // 300ms hit reaction
        const elapsed = (Date.now() - animData.hitStartTime) / 1000;
        
        if (elapsed > hitDuration) {
            animData.isHit = false;
            return;
        }
        
        const progress = elapsed / hitDuration;
        const intensity = Math.sin(progress * Math.PI); // Peak in middle
        
        const components = enemy.group.userData.components;
        if (!components) return;
        
        // Body recoil
        if (components.torso) {
            components.torso.rotation.x = intensity * 0.15;
            components.torso.position.z = animData.originalPositions.torso.position.z - (intensity * 0.1);
        }
        
        // Head snap back
        if (components.head) {
            components.head.rotation.x = intensity * 0.2;
        }
        
        // Arms react
        if (components.leftArm) {
            components.leftArm.rotation.x = intensity * 0.3;
        }
        if (components.rightArm) {
            components.rightArm.rotation.x = intensity * 0.3;
        }
        
        // Red flash on materials
        enemy.group.traverse((child) => {
            if (child.material && child.material.emissive) {
                const redIntensity = intensity * 0.5;
                child.material.emissive.setRGB(redIntensity, 0, 0);
            }
        });
    }
    
    updateShootAnimation(enemy, animData, delta) {
        const shootDuration = 0.2; // 200ms shoot animation
        const elapsed = (Date.now() - animData.shootStartTime) / 1000;
        
        if (elapsed > shootDuration) {
            animData.isShooting = false;
            return;
        }
        
        const progress = elapsed / shootDuration;
        const recoil = Math.sin(progress * Math.PI); // Peak in middle
        
        // Weapon recoil
        if (enemy.weaponGroup) {
            enemy.weaponGroup.rotation.x = recoil * 0.15;
            enemy.weaponGroup.position.z = 0 - (recoil * 0.05);
        }
        
        // Body recoil
        const components = enemy.group.userData.components;
        if (components && components.torso) {
            components.torso.rotation.x = -recoil * 0.05;
        }
        
        // Right arm (shooting arm) recoil
        if (components && components.rightArm) {
            components.rightArm.rotation.x = -recoil * 0.1;
        }
    }
    
    createBloodSplatter(enemy, scale = 1.0) {
        if (!enemy.group) return;
        
        const position = enemy.group.position.clone();
        position.y += 1.5; // Chest height
        
        // Create multiple blood particles
        for (let i = 0; i < 8 * scale; i++) {
            const particle = {
                mesh: this.createBloodParticle(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    Math.random() * 3 + 1,
                    (Math.random() - 0.5) * 4
                ),
                position: position.clone(),
                life: 1.0,
                maxLife: 1.0 + Math.random() * 0.5
            };
            
            particle.mesh.position.copy(position);
            if (enemy.scene) {
                enemy.scene.add(particle.mesh);
            }
            
            this.bloodParticles.push(particle);
        }
    }
    
    createBloodParticle() {
        const geometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 6, 6);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0, 0.8, 0.2 + Math.random() * 0.2),
            transparent: true
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    updateBloodParticles(delta) {
        for (let i = this.bloodParticles.length - 1; i >= 0; i--) {
            const particle = this.bloodParticles[i];
            
            // Update physics
            particle.velocity.y -= 9.8 * delta; // Gravity
            particle.position.add(particle.velocity.clone().multiplyScalar(delta));
            particle.mesh.position.copy(particle.position);
            
            // Update life
            particle.life -= delta;
            particle.mesh.material.opacity = particle.life / particle.maxLife;
            
            // Remove if dead or hit ground
            if (particle.life <= 0 || particle.position.y < 0) {
                if (particle.mesh.parent) {
                    particle.mesh.parent.remove(particle.mesh);
                }
                this.bloodParticles.splice(i, 1);
            }
        }
    }
    
    createEnhancedMuzzleFlash(enemy) {
        if (!enemy.weaponGroup || !enemy.scene) return;
        
        // Create larger, more realistic muzzle flash
        const flashGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF44,
            emissive: 0xFFAA00,
            emissiveIntensity: 2.0,
            transparent: true,
            opacity: 0.9
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.set(0.4, 0, 0); // At barrel tip
        enemy.weaponGroup.add(flash);
        
        // Create flame cone
        const coneGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFAA44,
            emissive: 0xFF6600,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.7
        });
        
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(0.5, 0, 0);
        cone.rotation.z = Math.PI / 2;
        enemy.weaponGroup.add(cone);
        
        // Animate flash
        let intensity = 1.0;
        const fadeInterval = setInterval(() => {
            intensity -= 0.1;
            if (intensity <= 0) {
                enemy.weaponGroup.remove(flash);
                enemy.weaponGroup.remove(cone);
                clearInterval(fadeInterval);
            } else {
                flash.material.opacity = intensity;
                cone.material.opacity = intensity * 0.7;
                flash.scale.setScalar(1 + (1 - intensity) * 0.5);
            }
        }, 20);
    }
    
    createShellCasing(enemy) {
        if (!enemy.weaponGroup || !enemy.scene) return;
        
        const casingGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8);
        const casingMaterial = new THREE.MeshStandardMaterial({
            color: 0xDAA520,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const casing = new THREE.Mesh(casingGeometry, casingMaterial);
        
        // Position at weapon ejection port
        const position = enemy.weaponGroup.position.clone();
        position.y += 0.1;
        position.x -= 0.1;
        
        const shellData = {
            mesh: casing,
            velocity: new THREE.Vector3(
                -2 + Math.random() * 1,
                3 + Math.random() * 2,
                (Math.random() - 0.5) * 2
            ),
            angularVelocity: new THREE.Vector3(
                Math.random() * 10,
                Math.random() * 10,
                Math.random() * 10
            ),
            position: position,
            life: 5.0 // 5 seconds
        };
        
        casing.position.copy(position);
        casing.castShadow = true;
        enemy.scene.add(casing);
        
        this.shellCasings.push(shellData);
    }
    
    updateShellCasings(delta) {
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const shell = this.shellCasings[i];
            
            // Update physics
            shell.velocity.y -= 9.8 * delta; // Gravity
            shell.position.add(shell.velocity.clone().multiplyScalar(delta));
            shell.mesh.position.copy(shell.position);
            
            // Update rotation
            shell.mesh.rotation.x += shell.angularVelocity.x * delta;
            shell.mesh.rotation.y += shell.angularVelocity.y * delta;
            shell.mesh.rotation.z += shell.angularVelocity.z * delta;
            
            // Bounce off ground
            if (shell.position.y < 0.1) {
                shell.position.y = 0.1;
                shell.velocity.y = Math.abs(shell.velocity.y) * 0.3; // Bounce with energy loss
                shell.velocity.x *= 0.8; // Friction
                shell.velocity.z *= 0.8;
                shell.angularVelocity.multiplyScalar(0.7);
            }
            
            // Update life
            shell.life -= delta;
            
            // Remove if dead
            if (shell.life <= 0) {
                if (shell.mesh.parent) {
                    shell.mesh.parent.remove(shell.mesh);
                }
                this.shellCasings.splice(i, 1);
            }
        }
    }
    
    // Set animation state
    setAnimationState(enemy, state) {
        const animData = this.animations.get(enemy);
        if (!animData || animData.isDying) return;
        
        if (animData.currentAnimation !== state) {
            animData.currentAnimation = state;
            animData.animationTime = 0;
            
            if (state === 'walking') {
                animData.walkCycle = 0;
            }
            
            console.log(`Enemy animation changed to: ${state}`);
        }
    }
    
    // Sound effects (Web Audio API)
    playDeathSound() {
        this.playSound([400, 200, 100], [0.1, 0.1, 0.2], 0.3);
    }
    
    playHitSound() {
        this.playSound([800, 400], [0.05, 0.1], 0.2);
    }
    
    playShootSound() {
        this.playSound([1000, 200, 100], [0.02, 0.1, 0.1], 0.4);
    }
    
    playSound(frequencies, durations, volume = 0.1) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let currentTime = audioContext.currentTime;
            
            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, currentTime);
                oscillator.type = index === 0 ? 'sawtooth' : 'sine';
                
                gainNode.gain.setValueAtTime(volume, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + durations[index]);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + durations[index]);
                
                currentTime += durations[index] * 0.8; // Overlap sounds slightly
            });
        } catch (error) {
            console.log("Could not play sound:", error);
        }
    }
    
    // Cleanup
    removeEnemy(enemy) {
        this.animations.delete(enemy);
    }
    
    cleanup() {
        // Clean up all particles
        this.bloodParticles.forEach(particle => {
            if (particle.mesh.parent) {
                particle.mesh.parent.remove(particle.mesh);
            }
        });
        
        this.shellCasings.forEach(shell => {
            if (shell.mesh.parent) {
                shell.mesh.parent.remove(shell.mesh);
            }
        });
        
        this.bloodParticles = [];
        this.shellCasings = [];
        this.animations.clear();
        
        console.log("Animation manager cleaned up");
    }
}

// Make EnemyAnimationManager globally available
window.EnemyAnimationManager = EnemyAnimationManager;
console.log("EnemyAnimationManager loaded with comprehensive combat animations");
