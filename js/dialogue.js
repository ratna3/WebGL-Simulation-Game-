class DialogueSystem {
    constructor() {
        this.isActive = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        this.playerCover = 100; // 0-100, lower = more suspicious
        this.playerReputation = {
            criminals: 50, // How much criminals trust you
            police: 50,    // How much police trust you
            civilians: 50  // How much civilians trust you
        };
        this.createDialogueUI();
    }
    
    createDialogueUI() {
        // Create dialogue box container
        const dialogueBox = document.createElement('div');
        dialogueBox.id = 'dialogue-box';
        dialogueBox.style.display = 'none';
        dialogueBox.innerHTML = `
            <div class="npc-name"></div>
            <div class="dialogue-text"></div>
            <div class="dialogue-options"></div>
        `;
        document.body.appendChild(dialogueBox);
        
        // Create cover status indicator
        const coverStatus = document.createElement('div');
        coverStatus.id = 'cover-status';
        coverStatus.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 100;
        `;
        coverStatus.innerHTML = `
            <div>Cover: <span id="cover-value">100%</span></div>
            <div>Identity: Agent Smith</div>
        `;
        document.body.appendChild(coverStatus);
    }
    
    startDialogue(npc) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.currentNPC = npc;
        this.currentDialogue = this.getDialogueForNPC(npc);
        
        // Lock controls
        if (window.playerInstance) {
            window.playerInstance.dialogueLocked = true;
        }
        
        this.showDialogue();
    }
    
    getDialogueForNPC(npc) {
        switch(npc.type) {
            case 'criminal':
                return this.getCriminalDialogue(npc);
            case 'police':
                return this.getPoliceDialogue(npc);
            case 'civilian':
                return this.getCivilianDialogue(npc);
            default:
                return this.getGenericDialogue();
        }
    }
    
    getCriminalDialogue(npc) {
        if (npc.isHostile) {
            return {
                text: `You're not one of us! I knew something was off about you, ${this.getPlayerName()}!`,
                options: [
                    { text: "Wait, let me explain!", action: 'plead', suspicion: 0 },
                    { text: "You got me. I'm federal.", action: 'confess', suspicion: 50 },
                    { text: "[Draw weapon]", action: 'combat', suspicion: 0 }
                ]
            };
        }
        
        const dialogues = [
            {
                text: "Hey there, haven't seen you around before. You new to the family?",
                options: [
                    { text: "Yeah, just transferred from the east side operation.", action: 'blend', suspicion: -10, rep: 'criminals' },
                    { text: "I'm here about the big job tonight.", action: 'intel', suspicion: 5, rep: 'criminals' },
                    { text: "Actually, I'm with the police.", action: 'reveal', suspicion: 100, rep: 'criminals' },
                    { text: "Just passing through.", action: 'neutral', suspicion: 5 }
                ]
            },
            {
                text: "Business has been rough lately. Too many cops sniffing around.",
                options: [
                    { text: "Tell me more about these cops.", action: 'intel', suspicion: 0 },
                    { text: "Maybe I can help with that problem.", action: 'offer_help', suspicion: -5, rep: 'criminals' },
                    { text: "That's unfortunate.", action: 'neutral', suspicion: 0 },
                    { text: "Good. The law should be enforced.", action: 'reveal', suspicion: 30 }
                ]
            }
        ];
        
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    getPoliceDialogue(npc) {
        const dialogues = [
            {
                text: "Officer Martinez here. I don't recognize you. Are you new to the precinct?",
                options: [
                    { text: "Detective Johnson, undercover division.", action: 'cover', suspicion: -5, rep: 'police' },
                    { text: "I'm working with Internal Affairs.", action: 'ia', suspicion: 10, rep: 'police' },
                    { text: "I'm not a cop.", action: 'honest', suspicion: 20 },
                    { text: "That's classified.", action: 'mysterious', suspicion: 15 }
                ]
            },
            {
                text: "We've been tracking criminal activity in this area. Have you seen anything suspicious?",
                options: [
                    { text: "I might have some information.", action: 'intel', suspicion: -10, rep: 'police' },
                    { text: "Nothing unusual that I've noticed.", action: 'neutral', suspicion: 0 },
                    { text: "Why would I tell you?", action: 'hostile', suspicion: 25 },
                    { text: "Are you asking me to be a snitch?", action: 'challenge', suspicion: 15 }
                ]
            }
        ];
        
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    getCivilianDialogue(npc) {
        const dialogues = [
            {
                text: "Excuse me, I've been seeing a lot of suspicious activity around here. Are you with the police?",
                options: [
                    { text: "Yes, we're investigating. Stay safe.", action: 'police_cover', suspicion: -5, rep: 'civilians' },
                    { text: "No, just a concerned citizen like you.", action: 'civilian_cover', suspicion: 0, rep: 'civilians' },
                    { text: "Mind your own business.", action: 'rude', suspicion: 10, rep: 'civilians' },
                    { text: "What kind of activity?", action: 'investigate', suspicion: 5 }
                ]
            },
            {
                text: "This neighborhood used to be so peaceful. Now I'm afraid to walk alone at night.",
                options: [
                    { text: "I understand your concerns.", action: 'sympathize', suspicion: -5, rep: 'civilians' },
                    { text: "You should report it to the police.", action: 'advise', suspicion: 0 },
                    { text: "It's not that bad.", action: 'dismiss', suspicion: 5 },
                    { text: "Maybe you should move.", action: 'rude', suspicion: 10 }
                ]
            },
            {
                text: "I work at the local shop. Business has been slow with all the trouble around here.",
                options: [
                    { text: "What kind of trouble have you seen?", action: 'investigate', suspicion: 0 },
                    { text: "I'm sorry to hear that.", action: 'sympathize', suspicion: -2, rep: 'civilians' },
                    { text: "Maybe I can help protect your business.", action: 'offer_help', suspicion: -5, rep: 'civilians' },
                    { text: "That's life in the city.", action: 'neutral', suspicion: 0 }
                ]
            }
        ];
        
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    getPlayerName() {
        return window.getAgentName ? window.getAgentName() : "Agent Smith";
    }
    
    showDialogue() {
        const dialogueBox = document.getElementById('dialogue-box');
        const nameElement = dialogueBox.querySelector('.npc-name');
        const textElement = dialogueBox.querySelector('.dialogue-text');
        const optionsElement = dialogueBox.querySelector('.dialogue-options');
        
        nameElement.textContent = this.currentNPC.name || 'Unknown';
        textElement.textContent = this.currentDialogue.text;
        
        // Clear and populate options
        optionsElement.innerHTML = '';
        this.currentDialogue.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = option.text;
            button.onclick = () => this.selectOption(option);
            optionsElement.appendChild(button);
        });
        
        dialogueBox.style.display = 'block';
    }
    
    selectOption(option) {
        // Update suspicion and reputation
        if (option.suspicion) {
            this.playerCover = Math.max(0, Math.min(100, this.playerCover - option.suspicion));
        }
        
        if (option.rep && this.playerReputation[option.rep] !== undefined) {
            this.playerReputation[option.rep] = Math.max(0, Math.min(100, 
                this.playerReputation[option.rep] + (option.suspicion ? -option.suspicion : 5)));
        }
        
        this.updateCoverStatus();
        
        // Handle actions
        switch(option.action) {
            case 'combat':
                this.startCombat();
                break;
            case 'reveal':
            case 'confess':
                this.blowCover();
                break;
            case 'intel':
                this.gatherIntel();
                break;
            default:
                this.endDialogue();
                break;
        }
    }
    
    startCombat() {
        console.log("Combat initiated!");
        this.currentNPC.becomeHostile();
        this.endDialogue();
    }
    
    blowCover() {
        console.log("Cover blown! Mission compromised!");
        this.playerCover = 0;
        this.currentNPC.becomeHostile();
        this.alertNearbyNPCs();
        this.endDialogue();
    }
    
    gatherIntel() {
        console.log("Intel gathered from", this.currentNPC.name);
        // Add mission progress here
        this.endDialogue();
    }
    
    alertNearbyNPCs() {
        // Make nearby NPCs of same faction hostile
        if (window.game && window.game.npcManager) {
            window.game.npcManager.alertNearbyNPCs(this.currentNPC.position, this.currentNPC.type);
        }
    }
    
    endDialogue() {
        console.log("Ending dialogue with", this.currentNPC?.name || "unknown NPC");
        
        // Notify the NPC that dialogue has ended
        if (this.currentNPC && typeof this.currentNPC.endDialogue === 'function') {
            this.currentNPC.endDialogue();
        }
        
        document.getElementById('dialogue-box').style.display = 'none';
        this.isActive = false;
        this.currentNPC = null;
        this.currentDialogue = null;
        
        // Unlock controls
        if (window.playerInstance) {
            window.playerInstance.dialogueLocked = false;
        }
        
        // Hide interaction prompt
        this.hideInteractionPrompt();
        
        console.log("Dialogue ended and controls unlocked");
    }
    
    updateCoverStatus() {
        const coverValue = document.getElementById('cover-value');
        if (coverValue) {
            coverValue.textContent = Math.round(this.playerCover) + '%';
            coverValue.style.color = this.playerCover > 70 ? '#00ff00' : 
                                   this.playerCover > 30 ? '#ffff00' : '#ff0000';
        }
    }
    
    checkInteraction(npc, distance) {
        if (distance < 3 && !this.isActive) {
            // Show interaction prompt
            this.showInteractionPrompt(npc);
            return true;
        }
        return false;
    }
    
    showInteractionPrompt(npc) {
        let prompt = document.getElementById('interaction-prompt');
        if (!prompt) {
            prompt = document.createElement('div');
            prompt.id = 'interaction-prompt';
            prompt.style.cssText = `
                position: fixed;
                bottom: 150px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                border: 1px solid #ff3e3e;
                z-index: 50;
                font-family: 'Courier New', monospace;
            `;
            document.body.appendChild(prompt);
        }
        
        prompt.innerHTML = `Press <strong>E</strong> to talk to <span style="color: #ff3e3e;">${npc.name || npc.type}</span>`;
        prompt.style.display = 'block';
    }
    
    hideInteractionPrompt() {
        const prompt = document.getElementById('interaction-prompt');
        if (prompt) {
            prompt.style.display = 'none';
        }
    }
}

// Make DialogueSystem globally available
window.DialogueSystem = DialogueSystem;
