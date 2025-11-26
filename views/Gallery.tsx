
import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { Camera, Maximize2, Aperture, X, Download, Share2, Heart, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface GalleryProps {
  items: GalleryItem[];
}

export const Gallery: React.FC<GalleryProps> = ({ items }) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Reset zoom when item changes
  useEffect(() => {
      setIsZoomed(false);
  }, [selectedItem]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  return (
    <div className="pb-40 min-h-screen">
      {/* Header Section with Parallax feel */}
      <header className="mb-16 flex flex-col items-center justify-center text-center py-12 relative overflow-hidden rounded-[3rem] border border-white/5 bg-white/[0.02]">
        <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-cyan/5 to-transparent"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute -left-20 top-10 w-64 h-64 bg-brand-cyan blur-[100px] opacity-20 animate-pulse-slow"></div>
        <div className="absolute -right-20 bottom-10 w-64 h-64 bg-brand-purple blur-[100px] opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

        <div className="relative z-10 animate-in slide-in-from-bottom-4 duration-700">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/30 backdrop-blur-md mb-6 shadow-lg">
              <Aperture className="w-4 h-4 text-brand-cyan animate-spin-slow" />
              <span className="text-xs font-bold tracking-[0.2em] text-gray-300">VISUAL ARCHIVE</span>
           </div>
           
           <h1 className="text-6xl md:text-8xl font-display font-black mb-6 tracking-tight text-white drop-shadow-2xl">
             光影 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-white to-brand-purple italic pr-4">猎手</span>
           </h1>
           
           <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
             捕捉稍纵即逝的频率。这里收藏了每一场演出、每一刻幕后、每一个与音乐共振的瞬间。
           </p>
        </div>
      </header>

      {/* Masonry Layout Grid */}
      <div className={`columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 mx-auto transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in border border-white/5 bg-dark-900 shadow-2xl transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            onClick={() => setSelectedItem(item)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Image */}
            <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Glossy Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"></div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-10">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <div className="flex justify-between items-end gap-4">
                   <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-xl leading-tight mb-1 truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider">
                        <Camera className="w-3 h-3" />
                        <span>{item.photographer}</span>
                      </div>
                   </div>
                   <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      <Maximize2 className="w-5 h-5" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 'Upload More' Placeholder for aesthetics */}
        <div className="break-inside-avoid p-8 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center text-gray-500 hover:text-brand-cyan hover:border-brand-cyan hover:bg-brand-cyan/5 transition-all cursor-pointer min-h-[200px] group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-brand-cyan group-hover:text-black">
                <Aperture className="w-8 h-8" />
            </div>
            <span className="font-bold">上传更多瞬间</span>
            <span className="text-xs mt-2 opacity-60">支持 RAW / JPG / PNG</span>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
           
           {/* Lightbox Controls */}
           <div className={`absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none transition-opacity duration-300 ${isZoomed ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
              <div className="pointer-events-auto bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>
                 <span className="text-xs font-bold text-gray-300">Viewing Mode</span>
              </div>

              <div className="flex gap-4 pointer-events-auto">
                 <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white hover:text-black backdrop-blur-md border border-white/10 flex items-center justify-center transition-all group" title="Download">
                    <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                 </button>
                 <button 
                    onClick={() => setSelectedItem(null)}
                    className="w-12 h-12 rounded-full bg-white text-black hover:bg-brand-cyan hover:scale-110 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>
           </div>

           {/* Image Container with Zoom Logic */}
           <div 
                className={`flex-1 w-full h-full overflow-hidden flex ${isZoomed ? 'cursor-zoom-out overflow-auto block' : 'items-center justify-center cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
           >
              <img 
                 src={selectedItem.imageUrl} 
                 alt={selectedItem.title} 
                 className={`
                    transition-all duration-300 select-none
                    ${isZoomed 
                        ? 'min-w-full min-h-full object-none w-auto h-auto' // Actual size, might overflow
                        : 'max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)]' // Fit screen
                    }
                 `}
                 onClick={(e) => e.stopPropagation()} 
              />
              
              {/* Tap anywhere else to toggle zoom too */}
              <div className="absolute inset-0 z-[-1]" onClick={() => setIsZoomed(!isZoomed)}></div>
           </div>

           {/* Zoom Hint Icon (Centered overlay when not zoomed) */}
           {!isZoomed && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                   <div className="bg-black/50 rounded-full p-4 backdrop-blur-md">
                        <ZoomIn className="w-8 h-8 text-white" />
                   </div>
               </div>
           )}

           {/* Bottom Details Panel (Hidden when zoomed for immersion) */}
           <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-20 pb-8 px-8 md:px-16 pointer-events-none transition-transform duration-500 ${isZoomed ? 'translate-y-full' : 'translate-y-0'}`}>
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6 pointer-events-auto">
                 
                 {/* Left Info */}
                 <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{selectedItem.title}</h2>
                    <div className="flex items-center gap-6 text-sm">
                       <div className="flex items-center gap-2 text-brand-cyan font-bold">
                          <Camera className="w-4 h-4" />
                          {selectedItem.photographer}
                       </div>
                       <span className="text-gray-500">|</span>
                       <span className="text-gray-400 font-mono">ISO 400 · f/2.8 · 1/200s</span>
                    </div>
                 </div>

                 {/* Right Actions */}
                 <div className="flex items-center gap-4">
                    <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 text-white font-bold flex items-center gap-2 transition-all">
                       <Heart className="w-4 h-4" /> 收藏
                    </button>
                    <button className="px-6 py-3 rounded-xl bg-brand-cyan text-black font-bold flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                       <Share2 className="w-4 h-4" /> 分享瞬间
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
