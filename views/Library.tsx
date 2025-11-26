
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Music, Trash2, Settings2, Palette, Edit3, Film, Image as ImageIcon, X, Database, FileText, Disc, UploadCloud, Tag, Type as FontIcon, Maximize2, Link, Plus, CheckCircle, Save, Loader2, CloudLightning, AlertTriangle, Wifi, WifiOff, Key, ShieldCheck, Lock, Unlock, HardDrive, Layout, RefreshCw, Layers, Headphones, MoreHorizontal, ImagePlus, Bold, Italic, Heading1, Heading2, Menu, ArrowUp, ArrowDown, Heart, Video, Grid, ExternalLink, RefreshCcw } from 'lucide-react';
import { Song, Theme, MV, GalleryItem, DJSet, Article, PageHeaders, View, Playlist, SoftwareItem, NavItem } from '../types';
import { THEMES, MOODS } from '../constants';
import { cloudService } from '../services/cloudService';
import { NotificationType } from '../components/Notification';
import { Netdisk } from '../components/Netdisk'; 

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
  softwareItems?: SoftwareItem[]; 
  setSoftwareItems?: React.Dispatch<React.SetStateAction<SoftwareItem[]>>;
  playlists: Playlist[];
  onPlaySong: (song: Song) => void;
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  pageHeaders: PageHeaders;
  setPageHeaders: React.Dispatch<React.SetStateAction<PageHeaders>>;
  notify: (type: NotificationType, message: string) => void;
  navItems: NavItem[]; 
  setNavItems: React.Dispatch<React.SetStateAction<NavItem[]>>; 
}

export const Library: React.FC<LibraryProps> = ({ 
    songs, setSongs, 
    mvs, setMvs,
    galleryItems, setGalleryItems,
    djSets = [], setDjSets = (_: React.SetStateAction<DJSet[]>) => {},
    articles = [], setArticles = (_: React.SetStateAction<Article[]>) => {},
    softwareItems = [], setSoftwareItems = (_: React.SetStateAction<SoftwareItem[]>) => {},
    playlists,
    onPlaySong, 
    currentTheme, setTheme,
    pageHeaders, setPageHeaders,
    notify,
    navItems, setNavItems
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [activeTab, setActiveTab] = useState<'media' | 'dj' | 'gallery' | 'articles' | 'decoration' | 'theme' | 'netdisk' | 'nav'>('media');
  const [mediaSubTab, setMediaSubTab] = useState<'audio' | 'video'>('audio');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Media Selector State
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [mediaSelectorType, setMediaSelectorType] = useState<'image' | 'audio' | 'video'>('image');
  const [selectorContext, setSelectorContext] = useState<'content' | 'cover'>('content');
  
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'audio' | 'video' | 'dj' | 'gallery' | 'article'>('audio');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'missing_config' | 'auth_error' | 'offline'>('connected');
  const [adminKey, setAdminKey] = useState('');
  
  const [isScraping, setIsScraping] = useState(false);

  const articleContentRef = useRef<HTMLTextAreaElement>(null);

  // File Upload Handlers (Hidden Inputs)
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

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
      neteaseId: '',
      djuuId: '',
      videoUrl: ''
  });

  const [selectedDecorPage, setSelectedDecorPage] = useState<View>(View.HOME);
  const [decorForm, setDecorForm] = useState({
      title: '',
      subtitle: '',
      description: ''
  });

  useEffect(() => {
     const checkAuth = async () => {
         const savedKey = cloudService.getAdminKey();
         if (savedKey) {
             const isValid = await cloudService.verifyKey(savedKey);
             if (isValid) {
                 setIsAuthenticated(true);
                 setAdminKey(savedKey);
             }
         }
         setAuthLoading(false);
         await cloudService.loadData();
     };
     checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      const isValid = await cloudService.verifyKey(passwordInput);
      setAuthLoading(false);
      
      if (isValid) {
          setIsAuthenticated(true);
          setAdminKey(passwordInput);
          cloudService.setAdminKey(passwordInput);
          notify('success', '身份验证通过');
      } else {
          notify('error', '访问拒绝：密钥无效');
      }
  };

  const handleSaveAdminKey = () => {
      setAuthLoading(true);
      cloudService.verifyKey(adminKey).then(isValid => {
          setAuthLoading(false);
          if (isValid) {
              cloudService.setAdminKey(adminKey);
              notify('success', 'Admin Key 已更新');
              setIsSettingsOpen(false);
              syncToCloud();
          } else {
              notify('error', '密钥无效');
          }
      });
  };

  const syncToCloud = async (overrideData?: any) => {
      setIsSyncing(true);
      const dataToSave = {
          songs, mvs, galleryItems, djSets, articles, playlists, pageHeaders, softwareItems, navItems,
          themeId: currentTheme.id,
          ...overrideData 
      };
      
      try {
          const success = await cloudService.saveData(dataToSave);
          if (success) setConnectionStatus('connected');
      } catch (e: any) {
          if (e.message.includes('Unauthorized')) setConnectionStatus('auth_error');
          else if (e.message.includes('KV')) setConnectionStatus('missing_config');
          else setConnectionStatus('offline');
          notify('error', `同步失败: ${e.message}`);
      }
      setTimeout(() => setIsSyncing(false), 800);
  };

  // --- TRIGGER SCRAPER ---
  const handleTriggerScrape = async () => {
      setIsScraping(true);
      notify('info', '正在抓取网易云舞曲/DJ榜单...');
      try {
          const key = cloudService.getAdminKey();
          const res = await fetch('/api/admin/scrape', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'x-admin-key': key
              }
          });
          
          if (!res.ok) throw new Error('Failed to trigger');
          
          const result = await res.json();
          if (result.success) {
              notify('success', `抓取完成! 新增 ${result.count} 首曲目`);
              // Reload data
              const cloudData = await cloudService.loadData();
              if (cloudData && cloudData.djSets) setDjSets(cloudData.djSets);
          } else {
              notify('error', `抓取未完成: ${result.message}`);
          }
      } catch (e: any) {
          notify('error', '触发抓取失败: ' + e.message);
      } finally {
          setIsScraping(false);
      }
  };

  // ... [Rest of functionality] ...
  const toggleFeaturedMV = (id: string) => {
      const updatedMvs = mvs.map(mv => ({
          ...mv,
          isFeatured: mv.id === id 
      }));
      setMvs(updatedMvs);
      notify('success', '已更新首页推荐视频');
      syncToCloud({ mvs: updatedMvs });
  };
  
  const insertAtCursor = (text: string) => {
      if (articleContentRef.current) {
          const start = articleContentRef.current.selectionStart;
          const end = articleContentRef.current.selectionEnd;
          const currentVal = formData.content;
          const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
          setFormData({...formData, content: newVal});
          
          setTimeout(() => {
              if (articleContentRef.current) {
                  articleContentRef.current.selectionStart = articleContentRef.current.selectionEnd = start + text.length;
                  articleContentRef.current.focus();
              }
          }, 0);
      } else {
          setFormData({...formData, content: formData.content + text});
      }
  };
  const handleSelection = (item: any) => {
      if (selectorContext === 'cover') {
          const url = item.imageUrl || item.coverUrl || item.cover;
          if (url) {
              setFormData(prev => ({ ...prev, cover: url }));
              notify('success', '已选择封面图片');
          } else {
              notify('error', '该项目没有有效的图片链接');
          }
      } else {
          let tag = '';
          const uniqueId = Math.random().toString(36).substr(2, 9);
          if (mediaSelectorType === 'image') {
              tag = `<div class="not-prose my-16 relative group rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5"><img src="${item.imageUrl}" class="w-full h-auto object-cover" alt="${item.title}" /><div class="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"><div class="transform translate-y-4 group-hover:translate-y-0 transition-transform"><p class="text-sm font-bold text-white tracking-widest uppercase mb-1">${item.title}</p><span class="text-[10px] text-brand-cyan border border-brand-cyan/20 px-2 py-1 rounded-full backdrop-blur-md">${item.photographer || 'Gallery'}</span></div></div></div>`;
          } else if (mediaSelectorType === 'audio') {
              const url = item.fileUrl || `https://music.163.com/song/media/outer/url?id=${item.neteaseId}.mp3`;
              tag = `<audio controls src="${url}" class="w-full my-8"></audio>`;
          } else if (mediaSelectorType === 'video') {
              tag = `<div class="not-prose my-16"><div class="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-black relative group hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2"><video controls poster="${item.coverUrl}" src="${item.videoUrl}" class="w-full aspect-video object-cover"></video><div class="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/10 pointer-events-none shadow-lg">${item.title}</div></div></div>`;
          }
          insertAtCursor(tag);
          notify('success', '媒体已插入文章');
      }
      setShowMediaSelector(false);
  };
  const openMediaSelector = (type: 'image' | 'audio' | 'video', context: 'content' | 'cover') => {
      setMediaSelectorType(type);
      setSelectorContext(context);
      setShowMediaSelector(true);
  };
  const handleMediaUploadForArticle = async (type: 'image' | 'audio' | 'video') => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'image' ? 'image/*' : type === 'audio' ? 'audio/*' : 'video/*';
      input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
              setIsUploading(true);
              notify('info', `正在上传${type}...`);
              try {
                  const url = await cloudService.uploadFile(file);
                  if (url) {
                      let tag = '';
                      if (type === 'image') {
                          tag = `<img src="${url}" class="w-full rounded-[2rem] my-12 shadow-2xl border border-white/5" alt="uploaded-image" />`;
                      } else if (type === 'audio') {
                           tag = `<audio controls src="${url}" class="w-full my-8"></audio>`;
                      } else if (type === 'video') {
                          tag = `<video controls src="${url}" class="w-full rounded-[2rem] my-12 shadow-2xl border border-white/10"></video>`;
                      }
                      insertAtCursor(tag);
                      notify('success', `${type} 已插入`);
                  } else {
                      notify('error', '上传失败');
                  }
              } catch (err: any) {
                  notify('error', err.message);
              } finally {
                  setIsUploading(false);
              }
          }
      };
      input.click();
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'cover' | 'videoUrl') => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      notify('info', '正在上传文件...');
      try {
          const url = await cloudService.uploadFile(file);
          if (url) {
              setFormData(prev => ({ ...prev, [field]: url }));
              notify('success', '上传成功');
          } else {
              notify('error', '上传失败：未返回 URL');
          }
      } catch (err: any) {
          notify('error', '上传出错: ' + err.message);
      } finally {
          setIsUploading(false);
          e.target.value = '';
      }
  };
  const handleDjuuParse = (input: string) => {
      // Keep for manual legacy support if needed
      setFormData(prev => ({ ...prev, djuuId: input }));
  };
  const wrapSelection = (prefix: string, suffix: string) => {
      if (articleContentRef.current) {
          const start = articleContentRef.current.selectionStart;
          const end = articleContentRef.current.selectionEnd;
          const currentVal = formData.content;
          const selectedText = currentVal.substring(start, end);
          const newVal = currentVal.substring(0, start) + prefix + selectedText + suffix + currentVal.substring(end);
          setFormData({...formData, content: newVal});
      }
  };
  const handleNavChange = (id: View, field: 'label' | 'subLabel', value: string) => {
      setNavItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const moveNavItem = (index: number, direction: 'up' | 'down') => {
      const sorted = [...navItems].sort((a, b) => a.order - b.order);
      const newItems = [...sorted];
      if (direction === 'up' && index > 0) {
          [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      } else if (direction === 'down' && index < newItems.length - 1) {
          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      } else {
          return;
      }
      const finalItems = newItems.map((item, idx) => ({ ...item, order: idx }));
      setNavItems(finalItems);
  };
  const saveNavItems = () => {
      syncToCloud({ navItems });
      notify('success', '导航菜单已更新');
  };
  const resetForm = () => {
      setFormData({ 
          title: '', artist: '', url: '', cover: '', desc: '', tag: '', duration: '', bpm: '128', 
          content: '', lyrics: '', mood: MOODS[0].color, linkedSongId: '',
          fontFamily: 'sans', neteaseId: '', djuuId: '', videoUrl: ''
      });
      setEditMode(false);
      setEditingId(null);
  };
  const openCreateModal = (type: typeof editingType) => {
      setEditingType(type);
      resetForm();
      if (type === 'video') setFormData(prev => ({...prev, duration: '04:00', tag: 'MV'}));
      if (type === 'audio') setFormData(prev => ({...prev, duration: '03:30', tag: 'Pop'}));
      if (type === 'dj') setFormData(prev => ({...prev, duration: '04:00', bpm: '128'}));
      if (type === 'article') setFormData(prev => ({...prev, tag: 'News'}));
      setIsModalOpen(true);
  };
  const openEditModal = (item: any, type: typeof editingType) => {
      setEditingType(type);
      setEditMode(true);
      setEditingId(item.id);
      const form = { ...formData };
      form.title = item.title || '';
      form.cover = item.coverUrl || item.imageUrl || ''; 
      if (type === 'article') {
          form.artist = item.author;
          form.desc = item.excerpt;
          form.content = item.content;
          form.tag = item.tags?.[0] || '';
          form.mood = item.mood || MOODS[0].color;
          form.linkedSongId = item.linkedSongId || '';
      } else if (type === 'video') {
          form.artist = item.artist;
          form.videoUrl = item.videoUrl;
          form.duration = item.duration;
          form.tag = item.tags?.[0] || '';
      } else if (type === 'audio') {
          form.artist = item.artist;
          form.url = item.fileUrl;
          form.duration = item.duration;
          form.neteaseId = item.neteaseId || '';
          form.lyrics = item.lyrics || '';
      } else if (type === 'dj') {
          form.artist = item.djName;
          form.url = item.fileUrl;
          form.bpm = item.bpm || 128;
          form.duration = item.duration;
          form.djuuId = item.djuuId || '';
      } else if (type === 'gallery') {
          form.artist = item.photographer;
      }
      setFormData(form);
      setIsModalOpen(true);
  };
  const handleSubmit = async () => {
      const newId = editMode && editingId ? editingId : Date.now().toString();
      let updatedData = {}; 
      if (editingType === 'article') {
          const newArticle: Article = {
              id: newId,
              title: formData.title,
              author: formData.artist || 'Admin', 
              excerpt: formData.desc,
              content: formData.content,
              coverUrl: formData.cover || `https://picsum.photos/seed/${newId}/800/600`,
              date: new Date().toISOString().split('T')[0],
              mood: formData.mood,
              tags: [formData.tag || 'News'],
              style: { fontFamily: formData.fontFamily, fontSize: 'base', lineHeight: 'normal' },
              linkedSongId: formData.linkedSongId 
          };
          const next = editMode ? articles.map(a => a.id === editingId ? newArticle : a) : [newArticle, ...articles];
          setArticles(next);
          updatedData = { articles: next };
      } 
      else if (editingType === 'video') {
          const newMV: MV = {
              id: newId,
              title: formData.title,
              artist: formData.artist,
              coverUrl: formData.cover,
              videoUrl: formData.videoUrl || formData.url,
              duration: formData.duration || '04:00',
              views: 0,
              tags: [formData.tag || 'MV'],
              category: formData.tag || 'Upload'
          };
          const next = editMode ? mvs.map(m => m.id === editingId ? newMV : m) : [newMV, ...mvs];
          setMvs(next);
          updatedData = { mvs: next };
      }
      else if (editingType === 'audio') {
          let finalUrl = formData.url;
          if (formData.neteaseId) finalUrl = `https://music.163.com/song/media/outer/url?id=${formData.neteaseId}.mp3`;
          const newSong: Song = {
              id: newId,
              title: formData.title,
              artist: formData.artist,
              coverUrl: formData.cover,
              duration: formData.duration,
              plays: 0,
              fileUrl: finalUrl,
              neteaseId: formData.neteaseId,
              lyrics: formData.lyrics
          };
          const next = editMode ? songs.map(s => s.id === editingId ? newSong : s) : [newSong, ...songs];
          setSongs(next);
          updatedData = { songs: next };
      }
      else if (editingType === 'dj') {
          let finalUrl = formData.url;
          if (formData.djuuId) {
             finalUrl = `/api/djuu/stream?id=${formData.djuuId}`;
          }
          const newSet: DJSet = {
              id: newId,
              title: formData.title,
              djName: formData.artist,
              coverUrl: formData.cover,
              fileUrl: finalUrl,
              duration: formData.duration,
              bpm: parseInt(formData.bpm.toString()) || 128,
              tags: ['Mix'],
              plays: 0,
              djuuId: formData.djuuId 
          };
          const next = editMode ? djSets.map(d => d.id === editingId ? newSet : d) : [newSet, ...djSets];
          setDjSets(next);
          updatedData = { djSets: next };
      }
      else if (editingType === 'gallery') {
          const newItem: GalleryItem = {
              id: newId,
              title: formData.title,
              photographer: formData.artist,
              imageUrl: formData.cover,
              spanClass: 'col-span-1 row-span-1'
          };
          const next = editMode ? galleryItems.map(g => g.id === editingId ? newItem : g) : [newItem, ...galleryItems];
          setGalleryItems(next);
          updatedData = { galleryItems: next };
      }
      setIsModalOpen(false);
      notify('success', editMode ? '更新成功' : '创建成功');
      syncToCloud(updatedData);
  };
  const handleDelete = (id: string, type: typeof editingType) => {
      if (!window.confirm('确定删除吗？')) return;
      let updatedData = {};
      if (type === 'article') {
          const next = articles.filter(a => a.id !== id);
          setArticles(next);
          updatedData = { articles: next };
      } else if (type === 'video') {
          const next = mvs.filter(m => m.id !== id);
          setMvs(next);
          updatedData = { mvs: next };
      } else if (type === 'audio') {
          const next = songs.filter(s => s.id !== id);
          setSongs(next);
          updatedData = { songs: next };
      } else if (type === 'dj') {
          const next = djSets.filter(d => d.id !== id);
          setDjSets(next);
          updatedData = { djSets: next };
      } else if (type === 'gallery') {
          const next = galleryItems.filter(g => g.id !== id);
          setGalleryItems(next);
          updatedData = { galleryItems: next };
      }
      notify('info', '已删除');
      syncToCloud(updatedData);
  };
  const saveDecoration = () => {
      const next = { ...pageHeaders, [selectedDecorPage]: { ...pageHeaders[selectedDecorPage], ...decorForm } };
      setPageHeaders(next);
      notify('success', '页面配置已保存');
      syncToCloud({ pageHeaders: next });
  };

  if (!isAuthenticated) return (
      <div className="h-screen flex items-center justify-center">
          <form onSubmit={handleLogin} className="w-80 space-y-4 text-center">
              <Lock className="w-12 h-12 text-brand-lime mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white">管理控制台</h2>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-brand-lime outline-none" placeholder="输入 Admin Key" />
              <button disabled={authLoading} className="w-full py-3 bg-brand-lime text-black font-bold rounded-lg hover:bg-white transition-colors">{authLoading ? '验证中...' : '解锁'}</button>
          </form>
      </div>
  );

  return (
    <div className="pb-40 animate-in fade-in duration-500 min-h-screen">
      <header className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
          <div>
              <h1 className="text-4xl font-black text-white mb-2">网站管理后台</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-brand-lime" /> 已验证</span>
                  <span className={`flex items-center gap-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                      {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} 
                      {connectionStatus === 'connected' ? '云端已连接' : '未连接/配置错误'}
                  </span>
              </div>
          </div>
          <div className="flex gap-3">
              <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-white"><Settings2 className="w-5 h-5" /></button>
              <button onClick={() => syncToCloud()} className="px-6 py-3 bg-brand-lime text-black font-bold rounded-xl hover:bg-white flex items-center gap-2">
                  {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudLightning className="w-5 h-5" />} 同步数据
              </button>
          </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
          <nav className="w-full lg:w-64 flex flex-col gap-2">
              <button onClick={() => setActiveTab('media')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'media' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <Database className="w-5 h-5" /> 媒体库管理
              </button>
              <button onClick={() => setActiveTab('dj')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'dj' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <Headphones className="w-5 h-5" /> 电音 & DJ Set
              </button>
              <button onClick={() => setActiveTab('gallery')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'gallery' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <ImagePlus className="w-5 h-5" /> 视觉画廊
              </button>
              <button onClick={() => setActiveTab('articles')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'articles' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <FileText className="w-5 h-5" /> 文章与专栏
              </button>
              <button onClick={() => setActiveTab('decoration')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'decoration' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <Layout className="w-5 h-5" /> 页面装修
              </button>
              <button onClick={() => setActiveTab('nav')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'nav' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <Menu className="w-5 h-5" /> 导航管理
              </button>
              <button onClick={() => setActiveTab('theme')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'theme' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <Palette className="w-5 h-5" /> 主题风格
              </button>
              <button onClick={() => setActiveTab('netdisk')} className={`p-4 rounded-xl text-left font-bold flex items-center gap-3 transition-colors ${activeTab === 'netdisk' ? 'bg-brand-lime text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                  <HardDrive className="w-5 h-5" /> 云盘与软件
              </button>
          </nav>

          <main className="flex-1 bg-white/[0.02] border border-white/5 rounded-3xl p-6 min-h-[600px]">
              {/* MEDIA TAB CONTENT */}
              {activeTab === 'media' && (
                  <div>
                      <div className="flex gap-2 mb-6 border-b border-white/5 pb-4 overflow-x-auto">
                          <button onClick={() => setMediaSubTab('audio')} className={`px-4 py-2 rounded-lg text-sm font-bold ${mediaSubTab === 'audio' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>音频列表</button>
                          <button onClick={() => setMediaSubTab('video')} className={`px-4 py-2 rounded-lg text-sm font-bold ${mediaSubTab === 'video' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>视频/MV</button>
                      </div>

                      <div className="flex justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">{mediaSubTab === 'audio' ? '音乐管理' : '视频管理'} ({mediaSubTab === 'audio' ? songs.length : mvs.length})</h3>
                          <button onClick={() => openCreateModal(mediaSubTab)} className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-white">
                              <Plus className="w-4 h-4" /> 新增{mediaSubTab === 'audio' ? '音乐' : '视频'}
                          </button>
                      </div>

                      <div className="space-y-2">
                          {(mediaSubTab === 'audio' ? songs : mvs).map((item: any) => (
                              <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/20 group">
                                  <div className="w-12 h-12 rounded bg-black overflow-hidden shrink-0"><img src={item.coverUrl} className="w-full h-full object-cover" /></div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-white truncate">{item.title}</div>
                                      <div className="text-xs text-gray-500 truncate">{item.artist}</div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {mediaSubTab === 'video' && (
                                          <button 
                                            onClick={() => toggleFeaturedMV(item.id)} 
                                            className={`p-2 rounded transition-colors ${item.isFeatured ? 'text-brand-pink bg-brand-pink/10' : 'text-gray-500 hover:text-brand-pink hover:bg-brand-pink/10'}`}
                                            title="设为首页推荐"
                                          >
                                              <Heart className={`w-4 h-4 ${item.isFeatured ? 'fill-current' : ''}`} />
                                          </button>
                                      )}
                                      <button onClick={() => openEditModal(item, mediaSubTab as any)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(item.id, mediaSubTab as any)} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* DJ TAB CONTENT */}
              {activeTab === 'dj' && (
                  <div>
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-xl font-bold text-white">DJ Sets / Mixes ({djSets.length})</h3>
                              <p className="text-xs text-gray-500 mt-1">管理长篇 Mix 或自动抓取网易云舞曲榜。</p>
                          </div>
                          <div className="flex gap-2">
                              {/* MANUAL SCRAPE BUTTON */}
                              <button 
                                onClick={handleTriggerScrape} 
                                disabled={isScraping}
                                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold transition-all border ${isScraping ? 'bg-white/10 text-gray-500 border-transparent cursor-wait' : 'bg-transparent text-brand-lime border-brand-lime/30 hover:bg-brand-lime hover:text-black'}`}
                              >
                                  <RefreshCcw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                                  {isScraping ? '抓取中...' : '抓取网易云舞曲'}
                              </button>

                              <button onClick={() => openCreateModal('dj')} className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-white">
                                  <Plus className="w-4 h-4" /> 新增 Mix
                              </button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          {djSets.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/20 group">
                                  <div className="w-12 h-12 rounded bg-black overflow-hidden shrink-0 relative">
                                     <img src={item.coverUrl} className="w-full h-full object-cover" />
                                     {item.id.startsWith('ne_') && (
                                         <div className="absolute top-0 right-0 bg-red-600 text-[8px] font-bold px-1 text-white">163</div>
                                     )}
                                     {item.id.startsWith('pixabay') && (
                                         <div className="absolute bottom-0 right-0 bg-green-600 text-[8px] font-bold px-1 text-white">PIX</div>
                                     )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-white truncate">{item.title}</div>
                                      <div className="text-xs text-gray-500 truncate">{item.djName} | {item.bpm} BPM</div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditModal(item, 'dj')} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(item.id, 'dj')} className="p-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
// ... existing code ...
