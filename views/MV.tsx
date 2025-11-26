
import React, { useState, useRef, useEffect } from 'react';
import { MV, PageHeaderConfig } from '../types';
import { Play, Pause, Volume2, VolumeX, Maximize, Clock, Share2, Heart, SkipForward, Minimize } from 'lucide-react';

interface MVViewProps {
  mvs: MV[];
  headerConfig: PageHeaderConfig;
}

export const MVView: React.FC<MVViewProps> = ({ mvs, headerConfig }) => {
  const [activeMv, setActiveMv] = useState<MV>(mvs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [interactionFlash, setInteractionFlash] = useState<'play' | 'pause' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Progress State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Cinematic', 'Animation', 'Sci-Fi', 'Live', 'VFX', 'Surreal', 'Promo'];
  const [activeCategory, setActiveCategory] = useState('All');

  // Check for featured MV passed from library (though activeMv state manages current view)
  // If we wanted to default to a featured one on load, we'd do it in init state or useEffect.
  
  const filteredMvs = activeCategory === 'All' 
    ? mvs 
    : mvs.filter(mv => mv.category === activeCategory || mv.tags.includes(activeCategory));

  // Auto-play when activeMv changes
  useEffect(() => {
    setIsPlaying(true);
    if (videoRef.current) {
        videoRef.current.currentTime = 0;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                setIsPlaying(false);
            });
        }
    }
  }, [activeMv]);

  // Handle Fullscreen Change Events
  useEffect(() => {
      const handleFullscreenChange = () => {
          setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying) {
            setShowControls(false);
        }
    }, 2500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setInteractionFlash('pause');
      setIsPlaying(false);
      setShowControls(true); // Always show controls when paused
    } else {
      videoRef.current.play();
      setInteractionFlash('play');
      setIsPlaying(true);
      // Controls will hide via mouseMove timeout
    }
    
    setTimeout(() => setInteractionFlash(null), 600);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling play
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!containerRef.current) return;

      if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
          });
      } else {
          document.exitFullscreen();
      }
  };

  const handleTimeUpdate = () => {
      if (videoRef.current && dragProgress === null) {
          setCurrentTime(videoRef.current.currentTime);
          setDuration(videoRef.current.duration || 0);
      }
  };

  const formatTime = (time: number) => {
      if (!time) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!progressBarRef.current || !videoRef.current) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * videoRef.current.duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
  };

  return (
    <div className="pb-40 animate-in slide-in-from-right-8 duration-700">
      
      {/* HERO VIDEO PLAYER - Adjusted Layout Height to match navigation visual flow */}
      <div 
        ref={containerRef}
        className={`relative w-full overflow-hidden mb-8 group border-b border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.8)] bg-black cursor-pointer select-none transition-all duration-500 
            ${isFullscreen 
                ? 'fixed inset-0 z-[100] rounded-none border-0' 
                : 'rounded-[2rem] h-[calc(100vh-6rem)] -mt-6' /* Pull up slightly to align top with sidebar padding visual if needed, currently filling vertical space */
            }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay} // Container handles the click
      >
         {/* Video Element */}
         <video 
            ref={videoRef}
            src={activeMv.videoUrl}
            poster={activeMv.coverUrl}
            className="w-full h-full object-cover pointer-events-none bg-black"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={() => { setIsPlaying(false); setShowControls(true); }}
            playsInline
            loop
         />
         
         {/* Interaction Flash Animation (Centered) */}
         {interactionFlash && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                 <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white animate-in zoom-in fade-out duration-500">
                     {interactionFlash === 'play' ? <Play className="w-10 h-10 fill-white" /> : <Pause className="w-10 h-10 fill-white" />}
                 </div>
             </div>
         )}

         {/* Dark Gradient Overlay for readability */}
         <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 transition-opacity duration-500 pointer-events-none z-10 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>

         {/* Controls Layer */}
         <div className={`absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10 transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            
            {/* Top Bar - Minimalist */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-2">
                   {/* Removed Text Headers per request for cleaner look */}
                </div>
                <div className="flex gap-2">
                    <button className="p-3 rounded-full bg-black/40 hover:bg-white hover:text-black border border-white/10 transition-all backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                        <Heart className="w-5 h-5" />
                    </button>
                    <button className="p-3 rounded-full bg-black/40 hover:bg-white hover:text-black border border-white/10 transition-all backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Center Play Button (Only visible when paused) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button 
                        className="w-24 h-24 rounded-full bg-brand-lime/90 backdrop-blur-md border border-white/30 flex items-center justify-center text-black hover:scale-110 transition-all shadow-[0_0_50px_rgba(204,255,0,0.5)] group/play pointer-events-auto"
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    >
                        <Play className="w-10 h-10 fill-current ml-2 group-hover/play:scale-125 transition-transform" />
                    </button>
                </div>
            )}

            {/* Bottom Controls Area */}
            <div className="flex flex-col gap-4 w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                
                {/* Info Text */}
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-2 leading-none drop-shadow-xl tracking-tight">{activeMv.title}</h2>
                    <p className="text-xl text-gray-200 font-light drop-shadow-md flex items-center gap-2">
                        {activeMv.artist}
                    </p>
                </div>

                {/* Progress Bar & Controls Row */}
                <div className="flex flex-col gap-3">
                     {/* Progress Bar */}
                     <div 
                        className="group/progress relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-visible hover:h-2 transition-all"
                        ref={progressBarRef}
                        onClick={handleSeek}
                     >
                        {/* Buffered/Background */}
                        <div className="absolute inset-0 rounded-full bg-white/10"></div>
                        {/* Played */}
                        <div 
                            className="absolute top-0 left-0 bottom-0 bg-brand-lime rounded-full shadow-[0_0_15px_var(--brand-primary)]"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                            {/* Thumb (visible on hover) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg"></div>
                        </div>
                     </div>

                     {/* Control Buttons Row */}
                     <div className="flex items-center justify-between mt-1">
                         <div className="flex items-center gap-6">
                             <button onClick={() => togglePlay()} className="text-white hover:text-brand-lime transition-colors">
                                 {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                             </button>
                             <button className="text-gray-300 hover:text-white transition-colors">
                                <SkipForward className="w-5 h-5" />
                             </button>
                             <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="text-gray-300 hover:text-white transition-colors">
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                             </div>
                             <span className="text-xs font-mono font-bold text-gray-300">
                                 {formatTime(currentTime)} / {formatTime(duration)}
                             </span>
                         </div>
                         
                         <div>
                             <button onClick={toggleFullscreen} className="text-gray-300 hover:text-white transition-colors">
                                 {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                             </button>
                         </div>
                     </div>
                </div>
            </div>
         </div>
      </div>

      {/* Categories Scroll */}
      <div className="flex overflow-x-auto gap-3 pb-2 mb-8 scrollbar-hide">
         {categories.map(cat => (
             <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-white text-black border-white shadow-[0_0_15px_white]' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40'}`}
             >
                {cat}
             </button>
         ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {filteredMvs.map((mv) => (
            <div 
                key={mv.id} 
                className={`group cursor-pointer transition-all duration-500 ${activeMv.id === mv.id ? 'opacity-100 ring-1 ring-brand-lime ring-offset-4 ring-offset-dark-950 rounded-2xl' : 'opacity-70 hover:opacity-100'}`}
                onClick={() => { setActiveMv(mv); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
               <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-brand-pink/50 transition-colors shadow-lg">
                  <img src={mv.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={mv.title} />
                  
                  {/* Playing Indicator Overlay */}
                  {activeMv.id === mv.id && isPlaying && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="flex gap-1.5 items-end h-8">
                              <div className="w-1.5 bg-brand-lime animate-[bounceVisualizer_0.5s_infinite_alternate] h-4"></div>
                              <div className="w-1.5 bg-brand-lime animate-[bounceVisualizer_0.7s_infinite_alternate] h-8"></div>
                              <div className="w-1.5 bg-brand-lime animate-[bounceVisualizer_0.4s_infinite_alternate] h-6"></div>
                          </div>
                      </div>
                  )}

                  <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${activeMv.id === mv.id ? 'hidden' : ''}`}>
                     <Play className="w-12 h-12 text-white fill-current opacity-90 drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10">
                     {mv.duration}
                  </div>
               </div>
               
               <div className="flex justify-between items-start">
                   <div className="flex-1 min-w-0 pr-4">
                       <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-brand-pink transition-colors truncate">{mv.title}</h4>
                       <p className="text-sm text-gray-400 truncate">{mv.artist}</p>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                       <span className="text-[10px] font-bold text-gray-500 border border-gray-800 px-1 rounded">{mv.category || 'MV'}</span>
                   </div>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
