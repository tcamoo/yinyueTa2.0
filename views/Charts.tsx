

import React, { useMemo } from 'react';
import { Song, PageHeaderConfig } from '../types';
import { Play, Globe, Sparkles, Activity, Zap, ArrowUp, Music2, Disc, Star, BarChart3, TrendingUp, Shuffle, Heart, Search } from 'lucide-react';
import { MOODS } from '../constants';

interface ChartsProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  isPlaying?: boolean;
  headerConfig: PageHeaderConfig;
}

export const Charts: React.FC<ChartsProps> = ({ songs, onPlaySong, currentSongId, isPlaying, headerConfig }) => {
  
  // Logic: 
  // 1. Top Charts = Sorted by plays (descending)
  // 2. New Releases = Songs are assumed to be added chronologically (newest first).
  // 3. Guess You Like = Random shuffle
  
  const topSongs = useMemo(() => {
    return [...songs].sort((a, b) => b.plays - a.plays).slice(0, 50);
  }, [songs]);

  const newReleases = useMemo(() => {
    // Assuming newer songs are at the beginning of the list based on Library logic
    return songs.slice(0, 8); 
  }, [songs]);

  const guessYouLike = useMemo(() => {
      // Simple Fisher-Yates shuffle simulation for random pick
      const shuffled = [...songs].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
  }, [songs]);

  const featuredSong = useMemo(() => {
      if (headerConfig.featuredItemId) {
          return songs.find(s => s.id === headerConfig.featuredItemId);
      }
      return topSongs[0];
  }, [songs, headerConfig.featuredItemId, topSongs]);

  return (
    <div className="pb-40 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. HERO FEATURED SONG (Configurable) */}
      {featuredSong ? (
           <header className="relative mb-24 min-h-[500px] flex items-end p-8 md:p-16 rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] group">
                {/* Background Cover Blurred */}
                <div className="absolute inset-0 z-0">
                    <img src={featuredSong.coverUrl} className="w-full h-full object-cover blur-3xl opacity-40 scale-125" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>

                <div className="relative z-10 w-full flex flex-col md:flex-row items-end justify-between gap-8">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-left-4 duration-1000 delay-100">
                            <span className="px-4 py-1.5 rounded-full border border-brand-lime/30 bg-brand-lime/10 text-brand-lime text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-[0_0_20px_rgba(204,255,0,0.1)] flex items-center gap-2">
                            <Globe className="w-3 h-3 animate-pulse" /> Global Charts Hero
                            </span>
                        </div>
                        
                        <h1 className="text-6xl lg:text-8xl leading-[0.9] font-display font-black text-white mb-4 tracking-tighter drop-shadow-2xl uppercase">
                            {featuredSong.title}
                        </h1>
                        <p className="text-2xl text-gray-300 font-light max-w-lg leading-relaxed mb-8">
                            {featuredSong.artist}
                        </p>

                        <button 
                            onClick={() => onPlaySong(featuredSong)}
                            className="px-10 py-5 bg-white text-black font-black text-xl rounded-full hover:bg-brand-lime transition-all shadow-lg flex items-center gap-3 group/btn"
                        >
                            <Play className="w-6 h-6 fill-current group-hover/btn:scale-125 transition-transform" />
                            立即播放
                        </button>
                    </div>
                    
                    {/* Visualizer Widget */}
                    <div className="w-64 h-64 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between">
                         <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                             <span>Current Trend</span>
                             <span className="text-brand-lime">+120%</span>
                         </div>
                         <div className="flex items-end gap-1 h-32">
                             {Array.from({length: 20}).map((_, i) => (
                                 <div key={i} className="flex-1 bg-brand-lime rounded-t-sm animate-[bounceVisualizer_1s_infinite_alternate]" style={{ animationDelay: `${i*0.1}s`, opacity: 0.5 + Math.random()*0.5 }}></div>
                             ))}
                         </div>
                    </div>
                </div>
           </header>
      ) : (
          /* Fallback Header if no song found */
          <header className="relative mb-24 min-h-[400px] flex items-end p-16 rounded-[3rem] bg-gradient-to-br from-gray-900 to-black border border-white/10">
               <div>
                   <h1 className="text-8xl font-black text-white mb-4">{headerConfig.title}</h1>
                   <p className="text-xl text-gray-400">{headerConfig.description}</p>
               </div>
          </header>
      )}

      {/* 2. NEW RELEASES - HORIZONTAL SCROLL */}
      <section className="mb-24 relative z-10">
         <div className="flex items-center justify-between mb-10 px-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border border-brand-cyan/20">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white leading-none mb-1">新歌首发</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fresh Drops</p>
                </div>
             </div>
             <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-2 group">
                 查看全部 <ArrowUp className="w-4 h-4 rotate-90 group-hover:translate-x-1 transition-transform" />
             </button>
         </div>

         <div className="flex overflow-x-auto gap-6 pb-8 px-4 scrollbar-hide snap-x snap-mandatory">
             {newReleases.map((song, i) => (
                 <div 
                    key={song.id}
                    onClick={() => onPlaySong(song)}
                    className="snap-start flex-shrink-0 w-[200px] md:w-[240px] group cursor-pointer"
                 >
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 border border-white/5 bg-white/5 shadow-lg transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:border-brand-lime/30">
                        <img src={song.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100" alt={song.title} />
                        
                        {/* Status Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                             {i < 3 && <span className="px-2 py-1 bg-brand-lime/90 backdrop-blur-md text-black text-[10px] font-black uppercase tracking-wider rounded shadow-lg">NEW</span>}
                             {song.neteaseId && <span className="px-2 py-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider rounded shadow-lg">NETEASE</span>}
                        </div>

                        {/* Play Overlay */}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${currentSongId === song.id ? 'opacity-100 bg-black/60' : 'opacity-0 group-hover:opacity-100'}`}>
                             <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 ${currentSongId === song.id ? 'bg-brand-lime text-black' : 'bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-brand-lime hover:text-black hover:border-brand-lime'}`}>
                                 {currentSongId === song.id && isPlaying ? (
                                     <div className="flex gap-1 h-5 items-end">
                                          {[1,2,3].map(k => (
                                              <div key={k} className="w-1.5 bg-current animate-[bounceVisualizer_0.5s_infinite]" style={{animationDelay: `${k*0.1}s`}}></div>
                                          ))}
                                     </div>
                                 ) : <Play className="w-6 h-6 fill-current ml-1" />}
                             </div>
                        </div>
                    </div>

                    <div className="px-2">
                        <h3 className={`font-bold text-lg truncate mb-1 transition-colors ${currentSongId === song.id ? 'text-brand-lime' : 'text-white group-hover:text-brand-lime'}`}>
                            {song.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate group-hover:text-gray-300 transition-colors">
                            {song.artist}
                        </p>
                    </div>
                 </div>
             ))}
         </div>
      </section>

      {/* 3. GUESS YOU LIKE & MOODS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24 px-4">
          
          {/* GUESS YOU LIKE */}
          <div className="lg:col-span-8">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink border border-brand-pink/20">
                      <Shuffle className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">猜你喜欢</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {guessYouLike.map(song => (
                      <div 
                         key={song.id}
                         onClick={() => onPlaySong(song)}
                         className="group flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer border border-white/5 hover:border-brand-pink/30 hover:-translate-y-1"
                      >
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                              <img src={song.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${currentSongId === song.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                  {currentSongId === song.id && isPlaying ? (
                                      <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center animate-pulse">
                                          <Music2 className="w-4 h-4" />
                                      </div>
                                  ) : <Play className="w-8 h-8 fill-white text-white" />}
                              </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-lg truncate mb-1 ${currentSongId === song.id ? 'text-brand-pink' : 'text-white'}`}>{song.title}</h3>
                              <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                              <div className="mt-2 flex gap-2">
                                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">Recommended</span>
                              </div>
                          </div>
                          <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:bg-white hover:text-red-500 transition-colors">
                              <Heart className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
               </div>
          </div>

          {/* MOODS */}
          <div className="lg:col-span-4 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-brand-lime/10 flex items-center justify-center text-brand-lime border border-brand-lime/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">情感分类</h2>
                </div>
                
                <div className="flex-1 grid grid-cols-2 gap-3">
                    {MOODS.map((mood, i) => (
                        <div 
                           key={i}
                           className="relative overflow-hidden rounded-2xl group cursor-pointer border border-white/5 hover:border-white/20 transition-all"
                           style={{ backgroundColor: `${mood.color}10` }} // 10% opacity hex
                        >
                             <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-xl opacity-40 transition-transform group-hover:scale-150" style={{ backgroundColor: mood.color }}></div>
                             <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }}></div>
                                  <span className="font-bold text-sm text-white group-hover:translate-x-1 transition-transform">{mood.label}</span>
                             </div>
                        </div>
                    ))}
                </div>
          </div>
      </section>

      {/* 4. OFFICIAL CHARTS - LIST STYLE */}
      <section className="px-4 mb-24">
          <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink border border-brand-pink/20">
                    <TrendingUp className="w-6 h-6" />
               </div>
               <div>
                    <h2 className="text-3xl font-bold text-white leading-none mb-1">官方热歌榜</h2>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Official Top 50</p>
                </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* LEFT: CHART TABLE */}
              <div className="lg:col-span-8">
                   <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden relative">
                       {/* Table Header */}
                       <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                           <div className="col-span-1">#</div>
                           <div className="col-span-6 md:col-span-5">Title</div>
                           <div className="col-span-3 hidden md:block">Artist</div>
                           <div className="col-span-2 hidden md:block text-right">Plays</div>
                           <div className="col-span-3 md:col-span-1 text-right">Time</div>
                       </div>

                       {/* Table Body */}
                       <div className="divide-y divide-white/5">
                          {topSongs.map((song, index) => (
                              <div 
                                  key={song.id}
                                  onClick={() => onPlaySong(song)}
                                  className={`
                                      group grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/5 transition-colors cursor-pointer relative overflow-hidden
                                      ${currentSongId === song.id ? 'bg-white/[0.06]' : ''}
                                  `}
                              >
                                  {/* Active Indicator Bar */}
                                  {currentSongId === song.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-lime"></div>}

                                  {/* Rank */}
                                  <div className="col-span-1 font-display font-black text-xl italic text-gray-700 group-hover:text-white transition-colors relative">
                                      {index + 1}
                                      {index < 3 && <Star className="w-3 h-3 text-brand-lime absolute -top-1 -right-1 fill-current" />}
                                  </div>

                                  {/* Title & Cover */}
                                  <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/20">
                                          <img src={song.coverUrl} className={`w-full h-full object-cover transition-all ${currentSongId === song.id ? 'opacity-40' : 'group-hover:opacity-40'}`} alt={song.title} />
                                          
                                          {/* Playing Animation overlaid on small cover */}
                                          <div className={`absolute inset-0 flex items-center justify-center ${currentSongId === song.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                               {currentSongId === song.id && isPlaying ? (
                                                   <div className="flex gap-0.5 items-end h-4">
                                                       <div className="w-1 bg-brand-lime animate-[bounceVisualizer_0.4s_infinite]"></div>
                                                       <div className="w-1 bg-brand-lime animate-[bounceVisualizer_0.6s_infinite]"></div>
                                                       <div className="w-1 bg-brand-lime animate-[bounceVisualizer_0.3s_infinite]"></div>
                                                   </div>
                                               ) : <Play className="w-5 h-5 text-white fill-current" />}
                                          </div>
                                      </div>
                                      <div className="min-w-0">
                                          <div className={`font-bold text-base truncate transition-colors ${currentSongId === song.id ? 'text-brand-lime' : 'text-white'}`}>
                                              {song.title}
                                          </div>
                                          <div className="md:hidden text-xs text-gray-500 mt-0.5 truncate">{song.artist}</div>
                                      </div>
                                  </div>

                                  {/* Artist */}
                                  <div className="col-span-3 hidden md:block text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                                      {song.artist}
                                  </div>

                                  {/* Plays */}
                                  <div className="col-span-2 hidden md:block text-right">
                                      <span className="text-xs font-mono text-gray-500">{song.plays.toLocaleString()}</span>
                                  </div>

                                  {/* Duration */}
                                  <div className="col-span-3 md:col-span-1 text-right text-sm font-mono text-gray-600 group-hover:text-white">
                                      {song.duration}
                                  </div>
                              </div>
                          ))}
                       </div>
                   </div>
              </div>

              {/* RIGHT: FEATURED PROMO CARDS */}
              <div className="lg:col-span-4 flex flex-col gap-8">
                  
                  {/* Editor's Pick Card */}
                  <div className="group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/10 shadow-2xl">
                      <img src="https://picsum.photos/id/42/600/800" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Editor Pick" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-purple/90 via-transparent to-transparent opacity-80"></div>
                      
                      <div className="absolute top-6 left-6">
                          <span className="px-3 py-1 bg-white text-black text-xs font-black uppercase tracking-widest rounded shadow-lg">
                             Editor's Choice
                          </span>
                      </div>

                      <div className="absolute bottom-8 left-8 right-8">
                          <h3 className="text-4xl font-black text-white italic mb-2 leading-[0.9]">
                              Neon <br/> Nights
                          </h3>
                          <p className="text-sm text-gray-200 mb-6 line-clamp-2 opacity-80">
                             赛博城市的夜晚声音，专为深夜驾驶与编程设计的沉浸式歌单。
                          </p>
                          <button className="w-14 h-14 bg-brand-lime rounded-full flex items-center justify-center text-black hover:scale-110 transition-all shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                              <Play className="w-6 h-6 fill-current ml-1" />
                          </button>
                      </div>
                  </div>

                  {/* Trends Mini Widget */}
                  <div className="bg-[#111] rounded-[2.5rem] p-8 border border-white/10 relative overflow-hidden group">
                       <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-cyan/10 blur-[50px] rounded-full group-hover:bg-brand-cyan/20 transition-colors"></div>
                       
                       <h3 className="relative z-10 text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-brand-cyan" /> 
                          Rising Genres
                       </h3>
                       
                       <div className="space-y-4 relative z-10">
                           {[
                             { name: 'Phonk / Drift', score: '+124%' }, 
                             { name: 'Hyperpop', score: '+89%' }, 
                             { name: 'Ambient Techno', score: '+45%' }
                           ].map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5 hover:border-brand-cyan/30">
                                   <div className="flex items-center gap-4">
                                       <span className="text-xs font-black text-gray-600">0{idx + 1}</span>
                                       <span className="text-sm font-bold text-white">{item.name}</span>
                                   </div>
                                   <span className="text-xs font-bold text-brand-cyan bg-brand-cyan/10 px-2 py-1 rounded">{item.score}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      </section>

      {/* 5. ALL MUSIC LIST - EXPANDED VIEW */}
      <section className="px-4">
           <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                      <Music2 className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl font-bold text-white">全部音乐</h2>
                </div>
                
                {/* Search Bar Visual */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="Search library..." className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-lime transition-colors" />
                </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
               {songs.map((song) => (
                   <div 
                      key={song.id} 
                      onClick={() => onPlaySong(song)}
                      className={`
                         flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 hover:border-brand-lime/20 cursor-pointer transition-all group
                         ${currentSongId === song.id ? 'border-brand-lime/50 bg-white/[0.05]' : ''}
                      `}
                   >
                       <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                           <img src={song.coverUrl} className="w-full h-full object-cover" />
                           <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 ${currentSongId === song.id ? 'opacity-100' : ''}`}>
                               {currentSongId === song.id && isPlaying ? (
                                   <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse"></div>
                               ) : <Play className="w-4 h-4 fill-white text-white" />}
                           </div>
                       </div>
                       <div className="flex-1 min-w-0">
                           <h4 className={`text-sm font-bold truncate ${currentSongId === song.id ? 'text-brand-lime' : 'text-gray-200 group-hover:text-white'}`}>{song.title}</h4>
                           <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                       </div>
                   </div>
               ))}
           </div>
      </section>
      
      {/* GLOBAL CSS FOR VISUALIZER ANIMATION */}
      <style>{`
        @keyframes bounceVisualizer {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        @keyframes equalizerBounce {
          0% { height: 10%; }
          100% { height: 90%; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
            animation: gradient-x 15s ease infinite;
        }
        .mask-image-b-fade {
            mask-image: linear-gradient(to top, transparent, black 50%);
            -webkit-mask-image: linear-gradient(to top, transparent, black 50%);
        }
      `}</style>
    </div>
  );
};