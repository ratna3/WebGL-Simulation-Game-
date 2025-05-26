// Utility functions for the game

// Math utilities
class MathUtils {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    static randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static distance2D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    static distance3D(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}

// Color utilities
class ColorUtils {
    static randomColor() {
        return Math.random() * 0xffffff;
    }
    
    static randomSkinTone() {
        const skinTones = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c4033];
        return skinTones[Math.floor(Math.random() * skinTones.length)];
    }
    
    static randomHairColor() {
        const hairColors = [0x8b4513, 0x000000, 0x8b0000, 0xffd700, 0x654321, 0x2f1b14];
        return hairColors[Math.floor(Math.random() * hairColors.length)];
    }
    
    static randomClothingColor() {
        const clothingColors = [0x1e90ff, 0x228b22, 0xdc143c, 0x000080, 0x800080, 0x008080, 0x696969];
        return clothingColors[Math.floor(Math.random() * clothingColors.length)];
    }
}

// Name generation utility
class NameGenerator {
    static getRandomName() {
        const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Anna', 'Robert', 'Emily'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
        
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return `${firstName} ${lastName}`;
    }
}

// Make utilities globally available
window.MathUtils = MathUtils;
window.ColorUtils = ColorUtils;
window.NameGenerator = NameGenerator;

console.log("Utils.js loaded successfully");
