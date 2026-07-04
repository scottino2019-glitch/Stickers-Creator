import React, { useState } from 'react';
import { 
  Trash2, Copy, ArrowUp, ArrowDown, Eye, EyeOff, 
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, 
  Layers, Plus, Type, Palette, Move, Sparkles, Image
} from 'lucide-react';
import { StickerLayer, TextLayer, ShapeLayer, EmojiLayer, ImageLayer } from '../types';
import { FONTS, SHAPES, EMOJI_LIST, APP_PRES_PALETTES } from '../templatesData';

interface LayerControlsProps {
  layers: StickerLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<StickerLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLayer: (type: StickerLayer['type'], options?: any) => void;
  onAddImageLayer: (dataUrl: string, name: string) => void;
}

export default function LayerControls({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
  onAddLayer,
  onAddImageLayer,
}: LayerControlsProps) {
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg("Seleziona una foto valida (PNG, JPG o WebP)!");
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onAddImageLayer(dataUrl, file.name.substring(0, 15));
      }
    };
    reader.readAsDataURL(file);
  };

  // Common quick colors for the designer palette
  const QUICK_COLORS = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#facc15', 
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 1. LAYER ADDERS HEADERS */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-blue-500" />
          Aggiungi Elemento Custom
        </h3>
        {errorMsg && (
          <div className="mb-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[10px] font-semibold animate-fade-in">
            ⚠️ {errorMsg}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {/* Add Text */}
          <button
            onClick={() => onAddLayer('text')}
            className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-xl transition-all cursor-pointer shadow-sm group"
            id="btn-add-text-layer"
          >
            <Type className="w-5 h-5 text-slate-500 group-hover:text-blue-500 transition-colors mb-1" />
            <span className="text-xs font-medium">Testo/Scritta</span>
          </button>

          {/* Add Shape */}
          <button
            onClick={() => onAddLayer('shape')}
            className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 rounded-xl transition-all cursor-pointer shadow-sm group"
            id="btn-add-shape-layer"
          >
            <Palette className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors mb-1" />
            <span className="text-xs font-medium">Forma Base</span>
          </button>

          {/* Add Emoji */}
          <button
            onClick={() => onAddLayer('emoji')}
            className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-pink-400 hover:text-pink-600 rounded-xl transition-all cursor-pointer shadow-sm group"
            id="btn-add-emoji-layer"
          >
            <Sparkles className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors mb-1" />
            <span className="text-xs font-medium">Emoji</span>
          </button>

          {/* Add Image */}
          <div className="relative">
            <input
              type="file"
              id="layer-control-image-uploader"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <label
              htmlFor="layer-control-image-uploader"
              className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-xl transition-all cursor-pointer shadow-sm group text-center h-full select-none"
              id="btn-add-image-layer-control"
            >
              <Image className="w-5 h-5 text-slate-500 group-hover:text-indigo-500 transition-colors mb-1" />
              <span className="text-xs font-medium">Carica Foto</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE SELECTED LAYER SETTINGS */}
      {selectedLayer ? (
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                Proprietà Livello
              </span>
              <h4 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-1">
                {selectedLayer.name}
              </h4>
            </div>
            
            {/* Quick delete layer */}
            <button
              onClick={() => onDeleteLayer(selectedLayer.id)}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="Elimina Livello"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Layer-Specific Controls */}
          {selectedLayer.type === 'text' && (
            <div className="flex flex-col gap-3">
              {/* Text Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Testo</label>
                <textarea
                  value={(selectedLayer as TextLayer).text}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { text: e.target.value })}
                  placeholder="Scrivi qui..."
                  rows={2}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50 font-medium"
                />
              </div>

              {/* Font Family */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Carattere</label>
                  <select
                    value={(selectedLayer as TextLayer).fontFamily}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    {FONTS.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Dimensione</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={(selectedLayer as TextLayer).fontSize}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { fontSize: parseInt(e.target.value) || 20 })}
                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
                  />
                </div>
              </div>

              {/* Text Styling & Alignment */}
              <div className="flex items-center gap-2 justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { bold: !(selectedLayer as TextLayer).bold })}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      (selectedLayer as TextLayer).bold ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { italic: !(selectedLayer as TextLayer).italic })}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      (selectedLayer as TextLayer).italic ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'left' })}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      (selectedLayer as TextLayer).textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'center' })}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      (selectedLayer as TextLayer).textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateLayer(selectedLayer.id, { textAlign: 'right' })}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      (selectedLayer as TextLayer).textAlign === 'right' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Fill and stroke outlines */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Colore Testo</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selectedLayer as TextLayer).color}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                      className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={(selectedLayer as TextLayer).color}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                      className="w-full text-[11px] px-1.5 py-1.5 border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Bordo Contorno</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selectedLayer as TextLayer).strokeColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                      className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={(selectedLayer as TextLayer).strokeColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                      className="w-full text-[11px] px-1.5 py-1.5 border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Stroke thickness & quick shadow toggle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Spessore Contorno: {(selectedLayer as TextLayer).strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={(selectedLayer as TextLayer).strokeWidth}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id={`shadow-chk-${selectedLayer.id}`}
                  checked={(selectedLayer as TextLayer).hasShadow}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { hasShadow: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400"
                />
                <label htmlFor={`shadow-chk-${selectedLayer.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                  Aggiungi Ombra al Testo
                </label>
              </div>
            </div>
          )}

          {selectedLayer.type === 'shape' && (
            <div className="flex flex-col gap-3">
              {/* Shape Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Tipo di Forma</label>
                <div className="grid grid-cols-4 gap-1">
                  {SHAPES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateLayer(selectedLayer.id, { shapeType: s.id as ShapeLayer['shapeType'], name: s.name })}
                      className={`text-[10px] p-1.5 font-medium border rounded-lg transition-all cursor-pointer ${
                        (selectedLayer as ShapeLayer).shapeType === s.id
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Fill & Stroke Colors */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Colore di Sfondo</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selectedLayer as ShapeLayer).fillColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { fillColor: e.target.value })}
                      className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={(selectedLayer as ShapeLayer).fillColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { fillColor: e.target.value })}
                      className="w-full text-[11px] px-1.5 py-1.5 border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500">Colore Bordo</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(selectedLayer as ShapeLayer).strokeColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                      className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={(selectedLayer as ShapeLayer).strokeColor}
                      onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                      className="w-full text-[11px] px-1.5 py-1.5 border border-slate-200 rounded-md font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Spessore Bordo: {(selectedLayer as ShapeLayer).strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={(selectedLayer as ShapeLayer).strokeWidth}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { strokeWidth: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Extra non-uniform resizing helper */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Compressione Larghezza</label>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.05"
                    value={selectedLayer.scaleX !== undefined ? selectedLayer.scaleX : 1}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { scaleX: parseFloat(e.target.value) })}
                    className="w-full accent-slate-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Compressione Altezza</label>
                  <input
                    type="range"
                    min="0.2"
                    max="3"
                    step="0.05"
                    value={selectedLayer.scaleY !== undefined ? selectedLayer.scaleY : 1}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { scaleY: parseFloat(e.target.value) })}
                    className="w-full accent-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedLayer.type === 'emoji' && (
            <div className="flex flex-col gap-3">
              {/* Emoji quick selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Cambia Emoji</label>
                <div className="flex gap-2 items-center">
                  <span className="text-3xl bg-slate-50 p-2 rounded-xl border border-slate-100 w-14 h-14 flex items-center justify-center">
                    {(selectedLayer as EmojiLayer).emoji}
                  </span>
                  
                  {/* Grid or simple standard picker */}
                  <div className="flex-1 max-h-[80px] overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-7 gap-1 scrollbar-thin">
                    {EMOJI_LIST.slice(0, 35).map(em => (
                      <button
                        key={em}
                        onClick={() => onUpdateLayer(selectedLayer.id, { emoji: em })}
                        className="text-base hover:scale-125 hover:bg-white rounded p-0.5 cursor-pointer text-center"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Dimensione Base</label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={(selectedLayer as EmojiLayer).size}
                  onChange={(e) => onUpdateLayer(selectedLayer.id, { size: parseInt(e.target.value) })}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
          )}

          {selectedLayer.type === 'image' && (
            <div className="flex flex-col gap-3 text-slate-600">
              <span className="text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 p-2.5 rounded-xl block leading-snug">
                Puoi trascinare l'immagine, ruotarla o scalerla usando i comandi universali qui sotto.
              </span>
            </div>
          )}

          {/* 3. UNIVERSAL LAYER TRANSFORMS */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Regolazioni Universali
            </span>

            {/* Position X */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Posizione Orizzontale (X)</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{selectedLayer.x}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="512"
                value={selectedLayer.x}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { x: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Position Y */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Posizione Verticale (Y)</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{selectedLayer.y}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="512"
                value={selectedLayer.y}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { y: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Scale */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Dimensione / Scala</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{(selectedLayer.scale * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4"
                step="0.05"
                value={selectedLayer.scale}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { scale: parseFloat(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Rotation */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Rotazione</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{selectedLayer.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedLayer.rotation}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { rotation: parseInt(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Opacity */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                <span>Trasparenza (Opacità)</span>
                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{(selectedLayer.opacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedLayer.opacity}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* Quick layer manipulation tools */}
          <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onDuplicateLayer(selectedLayer.id)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Duplica
            </button>
            <button
              onClick={() => onSelectLayer(null)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Deseleziona
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl text-center text-slate-500 py-10 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <Move className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-slate-700 mb-1">Nessun elemento selezionato</h5>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
              Fai clic su un elemento presente nella lista dei livelli o aggiungine uno nuovo per gestirne i dettagli.
            </p>
          </div>
        </div>
      )}

      {/* 4. REAL LAYER STACK PANEL */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
        <h4 className="font-bold text-sm text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          Lista dei Livelli ({layers.length})
        </h4>

        {layers.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic text-center py-2">
            Nessun livello attivo. Comincia inserendo un testo o un'emoji!
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
            {/* Draw in reverse order so top layers appear top in list! */}
            {[...layers].reverse().map((layer) => (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`flex items-center justify-between p-2 pl-3 border rounded-xl cursor-pointer transition-all ${
                  selectedLayerId === layer.id
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-500 shrink-0">
                    {layer.type === 'text' && 'txt'}
                    {layer.type === 'shape' && 'shp'}
                    {layer.type === 'emoji' && 'emo'}
                    {layer.type === 'image' && 'img'}
                    {layer.type === 'drawing' && 'dis'}
                  </span>
                  <span className="text-xs font-semibold truncate leading-none">
                    {layer.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Visibile eye toggle */}
                  <button
                    onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title={layer.visible ? "Nascondi livello" : "Mostra livello"}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={() => onMoveLayer(layer.id, 'up')}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Sposta Su"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={() => onMoveLayer(layer.id, 'down')}
                    className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Sposta Giù"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteLayer(layer.id)}
                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
