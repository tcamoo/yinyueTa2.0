
import React, { useState, useEffect, useMemo } from 'react';
import { DJSet, Song, PageHeaderConfig } from '../types';
import { Play, Activity, Zap, Headphones, Pause, TrendingUp, Sparkles, Speaker, Music, Disc as DiscIcon } from 'lucide-react';

interface DJViewProps {
  djSets: DJSet[];
  onPlaySet: (set: DJSet) => void;
  currentSongId?: string;
  isPlaying?: boolean;
  headerConfig: PageHeaderConfig;
}

export const DJView: React.FC<DJViewProps> = ({ djSets, onPlaySet, currentSongId, isPlaying, headerConfig }) => {
  const [activeSet, setActiveSet] = useState<DJSet | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // Logic for subsets
  const topCharts = useMemo(() => {
     return [...djSets].sort((a, b) => b.plays - a.plays).slice(0, 10);
  }, [djSets]);

  const newDrops = useMemo(() => {
     return djSets.slice(0, 12); // Assume first 12 are new
  }, [djSets]);

  const filteredSets = useMemo(() => {
     if (activeCategory === 'All') return djSets;
     return djSets.filter(s => s.tags.some(t => t.includes(activeCategory)));
  }, [djSets, activeCategory]);

  useEffect(() => {
      if (currentSongId) {
          const found = djSets.find(s => s.id === currentSongId);
          if (found) setActiveSet(found);
      }
  }, [currentSongId, djSets]);

  const featuredSet = useMemo(() => {
      if (headerConfig.featuredItemId) {
          return djSets.find(s => s.id === headerConfig.featuredItemId);
      }
      return null;
  }, [djSets, headerConfig.featuredItemId]);

  return (
    <div className="pb-40 animate-in fade-in duration-700">
      
      {/* 1. HERO DJ BOOTH (Animated Background) */}
      <div className="relative w-full min-h-[600px] rounded-[3rem] overflow-hidden mb-16 bg-black border border-white/5 flex items-center justify-center shadow-[0_0_100px_rgba(0,0,0,0.8)] group perspective-1000">
          
          {/* Animated Club Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
               {/* Base Dark Gradient */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black"></div>
               
               {/* Lasers - Aggressive Contrast */}
               <div className="absolute top-0 left-1/4 w-1 h-[150%] bg-brand-lime blur-[4px] origin-top animate-[laserSwing_2s_infinite_alternate] mix-blend-screen opacity-60"></div>
               <div className="absolute top-0 right-1/4 w-1 h-[150%] bg-brand-pink blur-[4px] origin-top animate-[laserSwing_2.5s_infinite_alternate-reverse] mix-blend-screen opacity-60"></div>
               <div className="absolute top-0 left-1/2 w-0.5 h-[150%] bg-brand-cyan blur-[2px] origin-top animate-[laserSwing_1.5s_infinite_linear] mix-blend-screen opacity-80"></div>

               {/* TURNTABLE VISUAL COMPONENT */}
               <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none transform scale-150 md:scale-100">
                   {/* Deck Base */}
                   <div className="relative w-[500px] h-[500px] rounded-[40px] border border-white/10 bg-[#111] shadow-2xl flex items-center justify-center transform rotate-x-12 rotate-z-6">
                       {/* Platter */}
                       <div className={`relative w-[420px] h-[420px] rounded-full bg-[#050505] border-4 border-[#222] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                           {/* Grooves */}
                           <div className="absolute inset-4 rounded-full border border-white/5 opacity-50"></div>
                           <div className="absolute inset-8 rounded-full border border-white/5 opacity-40"></div>
                           <div className="absolute inset-12 rounded-full border border-white/5 opacity-30"></div>
                           <div className="absolute inset-16 rounded-full border border-white/5 opacity-20"></div>
                           <div className="absolute inset-20 rounded-full border border-white/5 opacity-10"></div>
                           
                           {/* Label */}
                           <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-brand-pink to-brand-purple flex items-center justify-center shadow-lg">
                               <div className="w-4 h-4 rounded-full bg-black"></div>
                           </div>
                       </div>
                       {/* Tone Arm */}
                       <div className="absolute -top-10 right-10 w-8 h-64 bg-gray-800 rounded-full origin-top transform rotate-[25deg] shadow-xl border-l border-white/10 z-10 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-700 -mt-4 border-2 border-gray-600"></div>
                            <div className="w-2 h-full bg-gray-600/50"></div>
                            <div className="w-10 h-16 bg-gray-900 rounded mb-2 border border-white/20"></div>
                       </div>
                       {/* Controls */}
                       <div className="absolute bottom-6 right-6 flex gap-3">
                           <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-brand-lime animate-pulse' : 'bg-red-500'}`}></div>
                           <div className="w-4 h-4 rounded-full bg-gray-700"></div>
                       </div>
                   </div>
               </div>

               {/* FLOATING NOTES ANIMATION */}
               <div className="absolute inset-0 pointer-events-none">
                   {[...Array(8)].map((_, i) => (
                       <div 
                         key={i}
                         className="absolute text-brand-lime/20 animate-float-note"
                         style={{
                             left: `${Math.random() * 100}%`,
                             top: '100%',
                             animationDuration: `${4 + Math.random() * 6}s`,
                             animationDelay: `${Math.random() * 5}s`,
                             fontSize: `${20 + Math.random() * 40}px`
                         }}
                       >
                           {i % 2 === 0 ? <Music /> : <DiscIcon />}
                       </div>
                   ))}
               </div>

               {/* Fog/Noise */}
               <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay"></div>
          </div>

          {featuredSet ? (
             <>
                 {/* Hero Content Overlay */}
                 <div className="relative z-10 text-center max-w-4xl px-8 mt-12">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-pink/30 bg-brand-pink/20 backdrop-blur-md mb-6 animate-pulse shadow-[0_0_20px_rgba(255,0,153,0.3)]">
                          <Zap className="w-4 h-4 text-brand-pink fill-current" />
                          <span className="text-xs font-black tracking-[0.2em] text-brand-pink uppercase">Featured Set</span>
                      </div>
                      
                      <h1 className="text-6xl md:text-8xl font-display font-black text-white mb-6 leading-none italic tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                         {featuredSet.title}
                      </h1>
    
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-gray-300 mb-10 font-mono bg-black/40 backdrop-blur-sm py-2 px-6 rounded-full border border-white/5 inline-flex mx-auto">
                          <span className="flex items-center gap-2 text-white font-bold text-xl"><Headphones className="w-5 h-5" /> {featuredSet.djName}</span>
                          <span className="hidden md:inline text-white/20">|</span>
                          <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-brand-pink" /> {featuredSet.bpm} BPM</span>
                      </div>
    
                      <div className="flex justify-center">
                          <button 
                            onClick={() => onPlaySet(featuredSet)}
                            className={`px-12 py-5 rounded-full font-black text-xl flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,0,153,0.4)] ${isPlaying && featuredSet.id === currentSongId ? 'bg-brand-pink text-white' : 'bg-white text-black hover:bg-brand-pink hover:text-white'}`}
                          >
                            {isPlaying && featuredSet.id === currentSongId ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                            {isPlaying && featuredSet.id === currentSongId ? "PAUSE MIX" : "PLAY MIX"}
                          </button>
                      </div>
                 </div>
             </>
          ) : (
             <div className="relative z-10 text-center">
                 <h1 className="text-7xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{headerConfig.title}</h1>
                 <p className="text-2xl text-gray-400">{headerConfig.description}</p>
             </div>
          )}
      </div>

      {/* 2. FRESH DROPS - HORIZONTAL SCROLL */}
      <section className="mb-20">
         <div className="flex items-center justify-between px-4 mb-8">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                     <Sparkles className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-white">Fresh Drops <span className="text-gray-500 text-sm font-normal ml-2">New arrivals this week</span></h2>
             </div>
         </div>
         
         <div className="flex overflow-x-auto gap-6 px-4 pb-8 scrollbar-hide">
             {newDrops.map((set, i) => (
                 <div 
                    key={set.id}
                    onClick={() => { setActiveSet(set); onPlaySet(set); }}
                    className="min-w-[200px] group cursor-pointer"
                 >
                     <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-white/5 group-hover:border-brand-cyan/50 transition-colors shadow-lg">
                         <img src={set.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                         <div className="absolute top-2 left-2 bg-brand-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">New</div>
                         
                         {/* Play Overlay */}
                         <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${activeSet?.id === set.id ? 'opacity-100 bg-black/60' : ''}`}>
                             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                                 {isPlaying && activeSet?.id === set.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                             </div>
                         </div>
                     </div>
                     <h3 className={`font-bold text-sm truncate ${activeSet?.id === set.id ? 'text-brand-cyan' : 'text-white'}`}>{set.title}</h3>
                     <p className="text-xs text-gray-500 truncate">{set.djName}</p>
                 </div>
             ))}
         </div>
      </section>

      {/* 3. CHART & LIST LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 px-4">
          
          {/* LEFT: TOP 10 CHART */}
          <div className="lg:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-brand-pink" />
                  <h2 className="text-2xl font-bold text-white">Top 10 Club Hits</h2>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-2">
                  {topCharts.map((set, idx) => (
                      <div 
                        key={set.id}
                        onClick={() => { setActiveSet(set); onPlaySet(set); }}
                        className={`flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group ${activeSet?.id === set.id ? 'bg-white/10' : ''}`}
                      >
                          <span className={`text-lg font-black w-6 text-center ${idx < 3 ? 'text-brand-pink' : 'text-gray-600'}`}>{idx + 1}</span>
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={set.coverUrl} className="w-full h-full object-cover" />
                              {activeSet?.id === set.id && isPlaying && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-brand-pink rounded-full animate-ping"></div>
                                  </div>
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-sm truncate ${activeSet?.id === set.id ? 'text-brand-pink' : 'text-white'}`}>{set.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{set.djName}</p>
                          </div>
                          <span className="text-xs font-mono text-gray-600">{set.bpm} BPM</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* RIGHT: ALL SETS GRID */}
          <div className="lg:col-span-8">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                   <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                       <Speaker className="w-6 h-6" /> Explore Mixes
                   </h2>
                   
                   {/* Tags Filter */}
                   <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                       {['All', 'House', 'Techno', 'Trance', 'Dubstep', 'Ambient'].map(tag => (
                           <button 
                              key={tag} 
                              onClick={() => setActiveCategory(tag)}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${activeCategory === tag ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'}`}
                           >
                               {tag}
                           </button>
                       ))}
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {filteredSets.map((set) => (
                       <div 
                         key={set.id}
                         onClick={() => { setActiveSet(set); onPlaySet(set); }}
                         className={`bg-dark-900 border border-white/5 rounded-2xl p-3 hover:border-brand-lime/30 transition-all group cursor-pointer hover:-translate-y-1 ${activeSet?.id === set.id ? 'border-brand-lime/50 bg-white/[0.03]' : ''}`}
                       >
                           <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3">
                               <img src={set.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                               <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                                   {set.duration}
                               </div>
                           </div>
                           <div className="px-1">
                               <h3 className={`font-bold text-base mb-1 truncate ${activeSet?.id === set.id ? 'text-brand-lime' : 'text-white group-hover:text-brand-lime'}`}>
                                   {set.title}
                               </h3>
                               <div className="flex justify-between items-center text-xs text-gray-500">
                                   <span>{set.djName}</span>
                                   <div className="flex gap-1">
                                       <Activity className="w-3 h-3" /> {set.plays.toLocaleString()}
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      <style>{`
          @keyframes laserSwing {
              0% { transform: rotate(-25deg) translateX(-50%); opacity: 0.3; }
              50% { opacity: 0.9; }
              100% { transform: rotate(25deg) translateX(50%); opacity: 0.3; }
          }
          @keyframes float-note {
              0% { transform: translateY(0) rotate(0deg); opacity: 0; }
              20% { opacity: 0.8; }
              80% { opacity: 0.5; }
              100% { transform: translateY(-300px) rotate(360deg); opacity: 0; }
          }
      `}</style>
    </div>
  );
};
