
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Music, Trash2, Settings2, Palette, Edit3, Film, Image as ImageIcon, X, Database, FileText, Disc, CloudUpload, Tag, Type as FontIcon, Maximize2, Link, Plus, CheckCircle } from 'lucide-react';
import { Song, Theme, MV, GalleryItem, DJSet, Article, PageHeaders, View } from '../types';
import { THEMES, MOODS } from '../constants';

interface LibraryProps {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  mvs: MV[];
  setMvs: React.Dispatch<React.SetStateAction<MV[]>>;
  galleryItems: GalleryItem[];
  setGalleryItems: React.Dispatch<React.SetStateAction<GalleryItem[]>>;
  djSets?: DJSet[];
  setDjSets?: React.Dispatch<React.SetStateAction<DJSet[]>>;
  articles?: Article[];
  setArticles?: React.Dispatch<React.SetStateAction<Article[]>>;
  onPlaySong: (song: Song) => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  pageHeaders: PageHeaders;
  setPageHeaders: React.Dispatch<React.SetStateAction<PageHeaders>>;
}

export const Library: React.FC<LibraryProps> = ({ 
    songs, setSongs, 
    mvs, setMvs,
    galleryItems, setGalleryItems,
    djSets = [], setDjSets = (_: React.SetStateAction<DJSet[]>) => {},
    articles = [], setArticles = (_: React.SetStateAction<Article[]>) => {},
    onPlaySong, 
    currentTheme, setTheme,
    pageHeaders, setPageHeaders
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'articles' | 'appearance' | 'pages'>('media');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'image' | 'dj'>('audio');
  
  // Upload/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'media' | 'article'>('media');

  // Form Fields
  const [formData, setFormData] = useState({
      title: '',
      artist: '', 
      url: '', 
      cover: '',
      desc: '',
      tag: '',
      duration: '',
      bpm: '128',
      content: '', // For Articles
      lyrics: '', // For Songs
      mood: MOODS[0].color, // For Articles
      linkedSongId: '', // For Articles
      fontFamily: 'sans' as 'sans'|'serif'|'mono'|'art',
      fontSize: 'base' as 'sm'|'base'|'lg'|'xl',
      neteaseId: ''
  });

  // Page Header Editing
  const [selectedPage, setSelectedPage] = useState<View>(View.HOME);
  const [headerFormData, setHeaderFormData] = useState({
      title: '',
      subtitle: '',
      description: '',
      featuredItemId: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when selectedPage changes
  useEffect(() => {
     if (pageHeaders[selectedPage]) {
         setHeaderFormData({
             title: pageHeaders[selectedPage].title,
             subtitle: pageHeaders[selectedPage].subtitle,
             description: pageHeaders[selectedPage].description,
             featuredItemId: pageHeaders[selectedPage].featuredItemId || ''
         });
     }
  }, [selectedPage, pageHeaders]);

  const resetForm = () => {
      setFormData({ 
          title: '', artist: '', url: '', cover: '', desc: '', tag: '', duration: '', bpm: '128', 
          content: '', lyrics: '', mood: MOODS[0].color, linkedSongId: '',
          fontFamily: 'sans', fontSize: 'base', neteaseId: ''
      });
      setEditMode(false);
      setEditingId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              if (mediaType === 'image') {
                  setFormData(prev => ({ ...prev, url: result, cover: result }));
              } else {
                  setFormData(prev => ({ ...prev, cover: result }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleOpenCreateMedia = () => {
      setEditingType('media');
      resetForm();
      setIsModalOpen(true);
  };

  const handleOpenCreateArticle = () => {
      setEditingType('article');
      resetForm();
      setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, type: 'audio' | 'video' | 'image' | 'dj' | 'article') => {
      setEditMode(true);
      setEditingId(item.id);
      
      if (type === 'article') {
          setEditingType('article');
          setFormData({
              title: item.title,
              artist: item.author,
              url: '', 
              cover: item.coverUrl,
              desc: item.excerpt,
              tag: item.tags[0] || '',
              duration: '',
              bpm: '',
              content: item.content,
              lyrics: '',
              mood: item.mood,
              linkedSongId: item.linkedSongId || '',
              fontFamily: item.style?.fontFamily || 'sans',
              fontSize: item.style?.fontSize || 'base',
              neteaseId: ''
          });
      } else {
          setEditingType('media');
          if (type === 'image') {
              setFormData({
                  title: item.title,
                  artist: item.photographer,
                  url: item.imageUrl,
                  cover: item.imageUrl, 
                  desc: '',
                  tag: 'Photography',
                  duration: '',
                  bpm: '',
                  content: '', lyrics: '', mood: '', linkedSongId: '',
                  fontFamily: 'sans', fontSize: 'base',
                  neteaseId: ''
              });
          } else {
              setFormData({
                  title: item.title,
                  artist: type === 'dj' ? item.djName : item.artist,
                  url: type === 'video' ? item.videoUrl : item.fileUrl,
                  cover: item.coverUrl,
                  desc: item.description || '',
                  tag: item.tags?.[0] || '',
                  duration: item.duration,
                  bpm: item.bpm?.toString() || '',
                  content: '', lyrics: item.lyrics || '', mood: '', linkedSongId: '',
                  fontFamily: 'sans', fontSize: 'base',
                  neteaseId: item.neteaseId || ''
              });
          }
      }
      setIsModalOpen(true);
  };

  const handleSave = async () => {
      let finalUrl = formData.url;
      // NetEase Hack
      if (formData.neteaseId && mediaType === 'audio') {
          finalUrl = `https://music.163.com/song/media/outer/url?id=${formData.neteaseId}.mp3`;
      }

      // Generate ID
      const newId = editMode && editingId ? editingId : Date.now().toString();

      if (editingType === 'article') {
          const newArticle: Article = {
              id: newId,
              title: formData.title,
              author: formData.artist, 
              excerpt: formData.desc,
              content: formData.content,
              coverUrl: formData.cover || `https://picsum.photos/seed/${newId}/800/600`,
              date: new Date().toISOString().split('T')[0],
              mood: formData.mood,
              tags: [formData.tag || 'General'],
              linkedSongId: formData.linkedSongId,
              style: {
                  fontFamily: formData.fontFamily,
                  fontSize: formData.fontSize,
                  lineHeight: 'normal'
              }
          };
          if (editMode) {
              setArticles(prev => prev.map(a => a.id === editingId ? { ...a, ...newArticle } : a));
          } else {
              setArticles(prev => [newArticle, ...prev]);
          }
      } 
      else {
          const common = {
              id: newId,
              title: formData.title || 'Untitled',
              coverUrl: formData.cover || `https://picsum.photos/seed/${newId}/400/400`,
          };

          if (mediaType === 'audio') {
              const newSong: Song = {
                  ...common,
                  artist: formData.artist || 'Unknown',
                  duration: formData.duration || '3:00',
                  plays: 0,
                  fileUrl: finalUrl,
                  description: formData.desc,
                  neteaseId: formData.neteaseId,
                  lyrics: formData.lyrics
              };
              editMode ? setSongs(p => p.map(x => x.id === editingId ? newSong : x)) : setSongs(p => [newSong, ...p]);
          } 
          else if (mediaType === 'video') {
              const newMV: MV = {
                  ...common,
                  artist: formData.artist || 'Unknown',
                  videoUrl: finalUrl,
                  duration: formData.duration || '04:00',
                  views: 0,
                  tags: ['New', formData.tag],
                  category: formData.tag || 'Upload'
              };
               editMode ? setMvs(p => p.map(x => x.id === editingId ? newMV : x)) : setMvs(p => [newMV, ...p]);
          }
          else if (mediaType === 'dj') {
            const newDJ: DJSet = {
                  ...common,
                  djName: formData.artist || 'Unknown',
                  fileUrl: finalUrl,
                  duration: formData.duration || '60:00',
                  bpm: parseInt(formData.bpm) || 128,
                  tags: [formData.tag || 'Mix'],
                  plays: 0,
                  neteaseId: formData.neteaseId
              };
               editMode ? setDjSets(p => p.map(x => x.id === editingId ? newDJ : x)) : setDjSets(p => [newDJ, ...p]);
          }
          else if (mediaType === 'image') {
              const newGalleryItem: GalleryItem = {
                  id: newId,
                  title: formData.title || 'Untitled',
                  photographer: formData.artist || 'Unknown',
                  imageUrl: formData.cover || formData.url || `https://picsum.photos/seed/${newId}/800/600`, // Support URL input
                  spanClass: 'col-span-1 row-span-1'
              };
              editMode ? setGalleryItems(p => p.map(x => x.id === editingId ? newGalleryItem : x)) : setGalleryItems(p => [newGalleryItem, ...p]);
          }
      }

      setIsModalOpen(false);
      resetForm();
  };

  const handleSavePageHeader = () => {
      setPageHeaders(prev => ({ ...prev, [selectedPage]: { ...headerFormData } }));
      alert("页面装修已保存！");
  };

  const handleDelete = (id: string, type: string) => {
      if (window.confirm('确定要从库中永久删除此项目吗？')) {
        if (type === 'article') setArticles(prev => prev.filter(a => a.id !== id));
        else if (mediaType === 'audio') setSongs(prev => prev.filter(s => s.id !== id));
        else if (mediaType === 'video') setMvs(prev => prev.filter(m => m.id !== id));
        else if (mediaType === 'image') setGalleryItems(prev => prev.filter(g => g.id !== id));
        else if (mediaType === 'dj') setDjSets(prev => prev.filter(d => d.id !== id));
      }
  };

  return (
    <div className="pb-40 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-lime/10 border border-brand-lime/30 rounded-full mb-4">
             <Settings2 className="w-3 h-3 text-brand-lime" />
             <span className="text-xs text-brand-lime font-bold tracking-wider">CMS V3.8 PRO</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-display font-bold mb-4">
            创作 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-brand-cyan">控制台</span>
          </h1>
        </div>
      </header>

      {/* Main Tabs */}
      <div className="flex items-center gap-8 border-b border-white/10 mb-8 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('media')}
          className={`pb-4 text-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'media' ? 'text-white border-b-2 border-brand-lime' : 'text-gray-500 hover:text-white'}`}
        >
          <Database className="w-5 h-5" /> 资源库
        </button>
        <button 
          onClick={() => setActiveTab('articles')}
          className={`pb-4 text-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'articles' ? 'text-white border-b-2 border-brand-lime' : 'text-gray-500 hover:text-white'}`}
        >
          <FileText className="w-5 h-5" /> 文章
        </button>
        <button 
          onClick={() => setActiveTab('pages')}
          className={`pb-4 text-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'pages' ? 'text-white border-b-2 border-brand-lime' : 'text-gray-500 hover:text-white'}`}
        >
          <Palette className="w-5 h-5" /> 装修
        </button>
        <button 
          onClick={() => setActiveTab('appearance')}
          className={`pb-4 text-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'appearance' ? 'text-white border-b-2 border-brand-lime' : 'text-gray-500 hover:text-white'}`}
        >
          <Settings2 className="w-5 h-5" /> 主题
        </button>
      </div>

      {/* TAB: MEDIA LIBRARY */}
      {activeTab === 'media' && (
        <div className="animate-in fade-in duration-500">
           {/* Controls Bar */}
           <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setMediaType('audio')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${mediaType === 'audio' ? 'bg-brand-lime text-black shadow-lg shadow-brand-lime/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Music className="w-4 h-4" /> 音频
                    </button>
                    <button onClick={() => setMediaType('dj')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${mediaType === 'dj' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Disc className="w-4 h-4" /> DJ Sets
                    </button>
                    <button onClick={() => setMediaType('video')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${mediaType === 'video' ? 'bg-brand-pink text-white shadow-lg shadow-brand-pink/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <Film className="w-4 h-4" /> 视频
                    </button>
                    <button onClick={() => setMediaType('image')} className={`px-4 lg:px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${mediaType === 'image' ? 'bg-brand-cyan text-black shadow-lg shadow-brand-cyan/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                        <ImageIcon className="w-4 h-4" /> 画廊
                    </button>
                </div>

                <button 
                    onClick={handleOpenCreateMedia}
                    className="px-6 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
                >
                    <CloudUpload className="w-4 h-4" /> 上传{mediaType === 'image' ? '图片' : '资源'}
                </button>
           </div>
           
           {/* CMS Data Grid */}
           <div className="space-y-1">
               <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-5 md:col-span-4">名称 / 信息</div>
                <div className="col-span-3 md:col-span-3 hidden md:block">元数据</div>
                <div className="col-span-2 hidden md:block">状态</div>
                <div className="col-span-3 md:col-span-3 text-right">操作</div>
               </div>

                {mediaType === 'image' && galleryItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-cyan/20 items-center group transition-all">
                        <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-black/50">
                                <img src={item.imageUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{item.photographer}</p>
                            </div>
                        </div>
                        <div className="col-span-3 hidden md:flex flex-col justify-center text-xs text-gray-400">
                             <span className="flex items-center gap-1 mt-1"><Maximize2 className="w-3 h-3" /> {item.spanClass.replace('col-span-', 'W:').replace('row-span-', ' H:')}</span>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-brand-cyan text-[10px]">IMG</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(item, 'image')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(item.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                
                {/* Fallback for other media types (Using Song List as visual template for now) */}
                {mediaType === 'audio' && songs.map((song) => (
                    <div key={song.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-lime/20 items-center group transition-all">
                        <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-white/10" onClick={() => onPlaySong(song)}>
                                <img src={song.coverUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{song.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                            </div>
                        </div>
                        <div className="col-span-3 hidden md:flex flex-col justify-center text-xs text-gray-400">
                             <span className="flex items-center gap-1 mt-1"><Tag className="w-3 h-3" /> {song.duration}</span>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-green-500 text-[10px]">READY</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(song, 'audio')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(song.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}

                {mediaType === 'video' && mvs.map((mv) => (
                    <div key={mv.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-pink/20 items-center group transition-all">
                         <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img src={mv.coverUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{mv.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{mv.artist}</p>
                            </div>
                        </div>
                        <div className="col-span-3 hidden md:flex flex-col justify-center text-xs text-gray-400">
                             <span className="flex items-center gap-1 mt-1"><Film className="w-3 h-3" /> {mv.category}</span>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-blue-500 text-[10px]">HD</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(mv, 'video')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(mv.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}

                {mediaType === 'dj' && djSets.map((dj) => (
                    <div key={dj.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-accent/20 items-center group transition-all">
                        <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img src={dj.coverUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{dj.title}</h4>
                                <p className="text-xs text-gray-500 truncate">{dj.djName}</p>
                            </div>
                        </div>
                        <div className="col-span-3 hidden md:flex flex-col justify-center text-xs text-gray-400">
                             <span className="flex items-center gap-1 mt-1">{dj.bpm} BPM</span>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-purple-500 text-[10px]">MIX</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(dj, 'dj')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(dj.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
           </div>
        </div>
      )}

      {/* TAB: ARTICLES */}
      {activeTab === 'articles' && (
          <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-white">文章列表 ({articles.length})</h3>
                   <button 
                        onClick={handleOpenCreateArticle}
                        className="px-6 py-2.5 bg-brand-lime text-black rounded-xl font-bold hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> 发布文章
                    </button>
              </div>
              <div className="space-y-4">
                  {articles.map((article) => (
                      <div key={article.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-6 group hover:border-brand-lime/30 transition-all">
                           <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                               <img src={article.coverUrl} className="w-full h-full object-cover" />
                               <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: article.mood }}></div>
                           </div>
                           <div className="flex-1 min-w-0">
                               <h4 className="text-lg font-bold text-white truncate mb-1">{article.title}</h4>
                               <p className="text-xs text-gray-400 line-clamp-1 mb-2">{article.excerpt}</p>
                           </div>
                           <div className="flex gap-2">
                                <button onClick={() => handleOpenEdit(article, 'article')} className="p-3 bg-white/5 rounded-xl hover:bg-white hover:text-black transition-colors"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(article.id, 'article')} className="p-3 bg-white/5 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                           </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* TAB: APPEARANCE */}
      {activeTab === 'appearance' && (
          <div className="animate-in fade-in">
               <div className="mb-8">
                   <h3 className="text-2xl font-bold text-white mb-6">主题预设</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                       {THEMES.map(theme => (
                           <button 
                                key={theme.id}
                                onClick={() => setTheme(theme)}
                                className={`relative p-4 rounded-2xl border transition-all text-left group ${currentTheme.id === theme.id ? 'border-brand-lime bg-white/5 ring-1 ring-brand-lime' : 'border-white/10 bg-black hover:border-white/30'}`}
                           >
                               <div className="h-24 rounded-xl mb-4 overflow-hidden relative shadow-lg">
                                   <div className="absolute inset-0 flex">
                                       <div className="flex-1" style={{ backgroundColor: theme.colors.bgDeep }}></div>
                                       <div className="w-4" style={{ backgroundColor: theme.colors.primary }}></div>
                                       <div className="w-4" style={{ backgroundColor: theme.colors.secondary }}></div>
                                   </div>
                               </div>
                               <h4 className="font-bold text-sm text-white">{theme.name}</h4>
                               {currentTheme.id === theme.id && <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-brand-lime bg-black rounded-full" />}
                           </button>
                       ))}
                   </div>
               </div>
          </div>
      )}

      {/* TAB: PAGES */}
      {activeTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in">
              <div className="space-y-6">
                   <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">选择要编辑的页面</label>
                        <div className="flex gap-2">
                             {[View.HOME, View.CHARTS, View.DJ, View.MV].map(v => (
                                 <button key={v} onClick={() => setSelectedPage(v)} className={`px-4 py-2 rounded-lg text-sm font-bold border ${selectedPage === v ? 'bg-brand-lime text-black border-brand-lime' : 'border-white/10 hover:bg-white/5'}`}>{v}</button>
                             ))}
                        </div>
                   </div>
                   <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">主标题 (Big Title)</label>
                        <input type="text" value={headerFormData.title} onChange={e => setHeaderFormData({...headerFormData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-2xl font-black text-white focus:border-brand-lime outline-none" />
                   </div>
                   <button onClick={handleSavePageHeader} className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)]">保存页面设置</button>
              </div>
          </div>
      )}

      {/* UNIVERSAL EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-[#1a1a1a] w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {editMode ? '编辑内容' : '新建内容'} 
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400 font-normal uppercase">{editingType === 'media' ? mediaType : editingType}</span>
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                        {/* LEFT COLUMN: EDITOR */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">标题</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">{editingType === 'article' ? '作者' : (mediaType === 'image' ? '摄影师' : '艺术家')}</label>
                                    <input type="text" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" />
                                </div>
                            </div>

                            {/* Image Upload Area with Explicit URL Support */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-brand-lime mb-1 flex items-center gap-2">
                                        <Link className="w-3 h-3" /> 
                                        {mediaType === 'image' ? '图片链接 (URL) - 支持第三方链接' : '封面链接'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={mediaType === 'image' ? (formData.url || formData.cover) : formData.cover} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    cover: val,
                                                    url: mediaType === 'image' ? val : prev.url 
                                                }));
                                            }} 
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none text-xs font-mono" 
                                            placeholder="https://example.com/image.jpg" 
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 bg-white/10 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-1 min-w-max"
                                            title="本地上传"
                                        >
                                            <Upload className="w-4 h-4" /> <span className="text-xs">本地</span>
                                        </button>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">* 推荐使用 Unsplash 或图床外链以获得最佳性能。</p>
                                </div>
                            </div>

                            {/* ARTICLE SPECIFIC FIELDS */}
                            {editingType === 'article' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">正文内容 (支持分段)</label>
                                        <textarea 
                                            value={formData.content} 
                                            onChange={e => setFormData({...formData, content: e.target.value})} 
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none h-48 resize-none leading-relaxed" 
                                            placeholder="在此输入文章正文..." 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-1">氛围色彩</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {MOODS.map(m => (
                                                    <button 
                                                        key={m.label} 
                                                        onClick={() => setFormData({...formData, mood: m.color})}
                                                        className={`w-8 h-8 rounded-full border-2 ${formData.mood === m.color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                                        style={{ backgroundColor: m.color }}
                                                        title={m.label}
                                                    />
                                                ))}
                                            </div>
                                         </div>
                                         <div className="space-y-2">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><FontIcon className="w-3 h-3" /> 字体风格</label>
                                                <select 
                                                    value={formData.fontFamily} 
                                                    onChange={e => setFormData({...formData, fontFamily: e.target.value as any})}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-white text-xs outline-none"
                                                >
                                                    <option value="sans">Sans-Serif (Default)</option>
                                                    <option value="serif">Serif (Classic)</option>
                                                    <option value="mono">Monospace (Tech)</option>
                                                    <option value="art">Artistic (Zcool)</option>
                                                </select>
                                            </div>
                                         </div>
                                    </div>
                                </>
                            )}

                            {/* MEDIA Specifics (Not needed for pure Image type) */}
                            {editingType === 'media' && mediaType !== 'image' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">资源链接 (URL)</label>
                                        <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" placeholder="https://..." />
                                    </div>
                                    
                                    {(mediaType === 'audio' || mediaType === 'dj') && (
                                        <>
                                            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                                                <label className="block text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                                                    <Music className="w-3 h-3" /> 网易云音乐 ID (优先)
                                                </label>
                                                <div className="relative">
                                                    <input type="text" value={formData.neteaseId} onChange={e => setFormData({...formData, neteaseId: e.target.value})} className="w-full bg-black border border-red-500/30 rounded-lg p-3 text-white focus:border-red-500 outline-none pl-10" placeholder="例如: 186016" />
                                                    <span className="absolute left-3 top-3.5 text-red-500 font-bold text-xs">N</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1 flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> 歌词 (LRC 或 纯文本)
                                                </label>
                                                <textarea 
                                                    value={formData.lyrics} 
                                                    onChange={e => setFormData({...formData, lyrics: e.target.value})} 
                                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none h-32 text-xs font-mono" 
                                                    placeholder="[00:12.34] 歌词内容..." 
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                            
                            {/* Tags/Desc */}
                             <div>
                                 <label className="block text-xs font-bold text-gray-400 mb-1">标签 / 分类</label>
                                 <input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">{editingType === 'article' ? '摘要' : '描述'}</label>
                                <input type="text" value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PREVIEW */}
                        <div className="hidden lg:block bg-black/40 rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col">
                             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Live Preview</h3>
                             
                             <div className="flex-1 flex items-center justify-center">
                                  <div className="w-full max-w-xs bg-white/5 rounded-2xl p-4 border border-white/10">
                                       <div className="aspect-square rounded-xl overflow-hidden mb-4 relative bg-black">
                                            {formData.cover ? (
                                                <img src={formData.cover} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=Error')} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                                            )}
                                            {editingType === 'article' && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold text-black" style={{ backgroundColor: formData.mood }}>Mood</div>
                                            )}
                                       </div>
                                       <div className="text-center">
                                           <h4 className={`font-bold text-white mb-1 ${editingType === 'article' && formData.fontFamily === 'serif' ? 'font-serif' : ''}`}>{formData.title || 'Title'}</h4>
                                           <p className="text-xs text-gray-400">{formData.artist || 'Artist/Author'}</p>
                                       </div>
                                  </div>
                             </div>

                            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                <button onClick={handleSave} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-brand-lime transition-colors">
                                    保存并发布
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
