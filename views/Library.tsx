

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Music, Trash2, Settings2, Palette, Edit3, Film, Image as ImageIcon, X, Database, FileText, Disc, UploadCloud, Tag, Type as FontIcon, Maximize2, Link, Plus, CheckCircle, Save, Loader2, CloudLightning, AlertTriangle, Wifi, WifiOff, Key, ShieldCheck } from 'lucide-react';
import { Song, Theme, MV, GalleryItem, DJSet, Article, PageHeaders, View, Playlist } from '../types';
import { THEMES, MOODS } from '../constants';
import { cloudService } from '../services/cloudService';
import { NotificationType } from '../components/Notification';

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
  playlists: Playlist[];
  onPlaySong: (song: Song) => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  pageHeaders: PageHeaders;
  setPageHeaders: React.Dispatch<React.SetStateAction<PageHeaders>>;
  notify: (type: NotificationType, message: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ 
    songs, setSongs, 
    mvs, setMvs,
    galleryItems, setGalleryItems,
    djSets = [], setDjSets = (_: React.SetStateAction<DJSet[]>) => {},
    articles = [], setArticles = (_: React.SetStateAction<Article[]>) => {},
    playlists,
    onPlaySong, 
    currentTheme, setTheme,
    pageHeaders, setPageHeaders,
    notify
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'articles' | 'appearance' | 'pages'>('media');
  const [mediaType, setMediaType] = useState<'audio' | 'video' | 'image' | 'dj'>('audio');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Editing State
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'media' | 'article'>('media');
  
  // Cloud State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'missing_config' | 'auth_error' | 'offline'>('connected');
  
  // Admin Key State
  const [adminKey, setAdminKey] = useState('');

  // Check Connection on Mount
  useEffect(() => {
     setAdminKey(cloudService.getAdminKey());
     
     const check = async () => {
         // Try to load. If it returns null, we don't strictly know if it's missing config or just empty.
         // However, the worker now returns a specific warning if KV is missing.
         const data = await cloudService.loadData();
         if (data === null) {
            // Check if it was because of network or empty
            // For now, let's assume if load works (even empty), we are connected to Worker.
            // The real check happens on save.
         }
     };
     check();
  }, []);

  const handleSaveAdminKey = () => {
      cloudService.setAdminKey(adminKey);
      notify('success', 'Admin Key 已保存至本地');
      setIsSettingsOpen(false);
      // Try a sync to verify
      syncToCloud();
  };

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
      content: '', 
      lyrics: '', 
      mood: MOODS[0].color, 
      linkedSongId: '',
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
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  // --- CLOUD SYNC FUNCTION ---
  const syncToCloud = async (overrideData?: any) => {
      setIsSyncing(true);
      const dataToSave = {
          songs, mvs, galleryItems, djSets, articles, playlists, pageHeaders, 
          themeId: currentTheme.id,
          ...overrideData // Merge latest changes immediately
      };
      
      try {
          const success = await cloudService.saveData(dataToSave);
          if (success) {
              setConnectionStatus('connected');
          }
      } catch (e: any) {
          if (e.message.includes('Unauthorized')) {
              setConnectionStatus('auth_error');
              notify('error', '权限错误：请检查 Admin Key');
              setIsSettingsOpen(true);
          } else if (e.message.includes('KV')) {
              setConnectionStatus('missing_config');
              notify('error', '配置错误：后台未绑定 KV');
          } else {
              setConnectionStatus('offline');
              notify('error', `同步失败: ${e.message}`);
          }
      }
      
      setTimeout(() => setIsSyncing(false), 800);
  };

  const handleManualSync = async () => {
      await syncToCloud();
      if(connectionStatus === 'connected') notify('success', '所有数据已同步至云端');
  };

  // --- FILE UPLOAD HANDLER ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'cover') => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          const uploadedUrl = await cloudService.uploadFile(file);
          setIsUploading(false);

          if (uploadedUrl) {
              setFormData(prev => ({ ...prev, [field]: uploadedUrl }));
              notify('success', '文件上传成功 (R2)');
          } 
          // Error handling is done inside service (alert) or via try/catch in service
      }
  };

  const resetForm = () => {
      setFormData({ 
          title: '', artist: '', url: '', cover: '', desc: '', tag: '', duration: '', bpm: '128', 
          content: '', lyrics: '', mood: MOODS[0].color, linkedSongId: '',
          fontFamily: 'sans', fontSize: 'base', neteaseId: ''
      });
      setEditMode(false);
      setEditingId(null);
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
      if (formData.neteaseId && mediaType === 'audio') {
          finalUrl = `https://music.163.com/song/media/outer/url?id=${formData.neteaseId}.mp3`;
      }

      const newId = editMode && editingId ? editingId : Date.now().toString();
      let updatedData = {}; 

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
          
          let nextArticles;
          if (editMode) {
            nextArticles = articles.map(a => a.id === editingId ? { ...a, ...newArticle } : a);
          } else {
            nextArticles = [newArticle, ...articles];
          }
          setArticles(nextArticles);
          updatedData = { articles: nextArticles };
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
              let nextSongs;
              if (editMode) {
                  nextSongs = songs.map(x => x.id === editingId ? newSong : x);
              } else {
                  nextSongs = [newSong, ...songs];
              }
              setSongs(nextSongs);
              updatedData = { songs: nextSongs };
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
              let nextMvs;
              if(editMode) {
                  nextMvs = mvs.map(x => x.id === editingId ? newMV : x);
              } else {
                  nextMvs = [newMV, ...mvs];
              }
              setMvs(nextMvs);
              updatedData = { mvs: nextMvs };
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
               let nextDjs;
               if(editMode) {
                   nextDjs = djSets.map(x => x.id === editingId ? newDJ : x);
               } else {
                   nextDjs = [newDJ, ...djSets];
               }
               setDjSets(nextDjs);
               updatedData = { djSets: nextDjs };
          }
          else if (mediaType === 'image') {
              const newGalleryItem: GalleryItem = {
                  id: newId,
                  title: formData.title || 'Untitled',
                  photographer: formData.artist || 'Unknown',
                  imageUrl: formData.cover || formData.url || `https://picsum.photos/seed/${newId}/800/600`,
                  spanClass: 'col-span-1 row-span-1'
              };
              let nextGallery;
              if(editMode) {
                  nextGallery = galleryItems.map(x => x.id === editingId ? newGalleryItem : x);
              } else {
                  nextGallery = [newGalleryItem, ...galleryItems];
              }
              setGalleryItems(nextGallery);
              updatedData = { galleryItems: nextGallery };
          }
      }

      setIsModalOpen(false);
      resetForm();
      notify('success', editMode ? '内容已更新' : '新建成功');
      
      syncToCloud(updatedData);
  };

  const handleSavePageHeader = () => {
      const nextHeaders = { ...pageHeaders, [selectedPage]: { ...headerFormData } };
      setPageHeaders(nextHeaders);
      notify('success', '页面配置已保存');
      syncToCloud({ pageHeaders: nextHeaders });
  };
  
  const handleThemeChange = (theme: Theme) => {
      setTheme(theme);
      syncToCloud({ themeId: theme.id });
  };

  const handleDelete = (id: string, type: string) => {
      if (window.confirm('确定要从库中永久删除此项目吗？')) {
        let updatedData = {};
        if (type === 'article') {
            const next = articles.filter(a => a.id !== id);
            setArticles(next);
            updatedData = { articles: next };
        }
        else if (mediaType === 'audio') {
            const next = songs.filter(s => s.id !== id);
            setSongs(next);
            updatedData = { songs: next };
        }
        else if (mediaType === 'video') {
             const next = mvs.filter(m => m.id !== id);
             setMvs(next);
             updatedData = { mvs: next };
        }
        else if (mediaType === 'image') {
            const next = galleryItems.filter(g => g.id !== id);
            setGalleryItems(next);
            updatedData = { galleryItems: next };
        }
        else if (mediaType === 'dj') {
            const next = djSets.filter(d => d.id !== id);
            setDjSets(next);
            updatedData = { djSets: next };
        }
        
        notify('info', '项目已删除');
        syncToCloud(updatedData);
      }
  };

  return (
    <div className="pb-40 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-lime/10 border border-brand-lime/30 rounded-full">
                <Settings2 className="w-3 h-3 text-brand-lime" />
                <span className="text-xs text-brand-lime font-bold tracking-wider">CMS V4.1</span>
              </div>

              {/* CLOUD STATUS INDICATOR */}
              <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className={`
                     inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all hover:scale-105 cursor-pointer
                     ${connectionStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                       connectionStatus === 'auth_error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                       'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}
                  `}
              >
                  {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span className="text-xs font-bold tracking-wider uppercase">
                      {connectionStatus === 'connected' ? 'CLOUD ACTIVE' : 
                       connectionStatus === 'auth_error' ? 'AUTH ERROR' : 
                       connectionStatus === 'missing_config' ? 'NO BINDING' : 'DISCONNECTED'}
                  </span>
                  <Settings2 className="w-3 h-3 ml-1 opacity-50" />
              </button>
          </div>

          <h1 className="text-5xl lg:text-7xl font-display font-bold mb-4">
            创作 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-lime to-brand-cyan">控制台</span>
          </h1>
        </div>
        
        {/* CLOUD SYNC BUTTON */}
        <div className="flex items-center gap-4">
            <button 
                onClick={handleManualSync}
                className={`px-6 py-3 rounded-xl border flex items-center gap-3 transition-all ${isSyncing ? 'bg-brand-lime border-brand-lime text-black' : 'bg-white/5 border-white/10 hover:border-brand-lime/50 text-white'}`}
            >
                {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudLightning className="w-5 h-5" />}
                <span className="font-bold text-sm">{isSyncing ? '同步中...' : '同步到云端'}</span>
            </button>
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

      {/* CONNECTION SETTINGS MODAL */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
              <div className="relative bg-[#1a1a1a] w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
                  <button onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                  
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-brand-lime/10 flex items-center justify-center text-brand-lime border border-brand-lime/20">
                          <CloudLightning className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-white">云端连接配置</h2>
                  </div>

                  <div className="space-y-6">
                       {/* Section 1: Admin Secret */}
                       <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                               <Key className="w-3 h-3" /> Admin Secret (可选)
                           </label>
                           <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                               如果在 Cloudflare 后台设置了 <code className="text-brand-lime">ADMIN_SECRET</code> 变量，请输入相同的值以获取写入权限。
                           </p>
                           <div className="flex gap-2">
                               <input 
                                  type="password" 
                                  value={adminKey} 
                                  onChange={e => setAdminKey(e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-brand-lime outline-none"
                                  placeholder="未设置可留空"
                               />
                               <button onClick={handleSaveAdminKey} className="px-4 bg-brand-lime text-black font-bold rounded-lg text-sm hover:bg-white transition-colors">
                                   保存
                               </button>
                           </div>
                       </div>

                       {/* Section 2: Instructions */}
                       <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                           <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2">
                               <Database className="w-3 h-3" /> 如何绑定资源 (在 CF 后台)
                           </h4>
                           <ol className="text-xs text-blue-200/70 space-y-2 list-decimal list-inside leading-relaxed">
                               <li>登录 Cloudflare Dashboard，进入您的 Worker (yinyuetai)。</li>
                               <li>点击 <strong>Settings</strong> &rarr; <strong>Variables</strong>。</li>
                               <li>在 <strong>KV Namespace Bindings</strong> 中添加:
                                   <br/>Variable name: <code className="text-white bg-white/10 px-1 rounded">DB</code> &rarr; 选择您的 KV 空间。
                               </li>
                               <li>在 <strong>R2 Bucket Bindings</strong> 中添加:
                                   <br/>Variable name: <code className="text-white bg-white/10 px-1 rounded">BUCKET</code> &rarr; 选择您的 R2 存储桶。
                               </li>
                               <li>(可选) 添加 Text Variable: <code className="text-white bg-white/10 px-1 rounded">ADMIN_SECRET</code> 用于加密。</li>
                               <li>保存并部署 (Deploy) 即可生效。</li>
                           </ol>
                       </div>
                  </div>
              </div>
          </div>
      )}

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
                    <UploadCloud className="w-4 h-4" /> 上传{mediaType === 'image' ? '图片' : '资源'}
                </button>
           </div>
           
           {/* CMS Data Grid (Same as before but with updated handlers) */}
           <div className="space-y-1">
               {/* Header Row */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
                <div className="col-span-5 md:col-span-4">名称 / 信息</div>
                <div className="col-span-3 md:col-span-3 hidden md:block">元数据</div>
                <div className="col-span-2 hidden md:block">状态</div>
                <div className="col-span-3 md:col-span-3 text-right">操作</div>
               </div>

                {/* Render Logic - Image */}
                {mediaType === 'image' && galleryItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-cyan/20 items-center group transition-all">
                        <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 bg-black/50">
                                <img src={item.imageUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                            </div>
                        </div>
                        <div className="col-span-3 hidden md:flex flex-col justify-center text-xs text-gray-400">
                             <span className="flex items-center gap-1 mt-1"><Maximize2 className="w-3 h-3" /> R2 Object</span>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-brand-cyan text-[10px]">SYNCED</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(item, 'image')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(item.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                
                {/* Render Logic - Audio */}
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

                 {/* Render Logic - Video */}
                {mediaType === 'video' && mvs.map((mv) => (
                    <div key={mv.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-pink/20 items-center group transition-all">
                         <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img src={mv.coverUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{mv.title}</h4>
                            </div>
                        </div>
                        <div className="col-span-2 hidden md:flex items-center"><span className="text-blue-500 text-[10px]">HD</span></div>
                        <div className="col-span-5 md:col-span-3 flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenEdit(mv, 'video')} className="p-2 hover:bg-white hover:text-black rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(mv.id, 'media')} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}

                {/* Render Logic - DJ */}
                {mediaType === 'dj' && djSets.map((dj) => (
                    <div key={dj.id} className="grid grid-cols-12 gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-brand-accent/20 items-center group transition-all">
                        <div className="col-span-7 md:col-span-4 flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                <img src={dj.coverUrl} className="w-full h-full object-cover" alt="cover" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{dj.title}</h4>
                            </div>
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
                                onClick={() => handleThemeChange(theme)}
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
                   <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">副标题 / 描述</label>
                        <input type="text" value={headerFormData.description} onChange={e => setHeaderFormData({...headerFormData, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-brand-lime outline-none" />
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

                            {/* Image/File Upload Area */}
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-brand-lime mb-1 flex items-center gap-2">
                                        <Link className="w-3 h-3" /> 
                                        {mediaType === 'image' ? '图片链接 (URL)' : '封面链接'}
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
                                            onClick={() => coverInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="px-4 bg-white/10 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-1 min-w-max"
                                        >
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            <span className="text-xs">R2上传</span>
                                        </button>
                                        <input 
                                            ref={coverInputRef}
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, 'cover')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* MEDIA Specifics */}
                            {editingType === 'media' && mediaType !== 'image' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1 flex justify-between">
                                            资源文件链接 (MP3/MP4/URL)
                                            {isUploading && <span className="text-brand-lime text-[10px] animate-pulse">UPLOADING...</span>}
                                        </label>
                                        <div className="flex gap-2">
                                            <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none" placeholder="https://..." />
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="px-4 bg-white/10 rounded-lg hover:bg-white hover:text-black transition-colors flex items-center gap-1 min-w-max"
                                            >
                                                <UploadCloud className="w-4 h-4" />
                                            </button>
                                            <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                accept={mediaType === 'video' ? 'video/*' : 'audio/*'} 
                                                className="hidden"
                                                onChange={(e) => handleFileUpload(e, 'url')}
                                            />
                                        </div>
                                    </div>
                                    
                                    {(mediaType === 'audio' || mediaType === 'dj') && (
                                        <>
                                            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                                                <label className="block text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                                                    <Music className="w-3 h-3" /> 网易云音乐 ID (覆盖上方链接)
                                                </label>
                                                <input type="text" value={formData.neteaseId} onChange={e => setFormData({...formData, neteaseId: e.target.value})} className="w-full bg-black border border-red-500/30 rounded-lg p-3 text-white focus:border-red-500 outline-none" placeholder="例如: 186016" />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-1">歌词</label>
                                                <textarea 
                                                    value={formData.lyrics} 
                                                    onChange={e => setFormData({...formData, lyrics: e.target.value})} 
                                                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none h-32 text-xs font-mono" 
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* ARTICLE FIELDS */}
                            {editingType === 'article' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">正文</label>
                                        <textarea 
                                            value={formData.content} 
                                            onChange={e => setFormData({...formData, content: e.target.value})} 
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-brand-lime outline-none h-48 resize-none" 
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
                                                    />
                                                ))}
                                            </div>
                                         </div>
                                    </div>
                                </>
                            )}
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">描述</label>
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
                                                <img src={formData.cover} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">No Image</div>
                                            )}
                                       </div>
                                       <div className="text-center">
                                           <h4 className="font-bold text-white mb-1">{formData.title || 'Title'}</h4>
                                           <p className="text-xs text-gray-400">{formData.artist || 'Artist'}</p>
                                       </div>
                                  </div>
                             </div>

                            <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                <button onClick={handleSave} disabled={isUploading} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-brand-lime transition-colors disabled:opacity-50">
                                    {isUploading ? '正在上传文件...' : '保存并同步到云端'}
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
