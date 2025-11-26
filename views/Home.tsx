
import React, { useMemo } from 'react';
import { Play, TrendingUp, ArrowRight, Zap, FileText, Mic2, Calendar, MapPin, Aperture, Disc, Star, ExternalLink, Activity, Headphones, Download, Speaker, Globe } from 'lucide-react';
import { Song, MV, View, Article, PageHeaderConfig, GalleryItem, DJSet, SoftwareItem } from '../types';
import { MOODS } from '../constants';

interface HomeProps {
  songs: Song[];
  mvs: MV[];
  articles: Article[];
  galleryItems: GalleryItem[];
  djSets?: DJSet[];
  softwareItems?: SoftwareItem[];
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  onChangeView: (view: View) => void;
  onReadArticle: (article: Article) => void;
  headerConfig: PageHeaderConfig;
}

export const Home: React.FC<HomeProps> = ({ 
    songs = [], 
    mvs = [], 
    articles = [], 
    galleryItems = [], 
    djSets = [],
    softwareItems = [],
    onPlaySong, 
    currentSongId, 
    onChangeView, 
    onReadArticle, 
    headerConfig 
}) => {
  const trendingSongs = Array.isArray(songs) ? songs.slice(0, 5) : [];
  
  const featuredMV = useMemo(() => {
      if (!Array.isArray(mvs) || mvs.length === 0) return null;
      return mvs.find(mv => mv.isFeatured) || mvs[0];
  }, [mvs]);

  const featuredArticles = Array.isArray(articles) ? articles.slice(0, 3) : [];
  const latestDJ = djSets.slice(0, 4);
  const featuredSoftware = softwareItems.slice(0, 3);

  const UPCOMING_EVENTS = [
      { id: 1, title: 'Neon Nights Tour', date: '10.24', location: 'Tokyo, JP', artist: 'Kavinsky', status: 'Sold Out' },
      { id: 2, title: 'Deep Bass Weekender', date: '11.02', location: 'Berlin, DE', artist: 'Recondite', status: 'Selling' },
      { id: 3, title: 'Synthwave Festival', date: '11.15', location: 'Los Angeles, US', artist: 'Midnight', status: 'Selling' },
      { id: 4, title: 'Sonar Sound', date: '12.01', location: 'Barcelona, ES', artist: 'Multiple', status: 'Coming Soon' },
  ];

  return (
    <div className="pb-40 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION: Full Width Impact */}
      {featuredMV && (
        <div className="relative w-full h-[60vh] md:h-[75vh] rounded-[2.5rem] overflow-hidden mb-12 group cursor-pointer shadow-2xl border border-white/5" onClick={() => onChangeView(View.MV)}>
           {/* Dynamic Video Background Simulator */}
           <img 
             src={featuredMV.coverUrl} 
             alt="Hero MV" 
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out filter brightness-75 group-hover:brightness-90"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
           <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col justify-end items-start z-20">
              <div className="flex items-center gap-3 mb-4 animate-in slide-in-from-left-4 duration-700 delay-100">
                  <span className="px-3 py-1 bg-brand-lime text-black text-xs font-black uppercase tracking-widest rounded shadow-[0_0_15px_var(--brand-primary)]">
                     {headerConfig.subtitle}
                  </span>
                  <div className="flex items-center gap-2 text-white/80 text-xs font-mono border border-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                      <Activity className="w-3 h-3 text-brand-lime" /> Trending Now
                  </div>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-9xl font-display font-black text-white mb-6 leading-[0.85] tracking-tighter italic drop-shadow-2xl animate-in slide-in-from-bottom-4 duration-700 delay-200">
                 {featuredMV.title}
              </h1>
              
              <div className="flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                  <button className="h-14 px-8 bg-white text-black font-black text-lg rounded-full hover:bg-brand-lime hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2">
                      <Play className="w-5 h-5 fill-current" /> 立即播放
                  </button>
                  <div className="hidden md:flex flex-col">
                      <span className="text-xl text-white font-bold">{featuredMV.artist}</span>
                      <span className="text-sm text-gray-400">{headerConfig.description}</span>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. BENTO GRID LAYOUT: High Density Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
          
          {/* A. Trending List (Large Vertical) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 md:p-8 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/10 blur-[80px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-brand-secondary" /> 本周飙升
                  </h2>
                  <button onClick={() => onChangeView(View.CHARTS)} className="text-xs font-bold text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-full transition-colors hover:bg-white/5">
                      完整榜单
                  </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  {trendingSongs.map((song, idx) => (
                      <div 
                         key={song.id}
                         onClick={() => onPlaySong(song)}
                         className={`group flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 ${currentSongId === song.id ? 'bg-white/10 border-brand-lime/30' : ''}`}
                      >
                          <span className={`text-2xl font-black italic w-8 text-center ${idx < 3 ? 'text-brand-secondary' : 'text-gray-700'}`}>{idx + 1}</span>
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                              <img src={song.coverUrl} className="w-full h-full object-cover" />
                              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 ${currentSongId === song.id ? 'opacity-100' : ''}`}>
                                  {currentSongId === song.id ? <div className="w-2 h-2 bg-brand-lime rounded-full animate-ping"></div> : <Play className="w-6 h-6 text-white fill-current" />}
                              </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-base truncate ${currentSongId === song.id ? 'text-brand-lime' : 'text-white'}`}>{song.title}</h4>
                              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                          </div>
                          <span className="text-xs font-mono text-gray-600 hidden md:block">{song.duration}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* B. Artist Spotlight (Square) */}
          <div className="bg-white text-black rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform shadow-xl h-[300px] md:h-auto">
              <img src="https://picsum.photos/id/338/600/600" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity mix-blend-multiply" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
                          <Mic2 className="w-6 h-6" />
                      </div>
                      <span className="px-3 py-1 bg-black/10 rounded-full text-[10px] font-bold uppercase tracking-wider">Spotlight</span>
                  </div>
                  <div>
                      <h3 className="text-5xl font-black italic leading-[0.85] mb-2">The<br/>Weeknd</h3>
                      <p className="text-sm font-bold opacity-60">Synth-Pop Revival</p>
                  </div>
              </div>
          </div>

          {/* C. Mood Pills (Square) */}
          <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col h-[300px] md:h-auto">
              <div className="flex items-center gap-3 mb-6 text-brand-lime">
                  <Zap className="w-6 h-6 fill-current" />
                  <span className="font-bold text-xl text-white">Vibe Check</span>
              </div>
              <div className="flex-1 flex flex-wrap content-start gap-3">
                  {MOODS.slice(0, 8).map((mood, i) => (
                      <div key={i} className="px-4 py-2 rounded-full border border-white/10 text-sm font-bold text-gray-300 hover:bg-brand-lime hover:text-black hover:border-brand-lime cursor-pointer transition-colors">
                          {mood.label}
                      </div>
                  ))}
              </div>
          </div>

          {/* D. Latest Articles (Horizontal Span 2) */}
          <div className="md:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-0 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-purple to-brand-secondary"></div>
               <div className="p-8 h-full flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-6">
                       <h3 className="font-bold text-xl text-white flex items-center gap-2">
                           <FileText className="w-5 h-5 text-brand-accent" /> 深度阅读
                       </h3>
                       <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors cursor-pointer" onClick={() => onChangeView(View.ARTICLES)} />
                   </div>
                   <div className="flex flex-col gap-4">
                       {featuredArticles.slice(0, 2).map(article => (
                           <div key={article.id} onClick={() => onReadArticle(article)} className="flex gap-5 items-center cursor-pointer hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors">
                               <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                   <img src={article.coverUrl} className="w-full h-full object-cover" />
                               </div>
                               <div className="min-w-0">
                                   <h4 className="font-bold text-white text-lg truncate group-hover:text-brand-accent transition-colors">{article.title}</h4>
                                   <p className="text-sm text-gray-500 line-clamp-1 mt-1">{article.excerpt}</p>
                                   <div className="flex gap-2 mt-2">
                                       {article.tags.map(t => <span key={t} className="text-[10px] text-gray-600 border border-white/10 px-2 rounded-full">{t}</span>)}
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
          </div>

          {/* E. Visual Gallery Preview (Horizontal Span 2) */}
          <div className="md:col-span-2 bg-dark-900 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden cursor-pointer group" onClick={() => onChangeView(View.GALLERY)}>
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <div className="flex justify-between items-end relative z-10 h-full min-h-[200px]">
                   <div>
                       <div className="text-brand-cyan mb-4">
                           <Aperture className="w-10 h-10 animate-spin-slow" />
                       </div>
                       <h3 className="text-4xl font-display font-black text-white leading-none">Visual<br/>Archive</h3>
                   </div>
                   <div className="flex -space-x-6">
                       {galleryItems.slice(0, 4).map((item, i) => (
                           <div key={item.id} className="w-24 h-24 rounded-full border-4 border-[#111] overflow-hidden relative z-10 transition-transform group-hover:translate-x-3 shadow-xl" style={{ zIndex: 10 - i }}>
                               <img src={item.imageUrl} className="w-full h-full object-cover" />
                           </div>
                       ))}
                       <div className="w-24 h-24 rounded-full border-4 border-[#111] bg-white/10 flex items-center justify-center text-white text-lg font-bold relative z-0 group-hover:bg-brand-cyan group-hover:text-black transition-colors backdrop-blur-md">
                           +42
                       </div>
                   </div>
               </div>
          </div>
      </div>

      {/* 3. NEW SECTION: DJ MIXES CAROUSEL */}
      <section className="mb-24 relative">
          <div className="flex items-center justify-between px-4 mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink border border-brand-pink/20">
                      <Disc className="w-6 h-6" />
                  </div>
                  <div>
                      <h2 className="text-3xl font-bold text-white leading-none mb-1">Club Mixes</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exclusive DJ Sets</p>
                  </div>
               </div>
               <button onClick={() => onChangeView(View.DJ)} className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                   全部 Sets <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
               </button>
          </div>

          <div className="flex overflow-x-auto gap-6 px-4 pb-8 scrollbar-hide snap-x">
               {latestDJ.map((set) => (
                   <div 
                      key={set.id} 
                      className="snap-start min-w-[300px] bg-[#111] rounded-[2rem] p-4 border border-white/5 hover:border-brand-pink/30 transition-all cursor-pointer group"
                      onClick={() => {
                          const adaptedSong: Song = { ...set, artist: set.djName, plays: 0 }; 
                          onPlaySong(adaptedSong);
                      }}
                   >
                       <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 shadow-lg">
                           <img src={set.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                           <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-bold text-white border border-white/10 flex items-center gap-1">
                               <Headphones className="w-3 h-3" /> {set.bpm} BPM
                           </div>
                           <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <div className="w-14 h-14 bg-brand-pink rounded-full flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                   <Play className="w-6 h-6 fill-current ml-1" />
                               </div>
                           </div>
                       </div>
                       <div className="px-1">
                           <h3 className="font-bold text-lg text-white truncate mb-1">{set.title}</h3>
                           <div className="flex justify-between items-center text-sm text-gray-500">
                               <span>{set.djName}</span>
                               <span className="font-mono">{set.duration}</span>
                           </div>
                       </div>
                   </div>
               ))}
          </div>
      </section>

      {/* 4. NEW SECTION: SOFTWARE / TOOLS */}
      <section className="mb-24 px-4">
          <div className="bg-gradient-to-br from-[#111] to-black rounded-[3rem] p-8 md:p-12 border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>
               
               <div className="flex flex-col md:flex-row gap-12 relative z-10">
                   <div className="md:w-1/3">
                       <span className="text-brand-cyan font-bold tracking-widest text-xs uppercase mb-4 block">Producer Tools</span>
                       <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Create<br/>Your Sound.</h2>
                       <p className="text-gray-400 mb-8 leading-relaxed">
                           精选 DAW 插件、采样包与合成器预设。从 Bedroom Producer 到专业录音室的必备工具库。
                       </p>
                       <button onClick={() => onChangeView(View.SOFTWARE)} className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-brand-cyan hover:scale-105 transition-all shadow-lg">
                           浏览资源库
                       </button>
                   </div>
                   
                   <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {featuredSoftware.map((item) => (
                           <div key={item.id} className="bg-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors border border-white/5 hover:border-brand-cyan/30 group cursor-pointer" onClick={() => onChangeView(View.SOFTWARE)}>
                               <div className="flex justify-between items-start mb-4">
                                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                                       item.provider === 'aliyun' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                                   }`}>
                                       <Download className="w-6 h-6" />
                                   </div>
                                   {item.isOfficial && <span className="text-[10px] bg-brand-lime/20 text-brand-lime px-2 py-0.5 rounded font-bold border border-brand-lime/20">OFFICIAL</span>}
                               </div>
                               <h3 className="font-bold text-white text-lg mb-1 truncate">{item.name}</h3>
                               <p className="text-xs text-gray-500 mb-4">{item.size} • {item.platform.toUpperCase()}</p>
                               <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-cyan w-0 group-hover:w-full transition-all duration-700 ease-out"></div>
                               </div>
                           </div>
                       ))}
                       <div className="bg-transparent border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all cursor-pointer p-6" onClick={() => onChangeView(View.SOFTWARE)}>
                           <Globe className="w-8 h-8 mb-2" />
                           <span className="font-bold">View All</span>
                       </div>
                   </div>
               </div>
          </div>
      </section>

      {/* 5. NEW SECTION: EVENTS TICKER (VERTICAL) */}
      <section className="mb-24 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4">
               <h2 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800 leading-[0.8]">LIVE<br/>TOUR</h2>
           </div>
           <div className="lg:col-span-8">
               <div className="flex flex-col divide-y divide-white/10">
                   {UPCOMING_EVENTS.map((event) => (
                       <div key={event.id} className="group py-6 flex items-center justify-between hover:bg-white/5 transition-colors px-4 -mx-4 rounded-xl cursor-pointer">
                           <div className="flex items-baseline gap-6 md:gap-12">
                               <span className="text-xl font-mono text-brand-lime font-bold w-12">{event.date}</span>
                               <div>
                                   <h3 className="text-2xl md:text-3xl font-black text-white group-hover:translate-x-2 transition-transform">{event.title}</h3>
                                   <p className="text-gray-500 flex items-center gap-2 mt-1">
                                       <MapPin className="w-4 h-4" /> {event.location} <span className="w-1 h-1 bg-gray-700 rounded-full"></span> {event.artist}
                                   </p>
                               </div>
                           </div>
                           <div className="text-right">
                               <span className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider ${
                                   event.status === 'Sold Out' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 
                                   event.status === 'Selling' ? 'border-brand-lime/30 text-brand-lime bg-brand-lime/5 group-hover:bg-brand-lime group-hover:text-black' : 
                                   'border-gray-700 text-gray-500'
                               }`}>
                                   {event.status}
                               </span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
      </section>

      {/* 6. LIVE EVENTS TICKER (FOOTER) */}
      <div className="w-full bg-brand-lime text-black py-4 overflow-hidden mb-12 transform -rotate-1 shadow-[0_0_40px_var(--brand-primary)] border-y-4 border-black">
          <div className="flex animate-marquee whitespace-nowrap gap-16 items-center">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 text-xl font-black uppercase tracking-wider italic">
                      <Speaker className="w-6 h-6 fill-black" />
                      <span>YINYUETAI // AUDIO VISUAL EXPERIENCE // 2024</span>
                  </div>
              ))}
          </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center pb-8 pt-12 border-t border-white/5">
           <h2 className="font-display font-black text-[15vw] leading-none text-white/5 select-none pointer-events-none">YINYUETAI</h2>
           <div className="flex justify-center gap-8 mt-[-4vw] relative z-10 text-gray-500 text-sm">
               <a href="#" className="hover:text-white transition-colors">About</a>
               <a href="#" className="hover:text-white transition-colors">Contact</a>
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Submit Music</a>
           </div>
           <p className="text-gray-700 text-xs mt-8 font-mono">© 2024 Yinyuetai. All rights reserved.</p>
      </footer>
    </div>
  );
};
