
import React, { useMemo } from 'react';
import { Play, TrendingUp, ArrowRight, Zap, FileText, Mic2, Calendar, MapPin, Aperture } from 'lucide-react';
import { Song, MV, View, Article, PageHeaderConfig, GalleryItem } from '../types';
import { MOODS } from '../constants';

interface HomeProps {
  songs: Song[];
  mvs: MV[];
  articles: Article[];
  galleryItems: GalleryItem[]; // Added
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  onChangeView: (view: View) => void;
  onReadArticle: (article: Article) => void;
  headerConfig: PageHeaderConfig;
}

export const Home: React.FC<HomeProps> = ({ songs = [], mvs = [], articles = [], galleryItems = [], onPlaySong, currentSongId, onChangeView, onReadArticle, headerConfig }) => {
  const trendingSongs = Array.isArray(songs) ? songs.slice(0, 4) : [];
  
  const featuredMV = useMemo(() => {
      if (!Array.isArray(mvs) || mvs.length === 0) return null;
      return mvs.find(mv => mv.isFeatured) || mvs[0];
  }, [mvs]);

  const featuredArticles = Array.isArray(articles) ? articles.slice(0, 3) : [];

  const handleHeroClick = () => {
    onChangeView(View.MV);
  };

  const UPCOMING_EVENTS = [
      { id: 1, title: 'Neon Nights', date: 'OCT 24', location: 'Tokyo, JP', artist: 'Kavinsky' },
      { id: 2, title: 'Deep Bass', date: 'NOV 02', location: 'Berlin, DE', artist: 'Recondite' },
      { id: 3, title: 'Synthwave', date: 'NOV 15', location: 'LA, US', artist: 'Midnight' },
  ];

  return (
    <div className="pb-48 lg:pb-32 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION: Immersive MV Card */}
      {featuredMV && (
        <div className="relative w-full aspect-[4/5] md:aspect-[16/9] lg:aspect-[2.4/1] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-12 lg:mb-16 group border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] cursor-pointer" onClick={handleHeroClick}>
           <img 
             src={featuredMV.coverUrl} 
             alt="Hero MV" 
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms] ease-out"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 flex flex-col md:flex-row items-end justify-between gap-6 md:gap-8">
              <div className="max-w-4xl z-10 w-full">
                 <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <span className="px-3 py-1 bg-brand-lime text-black text-[10px] md:text-xs font-black uppercase tracking-widest rounded-sm">
                       {headerConfig.subtitle}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-sm border border-white/20">
                       Featured
                    </span>
                 </div>
                 {/* Mobile Optimized Typography */}
                 <h1 className="text-4xl md:text-6xl lg:text-8xl font-display font-black text-white mb-3 md:mb-4 leading-[0.9] tracking-tight italic drop-shadow-2xl">
                    {featuredMV.title}
                 </h1>
                 <p className="text-sm md:text-xl lg:text-2xl font-light text-gray-300 mb-6 md:mb-8 max-w-xl line-clamp-2">
                    {featuredMV.artist} — {headerConfig.description}
                 </p>
                 
                 <div className="flex items-center gap-4">
                    <button 
                       className="h-12 md:h-14 px-6 md:px-8 bg-white text-black font-black text-base md:text-lg rounded-full hover:bg-brand-lime transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 group/btn hover:scale-105 active:scale-95"
                    >
                       <Play className="w-5 h-5 fill-current group-hover/btn:scale-110 transition-transform" />
                       <span>播放</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. MOODS (Mood Pills) */}
      <div className="mb-12 lg:mb-20">
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <Zap className="w-5 h-5 md:w-6 md:h-6 text-brand-lime fill-current" />
             <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">今日氛围</h2>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {MOODS.map((mood, i) => (
                  <button 
                    key={i} 
                    className="group relative min-w-[140px] md:min-w-[160px] h-[50px] md:h-[60px] rounded-full border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                  >
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: mood.color, filter: 'blur(20px)' }}></div>
                      <span className="relative z-10 font-bold text-white group-hover:text-black transition-colors uppercase tracking-wider text-xs md:text-sm">{mood.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. TRENDING SONGS + ARTIST SPOTLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 lg:mb-20">
         <div className="lg:col-span-8 bg-white/[0.02] rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3">
                   <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-brand-pink" />
                   本周热榜
                </h2>
                <button onClick={() => onChangeView(View.CHARTS)} className="text-xs font-bold text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-colors">
                    完整榜单
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
               {trendingSongs.map((song, idx) => (
                  <div 
                     key={song.id}
                     onClick={() => onPlaySong(song)}
                     className={`
                       group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer hover:bg-white/5 active:bg-white/10
                       ${currentSongId === song.id ? 'bg-white/10 ring-1 ring-brand-lime/50' : ''}
                     `}
                  >
                     <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-brand-primary/20">
                        <img src={song.coverUrl} className="w-full h-full object-cover" alt={song.title} />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentSongId === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                           {currentSongId === song.id ? (
                               <div className="w-3 h-3 bg-brand-lime rounded-full animate-pulse"></div>
                           ) : <Play className="w-6 h-6 fill-white text-white" />}
                        </div>
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-base md:text-lg font-black italic w-6 ${idx === 0 ? 'text-brand-lime' : 'text-gray-600'}`}>0{idx + 1}</span>
                            <h3 className={`text-sm md:text-base font-bold truncate ${currentSongId === song.id ? 'text-brand-lime' : 'text-white'}`}>{song.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 truncate ml-8">{song.artist}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* ARTIST SPOTLIGHT CARD */}
         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 bg-black rounded-[2rem] min-h-[300px] lg:min-h-0 lg:h-auto p-0 border border-white/5 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] shadow-2xl">
                <img src="https://picsum.photos/id/338/600/800" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-purple/90 via-transparent to-transparent"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between p-6 md:p-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-brand-purple text-[10px] font-bold tracking-wider uppercase bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-brand-purple/30">
                            <Mic2 className="w-3 h-3 fill-current" /> Artist Spotlight
                        </div>
                    </div>
                    
                    <div>
                         <h3 className="text-3xl md:text-4xl font-black text-white leading-[0.9] italic mb-2 drop-shadow-lg">
                           The <br/> Weeknd
                        </h3>
                        <p className="text-xs md:text-sm text-gray-300 line-clamp-2 mb-4">
                            探索 Synth-pop 复兴的领军人物，感受复古与未来的碰撞。
                        </p>
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center text-black group-hover:bg-brand-purple group-hover:text-white transition-colors">
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* 4. GALLERY PREVIEW (REPLACED PLAYLISTS) */}
      <div className="mb-12 lg:mb-20">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                 <Aperture className="w-6 h-6 md:w-7 md:h-7 text-brand-cyan" />
                 <h2 className="text-xl md:text-2xl font-bold text-white">光影瞬间</h2>
             </div>
             <button onClick={() => onChangeView(View.GALLERY)} className="text-xs font-bold text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                 进入画廊
             </button>
          </div>

          <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 scrollbar-hide snap-x snap-mandatory">
              {galleryItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="snap-center min-w-[280px] md:min-w-[320px] aspect-[4/3] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group cursor-pointer border border-white/5 relative" onClick={() => onChangeView(View.GALLERY)}>
                      <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-6 left-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <h3 className="font-bold text-white text-lg leading-none mb-1">{item.title}</h3>
                          <p className="text-xs text-brand-cyan font-bold uppercase tracking-wider">{item.photographer}</p>
                      </div>
                  </div>
              ))}
               <div onClick={() => onChangeView(View.GALLERY)} className="snap-center min-w-[100px] flex items-center justify-center rounded-[2rem] bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 group">
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-white transition-all">
                        <ArrowRight className="w-6 h-6" />
                    </div>
               </div>
          </div>
      </div>

      {/* 5. MAGAZINE / ARTICLES SECTION */}
      <div className="mb-12 lg:mb-20">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl md:text-3xl font-display font-black flex items-center gap-3">
                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-brand-accent" />
                  深度专栏
               </h2>
               <button onClick={() => onChangeView(View.ARTICLES)} className="flex items-center gap-2 text-xs font-bold text-white hover:text-brand-lime transition-colors uppercase tracking-widest">
                  View All <ArrowRight className="w-4 h-4" />
               </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {featuredArticles.map((article) => (
                  <div 
                     key={article.id} 
                     onClick={() => onReadArticle(article)}
                     className="group relative h-[350px] md:h-[450px] rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 shadow-xl"
                  >
                     <img src={article.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75 group-hover:brightness-100" alt={article.title} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                     
                     <div className="absolute top-6 right-6">
                        <div className="px-3 py-1 rounded-full text-[10px] font-bold text-black uppercase shadow-lg" style={{ backgroundColor: article.mood }}>
                            Mood
                        </div>
                     </div>

                     <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                         <div className="flex items-center gap-3 mb-3 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-300">
                             <span className="text-brand-lime">{article.tags[0]}</span>
                             <span>•</span>
                             <span>{article.date}</span>
                         </div>
                         <h3 className="text-xl md:text-2xl font-black text-white leading-tight mb-2 line-clamp-2 group-hover:text-brand-lime transition-colors">
                            {article.title}
                         </h3>
                         <p className="text-xs md:text-sm text-gray-400 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hidden md:block">
                            {article.excerpt}
                         </p>
                     </div>
                  </div>
               ))}
            </div>
      </div>

      {/* 6. UPCOMING EVENTS */}
      <div className="mb-24 bg-white/[0.03] rounded-[2rem] p-6 md:p-12 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-6 md:mb-8 relative z-10">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-brand-lime" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">现场演出</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {UPCOMING_EVENTS.map(event => (
                  <div key={event.id} className="group bg-black/40 border border-white/10 p-5 md:p-6 rounded-2xl hover:border-brand-lime/50 transition-colors cursor-pointer">
                      <div className="text-xs font-bold text-brand-lime mb-2 tracking-widest">{event.date}</div>
                      <h3 className="text-lg md:text-xl font-black text-white mb-1 group-hover:text-brand-lime transition-colors">{event.title}</h3>
                      <div className="text-sm text-gray-400 mb-4">{event.artist}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" /> {event.location}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
