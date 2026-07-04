import React, { useState } from 'react';
import { 
  Sparkles, Heart, Smile, Coffee, Gift, Laugh, Briefcase,
  HelpCircle, Check, Plus, ImagePlus, ArrowUpRight
} from 'lucide-react';
import { StickerTemplate, StickerLayer } from '../types';
import { CATEGORIES, STICKER_TEMPLATES } from '../templatesData';
import { StickerThumbnailPreview } from './PackList';

interface TemplatesSelectorProps {
  onLoadTemplate: (template: StickerTemplate, append: boolean) => void;
  onAddImageLayer: (dataUrl: string, name: string) => void;
}

export default function TemplatesSelector({
  onLoadTemplate,
  onAddImageLayer
}: TemplatesSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // File loading helper for custom user photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage("Seleziona un'immagine valida (PNG, JPG, WebP)!");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onAddImageLayer(dataUrl, file.name.substring(0, 15));
        
        setStatusMessage("Immagine inserita nel livello superiore con successo!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredTemplates = selectedCategory === 'all'
    ? STICKER_TEMPLATES
    : STICKER_TEMPLATES.filter(t => t.category === selectedCategory);

  // Map category icons dynamically
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart': return <Heart className="w-3.5 h-3.5" />;
      case 'Smile': return <Smile className="w-3.5 h-3.5" />;
      case 'Coffee': return <Coffee className="w-3.5 h-3.5" />;
      case 'Gift': return <Gift className="w-3.5 h-3.5" />;
      case 'Laugh': return <Laugh className="w-3.5 h-3.5" />;
      case 'Briefcase': return <Briefcase className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-850 text-sm tracking-tight text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Galleria Idee e Basi di Partenza
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Seleziona un template per caricarlo o unire i livelli. Modifica, cancella o aggiungi testi e disegni a piacimento!
          </p>
        </div>

        {/* Custom Picture Uploader */}
        <div className="relative shrink-0">
          <input
            type="file"
            id="picture-upload-input"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <label
            htmlFor="picture-upload-input"
            className="flex items-center gap-1.5 px-3 py-1.8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl cursor-pointer transition-all shadow-sm"
          >
            <ImagePlus className="w-4 h-4" />
            Carica Foto/Sfondo
          </label>
        </div>
      </div>

      {statusMessage && (
        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-2 rounded-xl block leading-snug animate-fade-in font-medium">
          ✅ {statusMessage}
        </span>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shadow-sm/10">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 font-semibold rounded-full shrink-0 transition-all cursor-pointer ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {getCategoryIcon(category.icon)}
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* List of Templates cards */}
      <div className="flex flex-col gap-3">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="border border-slate-200/70 hover:border-indigo-200 hover:shadow-md rounded-2xl bg-slate-50 p-3.5 flex items-center gap-4 transition-all"
          >
            {/* Visual Thumbnail */}
            <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-0.5 checkerboard-pattern relative">
              <div className="scale-65 w-[140%] h-[140%] absolute select-none pointer-events-none">
                <StickerThumbnailPreview sticker={{ ...template, globalBorderColor: '#ffffff', globalBorderWidth: 10, globalShadow: true }} />
              </div>
            </div>

            {/* Template Info & Action button handles */}
            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {template.category}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 leading-snug truncate">
                {template.name}
              </h4>
              
              {/* Dual Action Option (Append or Overwrite) */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => {
                    onLoadTemplate(template, false);
                    setStatusMessage(`Template "${template.name}" caricato correttamente!`);
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-355 rounded-lg cursor-pointer transition-all text-center"
                  title="Elimina le modifiche correnti e carica solo questo template"
                >
                  Sostituisci
                </button>
                <button
                  onClick={() => {
                    onLoadTemplate(template, true);
                    setStatusMessage(`Elementi di "${template.name}" inseriti nello sticker corrente!`);
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="flex-1 text-[10px] font-bold px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-all text-center shadow-xs"
                  title="Aggiungi come nuovi livelli senza perdere lo sticker corrente"
                >
                  Unisci elementi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
