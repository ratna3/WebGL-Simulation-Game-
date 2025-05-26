class MissionManager {
    constructor(game) {
        this.game = game;
        this.playerName = this.getPlayerName();
        this.totalEnemies = 0;
        this.enemiesKilled = 0;
        this.missionActive = false;
        this.missionComplete = false;
        
        console.log("MissionManager initialized");
    }
    
    getPlayerName() {
        // Get player name from global function or storage
        if (typeof getAgentName === 'function') {
            return getAgentName();
        }
        return localStorage.getItem('agentName') || 'Agent Smith';
    }
    
    startMission(enemyCount) {
        this.totalEnemies = enemyCount;
        this.enemiesKilled = 0;
        this.missionActive = true;
        this.missionComplete = false;
        
        console.log(`Mission started: Eliminate ${enemyCount} REPO operatives`);
        this.updateMissionDisplay();
    }
    
    enemyEliminated() {
        if (!this.missionActive) return;
        
        this.enemiesKilled++;
        console.log(`Enemy eliminated! Progress: ${this.enemiesKilled}/${this.totalEnemies}`);
        
        this.updateMissionDisplay();
        
        if (this.enemiesKilled >= this.totalEnemies) {
            this.completeMission();
        }
    }
    
    completeMission() {
        if (this.missionComplete) return;
        
        this.missionComplete = true;
        this.missionActive = false;
        
        console.log("Mission completed!");
        this.showCongratulations();
        this.playVictorySound();
    }
    
    showCongratulations() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <h1 style="color: #00ff00; font-size: 64px; margin-bottom: 20px; text-shadow: 0 0 20px #00ff00;">
                    MISSION ACCOMPLISHED
                </h1>
                
                <h2 style="color: #00ff00; font-size: 32px; margin-bottom: 30px;">
                    Well done, ${this.playerName}!
                </h2>
                
                <p style="font-size: 18px; margin-bottom: 30px; color: #ccc;">
                    You have successfully infiltrated and neutralized the REPO criminal organization.<br>
                    All hostile operatives have been eliminated.<br><br>
                    Enemies Eliminated: ${this.enemiesKilled}/${this.totalEnemies}
                </p>
                
                <button onclick="window.location.reload()" 
                        style="background: #00ff00; color: black; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer; margin-right: 15px;">
                    NEW MISSION
                </button>
                
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #666; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer;">
                    CONTINUE
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    playVictorySound() {
        try {
            // Create victory sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Play a victory melody
            const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)
            let delay = 0;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                }, delay);
                
                delay += 150;
            });
        } catch (error) {
            console.log("Audio not available for victory sound");
        }
    }
    
    updateMissionDisplay() {
        let missionElement = document.querySelector('.mission-progress');
        if (!missionElement) {
            // Create mission display if it doesn't exist
            missionElement = document.createElement('div');
            missionElement.className = 'mission-progress';
            missionElement.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                color: white;
                font-size: 16px;
                font-weight: bold;
                text-shadow: 2px 2px 4px #000;
                font-family: 'Courier New', monospace;
                background: rgba(0, 0, 0, 0.7);
                padding: 15px;
                border-radius: 5px;
                border: 1px solid rgba(255, 62, 62, 0.3);
                z-index: 100;
            `;
            document.body.appendChild(missionElement);
        }
        
        if (this.missionActive) {
            missionElement.innerHTML = `
                <div style="color: #ff3e3e; margin-bottom: 5px;">OPERATION STATUS</div>
                <div>Agent: ${this.playerName}</div>
                <div>Targets Eliminated: ${this.enemiesKilled}/${this.totalEnemies}</div>
                <div style="margin-top: 5px; color: ${this.enemiesKilled === this.totalEnemies ? '#00ff00' : '#ffff00'};">
                    ${this.enemiesKilled === this.totalEnemies ? 'MISSION COMPLETE' : 'IN PROGRESS'}
                </div>
            `;
        } else {
            missionElement.textContent = `Agent ${this.playerName} - Awaiting Orders`;
        }
    }
    
    getMissionStatus() {
        return {
            active: this.missionActive,
            complete: this.missionComplete,
            progress: `${this.enemiesKilled}/${this.totalEnemies}`,
            playerName: this.playerName
        };
    }
}

// Make MissionManager globally available
window.MissionManager = MissionManager;
console.log("MissionManager.js loaded successfully");
