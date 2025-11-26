
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Music, Trash2, Settings2, Palette, Edit3, Film, Image as ImageIcon, X, Database, FileText, Disc, UploadCloud, Tag, Type as FontIcon, Maximize2, Link, Plus, CheckCircle, Save, Loader2, CloudLightning, AlertTriangle, Wifi, WifiOff, Key, ShieldCheck, Lock, Unlock, HardDrive, Layout, RefreshCw, Layers, Headphones, MoreHorizontal, ImagePlus, Bold, Italic, Heading1, Heading2, Menu, ArrowUp, ArrowDown, Heart } from 'lucide-react';
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
  
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'audio' | 'video' | 'dj' | 'gallery' | 'article'>('audio');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'missing_config' | 'auth_error' | 'offline'>('connected');
  const [adminKey, setAdminKey] = useState('');

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

  const toggleFeaturedMV = (id: string) => {
      const updatedMvs = mvs.map(mv => ({
          ...mv,
          isFeatured: mv.id === id // Set the clicked one to true, others to false
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

  const handleImageUploadForArticle = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
              notify('info', '正在上传图片...');
              const url = await cloudService.uploadFile(file);
              if (url) {
                  insertAtCursor(`\n<img src="${url}" class="w-full rounded-xl my-4 shadow-lg" alt="image" />\n`);
                  notify('success', '图片已插入');
              } else {
                  notify('error', '图片上传失败');
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
          // Reset value to allow re-upload of same file
          e.target.value = '';
      }
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
          fontFamily: 'sans', neteaseId: '', videoUrl: ''
      });
      setEditMode(false);
      setEditingId(null);
  };

  const openCreateModal = (type: typeof editingType) => {
      setEditingType(type);
      resetForm();
      if (type === 'video') setFormData(prev => ({...prev, duration: '04:00', tag: 'MV'}));
      if (type === 'audio') setFormData(prev => ({...prev, duration: '03:30', tag: 'Pop'}));
      if (type === 'dj') setFormData(prev => ({...prev, duration: '60:00', bpm: '128'}));
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
              style: { fontFamily: formData.fontFamily, fontSize: 'base', lineHeight: 'normal' }
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
          const newSet: DJSet = {
              id: newId,
              title: formData.title,
              djName: formData.artist,
              coverUrl: formData.cover,
              fileUrl: formData.url,
              duration: formData.duration,
              bpm: parseInt(formData.bpm.toString()) || 128,
              tags: ['Mix'],
              plays: 0
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

  useEffect(() => {
      if (pageHeaders[selectedDecorPage]) {
          setDecorForm({
              title: pageHeaders[selectedDecorPage].title,
              subtitle: pageHeaders[selectedDecorPage].subtitle,
              description: pageHeaders[selectedDecorPage].description
          });
      }
  }, [selectedDecorPage, pageHeaders]);

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

              {activeTab === 'dj' && (
                  <div>
                      <div className="flex justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">DJ Sets / Mixes ({djSets.length})</h3>
                          <button onClick={() => openCreateModal('dj')} className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-white">
                              <Plus className="w-4 h-4" /> 新增 Mix
                          </button>
                      </div>
                      <div className="space-y-2">
                          {djSets.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/20 group">
                                  <div className="w-12 h-12 rounded bg-black overflow-hidden shrink-0"><img src={item.coverUrl} className="w-full h-full object-cover" /></div>
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

              {activeTab === 'gallery' && (
                  <div>
                      <div className="flex justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">Visual Gallery ({galleryItems.length})</h3>
                          <button onClick={() => openCreateModal('gallery')} className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-white">
                              <Plus className="w-4 h-4" /> 添加图片
                          </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {galleryItems.map((item) => (
                              <div key={item.id} className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5">
                                  <img src={item.imageUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2 p-2">
                                      <span className="text-xs text-white font-bold text-center truncate w-full">{item.title}</span>
                                      <div className="flex gap-2">
                                          <button onClick={() => openEditModal(item, 'gallery')} className="p-1.5 bg-white text-black rounded hover:bg-brand-cyan"><Edit3 className="w-3 h-3" /></button>
                                          <button onClick={() => handleDelete(item.id, 'gallery')} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {activeTab === 'articles' && (
                  <div>
                      <div className="flex justify-between mb-6">
                          <h3 className="text-xl font-bold text-white">文章管理 ({articles.length})</h3>
                          <button onClick={() => openCreateModal('article')} className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-white">
                              <Plus className="w-4 h-4" /> 发布新文章
                          </button>
                      </div>
                      <div className="grid gap-4">
                          {articles.map(article => (
                              <div key={article.id} className="p-4 bg-white/5 rounded-xl flex items-center gap-4 group">
                                  <div className="w-16 h-12 bg-black rounded overflow-hidden shrink-0"><img src={article.coverUrl} className="w-full h-full object-cover" /></div>
                                  <div className="flex-1">
                                      <h4 className="font-bold text-white">{article.title}</h4>
                                      <p className="text-xs text-gray-500 line-clamp-1">{article.excerpt}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => openEditModal(article, 'article')} className="p-2 text-gray-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(article.id, 'article')} className="p-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {activeTab === 'decoration' && (
                  <div>
                      <h3 className="text-xl font-bold text-white mb-6">页面装修</h3>
                      <div className="flex gap-8">
                          <div className="w-48 flex flex-col gap-2">
                              {Object.keys(pageHeaders).map((key) => (
                                  <button 
                                    key={key} 
                                    onClick={() => setSelectedDecorPage(key as View)} 
                                    className={`text-left px-4 py-3 rounded-lg text-sm font-bold ${selectedDecorPage === key ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/5'}`}
                                  >
                                      {key} Page
                                  </button>
                              ))}
                          </div>
                          <div className="flex-1 bg-black/20 p-6 rounded-xl border border-white/5">
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs text-gray-500 mb-1">页面大标题</label>
                                      <input type="text" value={decorForm.title} onChange={e => setDecorForm({...decorForm, title: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" />
                                  </div>
                                  <div>
                                      <label className="block text-xs text-gray-500 mb-1">副标题 (Subtitle)</label>
                                      <input type="text" value={decorForm.subtitle} onChange={e => setDecorForm({...decorForm, subtitle: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" />
                                  </div>
                                  <div>
                                      <label className="block text-xs text-gray-500 mb-1">描述文本</label>
                                      <textarea value={decorForm.description} onChange={e => setDecorForm({...decorForm, description: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white h-24" />
                                  </div>
                                  <button onClick={saveDecoration} className="px-6 py-2 bg-brand-lime text-black font-bold rounded-lg hover:bg-white mt-4">保存配置</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

               {activeTab === 'nav' && (
                  <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white">导航菜单管理</h3>
                        <button onClick={saveNavItems} className="px-4 py-2 bg-brand-lime text-black font-bold rounded-lg flex items-center gap-2 hover:bg-white">
                            <Save className="w-4 h-4" /> 保存菜单顺序
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                          {[...navItems].sort((a,b) => a.order - b.order).filter(n => n.id !== View.LIBRARY).map((item, index) => (
                              <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 group">
                                  <div className="flex flex-col gap-1">
                                      <button 
                                        onClick={() => moveNavItem(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white disabled:opacity-30"
                                      >
                                          <ArrowUp className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => moveNavItem(index, 'down')}
                                        disabled={index === navItems.length - 2}
                                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white disabled:opacity-30"
                                      >
                                          <ArrowDown className="w-4 h-4" />
                                      </button>
                                  </div>
                                  
                                  <div className="w-8 h-8 rounded bg-black/30 flex items-center justify-center text-xs font-mono text-gray-500">
                                      {index + 1}
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 flex-1">
                                      <div>
                                          <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">中文显示名</label>
                                          <input 
                                            type="text" 
                                            value={item.label}
                                            onChange={e => handleNavChange(item.id, 'label', e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-brand-lime outline-none" 
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">英文副标题</label>
                                          <input 
                                            type="text" 
                                            value={item.subLabel}
                                            onChange={e => handleNavChange(item.id, 'subLabel', e.target.value)}
                                            className="w-full bg-black border border-white/10 rounded px-2 py-1 text-white text-sm focus:border-brand-lime outline-none" 
                                          />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">* "管理" 菜单默认始终固定在底部。</p>
                  </div>
              )}

              {activeTab === 'theme' && (
                  <div>
                      <h3 className="text-xl font-bold text-white mb-6">全局主题风格</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {THEMES.map((theme: Theme) => (
                              <button 
                                key={theme.id}
                                onClick={() => { setTheme(theme); syncToCloud({themeId: theme.id}); }}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${currentTheme.id === theme.id ? 'border-brand-lime bg-white/5' : 'border-white/5 hover:border-white/20'}`}
                              >
                                  <div className="h-20 w-full rounded-lg" style={{ background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}></div>
                                  <span className="font-bold text-white">{theme.name}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              {activeTab === 'netdisk' && (
                  <Netdisk 
                    notify={notify} 
                    softwareItems={softwareItems} 
                    setSoftwareItems={setSoftwareItems} 
                    onSync={() => syncToCloud()}
                  />
              )}
          </main>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`bg-[#111] w-full ${editingType === 'article' ? 'max-w-5xl h-[90vh]' : 'max-w-2xl max-h-[90vh]'} flex flex-col rounded-2xl border border-white/10 shadow-2xl overflow-hidden`}>
                  
                  <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#161616]">
                      <h3 className="text-xl font-bold text-white">
                          {editMode ? '编辑' : '新增'} {
                              editingType === 'audio' ? '音乐' : 
                              editingType === 'video' ? '视频' : 
                              editingType === 'dj' ? 'DJ Set' : 
                              editingType === 'gallery' ? '图片' :
                              '文章'
                          }
                      </h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-500 hover:text-white" /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-4">
                      
                      {/* Common Inputs */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">标题</label>
                              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white focus:border-brand-lime outline-none" placeholder="输入标题..." />
                          </div>
                          <div>
                              <label className="text-xs text-gray-500 mb-1 block">{editingType === 'article' ? '作者' : editingType === 'gallery' ? '摄影师' : '艺术家/歌手/DJ'}</label>
                              <input type="text" value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white focus:border-brand-lime outline-none" />
                          </div>
                      </div>

                      {/* Image Upload for All Types */}
                      <div>
                          <label className="text-xs text-gray-500 mb-1 block">{editingType === 'gallery' ? '图片文件' : '封面图片'} URL</label>
                          <div className="flex gap-2">
                             <input type="text" value={formData.cover} onChange={e => setFormData({...formData, cover: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white focus:border-brand-lime outline-none" placeholder="https://..." />
                             <button disabled={isUploading} onClick={() => coverFileInputRef.current?.click()} className="px-4 bg-white/10 hover:bg-white hover:text-black rounded-lg text-gray-400 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50">
                                 {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 上传
                             </button>
                          </div>
                      </div>

                      {editingType === 'audio' && (
                          <>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">音频文件 URL (或 网易云ID)</label>
                                <div className="flex gap-2 mb-2">
                                    <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="flex-1 bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="https://example.com/song.mp3" />
                                    <button disabled={isUploading} onClick={() => audioFileInputRef.current?.click()} className="px-4 bg-brand-lime text-black font-bold rounded-lg text-xs flex items-center gap-2 hover:bg-white transition-colors disabled:opacity-50">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 上传文件
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.neteaseId} onChange={e => setFormData({...formData, neteaseId: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white text-sm" placeholder="可选: 网易云音乐 ID (覆盖上方 URL)" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">歌词 (LRC格式)</label>
                                <textarea value={formData.lyrics} onChange={e => setFormData({...formData, lyrics: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white h-24" placeholder="[00:00.00] 歌词内容..." />
                            </div>
                          </>
                      )}

                      {editingType === 'video' && (
                          <>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">视频文件 URL (MP4/WebM)</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="https://..." />
                                    <button disabled={isUploading} onClick={() => videoFileInputRef.current?.click()} className="px-4 bg-white/10 hover:bg-white hover:text-black rounded-lg text-gray-400 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    </button>
                                </div>
                             </div>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">标签/分类</label>
                                <input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="Cinematic, 4K..." />
                             </div>
                          </>
                      )}

                      {editingType === 'dj' && (
                          <>
                             <div>
                                <label className="text-xs text-gray-500 mb-1 block">Mix 音频文件 URL</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="https://..." />
                                    <button disabled={isUploading} onClick={() => audioFileInputRef.current?.click()} className="px-4 bg-white/10 hover:bg-white hover:text-black rounded-lg text-gray-400 font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 上传
                                    </button>
                                </div>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-xs text-gray-500 mb-1 block">BPM</label>
                                    <input type="number" value={formData.bpm} onChange={e => setFormData({...formData, bpm: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="128" />
                                 </div>
                                 <div>
                                    <label className="text-xs text-gray-500 mb-1 block">时长 (mm:ss)</label>
                                    <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" placeholder="60:00" />
                                 </div>
                             </div>
                          </>
                      )}

                      {editingType === 'article' && (
                          <>
                              <div>
                                  <label className="text-xs text-gray-500 mb-1 block">摘要 (Excerpt)</label>
                                  <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white h-20" />
                              </div>
                              
                              <div className="bg-[#050505] rounded-xl border border-white/10 overflow-hidden">
                                  <div className="bg-[#1a1a1a] p-2 flex items-center gap-2 border-b border-white/5 overflow-x-auto">
                                      <button onClick={handleImageUploadForArticle} className="p-2 hover:bg-white/10 rounded text-gray-300 hover:text-brand-lime flex items-center gap-2 text-xs font-bold" title="插入图片">
                                          <ImagePlus className="w-4 h-4" /> 插入图片
                                      </button>
                                      <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                      <button onClick={() => insertAtCursor('## ')} className="p-2 hover:bg-white/10 rounded text-gray-300" title="标题 H2"><Heading2 className="w-4 h-4" /></button>
                                      <button onClick={() => wrapSelection('**', '**')} className="p-2 hover:bg-white/10 rounded text-gray-300" title="粗体"><Bold className="w-4 h-4" /></button>
                                      <button onClick={() => wrapSelection('*', '*')} className="p-2 hover:bg-white/10 rounded text-gray-300" title="斜体"><Italic className="w-4 h-4" /></button>
                                      <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                      <button onClick={() => wrapSelection('<span class="text-xl font-bold">', '</span>')} className="p-2 hover:bg-white/10 rounded text-gray-300 text-xs font-serif" title="大字">A+</button>
                                      <button onClick={() => wrapSelection('<span class="font-serif italic text-gray-400">', '</span>')} className="p-2 hover:bg-white/10 rounded text-gray-300 text-xs font-serif italic" title="引用样式">Quote</button>
                                  </div>
                                  
                                  <label className="text-xs text-gray-500 p-2 block bg-[#0a0a0a]">正文内容 (支持 HTML/Markdown)</label>
                                  <textarea 
                                    ref={articleContentRef}
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})} 
                                    className="w-full bg-black border-none p-4 text-white h-[400px] font-mono text-sm focus:outline-none resize-none" 
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">分类标签</label>
                                      <input type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white" />
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500 mb-1 block">心情色调</label>
                                      <select value={formData.mood} onChange={e => setFormData({...formData, mood: e.target.value})} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white">
                                          {MOODS.map((m: {label: string, color: string}) => <option key={m.label} value={m.color}>{m.label}</option>)}
                                      </select>
                                  </div>
                              </div>
                          </>
                      )}

                      {/* Hidden File Inputs - Moved outside conditional blocks but inside modal to be accessible via refs */}
                      <input ref={coverFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                      <input ref={audioFileInputRef} type="file" className="hidden" accept="audio/*" onChange={(e) => handleFileUpload(e, 'url')} />
                      <input ref={videoFileInputRef} type="file" className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'videoUrl')} />
                      
                    </div>
                  </div>

                  <div className="p-6 border-t border-white/5 bg-[#161616]">
                      <button disabled={isUploading} onClick={handleSubmit} className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {isUploading ? '等待文件上传...' : (editMode ? '保存修改' : '确认创建')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isSettingsOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur">
              <div className="bg-[#111] w-full max-w-md rounded-2xl p-8 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">系统设置</h2>
                  <label className="text-xs text-gray-500 mb-1 block">Admin Secret Key</label>
                  <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} className="w-full bg-black border border-white/10 p-3 rounded-lg text-white mb-4" />
                  <div className="flex gap-2">
                      <button onClick={handleSaveAdminKey} className="flex-1 py-3 bg-brand-lime text-black font-bold rounded-lg">保存</button>
                      <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 bg-white/10 text-white font-bold rounded-lg">关闭</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
