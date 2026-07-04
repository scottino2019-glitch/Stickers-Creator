import { useState } from 'react';
import { Moon, Sun, Smartphone, Check, Send } from 'lucide-react';
import { Sticker } from '../types';

interface WhatsAppChatPreviewProps {
  stickerImage: string; // The dataURL generated from the canvas
}

export default function WhatsAppChatPreview({ stickerImage }: WhatsAppChatPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Formatting date for beautiful mock timestamp
  const formatTime = () => {
    return '14:20';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[460px]">
      {/* Header bar simulating WhatsApp header */}
      <div className="bg-[#075e54] dark:bg-[#128c7e] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 border border-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-inner">
            WA
          </div>
          <div>
            <h4 className="font-semibold text-sm tracking-tight leading-none">Anteprima Chat</h4>
            <span className="text-[11px] text-emerald-200 font-medium">Online adesso</span>
          </div>
        </div>
        
        {/* Toggle dark / light chat mode */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 hover:bg-emerald-700/50 rounded-lg transition-colors cursor-pointer text-white flex items-center gap-1.5 text-xs font-semibold"
          title="Cambia tema chat"
          id="btn-toggle-chat-theme"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Giorno</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-200" />
              <span>Notte</span>
            </>
          )}
        </button>
      </div>

      {/* Main chat background container */}
      <div
        className={`flex-1 p-4 flex flex-col justify-end gap-3 transition-colors duration-300 relative overflow-y-auto ${
          isDarkMode
            ? 'bg-[#0b141a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-[#efeae2] bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px]'
        }`}
        style={{ minHeight: '300px' }}
      >
        {/* Date bubble */}
        <div className="mx-auto bg-slate-500/20 px-3 py-1 rounded-md text-[11px] font-medium text-slate-400 select-none">
          OGGI
        </div>

        {/* Incoming typical message */}
        <div className={`max-w-[75%] rounded-lg p-2.5 shadow-sm text-sm self-start flex flex-col relative ${
          isDarkMode ? 'bg-[#202c33] text-slate-100' : 'bg-white text-slate-900'
        }`}>
          <span className="text-[11px] text-emerald-500 font-bold mb-0.5 select-none leading-none">Amico</span>
          <p className="text-sm leading-relaxed pr-8">Inviami lo sticker per stasera! Lo hai fatto tu? 🤩</p>
          <span className="text-[9px] text-slate-400 absolute bottom-1 right-2">
            {formatTime()}
          </span>
        </div>

        {/* Outgoing Sticker container */}
        <div className="self-end flex flex-col items-end gap-1 group">
          {stickerImage ? (
            <div className="relative animate-fade-in p-1 max-w-[170px] xs:max-w-[200px] sm:max-w-[220px]">
              {/* WhatsApp stickers are presented on a completely transparent background directly on the chat canvas */}
              <img
                src={stickerImage}
                alt="Live Preview Sticker"
                className="w-44 h-44 object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)] transition-transform hover:scale-105 active:scale-95 duration-200 uppercase bg-transparent"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-1 mt-0.5 justify-end">
                <span className="text-[9px] text-slate-400 font-medium select-none">
                  {formatTime()}
                </span>
                <span className="text-sky-400 flex">
                  <Check className="w-3.5 h-3.5 -mr-1" />
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-xl border border-dashed text-center text-xs ${
              isDarkMode ? 'border-semibold border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
            }`}>
              Crea o seleziona degli elementi per visualizzare l'anteprima dello sticker
            </div>
          )}
        </div>
      </div>

      {/* Mock Text input bar */}
      <div className={`px-3 py-2 flex items-center gap-2 border-t shrink-0 ${
        isDarkMode ? 'bg-[#202c33] border-[#2f3b43]' : 'bg-[#f0f2f5] border-slate-200'
      }`}>
        <div className={`flex-1 rounded-full px-4 py-2 text-xs flex items-center justify-between ${
          isDarkMode ? 'bg-[#2a3942] text-slate-200' : 'bg-white text-slate-600'
        }`}>
          <span>Scrivi un messaggio...</span>
        </div>
        <button className="w-9 h-9 rounded-full bg-[#128c7e] text-white flex items-center justify-center cursor-not-allowed">
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
