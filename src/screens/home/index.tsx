import { useEffect, useRef, useState } from "react";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import { SWATCHES } from "@/constants";
import { FaEraser, FaPen, FaPencilAlt, FaUndo, FaRedo } from "react-icons/fa"; // Import undo and redo icons
import { Slider } from "@/components/ui/slider";

interface GeneratedResult {
  expression: string;
  answer: string;
}

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [isEraser, setIsEraser] = useState(false);
  const [strokeSize, setStrokeSize] = useState(3); // Default stroke size
  const [history, setHistory] = useState<string[]>([]); // History stack
  const [historyIndex, setHistoryIndex] = useState(-1); // Current index in history

  // Reset canvas
  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      canvas.style.backgroundColor = "#424242";

      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = strokeSize; // Set initial stroke size
        saveCanvasState(); // Save the initial canvas state
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = isEraser ? "#424242" : color;
    ctx.lineWidth = strokeSize; // Use the stroke size
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = isEraser ? "#424242" : color; // Use the correct color based on mode
        ctx.lineWidth = strokeSize; // Use the stroke size
        ctx.lineCap = "round";
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvasState(); // Save canvas state after drawing
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      // Clear history when resetting the canvas
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newHistory = [...history.slice(0, historyIndex + 1)]; // Keep only the history up to the current index
      newHistory.push(canvas.toDataURL());
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1); // Move to the latest state
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        const prevState = history[historyIndex - 1]; // Get the previous state
        const img = new Image();
        img.src = prevState!;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear current canvas
          ctx.drawImage(img, 0, 0); // Draw the previous state
        };
        setHistoryIndex(historyIndex - 1); // Update index
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const ctx = canvas?.getContext("2d");
      if (ctx) {
        const nextState = history[historyIndex + 1]; // Get the next state
        const img = new Image();
        img.src = nextState!;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear current canvas
          ctx.drawImage(img, 0, 0); // Draw the next state
        };
        setHistoryIndex(historyIndex + 1); // Update index
      }
    }
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
    setColor("#424242"); // Set to canvas color or white
  };

  const handleColorClick = (swatch: string) => {
    setIsEraser(false); // Disable eraser when selecting a color
    setColor(swatch);
  };

  return (
    <>
      <div className="flex items-center justify-between p-6 bg-gray-800 rounded-lg shadow-md">
        <Button
          onClick={() => setReset(true)}
          className="z-20 bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg hover:shadow-xl transition duration-300 rounded-lg px-4 py-2"
        >
          Reset
        </Button>

        <Group className="z-20 w-full max-w-xl justify-center">
          {SWATCHES.map((swatch: string) => (
            <ColorSwatch
              key={swatch}
              color={swatch}
              onClick={() => handleColorClick(swatch)}
              className={`cursor-pointer border-white border-2 rounded-full transition duration-300 transform hover:scale-105`}
            >
              {color === swatch ? (
                <FaPen
                  size={20}
                  className={` ${
                    color === "#ffffff" ? "text-gray-800" : "text-white"
                  } transition duration-300`}
                />
              ) : null}
            </ColorSwatch>
          ))}
          <ColorSwatch
            color="#ffffff" // Eraser background color
            onClick={toggleEraser}
            className={`cursor-pointer border-2 rounded-full transition duration-300 transform hover:scale-105`}
          >
            <FaEraser
              size={22} // Increase size to make it more visible
              className={`transition duration-300 ${
                isEraser ? "text-gray-800 animate-bounce" : "text-gray-800"
              }`}
            />
          </ColorSwatch>
        </Group>

        <div className="flex z-20 items-center justify-center bg-slate-500 rounded-lg p-4 shadow-md transition-transform hover:scale-105">
          <FaPencilAlt size={24} className="text-white mr-2" />
          <Slider
            value={[strokeSize]}
            onValueChange={(value) => {
              setStrokeSize(value[0]);
            }}
            min={1}
            max={20}
            step={1}
            className="z-20 mx-4 w-60"
          />
          <p className="inline text-white font-bold">{strokeSize}</p>
        </div>

        <Button
          onClick={undo}
          className="z-20 bg-gradient-to-r from-yellow-600 to-yellow-400 text-white shadow-lg hover:shadow-xl transition duration-300 rounded-lg px-4 py-2"
        >
          <FaUndo size={20} />
        </Button>

        <Button
          onClick={redo}
          className="z-20 bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg hover:shadow-xl transition duration-300 rounded-lg px-4 py-2"
        >
          <FaRedo size={20} />
        </Button>

        <Button className="z-20 bg-gradient-to-r from-red-600 to-red-400 text-white shadow-lg hover:shadow-xl transition duration-300 rounded-lg px-4 py-2">
          Run
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
      />
    </>
  );
}
