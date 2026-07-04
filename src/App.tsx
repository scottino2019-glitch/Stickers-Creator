import { useState, useEffect } from 'react';
import { 
  Sparkles, Layers, Sliders, Play, Trash2, 
  Download, ArrowLeftRight, HelpCircle, AlertCircle,
  Smartphone, Plus, FolderHeart, LayoutGrid, RotateCcw, Image
} from 'lucide-react';
import { 
  Sticker, StickerLayer, StickerPack, TextLayer, 
  EmojiLayer, ShapeLayer, ImageLayer, DrawingLayer, DrawingStroke, StickerTemplate 
} from './types';
import { STICKER_TEMPLATES, EMOJI_LIST, FONTS } from './templatesData';
import { drawStickerToCanvas } from './utils/canvasRenderer';

import StickerCanvasWorkspace from './components/StickerCanvasWorkspace';
import LayerControls from './components/LayerControls';
import WhatsAppChatPreview from './components/WhatsAppChatPreview';
import PackList from './components/PackList';
import TemplatesSelector from './components/TemplatesSelector';

export default function App() {
  // 1. STORAGE LOAD FOR STICKER PACKS
  const [packs, setPacks] = useState<StickerPack[]>(() => {
    const saved = localStorage.getItem('sticker_maker_packs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed reading packs from storage:', e);
      }
    }
    // Set a default empty pack for instant utilization
    return [
      {
        id: 'pack-default',
        name: 'I miei Sticker 😍',
        author: 'WhatsApp Creator',
        stickers: []
      }
    ];
  });

  // Synchronize packs back into localStorage
  useEffect(() => {
    localStorage.setItem('sticker_maker_packs', JSON.stringify(packs));
  }, [packs]);

  // 2. ACTIVE STICKER STATE IN WORKSPACE
  const [currentSticker, setCurrentSticker] = useState<Sticker>(() => {
    return {
      id: 'active-sticker',
      name: 'Mio Sticker',
      layers: [
        {
          id: 'init-layer-heart',
          name: 'Cuore Sfondo',
          type: 'shape',
          shapeType: 'heart',
          x: 256,
          y: 200,
          scale: 1.5,
          rotation: 0,
          opacity: 1,
          visible: true,
          fillColor: '#ec4899',
          strokeColor: '#db2777',
          strokeWidth: 4
        },
        {
          id: 'init-layer-text',
          name: 'Testo di Benvenuto',
          type: 'text',
          text: 'Fai clic sui\nlivelli! 🚀',
          x: 256,
          y: 350,
          scale: 1,
          rotation: -5,
          opacity: 1,
          visible: true,
          fontSize: 34,
          color: '#ffffff',
          fontFamily: 'Fredoka',
          strokeColor: '#4f46e5',
          strokeWidth: 6,
          bold: true,
          italic: false,
          textAlign: 'center',
          hasShadow: true,
          shadowColor: 'rgba(0,0,0,0.2)'
        },
        {
          id: 'init-layer-star',
          name: 'Stella Accento',
          type: 'emoji',
          emoji: '✨',
          x: 180,
          y: 130,
          scale: 1.2,
          rotation: 12,
          opacity: 1,
          visible: true,
          size: 40
        }
      ],
      globalBorder: true,
      globalBorderColor: '#ffffff',
      globalBorderWidth: 12,
      globalShadow: true
    };
  });

  // Selected layer ID state
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>('init-layer-text');

  // Drawing-specific toolbox state
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // Buffer state holding active canvas picture data url for real-time live WhatsApp preview
  const [stickerPreviewUrl, setStickerPreviewUrl] = useState('');

  // Sidebar tab control to avoid scrolling 'su e giù'
  const [sidebarTab, setSidebarTab] = useState<'editor' | 'templates' | 'packs'>('editor');

  // Dialog/Modal manager state
  const [activeModal, setActiveModal] = useState<{
    type: 'clear' | 'save' | 'alert' | null;
    title?: string;
    message?: string;
    inputValue?: string;
    packId?: string;
  }>({ type: null });

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-expire toasts after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 3. LAYER ENGINE ACTIONS
  const handleAddLayer = (type: StickerLayer['type'], options?: any) => {
    let newLayer: StickerLayer;
    const randomId = `layer-${type}-${Date.now()}`;

    switch (type) {
      case 'text':
        newLayer = {
          id: randomId,
          name: `Nuovo Testo #${currentSticker.layers.length + 1}`,
          type: 'text',
          x: 256,
          y: 256,
          scale: 1.0,
          rotation: 0,
          opacity: 1,
          visible: true,
          text: 'Modificami',
          fontSize: 32,
          color: '#ffffff',
          fontFamily: 'Fredoka',
          strokeColor: '#000000',
          strokeWidth: 5,
          bold: true,
          italic: false,
          textAlign: 'center',
          hasShadow: false,
          shadowColor: 'rgba(0,0,0,0.4)'
        } as TextLayer;
        break;

      case 'shape':
        newLayer = {
          id: randomId,
          name: `Forma Base #${currentSticker.layers.length + 1}`,
          type: 'shape',
          x: 256,
          y: 256,
          scale: 1.2,
          rotation: 0,
          opacity: 1,
          visible: true,
          shapeType: 'circle',
          fillColor: '#3b82f6',
          strokeColor: '#1d4ed8',
          strokeWidth: 4
        } as ShapeLayer;
        break;

      case 'emoji':
        // Pick a default friendly emoji
        const randomEmoji = EMOJI_LIST[Math.floor(Math.random() * 20)] || '😎';
        newLayer = {
          id: randomId,
          name: `Emoji ${randomEmoji}`,
          type: 'emoji',
          x: 256,
          y: 210,
          scale: 1.3,
          rotation: 0,
          opacity: 1,
          visible: true,
          emoji: randomEmoji,
          size: 45
        } as EmojiLayer;
        break;

      default:
        return;
    }

    setCurrentSticker(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
    setSelectedLayerId(randomId);
    // Turn off drawing mode so they can directly modify the transforms of the new item
    setIsDrawingMode(false);
  };

  const handleUpdateLayer = (id: string, updates: Partial<StickerLayer>) => {
    setCurrentSticker(prev => {
      const updatedLayers = prev.layers.map(layer => {
        if (layer.id === id) {
          return { ...layer, ...updates } as StickerLayer;
        }
        return layer;
      });
      return { ...prev, layers: updatedLayers };
    });
  };

  const handleDeleteLayer = (id: string) => {
    setCurrentSticker(prev => ({
      ...prev,
      layers: prev.layers.filter(l => l.id !== id)
    }));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  const handleDuplicateLayer = (id: string) => {
    const orig = currentSticker.layers.find(l => l.id === id);
    if (!orig) return;

    const dupId = `layer-${orig.type}-${Date.now()}`;
    const dupLayer = {
      ...orig,
      id: dupId,
      name: `${orig.name} (Copia)`,
      // Shift duplicate coordinates slightly so it is easily selectable
      x: Math.min(480, orig.x + 24),
      y: Math.min(480, orig.y + 24)
    } as StickerLayer;

    setCurrentSticker(prev => ({
      ...prev,
      layers: [...prev.layers, dupLayer]
    }));
    setSelectedLayerId(dupId);
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setCurrentSticker(prev => {
      const idx = prev.layers.findIndex(l => l.id === id);
      if (idx === -1) return prev;

      const newLayers = [...prev.layers];
      if (direction === 'up' && idx < newLayers.length - 1) {
        // Swap up (with layer above, which is index + 1 in array)
        const temp = newLayers[idx];
        newLayers[idx] = newLayers[idx + 1]!;
        newLayers[idx + 1] = temp;
      } else if (direction === 'down' && idx > 0) {
        // Swap down (with layer below, which is index - 1 in array)
        const temp = newLayers[idx];
        newLayers[idx] = newLayers[idx - 1]!;
        newLayers[idx - 1] = temp;
      }
      return { ...prev, layers: newLayers };
    });
  };

  // 4. FREEHAND DRAWING STROKES ACTIONS
  const handleAddDrawingStroke = (stroke: DrawingStroke) => {
    // Check if drawing layer is already present
    const layers = [...currentSticker.layers];
    const dIdx = layers.findIndex(l => l.type === 'drawing');

    if (dIdx === -1) {
      const newDLayer: DrawingLayer = {
        id: `layer-drawing-${Date.now()}`,
        name: 'Disegno Libero 🎨',
        type: 'drawing',
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        strokes: [stroke]
      };
      setCurrentSticker(prev => ({
        ...prev,
        layers: [...prev.layers, newDLayer]
      }));
      setSelectedLayerId(newDLayer.id);
    } else {
      const existing = { ...layers[dIdx] } as DrawingLayer;
      existing.strokes = [...existing.strokes, stroke];
      layers[dIdx] = existing;
      setCurrentSticker(prev => ({
        ...prev,
        layers
      }));
      setSelectedLayerId(existing.id);
    }
  };

  const handleClearDrawingStrokes = () => {
    setCurrentSticker(prev => {
      const updated = prev.layers.map(layer => {
        if (layer.type === 'drawing') {
          return { ...layer, strokes: [] } as DrawingLayer;
        }
        return layer;
      });
      return { ...prev, layers: updated };
    });
  };

  const handleUndoDrawingStroke = () => {
    setCurrentSticker(prev => {
      const updated = prev.layers.map(layer => {
        if (layer.type === 'drawing') {
          const lCopy = { ...layer } as DrawingLayer;
          if (lCopy.strokes.length > 0) {
            lCopy.strokes = lCopy.strokes.slice(0, -1);
          }
          return lCopy;
        }
        return layer;
      });
      return { ...prev, layers: updated };
    });
  };

  // 5. EXTERNAL CUSTOM PHOTO UPLOAD LAYER
  const handleAddImageLayer = (dataUrl: string, name: string) => {
    const randomId = `layer-image-${Date.now()}`;
    const newImage: ImageLayer = {
      id: randomId,
      name: `Foto (${name})`,
      type: 'image',
      x: 256,
      y: 256,
      scale: 1.2,
      rotation: 0,
      opacity: 1,
      visible: true,
      src: dataUrl
    };

    setCurrentSticker(prev => ({
      ...prev,
      layers: [...prev.layers, newImage]
    }));
    setSelectedLayerId(randomId);
    setIsDrawingMode(false);
  };

  // 6. STICKER LOADER & MERGER FROM TEMPLATERS
  const handleLoadTemplate = (template: StickerTemplate, append: boolean) => {
    const cleanLayers = template.layers.map(layer => {
      const offset = append ? 18 : 0;
      return {
        ...layer,
        id: `layer-template-${layer.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        x: Math.min(480, layer.x + offset),
        y: Math.min(480, layer.y + offset),
      } as StickerLayer;
    });

    if (append) {
      // Merge elements onto the top of current active stack
      setCurrentSticker(prev => ({
        ...prev,
        layers: [...prev.layers, ...cleanLayers]
      }));
    } else {
      // Overwrite completely
      setCurrentSticker(prev => ({
        ...prev,
        layers: cleanLayers,
        globalBorder: template.globalBorder
      }));
    }
    
    if (cleanLayers.length > 0) {
      setSelectedLayerId(cleanLayers[cleanLayers.length - 1]?.id || null);
    }
  };

  // 7. STICKER EXPORT NATIVE PNG
  const handleExportStickerToPNG = (stickerToExport: Sticker, filename: string) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    
    // Draw directly onto the temporary canvas without active selection boundaries
    drawStickerToCanvas(tempCanvas, stickerToExport, null, () => {}, true);

    try {
      const dataUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename.replace(/\s+/g, '_')}_sticker.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export sticker to PNG:", err);
      setToast({ 
        message: "Errore di sicurezza: non è possibile scaricare immagini esterne con restrizioni CORS. Prova a caricare un'altra foto salvata in locale!", 
        type: 'error' 
      });
    }
  };

  // 8. STICKER PACK ORGANIZER UPDATES
  const handleCreatePack = (name: string, author: string) => {
    const newPack: StickerPack = {
      id: `pack-${Date.now()}`,
      name,
      author,
      stickers: []
    };
    setPacks(prev => [...prev, newPack]);
  };

  const handleDeletePack = (packId: string) => {
    setPacks(prev => prev.filter(p => p.id !== packId));
  };

  const handleAddCurrentStickerToPack = (packId: string) => {
    setActiveModal({
      type: 'save',
      inputValue: currentSticker.name || 'Mio Sticker',
      packId
    });
  };

  const handleConfirmSaveToPack = (stickName: string, packId: string) => {
    const finalName = stickName.trim() || `Sticker #${Date.now()}`;
    const preparedSticker: Sticker = {
      ...currentSticker,
      id: `sticker-saved-${Date.now()}`,
      name: finalName,
      // Deep clone layers to decouple from active working states
      layers: JSON.parse(JSON.stringify(currentSticker.layers))
    };

    setPacks(prev => prev.map(p => {
      if (p.id === packId) {
        return {
          ...p,
          stickers: [...p.stickers, preparedSticker]
        };
      }
      return p;
    }));

    setActiveModal({ type: null });
    setToast({ message: `Sticker "${finalName}" aggiunto con successo al pacchetto!`, type: 'success' });
  };

  const handleLoadStickerForEditing = (sticker: Sticker) => {
    // Decouple completely by deep cloning back to standard editable object
    const restored = JSON.parse(JSON.stringify(sticker)) as Sticker;
    restored.id = 'active-sticker'; // reset working id
    setCurrentSticker(restored);
    
    if (restored.layers.length > 0) {
      setSelectedLayerId(restored.layers[restored.layers.length - 1]?.id || null);
    }
    
    setToast({ message: `Sticker "${sticker.name}" caricato correttamente!`, type: 'info' });
  };

  const handleDeleteStickerFromPack = (packId: string, stickerId: string) => {
    setPacks(prev => prev.map(p => {
      if (p.id === packId) {
        return {
          ...p,
          stickers: p.stickers.filter(s => s.id !== stickerId)
        };
      }
      return p;
    }));
    setToast({ message: "Sticker rimosso dal pacchetto.", type: 'success' });
  };

  const handleClearWorkspace = () => {
    setActiveModal({
      type: 'clear',
      title: 'Svuota Area di Lavoro',
      message: "Sei sicuro di voler svuotare interamente l'area di lavoro? Tutti i livelli correnti andranno persi (quelli salvati nei pacchetti rimarranno al sicuro)."
    });
  };

  const handleConfirmClearWorkspace = () => {
    setCurrentSticker({
      id: 'active-sticker',
      name: 'Mio Sticker',
      layers: [],
      globalBorder: true,
      globalBorderColor: '#ffffff',
      globalBorderWidth: 10,
      globalShadow: true
    });
    setSelectedLayerId(null);
    setIsDrawingMode(false);
    setSidebarTab('editor'); // Auto transition to Edits tab so they see all Add Layer buttons!
    setActiveModal({ type: null });
    setToast({ message: "Area di lavoro svuotata completamente!", type: 'success' });
  };

  const handleRestoreDefaultSticker = () => {
    setCurrentSticker({
      id: 'active-sticker',
      name: 'Mio Sticker',
      layers: [
        {
          id: 'init-layer-heart',
          name: 'Cuore Sfondo',
          type: 'shape',
          shapeType: 'heart',
          x: 256,
          y: 200,
          scale: 1.5,
          rotation: 0,
          opacity: 1,
          visible: true,
          fillColor: '#ec4899',
          strokeColor: '#db2777',
          strokeWidth: 4
        },
        {
          id: 'init-layer-text',
          name: 'Testo di Benvenuto',
          type: 'text',
          text: 'Fai clic sui\nlivelli! 🚀',
          x: 256,
          y: 350,
          scale: 1,
          rotation: -5,
          opacity: 1,
          visible: true,
          fontSize: 34,
          color: '#ffffff',
          fontFamily: 'Fredoka',
          strokeColor: '#4f46e5',
          strokeWidth: 6,
          bold: true,
          italic: false,
          textAlign: 'center',
          hasShadow: true,
          shadowColor: 'rgba(0,0,0,0.2)'
        },
        {
          id: 'init-layer-star',
          name: 'Stella Accento',
          type: 'emoji',
          emoji: '✨',
          x: 180,
          y: 130,
          scale: 1.2,
          rotation: 12,
          opacity: 1,
          visible: true,
          size: 40
        }
      ],
      globalBorder: true,
      globalBorderColor: '#ffffff',
      globalBorderWidth: 12,
      globalShadow: true
    });
    setSelectedLayerId('init-layer-text');
    setIsDrawingMode(false);
    setSidebarTab('editor'); // Auto transition to Edits tab
    setActiveModal({ type: null });
    setToast({ message: "Disegno di esempio ripristinato con successo!", type: 'success' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      
      {/* HEADER BAR */}
      <header className="bg-emerald-650 bg-[#075e54] text-white py-4.5 px-4 sm:px-8 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#128c7e] flex items-center justify-center font-black text-2xl shadow-md rotate-[-4deg] border-2 border-emerald-150 transform hover:rotate-[4deg] transition-all">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl tracking-tight leading-none">
                  Sticker Maker Pro
                </h1>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold select-none text-white uppercase tracking-wider">
                  Senza IA
                </span>
              </div>
              <p className="text-xs text-emerald-150 mt-1 font-medium text-emerald-100">
                Il laboratorio artigianale per creare, personalizzare ed esportare sticker reali per WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleClearWorkspace}
              className="px-3.5 py-1.8 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-all border border-white/25 cursor-pointer flex items-center gap-1.5"
              id="btn-clear-workspace"
              title="Azzera la tela d'esame"
            >
              <RotateCcw className="w-4 h-4" />
              Svuota Tela
            </button>
            <button
              onClick={() => handleExportStickerToPNG(currentSticker, currentSticker.name)}
              disabled={currentSticker.layers.length === 0}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              id="btn-main-export-png"
            >
              <Download className="w-4 h-4" />
              Scarica PNG
            </button>
          </div>
        </div>
      </header>

      {/* DETECTOR OF EMPTY STATE PROMPT */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* TOP LAYOUT STRUCTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: TABBED WORKSPACE CONTROLLER (4 COLS) */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            {/* Visual Tabs Selector */}
            <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 border border-slate-300/40 shadow-inner shrink-0">
              <button
                onClick={() => setSidebarTab('editor')}
                className={`flex-1 py-1.8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent ${
                  sidebarTab === 'editor'
                    ? 'bg-white text-[#128c7e] shadow-sm border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-805 hover:bg-white/40'
                }`}
                id="tab-btn-editor"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Modifiche</span>
              </button>

              <button
                onClick={() => setSidebarTab('templates')}
                className={`flex-1 py-1.8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent ${
                  sidebarTab === 'templates'
                    ? 'bg-white text-indigo-700 shadow-sm border-slate-200/50'
                    : 'text-slate-650 hover:text-slate-805 hover:bg-white/40'
                }`}
                id="tab-btn-templates"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Galleria Basi</span>
              </button>

              <button
                onClick={() => setSidebarTab('packs')}
                className={`flex-1 py-1.8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none border border-transparent ${
                  sidebarTab === 'packs'
                    ? 'bg-white text-pink-600 shadow-sm border-slate-200/50'
                    : 'text-slate-650 hover:text-slate-805 hover:bg-white/40'
                }`}
                id="tab-btn-packs"
              >
                <FolderHeart className="w-3.5 h-3.5" />
                <span>I Miei Pack</span>
              </button>
            </div>

            {/* TAB CONTENT PANEL */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {sidebarTab === 'editor' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col gap-3.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Sliders className="w-4 h-4 text-[#128c7e]" />
                      Impostazioni Globali Sticker
                    </h3>

                    {/* Toggle border outline */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Contorno Bianco Adesivo</span>
                        <input
                          type="checkbox"
                          checked={currentSticker.globalBorder}
                          onChange={(e) => setCurrentSticker(prev => ({ ...prev, globalBorder: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 cursor-pointer"
                          id="chk-use-global-border"
                        />
                      </div>

                      {currentSticker.globalBorder && (
                        <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl animate-fade-in">
                          <div className="flex justify-between items-center text-xs font-medium text-slate-650">
                            <span>Carica Spessore Bordo</span>
                            <span className="font-mono text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded font-bold">{currentSticker.globalBorderWidth}px</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="32"
                            value={currentSticker.globalBorderWidth}
                            onChange={(e) => setCurrentSticker(prev => ({ ...prev, globalBorderWidth: parseInt(e.target.value) }))}
                            className="w-full accent-indigo-600"
                          />

                          <div className="flex items-center gap-2 justify-between mt-1 pt-1.5 border-t border-slate-200/50">
                            <span className="text-[10px] text-slate-500 font-semibold">Colore Bordo:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={currentSticker.globalBorderColor}
                                onChange={(e) => setCurrentSticker(prev => ({ ...prev, globalBorderColor: e.target.value }))}
                                className="w-5 h-5 rounded overflow-hidden border border-slate-350 cursor-pointer shrink-0"
                                title="Scegli colore per il contorno"
                              />
                              <span className="text-[10px] text-slate-600 font-mono select-all font-bold">{currentSticker.globalBorderColor}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Soft shadow toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-slate-700">Effetto Ombra WhatsApp</span>
                          <span className="text-[10px] text-slate-400">Aggiunge profondità nella chat</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={currentSticker.globalShadow}
                          onChange={(e) => setCurrentSticker(prev => ({ ...prev, globalShadow: e.target.checked }))}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 cursor-pointer"
                          id="chk-use-global-shadow"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complete layer manager logic */}
                  <LayerControls
                    layers={currentSticker.layers}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={setSelectedLayerId}
                    onUpdateLayer={handleUpdateLayer}
                    onDeleteLayer={handleDeleteLayer}
                    onDuplicateLayer={handleDuplicateLayer}
                    onMoveLayer={handleMoveLayer}
                    onAddLayer={handleAddLayer}
                    onAddImageLayer={handleAddImageLayer}
                  />
                </div>
              )}

              {sidebarTab === 'templates' && (
                <div className="animate-fade-in max-h-[750px] overflow-y-auto pr-1">
                  <TemplatesSelector 
                    onLoadTemplate={(template, append) => {
                      handleLoadTemplate(template, append);
                      setSidebarTab('editor');
                    }}
                    onAddImageLayer={(dataUrl, name) => {
                      handleAddImageLayer(dataUrl, name);
                      setSidebarTab('editor');
                    }}
                  />
                </div>
              )}

              {sidebarTab === 'packs' && (
                <div className="animate-fade-in max-h-[750px] overflow-y-auto pr-1">
                  <PackList
                    packs={packs}
                    onCreatePack={handleCreatePack}
                    onDeletePack={handleDeletePack}
                    onAddCurrentStickerToPack={handleAddCurrentStickerToPack}
                    onLoadStickerForEditing={(sticker) => {
                      handleLoadStickerForEditing(sticker);
                      setSidebarTab('editor');
                    }}
                    onDeleteStickerFromPack={handleDeleteStickerFromPack}
                    onExportStickerPNG={handleExportStickerToPNG}
                    currentStickerLayersCount={currentSticker.layers.length}
                  />
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: WORKSPACE STAGE (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <StickerCanvasWorkspace
              sticker={currentSticker}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              onAddDrawingStroke={handleAddDrawingStroke}
              onClearDrawingStrokes={handleClearDrawingStrokes}
              onUndoDrawingStroke={handleUndoDrawingStroke}
              
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              isEraser={isEraser}
              setIsEraser={setIsEraser}

              onGeneratePreviewDataUrl={setStickerPreviewUrl}
            />

            {/* QUICK ACTIONS BAR */}
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Salvataggio & Organizzazione Rapida
              </span>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleAddCurrentStickerToPack(packs[0]?.id || 'pack-default')}
                  disabled={currentSticker.layers.length === 0}
                  className="flex-1 py-2.5 px-3.5 bg-[#128c7e] hover:bg-[#0f7267] text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-40 disabled:hover:bg-[#128c7e] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  id="btn-quick-save-pack"
                >
                  <Plus className="w-4 h-4" />
                  Salva nel Pack Attivo
                </button>
                
                <button
                  onClick={() => {
                    setSidebarTab('packs');
                  }}
                  className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  title="Gestisci tutti i pacchetti"
                >
                  <FolderHeart className="w-4 h-4 text-[#128c7e]" />
                  Apri i Miei Pack
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: WHATSAPP PREVIEW (3 COLS) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <WhatsAppChatPreview stickerImage={stickerPreviewUrl} />

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-4.5 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 block mb-1">
                Cos'è questo editor?
              </span>
              <p className="text-xs text-slate-650 leading-relaxed text-slate-700">
                Non è un giocattolo vincolato! Hai la massima libertà di aggiungere quanti livelli desideri, trascinarli, impostare rotazioni, contorni personalizzati e comporre testi in stile meme.
              </p>
              <span className="inline-block mt-2 font-mono text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                Rispetta i requisiti: 512x512 PNG Trasparente
              </span>
            </div>
          </div>

        </div>

      </main>

      {/* ACCESSIBILITY / SYSTEM OUTCOMES footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 shrink-0 text-center text-xs mt-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400/95 font-medium">
          <span>Sticker Maker Pro — Laboratorio Artigianale WhatsApp (2026)</span>
          <div className="flex items-center gap-4">
            <span>Nessuna raccolta dati</span>
            <span>Funzionamento locale (localStorage)</span>
            <span className="text-emerald-400 font-bold">100% Senza IA</span>
          </div>
        </div>
      </footer>

      {/* 9. REAL TIME CUSTOM TOAST SYSTEM */}
      {toast && (
        <div 
          className={`fixed bottom-5 right-5 z-[100] max-w-sm p-4 rounded-2xl shadow-xl transition-all flex items-center justify-between gap-3 border ${
            toast.type === 'success' 
              ? 'bg-emerald-55 bg-[#e8f5e9] border-[#a5d6a7] text-[#1b5e20]' 
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <p className="text-xs font-bold leading-normal text-slate-805 select-none text-slate-800">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold pl-2 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* 10. PREMIUM OVERLAY DIALOGS (REPLACES NATIVE BROWSER WINDOW BLOCKS) */}
      {activeModal.type && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden p-6 animate-zoom-in">
            
            {/* Modal Head */}
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                {activeModal.type === 'clear' ? 'Azzera o Ripristina la Tela?' : 'Salva nei pacchetti'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 pb-1">
                {activeModal.type === 'clear' 
                  ? 'Scegli se svuotare interamente l\'area di lavoro o se ripristinare il bellissimo sticker di benvenuto originale per ricominciare da capo.' 
                  : 'Scegli un nome identificativo per salvare questo sticker all\'interno del tuo pacchetto di sticker.'}
              </p>
            </div>

            {/* Modal Body / Input if save */}
            {activeModal.type === 'save' && (
              <div className="mb-5">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome dello Sticker</label>
                <input
                  type="text"
                  value={activeModal.inputValue || ''}
                  onChange={(e) => setActiveModal(prev => ({ ...prev, inputValue: e.target.value }))}
                  placeholder="Es. Gatto Sorpreso"
                  className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-semibold text-slate-800"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmSaveToPack(activeModal.inputValue || '', activeModal.packId || '');
                    }
                  }}
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveModal({ type: null })}
                className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer"
              >
                Annulla
              </button>
              
              {activeModal.type === 'clear' ? (
                <>
                  <button
                    onClick={handleRestoreDefaultSticker}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-sm"
                    id="btn-confirm-modal-restore-default"
                  >
                    Ripristina Esempio (Reset)
                  </button>
                  <button
                    onClick={handleConfirmClearWorkspace}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-sm"
                    id="btn-confirm-modal-clear-confirm"
                  >
                    Svuota Tutto
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConfirmSaveToPack(activeModal.inputValue || '', activeModal.packId || '')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-sm"
                  id="btn-confirm-modal-save-confirm"
                >
                  Salva Sticker
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
