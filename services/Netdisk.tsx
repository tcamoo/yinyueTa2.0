
import React, { useState, useEffect, useRef } from 'react';
import { HardDrive, File, Music, Video, Image as ImageIcon, Trash2, Link, Download, UploadCloud, RefreshCw, Copy, Search, Grid, List, Plus, Server, Cloud, Globe, Smartphone, Monitor } from 'lucide-react';
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
    const [mode, setMode] = useState<'r2' | 'mounts'>('r2');
    
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
        if (mode === 'r2') loadFiles();
    }, [mode]);

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

    const formatSize = (bytes: number) => {
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
        if (!window.confirm('Remove this resource link?')) return;
        setSoftwareItems(prev => prev.filter(i => i.id !== id));
        notify('info', '链接已移除');
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
            
            {/* SIDEBAR NAVIGATION */}
            <div className="w-full md:w-64 flex flex-col gap-2">
                <button 
                    onClick={() => setMode('r2')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${mode === 'r2' ? 'bg-brand-lime/10 border-brand-lime text-brand-lime shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'bg-black border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <div className="p-2 bg-white/5 rounded-lg"><Server className="w-5 h-5" /></div>
                    <div>
                        <div className="font-bold text-sm">本地存储 (R2)</div>
                        <div className="text-[10px] opacity-70">Native Object Storage</div>
                    </div>
                </button>

                <button 
                    onClick={() => setMode('mounts')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${mode === 'mounts' ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'bg-black border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <div className="p-2 bg-white/5 rounded-lg"><Cloud className="w-5 h-5" /></div>
                    <div>
                        <div className="font-bold text-sm">外部资源挂载</div>
                        <div className="text-[10px] opacity-70">AliYun / OneDrive / Link</div>
                    </div>
                </button>

                {mode === 'mounts' && (
                     <div className="mt-4 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                         <strong>CloudDrive 配置指南：</strong><br/>
                         此模式模拟了 CloudDrive 的挂载功能。您可以在此添加来自阿里云盘、OneDrive 的分享链接或直链。前端会生成漂亮的下载卡片。
                     </div>
                )}
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* --- R2 MODE UI --- */}
                {mode === 'r2' && (
                    <>
                        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                <HardDrive className="w-4 h-4" />
                                <span>/root</span>
                                <span className="bg-white/10 px-2 rounded text-white">{files.length} files</span>
                                <span>{formatSize(totalSize)}</span>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-lg py-2 pl-10 text-xs text-white focus:border-brand-lime outline-none" 
                                        placeholder="Filter..."
                                    />
                                </div>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'text-white' : 'text-gray-500'}`}><Grid className="w-4 h-4" /></button>
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'text-white' : 'text-gray-500'}`}><List className="w-4 h-4" /></button>
                                <button onClick={loadFiles} className={`p-2 hover:bg-white/10 rounded ${loading ? 'animate-spin' : ''}`}><RefreshCw className="w-4 h-4" /></button>
                                <button onClick={() => uploadInputRef.current?.click()} className="px-3 py-1.5 bg-brand-lime text-black text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-colors">
                                    {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />} Upload
                                </button>
                                <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                             {loading ? (
                                 <div className="h-full flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-gray-600" /></div>
                             ) : (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {filteredFiles.map((file) => (
                                            <div 
                                                key={file.key} 
                                                onClick={() => setSelectedFile(file)}
                                                className={`group relative aspect-square bg-black border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedFile?.key === file.key ? 'border-brand-lime bg-brand-lime/5' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                <div className="w-10 h-10 opacity-80 group-hover:opacity-100">{getFileIcon(file.key)}</div>
                                                <div className="text-center w-full overflow-hidden">
                                                    <p className={`text-[10px] font-bold truncate px-1 ${selectedFile?.key === file.key ? 'text-brand-lime' : 'text-gray-400'}`}>{file.key}</p>
                                                    <p className="text-[9px] text-gray-600 font-mono">{formatSize(file.size)}</p>
                                                </div>
                                                <div className="absolute top-2 right-2 text-[8px] bg-white/10 px-1 rounded text-gray-500">{getFileTypeLabel(file.key)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredFiles.map(file => (
                                            <div key={file.key} onClick={() => setSelectedFile(file)} className={`grid grid-cols-12 gap-2 px-3 py-2 rounded text-xs cursor-pointer items-center ${selectedFile?.key === file.key ? 'bg-brand-lime/10 text-brand-lime' : 'hover:bg-white/5 text-gray-400'}`}>
                                                <div className="col-span-8 flex items-center gap-2 truncate">
                                                    <div className="w-4 h-4">{getFileIcon(file.key)}</div>
                                                    <span>{file.key}</span>
                                                </div>
                                                <div className="col-span-2 text-right font-mono opacity-70">{formatSize(file.size)}</div>
                                                <div className="col-span-2 text-right opacity-50">{formatDate(file.uploaded).split(' ')[0]}</div>
                                            </div>
                                        ))}
                                    </div>
                                )
                             )}
                        </div>

                        {/* R2 Detail Footer */}
                        {selectedFile && (
                            <div className="h-16 border-t border-white/5 bg-black px-6 flex items-center justify-between">
                                <div className="text-xs text-gray-400 font-mono flex gap-4">
                                    <span>{selectedFile.key}</span>
                                    <span className="text-gray-600">{formatSize(selectedFile.size)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => copyLink(selectedFile.url)} className="p-2 hover:bg-white/10 rounded text-gray-300" title="Copy Link"><Copy className="w-4 h-4" /></button>
                                    <a href={selectedFile.url} target="_blank" className="p-2 hover:bg-white/10 rounded text-gray-300" title="Download"><Download className="w-4 h-4" /></a>
                                    <button onClick={() => handleDelete(selectedFile.key)} className="p-2 hover:bg-red-900/30 text-red-500 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* --- MOUNTS MODE UI --- */}
                {mode === 'mounts' && (
                    <>
                        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-brand-cyan" /> 资源列表</h2>
                            <button 
                                onClick={() => { setEditingMountId(null); setMountForm({ provider: 'aliyun', platform: 'win', isOfficial: true }); setMountModalOpen(true); }}
                                className="px-4 py-2 bg-brand-cyan text-black font-bold rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-sm"
                            >
                                <Plus className="w-4 h-4" /> 添加挂载
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 gap-4">
                                {softwareItems.map(item => (
                                    <div key={item.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-brand-cyan/50 transition-colors group">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shrink-0 ${item.provider === 'aliyun' ? 'bg-orange-500/10 text-orange-500' : item.provider === 'onedrive' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-800 text-gray-400'}`}>
                                            {item.provider === 'aliyun' ? 'Ali' : item.provider === 'onedrive' ? 'OD' : 'R2'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-white truncate">{item.name}</h3>
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">{item.version}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                                <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {item.size}</span>
                                                <span className="flex items-center gap-1">
                                                    {item.platform === 'win' && <Monitor className="w-3 h-3" />}
                                                    {item.platform === 'mobile' && <Smartphone className="w-3 h-3" />}
                                                    {item.platform.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                                            <button onClick={() => openEditMount(item)} className="p-2 hover:bg-white/10 rounded text-gray-300"><RefreshCw className="w-4 h-4" /></button>
                                            <button onClick={() => deleteMount(item.id)} className="p-2 hover:bg-red-900/20 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {softwareItems.length === 0 && (
                                    <div className="text-center py-20 text-gray-600">
                                        <Cloud className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>暂无挂载资源。点击右上角添加。</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* --- MOUNT EDIT MODAL --- */}
                {mountModalOpen && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-[#111] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-in zoom-in-95">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white">配置外部资源链接</h3>
                                <button onClick={() => setMountModalOpen(false)}><Trash2 className="w-5 h-5 text-gray-500 hover:text-white" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Provider</label>
                                        <select 
                                            value={mountForm.provider} 
                                            onChange={e => setMountForm({...mountForm, provider: e.target.value as any})}
                                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-brand-cyan outline-none mt-1"
                                        >
                                            <option value="aliyun">阿里云盘 (AliYun)</option>
                                            <option value="onedrive">OneDrive</option>
                                            <option value="r2">Cloudflare R2</option>
                                            <option value="google">Google Drive</option>
                                            <option value="other">Other Link</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Platform</label>
                                        <select 
                                            value={mountForm.platform} 
                                            onChange={e => setMountForm({...mountForm, platform: e.target.value as any})}
                                            className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white focus:border-brand-cyan outline-none mt-1"
                                        >
                                            <option value="win">Windows</option>
                                            <option value="mac">macOS</option>
                                            <option value="linux">Linux</option>
                                            <option value="mobile">Mobile (iOS/Android)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Software Name</label>
                                    <input type="text" value={mountForm.name} onChange={e => setMountForm({...mountForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-cyan outline-none mt-1" placeholder="e.g. Ableton Live" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Version</label>
                                        <input type="text" value={mountForm.version} onChange={e => setMountForm({...mountForm, version: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-cyan outline-none mt-1" placeholder="v1.0.0" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Size</label>
                                        <input type="text" value={mountForm.size} onChange={e => setMountForm({...mountForm, size: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-cyan outline-none mt-1" placeholder="500 MB" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Direct Link / Share Link</label>
                                    <input type="text" value={mountForm.downloadUrl} onChange={e => setMountForm({...mountForm, downloadUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-cyan outline-none mt-1 font-mono text-xs" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold">Description</label>
                                    <textarea value={mountForm.description} onChange={e => setMountForm({...mountForm, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg p-2 text-white focus:border-brand-cyan outline-none mt-1 h-20 text-sm" />
                                </div>
                            </div>
                            <div className="p-6 pt-0">
                                <button onClick={handleSaveMount} className="w-full py-3 bg-brand-cyan text-black font-bold rounded-xl hover:bg-white transition-colors">
                                    {editingMountId ? '更新资源信息' : '添加挂载'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
