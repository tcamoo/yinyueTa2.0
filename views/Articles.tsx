import React, { useRef, useState, useEffect } from 'react';
import { Article, Song, DJSet, PageHeaderConfig } from '../types';
import { FileText, ArrowLeft, Play, Pause, Music, User, Calendar, Tag, Disc, Volume2 } from 'lucide-react';

interface ArticlesViewProps {
  articles: Article[];
  selectedArticle: Article | null;
  onSelectArticle: (article: Article | null) => void;
  djSets: DJSet[];
  songs: Song[];
  onPlaySong: (song: Song) => void;
  currentSongId?: string;
  isPlaying?: boolean;
  headerConfig: PageHeaderConfig;
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({ 
  articles, 
  selectedArticle, 
  onSelectArticle,
  djSets, 
  songs, 
  onPlaySong, 
  currentSongId, 
  isPlaying,
  headerConfig
}) => {

  // Helper to find the linked song object
  const getLinkedSong = (id?: string) => {
      if(!id) return null;
      return songs.find(s => s.id === id) || djSets.find(d => d.id === id);
  };

  const getFontFamily = (font?: string) => {
      switch (font) {
          case 'serif': return 'font-serif';
          case 'mono': return 'font-mono';
          case 'art': return 'font-art';
          default: return 'font-sans';
      }
  };

  const getFontSize = (size?: string) => {
      switch (size) {
          case 'sm': return 'prose-sm';
          case 'lg': return 'prose-xl';
          case 'xl': return 'prose-2xl';
          default: return 'prose-lg';
      }
  };

  const formatContent = (content: string) => {
      return content.replace(/\n/g, '<br/>');
  };

  if (selectedArticle) {
      const linkedMedia = getLinkedSong(selectedArticle.linkedSongId);
      const isMediaPlaying = linkedMedia && currentSongId === linkedMedia.id && isPlaying;
      const contentFont = getFontFamily(selectedArticle.style?.fontFamily);
      const contentSize = getFontSize(selectedArticle.style?.fontSize);

      const artistName = linkedMedia ? ('artist' in linkedMedia ? linkedMedia.artist : linkedMedia.djName) : '';

      const handlePlayLinkedMedia = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!linkedMedia) return;
          if ('djName' in linkedMedia) {
               // Adapt DJSet to Song
               const adaptedSong: Song = {
                  id: linkedMedia.id,
                  title: linkedMedia.title,
                  artist: linkedMedia.djName,
                  coverUrl: linkedMedia.coverUrl,
                  duration: linkedMedia.duration,
                  fileUrl: linkedMedia.fileUrl,
                  plays: linkedMedia.plays,
                  neteaseId: linkedMedia.neteaseId
              };
              onPlaySong(adaptedSong);
          } else {
              onPlaySong(linkedMedia);
          }
      };

      return (
          <div className="pb-40 animate-in slide-in-from-right-8 duration-500 bg-dark-950">
              {/* Back Button */}
              <button 
                onClick={() => onSelectArticle(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group px-4 lg:px-0"
              >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  返回专栏列表
              </button>

              {/* ARTICLE HERO HEADER */}
              <div className="relative h-[500px] lg:h-[600px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl mx-4 lg:mx-0 group">
                  <img src={selectedArticle.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt="cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-8 lg:p-16 flex flex-col justify-end h-full pointer-events-none">
                      <div className="relative z-10 pointer-events-auto">
                          <div className="flex flex-wrap items-center gap-4 mb-6">
                              <span className="px-3 py-1 rounded bg-brand-lime text-black font-black uppercase text-xs tracking-widest shadow-[0_0_15px_rgba(204,255,0,0.4)]">
                                  {selectedArticle.tags[0]}
                              </span>
                              <span className="flex items-center gap-2 text-gray-300 font-mono text-sm backdrop-blur-md bg-black/20 px-3 py-1 rounded-full border border-white/10">
                                  <Calendar className="w-3 h-3" /> {selectedArticle.date}
                              </span>
                              <span className="flex items-center gap-2 text-gray-300 font-mono text-sm backdrop-blur-md bg-black/20 px-3 py-1 rounded-full border border-white/10">
                                  <User className="w-3 h-3" /> {selectedArticle.author}
                              </span>
                          </div>
                          <h1 className="text-4xl lg:text-7xl font-display font-black text-white leading-[1.1] drop-shadow-2xl max-w-4xl tracking-tight mb-8">
                              {selectedArticle.title}
                          </h1>
                      </div>
                  </div>

                  {/* EMBEDDED PLAYER CARD (MOVED TO LEFT SIDE) */}
                  {linkedMedia && (
                      <div className="absolute bottom-6 left-6 lg:left-16 z-20 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                          <div 
                              onClick={handlePlayLinkedMedia}
                              className="w-auto max-w-[280px] bg-black/60 backdrop-blur-2xl border border-white/10 p-3 pr-5 rounded-full flex items-center gap-3 cursor-pointer hover:bg-black/80 hover:border-brand-lime/50 transition-all group/card shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                          >
                              {/* Circular Art with Spin */}
                              <div className="relative w-10 h-10 shrink-0">
                                  <img 
                                      src={linkedMedia.coverUrl} 
                                      className={`w-full h-full rounded-full object-cover border border-white/20 shadow-sm ${isMediaPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} 
                                  />
                                  {/* Center dot for vinyl look */}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                  </div>
                              </div>
                              
                              {/* Info Text */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  <span className="text-[10px] font-bold text-brand-lime uppercase tracking-wider leading-none mb-0.5">
                                      {isMediaPlaying ? 'Now Playing' : 'Recommended'}
                                  </span>
                                  <h4 className="text-white text-sm font-bold truncate max-w-[140px] leading-tight group-hover/card:text-brand-lime transition-colors">
                                      {linkedMedia.title}
                                  </h4>
                              </div>

                              {/* Play Button Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isMediaPlaying ? 'bg-brand-lime text-black' : 'bg-white/10 text-white group-hover/card:bg-white group-hover/card:text-black'}`}>
                                  {isMediaPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* ARTICLE CONTENT */}
              <div className="max-w-3xl mx-auto px-4 lg:px-0 relative z-10">
                  <p className="text-xl md:text-2xl font-serif leading-relaxed text-gray-200 mb-12 border-l-4 border-brand-lime pl-6 italic opacity-90">
                      {selectedArticle.excerpt}
                  </p>
                  
                  <div 
                    className={`prose prose-invert ${contentSize} max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-white prose-a:text-brand-lime hover:prose-a:text-white ${contentFont} prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-white/10 prose-video:rounded-3xl prose-p:text-gray-300 prose-p:leading-8 prose-p:font-light prose-p:tracking-wide [&_.not-prose]:my-16 [&_.not-prose]:mx-auto`}
                    dangerouslySetInnerHTML={{ __html: formatContent(selectedArticle.content) }}
                  />

                  <div className="text-gray-500 font-mono text-center mt-16 tracking-[0.5em] opacity-50">
                      ***
                  </div>

                  {/* Tags */}
                  <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap gap-3">
                      {selectedArticle.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs font-bold border border-white/10 hover:border-white/30 bg-white/5 px-4 py-2 rounded-full uppercase tracking-wider">
                              <Tag className="w-3 h-3" /> {tag}
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // LIST VIEW
  return (
    <div className="pb-40 animate-in fade-in duration-700">
      <header className="mb-12 px-4 lg:px-0">
          <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-brand-lime" />
              <h1 className="text-5xl font-display font-black">{headerConfig.title}</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl">
              {headerConfig.description}
          </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-4 lg:px-0">
          {articles.map((article) => (
              <div 
                key={article.id} 
                onClick={() => onSelectArticle(article)}
                className="group cursor-pointer flex flex-col gap-4"
              >
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-[#111]">
                      <img src={article.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] filter brightness-90 group-hover:brightness-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                      
                      <div className="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 shadow-lg">
                          {article.tags[0]}
                      </div>

                      {/* Mood Indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-1.5" style={{ backgroundColor: article.mood }}></div>
                  </div>

                  <div className="px-2">
                      <h2 className="text-2xl font-black text-white mb-3 leading-tight group-hover:text-brand-lime transition-colors">
                          {article.title}
                      </h2>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed font-light">
                          {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                          <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-xs font-bold text-gray-400">{article.author}</span>
                          </div>
                          <span className="text-xs font-mono text-gray-600">{article.date}</span>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
