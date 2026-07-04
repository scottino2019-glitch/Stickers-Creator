import React, { useEffect, useRef, useState } from 'react';
import { 
  ZoomIn, ZoomOut, Check, Sparkles, AlertCircle, 
  Paintbrush, RotateCcw, Eraser, Trash, Square, 
  HelpCircle, Eye, RefreshCw
} from 'lucide-react';
import { Sticker, StickerLayer, DrawingStroke, DrawingLayer, ImageLayer } from '../types';
import { drawStickerToCanvas, imageCache } from '../utils/canvasRenderer';

interface StickerCanvasWorkspaceProps {
  sticker: Sticker;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<StickerLayer>) => void;
  onAddDrawingStroke: (stroke: DrawingStroke) => void;
  onClearDrawingStrokes: () => void;
  onUndoDrawingStroke: () => void;
  
  // States related to drawing
  isDrawingMode: boolean;
  setIsDrawingMode: (val: boolean) => void;
  brushColor: string;
  setBrushColor: (col: string) => void;
  brushSize: number;
  setBrushSize: (sz: number) => void;
  isEraser: boolean;
  setIsEraser: (eraser: boolean) => void;

  onGeneratePreviewDataUrl: (url: string) => void;
}

export default function StickerCanvasWorkspace({
  sticker,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onAddDrawingStroke,
  onClearDrawingStrokes,
  onUndoDrawingStroke,

  isDrawingMode,
  setIsDrawingMode,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  isEraser,
  setIsEraser,

  onGeneratePreviewDataUrl,
}: StickerCanvasWorkspaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'dark' | 'light'>('transparent');
  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const activeStrokePointsRef = useRef<{ x: number; y: number }[]>([]);

  // Coordinates translation dragging states
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const dragStartCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const layerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Redraw canvas whenever sticker state changes
  const triggerRedraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawStickerToCanvas(canvas, sticker, selectedLayerId, triggerRedraw, false, isDraggingLayer || isCurrentlyDrawing);
    
    // Bubble up current dataURI to parent for WhatsApp preview ONLY if not actively dragging or drawing.
    // This dramatically boosts performance, preventing infinite re-renders and freezing when custom photos are edited!
    if (!isDraggingLayer && !isCurrentlyDrawing) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onGeneratePreviewDataUrl(dataUrl);
      } catch (err) {
        console.warn("Failed to generate preview DataURL (canvas may be tainted with restricted CORS imagery):", err);
      }
    }
  };

  useEffect(() => {
    triggerRedraw();
  }, [sticker, selectedLayerId, backgroundType, isDraggingLayer, isCurrentlyDrawing]);

  // Handle freehand drawing mechanics
  const getCanvasCoordinates = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 512;
    const y = ((clientY - rect.top) / rect.height) * 512;
    return { x, y };
  };

  const drawActiveStrokeInstantly = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && activeStrokePointsRef.current.length > 1) {
      drawStickerToCanvas(canvas, sticker, selectedLayerId, () => {}, false, true);

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const pts = activeStrokePointsRef.current;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const isPointInsideLayer = (coords: { x: number; y: number }, layer: StickerLayer): boolean => {
    if (!layer.visible || layer.type === 'drawing') return false;

    const dx = coords.x - layer.x;
    const dy = coords.y - layer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (layer.type === 'image') {
      const imgLayer = layer as ImageLayer;
      const cached = imageCache.get(imgLayer.src);
      if (cached) {
        const baseScale = layer.scale;
        const sX = layer.scaleX !== undefined ? layer.scaleX * baseScale : baseScale;
        const sY = layer.scaleY !== undefined ? layer.scaleY * baseScale : baseScale;
        const w = cached.width * sX * 0.4;
        const h = cached.height * sY * 0.4;
        const maxRadius = Math.max(w / 2, h / 2) + 20; // Generous circular hit test matching image diagonal bounds
        return distance <= maxRadius;
      }
      return distance <= (90 * layer.scale);
    }

    if (layer.type === 'text') {
      return distance <= (85 * layer.scale);
    }

    if (layer.type === 'shape') {
      return distance <= (70 * layer.scale);
    }

    return distance <= (60 * layer.scale);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (!isDrawingMode) {
      // Find which layer was clicked (reversed to hit-test top-most first)
      const clickedLayer = [...sticker.layers].reverse().find(layer => isPointInsideLayer(coords, layer));

      if (clickedLayer) {
        onSelectLayer(clickedLayer.id);
        setIsDraggingLayer(true);
        dragStartCoordsRef.current = coords;
        layerStartPosRef.current = { x: clickedLayer.x, y: clickedLayer.y };
      } else {
        onSelectLayer(null);
        setIsDraggingLayer(false);
      }
      return;
    }

    setIsCurrentlyDrawing(true);
    activeStrokePointsRef.current = [coords];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (isDrawingMode) {
      if (!isCurrentlyDrawing) return;
      activeStrokePointsRef.current.push(coords);
      drawActiveStrokeInstantly();
      return;
    }

    // Normal mode: dragging elements
    if (isDraggingLayer && selectedLayerId) {
      const dx = coords.x - dragStartCoordsRef.current.x;
      const dy = coords.y - dragStartCoordsRef.current.y;

      const targetX = Math.round(layerStartPosRef.current.x + dx);
      const targetY = Math.round(layerStartPosRef.current.y + dy);

      // Bound coordinate translation inside canvas +/- safe editing zones
      onUpdateLayer(selectedLayerId, {
        x: Math.max(-100, Math.min(612, targetX)),
        y: Math.max(-100, Math.min(612, targetY))
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingMode) {
      if (!isCurrentlyDrawing) return;
      setIsCurrentlyDrawing(false);

      if (activeStrokePointsRef.current.length > 1) {
        const newStroke: DrawingStroke = {
          points: [...activeStrokePointsRef.current],
          color: brushColor,
          size: brushSize,
          tool: isEraser ? 'eraser' : 'brush'
        };
        onAddDrawingStroke(newStroke);
      }
      activeStrokePointsRef.current = [];
    } else {
      setIsDraggingLayer(false);
    }
  };

  // Support mobile touch gestures natively with { passive: false } to prevent browser window scrolling and bouncing.
  // We use stable refs for all reactive variables inside the touch event listeners so they NEVER need to be torn down or re-bound during active gestures!
  const isDrawingModeRef = useRef(isDrawingMode);
  const isCurrentlyDrawingRef = useRef(isCurrentlyDrawing);
  const isDraggingLayerRef = useRef(isDraggingLayer);
  const selectedLayerIdRef = useRef(selectedLayerId);
  const stickerRef = useRef(sticker);
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const isEraserRef = useRef(isEraser);

  // Keep refs in sync with the latest states on every render
  useEffect(() => {
    isDrawingModeRef.current = isDrawingMode;
    isCurrentlyDrawingRef.current = isCurrentlyDrawing;
    isDraggingLayerRef.current = isDraggingLayer;
    selectedLayerIdRef.current = selectedLayerId;
    stickerRef.current = sticker;
    brushColorRef.current = brushColor;
    brushSizeRef.current = brushSize;
    isEraserRef.current = isEraser;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStartNative = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      if (!coords) return;

      if (isDrawingModeRef.current) {
        e.preventDefault();
        setIsCurrentlyDrawing(true);
        isCurrentlyDrawingRef.current = true;
        activeStrokePointsRef.current = [coords];
      } else {
        const clickedLayer = [...stickerRef.current.layers].reverse().find(layer => isPointInsideLayer(coords, layer));

        if (clickedLayer) {
          e.preventDefault();
          onSelectLayer(clickedLayer.id);
          selectedLayerIdRef.current = clickedLayer.id;
          setIsDraggingLayer(true);
          isDraggingLayerRef.current = true;
          dragStartCoordsRef.current = coords;
          layerStartPosRef.current = { x: clickedLayer.x, y: clickedLayer.y };
        }
      }
    };

    const onTouchMoveNative = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
      if (!coords) return;

      if (isDrawingModeRef.current) {
        if (!isCurrentlyDrawingRef.current) return;
        e.preventDefault();
        activeStrokePointsRef.current.push(coords);
        drawActiveStrokeInstantly();
      } else if (isDraggingLayerRef.current && selectedLayerIdRef.current) {
        e.preventDefault();
        const dx = coords.x - dragStartCoordsRef.current.x;
        const dy = coords.y - dragStartCoordsRef.current.y;

        const targetX = Math.round(layerStartPosRef.current.x + dx);
        const targetY = Math.round(layerStartPosRef.current.y + dy);

        onUpdateLayer(selectedLayerIdRef.current, {
          x: Math.max(-100, Math.min(612, targetX)),
          y: Math.max(-100, Math.min(612, targetY))
        });
      }
    };

    const onTouchEndNative = () => {
      if (isDrawingModeRef.current) {
        if (!isCurrentlyDrawingRef.current) return;
        setIsCurrentlyDrawing(false);
        isCurrentlyDrawingRef.current = false;

        if (activeStrokePointsRef.current.length > 1) {
          const newStroke: DrawingStroke = {
            points: [...activeStrokePointsRef.current],
            color: brushColorRef.current,
            size: brushSizeRef.current,
            tool: isEraserRef.current ? 'eraser' : 'brush'
          };
          onAddDrawingStroke(newStroke);
        }
        activeStrokePointsRef.current = [];
      } else {
        setIsDraggingLayer(false);
        isDraggingLayerRef.current = false;
      }
    };

    canvas.addEventListener('touchstart', onTouchStartNative, { passive: false });
    canvas.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    canvas.addEventListener('touchend', onTouchEndNative, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStartNative);
      canvas.removeEventListener('touchmove', onTouchMoveNative);
      canvas.removeEventListener('touchend', onTouchEndNative);
    };
  }, [
    onSelectLayer,
    onUpdateLayer,
    onAddDrawingStroke
  ]);

  // Find drawing layer to check if we can undo
  const currentDrawingLayer = sticker.layers.find(l => l.type === 'drawing') as DrawingLayer | undefined;
  const canUndo = currentDrawingLayer && currentDrawingLayer.strokes.length > 0;

  const quickColors = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', 
    '#22c55e', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas workspace container card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center">
        
        {/* Workspace Toolbar / Header */}
        <div className="w-full flex items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-150 bg-slate-100 px-3 py-1.5 rounded-full font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Area di Lavoro (512x512)
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors"
              title="Zoom Indietro"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-500 w-12 text-center select-none">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
              className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors"
              title="Zoom Avanti"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              onClick={() => setZoom(1)}
              className="ml-1 text-[10px] text-blue-500 hover:underline font-bold"
              title="Reimposta zoom al 100%"
            >
              100%
            </button>
          </div>
        </div>

        {/* Sticker Canvas Stage */}
        <div className="relative border-4 border-slate-200/80 rounded-2xl overflow-hidden p-1 shadow-inner bg-slate-100 mb-4 select-none">
          
          {/* Transparent block grid behind */}
          <div 
            className={`w-[260px] h-[260px] xs:w-[320px] xs:h-[320px] sm:w-[360px] sm:h-[360px] md:w-[380px] md:h-[380px] transition-all flex items-center justify-center relative overflow-hidden ${
              backgroundType === 'transparent' ? 'checkerboard-pattern' : backgroundType === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
            }`}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="w-full h-full cursor-crosshair relative z-20 touch-none"
            />

            {sticker.layers.length === 0 && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 text-slate-400 select-none z-10 pointer-events-none">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600 mb-0.5">La tua tela è vuota!</p>
                <p className="text-[10px] text-slate-400 max-w-[200px]">Crea dei livelli cliccando sui pulsanti a destra oppure seleziona un'idea template qui sotto</p>
              </div>
            )}
          </div>
        </div>

        {/* Canvas background backgroundType toggle */}
        <div className="w-full flex items-center justify-between text-xs px-1 text-slate-550 mb-3 text-slate-500">
          <span className="font-semibold text-slate-500">Sfondo Area d'Edizione:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setBackgroundType('transparent')}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer text-[10px] ${
                backgroundType === 'transparent' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-105 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Scacchiera
            </button>
            <button
              onClick={() => setBackgroundType('light')}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer text-[10px] ${
                backgroundType === 'light' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-105 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Chiaro
            </button>
            <button
              onClick={() => setBackgroundType('dark')}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer text-[10px] ${
                backgroundType === 'dark' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-105 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Scuro
            </button>
          </div>
        </div>

        {/* Interactive Selection Hint */}
        <p className="text-[10px] text-slate-400 text-center select-none">
          💡 Trucco: Fai clic direttamente sugli elementi della tela per selezionare rapidamente il loro livello!
        </p>
      </div>

      {/* 5. DRAWING MODE TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4.5 h-4.5 text-blue-500" />
            <h4 className="font-bold text-sm text-slate-800">Strumenti di Disegno Libero</h4>
          </div>
          
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              isDrawingMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            id="btn-toggle-drawing-mode"
          >
            {isDrawingMode ? 'Attivo: Disegna sulla tela' : 'Attiva Disegno'}
          </button>
        </div>

        {isDrawingMode ? (
          <div className="flex flex-col gap-4 animate-fade-in text-xs text-slate-700">
            <span className="text-[11px] leading-relaxed text-indigo-800 bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
              ✍️ <b>Modalità disegno abilitata:</b> Trascina o muovi il cursore direttamente sulla tela sopra per disegnare frecce, scarabocchi o dediche personalizzate!
            </span>

            {/* Selector brush or eraser */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsEraser(false)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl font-semibold cursor-pointer ${
                  !isEraser 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                Matita / Pennello
              </button>
              <button
                onClick={() => setIsEraser(true)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl font-semibold cursor-pointer ${
                  isEraser 
                    ? 'bg-pink-50 border-pink-300 text-pink-750 font-bold text-pink-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Eraser className="w-4 h-4" />
                Gomma (Cancella tratto)
              </button>
            </div>

            {/* Brush Size Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Dimensione Tratto</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Brush color palette */}
            {!isEraser && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-600">Scegli Colore</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer shrink-0 shadow-sm"
                  />
                  <div className="flex-1 flex flex-wrap gap-1 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
                    {quickColors.map(c => (
                      <button
                        key={c}
                        onClick={() => setBrushColor(c)}
                        className={`w-5 h-5 rounded-full border border-slate-300 transition-transform ${
                          brushColor === c ? 'scale-125 border-slate-900 shadow-md ring-2 ring-blue-500/30' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Undo, Clear drawing buttons */}
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 justify-end">
              <button
                onClick={onUndoDrawingStroke}
                disabled={!canUndo}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                title="Rimuovi l'ultimo segno tracciato"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Annulla tratto
              </button>
              <button
                onClick={onClearDrawingStrokes}
                disabled={!currentDrawingLayer || currentDrawingLayer.strokes.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs disabled:opacity-50 disabled:hover:bg-rose-50 cursor-pointer"
                title="Cancella tutti i disegni attivi"
              >
                <Trash className="w-3.5 h-3.5" />
                Svuota tutti i tratti
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-450 text-slate-500 leading-relaxed text-center py-2">
            Disegna forme, frecce ed elementi a mano libera direttamente sopra la tua sticker. Clicca su <b>"Attiva Disegno"</b> per cominciare.
          </p>
        )}
      </div>
    </div>
  );
}
