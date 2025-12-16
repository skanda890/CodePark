# Game 1 - Catch the Falling Objects - Changelog

## [Enhanced Version] - 2025-12-13

### Added Features

#### 🎮 Game Controls

- **Pause/Resume**: Press SPACEBAR or click PAUSE button to pause the game
- **Restart**: Click RESTART button to start a new game at any time
- **Responsive Controls**: Arrow keys (← →) to move the player

#### ❤️ Lives System

- Game starts with **3 lives**
- Lose a life when missing an object (it falls to the bottom)
- Visual heart display shows remaining lives
- Game ends when lives reach 0
- Missed object counter tracks total misses

#### 🎯 Game Over Screen

- Displays final score and level when game ends
- Shows "GAME OVER" modal with final statistics
- Option to play again immediately
- Disables difficulty selector during gameplay

#### 🎵 Sound Effects

- **Toggle Sound**: Click the sound icon to mute/unmute
- Collection sound (varies by object type)
- Power-up acquisition sound
- Level up sounds
- Game over sound
- Pause/Resume sounds
- Restart success sounds

#### ⚙️ Difficulty Selector

- **Easy**: Slower speed, longer spawn time, slower progression
- **Normal**: Balanced gameplay (default)
- **Hard**: Faster speed, more frequent spawns, faster progression
- **Insane**: Maximum difficulty for hardcore players
- Change difficulty anytime before game ends

#### 🎨 Visual Improvements

- Gradient backgrounds for better aesthetics
- Glowing effects for objects and player
- Smooth animations and transitions
- Power-up visual indicators (yellow glow)
- Lost lives fade effect
- Modern UI overlay with stats

#### ⚡ Gameplay Enhancements

- Level progression based on score (difficulty-dependent intervals)
- Objects speed increases with each level
- Power-up grants 1.5x speed boost for 5 seconds
- Visual feedback for power-up active state
- Smooth difficulty transitions
- Dynamic spawn rates based on difficulty

### Technical Improvements

- Consolidated game state management
- Audio context for web audio API sounds
- Better event handling and modal management
- Improved collision detection
- Responsive canvas resizing
- Cleaner code structure with modular functions

### Difficulty Specifications

| Setting | Speed | Spawn  | Max Speed | Level Up Interval |
| ------- | ----- | ------ | --------- | ----------------- |
| Easy    | 2.0   | 1500ms | 4.0       | Every 15 pts      |
| Normal  | 2.5   | 1000ms | 5.5       | Every 10 pts      |
| Hard    | 3.5   | 700ms  | 7.0       | Every 8 pts       |
| Insane  | 5.0   | 500ms  | 10.0      | Every 5 pts       |

### Controls Reference

| Action            | Input                    |
| ----------------- | ------------------------ |
| Move Left         | LEFT ARROW               |
| Move Right        | RIGHT ARROW              |
| Pause/Resume      | SPACEBAR or PAUSE Button |
| Restart           | RESTART Button           |
| Toggle Sound      | Sound Icon               |
| Change Difficulty | Difficulty Dropdown      |

### Object Types

- **Normal (Red)**: +1 point
- **Bonus (Green)**: +5 points, slower speed
- **Power-Up (Yellow)**: 5 seconds of 1.5x player speed

### Browser Compatibility

- Modern browsers with Web Audio API support
- Canvas 2D context required
- Responsive to window resizing
