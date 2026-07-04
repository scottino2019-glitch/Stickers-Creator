import React, { useState } from 'react';
import { 
  FolderHeart, Plus, Download, Trash2, 
  User, Sparkles, FolderOpen, ArrowUpRight 
} from 'lucide-react';
import { StickerPack, Sticker } from '../types';

interface PackListProps {
  packs: StickerPack[];
  onCreatePack: (name: string, author: string) => void;
  onDeletePack: (packId: string) => void;
  onAddCurrentStickerToPack: (packId: string) => void;
  onLoadStickerForEditing: (sticker: Sticker) => void;
  onDeleteStickerFromPack: (packId: string, stickerId: string) => void;
  onExportStickerPNG: (sticker: Sticker, name: string) => void;
  currentStickerLayersCount: number;
}

export default function PackList({
  packs,
  onCreatePack,
  onDeletePack,
  onAddCurrentStickerToPack,
  onLoadStickerForEditing,
  onDeleteStickerFromPack,
  onExportStickerPNG,
  currentStickerLayersCount
}: PackListProps) {
  const [newPackName, setNewPackName] = useState('');
  const [newPackAuthor, setNewPackAuthor] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(packs[0]?.id || null);
  const [confirmingDeletePack, setConfirmingDeletePack] = useState(false);
  const [confirmingDeleteStickerId, setConfirmingDeleteStickerId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackName.trim() || !newPackAuthor.trim()) return;
    
    onCreatePack(newPackName.trim(), newPackAuthor.trim());
    setNewPackName('');
    setNewPackAuthor('');
    setShowCreateForm(false);
  };

  // Pre-generate rendering checks for packs
  const activePack = packs.find(p => p.id === selectedPackId) || packs[0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FolderHeart className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">I Miei Pacchetti di Sticker</h3>
        </div>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-550 bg-[#128c7e] hover:bg-[#0f7267] text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          id="btn-show-create-pack"
        >
          <Plus className="w-4 h-4" />
          Nuovo Pack
        </button>
      </div>

      {/* 1. CREAZIONE PACK FORM */}
      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Crea Nuovo Sticker Pack</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-550 text-slate-600">Nome del Pacchetto</label>
              <input
                type="text"
                required
                value={newPackName}
                onChange={(e) => setNewPackName(e.target.value)}
                placeholder="Es. Reazioni Simpatiche"
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-550 text-slate-600">Autore / Creatore</label>
              <input
                type="text"
                required
                value={newPackAuthor}
                onChange={(e) => setNewPackAuthor(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end mt-1">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-250 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="text-xs px-4 py-1.5 bg-[#128c7e] text-white font-bold rounded-lg cursor-pointer hover:bg-[#0f7267]"
            >
              Crea Pacchetto
            </button>
          </div>
        </form>
      )}

      {/* 2. CHOOSE PACK SELECTOR */}
      {packs.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed rounded-xl flex flex-col items-center gap-2">
          <FolderOpen className="w-8 h-8 text-slate-350 text-slate-400" />
          <p className="text-xs text-slate-500 max-w-[280px]">
            Non hai ancora creato un pacchetto. Crea un pack in alto per raccogliere e organizzare i tuoi sticker personali!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100">
            {packs.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPackId(p.id)}
                className={`text-xs px-3 py-1.5 font-semibold rounded-full shrink-0 transition-all cursor-pointer ${
                  (activePack && activePack.id === p.id) || selectedPackId === p.id
                    ? 'bg-[#128c7e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* ACTIVE PACK DETAILS */}
          {activePack && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-700">{activePack.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                      {activePack.stickers.length} {activePack.stickers.length === 1 ? 'sticker' : 'sticker'}
                    </span>
                  </div>
                  <span className="text-slate-450 text-[10px] flex items-center gap-0.5 text-slate-500">
                    <User className="w-3 h-3" />
                    Autore: {activePack.author}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddCurrentStickerToPack(activePack.id)}
                    disabled={currentStickerLayersCount === 0}
                    className="flex items-center gap-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title="Aggiungi sticker corrente a questo pacchetto"
                  >
                    Salva Qui
                  </button>
                  {confirmingDeletePack ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                      <span className="text-[10px] text-rose-700 font-bold">Eliminare tutto?</span>
                      <button
                        onClick={() => {
                          onDeletePack(activePack.id);
                          setSelectedPackId(packs.find(p => p.id !== activePack.id)?.id || null);
                          setConfirmingDeletePack(false);
                        }}
                        className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px] cursor-pointer"
                        id="btn-confirm-delete-pack-yes"
                      >
                        Sì
                      </button>
                      <button
                        onClick={() => setConfirmingDeletePack(false)}
                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px] cursor-pointer"
                        id="btn-confirm-delete-pack-no"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeletePack(true)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Elimina questo pacchetto"
                      id="btn-confirm-delete-pack-trigger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* LIST STICKERS IN ACTIVE PACK */}
              {activePack.stickers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border rounded-xl flex flex-col items-center justify-center p-4">
                  <Sparkles className="w-6 h-6 text-indigo-400 mb-1" />
                  <p className="text-xs text-slate-700 font-bold mb-1">Nessuno Sticker in questo pack</p>
                  <p className="text-[11px] text-slate-400 max-w-[240px]">
                    Usa l'editor sopra per creare lo sticker e clicca su <b>"Salva Qui"</b> per inserirlo in questo pacchetto.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-1">
                  {activePack.stickers.map((sticker, idx) => {
                    return (
                      <div
                        key={sticker.id}
                        className="group relative bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-3 flex flex-col items-center transition-all hover:shadow-md cursor-pointer overflow-hidden"
                        onClick={() => onLoadStickerForEditing(sticker)}
                        title="Clicca per ricaricare e modificare nell'editor"
                      >
                        <span className="absolute top-1 left-2 text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        
                        {/* Interactive thumbnail */}
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 checkerboard-pattern p-1 shadow-inner relative">
                          <StickerThumbnailPreview sticker={sticker} />
                        </div>

                        {/* Title & Click edit banner */}
                        <span className="text-[10px] font-bold text-slate-800 text-center truncate w-full mt-2 leading-none">
                          {sticker.name}
                        </span>
                        
                        <div className="text-[9px] text-indigo-500 font-bold flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Modifica
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </div>

                        {/* Overlay actions on hover */}
                        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onExportStickerPNG(sticker, sticker.name)}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
                            title="Scarica PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {confirmingDeleteStickerId === sticker.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  onDeleteStickerFromPack(activePack.id, sticker.id);
                                  setConfirmingDeleteStickerId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold text-[9px] cursor-pointer"
                                title="Conferma"
                              >
                                Sì
                              </button>
                              <button
                                onClick={() => setConfirmingDeleteStickerId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[9px] cursor-pointer"
                                title="Annulla"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmingDeleteStickerId(sticker.id);
                              }}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Super lightweight canvas-free thumbnail generator.
 * Since we have the model data, we can render the layers inside structured SVG or inside lightweight canvases.
 * Wait, drawing a simple canvas thumbnail is incredibly easy!
 * Let's render a mini-canvas thumbnail dynamically.
 */
import { useEffect, useRef } from 'react';
import { drawStickerToCanvas } from '../utils/canvasRenderer';

function StickerThumbnailPreview({ sticker }: { sticker: Sticker }) {
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = thumbnailCanvasRef.current;
    if (!canvas) return;

    // Draw sticker at 200px (retina scale) on target canvas
    drawStickerToCanvas(canvas, sticker, null, () => {
      // redraw on loaded images
      drawStickerToCanvas(canvas, sticker, null, () => {}, true);
    }, true);
  }, [sticker]);

  return (
    <canvas
      ref={thumbnailCanvasRef}
      width={200}
      height={200}
      className="w-full h-full object-contain"
    />
  );
}
export { StickerThumbnailPreview };
