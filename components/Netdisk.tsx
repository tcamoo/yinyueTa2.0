
import React, { useState, useEffect, useRef } from 'react';
import { HardDrive, File, Music, Video, Image as ImageIcon, Trash2, Link, Download, UploadCloud, RefreshCw, Copy, Search, Grid, List, Plus, Server, Cloud, Globe, Smartphone, Monitor, Database, Activity, Folder, ChevronRight, Save } from 'lucide-react';
import { cloudService, R2File } from '../services/cloudService';
import { SoftwareItem } from '../types';

interface NetdiskProps {
    notify: (type: 'success' | 'error' | 'info', message: string) => void;
    softwareItems: SoftwareItem[];
    setSoftwareItems: React.Dispatch<React.SetStateAction<SoftwareItem[]>>;
    onSync: () => void;
}

export const Netdisk: React.FC<NetdiskProps> = ({ notify, softwareItems, setSoftwareItems, onSync }) => {
    // --- MODE: R2 vs MOUNTED ---
    const [activeDrive, setActiveDrive] = useState<'r2' | 'mounts'>('r2');
    
    // --- R2 STATE ---
    const [files, setFiles] = useState<R2File[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<R2File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // --- MOUNT STATE ---
    const [mountModalOpen, setMountModalOpen] = useState(false);
    const [mountForm, setMountForm] = useState<Partial<SoftwareItem>>({
        provider: 'aliyun',
        platform: 'win',
        isOfficial: true
    });
    const [editingMountId, setEditingMountId] = useState<string | null>(null);

    // Load R2
    const loadFiles = async () => {
        if (activeDrive !== 'r2') return;
        setLoading(true);
        try {
            const data = await cloudService.listStorage();
            const sorted = data.files.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
            setFiles(sorted);
        } catch (e: any) {
            notify('error', '加载文件列表失败: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [activeDrive]);

    // --- R2 HANDLERS ---
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;
        
        setUploading(true);
        let successCount = 0;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            const url = await cloudService.uploadFile(file);
            if (url) successCount++;
        }

        setUploading(false);
        notify('success', `成功上传 ${successCount} 个文件`);
        loadFiles();
        if(uploadInputRef.current) uploadInputRef.current.value = '';
    };

    const handleDelete = async (key: string) => {
        if (!window.confirm('确定要永久删除此文件吗？此操作无法撤销。')) return;
        try {
            await cloudService.deleteStorage(key);
            notify('success', '文件已删除');
            setFiles(prev => prev.filter(f => f.key !== key));
            if (selectedFile?.key === key) setSelectedFile(null);
        } catch (e) {
            notify('error', '删除失败');
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        notify('success', '链接已复制到剪贴板');
    };

    const formatSize = (bytes: number | string) => {
        if (typeof bytes === 'string') return bytes; // For manually entered sizes
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('zh-CN', { hour12: false });

    // --- MOUNT HANDLERS ---
    const handleSaveMount = () => {
        const newItem: SoftwareItem = {
            id: editingMountId || `soft_${Date.now()}`,
            name: mountForm.name || 'Unknown App',
            version: mountForm.version || '1.0',
            description: mountForm.description || '',
            platform: mountForm.platform || 'win',
            size: mountForm.size || 'Unknown',
            provider: mountForm.provider || 'other',
            downloadUrl: mountForm.downloadUrl || '#',
            updateDate: new Date().toISOString().split('T')[0],
            isOfficial: mountForm.isOfficial
        };

        if (editingMountId) {
            setSoftwareItems(prev => prev.map(p => p.id === editingMountId ? newItem : p));
        } else {
            setSoftwareItems(prev => [newItem, ...prev]);
        }
        
        setMountModalOpen(false);
        setEditingMountId(null);
        setMountForm({ provider: 'aliyun', platform: 'win', isOfficial: true });
        notify('success', '资源挂载成功');
        setTimeout(onSync, 500); // Trigger Cloud Sync
    };

    const deleteMount = (id: string) => {
        if (!window.confirm('移除此挂载点？这将从前台隐藏该资源。')) return;
        setSoftwareItems(prev => prev.filter(i => i.id !== id));
        notify('info', '挂载已移除');
        setTimeout(onSync, 500);
    };

    const openEditMount = (item: SoftwareItem) => {
        setEditingMountId(item.id);
        setMountForm(item);
        setMountModalOpen(true);
    };

    // Helper to get Icon
    const getFileIcon = (key: string) => {
        const ext = key.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className="w-full h-full text-brand-cyan" />;
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext || '')) return <Music className="w-full h-full text-brand-lime" />;
        if (['mp4', 'webm', 'mov'].includes(ext || '')) return <Video className="w-full h-full text-brand-pink" />;
        return <File className="w-full h-full text-gray-400" />;
    };

    const getFileTypeLabel = (key: string) => key.split('.').pop()?.toUpperCase() || 'FILE';

    const filteredFiles = files.filter(f => f.key.toLowerCase().includes(searchTerm.toLowerCase()));

    // Total Stats
    const totalSize = files.reduce((acc, curr) => acc + curr.size, 0);

    return (
        <div className="h-[calc(100vh-250px)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
            
            {/* LEFT SIDEBAR: DRIVES & POOLS (CloudDrive Style) */}
            <div className="w-full md:w-72 flex flex-col gap-4 bg-white/[0.02] border border-white/5 rounded-3xl p-4">
                <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/5">
                    <Server className="w-4 h-4 text-brand-lime" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">MOUNT POINTS</span>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Local R2 Drive */}
                    <button 
                        onClick={() => setActiveDrive('r2')}
                        className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left group ${activeDrive === 'r2' ? 'bg-brand-lime/10 border-brand-lime text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                        <div className={`p-2 rounded-lg ${activeDrive === 'r2' ? 'bg-brand-lime text-black' : 'bg-white/10 text-gray-400'}`}>
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">Local Storage</div>
                            <div className="text-[10px] opacity-70 truncate">Cloudflare R2 Bucket</div>
                        </div>
                        {activeDrive === 'r2' && <div className="w-2 h-2 rounded-full bg-brand-lime animate-pulse"></div>}
                    </button>

                    {/* External Mounts Section Header */}
                    <div className="mt-4 px-2 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-600 uppercase">Cloud Mounts ({softwareItems.length})</span>
                         <button 
                            onClick={() => { setEditingMountId(null); setMountForm({ provider: 'aliyun', platform: 'win', isOfficial: true }); setMountModalOpen(true); }}
                            className="p-1 hover:bg-white/10 rounded text-brand-cyan transition-colors"
                         >
                            <Plus className="w-3 h-3" />
                         </button>
                    </div>

                    {/* Mount Items */}
                    <button 
                        onClick={() => setActiveDrive('mounts')}
                        className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left group ${activeDrive === 'mounts' ? 'bg-brand-cyan/10 border-brand-cyan text-white' : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                        <div className={`p-2 rounded-lg ${activeDrive === 'mounts' ? 'bg-brand-cyan text-black' : 'bg-white/10 text-gray-400'}`}>
                            <Globe className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">External Resources</div>
                            <div className="text-[10px] opacity-70 truncate">AliYun / OneDrive / URL</div>
                        </div>
                        {activeDrive === 'mounts' && <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></div>}
                    </button>
                </div>

                {/* Status Bar */}
                {activeDrive === 'r2' && (
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-2 uppercase font-bold">
                            <span>Usage</span>
                            <span>{formatSize(totalSize)}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand-lime to-brand-cyan w-1/4"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* --- R2 FILE BROWSER --- */}
                {activeDrive === 'r2' && (
                    <>
                        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <span className="text-brand-lime font-mono font-bold">root://</span>
                                <span className="px-2 py-0.5 bg-white/5 rounded text-gray-500 text-xs">Read-Write</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-48 hidden md:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-full py-1.5 pl-8 text-xs text-white focus:border-brand-lime outline-none" 
                                        placeholder="Search files..."
                                    />
                                </div>
                                <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Grid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
                                <button onClick={loadFiles} className={`p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white ${loading ? 'animate-spin' : ''}`}><RefreshCw className="w-4 h-4" /></button>
                                <button onClick={() => uploadInputRef.current?.click()} className="ml-2 px-4 py-1.5 bg-brand-lime text-black text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-colors shadow-lg shadow-brand-lime/10">
                                    {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />} Upload
                                </button>
                                <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
                             {loading ? (
                                 <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500 font-mono">
                                     <div className="w-12 h-12 border-2 border-white/10 border-t-brand-lime rounded-full animate-spin"></div>
                                     <p>Syncing Object Storage...</p>
                                 </div>
                             ) : files.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                    <Folder className="w-16 h-16 opacity-20 mb-4" />
                                    <p>Bucket is empty</p>
                                </div>
                             ) : (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {filteredFiles.map((file) => (
                                            <div 
                                                key={file.key} 
                                                onClick={() => setSelectedFile(file)}
                                                className={`group relative aspect-[4/5] bg-[#0a0a0a] border rounded-xl p-3 flex flex-col items-center gap-3 cursor-pointer transition-all hover:-translate-y-1 ${selectedFile?.key === file.key ? 'border-brand-lime shadow-[0_0_20px_rgba(204,255,0,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="flex-1 w-full flex items-center justify-center bg-white/[0.02] rounded-lg w-full">
                                                    <div className="w-10 h-10 opacity-70 group-hover:opacity-100 transition-opacity">{getFileIcon(file.key)}</div>
                                                </div>
                                                <div className="text-center w-full">
                                                    <p className={`text-[10px] font-bold truncate w-full ${selectedFile?.key === file.key ? 'text-brand-lime' : 'text-gray-300'}`}>{file.key}</p>
                                                    <p className="text-[9px] text-gray-600 font-mono mt-0.5">{formatSize(file.size)}</p>
                                                </div>
                                                <div className="absolute top-2 right-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-500 font-bold tracking-wider">{getFileTypeLabel(file.key)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-white/5">
                                            <div className="col-span-6">Filename</div>
                                            <div className="col-span-2 text-right">Size</div>
                                            <div className="col-span-4 text-right">Date Modified</div>
                                        </div>
                                        {filteredFiles.map(file => (
                                            <div key={file.key} onClick={() => setSelectedFile(file)} className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg text-xs cursor-pointer items-center transition-colors ${selectedFile?.key === file.key ? 'bg-brand-lime/10 text-brand-lime' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
                                                <div className="col-span-6 flex items-center gap-3 truncate">
                                                    <div className="w-4 h-4 shrink-0">{getFileIcon(file.key)}</div>
                                                    <span className="truncate">{file.key}</span>
                                                </div>
                                                <div className="col-span-2 text-right font-mono opacity-70">{formatSize(file.size)}</div>
                                                <div className="col-span-4 text-right opacity-50 font-mono">{formatDate(file.uploaded)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                             )}
                        </div>

                        {/* Footer Details Panel */}
                        {selectedFile && (
                            <div className="h-16 border-t border-white/5 bg-[#050505] px-6 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-4">
                                     <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                         {getFileIcon(selectedFile.key)}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="text-xs font-bold text-white truncate max-w-[200px]">{selectedFile.key}</span>
                                         <span className="text-[10px] text-gray-500 font-mono">{formatSize(selectedFile.size)}</span>
                                     </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => copyLink(selectedFile.url)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded text-xs text-gray-300 transition-colors border border-white/5">
                                        <Copy className="w-3 h-3" /> Copy Link
                                    </button>
                                    <a href={selectedFile.url} target="_blank" className="flex items-center gap-2 px-3 py-1.5 hover:bg-brand-cyan/10 hover:text-brand-cyan rounded text-xs text-gray-300 transition-colors border border-white/5">
                                        <Download className="w-3 h-3" /> Download
                                    </a>
                                    <button onClick={() => handleDelete(selectedFile.key)} className="p-2 hover:bg-red-900/30 text-red-500 rounded transition-colors border border-transparent hover:border-red-900/50">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* --- MOUNTS MANAGER UI --- */}
                {activeDrive === 'mounts' && (
                    <>
                        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <span className="text-brand-cyan font-mono font-bold">mounts://</span>
                                <span className="px-2 py-0.5 bg-white/5 rounded text-gray-500 text-xs">External Links</span>
                            </div>
                            <button 
                                onClick={() => { setEditingMountId(null); setMountForm({ provider: 'aliyun', platform: 'win', isOfficial: true }); setMountModalOpen(true); }}
                                className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-xs shadow-lg shadow-brand-cyan/20"
                            >
                                <Plus className="w-4 h-4" /> Mount New Resource
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-black/20">
                            <div className="grid grid-cols-1 gap-4">
                                {softwareItems.map(item => (
                                    <div key={item.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex items-center gap-6 hover:border-brand-cyan/30 transition-all group hover:bg-white/[0.02]">
                                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0 shadow-lg border border-white/5 ${
                                            item.provider === 'aliyun' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                            item.provider === 'onedrive' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                                            item.provider === 'r2' ? 'bg-brand-lime/10 text-brand-lime border-brand-lime/20' :
                                            'bg-gray-800 text-gray-400'
                                        }`}>
                                            <Globe className="w-5 h-5 mb-1 opacity-80" />
                                            {item.provider === 'aliyun' ? 'Ali' : item.provider === 'onedrive' ? 'OD' : item.provider === 'r2' ? 'R2' : 'URL'}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-white text-base truncate group-hover:text-brand-cyan transition-colors">{item.name}</h3>
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">{item.version}</span>
                                                {item.isOfficial && <span className="text-[10px] text-brand-lime font-bold border border-brand-lime/20 px-1 rounded">OFFICIAL</span>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                                                <span className="flex items-center gap-1.5"><Database className="w-3 h-3" /> {item.size || 'Unknown Size'}</span>
                                                <span className="flex items-center gap-1.5 text-gray-400">
                                                    {item.platform === 'win' ? <Monitor className="w-3 h-3" /> : item.platform === 'mobile' ? <Smartphone className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                                                    {item.platform.toUpperCase()}
                                                </span>
                                                <span className="text-gray-600">Updated: {item.updateDate}</span>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                                            <button onClick={() => openEditMount(item)} className="p-2.5 bg-white/5 hover:bg-white hover:text-black rounded-lg text-gray-400 transition-colors"><RefreshCw className="w-4 h-4" /></button>
                                            <button onClick={() => deleteMount(item.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {softwareItems.length === 0 && (
                                    <div className="text-center py-24 text-gray-600 flex flex-col items-center">
                                        <Cloud className="w-16 h-16 mb-4 opacity-10" />
                                        <p className="text-lg font-bold">No mounts configured</p>
                                        <p className="text-sm mt-1">Add external resources to display them on the download page.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* --- MOUNT CONFIG MODAL --- */}
                {mountModalOpen && (
                    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-[#0f0f0f] w-full max-w-2xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Server className="w-5 h-5 text-brand-cyan" /> 
                                        {editingMountId ? 'Edit Mount Point' : 'New Cloud Mount'}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Configure external resource link for public access.</p>
                                </div>
                                <button onClick={() => setMountModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Trash2 className="w-5 h-5 text-gray-500 hover:text-red-500" /></button>
                            </div>
                            
                            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                                {/* Row 1 */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-brand-cyan font-bold uppercase tracking-widest">Storage Provider</label>
                                        <div className="relative">
                                            <select 
                                                value={mountForm.provider} 
                                                onChange={e => setMountForm({...mountForm, provider: e.target.value as any})}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-cyan outline-none appearance-none"
                                            >
                                                <option value="aliyun">阿里云盘 (AliYun)</option>
                                                <option value="onedrive">OneDrive</option>
                                                <option value="r2">Cloudflare R2</option>
                                                <option value="google">Google Drive</option>
                                                <option value="other">Other / Direct Link</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-brand-cyan font-bold uppercase tracking-widest">Target Platform</label>
                                        <div className="relative">
                                            <select 
                                                value={mountForm.platform} 
                                                onChange={e => setMountForm({...mountForm, platform: e.target.value as any})}
                                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-cyan outline-none appearance-none"
                                            >
                                                <option value="win">Windows</option>
                                                <option value="mac">macOS</option>
                                                <option value="linux">Linux</option>
                                                <option value="mobile">Mobile (iOS/Android)</option>
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Resource Name</label>
                                    <input type="text" value={mountForm.name} onChange={e => setMountForm({...mountForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none font-bold text-lg placeholder:text-gray-700" placeholder="e.g. Ableton Live 12 Suite" />
                                </div>

                                {/* Row 3 */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Version Tag</label>
                                        <input type="text" value={mountForm.version} onChange={e => setMountForm({...mountForm, version: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none font-mono text-sm" placeholder="v12.0.5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total Size</label>
                                        <input type="text" value={mountForm.size} onChange={e => setMountForm({...mountForm, size: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none font-mono text-sm" placeholder="2.8 GB" />
                                    </div>
                                </div>

                                {/* Row 4 */}
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Public Share Link (URL)</label>
                                    <div className="relative">
                                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-cyan" />
                                        <input type="text" value={mountForm.downloadUrl} onChange={e => setMountForm({...mountForm, downloadUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-brand-cyan focus:border-brand-cyan outline-none font-mono text-xs" placeholder="https://www.aliyundrive.com/s/..." />
                                    </div>
                                </div>

                                {/* Row 5 */}
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">Description</label>
                                    <textarea value={mountForm.description} onChange={e => setMountForm({...mountForm, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-gray-300 focus:border-brand-cyan outline-none h-24 text-sm leading-relaxed resize-none" placeholder="Add release notes or installation instructions..." />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="official" 
                                        checked={mountForm.isOfficial} 
                                        onChange={e => setMountForm({...mountForm, isOfficial: e.target.checked})}
                                        className="w-4 h-4 rounded border-gray-600 text-brand-cyan bg-black focus:ring-brand-cyan"
                                    />
                                    <label htmlFor="official" className="text-sm text-gray-400 select-none">Mark as Official / Verified Resource</label>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-white/[0.02] border-t border-white/5">
                                <button onClick={handleSaveMount} className="w-full py-4 bg-brand-cyan text-black font-black text-lg rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] flex items-center justify-center gap-2">
                                    <Save className="w-5 h-5" />
                                    {editingMountId ? 'Save Changes' : 'Mount Resource'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
