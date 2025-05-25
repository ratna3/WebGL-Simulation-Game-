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
        if (typeof window.getAgentName === 'function') {
            return window.getAgentName();
        }
        
        // Fallback to localStorage
        const savedName = localStorage.getItem('agentName');
        if (savedName) {
            return savedName;
        }
        
        // Final fallback
        return "Agent Smith";
    }
    
    startMission(enemyCount) {
        this.totalEnemies = enemyCount;
        this.enemiesKilled = 0;
        this.missionActive = true;
        this.missionComplete = false;
        
        console.log(`Mission started: Eliminate ${this.totalEnemies} enemies`);
        this.updateMissionDisplay();
    }
    
    enemyEliminated() {
        if (!this.missionActive) {
            console.log("Enemy eliminated but mission not active");
            return;
        }
        
        this.enemiesKilled++;
        console.log(`Enemy eliminated! Progress: ${this.enemiesKilled}/${this.totalEnemies}`);
        
        // Force update display immediately
        this.updateMissionDisplay();
        
        // Check for mission completion
        if (this.enemiesKilled >= this.totalEnemies) {
            console.log("All enemies eliminated - mission complete!");
            this.completeMission();
        }
    }
    
    completeMission() {
        this.missionActive = false;
        this.missionComplete = true;
        
        console.log("Mission Complete!");
        
        // Show congratulations screen
        this.showCongratulations();
    }
    
    showCongratulations() {
        const congratsOverlay = document.createElement('div');
        congratsOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        `;
        
        congratsOverlay.innerHTML = `
            <div style="text-align: center; color: white; max-width: 600px;">
                <h1 style="color: #00ff00; font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 20px #00ff00;">
                    MISSION ACCOMPLISHED!
                </h1>
                
                <h2 style="color: #ff3e3e; font-size: 32px; margin-bottom: 30px;">
                    Congratulations! Detective ${this.playerName}
                </h2>
                
                <div style="background: rgba(0,255,0,0.1); border: 2px solid #00ff00; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                    <h3 style="color: #00ff00; margin-bottom: 15px;">MISSION REPORT</h3>
                    <p style="font-size: 18px; line-height: 1.5;">
                        Agent <strong>${this.playerName}</strong> has successfully completed the undercover operation.<br><br>
                        <strong>Enemies Eliminated:</strong> ${this.enemiesKilled}<br>
                        <strong>Mission Status:</strong> <span style="color: #00ff00;">SUCCESS</span><br>
                        <strong>Cover Status:</strong> Maintained<br><br>
                        The criminal organization has been neutralized.<br>
                        The city is now safe thanks to your efforts, ${this.playerName}.
                    </p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ffff00; margin-bottom: 10px;">ACHIEVEMENT UNLOCKED</h3>
                    <p style="color: #ffff00;">🏆 Master Detective - Complete the undercover mission as ${this.playerName}</p>
                </div>
                
                <button onclick="this.restartMission()" 
                        style="background: #ff3e3e; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer; margin-right: 15px;">
                    NEW MISSION
                </button>
                
                <button onclick="this.exitGame()" 
                        style="background: #666; color: white; border: none; padding: 15px 30px; 
                               font-size: 18px; border-radius: 5px; cursor: pointer;">
                    EXIT
                </button>
            </div>
        `;
        
        // Add button functionality
        congratsOverlay.querySelector('button').onclick = () => {
            // Restart mission
            document.body.removeChild(congratsOverlay);
            if (window.game) {
                window.game.restartMission();
            }
        };
        
        congratsOverlay.querySelectorAll('button')[1].onclick = () => {
            // Exit game - go back to agent naming
            window.location.reload();
        };
        
        document.body.appendChild(congratsOverlay);
        
        // Play victory sound (if available)
        this.playVictorySound();
    }
    
    playVictorySound() {
        // Create a simple victory beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E note
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.1); // C note
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G note
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log("Could not play victory sound:", error);
        }
    }
    
    updateMissionDisplay() {
        // Update HUD mission progress
        let missionElement = document.getElementById('mission-progress');
        
        if (!missionElement) {
            // Create mission progress display
            missionElement = document.createElement('div');
            missionElement.id = 'mission-progress';
            missionElement.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 15px;
                border-radius: 5px;
                font-family: 'Courier New', monospace;
                border: 1px solid #ff3e3e;
                z-index: 50;
            `;
            document.body.appendChild(missionElement);
        }
        
        if (this.missionActive) {
            const progressPercent = this.totalEnemies > 0 ? (this.enemiesKilled / this.totalEnemies) * 100 : 0;
            missionElement.innerHTML = `
                <h4 style="color: #ff3e3e; margin-bottom: 10px;">MISSION PROGRESS</h4>
                <p>Agent: ${this.playerName}</p>
                <p>Enemies Eliminated: <span style="color: #00ff00;">${this.enemiesKilled}</span>/<span style="color: #ff3e3e;">${this.totalEnemies}</span></p>
                <div style="width: 200px; height: 10px; background: #333; border-radius: 5px; margin-top: 10px;">
                    <div style="width: ${progressPercent}%; height: 100%; background: #ff3e3e; border-radius: 5px; transition: width 0.3s ease;"></div>
                </div>
            `;
        } else if (this.missionComplete) {
            missionElement.innerHTML = `
                <h4 style="color: #00ff00;">MISSION COMPLETE!</h4>
                <p>Agent: ${this.playerName}</p>
                <p style="color: #00ff00;">All enemies eliminated!</p>
            `;
        }
        
        console.log(`Mission display updated: ${this.enemiesKilled}/${this.totalEnemies}`);
    }
    
    getMissionStatus() {
        return {
            active: this.missionActive,
            complete: this.missionComplete,
            progress: this.enemiesKilled / this.totalEnemies,
            enemiesKilled: this.enemiesKilled,
            totalEnemies: this.totalEnemies,
            playerName: this.playerName
        };
    }
}

// Make MissionManager globally available
window.MissionManager = MissionManager;
