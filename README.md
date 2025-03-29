# LED Color Gradient Recorder

![LED Color Gradient Recorder](https://example.com/led-recorder-demo.gif)

A visual tool for creating, editing, and exporting custom RGB LED lighting sequences through an intuitive mouse-based interface.

## Overview

The LED Color Gradient Recorder transforms the way you design RGB LED effects. Instead of writing complex code or using tedious timeline editors, simply move your mouse across a color palette to create beautiful lighting patterns. The recorder captures both your color selections and timing, making it easy to create professional-quality lighting sequences.

## Features

- **Intuitive Color Selection**: Design effects by moving your mouse across a visual gradient
- **Real-time Feedback**: See your LED effects instantly as you create them
- **Selective LED Control**: Activate specific LEDs to create patterns across your strip
- **Multiple Color Schemes**: Choose from 7 pre-defined color palettes:
  - Rainbow
  - RedBlue
  - GreenYellow
  - PurpleOrange
  - Sunset
  - Ocean
  - Monochrome
- **Hotkey Palette Switching**: Change color schemes mid-recording using number keys 1-7
- **Movement-Based Recording**: System captures color changes only when you move your mouse
- **Adjustable Sensitivity**: Fine-tune how responsive the recorder is to your movements
- **Variable Speed Playback**: Review your creations at different speeds
- **JSON Export**: Save your designs for use in hardware projects

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/led-gradient-recorder.git

# Navigate to the project directory
cd led-gradient-recorder

# Install dependencies
npm install

# Start the development server
npm start
```

## Usage

### Basic Recording

1. Select your desired color scheme
2. Click "Start Recording"
3. Move your mouse across the color gradient to create your pattern
4. Click "Stop Recording" when done
5. Click "Play Recording" to preview your creation

### Advanced Techniques

#### LED Selection
- Click on individual LEDs to toggle them active/inactive
- Use preset buttons for common patterns (all, none, alternating)
- Only active LEDs will display your recorded colors

#### Sensitivity Adjustment
- Use the sensitivity slider to control how the recorder responds to mouse movements
- Higher sensitivity (left) captures subtle movements
- Lower sensitivity (right) only records significant changes

#### Color Scheme Switching
- While recording, press number keys 1-7 to switch between color schemes
- This allows for dynamic palette changes within a single sequence

### Exporting Your Design

The recorded sequence data is displayed in JSON format at the bottom of the interface. You can copy this data for use in your LED controller projects.

## Hardware Implementation

The exported JSON contains all the information needed to recreate your sequence on physical LED hardware:

```json
[
  {
    "time": "0.00s",
    "color": "rgb(0,0,0)",
    "scheme": "rainbow"
  },
  {
    "time": "0.25s",
    "color": "rgb(255,0,0)",
    "scheme": "rainbow"
  },
  ...
]
```

Example code for Arduino implementation:

```cpp
#include <FastLED.h>

#define NUM_LEDS 8
#define DATA_PIN 6

CRGB leds[NUM_LEDS];

// Your exported sequence converted to C array
const struct {
  unsigned long time;  // milliseconds
  CRGB color;
} sequence[] = {
  { 0, CRGB(0, 0, 0) },
  { 250, CRGB(255, 0, 0) },
  // ... additional frames
};

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {
  playSequence();
}

void playSequence() {
  unsigned long startTime = millis();
  int frame = 0;
  
  while (frame < sizeof(sequence)/sizeof(sequence[0])) {
    unsigned long currentTime = millis() - startTime;
    
    if (currentTime >= sequence[frame].time) {
      for (int i = 0; i < NUM_LEDS; i++) {
        leds[i] = sequence[frame].color;
      }
      FastLED.show();
      frame++;
    }
  }
}
```

## Use Cases

- Custom lighting effects for smart home systems
- Interactive art installations
- Stage lighting design
- Gaming peripherals
- Wearable technology
- Automotive interior lighting
- Holiday decorations
- Product prototyping

## Target Users

- Makers and DIY enthusiasts
- Creative professionals
- Educators and students
- Small-scale manufacturers
- Artists and experience designers
- Event organizers
- Smart home enthusiasts
- Prototype developers

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the creative needs of the maker community
- Built with React.js
- Special thanks to all open-source LED control libraries

---

Made with ❤️ for creators, makers, and LED enthusiasts everywhere.