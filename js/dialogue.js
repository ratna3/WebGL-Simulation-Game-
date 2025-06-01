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
        
        // Track conversation history for variety
        this.conversationHistory = new Map();
        this.npcMoods = new Map(); // Track NPC moods for different responses
        
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
        // Get conversation count for this NPC
        const npcId = npc.name || npc.id || 'unknown';
        const conversationCount = this.conversationHistory.get(npcId) || 0;
        const npcMood = this.npcMoods.get(npcId) || 'neutral';
        
        // Increment conversation count
        this.conversationHistory.set(npcId, conversationCount + 1);
        
        switch(npc.type) {
            case 'criminal':
                return this.getCriminalDialogue(npc, conversationCount, npcMood);
            case 'police':
                return this.getPoliceDialogue(npc, conversationCount, npcMood);
            case 'civilian':
                return this.getCivilianDialogue(npc, conversationCount, npcMood);
            default:
                return this.getGenericDialogue();
        }
    }
    
    getCriminalDialogue(npc, conversationCount, mood) {
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
        
        const criminalDialogues = [
            // First meeting dialogues
            {
                text: `Well, well... what do we have here? You smell like trouble, friend. The good kind of trouble. Name's ${npc.name}, and you look like someone who knows how to handle business.`,
                options: [
                    { text: "I heard you guys need someone with my... skills.", action: 'blend', suspicion: -10, rep: 'criminals', mood: 'impressed' },
                    { text: "Business? I thought this was a knitting club.", action: 'humor', suspicion: 5, rep: 'criminals', mood: 'amused' },
                    { text: "I'm here about the big score everyone's whispering about.", action: 'intel', suspicion: 0, rep: 'criminals' },
                    { text: "Actually, I'm with the police. SURPRISE!", action: 'reveal', suspicion: 100, rep: 'criminals', mood: 'hostile' }
                ]
            },
            {
                text: `Listen pal, I've been in this game since before you were stealing candy from corner stores. You want in? Prove you're not a cop. Tell me a joke that'll make me laugh.`,
                options: [
                    { text: "Why don't cops ever get speeding tickets? Because they're always under cover!", action: 'humor', suspicion: -15, rep: 'criminals', mood: 'laughing' },
                    { text: "How many criminals does it take to rob a bank? Just one if he's good enough.", action: 'humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "I don't do jokes. I do jobs.", action: 'serious', suspicion: 0, rep: 'criminals' },
                    { text: "Here's a joke: I'm actually wearing a wire right now.", action: 'risky_humor', suspicion: 30, rep: 'criminals' }
                ]
            },
            {
                text: `You know what I love about this neighborhood? The police response time. Last week I called them about a break-in, and they showed up three days later asking if I wanted to file a report about a different break-in!`,
                options: [
                    { text: "Sounds like they're as organized as a soup sandwich.", action: 'humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "Maybe they were investigating the break-in that happened while they were investigating the first break-in.", action: 'humor', suspicion: -10, rep: 'criminals', mood: 'laughing' },
                    { text: "That's terrible! The system is broken.", action: 'sympathize', suspicion: -5, rep: 'criminals' },
                    { text: "Good thing I'm here to help speed things up for them.", action: 'hint_cop', suspicion: 25, rep: 'criminals' }
                ]
            },
            // Repeated conversation dialogues
            {
                text: `Back again? You're like a bad penny, ${this.getPlayerName()}. What's the word on the street today?`,
                options: [
                    { text: "The word is that you still owe me money from our last job.", action: 'humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "Word is that someone's been asking too many questions about our operation.", action: 'warning', suspicion: 10, rep: 'criminals' },
                    { text: "The word is 'bird.' As in, a little birdie told me something interesting.", action: 'intel', suspicion: 5, rep: 'criminals' },
                    { text: "The word is 'police.' They're everywhere!", action: 'panic', suspicion: 15, rep: 'criminals' }
                ]
            },
            {
                text: `You again! At this rate, people are gonna think we're dating. My reputation can't handle that kind of scandal!`,
                options: [
                    { text: "Don't worry, I'll tell everyone you're just not my type.", action: 'humor', suspicion: -10, rep: 'criminals', mood: 'laughing' },
                    { text: "Scandal? I thought your reputation couldn't get any worse.", action: 'roast_humor', suspicion: 5, rep: 'criminals', mood: 'mock_offended' },
                    { text: "Maybe we should make it official. You, me, a moonlit heist...", action: 'romantic_humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "Your reputation is the least of your worries right now.", action: 'threatening', suspicion: 20, rep: 'criminals' }
                ]
            }
        ];
        
        // Add mood-specific dialogue variations
        if (mood === 'laughing') {
            criminalDialogues.push({
                text: `*wiping tears* Oh man, you're killing me! Literally, my sides hurt. You're alright in my book. So what brings you back to my corner of paradise?`,
                options: [
                    { text: "I came back because the comedy club was full.", action: 'humor', suspicion: -10, rep: 'criminals', mood: 'amused' },
                    { text: "Paradise? This place looks like the before picture in a renovation show.", action: 'humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "Just checking if you've recovered from my last joke yet.", action: 'humor', suspicion: -8, rep: 'criminals', mood: 'amused' },
                    { text: "Business. Always business with me.", action: 'serious', suspicion: 0, rep: 'criminals' }
                ]
            });
        }
        
        if (mood === 'impressed') {
            criminalDialogues.push({
                text: `I gotta say, you've got style. Not many people can walk into our turf and command respect like that. You remind me of myself when I was starting out... except better looking.`,
                options: [
                    { text: "Better looking? That's not saying much.", action: 'self_deprecating_humor', suspicion: -5, rep: 'criminals', mood: 'amused' },
                    { text: "Thanks! I've been practicing my intimidating walk in the mirror.", action: 'humor', suspicion: -10, rep: 'criminals', mood: 'laughing' },
                    { text: "Style is important. You can't rob banks in sweatpants.", action: 'humor', suspicion: -8, rep: 'criminals', mood: 'amused' },
                    { text: "Respect is earned. I'm still working on the earning part.", action: 'humble', suspicion: -5, rep: 'criminals' }
                ]
            });
        }
        
        // Select appropriate dialogue based on conversation count and mood
        let selectedDialogues = criminalDialogues;
        if (conversationCount > 2) {
            selectedDialogues = criminalDialogues.filter(d => 
                d.text.includes('again') || d.text.includes('Back again') || mood === 'laughing' || mood === 'impressed'
            );
        }
        
        return selectedDialogues[Math.floor(Math.random() * selectedDialogues.length)];
    }
    
    getPoliceDialogue(npc, conversationCount, mood) {
        const policeDialogues = [
            {
                text: `Officer ${npc.name} here. I don't recognize you from the precinct. You new to the force, or just new to looking like you belong here?`,
                options: [
                    { text: "Detective Johnson, undercover division. Nice to meet you.", action: 'cover', suspicion: -5, rep: 'police', mood: 'trusting' },
                    { text: "I'm working with Internal Affairs. *flashes fake badge*", action: 'ia', suspicion: 10, rep: 'police', mood: 'suspicious' },
                    { text: "New? I've been here so long I remember when this badge was shiny.", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "I'm not a cop. I just have one of those trustworthy faces.", action: 'honest', suspicion: 15, rep: 'police' }
                ]
            },
            {
                text: `We've been tracking some serious criminal activity in this sector. Between you and me, these perps have the collective IQ of a soggy donut. Have you noticed anything... suspicious?`,
                options: [
                    { text: "Well, I did see a guy trying to rob a bank with a banana. Does that count?", action: 'humor', suspicion: -10, rep: 'police', mood: 'laughing' },
                    { text: "Suspicious? In this neighborhood? That's like asking if fish are wet.", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "I might have some intel. What's it worth to you?", action: 'intel', suspicion: -10, rep: 'police' },
                    { text: "The only suspicious thing here is your haircut.", action: 'roast_humor', suspicion: 5, rep: 'police', mood: 'mock_offended' }
                ]
            },
            {
                text: `You know what the worst part about being a cop is? Everyone expects you to know all the laws. Last week, someone asked me if it's illegal to name your dog 'Officer.' I had to radio dispatch!`,
                options: [
                    { text: "Well, is it? Asking for a friend... who's a dog.", action: 'humor', suspicion: -8, rep: 'police', mood: 'laughing' },
                    { text: "The real crime is whoever let you out without a law degree.", action: 'roast_humor', suspicion: 10, rep: 'police', mood: 'mock_offended' },
                    { text: "That's nothing. Someone once asked me if it's illegal to steal someone's idea for a criminal scheme.", action: 'risky_humor', suspicion: 15, rep: 'police' },
                    { text: "Maybe you should stick to the basics: Don't steal stuff, don't hurt people.", action: 'helpful', suspicion: -5, rep: 'police' }
                ]
            },
            {
                text: `We've had reports of armed criminals in the area. Stay alert and report anything unusual. These guys are dangerous and well-armed.`,
                options: [
                    { text: "Thanks for the warning. I'll keep my eyes open.", action: 'cooperative', suspicion: -5, rep: 'police' },
                    { text: "Armed criminals? In this economy? What's the world coming to?", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "Define 'unusual' in this neighborhood. That's a pretty low bar.", action: 'humor', suspicion: -8, rep: 'police', mood: 'laughing' },
                    { text: "Maybe you should handle it. That's what we pay you for.", action: 'dismissive', suspicion: 5, rep: 'police' }
                ]
            },
            {
                text: `Back for more questions? You're more persistent than my ex-wife's lawyer. What's on your mind this time, citizen?`,
                options: [
                    { text: "Just wanted to see if you've caught any criminals since we last talked.", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "Your ex-wife has a lawyer? What did you do, arrest her mother?", action: 'humor', suspicion: -10, rep: 'police', mood: 'laughing' },
                    { text: "I'm starting to think you enjoy these little chats more than police work.", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "Just making sure you're still on the right side of the law.", action: 'suspicious', suspicion: 10, rep: 'police' }
                ]
            }
        ];
        
        // Add mood-specific variations
        if (mood === 'trusting') {
            policeDialogues.push({
                text: `Good to have another professional on the beat. These streets can be rough, but with good people like you around, maybe we can clean this place up. Coffee later?`,
                options: [
                    { text: "Sure, as long as it's not that police station swill that could strip paint.", action: 'humor', suspicion: -5, rep: 'police', mood: 'amused' },
                    { text: "Coffee sounds great. I'll bring the donuts if you bring the handcuffs... for the criminals!", action: 'humor', suspicion: -8, rep: 'police', mood: 'laughing' },
                    { text: "Absolutely. We can discuss strategy over caffeine.", action: 'professional', suspicion: -10, rep: 'police' },
                    { text: "Thanks, but I work better alone.", action: 'distant', suspicion: 5, rep: 'police' }
                ]
            });
        }
        
        return policeDialogues[Math.floor(Math.random() * policeDialogues.length)];
    }
    
    getCivilianDialogue(npc, conversationCount, mood) {
        const civilianDialogues = [
            {
                text: `Oh hello there! I don't think we've met. I'm ${npc.name}. Are you new to the neighborhood? It's not often we get visitors who don't look like they're running from something.`,
                options: [
                    { text: "Nice to meet you! I'm just exploring the area. Lovely... ambiance.", action: 'polite', suspicion: -5, rep: 'civilians', mood: 'friendly' },
                    { text: "Running from something? Like my responsibilities and student loans?", action: 'humor', suspicion: -8, rep: 'civilians', mood: 'amused' },
                    { text: "New-ish. Still trying to figure out which streets to avoid at night.", action: 'humor', suspicion: -5, rep: 'civilians', mood: 'amused' },
                    { text: "I'm actually a health inspector. This place fails on so many levels.", action: 'sarcastic_humor', suspicion: 5, rep: 'civilians' }
                ]
            },
            {
                text: `Excuse me, you look like someone who might actually answer honestly - is this neighborhood getting weirder, or am I just getting older? Yesterday I saw a man trying to sell 'mystery meat' from a shopping cart.`,
                options: [
                    { text: "Weirder. Definitely weirder. Though the mystery meat guy has excellent customer service.", action: 'humor', suspicion: -10, rep: 'civilians', mood: 'laughing' },
                    { text: "You're not older, the neighborhood is just... seasoning with age.", action: 'humor', suspicion: -5, rep: 'civilians', mood: 'amused' },
                    { text: "Mystery meat? Did you try it? For science?", action: 'curious_humor', suspicion: -8, rep: 'civilians', mood: 'amused' },
                    { text: "This place makes a zombie apocalypse look like a vacation destination.", action: 'dark_humor', suspicion: 0, rep: 'civilians' }
                ]
            },
            {
                text: `I've been living here for twenty years, and I swear this place gets more interesting every day. Last week, someone tried to rob the bank with a water pistol. The security guard felt so bad, he gave the guy five dollars!`,
                options: [
                    { text: "That's not robbery, that's charity with extra steps!", action: 'humor', suspicion: -10, rep: 'civilians', mood: 'laughing' },
                    { text: "Plot twist: the water pistol was filled with acid. Just kidding! ...Or am I?", action: 'dark_humor', suspicion: 5, rep: 'civilians' },
                    { text: "Five dollars? In this economy? That guard is more generous than most banks.", action: 'humor', suspicion: -8, rep: 'civilians', mood: 'amused' },
                    { text: "Interesting is one word for it. Terrifying is another.", action: 'concerned', suspicion: 0, rep: 'civilians' }
                ]
            },
            {
                text: `Oh, it's you again! You're becoming a regular sight around here. Are you a journalist? A tourist? Or just someone with questionable life choices like the rest of us?`,
                options: [
                    { text: "Questionable life choices, definitely. It's my specialty.", action: 'self_deprecating_humor', suspicion: -8, rep: 'civilians', mood: 'amused' },
                    { text: "I'm conducting a study on urban decay. This neighborhood is my PhD thesis.", action: 'humor', suspicion: -5, rep: 'civilians', mood: 'amused' },
                    { text: "Tourist! I heard this place was on the 'Top 10 Places to Avoid' list. Had to see for myself.", action: 'humor', suspicion: -10, rep: 'civilians', mood: 'laughing' },
                    { text: "I'm actually writing a guidebook: 'How to Survive Your Bad Decisions.'", action: 'humor', suspicion: -8, rep: 'civilians', mood: 'amused' }
                ]
            },
            {
                text: `You know what this neighborhood needs? A superhero. Not one of those fancy ones with capes and powers, just someone who can convince the pizza place to deliver here again.`,
                options: [
                    { text: "I volunteer! My superpower is aggressive negotiation with food service workers.", action: 'humor', suspicion: -10, rep: 'civilians', mood: 'laughing' },
                    { text: "They stopped delivering? What happened, did someone rob the delivery guy?", action: 'curious', suspicion: 0, rep: 'civilians' },
                    { text: "Forget pizza, we need someone who can make the streetlights work.", action: 'practical_humor', suspicion: -5, rep: 'civilians', mood: 'amused' },
                    { text: "I'll be your superhero. My cape is in the dry cleaner's though.", action: 'humor', suspicion: -8, rep: 'civilians', mood: 'amused' }
                ]
            }
        ];
        
        // Add mood-specific variations
        if (mood === 'friendly') {
            civilianDialogues.push({
                text: `You seem like good people! It's rare to meet someone around here who doesn't immediately ask for money or directions to the nearest exit. Want to grab coffee sometime?`,
                options: [
                    { text: "Coffee sounds great! As long as it's not at that place with the 'mysterious stains' on the menu.", action: 'humor', suspicion: -10, rep: 'civilians', mood: 'amused' },
                    { text: "I'd love to, but fair warning: I have terrible taste in conversation topics.", action: 'self_deprecating_humor', suspicion: -8, rep: 'civilians', mood: 'amused' },
                    { text: "Absolutely! I promise not to ask for money OR directions.", action: 'humor', suspicion: -5, rep: 'civilians', mood: 'amused' },
                    { text: "Thanks, but I'm more of a 'mysterious loner' type.", action: 'distant', suspicion: 5, rep: 'civilians' }
                ]
            });
        }
        
        return civilianDialogues[Math.floor(Math.random() * civilianDialogues.length)];
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
        
        // Update NPC mood based on player response
        if (option.mood) {
            const npcId = this.currentNPC.name || this.currentNPC.id || 'unknown';
            this.npcMoods.set(npcId, option.mood);
        }
        
        this.updateCoverStatus();
        
        // Handle special humor responses
        if (option.action.includes('humor')) {
            this.handleHumorResponse(option);
        }
        
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
            case 'humor':
            case 'roast_humor':
            case 'self_deprecating_humor':
            case 'romantic_humor':
            case 'dark_humor':
            case 'curious_humor':
            case 'practical_humor':
            case 'sarcastic_humor':
                this.handleHumorResponse(option);
                break;
            default:
                this.endDialogue();
                break;
        }
    }
    
    handleHumorResponse(option) {
        const responses = [
            "Ha! That's actually pretty funny.",
            "You're alright, you know that?",
            "I needed that laugh today.",
            "Okay, that got me. I'll admit it.",
            "You've got a good sense of humor.",
            "That's either really clever or really stupid. I can't decide.",
            "Comedy gold right there!",
            "I'm stealing that joke for later.",
            "You should do stand-up. In a different neighborhood.",
            "That's terrible... I love it!"
        ];
        
        // Show a brief humor response before ending dialogue
        setTimeout(() => {
            if (this.currentNPC) {
                console.log(`${this.currentNPC.name}: ${responses[Math.floor(Math.random() * responses.length)]}`);
            }
            this.endDialogue();
        }, 1500);
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
    
    getGenericDialogue() {
        return {
            text: "Hello there. I don't have much to say right now.",
            options: [
                { text: "Thanks anyway.", action: 'end', suspicion: 0 },
                { text: "Have a good day.", action: 'end', suspicion: 0 }
            ]
        };
    }
}

// Make DialogueSystem globally available
window.DialogueSystem = DialogueSystem;
