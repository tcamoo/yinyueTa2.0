
import React from 'react';
import { Article, Song, DJSet, PageHeaderConfig } from '../types';
import { FileText, ArrowLeft, Play, Pause, Music, User, Calendar, Tag } from 'lucide-react';

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
      // Simple transform to allow line breaks while preserving HTML
      // We assume the user inputs HTML blocks or newlines for paragraphs
      return content.replace(/\n/g, '<br/>');
  };

  if (selectedArticle) {
      const linkedMedia = getLinkedSong(selectedArticle.linkedSongId);
      const isMediaPlaying = linkedMedia && currentSongId === linkedMedia.id && isPlaying;
      const contentFont = getFontFamily(selectedArticle.style?.fontFamily);
      const contentSize = getFontSize(selectedArticle.style?.fontSize);

      return (
          <div className="pb-40 animate-in slide-in-from-right-8 duration-500">
              {/* Back Button */}
              <button 
                onClick={() => onSelectArticle(null)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
              >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  返回专栏列表
              </button>

              {/* ARTICLE HEADER */}
              <div className="relative h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
                  <img src={selectedArticle.coverUrl} className="w-full h-full object-cover" alt="cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-8 lg:p-16">
                      <div className="flex flex-wrap items-center gap-4 mb-6">
                           <span className="px-3 py-1 rounded bg-brand-lime text-black font-black uppercase text-xs tracking-widest">
                               {selectedArticle.tags[0]}
                           </span>
                           <span className="flex items-center gap-2 text-gray-300 font-mono text-sm">
                               <Calendar className="w-4 h-4" /> {selectedArticle.date}
                           </span>
                           <span className="flex items-center gap-2 text-gray-300 font-mono text-sm">
                               <User className="w-4 h-4" /> {selectedArticle.author}
                           </span>
                      </div>
                      <h1 className="text-4xl lg:text-7xl font-display font-black text-white leading-[1.1] mb-6 drop-shadow-xl max-w-4xl">
                          {selectedArticle.title}
                      </h1>
                      
                      {linkedMedia && (
                          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-md cursor-pointer hover:bg-white/20 transition-colors" onClick={() => onPlaySong(linkedMedia as Song)}>
                               <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shrink-0">
                                   <Music className="w-6 h-6 text-brand-lime" />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Recommended Track</div>
                                   <div className="font-bold text-white truncate">{linkedMedia.title}</div>
                               </div>
                               <div
                                 className="w-10 h-10 rounded-full bg-brand-lime text-black flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_15px_#ccff00]"
                               >
                                   {isMediaPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                               </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* ARTICLE CONTENT */}
              <div className="max-w-3xl mx-auto px-4 lg:px-0">
                  <p className="text-2xl font-serif leading-relaxed text-gray-200 mb-12 border-l-4 border-brand-lime pl-6 italic">
                      {selectedArticle.excerpt}
                  </p>
                  
                  {/* 使用 dangerouslySetInnerHTML 渲染 HTML 内容 */}
                  <div 
                    className={`prose prose-invert ${contentSize} max-w-none prose-headings:font-display prose-a:text-brand-lime hover:prose-a:text-white ${contentFont} prose-img:rounded-2xl prose-img:shadow-xl prose-video:rounded-2xl prose-audio:w-full prose-p:text-gray-300 prose-p:leading-8 prose-p:font-light prose-p:tracking-wide`}
                    dangerouslySetInnerHTML={{ __html: formatContent(selectedArticle.content) }}
                  />

                  <div className="text-gray-300 leading-8 text-lg font-light tracking-wide opacity-50 text-center mt-12">
                      ***
                  </div>

                  {/* Tags */}
                  <div className="mt-16 pt-8 border-t border-white/10 flex gap-3">
                      {selectedArticle.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-gray-500 hover:text-white transition-colors cursor-pointer text-sm font-bold border border-white/10 px-3 py-1 rounded-full">
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
      <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-brand-lime" />
              <h1 className="text-5xl font-display font-black">{headerConfig.title}</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl">
              {headerConfig.description}
          </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {articles.map((article) => (
              <div 
                key={article.id} 
                onClick={() => onSelectArticle(article)}
                className="group cursor-pointer flex flex-col gap-4"
              >
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                      <img src={article.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                      
                      <div className="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10">
                          {article.tags[0]}
                      </div>

                      {/* Mood Indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: article.mood }}></div>
                  </div>

                  <div className="px-2">
                      <h2 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-brand-lime transition-colors">
                          {article.title}
                      </h2>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
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
