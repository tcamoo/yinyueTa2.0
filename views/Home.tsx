
import React, { useMemo } from 'react';
import { Play, TrendingUp, ArrowRight, Zap, FileText, Music, Mic2, Calendar, MapPin, Radio } from 'lucide-react';
import { Song, MV, View, Article, PageHeaderConfig } from '../types';
import { MOODS, MOCK_PLAYLISTS } from '../constants';

interface HomeProps {
  songs: Song[];
  mvs: MV[];
  articles: Article[];
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  onChangeView: (view: View) => void;
  onReadArticle: (article: Article) => void;
  headerConfig: PageHeaderConfig;
}

export const Home: React.FC<HomeProps> = ({ songs = [], mvs = [], articles = [], onPlaySong, currentSongId, onChangeView, onReadArticle, headerConfig }) => {
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
      { id: 1, title: 'Neon Nights Live', date: 'OCT 24', location: 'Tokyo, JP', artist: 'Kavinsky' },
      { id: 2, title: 'Deep Bass Warehouse', date: 'NOV 02', location: 'Berlin, DE', artist: 'Recondite' },
      { id: 3, title: 'Synthwave Festival', date: 'NOV 15', location: 'Los Angeles, US', artist: 'The Midnight' },
  ];

  return (
    <div className="pb-48 animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION: Immersive MV Card */}
      {featuredMV && (
        <div className="relative w-full aspect-[16/9] md:aspect-[2.4/1] rounded-[2.5rem] overflow-hidden mb-16 group border border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)] cursor-pointer" onClick={handleHeroClick}>
           <img 
             src={featuredMV.coverUrl} 
             alt="Hero MV" 
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4000ms] ease-out"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="max-w-4xl z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-brand-lime text-black text-xs font-black uppercase tracking-widest rounded-sm">
                       {headerConfig.subtitle}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-sm border border-white/20">
                       Featured
                    </span>
                 </div>
                 <h1 className="text-5xl md:text-8xl font-display font-black text-white mb-4 leading-[0.9] tracking-tight italic drop-shadow-2xl">
                    {featuredMV.title}
                 </h1>
                 <p className="text-xl md:text-2xl font-light text-gray-300 mb-8 max-w-xl line-clamp-2">
                    {featuredMV.artist} — {headerConfig.description}
                 </p>
                 
                 <div className="flex items-center gap-4">
                    <button 
                       className="h-14 px-8 bg-white text-black font-black text-lg rounded-full hover:bg-brand-lime transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 group/btn hover:scale-105"
                    >
                       <Play className="w-5 h-5 fill-current group-hover/btn:scale-110 transition-transform" />
                       <span>立即播放</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. MOODS (Mood Pills) */}
      <div className="mb-20 overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
             <Zap className="w-6 h-6 text-brand-lime fill-current" />
             <h2 className="text-2xl font-bold tracking-tight text-white">今日氛围</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {MOODS.map((mood, i) => (
                  <button 
                    key={i} 
                    className="group relative min-w-[160px] h-[60px] rounded-full border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  >
                      <div className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-500" style={{ backgroundColor: mood.color, filter: 'blur(20px)' }}></div>
                      <span className="relative z-10 font-bold text-white group-hover:text-black transition-colors uppercase tracking-wider text-sm">{mood.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. TRENDING SONGS + ARTIST SPOTLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
         <div className="lg:col-span-8 bg-white/[0.02] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
                <h2 className="text-3xl font-display font-black flex items-center gap-3">
                   <TrendingUp className="w-7 h-7 text-brand-pink" />
                   本周热榜
                </h2>
                <button onClick={() => onChangeView(View.CHARTS)} className="text-xs font-bold text-gray-500 hover:text-white border border-white/10 px-4 py-2 rounded-full transition-colors">
                    完整榜单
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
               {trendingSongs.map((song, idx) => (
                  <div 
                     key={song.id}
                     onClick={() => onPlaySong(song)}
                     className={`
                       group flex items-center gap-4 p-3 rounded-2xl transition-all cursor-pointer hover:bg-white/5
                       ${currentSongId === song.id ? 'bg-white/10 ring-1 ring-brand-lime/50' : ''}
                     `}
                  >
                     <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-brand-primary/20">
                        <img src={song.coverUrl} className="w-full h-full object-cover" alt={song.title} />
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentSongId === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                           {currentSongId === song.id ? (
                               <div className="w-3 h-3 bg-brand-lime rounded-full animate-pulse"></div>
                           ) : <Play className="w-6 h-6 fill-white text-white" />}
                        </div>
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-black italic w-6 ${idx === 0 ? 'text-brand-lime' : 'text-gray-600'}`}>0{idx + 1}</span>
                            <h3 className={`text-base font-bold truncate ${currentSongId === song.id ? 'text-brand-lime' : 'text-white'}`}>{song.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 truncate ml-8">{song.artist}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* ARTIST SPOTLIGHT CARD */}
         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex-1 bg-black rounded-[2.5rem] p-0 border border-white/5 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] shadow-2xl">
                <img src="https://picsum.photos/id/338/600/800" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-purple/90 via-transparent to-transparent"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between p-8">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 text-brand-purple text-xs font-bold tracking-wider uppercase bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-brand-purple/30">
                            <Mic2 className="w-3 h-3 fill-current" /> Artist Spotlight
                        </div>
                    </div>
                    
                    <div>
                         <h3 className="text-4xl font-black text-white leading-[0.9] italic mb-2 drop-shadow-lg">
                           The <br/> Weeknd
                        </h3>
                        <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                            探索 Synth-pop 复兴的领军人物，感受复古与未来的碰撞。
                        </p>
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black group-hover:bg-brand-purple group-hover:text-white transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* 4. FEATURED PLAYLISTS (NEW SECTION) */}
      <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                 <Music className="w-7 h-7 text-brand-accent" />
                 <h2 className="text-2xl font-bold text-white">精选歌单</h2>
             </div>
             <button onClick={() => onChangeView(View.PLAYLISTS)} className="text-xs font-bold text-gray-500 hover:text-white">更多歌单</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {MOCK_PLAYLISTS.slice(0,4).map((playlist) => (
                  <div key={playlist.id} className="group cursor-pointer">
                      <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 border border-white/5">
                          <img src={playlist.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-10 h-10 fill-white text-white" />
                          </div>
                      </div>
                      <h3 className="font-bold text-white mb-1">{playlist.name}</h3>
                      <p className="text-xs text-gray-500">{playlist.songCount} 首歌曲</p>
                  </div>
              ))}
              {/* Fake Extra Playlists for Visual Fullness */}
              <div className="group cursor-pointer">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 border border-white/5">
                      <img src="https://picsum.photos/id/145/400/400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <h3 className="font-bold text-white mb-1">Coding Focus</h3>
                  <p className="text-xs text-gray-500">128 首歌曲</p>
              </div>
              <div className="group cursor-pointer">
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 border border-white/5">
                      <img src="https://picsum.photos/id/158/400/400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <h3 className="font-bold text-white mb-1">Jazz & Coffee</h3>
                  <p className="text-xs text-gray-500">45 首歌曲</p>
              </div>
          </div>
      </div>

      {/* 5. MAGAZINE / ARTICLES SECTION */}
      <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-3xl font-display font-black flex items-center gap-3">
                  <FileText className="w-8 h-8 text-brand-accent" />
                  深度专栏 <span className="text-gray-600 font-sans text-lg font-normal ml-2">MAGAZINE</span>
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
                     className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 shadow-xl"
                  >
                     <img src={article.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75 group-hover:brightness-100" alt={article.title} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                     
                     <div className="absolute top-6 right-6">
                        <div className="px-3 py-1 rounded-full text-xs font-bold text-black uppercase" style={{ backgroundColor: article.mood }}>
                            Mood
                        </div>
                     </div>

                     <div className="absolute bottom-0 left-0 p-8 w-full">
                         <div className="flex items-center gap-3 mb-3 text-xs font-bold uppercase tracking-wider text-gray-300">
                             <span className="text-brand-lime">{article.tags[0]}</span>
                             <span>•</span>
                             <span>{article.date}</span>
                         </div>
                         <h3 className="text-2xl font-black text-white leading-tight mb-2 line-clamp-2 group-hover:text-brand-lime transition-colors">
                            {article.title}
                         </h3>
                         <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                            {article.excerpt}
                         </p>
                     </div>
                  </div>
               ))}
            </div>
      </div>

      {/* 6. UPCOMING EVENTS (NEW SECTION) */}
      <div className="mb-10 bg-white/[0.03] rounded-[2.5rem] p-8 md:p-12 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
              <Calendar className="w-8 h-8 text-brand-lime" />
              <h2 className="text-3xl font-bold text-white">现场演出</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {UPCOMING_EVENTS.map(event => (
                  <div key={event.id} className="group bg-black/40 border border-white/10 p-6 rounded-2xl hover:border-brand-lime/50 transition-colors cursor-pointer">
                      <div className="text-xs font-bold text-brand-lime mb-2 tracking-widest">{event.date}</div>
                      <h3 className="text-xl font-black text-white mb-1 group-hover:text-brand-lime transition-colors">{event.title}</h3>
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
