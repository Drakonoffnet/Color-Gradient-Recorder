import { useState, useRef, useEffect } from "react";

const LEDGradientRecorder = () => {
  const [numberOfLEDs ] = useState(8);
  const [leds, setLEDs] = useState(Array(8).fill({ r: 0, g: 0, b: 0 }));
  const [activeLEDs, setActiveLEDs] = useState(Array(8).fill(true));
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedSequence, setRecordedSequence] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [activeColorScheme, setActiveColorScheme] = useState("rainbow");
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [minimumMoveThreshold, setMinimumMoveThreshold] = useState(0.005);

  const gradientRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });

  // Color schemes
  const colorSchemes = {
    rainbow: [
      { r: 255, g: 0, b: 0 }, // Red
      { r: 255, g: 165, b: 0 }, // Orange
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 0, g: 255, b: 0 }, // Green
      { r: 0, g: 255, b: 255 }, // Cyan
      { r: 0, g: 0, b: 255 }, // Blue
      { r: 128, g: 0, b: 128 }, // Purple
      { r: 255, g: 0, b: 255 }, // Magenta
    ],
    redBlue: [
      { r: 255, g: 0, b: 0 }, // Red
      { r: 255, g: 100, b: 100 }, // Light Red
      { r: 255, g: 150, b: 150 }, // Pink
      { r: 200, g: 200, b: 255 }, // Light Blue
      { r: 100, g: 100, b: 255 }, // Medium Blue
      { r: 0, g: 0, b: 255 }, // Blue
    ],
    greenYellow: [
      { r: 0, g: 100, b: 0 }, // Dark Green
      { r: 0, g: 150, b: 0 }, // Green
      { r: 0, g: 255, b: 0 }, // Bright Green
      { r: 150, g: 255, b: 0 }, // Lime Green
      { r: 255, g: 255, b: 0 }, // Yellow
      { r: 255, g: 200, b: 0 }, // Gold
    ],
    purpleOrange: [
      { r: 75, g: 0, b: 130 }, // Indigo
      { r: 128, g: 0, b: 128 }, // Purple
      { r: 200, g: 0, b: 200 }, // Violet
      { r: 255, g: 100, b: 200 }, // Pink
      { r: 255, g: 120, b: 0 }, // Orange
      { r: 255, g: 165, b: 0 }, // Light Orange
    ],
    sunset: [
      { r: 0, g: 0, b: 100 }, // Dark Blue
      { r: 75, g: 0, b: 130 }, // Indigo
      { r: 150, g: 0, b: 75 }, // Dark Purple
      { r: 200, g: 0, b: 0 }, // Dark Red
      { r: 255, g: 75, b: 0 }, // Red-Orange
      { r: 255, g: 150, b: 0 }, // Orange
    ],
    ocean: [
      { r: 0, g: 0, b: 100 }, // Deep Blue
      { r: 0, g: 50, b: 150 }, // Navy Blue
      { r: 0, g: 100, b: 200 }, // Ocean Blue
      { r: 0, g: 150, b: 220 }, // Light Blue
      { r: 0, g: 200, b: 230 }, // Cyan
      { r: 0, g: 255, b: 255 }, // Aqua
    ],
    monochrome: [
      { r: 0, g: 0, b: 0 }, // Black
      { r: 50, g: 50, b: 50 }, // Dark Gray
      { r: 100, g: 100, b: 100 }, // Gray
      { r: 150, g: 150, b: 150 }, // Medium Gray
      { r: 200, g: 200, b: 200 }, // Light Gray
      { r: 255, g: 255, b: 255 }, // White
    ],
  };

  // Get color from relative position using current color scheme
  const getColorFromPosition = (x, y) => {
    // Get current color scheme
    const currentScheme = colorSchemes[activeColorScheme];
    if (!currentScheme || currentScheme.length === 0) {
      return { r: 0, g: 0, b: 0 };
    }

    // Get base color by interpolating through gradient colors
    const index = x * (currentScheme.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.min(Math.ceil(index), currentScheme.length - 1);
    const fraction = index - lowerIndex;

    let color;

    if (
      lowerIndex === upperIndex ||
      lowerIndex < 0 ||
      upperIndex >= currentScheme.length
    ) {
      color = {
        ...currentScheme[
          Math.max(0, Math.min(lowerIndex, currentScheme.length - 1))
        ],
      };
    } else {
      const lower = currentScheme[lowerIndex];
      const upper = currentScheme[upperIndex];

      color = {
        r: Math.round(lower.r + fraction * (upper.r - lower.r)),
        g: Math.round(lower.g + fraction * (upper.g - lower.g)),
        b: Math.round(lower.b + fraction * (upper.b - lower.b)),
      };
    }

    // Adjust brightness/saturation based on y
    // Top (y=0) is full brightness, Bottom (y=1) is darker
    const brightness = 1 - y;

    return {
      r: Math.round(color.r * brightness),
      g: Math.round(color.g * brightness),
      b: Math.round(color.b * brightness),
    };
  };

  // Handle mouse movement on gradient
  const handleMouseMove = (e) => {
    if (!gradientRef.current) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate relative position (0 to 1)
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));

    // Update current position for cursor display
    setCurrentPosition({ x: relX, y: relY });

    // If recording, check if we should record this movement
    if (isRecording) {
      // Calculate distance moved since last recorded position
      const lastX = lastPositionRef.current.x;
      const lastY = lastPositionRef.current.y;
      const distance = Math.sqrt(
        Math.pow(relX - lastX, 2) + Math.pow(relY - lastY, 2),
      );

      // Only record if we've moved more than the threshold or if enough time has passed
      const now = Date.now();
      const timeSinceLastMove = now - lastMoveTime;

      if (distance > minimumMoveThreshold || timeSinceLastMove > 100) {
        // Get color from current position
        const color = getColorFromPosition(relX, relY);

        // Update only active LEDs to show current color
        const newLEDs = [...leds];
        activeLEDs.forEach((isActive, index) => {
          if (isActive) {
            newLEDs[index] = color;
          }
        });
        setLEDs(newLEDs);

        // Record the color with timestamp
        const timestamp = now - recordingStartTimeRef.current;
        setRecordedSequence((prev) => [
          ...prev,
          {
            timestamp,
            color,
            scheme: activeColorScheme,
          },
        ]);

        // Update last position and time
        lastPositionRef.current = { x: relX, y: relY };
        setLastMoveTime(now);
      }
    }
  };

  // No interval-based recording, we now record directly in the mouse move handler

  // Setup keyboard event listeners for color scheme switching
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isRecording) return;

      // Use number keys 1-7 to switch color schemes
      const schemeKeys = {
        "1": "rainbow",
        "2": "redBlue",
        "3": "greenYellow",
        "4": "purpleOrange",
        "5": "sunset",
        "6": "ocean",
        "7": "monochrome",
      };

      if (e && e.key && schemeKeys[e.key]) {
        setActiveColorScheme(schemeKeys[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecording]);

  // Start recording
  const startRecording = () => {
    console.log("Starting recording");
    setIsRecording(true);
    setRecordedSequence([]);

    const now = Date.now();
    recordingStartTimeRef.current = now;
    setLastMoveTime(now);
    lastPositionRef.current = { x: 0, y: 0 };

    setIsPlaying(false);

    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
    }

    // Initialize with first frame
    const initialColor = { r: 0, g: 0, b: 0 };
    setRecordedSequence([
      {
        timestamp: 0,
        color: initialColor,
        scheme: activeColorScheme,
      },
    ]);
  };

  // Stop recording
  const stopRecording = () => {
    console.log(
      "Stopping recording with",
      recordedSequence.length,
      "frames captured",
    );
    setIsRecording(false);
  };

  // Play recorded sequence
  const playRecording = () => {
    if (recordedSequence.length === 0) {
      console.log("No recording to play");
      return;
    }

    console.log("Starting playback with", recordedSequence.length, "frames");
    setIsPlaying(true);
    setIsRecording(false);

    let currentIndex = 0;
    const startTime = Date.now();

    const playStep = () => {
      const currentTime = Date.now() - startTime;
      const targetTime =
        recordedSequence[currentIndex].timestamp / playbackSpeed;

      if (currentTime >= targetTime) {
        // Update only active LEDs
        const newLEDs = [...leds];
        activeLEDs.forEach((isActive, index) => {
          if (isActive) {
            newLEDs[index] = recordedSequence[currentIndex].color;
          }
        });
        setLEDs(newLEDs);

        currentIndex++;

        if (currentIndex >= recordedSequence.length) {
          // End of sequence
          console.log("Playback complete");
          setIsPlaying(false);
          return;
        }
      }

      playbackTimerRef.current = setTimeout(playStep, 10);
    };

    // Start with first frame
    playStep();
  };

  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  };

  // Generate gradient background from current color scheme
  const generateGradient = () => {
    const currentScheme = colorSchemes[activeColorScheme];
    if (!currentScheme) return "";

    let gradient = "linear-gradient(to right";

    currentScheme.forEach((color, index) => {
      const percent = (index / (currentScheme.length - 1)) * 100;
      gradient += `, rgb(${color.r}, ${color.g}, ${color.b}) ${percent}%`;
    });

    gradient += ")";
    return gradient;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, []);

  // Helper to convert RGB to hex
  // const rgbToHex = (r, g, b) => {
  //   return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  // };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">LED Color Gradient Recorder</h1>

      {/* LED Display */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg flex justify-center items-center">
        <div className="flex space-x-4">
          {leds.map((led, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-full cursor-pointer ${!activeLEDs[index] ? "opacity-50" : ""}`}
              style={{
                backgroundColor: `rgb(${led.r}, ${led.g}, ${led.b})`,
                boxShadow: `0 0 10px rgba(${led.r}, ${led.g}, ${led.b}, 0.7)`,
                border: activeLEDs[index]
                  ? "2px solid white"
                  : "2px solid transparent",
              }}
              onClick={() => {
                const newActiveLEDs = [...activeLEDs];
                newActiveLEDs[index] = !newActiveLEDs[index];
                setActiveLEDs(newActiveLEDs);
              }}
            />
          ))}
        </div>
      </div>

      {/* Color Gradient Plate */}
      <div
        ref={gradientRef}
        className="w-full h-64 rounded-lg mb-6 cursor-crosshair relative"
        style={{
          background: generateGradient(),
          backgroundSize: "100% 100%",
          backgroundImage: `${generateGradient()}, linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,1))`,
          backgroundBlendMode: "normal",
        }}
        onMouseMove={handleMouseMove}
      >
        {isRecording && (
          <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg">
            Recording...
          </div>
        )}

        {/* Position indicator */}
        <div
          className="absolute w-6 h-6 border-2 border-white rounded-full pointer-events-none"
          style={{
            left: `${currentPosition.x * 100}%`,
            top: `${currentPosition.y * 100}%`,
            transform: "translate(-50%, -50%)",
            display: isRecording ? "block" : "none",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Color Scheme Selector */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Color Scheme</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {Object.keys(colorSchemes).map((scheme, index) => (
              <div
                key={scheme}
                className={`rounded overflow-hidden cursor-pointer border-2 ${activeColorScheme === scheme ? "border-blue-500" : "border-transparent"}`}
                onClick={() => setActiveColorScheme(scheme)}
              >
                <div
                  className="h-8 w-full"
                  style={{
                    background: `linear-gradient(to right, ${colorSchemes[scheme].map((c) => `rgb(${c.r},${c.g},${c.b})`).join(", ")})`,
                  }}
                ></div>
                <div className="py-1 px-2 text-center text-xs bg-white">
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                  {activeColorScheme === scheme && isRecording && (
                    <span className="ml-1 text-gray-500">
                      (key {index + 1})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isRecording && (
            <div className="p-2 bg-yellow-100 rounded mb-4">
              <p className="text-sm">
                Press keys <strong>1-7</strong> to quickly switch color schemes
                while recording.
              </p>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Recording Controls</h2>

          <div className="flex space-x-4 mb-4">
            {!isRecording ? (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded flex-grow"
                onClick={startRecording}
                disabled={isPlaying}
              >
                Start Recording
              </button>
            ) : (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded flex-grow"
                onClick={stopRecording}
              >
                Stop Recording
              </button>
            )}

            {!isPlaying ? (
              <button
                className="bg-green-500 text-white px-4 py-2 rounded flex-grow"
                onClick={playRecording}
                disabled={isRecording || recordedSequence.length === 0}
              >
                Play Recording
              </button>
            ) : (
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded flex-grow"
                onClick={stopPlayback}
              >
                Stop Playback
              </button>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">
              Playback Speed: {playbackSpeed}x
            </label>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="w-full"
              disabled={isPlaying}
            />
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-2">LED Selection</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded"
                onClick={() => setActiveLEDs(Array(numberOfLEDs).fill(true))}
              >
                Select All
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded"
                onClick={() => setActiveLEDs(Array(numberOfLEDs).fill(false))}
              >
                Deselect All
              </button>
              <button
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded"
                onClick={() =>
                  setActiveLEDs(activeLEDs.map((active) => !active))
                }
              >
                Invert Selection
              </button>
              <button
                className="px-3 py-1 bg-green-500 text-white text-sm rounded"
                onClick={() => {
                  const evenOdd = Array(numberOfLEDs).fill(false);
                  for (let i = 0; i < numberOfLEDs; i += 2) {
                    evenOdd[i] = true;
                  }
                  setActiveLEDs(evenOdd);
                }}
              >
                Even LEDs
              </button>
              <button
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded"
                onClick={() => {
                  const evenOdd = Array(numberOfLEDs).fill(false);
                  for (let i = 1; i < numberOfLEDs; i += 2) {
                    evenOdd[i] = true;
                  }
                  setActiveLEDs(evenOdd);
                }}
              >
                Odd LEDs
              </button>
            </div>

            <div className="mb-3">
              <label className="block mb-1">Movement Sensitivity:</label>
              <input
                type="range"
                min="0.001"
                max="0.05"
                step="0.001"
                value={minimumMoveThreshold}
                onChange={(e) =>
                  setMinimumMoveThreshold(parseFloat(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>High (records small movements)</span>
                <span>Low (only major movements)</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Click on LEDs to activate/deactivate them. Only active LEDs will
              display the recorded colors.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Move your mouse over the color gradient to record colors. The
              system only records when you move the mouse.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Recorded: {recordedSequence.length} color points over{" "}
              {recordedSequence.length > 0
                ? (
                    recordedSequence[recordedSequence.length - 1].timestamp /
                    1000
                  ).toFixed(1)
                : 0}{" "}
              seconds
            </p>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Recorded Sequence Data</h2>
        <div className="bg-gray-200 p-2 rounded overflow-auto max-h-40">
          <pre className="text-sm">
            {JSON.stringify(
              recordedSequence.map((item: any) => ({
                time: (item.timestamp / 1000).toFixed(2) + "s",
                color: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                scheme: item.scheme || activeColorScheme,
              })),
              null,
              2,
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LEDGradientRecorder;
