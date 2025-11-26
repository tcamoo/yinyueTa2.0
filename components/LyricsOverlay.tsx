
import React, { useEffect, useRef, useMemo } from 'react';
import { Song } from '../types';
import { ChevronDown, Disc } from 'lucide-react';

interface LyricsOverlayProps {
  song: Song;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
  isPlaying: boolean;
}

interface LrcLine {
  time: number;
  text: string;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({ song, currentTime, isOpen, onClose, isPlaying }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Parse Lyrics
  const lyrics = useMemo(() => {
    if (!song.lyrics) return [];
    
    const lines = song.lyrics.split('\n');
    const lrcRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;
    const parsed: LrcLine[] = [];
    const plainText: LrcLine[] = [];

    lines.forEach((line, index) => {
      const match = line.match(lrcRegex);
      if (match) {
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const ms = parseInt(match[3]);
        // Normalize ms to milliseconds (usually it's 2 digits for 10ms, or 3 digits for 1ms)
        const totalTime = min * 60 + sec + (ms / (match[3].length === 2 ? 100 : 1000)); 
        parsed.push({ time: totalTime, text: match[4].trim() });
      } else {
        if (line.trim()) {
             // Fallback for plain text, just assign approximate time or ignore time
             plainText.push({ time: index * 5, text: line.trim() });
        }
      }
    });

    return parsed.length > 0 ? parsed : plainText;
  }, [song.lyrics]);

  // Find active line index
  const activeIndex = useMemo(() => {
      if (lyrics.length === 0) return -1;
      // Find the last line where time <= currentTime
      const index = lyrics.findIndex(l => l.time > currentTime);
      return index === -1 ? lyrics.length - 1 : Math.max(0, index - 1);
  }, [currentTime, lyrics]);

  // Auto Scroll
  useEffect(() => {
    if (scrollRef.current && activeIndex !== -1 && isOpen) {
        const activeEl = scrollRef.current.children[activeIndex] as HTMLElement;
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-dark-950 text-white animate-in slide-in-from-bottom duration-500">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             <div className="absolute inset-0 bg-black/60 z-10"></div>
             <img 
                src={song.coverUrl} 
                className="w-full h-full object-cover blur-[100px] opacity-60 scale-150 animate-pulse-slow" 
                alt="bg"
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 z-10"></div>
        </div>

        {/* Header */}
        <div className="relative z-20 flex justify-between items-center p-6 md:p-10">
             <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all group"
             >
                 <ChevronDown className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform" />
             </button>
             <div className="text-center">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Now Playing</h3>
                 <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-lime/20 text-brand-lime rounded-full text-[10px] font-bold border border-brand-lime/20">
                    {song.title}
                 </span>
             </div>
             <div className="w-12"></div> {/* Spacer */}
        </div>

        {/* Main Content */}
        <div className="relative z-20 flex-1 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 px-8 pb-20 overflow-hidden">
             
             {/* Left: Album Art (Vinyl Style with Rotation) */}
             <div className="hidden md:flex flex-col items-center justify-center max-w-lg w-full">
                 <div className={`relative w-[28vw] max-w-[400px] aspect-square rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[8px] border-black/80 overflow-hidden`}>
                     <div className={`w-full h-full ${isPlaying ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '8s' }}>
                        <img src={song.coverUrl} className="w-full h-full object-cover" alt="Album" />
                     </div>
                     
                     {/* Vinyl Center Hole / Spindle */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25%] h-[25%] bg-black rounded-full border-2 border-white/10 flex items-center justify-center shadow-inner z-10">
                         <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                     </div>
                     
                     {/* Static Gloss Reflection */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-full z-20"></div>
                     
                     {/* Vinyl Grooves Texture Overlay */}
                     <div className="absolute inset-0 rounded-full border-[1px] border-white/5 opacity-30 pointer-events-none scale-90"></div>
                     <div className="absolute inset-0 rounded-full border-[1px] border-white/5 opacity-30 pointer-events-none scale-75"></div>
                     <div className="absolute inset-0 rounded-full border-[1px] border-white/5 opacity-30 pointer-events-none scale-50"></div>
                 </div>
                 
                 <div className="mt-12 text-center">
                     <h1 className="text-4xl lg:text-5xl font-display font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight">
                         {song.title}
                     </h1>
                     <p className="text-xl text-gray-400 font-light">{song.artist}</p>
                 </div>
             </div>

             {/* Right: Lyrics */}
             <div className="flex-1 w-full max-w-2xl h-full relative mask-image-gradient">
                 <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-dark-950/0 to-transparent z-10 pointer-events-none"></div>
                 
                 {lyrics.length > 0 ? (
                     <div 
                        ref={scrollRef} 
                        className="h-full overflow-y-auto scrollbar-hide py-[50vh] px-4 text-center space-y-8 md:space-y-10"
                     >
                         {lyrics.map((line, i) => (
                             <p 
                                key={i}
                                className={`transition-all duration-700 ease-out cursor-pointer hover:text-white
                                    ${i === activeIndex 
                                        ? 'text-3xl md:text-5xl font-bold text-brand-lime scale-105 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]' 
                                        : 'text-lg md:text-2xl text-gray-500 font-medium blur-[0.5px] hover:blur-0'
                                    }
                                `}
                                onClick={() => {
                                    // Optional: Click to seek logic could go here
                                }}
                             >
                                 {line.text}
                             </p>
                         ))}
                     </div>
                 ) : (
                     <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                         <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-spin-slow">
                            <Disc className="w-10 h-10 opacity-50" />
                         </div>
                         <p className="text-xl font-light">暂无歌词</p>
                         <p className="text-sm opacity-50">纯音乐，请欣赏</p>
                     </div>
                 )}
                 
                 <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent z-10 pointer-events-none"></div>
             </div>
        </div>
        
        {/* CSS for gradient mask on lyrics container */}
        <style>{`
            .mask-image-gradient {
                mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
            }
        `}</style>
    </div>
  );
};
