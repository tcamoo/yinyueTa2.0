import React, { useState, useEffect, useRef } from 'react';
import { Upload, Music, Trash2, Settings2, Palette, Edit3, Film, Image as ImageIcon, X, Database, FileText, Disc, UploadCloud, Tag, Type as FontIcon, Maximize2, Link as LinkIcon, Plus, CheckCircle, Save, Loader2, CloudLightning, AlertTriangle, Wifi, WifiOff, Key, ShieldCheck, Lock, Unlock, HardDrive, Layout, RefreshCw, Layers, Headphones, MoreHorizontal, ImagePlus, Bold, Italic, Heading1, Heading2, Menu, ArrowUp, ArrowDown, Heart, Video, Grid, ExternalLink, RefreshCcw, Play, Pause, AlertOctagon, Music2, Search, Check } from 'lucide-react';
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

// --- MEDIA PICKER COMPONENT ---
interface MediaPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
    type: 'image' | 'audio' | 'video';
    data: { images: GalleryItem[], songs: Song[], djSets: DJSet[], mvs: MV[] };
}

const MediaPicker: React.FC<MediaPickerProps> = ({ isOpen, onClose, onSelect, type, data }) => {
    const [search, setSearch] = useState('');
    const [audioTab, setAudioTab] = useState<'songs' | 'dj'>('songs');

    if (!isOpen) return null;

    let items: any[] = [];
    if (type === 'image') items = data.images;
    else if (type === 'video') items = data.mvs;
    else {
        // Audio Type: Split based on tab
        items = audioTab === 'songs' ? data.songs : data.djSets;
    }

    const filtered = items.filter((i: any) => {
        const text = (i.title || i.name || '').toLowerCase();
        return text.includes(search.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#111] w-full max-w-4xl h-[80vh] rounded-3xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 shadow-2xl">
                <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-white/[0.02]">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {type === 'image' ? <ImageIcon className="text-brand-cyan"/> : type === 'audio' ? <Music className="text-brand-lime"/> : <Film className="text-brand-pink"/>}
                            选择{type === 'image' ? '图片' : type === 'audio' ? '音乐' : '视频'}
                        </h3>
                        <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-white"/></button>
                    </div>

                    <div className="flex gap-4">
                         {/* Audio Tabs Switcher */}
                         {type === 'audio' && (
                             <div className="flex gap-2 p-1 bg-black rounded-lg border border-white/10 shrink-0">
                                 <button 
                                    onClick={() => setAudioTab('songs')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${audioTab === 'songs' ? 'bg-brand-lime text-black' : 'text-gray-400 hover:text-white'}`}
                                 >
                                     单曲 (Songs)
                                 </button>
                                 <button 
                                    onClick={() => setAudioTab('dj')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${audioTab === 'dj' ? 'bg-brand-pink text-white' : 'text-gray-400 hover:text-white'}`}
                                 >
                                     DJ Sets (电台)
                                 </button>
                             </div>
                         )}
                         
                         <div className="relative flex-1">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                             <input 
                                type="text" 
                                placeholder="搜索..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg py-2 pl-10 text-sm text-white focus:border-brand-lime outline-none"
                             />
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 custom-scrollbar bg-black/40">
                    {filtered.map((item: any) => (
                        <div 
                            key={item.id} 
                            onClick={() => { onSelect(item); onClose(); }}
                            className="group relative cursor-pointer bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-brand-lime transition-all hover:bg-white/10"
                        >
                            <div className="aspect-square bg-black relative">
                                <img src={item.coverUrl || item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle className="w-8 h-8 text-brand-lime drop-shadow-lg" />
                                </div>
                                {type === 'audio' && (
                                    <div className="absolute bottom-1 right-1">
                                        {audioTab === 'dj' ? <Disc className="w-4 h-4 text-brand-pink drop-shadow-md"/> : <Music2 className="w-4 h-4 text-brand-lime drop-shadow-md"/>}
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-bold text-white truncate">{item.title || item.id}</p>
                                <p className="text-[10px] text-gray-500 truncate">{item.artist || item.photographer || item.djName}</p>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 flex flex-col items-center">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <p>没有找到相关内容</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

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
  
  // TABS
  const [activeTab, setActiveTab] = useState<'media' | 'gallery' | 'articles' | 'decoration' | 'theme' | 'netdisk' | 'nav'>('media');
  const [mediaSubTab, setMediaSubTab] = useState<'audio' | 'video' | 'dj'>('audio');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'image' | 'audio' | 'video'>('image');
  const [pickerContext, setPickerContext] = useState<'cover' | 'editor_image' | 'editor_audio' | 'editor_video'>('cover');

  // Link Check State
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [brokenLinks, setBrokenLinks] = useState<string[]>([]);
  
  // Article Editor State
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'audio' | 'video' | 'dj' | 'gallery' | 'article'>('audio');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'missing_config' | 'auth_error' | 'offline'>('connected');
  const [adminKey, setAdminKey] = useState('');
  
  const [isScraping, setIsScraping] = useState(false);

  // Audio Preview State
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  const checkAuth = async () => {
      setAuthLoading(true);
      const savedKey = cloudService.getAdminKey();
      if (savedKey) {
          const valid = await cloudService.verifyKey(savedKey);
          setIsAuthenticated(valid);
          setAdminKey(savedKey);
          if(!valid) setConnectionStatus('auth_error');
      } else {
          setConnectionStatus('missing_config');
      }
      setAuthLoading(false);
  };

  useEffect(() => {
      checkAuth();
  }, []);

  const handleLogin = async () => {
      const valid = await cloudService.verifyKey(passwordInput);
      if (valid) {
          cloudService.setAdminKey(passwordInput);
          setAdminKey(passwordInput);
          setIsAuthenticated(true);
          setConnectionStatus('connected');
          notify('success', '管理员验证通过');
      } else {
          notify('error', '密码错误');
      }
  };

  const handleSync = async () => {
      if(!isAuthenticated) return;
      setIsSyncing(true);
      try {
          await cloudService.saveData({
              songs, mvs, galleryItems, djSets, articles, playlists, pageHeaders, softwareItems, navItems,
              themeId: currentTheme.id
          });
          notify('success', '所有数据已同步至云端');
      } catch (e: any) {
          notify('error', '同步失败: ' + e.message);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleScrape = async () => {
      if(isScraping) return;
      if(!window.confirm('从网易云音乐爬取新数据可能需要几分钟，确定继续吗？')) return;
      setIsScraping(true);
      notify('info', '正在后台爬取数据...');
      try {
           const headers: Record<string, string> = { 'Content-Type': 'application/json' };
           if (adminKey) headers['x-admin-key'] = adminKey;
           
           const res = await fetch(`${window.location.origin}/api/admin/scrape`, { method: 'POST', headers });
           const data = await res.json();
           
           if(data.success && data.count > 0) {
               const freshData = await cloudService.loadData();
               if (freshData) {
                   if (freshData.djSets) setDjSets(freshData.djSets);
                   if (freshData.songs) setSongs(freshData.songs);
                   if (freshData.mvs) setMvs(freshData.mvs);
                   notify('success', `成功抓取 ${data.count} 首新曲目，媒体库已更新`);
               } else {
                   notify('success', `抓取成功 (${data.count}首)，但同步回显失败，请刷新页面`);
               }
           } else {
               notify('info', '爬虫完成，暂无更新。日志：' + (data.logs ? data.logs.slice(-1)[0] : ''));
           }
      } catch(e) {
          notify('error', '爬虫任务失败');
      } finally {
          setIsScraping(false);
      }
  };

  // --- PREVIEW LOGIC (Updated to support Netease Proxy) ---
  const handlePreview = (item: Song | DJSet) => {
      if (previewId === item.id) {
          if (previewPlaying) {
              previewAudioRef.current?.pause();
              setPreviewPlaying(false);
          } else {
              previewAudioRef.current?.play();
              setPreviewPlaying(true);
          }
      } else {
          setPreviewId(item.id);
          setPreviewPlaying(true);
          if (previewAudioRef.current) {
               let url = item.fileUrl || '';
               
               // Priority Check: If Netease ID exists, always construct a fresh proxy URL.
               // This ensures we don't rely on potentially stale or relative URLs from the scraper.
               if (item.neteaseId) {
                   const targetUrl = `https://music.163.com/song/media/outer/url?id=${item.neteaseId}.mp3`;
                   url = `/api/proxy?strategy=netease&url=${encodeURIComponent(targetUrl)}`;
               } 
               // Fallback: Use generic proxy for external HTTP/HTTPS links to avoid CORS/Mixed Content in Admin
               else if (url.startsWith('http://') || url.startsWith('https://')) {
                   if (!url.includes('/api/proxy')) {
                        url = `/api/proxy?url=${encodeURIComponent(url)}`;
                   }
               }
               
               // Note: If url starts with /api/proxy (relative), it's used as is.

               previewAudioRef.current.src = url;
               previewAudioRef.current.play().catch(e => {
                   console.error("Preview Play Error:", e);
                   notify('error', '无法播放预览: ' + e.message);
                   setPreviewPlaying(false);
               });
          }
      }
  };

  // --- HEALTH CHECK LOGIC ---
  const handleHealthCheck = async (items: (Song|MV|DJSet)[], typeName: string) => {
      if(isCheckingLinks) return;
      if(!window.confirm(`即将检查 ${items.length} 个${typeName}链接的有效性，这可能需要一点时间。`)) return;

      setIsCheckingLinks(true);
      setCheckProgress(0);
      setBrokenLinks([]);

      const invalidIds: string[] = [];
      const total = items.length;

      for(let i=0; i<total; i++) {
          const item = items[i];
          const url = 'videoUrl' in item ? item.videoUrl : item.fileUrl;
          
          if(url) {
              const isValid = await cloudService.validateUrl(url);
              if(!isValid) invalidIds.push(item.id);
          } else {
              invalidIds.push(item.id); 
          }
          setCheckProgress(Math.round(((i+1)/total) * 100));
      }

      setBrokenLinks(invalidIds);
      setIsCheckingLinks(false);

      if(invalidIds.length > 0) {
          notify('error', `检测到 ${invalidIds.length} 个失效链接，建议一键清理`);
      } else {
          notify('success', '所有链接有效！');
      }
  };

  const handleAutoDelete = (setItems: Function, currentItems: any[]) => {
      const count = brokenLinks.length;
      if(count === 0) return;
      
      if(!window.confirm(`确定要永久删除这 ${count} 个失效项目吗？此操作无法撤销。`)) return;
      
      const newItems = currentItems.filter(i => !brokenLinks.includes(i.id));
      setItems(newItems);
      setBrokenLinks([]);
      notify('success', `已成功清理 ${count} 个失效项目，请记得点击 "保存更改" 同步到云端`);
  };

  // --- GENERIC ITEM HANDLING ---
  const handleDelete = (id: string, type: 'audio' | 'video' | 'dj' | 'gallery' | 'article') => {
      if(!window.confirm('确定要删除此项目吗？')) return;
      if (type === 'audio') setSongs(prev => prev.filter(i => i.id !== id));
      if (type === 'video') setMvs(prev => prev.filter(i => i.id !== id));
      if (type === 'dj') setDjSets(prev => prev.filter(i => i.id !== id));
      if (type === 'gallery') setGalleryItems(prev => prev.filter(i => i.id !== id));
      if (type === 'article') setArticles(prev => prev.filter(i => i.id !== id));
  };

  // --- FORM STATES ---
  const [songForm, setSongForm] = useState<Partial<Song>>({});
  const [mvForm, setMvForm] = useState<Partial<MV>>({});
  const [djForm, setDjForm] = useState<Partial<DJSet>>({});
  const [galleryForm, setGalleryForm] = useState<Partial<GalleryItem>>({});
  const [articleForm, setArticleForm] = useState<Partial<Article>>({});

  const handleEdit = (item: any, type: 'audio' | 'video' | 'dj' | 'gallery' | 'article') => {
      setEditMode(true);
      setEditingId(item.id);
      setEditingType(type);
      if (type === 'audio') setSongForm(item);
      if (type === 'video') setMvForm(item);
      if (type === 'dj') setDjForm(item);
      if (type === 'gallery') setGalleryForm(item);
      if (type === 'article') setArticleForm(item);
      setIsModalOpen(true);
  };

  const handleCreate = (type: 'audio' | 'video' | 'dj' | 'gallery' | 'article') => {
      setEditMode(false);
      setEditingId(null);
      setEditingType(type);
      if (type === 'audio') setSongForm({ title: '', artist: '', coverUrl: '', fileUrl: '', duration: '0:00' });
      if (type === 'video') setMvForm({ title: '', artist: '', coverUrl: '', videoUrl: '', duration: '0:00', tags: [] });
      if (type === 'dj') setDjForm({ title: '', djName: '', coverUrl: '', fileUrl: '', duration: '0:00', bpm: 128, tags: [] });
      if (type === 'gallery') setGalleryForm({ title: '', photographer: '', imageUrl: '', spanClass: 'col-span-1 row-span-1' });
      if (type === 'article') setArticleForm({ title: '', author: '', coverUrl: '', excerpt: '', content: '', date: new Date().toISOString().split('T')[0], tags: [], mood: '#ffffff' });
      setIsModalOpen(true);
  };

  const getRandomCover = (id: string) => `https://picsum.photos/seed/${id}/400/400`;

  const handleSave = () => {
      if (editingType === 'audio') {
          const id = editMode ? editingId! : `song_${Date.now()}`;
          const finalCover = songForm.coverUrl?.trim() ? songForm.coverUrl : getRandomCover(id);
          const newItem = { ...songForm, id, coverUrl: finalCover } as Song;
          setSongs(prev => editMode ? prev.map(i => i.id === editingId ? newItem : i) : [newItem, ...prev]);
      }
      if (editingType === 'video') {
           const newItem = { ...mvForm, id: editMode ? editingId! : `mv_${Date.now()}` } as MV;
           setMvs(prev => editMode ? prev.map(i => i.id === editingId ? newItem : i) : [newItem, ...prev]);
      }
      if (editingType === 'dj') {
           const id = editMode ? editingId! : `dj_${Date.now()}`;
           const finalCover = djForm.coverUrl?.trim() ? djForm.coverUrl : getRandomCover(id);
           const newItem = { ...djForm, id, coverUrl: finalCover } as DJSet;
           setDjSets(prev => editMode ? prev.map(i => i.id === editingId ? newItem : i) : [newItem, ...prev]);
      }
      if (editingType === 'gallery') {
           const newItem = { ...galleryForm, id: editMode ? editingId! : `gal_${Date.now()}` } as GalleryItem;
           setGalleryItems(prev => editMode ? prev.map(i => i.id === editingId ? newItem : i) : [newItem, ...prev]);
      }
      if (editingType === 'article') {
          const newItem = { ...articleForm, id: editMode ? editingId! : `art_${Date.now()}` } as Article;
          setArticles(prev => editMode ? prev.map(i => i.id === editingId ? newItem : i) : [newItem, ...prev]);
      }
      setIsModalOpen(false);
      notify('success', '已保存到本地，请记得点击“保存更改”同步到云端。');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string, context: 'audio' | 'video' | 'dj' | 'gallery' | 'article') => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      const url = await cloudService.uploadFile(file);
      setIsUploading(false);
      if (url) {
          if (context === 'audio') setSongForm(prev => ({ ...prev, [field]: url }));
          if (context === 'video') setMvForm(prev => ({ ...prev, [field]: url }));
          if (context === 'dj') setDjForm(prev => ({ ...prev, [field]: url }));
          if (context === 'gallery') setGalleryForm(prev => ({ ...prev, [field]: url }));
          if (context === 'article') setArticleForm(prev => ({ ...prev, [field]: url }));
          notify('success', '文件上传成功');
      }
  };

  // --- EDITOR INSERTION LOGIC ---
  const insertTextAtCursor = (text: string) => {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const content = articleForm.content || '';
      const newContent = content.substring(0, start) + text + content.substring(end);
      setArticleForm({ ...articleForm, content: newContent });
      setTimeout(() => {
          textAreaRef.current?.focus();
          textAreaRef.current?.setSelectionRange(start + text.length, start + text.length);
      }, 50);
  };

  const openPicker = (type: 'image' | 'audio' | 'video', context: typeof pickerContext) => {
      setPickerType(type);
      setPickerContext(context);
      setPickerOpen(true);
  };

  const handlePickerSelect = (item: any) => {
      if (pickerContext === 'cover') {
          if (editingType === 'audio') setSongForm({ ...songForm, coverUrl: item.imageUrl });
          if (editingType === 'video') setMvForm({ ...mvForm, coverUrl: item.imageUrl });
          if (editingType === 'dj') setDjForm({ ...djForm, coverUrl: item.imageUrl });
          if (editingType === 'article') setArticleForm({ ...articleForm, coverUrl: item.imageUrl });
          if (editingType === 'gallery') setGalleryForm({ ...galleryForm, imageUrl: item.imageUrl });
      } else if (pickerContext === 'editor_image') {
          const html = `<img src="${item.imageUrl}" alt="${item.title}" class="rounded-2xl w-full my-6 shadow-xl border border-white/10" />`;
          insertTextAtCursor(html);
      } else if (pickerContext === 'editor_audio') {
          // Just set the linked song ID for the main player
          setArticleForm({ ...articleForm, linkedSongId: item.id });
          notify('success', `已关联音乐: ${item.title}`);
      } else if (pickerContext === 'editor_video') {
           const html = `<video src="${item.videoUrl}" controls class="rounded-2xl w-full my-6 shadow-xl border border-white/10"></video>`;
           insertTextAtCursor(html);
      }
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated && !authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-black/50 backdrop-blur-xl">
              <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95">
                  <div className="flex justify-center mb-6 text-brand-lime">
                      <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h2 className="text-2xl font-bold text-center text-white mb-6">后台管理验证</h2>
                  <input 
                      type="password" 
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-4 text-center text-white focus:border-brand-lime outline-none mb-4 tracking-widest"
                      placeholder="输入密钥"
                  />
                  <button onClick={handleLogin} className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl hover:bg-white transition-colors">
                      解锁系统
                  </button>
                  {connectionStatus === 'missing_config' && (
                      <p className="text-xs text-center text-gray-500 mt-4">请在 Cloudflare 后台配置 ADMIN_SECRET 环境变量。</p>
                  )}
              </div>
          </div>
      );
  }
  
  // Helper to find title for editor display
  const getLinkedSongTitle = (id?: string) => {
      if(!id) return null;
      const song = songs.find(s => s.id === id);
      if(song) return `(Song) ${song.title}`;
      const dj = djSets.find(d => d.id === id);
      if(dj) return `(DJ) ${dj.title}`;
      return 'Unknown ID';
  };

  // --- MAIN LAYOUT ---
  return (
    <div className="pb-40 animate-in fade-in duration-500 min-h-screen">
      
      <audio ref={previewAudioRef} onEnded={() => setPreviewPlaying(false)} onError={() => setPreviewPlaying(false)} className="hidden" />

      {/* --- HEADER --- */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
         <div>
             <h1 className="text-4xl font-display font-black text-white flex items-center gap-3">
                 <Layout className="w-8 h-8 text-brand-lime" /> 后台管理
             </h1>
             <p className="text-gray-400 mt-1 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                 {connectionStatus === 'connected' ? '云端服务在线' : '离线 / 配置错误'}
             </p>
         </div>

         <div className="flex items-center gap-3">
             <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center gap-2 border border-white/10 transition-all"
             >
                 {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudLightning className="w-4 h-4 text-brand-cyan" />}
                 {isSyncing ? '同步中...' : '保存更改 (Sync)'}
             </button>
         </div>
      </header>

      {/* --- TABS --- */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {[
            { id: 'media', label: '媒体库', icon: Database },
            { id: 'gallery', label: '画廊', icon: ImageIcon },
            { id: 'articles', label: '专栏', icon: FileText },
            { id: 'decoration', label: '页面装修', icon: Palette },
            { id: 'nav', label: '导航菜单', icon: Menu },
            { id: 'netdisk', label: '网盘资源', icon: HardDrive },
            { id: 'theme', label: '主题设置', icon: Settings2 },
          ].map(tab => (
              <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${activeTab === tab.id ? 'bg-brand-lime text-black border-brand-lime shadow-lg shadow-brand-lime/20' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
              >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="bg-[#050505] border border-white/5 rounded-[2.5rem] p-6 min-h-[600px] shadow-2xl relative overflow-hidden">
          
          {/* --- TAB: MEDIA (Audio/Video/DJ) --- */}
          {activeTab === 'media' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                      <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                          <button onClick={() => setMediaSubTab('audio')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mediaSubTab === 'audio' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>音乐 (Audio)</button>
                          <button onClick={() => setMediaSubTab('video')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mediaSubTab === 'video' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>视频 (Video)</button>
                          <button onClick={() => setMediaSubTab('dj')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mediaSubTab === 'dj' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'}`}>DJ Set</button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                           {/* Netease Scrape (DJ Only) */}
                           {mediaSubTab === 'dj' && (
                               <button 
                                  onClick={handleScrape}
                                  disabled={isScraping}
                                  className="px-4 py-2 bg-red-600/20 text-red-500 border border-red-600/30 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                               >
                                  {isScraping ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                                  网易云抓取
                               </button>
                           )}

                           {/* Health Check Button */}
                           <button 
                               onClick={() => {
                                   if(mediaSubTab === 'audio') handleHealthCheck(songs, '歌曲');
                                   else if(mediaSubTab === 'video') handleHealthCheck(mvs, 'MV');
                                   else handleHealthCheck(djSets, 'DJ Set');
                               }}
                               disabled={isCheckingLinks}
                               className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 rounded-lg flex items-center gap-2 font-bold transition-colors text-xs"
                           >
                               {isCheckingLinks ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                               检测失效链接
                           </button>

                           {brokenLinks.length > 0 && (
                               <button 
                                  onClick={() => {
                                      if(mediaSubTab === 'audio') handleAutoDelete(setSongs, songs);
                                      else if(mediaSubTab === 'video') handleAutoDelete(setMvs, mvs);
                                      else handleAutoDelete(setDjSets, djSets);
                                  }}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg flex items-center gap-2 font-bold transition-colors text-xs animate-pulse shadow-lg shadow-red-500/20"
                               >
                                  <Trash2 className="w-3 h-3" /> 一键清理失效 ({brokenLinks.length})
                               </button>
                           )}

                           <button 
                               onClick={() => handleCreate(mediaSubTab)}
                               className="px-4 py-2 bg-brand-lime text-black rounded-lg flex items-center gap-2 font-bold hover:bg-white transition-colors text-xs"
                           >
                               <Plus className="w-4 h-4" /> 新建项目
                           </button>
                      </div>
                  </div>

                  {/* List Content */}
                  <div className="grid gap-2">
                      {/* AUDIO & VIDEO LIST */}
                      {(mediaSubTab === 'audio' || mediaSubTab === 'video') && (mediaSubTab === 'audio' ? songs : mvs).map((item) => (
                          <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group border border-transparent hover:border-white/5 ${brokenLinks.includes(item.id) ? 'bg-red-900/10 border-red-500/30' : ''}`}>
                              <div className="flex items-center gap-4">
                                  <div className="relative w-10 h-10 rounded overflow-hidden bg-white/10 shrink-0 group/img">
                                      <img src={item.coverUrl} className="w-full h-full object-cover" />
                                      {mediaSubTab === 'audio' && (
                                          <div 
                                              onClick={() => handlePreview(item as Song)}
                                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity"
                                          >
                                              {previewId === item.id && previewPlaying ? <Pause className="w-4 h-4 text-brand-lime fill-current" /> : <Play className="w-4 h-4 text-white fill-current" />}
                                          </div>
                                      )}
                                  </div>
                                  <div className="min-w-0">
                                      <div className={`font-bold text-sm truncate ${brokenLinks.includes(item.id) ? 'text-red-400 line-through' : 'text-white'}`}>{item.title}</div>
                                      <div className="text-xs text-gray-500">{item.artist}</div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {brokenLinks.includes(item.id) && <span className="text-[10px] text-red-500 font-bold bg-red-900/50 px-2 py-0.5 rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 失效</span>}
                                  <button onClick={() => handleEdit(item, mediaSubTab)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(item.id, mediaSubTab)} className="p-2 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))}

                      {/* DJ SET LIST */}
                      {mediaSubTab === 'dj' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {djSets.map(set => (
                                  <div key={set.id} className={`bg-white/5 rounded-xl p-4 flex gap-4 hover:border-brand-pink/50 border border-transparent transition-all group ${brokenLinks.includes(set.id) ? 'bg-red-900/10 border-red-500' : ''}`}>
                                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black shrink-0 group/img">
                                          <img src={set.coverUrl} className="w-full h-full object-cover" />
                                          <div className="absolute top-1 left-1 bg-black/60 px-1 rounded text-[9px] font-bold text-white">{set.bpm} BPM</div>
                                          <div 
                                              onClick={() => handlePreview(set)}
                                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity"
                                          >
                                              {previewId === set.id && previewPlaying ? <Pause className="w-6 h-6 text-brand-pink fill-current" /> : <Play className="w-6 h-6 text-white fill-current" />}
                                          </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <h4 className={`font-bold truncate text-white mb-1 ${brokenLinks.includes(set.id) ? 'line-through text-red-400' : ''}`}>{set.title}</h4>
                                          <p className="text-xs text-gray-500 mb-2">{set.djName}</p>
                                          <div className="flex gap-2">
                                              <button onClick={() => handleEdit(set, 'dj')} className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-white hover:text-black transition-colors">编辑</button>
                                              <button onClick={() => handleDelete(set.id, 'dj')} className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-red-500 hover:text-white transition-colors">删除</button>
                                          </div>
                                          {set.neteaseId && (
                                              <div className="mt-1 flex items-center gap-1">
                                                   <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                   <span className="text-[9px] text-gray-500 uppercase">Netease</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))}
                           </div>
                      )}
                  </div>
              </div>
          )}

          {/* ... (REMAINING TABS LIKE GALLERY, ARTICLES, DECORATION, THEME, NETDISK KEEP AS IS) ... */}
          {activeTab === 'gallery' && (
             <div className="animate-in slide-in-from-right-4 duration-300">
                 <div className="flex justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">画廊管理</h2>
                    <button onClick={() => handleCreate('gallery')} className="px-4 py-2 bg-brand-cyan text-black rounded-lg font-bold hover:bg-white transition-colors text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> 添加图片</button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {galleryItems.map(item => (
                         <div key={item.id} className="relative aspect-square group rounded-xl overflow-hidden cursor-pointer" onClick={() => handleEdit(item, 'gallery')}>
                             <img src={item.imageUrl} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                 <p className="text-xs font-bold text-white px-2 text-center">{item.title}</p>
                                 <button onClick={(e) => {e.stopPropagation(); handleDelete(item.id, 'gallery')}} className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          )}

          {/* ... ARTICLES, NETDISK, DECORATION, THEME, NAV tabs ... */}
          {activeTab === 'netdisk' && (
              <Netdisk notify={notify} softwareItems={softwareItems} setSoftwareItems={setSoftwareItems} onSync={handleSync} />
          )}

          {activeTab === 'articles' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white">专栏文章</h2>
                      <button onClick={() => handleCreate('article')} className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-white hover:text-black transition-colors text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> 新建文章</button>
                  </div>
                  <div className="space-y-3">
                      {articles.map(art => (
                          <div key={art.id} className="bg-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-colors group">
                              <div className="w-16 h-12 rounded bg-black overflow-hidden shrink-0"><img src={art.coverUrl} className="w-full h-full object-cover" /></div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-white truncate">{art.title}</h4>
                                  <p className="text-xs text-gray-500">{art.author} • {art.date}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                                  <button onClick={() => handleEdit(art, 'article')} className="p-2 bg-black/50 rounded text-gray-300 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(art.id, 'article')} className="p-2 bg-red-900/50 rounded text-red-400 hover:text-red-200"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {activeTab === 'decoration' && (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6">页面装修 / Page Decoration</h2>
                  <div className="grid gap-8">
                      {Object.entries(pageHeaders).map(([key, config]) => (
                          <div key={key} className="bg-white/5 border border-white/5 rounded-2xl p-6">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-lg text-brand-lime uppercase tracking-wider">{key} Page</h3>
                                  <div className="px-2 py-1 bg-white/10 rounded text-[10px] text-gray-400 font-mono">ID: {key}</div>
                              </div>
                              <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase">主标题 (Title)</label>
                                          <input 
                                              value={config.title} 
                                              onChange={(e) => setPageHeaders(prev => ({ ...prev, [key]: { ...prev[key], title: e.target.value } }))}
                                              className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none mt-1" 
                                          />
                                      </div>
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase">副标题 (Subtitle)</label>
                                          <input 
                                              value={config.subtitle} 
                                              onChange={(e) => setPageHeaders(prev => ({ ...prev, [key]: { ...prev[key], subtitle: e.target.value } }))}
                                              className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none mt-1" 
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">页面描述 (Description)</label>
                                      <textarea 
                                          value={config.description} 
                                          onChange={(e) => setPageHeaders(prev => ({ ...prev, [key]: { ...prev[key], description: e.target.value } }))}
                                          className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none mt-1 h-20 resize-none" 
                                      />
                                  </div>
                                  {(key === View.HOME || key === View.CHARTS || key === View.DJ) && (
                                      <div>
                                          <label className="text-xs font-bold text-gray-500 uppercase">推荐内容ID (Featured Content)</label>
                                          <select 
                                             value={config.featuredItemId || ''}
                                             onChange={(e) => setPageHeaders(prev => ({ ...prev, [key]: { ...prev[key], featuredItemId: e.target.value } }))}
                                             className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none mt-1"
                                          >
                                              <option value="">-- 自动 / 默认 --</option>
                                              {key === View.DJ ? (
                                                  djSets.map(d => <option key={d.id} value={d.id}>DJ: {d.title}</option>)
                                              ) : (
                                                  songs.map(s => <option key={s.id} value={s.id}>Song: {s.title}</option>)
                                              )}
                                          </select>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'theme' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4">
                  <div>
                      <h3 className="font-bold text-white mb-4">预设主题</h3>
                      <div className="grid grid-cols-2 gap-4">
                          {THEMES.map(theme => (
                              <button 
                                key={theme.id}
                                onClick={() => setTheme(theme)}
                                className={`p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${currentTheme.id === theme.id ? 'border-brand-lime bg-white/5' : 'border-white/10 hover:border-white/30'}`}
                              >
                                  <div className="flex gap-2 mb-2">
                                      <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.primary }}></div>
                                      <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.secondary }}></div>
                                      <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.accent }}></div>
                                  </div>
                                  <span className="font-bold text-white">{theme.name}</span>
                                  {currentTheme.id === theme.id && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-brand-lime" />}
                              </button>
                          ))}
                      </div>
                  </div>
               </div>
          )}
          
          {activeTab === 'nav' && (
              <div className="max-w-xl animate-in slide-in-from-right-4">
                  <h3 className="font-bold text-white mb-4">菜单显示与排序</h3>
                  <div className="space-y-2">
                      {navItems.sort((a,b) => a.order - b.order).map((item, idx) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="font-bold text-gray-300">{item.label} <span className="text-xs text-gray-600 ml-2 uppercase">{item.subLabel}</span></span>
                              <div className="flex items-center gap-3">
                                  <button disabled={idx === 0} onClick={() => {
                                      const newItems = [...navItems];
                                      const temp = newItems[idx];
                                      newItems[idx] = newItems[idx-1];
                                      newItems[idx-1] = temp;
                                      newItems.forEach((it, i) => it.order = i);
                                      setNavItems(newItems);
                                  }} className="p-1 hover:text-white text-gray-500 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                  <button disabled={idx === navItems.length - 1} onClick={() => {
                                      const newItems = [...navItems];
                                      const temp = newItems[idx];
                                      newItems[idx] = newItems[idx+1];
                                      newItems[idx+1] = temp;
                                      newItems.forEach((it, i) => it.order = i);
                                      setNavItems(newItems);
                                  }} className="p-1 hover:text-white text-gray-500 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                  
                                  <div onClick={() => {
                                      const newItems = navItems.map(i => i.id === item.id ? { ...i, isVisible: !i.isVisible } : i);
                                      setNavItems(newItems);
                                  }} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${item.isVisible ? 'bg-brand-lime' : 'bg-gray-700'}`}>
                                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.isVisible ? 'left-6' : 'left-1'}`}></div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </div>

      {/* --- EDIT MODAL (GENERIC) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-8 animate-in zoom-in-95 custom-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-white capitalize">{editMode ? '编辑' : '新建'} {editingType === 'audio' ? '歌曲' : editingType === 'video' ? '视频' : editingType === 'gallery' ? '图片' : editingType === 'article' ? '文章' : 'DJ Set'}</h2>
                      <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-500 hover:text-white" /></button>
                  </div>
                  
                  <div className="space-y-6">
                      {/* Common Fields */}
                      {editingType !== 'gallery' && editingType !== 'article' && (
                          <div className="flex gap-4">
                                <div className="relative w-32 h-32 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10 group cursor-pointer hover:border-brand-lime/50 transition-colors">
                                    <img src={
                                        (editingType === 'audio' ? songForm.coverUrl : 
                                        editingType === 'video' ? mvForm.coverUrl : 
                                        djForm.coverUrl) || 'https://via.placeholder.com/400x400?text=Auto'
                                    } className="w-full h-full object-cover" />
                                    
                                    {/* Cover Image Action Overlay */}
                                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                        <div className="relative cursor-pointer hover:text-brand-lime text-xs font-bold text-gray-300">
                                            <Upload className="w-4 h-4 mx-auto mb-1" />
                                            上传
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'coverUrl', editingType as any)} />
                                        </div>
                                        <div className="w-full h-[1px] bg-white/20"></div>
                                        <button 
                                            onClick={() => openPicker('image', 'cover')}
                                            className="hover:text-brand-lime text-xs font-bold text-gray-300"
                                        >
                                            <ImageIcon className="w-4 h-4 mx-auto mb-1" />
                                            图库
                                        </button>
                                    </div>
                                    
                                    {isUploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-lime" /></div>}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">标题 (Title)</label>
                                        <input 
                                            value={editingType === 'audio' ? songForm.title : editingType === 'video' ? mvForm.title : djForm.title} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if(editingType === 'audio') setSongForm({...songForm, title: val});
                                                if(editingType === 'video') setMvForm({...mvForm, title: val});
                                                if(editingType === 'dj') setDjForm({...djForm, title: val});
                                            }}
                                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">{editingType === 'dj' ? 'DJ Name' : '艺术家 (Artist)'}</label>
                                        <input 
                                            value={editingType === 'audio' ? songForm.artist : editingType === 'video' ? mvForm.artist : djForm.djName} 
                                            onChange={e => {
                                                const val = e.target.value;
                                                if(editingType === 'audio') setSongForm({...songForm, artist: val});
                                                if(editingType === 'video') setMvForm({...mvForm, artist: val});
                                                if(editingType === 'dj') setDjForm({...djForm, djName: val});
                                            }}
                                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-lime outline-none" 
                                        />
                                    </div>
                                </div>
                          </div>
                      )}

                      {/* File Inputs */}
                      {(editingType === 'audio' || editingType === 'dj') && (
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">音频文件链接 (Audio URL)</label>
                              <div className="flex gap-2">
                                  <input 
                                      value={editingType === 'audio' ? songForm.fileUrl : djForm.fileUrl} 
                                      onChange={e => {
                                          const val = e.target.value;
                                          if(editingType === 'audio') setSongForm({...songForm, fileUrl: val});
                                          if(editingType === 'dj') setDjForm({...djForm, fileUrl: val});
                                      }}
                                      className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-white font-mono text-xs focus:border-brand-lime outline-none" 
                                      placeholder="https://..."
                                  />
                                  <div className="relative group">
                                      <button className="h-full px-4 bg-brand-pink text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-white hover:text-black transition-colors shadow-lg">
                                          <UploadCloud className="w-4 h-4" /> 上传/R2
                                          <input 
                                              type="file" 
                                              className="absolute inset-0 opacity-0 cursor-pointer" 
                                              accept="audio/*"
                                              onChange={(e) => handleFileUpload(e, 'fileUrl', editingType as any)} 
                                          />
                                      </button>
                                  </div>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1">支持：上传本地文件 (R2) / 外部直链 / 网易云链接。</p>
                          </div>
                      )}

                      {/* Video URL */}
                      {editingType === 'video' && (
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase">视频链接 (MP4 URL)</label>
                              <input 
                                  value={mvForm.videoUrl} 
                                  onChange={e => setMvForm({...mvForm, videoUrl: e.target.value})}
                                  className="w-full bg-black border border-white/10 rounded-lg p-2 text-white font-mono text-xs focus:border-brand-lime outline-none" 
                              />
                          </div>
                      )}
                      
                      {/* Gallery Fields - UPDATED */}
                      {editingType === 'gallery' && (
                          <div className="space-y-4">
                              <div className="relative aspect-video bg-black/50 border border-white/10 rounded-xl overflow-hidden group">
                                  {galleryForm.imageUrl ? <img src={galleryForm.imageUrl} className="w-full h-full object-contain" /> : <div className="flex items-center justify-center h-full text-gray-600">No Image</div>}
                                  
                                  {/* Upload Overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="relative px-4 py-2 bg-brand-cyan text-black rounded-lg font-bold text-sm hover:bg-white transition-colors">
                                          点击上传本地图片 (Upload)
                                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'imageUrl', 'gallery')} />
                                      </button>
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase">图片链接 (Image URL)</label>
                                  <div className="flex gap-2">
                                      <input 
                                        value={galleryForm.imageUrl || ''} 
                                        onChange={e => setGalleryForm({...galleryForm, imageUrl: e.target.value})} 
                                        placeholder="https://example.com/photo.jpg" 
                                        className="flex-1 bg-black border border-white/10 rounded-lg p-2 text-white text-xs font-mono focus:border-brand-cyan outline-none" 
                                      />
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-1">可直接粘贴外部图片链接，或点击上方图片区域上传。</p>
                              </div>

                              <input value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} placeholder="图片标题" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                              <input value={galleryForm.photographer} onChange={e => setGalleryForm({...galleryForm, photographer: e.target.value})} placeholder="摄影师" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                          </div>
                      )}

                      {/* Super Article Editor */}
                      {editingType === 'article' && (
                          <div className="space-y-4">
                               <div className="relative h-40 rounded-xl bg-black border border-white/10 overflow-hidden group">
                                   <img src={articleForm.coverUrl || 'https://via.placeholder.com/800x400?text=Cover'} className="w-full h-full object-cover opacity-60" />
                                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">文章封面</span>
                                       <div className="flex gap-4">
                                            <div className="relative px-4 py-2 bg-white text-black rounded-full font-bold text-xs cursor-pointer hover:bg-brand-lime">
                                                上传新图
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'coverUrl', 'article')} />
                                            </div>
                                            <button 
                                                onClick={() => openPicker('image', 'cover')}
                                                className="px-4 py-2 bg-transparent border border-white text-white rounded-full font-bold text-xs hover:bg-white hover:text-black transition-colors"
                                            >
                                                选择图库
                                            </button>
                                       </div>
                                   </div>
                               </div>

                               <input value={articleForm.title} onChange={e => setArticleForm({...articleForm, title: e.target.value})} placeholder="文章标题" className="w-full bg-black border border-white/10 rounded-lg p-3 text-xl font-bold text-white" />
                               
                               <div className="grid grid-cols-2 gap-4">
                                   <input value={articleForm.author} onChange={e => setArticleForm({...articleForm, author: e.target.value})} placeholder="作者" className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                                   <input value={articleForm.date} type="date" onChange={e => setArticleForm({...articleForm, date: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white" />
                               </div>
                               
                               <textarea value={articleForm.excerpt} onChange={e => setArticleForm({...articleForm, excerpt: e.target.value})} placeholder="摘要..." className="w-full bg-black border border-white/10 rounded-lg p-2 text-white h-20 resize-none" />
                               
                               {/* Rich Toolbar */}
                               <div className="border border-white/10 rounded-xl overflow-hidden">
                                   <div className="bg-white/5 border-b border-white/10 p-2 flex items-center gap-1 overflow-x-auto">
                                       <button onClick={() => insertTextAtCursor('<b></b>')} className="p-1.5 hover:bg-white/10 rounded text-gray-300" title="加粗"><Bold className="w-4 h-4" /></button>
                                       <button onClick={() => insertTextAtCursor('<i></i>')} className="p-1.5 hover:bg-white/10 rounded text-gray-300" title="斜体"><Italic className="w-4 h-4" /></button>
                                       <button onClick={() => insertTextAtCursor('<h1></h1>')} className="p-1.5 hover:bg-white/10 rounded text-gray-300" title="标题1"><Heading1 className="w-4 h-4" /></button>
                                       <button onClick={() => insertTextAtCursor('<h2></h2>')} className="p-1.5 hover:bg-white/10 rounded text-gray-300" title="标题2"><Heading2 className="w-4 h-4" /></button>
                                       <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
                                       
                                       {/* Media Insert Buttons */}
                                       <button 
                                          onClick={() => openPicker('image', 'editor_image')}
                                          className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-brand-cyan/20 text-gray-300 hover:text-brand-cyan rounded text-xs font-bold transition-colors"
                                       >
                                           <ImagePlus className="w-4 h-4" /> 插图
                                       </button>
                                       
                                       <button 
                                          onClick={() => openPicker('audio', 'editor_audio')}
                                          className={`flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-brand-lime/20 text-gray-300 hover:text-brand-lime rounded text-xs font-bold transition-colors ${articleForm.linkedSongId ? 'text-brand-lime border border-brand-lime/50' : ''}`}
                                       >
                                           <Music2 className="w-4 h-4" /> {articleForm.linkedSongId ? '更换BGM' : '关联BGM'}
                                       </button>

                                       <button 
                                          onClick={() => openPicker('video', 'editor_video')}
                                          className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-brand-pink/20 text-gray-300 hover:text-brand-pink rounded text-xs font-bold transition-colors"
                                       >
                                           <Film className="w-4 h-4" /> 插入视频
                                       </button>
                                   </div>
                                   <textarea 
                                       ref={textAreaRef}
                                       value={articleForm.content} 
                                       onChange={e => setArticleForm({...articleForm, content: e.target.value})} 
                                       placeholder="输入正文内容 (支持 HTML)..." 
                                       className="w-full bg-black p-4 text-white font-mono text-sm h-64 outline-none border-none resize-none" 
                                   />
                               </div>
                               
                               {/* Linked BGM Indicator */}
                               {articleForm.linkedSongId && (
                                   <div className="flex items-center gap-3 p-3 bg-brand-lime/10 border border-brand-lime/20 rounded-xl">
                                       <Music className="w-5 h-5 text-brand-lime" />
                                       <div className="flex-1">
                                           <p className="text-xs font-bold text-brand-lime">已关联背景音乐 (Hero Song)</p>
                                           <p className="text-[10px] text-gray-400">
                                               {getLinkedSongTitle(articleForm.linkedSongId)}
                                           </p>
                                       </div>
                                       <button onClick={() => setArticleForm({...articleForm, linkedSongId: undefined})} className="p-1 hover:bg-black/20 rounded text-brand-lime"><X className="w-4 h-4"/></button>
                                   </div>
                               )}
                          </div>
                      )}

                      <button onClick={handleSave} disabled={isUploading} className="w-full py-3 bg-brand-lime text-black font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2">
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          保存项目 (Save)
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MEDIA PICKER MODAL */}
      <MediaPicker 
         isOpen={pickerOpen} 
         onClose={() => setPickerOpen(false)}
         onSelect={handlePickerSelect}
         type={pickerType}
         data={{ images: galleryItems, songs, djSets, mvs }}
      />

    </div>
  );
};
