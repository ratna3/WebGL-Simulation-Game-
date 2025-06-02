# REPO City - Undercover Agent Game

**Developer:** Ratna Kirti  
**GitHub:** [@ratna3](https://github.com/ratna3)  
**Game Type:** 3D First-Person Action/Stealth Game  
**Engine:** Three.js + Cannon.js Physics  

## 🎮 Game Overview

REPO City is an immersive 3D undercover agent game where you infiltrate a criminal organization in a procedurally generated urban environment. As an undercover agent, you must gather intelligence through dialogue, maintain your cover, and eliminate threats when necessary.

### Core Gameplay Features

- **Undercover Mechanics**: Maintain cover by avoiding suspicious behavior
- **Dynamic Dialogue System**: Interact with NPCs to gather intelligence
- **Advanced Combat**: First-person shooting with realistic weapon mechanics
- **Character Recognition**: Detailed facial features and character design
- **Progressive Difficulty**: Multi-level system with increasing enemy count
- **Physics-Based Interactions**: Realistic movement and collision detection

## 🏗️ Technical Architecture

### Graphics Engine (Three.js)
- **Scene Management**: Advanced 3D scene with dynamic lighting
- **Character Design**: Detailed humanoid models with facial features, limbs, and accessories
- **Procedural City**: Grid-based urban environment with buildings and roads
- **Visual Effects**: Muzzle flashes, particle systems, and screen effects
- **Shadow Mapping**: Real-time shadows with PCF soft shadow mapping

### Physics Engine (Cannon.js)
- **Rigid Body Dynamics**: Physics bodies for all interactive objects
- **Collision Detection**: 
  - Player vs Environment collision
  - Bullet vs Character collision with body part detection (head, chest, arms, legs)
  - Multi-body character collision systems
- **Material Properties**: Friction and restitution for realistic interactions
- **Gravity Simulation**: Realistic falling and jumping mechanics

### Advanced Systems

#### Weapon System (`js/weapons.js`)
- **Realistic Ballistics**: Bullet trajectory with physics simulation
- **Recoil Animation**: Advanced recoil system with multiple phases
- **Crosshair Alignment**: Weapons align with crosshair for accurate shooting
- **Damage System**: Body-part specific damage (40 damage base, 2x headshot multiplier)
- **Ammo Management**: Reload mechanics with visual feedback

#### Character Design (`js/design/characterDesign.js`)
- **Detailed Modeling**: Complete humanoid characters with:
  - Facial features (eyes, nose, mouth, ears, eyebrows)
  - Body parts (torso, arms, hands with fingers, legs, feet)
  - Character-specific accessories (police badges, criminal markings)
- **Proportional Scaling**: Consistent character heights and proportions
- **Animation System**: Walking, idle, and combat animations

#### AI & NPC System (`js/npc.js`)
- **Behavioral AI**: NPCs with walking patterns and interaction states
- **Dialogue Personalities**: Dynamic personality system affecting conversations
- **Enemy AI**: Hostile detection and combat behavior
- **Health Systems**: Individual health tracking with visual health bars

#### Mission System (`js/game/missionManager.js`)
- **Progressive Levels**: Increasing difficulty with more enemies per level
- **Objective Tracking**: Mission goals and completion detection
- **Cover System**: Stealth mechanics with cover level tracking

#### City Generation (`js/city/cityGenerator.js`)
- **Procedural Buildings**: Realistic urban structures with varied heights
- **Grid-Based Layout**: Organized city blocks with roads and intersections
- **Strategic Positioning**: Enemies spawn in building gaps for tactical gameplay

## 🎯 Game Mechanics

### Combat System
- **Weapon Handling**: Tab to equip/holster, left-click to shoot, R to reload
- **Damage Model**: 4-shot elimination system (100 HP, 25 damage per hit)
- **Body Part Targeting**: Headshots deal double damage
- **Bullet Physics**: Realistic projectile simulation with collision detection

### Stealth System
- **Cover Mechanics**: Actions affect your cover level (weapon visibility, movement speed)
- **Dialogue Intelligence**: Gather information without blowing cover
- **Dynamic Responses**: NPCs react based on your behavior and previous interactions

### Character Interaction
- **Rich Dialogue**: Multiple conversation options based on NPC personality
- **Intelligence Gathering**: Extract information from criminals and contacts
- **Civilian Protection**: Avoid harming innocent bystanders

## 🚀 Setup and Installation

### Prerequisites
- Modern web browser with WebGL support
- Live Server extension for VS Code (or any local web server)
- No additional dependencies - all libraries loaded via CDN

### Running the Game

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ratna3/WebGL-Simulation-Game-.git
   cd WebGL-Simulation-Game-
   ```

2. **Install Live Server (VS Code)**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server" by Ritwick Dey
   - Install the extension

3. **Launch the Game**
   - Open the project folder in VS Code
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Game will open in your default browser

4. **Alternative Methods**
   - **Python**: `python -m http.server 8000` (Python 3) or `python -m SimpleHTTPServer 8000` (Python 2)
   - **Node.js**: `npx http-server` or `npx live-server`
   - **PHP**: `php -S localhost:8000`

### Browser Compatibility
- Chrome/Chromium (Recommended)
- Firefox
- Safari
- Edge

## 🎮 Game Controls

| Action | Control |
|--------|---------|
| Move | W/A/S/D |
| Look Around | Mouse |
| Jump | Space |
| Sprint | Shift |
| Interact | E |
| Equip/Holster Weapon | Tab |
| Shoot | Left Click |
| Reload | R |
| Enable Mouse Look | Click in game area |
| Release Mouse | Escape |

## 📁 Project Structure

```
WebGL-Simulation-Game-/
├── index.html                          # Main game entry point
├── css/style.css                       # Game styling
├── js/
│   ├── app.js                         # Main game class and initialization
│   ├── player.js                      # Player controller and mechanics
│   ├── weapons.js                     # Advanced weapon system
│   ├── npc.js                         # NPC AI and behavior
│   ├── dialogue.js                    # Dialogue system
│   ├── environment.js                 # Environment management
│   ├── utils.js                       # Utility functions and physics helpers
│   ├── buildings/
│   │   ├── buildingSystem.js          # Building generation
│   │   └── buildingTextures.js        # Texture management
│   ├── city/
│   │   └── cityGenerator.js           # Procedural city generation
│   ├── design/
│   │   └── characterDesign.js         # Character modeling system
│   ├── effects/
│   │   ├── bulletSystem.js            # Bullet physics and rendering
│   │   └── animationManager.js        # Animation systems
│   └── game/
│       └── missionManager.js          # Mission and level management
└── README.md                          # This file
```

## 🔧 Development Features

### Debug Tools
- **Console Logging**: Comprehensive debug output
- **Debug Panel**: Press Ctrl+D to access debug controls
- **Real-time Monitoring**: Character positions, health, and game state
- **Performance Tracking**: Physics and rendering performance metrics

### Modular Architecture
- **Component System**: Separated systems for easy modification
- **Event-Driven**: Loosely coupled systems communicating via events
- **Configurable**: Easy to adjust game parameters and mechanics

## 🎯 Game Flow

1. **Agent Identity**: Enter your agent codename
2. **Mission Briefing**: Receive objectives and controls information
3. **City Infiltration**: Navigate the procedural city environment
4. **Intelligence Gathering**: Interact with NPCs to gather information
5. **Combat Engagement**: Eliminate threats when cover is blown
6. **Level Progression**: Complete levels with increasing difficulty
7. **Mission Success**: Complete all levels to win

## 🔍 Technical Highlights

### Advanced Physics Integration
- **Character Collision**: Multi-body collision system for realistic character physics
- **Bullet Ballistics**: Physics-simulated projectiles with accurate collision detection
- **Environmental Interaction**: Realistic movement and collision with city structures

### Sophisticated AI Systems
- **Personality-Driven Dialogue**: NPCs with unique personalities affecting conversation
- **Dynamic Behavioral States**: Walking patterns, combat stances, and interaction modes
- **Intelligence Simulation**: Information gathering through strategic conversations

### Performance Optimizations
- **Efficient Rendering**: Optimized Three.js rendering pipeline
- **Physics Optimization**: Selective physics simulation for performance
- **Memory Management**: Proper cleanup and resource management

## 🐛 Troubleshooting

### Common Issues
1. **Game won't load**: Ensure you're running from a web server, not file:// protocol
2. **Mouse look not working**: Click in the game area to enable pointer lock
3. **Performance issues**: Try Chrome browser for best WebGL performance
4. **Physics glitches**: Refresh the page to reset physics world

### Performance Tips
- Use Chrome or Chromium-based browsers for best performance
- Ensure hardware acceleration is enabled
- Close other tabs to free up GPU resources

## 📜 License

This project is developed by Ratna Kirti for educational and portfolio purposes.

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome! Feel free to open issues or reach out.

---

**Enjoy your undercover mission in REPO City! 🕵️‍♂️**
