
import React, { useMemo } from 'react';
import { Play, TrendingUp, ArrowRight, Zap, FileText, Mic2, Calendar, MapPin, Aperture, Disc, Star, ExternalLink, Activity } from 'lucide-react';
import { Song, MV, View, Article, PageHeaderConfig, GalleryItem } from '../types';
import { MOODS } from '../constants';

interface HomeProps {
  songs: Song[];
  mvs: MV[];
  articles: Article[];
  galleryItems: GalleryItem[];
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  onChangeView: (view: View) => void;
  onReadArticle: (article: Article) => void;
  headerConfig: PageHeaderConfig;
}

export const Home: React.FC<HomeProps> = ({ songs = [], mvs = [], articles = [], galleryItems = [], onPlaySong, currentSongId, onChangeView, onReadArticle, headerConfig }) => {
  const trendingSongs = Array.isArray(songs) ? songs.slice(0, 5) : [];
  
  const featuredMV = useMemo(() => {
      if (!Array.isArray(mvs) || mvs.length === 0) return null;
      return mvs.find(mv => mv.isFeatured) || mvs[0];
  }, [mvs]);

  const featuredArticles = Array.isArray(articles) ? articles.slice(0, 3) : [];

  const UPCOMING_EVENTS = [
      { id: 1, title: 'Neon Nights', date: '10.24', location: 'Tokyo', artist: 'Kavinsky', status: 'Sold Out' },
      { id: 2, title: 'Deep Bass', date: '11.02', location: 'Berlin', artist: 'Recondite', status: 'Selling' },
      { id: 3, title: 'Synthwave', date: '11.15', location: 'Los Angeles', artist: 'Midnight', status: 'Selling' },
  ];

  return (
    <div className="pb-40 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION: Full Width Impact */}
      {featuredMV && (
        <div className="relative w-full h-[60vh] md:h-[70vh] rounded-[2.5rem] overflow-hidden mb-8 group cursor-pointer shadow-2xl border border-white/5" onClick={() => onChangeView(View.MV)}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          
          {/* A. Trending List (Large Vertical) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-6 md:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/10 blur-[80px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-brand-secondary" /> 本周飙升
                  </h2>
                  <button onClick={() => onChangeView(View.CHARTS)} className="text-xs font-bold text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                      完整榜单
                  </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  {trendingSongs.map((song, idx) => (
                      <div 
                         key={song.id}
                         onClick={() => onPlaySong(song)}
                         className={`group flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 ${currentSongId === song.id ? 'bg-white/10 border-brand-lime/30' : ''}`}
                      >
                          <span className={`text-xl font-black italic w-6 text-center ${idx < 3 ? 'text-brand-secondary' : 'text-gray-700'}`}>{idx + 1}</span>
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                              <img src={song.coverUrl} className="w-full h-full object-cover" />
                              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 ${currentSongId === song.id ? 'opacity-100' : ''}`}>
                                  {currentSongId === song.id ? <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-ping"></div> : <Play className="w-5 h-5 text-white fill-current" />}
                              </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-sm truncate ${currentSongId === song.id ? 'text-brand-lime' : 'text-white'}`}>{song.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                          </div>
                          <span className="text-xs font-mono text-gray-600 hidden md:block">{song.duration}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* B. Artist Spotlight (Square) */}
          <div className="bg-white text-black rounded-[2rem] p-6 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform shadow-xl">
              <img src="https://picsum.photos/id/338/400/400" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity mix-blend-multiply" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                          <Mic2 className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-1 bg-black/10 rounded text-[10px] font-bold uppercase tracking-wider">Spotlight</span>
                  </div>
                  <div>
                      <h3 className="text-3xl font-black italic leading-none mb-1">The<br/>Weeknd</h3>
                      <p className="text-xs font-bold opacity-60">Synth-Pop Revival</p>
                  </div>
              </div>
          </div>

          {/* C. Mood Pills (Square) */}
          <div className="bg-[#111] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-brand-lime">
                  <Zap className="w-5 h-5 fill-current" />
                  <span className="font-bold text-white">Vibe Check</span>
              </div>
              <div className="flex-1 flex flex-wrap content-start gap-2">
                  {MOODS.slice(0, 6).map((mood, i) => (
                      <div key={i} className="px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-gray-300 hover:bg-brand-lime hover:text-black hover:border-brand-lime cursor-pointer transition-colors">
                          {mood.label}
                      </div>
                  ))}
              </div>
          </div>

          {/* D. Latest Articles (Horizontal Span 2) */}
          <div className="md:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-[2rem] p-0 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent via-brand-purple to-brand-secondary"></div>
               <div className="p-6 h-full flex flex-col">
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-white flex items-center gap-2">
                           <FileText className="w-5 h-5 text-brand-accent" /> 深度阅读
                       </h3>
                       <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors cursor-pointer" onClick={() => onChangeView(View.ARTICLES)} />
                   </div>
                   <div className="flex-1 flex flex-col gap-3">
                       {featuredArticles.slice(0, 2).map(article => (
                           <div key={article.id} onClick={() => onReadArticle(article)} className="flex gap-4 items-center cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
                               <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                   <img src={article.coverUrl} className="w-full h-full object-cover" />
                               </div>
                               <div className="min-w-0">
                                   <h4 className="font-bold text-white text-sm truncate group-hover:text-brand-accent transition-colors">{article.title}</h4>
                                   <p className="text-xs text-gray-500 line-clamp-1 mt-1">{article.excerpt}</p>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
          </div>

          {/* E. Visual Gallery Preview (Horizontal Span 2) */}
          <div className="md:col-span-2 bg-dark-900 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden cursor-pointer group" onClick={() => onChangeView(View.GALLERY)}>
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <div className="flex justify-between items-end relative z-10 h-full">
                   <div>
                       <div className="text-brand-cyan mb-2">
                           <Aperture className="w-8 h-8 animate-spin-slow" />
                       </div>
                       <h3 className="text-3xl font-display font-black text-white leading-none">Visual<br/>Archive</h3>
                   </div>
                   <div className="flex -space-x-4">
                       {galleryItems.slice(0, 4).map((item, i) => (
                           <div key={item.id} className="w-16 h-16 rounded-full border-2 border-[#111] overflow-hidden relative z-10 transition-transform group-hover:translate-x-2" style={{ zIndex: 10 - i }}>
                               <img src={item.imageUrl} className="w-full h-full object-cover" />
                           </div>
                       ))}
                       <div className="w-16 h-16 rounded-full border-2 border-[#111] bg-white/10 flex items-center justify-center text-white text-xs font-bold relative z-0 group-hover:bg-brand-cyan group-hover:text-black transition-colors">
                           +42
                       </div>
                   </div>
               </div>
          </div>
      </div>

      {/* 3. LIVE EVENTS TICKER */}
      <div className="w-full bg-brand-lime text-black py-3 overflow-hidden mb-8 transform -rotate-1 shadow-[0_0_20px_var(--brand-primary)]">
          <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
              {[...UPCOMING_EVENTS, ...UPCOMING_EVENTS, ...UPCOMING_EVENTS].map((event, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 bg-black rounded-full"></span>
                      <span>{event.title} // {event.artist}</span>
                      <span className="px-2 py-0.5 border border-black rounded-full text-xs">{event.location} {event.date}</span>
                      <span className={`${event.status === 'Sold Out' ? 'line-through opacity-50' : 'text-red-600'}`}>{event.status}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
