import { useEffect, useRef, useState, ChangeEvent } from 'react';
import * as fabric from 'fabric';
import gifshot from 'gifshot';
import { cn } from '@/src/lib/utils';
import { 
  Type, 
  Image as ImageIcon, 
  Pencil, 
  Eraser, 
  Download, 
  Trash2, 
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Circle,
  Square,
  Minus,
  Undo,
  Redo,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// Available fonts
const FONTS = [
  { name: 'Standard', value: 'Inter' },
  { name: 'Artistico', value: 'Pacifico' },
  { name: 'Comic', value: 'Bangers' },
  { name: 'Elegante', value: 'Lobster' },
  { name: 'Bold', value: 'Anton' },
];

const COLORS = [
  '#CCFF00', // Neon Yellow
  '#FF00E5', // Neon Pink
  '#00F0FF', // Neon Blue
  '#FFFFFF', // White
  '#000000', // Black
  '#FF4D4D', // Red
  '#4DFF88', // Green
  '#4D79FF', // Blue
];

export default function StickerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'draw' | 'shape' | 'image'>('select');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedFont, setSelectedFont] = useState(FONTS[1].value); // Default to Pacifico
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // History Management
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUpdatingHistory = useRef(false);

  // Animation Management
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const animationFrameId = useRef<number | null>(null);

  const saveHistory = () => {
    if (!fabricCanvas.current || isUpdatingHistory.current) return;
    const json = JSON.stringify(fabricCanvas.current.toJSON());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    
    // Limit history to 50 steps
    if (newHistory.length > 50) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex <= 0 || !fabricCanvas.current) return;
    isUpdatingHistory.current = true;
    const prevIndex = historyIndex - 1;
    fabricCanvas.current.loadFromJSON(JSON.parse(history[prevIndex]), () => {
      fabricCanvas.current?.renderAll();
      setHistoryIndex(prevIndex);
      isUpdatingHistory.current = false;
    });
  };

  const redo = () => {
    if (historyIndex >= history.length - 1 || !fabricCanvas.current) return;
    isUpdatingHistory.current = true;
    const nextIndex = historyIndex + 1;
    fabricCanvas.current.loadFromJSON(JSON.parse(history[nextIndex]), () => {
      fabricCanvas.current?.renderAll();
      setHistoryIndex(nextIndex);
      isUpdatingHistory.current = false;
    });
  };

  useEffect(() => {
    if (!canvasRef.current || fabricCanvas.current) return;

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      width: 500,
      height: 500,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    // Save initial state
    saveHistory();

    // Removed guide circle to allow full canvas usage for true stickers

    // Listeners for history
    fabricCanvas.current.on('object:added', saveHistory);
    fabricCanvas.current.on('object:modified', saveHistory);
    fabricCanvas.current.on('object:removed', saveHistory);

    // Animation Loop
    const animate = (time: number) => {
      if (!fabricCanvas.current || isExportingGif) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      let needsRender = false;
      const objects = fabricCanvas.current.getObjects();
      
      for (const obj of objects) {
        const o = obj as any;
        
        // Ensure original properties are stored once
        if (o.customAnimation && o.customAnimation !== 'none' && o._originalAngle === undefined) {
          o._originalAngle = o.angle || 0;
          o._originalScaleX = o.scaleX || 1;
          o._originalScaleY = o.scaleY || 1;
          o._originalTop = o.top || 0;
          o._originalLeft = o.left || 0;
          o.set('objectCaching', false); // Disable caching ONLY when animating
        }

        if (!o.customAnimation || o.customAnimation === 'none') {
          // If it was just stopped, reset to original and re-enable caching
          if (o._originalAngle !== undefined) {
             o.set({
               angle: o._originalAngle,
               scaleX: o._originalScaleX,
               scaleY: o._originalScaleY,
               top: o._originalTop,
               left: o._originalLeft,
               objectCaching: true
             });
             delete o._originalAngle;
             delete o._originalScaleX;
             delete o._originalScaleY;
             delete o._originalTop;
             delete o._originalLeft;
             needsRender = true;
          }
          continue;
        }

        needsRender = true;
        const frequency = 0.005;
        const phase = (time * frequency) % (Math.PI * 2);

        switch (o.customAnimation) {
          case 'jelly':
            const sX = 1 + Math.sin(phase * 4) * 0.08;
            const sY = 1 + Math.cos(phase * 4) * 0.08;
            o.set({
              scaleX: o._originalScaleX * sX,
              scaleY: o._originalScaleY * sY
            });
            break;
          case 'pop':
            const pScale = 1 + Math.abs(Math.sin(phase * 5)) * 0.12;
            o.set({
              scaleX: o._originalScaleX * pScale,
              scaleY: o._originalScaleY * pScale
            });
            break;
          case 'float':
            o.set({
              top: o._originalTop + Math.sin(phase * 2) * 12,
              angle: o._originalAngle + Math.cos(phase) * 3
            });
            break;
          case 'shake':
            o.set({
              left: o._originalLeft + Math.sin(time * 0.02) * 3,
              angle: o._originalAngle + Math.sin(time * 0.05) * 4
            });
            break;
          case 'doodle':
            const dS = 1 + Math.sin(time * 0.01) * 0.02;
            o.set({
              scaleX: o._originalScaleX * dS,
              angle: o._originalAngle + Math.cos(time * 0.01) * 2
            });
            break;
        }
      }

      if (needsRender) {
        fabricCanvas.current.requestRenderAll();
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  const addText = () => {
    if (!fabricCanvas.current) return;
    const text = new fabric.IText('Testo Sticker', {
      left: 150,
      top: 150,
      fontFamily: selectedFont,
      fill: selectedColor,
      fontSize: 40,
    });
    fabricCanvas.current.add(text);
    fabricCanvas.current.setActiveObject(text);
    setActiveTool('select');
  };

  const addShape = (type: 'circle' | 'square') => {
    if (!fabricCanvas.current) return;
    let shape;
    if (type === 'circle') {
      shape = new fabric.Circle({
        radius: 50,
        fill: selectedColor,
        left: 200,
        top: 200,
      });
    } else {
      shape = new fabric.Rect({
        width: 100,
        height: 100,
        fill: selectedColor,
        left: 200,
        top: 200,
      });
    }
    fabricCanvas.current.add(shape);
    fabricCanvas.current.setActiveObject(shape);
    setActiveTool('select');
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      const img = await fabric.FabricImage.fromURL(data);
      img.scaleToWidth(200);
      fabricCanvas.current?.add(img);
      fabricCanvas.current?.setActiveObject(img);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleDrawingMode = () => {
    if (!fabricCanvas.current) return;
    const isDrawing = activeTool === 'draw';
    fabricCanvas.current.isDrawingMode = !isDrawing;
    
    if (!isDrawing) {
      fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
      fabricCanvas.current.freeDrawingBrush.color = selectedColor;
      fabricCanvas.current.freeDrawingBrush.width = 5;
      setActiveTool('draw');
    } else {
      setActiveTool('select');
    }
  };

  const deleteSelected = () => {
    if (!fabricCanvas.current) return;
    const activeObjects = fabricCanvas.current.getActiveObjects();
    if (activeObjects.length > 0) {
      fabricCanvas.current.remove(...activeObjects);
      fabricCanvas.current.discardActiveObject();
      fabricCanvas.current.requestRenderAll();
    }
  };

  const toggleStickerEffect = () => {
    if (!fabricCanvas.current) return;
    const activeObject = fabricCanvas.current.getActiveObject();
    if (activeObject) {
      const hasStroke = activeObject.stroke === '#fff';
      activeObject.set({
        stroke: hasStroke ? null : '#fff',
        strokeWidth: hasStroke ? 0 : 8,
        strokeUniform: true,
        shadow: hasStroke ? null : new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 10,
          offsetX: 5,
          offsetY: 5
        }),
        paintFirst: 'stroke'
      });
      fabricCanvas.current.requestRenderAll();
      saveHistory();
    }
  };

  const exportGif = () => {
    if (!fabricCanvas.current) return;
    setIsExportingGif(true);
    setExportProgress(0);

    const frames: string[] = [];
    const frameCount = 30;
    const interval = 50; // Capture faster for smoother GIF

    // Hide selection controls
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();

    let captured = 0;
    const capture = () => {
      if (captured >= frameCount) {
        setExportProgress(90);
        gifshot.createGIF({
          images: frames,
          gifWidth: 500,
          gifHeight: 500,
          interval: 0.05,
          numFrames: frameCount,
          frameDuration: 1,
          sampleInterval: 5,
        }, (obj: any) => {
          if (!obj.error) {
            const link = document.createElement('a');
            link.download = `stickart-animated-${Date.now()}.gif`;
            link.href = obj.image;
            link.click();
            
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: COLORS,
            });
          }
          setIsExportingGif(false);
          setExportProgress(0);
        });
        return;
      }

      if (fabricCanvas.current) {
        // High quality data URL
        frames.push(fabricCanvas.current.toDataURL({ format: 'png' }));
      }
      captured++;
      setExportProgress(Math.floor((captured / frameCount) * 80));
      setTimeout(capture, interval);
    };

    capture();
  };

  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = 'transparent';
    fabricCanvas.current.requestRenderAll();
    saveHistory();
  };

  const setObjectAnimation = (type: 'none' | 'jelly' | 'float' | 'pop' | 'shake' | 'doodle') => {
    if (!fabricCanvas.current) return;
    const activeObject = fabricCanvas.current.getActiveObject() as any;
    if (activeObject) {
      // Clean reset
      if (activeObject._originalAngle !== undefined) {
        activeObject.set({
          angle: activeObject._originalAngle,
          scaleX: activeObject._originalScaleX,
          scaleY: activeObject._originalScaleY,
          top: activeObject._originalTop,
          left: activeObject._originalLeft,
          skewX: 0,
          skewY: 0
        });
      }
      
      activeObject.customAnimation = type;
      delete activeObject._originalAngle;
      delete activeObject._originalScaleX;
      delete activeObject._originalScaleY;
      delete activeObject._originalTop;
      delete activeObject._originalLeft;
      
      fabricCanvas.current.requestRenderAll();
      saveHistory();
    }
  };

  const exportSticker = (format: 'png' | 'svg' | 'gif') => {
    if (format === 'gif') {
      exportGif();
      return;
    }

    if (!fabricCanvas.current) return;
    
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();

    let data;
    let fileName = `stickart-${Date.now()}`;

    if (format === 'png') {
      data = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 2 });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = data;
      link.click();
    } else if (format === 'svg') {
      data = fabricCanvas.current.toSVG();
      const blob = new Blob([data], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}.svg`;
      link.href = url;
      link.click();
    }

    confetti({
      particleCount: 100,
      spread: 50,
      origin: { y: 0.8 },
    });
  };

  const changeTextFont = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    if (!fabricCanvas.current) return;
    
    const activeObjects = fabricCanvas.current.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
          (obj as any).set({ fontFamily });
        }
      });
      fabricCanvas.current.requestRenderAll();
      saveHistory();
    }
  };

  const changeActiveColor = (color: string) => {
    setSelectedColor(color);
    if (!fabricCanvas.current) return;
    
    const activeObjects = fabricCanvas.current.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        obj.set({ fill: color });
      });
      fabricCanvas.current.requestRenderAll();
      saveHistory();
    }

    if (fabricCanvas.current.isDrawingMode && fabricCanvas.current.freeDrawingBrush) {
      fabricCanvas.current.freeDrawingBrush.color = color;
    }
  };

  const [activeAnimation, setActiveAnimation] = useState<'none' | 'bounce' | 'pulse' | 'spin'>('none');

  const animations = {
    none: "",
    bounce: "animate-bounce",
    pulse: "animate-pulse",
    spin: "animate-spin",
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-deep-bg relative">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366f1] rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ec4899] rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#06b6d4] rounded-full blur-[100px] opacity-20"></div>
      </div>

      {/* Sidebar Tool - Mobile Overlay / Desktop Aside */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="fixed md:relative inset-y-0 left-0 w-full md:w-[320px] glass-panel border-r border-white/10 overflow-hidden z-50 md:z-20 flex flex-col"
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
                    S
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight">StickArt Studio</h1>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest leading-none mt-1">Creative Engine v2.4</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 md:hidden glass-button rounded-xl"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-32">
                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Strumenti</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setActiveTool('select');
                        if (fabricCanvas.current) fabricCanvas.current.isDrawingMode = false;
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-24",
                        activeTool === 'select' ? "bg-white/20 border-white/40 shadow-lg" : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Layers size={24} className={cn("mb-2", activeTool === 'select' ? "text-indigo-400" : "text-white/60")} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Muovi</span>
                    </button>
                    <button 
                      onClick={addText}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl glass-button text-white/80 h-24"
                    >
                      <Type size={24} className="mb-2 text-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Testo</span>
                    </button>
                    <button 
                      onClick={toggleDrawingMode}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-24",
                        activeTool === 'draw' ? "bg-white/20 border-white/40 shadow-lg" : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Pencil size={24} className={cn("mb-2", activeTool === 'draw' ? "text-pink-400" : "text-white/60")} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Disegna</span>
                    </button>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="img-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label 
                        htmlFor="img-upload"
                        className="flex flex-col items-center justify-center p-4 rounded-2xl glass-button text-white/80 cursor-pointer h-24"
                      >
                        <ImageIcon size={24} className="mb-2 text-cyan-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Media</span>
                      </label>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Azioni</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={undo} 
                      disabled={historyIndex <= 0}
                      className={cn(
                        "flex-1 py-3 glass-button rounded-xl flex justify-center",
                        historyIndex <= 0 && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <Undo size={18}/>
                    </button>
                    <button 
                      onClick={redo} 
                      disabled={historyIndex >= history.length - 1}
                      className={cn(
                        "flex-1 py-3 glass-button rounded-xl flex justify-center",
                        historyIndex >= history.length - 1 && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      <Redo size={18}/>
                    </button>
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Stile Sticker</h2>
                  <button 
                    onClick={toggleStickerEffect}
                    className="w-full py-4 glass-button rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    <Sparkles size={16} className="text-neon-yellow"/>
                    Toggle Sticker Border
                  </button>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Animazione Dinamica</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'jelly', 'float', 'pop', 'shake', 'doodle'] as const).map(anim => (
                      <button 
                        key={anim}
                        onClick={() => setObjectAnimation(anim)}
                        className="py-3 px-1 rounded-xl border border-white/10 glass-button text-[10px] font-bold uppercase hover:border-indigo-500/50"
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Workspace</h2>
                  <button 
                    onClick={clearCanvas}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase hover:bg-red-500/10 hover:border-red-500/30 transition-all text-white/60 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                    Clean Stage
                  </button>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Forme Veloci</h2>
                  <div className="flex gap-2">
                    <button onClick={() => addShape('circle')} className="flex-1 py-4 glass-button rounded-xl flex justify-center"><Circle size={20}/></button>
                    <button onClick={() => addShape('square')} className="flex-1 py-4 glass-button rounded-xl flex justify-center"><Square size={20}/></button>
                    <button 
                      onClick={deleteSelected} 
                      className="flex-1 py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors flex justify-center"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Anteprima Animazione</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'bounce', 'pulse', 'spin'] as const).map(anim => (
                      <button 
                        key={anim}
                        onClick={() => setActiveAnimation(anim)}
                        className={cn(
                          "py-3 px-1 rounded-xl border text-[9px] font-bold uppercase transition-all",
                          activeAnimation === anim ? "bg-indigo-500/30 border-indigo-500/50 text-white" : "glass-button text-white/40"
                        )}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Artistic Fonts</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {FONTS.map(f => (
                      <button 
                        key={f.value}
                        onClick={() => changeTextFont(f.value)}
                        style={{ fontFamily: f.value }}
                        className={cn(
                          "text-left py-4 px-4 rounded-xl border transition-all text-lg",
                          selectedFont === f.value ? "bg-white/20 border-white/40 shadow-lg" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest">Tavolozza</h2>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => changeActiveColor(c)}
                        className={cn(
                          "w-9 h-9 rounded-full border-2 transition-transform hover:scale-110",
                          selectedColor === c ? "border-white scale-110" : "border-white/10"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-6 border-t border-white/10 bg-transparent mt-auto backdrop-blur-md">
                 <button 
                    onClick={() => exportSticker('png')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                 >
                   <Download size={16} />
                   Export PNG
                 </button>
                 <button 
                    onClick={() => exportSticker('gif')}
                    disabled={isExportingGif}
                    className={cn(
                      "w-full mt-2 py-4 bg-pink-600 hover:bg-pink-500 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] relative overflow-hidden",
                      isExportingGif && "opacity-80 cursor-wait"
                    )}
                 >
                   {isExportingGif ? (
                     <>
                      <div className="absolute inset-0 bg-white/20 origin-left" style={{ transform: `scaleX(${exportProgress / 100})`, transition: 'transform 0.1s' }} />
                      <span className="relative z-10">Exporting {exportProgress}%</span>
                     </>
                   ) : (
                     <><Play size={16} /> Export Animated GIF</>
                   )}
                 </button>
                 <button 
                    onClick={() => exportSticker('svg')}
                    className="w-full mt-3 py-2 text-white/30 text-[9px] font-bold uppercase tracking-widest hover:text-white transition-all underline decoration-white/20 mb-4"
                 >
                   Export Vector (SVG)
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 relative flex flex-col z-10 w-full overflow-hidden">
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-white/10 bg-deep-bg/50 backdrop-blur-sm z-30">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 glass-button rounded-xl mr-2"
              >
                <Layers size={18} />
              </button>
            )}
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-[9px] md:text-[10px] font-bold uppercase text-white/40 tracking-[0.2em]">
              <span className="truncate max-w-[120px] md:max-w-none">Summer Pack 2024</span>
              <span className="hidden md:inline w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="text-indigo-400">Editing Mode</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
               <div className="w-8 h-8 rounded-full glass-panel border-2 border-indigo-500 text-[10px] flex items-center justify-center">01</div>
               <div className="w-8 h-8 rounded-full glass-panel border-2 border-white/10 text-[10px] flex items-center justify-center text-white/40">+</div>
             </div>
             {isSidebarOpen && (
               <button onClick={() => setIsSidebarOpen(false)} className="p-2 glass-button rounded-xl hidden md:block">
                 <ChevronLeft size={18} />
               </button>
             )}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative p-4 md:p-8 overflow-hidden bg-transparent">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          <div className="relative group w-full max-w-[500px] aspect-square flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl animate-pulse pointer-events-none" />
            
            <motion.div 
              className={cn(
                "relative bg-black/20 backdrop-blur-sm rounded-full md:rounded-[60px] p-2 md:p-8 flex items-center justify-center",
                "w-full aspect-square border border-white/5",
                animations[activeAnimation]
              )}
            >
              <div className="absolute inset-4 md:inset-8 border-2 md:border-4 border-dashed border-white/10 rounded-full md:rounded-[40px] pointer-events-none" />
              
              {/* Responsive scaling wrapper for canvas */}
              <div className="scale-[0.6] sm:scale-[0.8] md:scale-100 origin-center transition-transform duration-500">
                <canvas ref={canvasRef} className="rounded-full overflow-hidden" />
              </div>
            </motion.div>
            
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 backdrop-blur-md bg-black/40 px-4 md:px-6 py-2 rounded-2xl border border-white/10 whitespace-nowrap">
              <div className="flex flex-col items-center"><span className="text-[7px] md:text-[8px] text-white/40 uppercase">Canvas</span><span className="text-[9px] md:text-[10px] font-mono">512px</span></div>
              <div className="w-[1px] h-6 bg-white/10"></div>
              <div className="flex flex-col items-center"><span className="text-[7px] md:text-[8px] text-white/40 uppercase">Format</span><span className="text-[9px] md:text-[10px] font-mono">SVG/PNG</span></div>
              <div className="w-[1px] h-6 bg-white/10"></div>
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 text-white/60 hover:text-red-400 transition-colors"
                title="Svuota Canvas / Elimina Selezionato"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            {activeTool === 'draw' && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 animate-bounce z-40">
                Doodle Active
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
