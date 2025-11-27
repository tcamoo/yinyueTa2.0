
import React, { useState, useEffect, useRef } from 'react';
import { HardDrive, File, Music, Video, Image as ImageIcon, Trash2, Link, Download, UploadCloud, RefreshCw, Copy, Search, Grid, List, Plus, Server, Cloud, Globe, Smartphone, Monitor, Database, Activity, Folder, ChevronRight, Save, ExternalLink, MoreVertical, LayoutGrid, Check, Settings } from 'lucide-react';
import { cloudService, R2File } from '../services/cloudService';
import { SoftwareItem } from '../types';

interface NetdiskProps {
    notify: (type: 'success' | 'error' | 'info', message: string) => void;
    softwareItems: SoftwareItem[];
    setSoftwareItems: React.Dispatch<React.SetStateAction<SoftwareItem[]>>;
    onSync: () => void;
}

export const Netdisk: React.FC<NetdiskProps> = ({ notify, softwareItems, setSoftwareItems, onSync }) => {
    // --- STATE ---
    const [activeDrive, setActiveDrive] = useState<string>('r2'); // 'r2' or softwareItem.id
    
    // R2 Data
    const [files, setFiles] = useState<R2File[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // UI State
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // Mount Modal
    const [mountModalOpen, setMountModalOpen] = useState(false);
    const [mountForm, setMountForm] = useState<Partial<SoftwareItem>>({
        provider: 'aliyun',
        platform: 'win',
        isOfficial: true
    });
    const [editingMountId, setEditingMountId] = useState<string | null>(null);

    // --- LOAD DATA ---
    const loadFiles = async () => {
        if (activeDrive !== 'r2') return;
        setLoading(true);
        try {
            const data = await cloudService.listStorage();
            // Sort by date desc
            const sorted = data.files.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
            setFiles(sorted);
        } catch (e: any) {
            notify('error', '无法连接至对象存储: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeDrive === 'r2') {
            loadFiles();
        }
        setSelectedFileIds(new Set()); // Reset selection on drive change
    }, [activeDrive]);

    // --- ACTIONS ---
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
        if (!window.confirm('确定要永久删除此文件吗？')) return;
        try {
            await cloudService.deleteStorage(key);
            notify('success', '文件已删除');
            setFiles(prev => prev.filter(f => f.key !== key));
            const newSet = new Set(selectedFileIds);
            newSet.delete(key);
            setSelectedFileIds(newSet);
        } catch (e) {
            notify('error', '删除失败');
        }
    };

    const handleBatchDelete = async () => {
        const count = selectedFileIds.size;
        if (count === 0) return;
        if (!window.confirm(`确定要删除选中的 ${count} 个文件吗？`)) return;
        
        setLoading(true);
        for (const key of selectedFileIds) {
            try {
                await cloudService.deleteStorage(key);
            } catch(e) { console.error(e) }
        }
        notify('success', '批量删除完成');
        loadFiles();
        setSelectedFileIds(new Set());
        setLoading(false);
    };

    const toggleSelection = (key: string, multi: boolean) => {
        const newSet = multi ? new Set(selectedFileIds) : new Set<string>();
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedFileIds(newSet);
    };

    // --- MOUNT ACTIONS ---
    const handleSaveMount = () => {
        const newItem: SoftwareItem = {
            id: editingMountId || `drive_${Date.now()}`,
            name: mountForm.name || 'New Network Drive',
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
        notify('success', '网络驱动器已映射');
        setTimeout(onSync, 500);
    };

    const deleteMount = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('断开此网络驱动器的连接？')) return;
        setSoftwareItems(prev => prev.filter(i => i.id !== id));
        if (activeDrive === id) setActiveDrive('r2');
        setTimeout(onSync, 500);
    };

    // --- HELPERS ---
    const formatSize = (bytes: number | string) => {
        if (typeof bytes === 'string') return bytes;
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    const getFileIcon = (key: string) => {
        const ext = key.split('.').pop()?.toLowerCase();
        if (['jpg', 'png', 'gif', 'webp'].includes(ext || '')) return <ImageIcon className="text-brand-cyan" />;
        if (['mp3', 'wav', 'flac'].includes(ext || '')) return <Music className="text-brand-lime" />;
        if (['mp4', 'mov'].includes(ext || '')) return <Video className="text-brand-pink" />;
        return <File className="text-gray-400" />;
    };

    // Filter Files
    const filteredFiles = files.filter(f => f.key.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Determine active item (Drive or Mount)
    const activeMount = softwareItems.find(s => s.id === activeDrive);

    return (
        <div className="flex h-[calc(100vh-200px)] bg-[#050505] border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
            
            {/* SIDEBAR: DRIVES */}
            <div className="w-64 bg-white/[0.02] border-r border-white/5 flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <span className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Storage</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    <p className="px-3 py-2 text-[10px] font-bold text-gray-600 uppercase">Local Locations</p>
                    <button 
                        onClick={() => setActiveDrive('r2')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${activeDrive === 'r2' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <HardDrive className={`w-4 h-4 ${activeDrive === 'r2' ? 'text-brand-lime' : ''}`} />
                        R2 Bucket (Cloud)
                    </button>

                    <div className="mt-6 flex items-center justify-between px-3 py-2">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">Network Drives</span>
                        <button onClick={() => { setEditingMountId(null); setMountModalOpen(true); }} className="hover:text-white text-gray-500 transition-colors">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    
                    {softwareItems.map(item => (
                        <div key={item.id} className="group relative">
                            <button 
                                onClick={() => setActiveDrive(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium pr-8 ${activeDrive === item.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Globe className={`w-4 h-4 ${activeDrive === item.id ? 'text-brand-cyan' : ''}`} />
                                <span className="truncate">{item.name}</span>
                            </button>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditingMountId(item.id); setMountForm(item); setMountModalOpen(true); }} className="p-1 hover:text-white text-gray-500"><Settings className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))}
                    
                    {softwareItems.length === 0 && (
                        <div className="px-3 py-4 text-center border-2 border-dashed border-white/5 rounded-lg text-gray-600 text-xs cursor-pointer hover:border-brand-cyan/30 hover:text-brand-cyan transition-colors" onClick={() => setMountModalOpen(true)}>
                            <Plus className="w-4 h-4 mx-auto mb-1" />
                            挂载第三方网盘
                        </div>
                    )}
                </div>

                {/* Status Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-brand-lime flex items-center justify-center text-black font-bold text-xs">R2</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">Primary Storage</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
                
                {/* TOOLBAR */}
                <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">
                                {activeDrive === 'r2' ? 'R2 Object Storage' : activeMount?.name}
                                {activeDrive === 'r2' && <span className="px-1.5 py-0.5 rounded bg-brand-lime/20 text-brand-lime text-[10px] font-black uppercase">Master</span>}
                            </h2>
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                <Database className="w-3 h-3" />
                                {activeDrive === 'r2' ? `${files.length} ITEMS` : `${activeMount?.provider.toUpperCase()} LINK`}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {activeDrive === 'r2' && (
                            <>
                                <div className="relative group hidden md:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
                                    <input 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-48 bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:bg-black focus:border-brand-lime outline-none transition-all"
                                    />
                                </div>
                                <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/5">
                                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
                                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}><List className="w-4 h-4" /></button>
                                </div>
                                <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                                <button 
                                    onClick={() => uploadInputRef.current?.click()} 
                                    disabled={uploading}
                                    className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-brand-lime transition-colors shadow-lg shadow-white/5"
                                >
                                    {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    <span className="hidden sm:inline">Upload</span>
                                </button>
                                <input ref={uploadInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
                                
                                {selectedFileIds.size > 0 && (
                                    <button onClick={handleBatchDelete} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        {activeDrive !== 'r2' && activeMount && (
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingMountId(activeMount.id); setMountForm(activeMount); setMountModalOpen(true); }} className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors">编辑配置</button>
                                <a href={activeMount.downloadUrl} target="_blank" className="px-4 py-2 bg-brand-cyan text-black text-xs font-bold rounded-lg hover:bg-white transition-colors flex items-center gap-2">
                                    <ExternalLink className="w-4 h-4" /> 打开链接
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENT VIEW */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                    {activeDrive === 'r2' ? (
                        loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-600">
                                <RefreshCw className="w-8 h-8 animate-spin" />
                                <p className="text-xs font-mono">SYNCING STORAGE...</p>
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-700">
                                <Folder className="w-16 h-16 opacity-20" />
                                <p className="text-sm font-bold">此文件夹为空</p>
                                <button onClick={() => uploadInputRef.current?.click()} className="text-xs text-brand-lime hover:underline">上传文件</button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredFiles.map((file) => (
                                    <div 
                                        key={file.key} 
                                        onClick={(e) => toggleSelection(file.key, e.ctrlKey || e.metaKey)}
                                        className={`group relative aspect-[3/4] rounded-xl border p-3 flex flex-col transition-all cursor-pointer ${selectedFileIds.has(file.key) ? 'bg-brand-lime/5 border-brand-lime shadow-[0_0_15px_rgba(204,255,0,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                    >
                                        {/* Selection Checkbox */}
                                        <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border flex items-center justify-center transition-all z-10 ${selectedFileIds.has(file.key) ? 'bg-brand-lime border-brand-lime scale-100' : 'border-white/20 scale-0 group-hover:scale-100 bg-black/50'}`}>
                                            {selectedFileIds.has(file.key) && <Check className="w-3 h-3 text-black" />}
                                        </div>

                                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden mb-2">
                                            <div className="w-12 h-12 [&>svg]:w-full [&>svg]:h-full opacity-80 group-hover:opacity-100 transition-opacity">
                                                {getFileIcon(file.key)}
                                            </div>
                                        </div>
                                        <div className="text-center w-full">
                                            <p className={`text-xs font-medium truncate mb-0.5 ${selectedFileIds.has(file.key) ? 'text-brand-lime' : 'text-gray-300'}`}>{file.key}</p>
                                            <p className="text-[9px] text-gray-600 font-mono">{formatSize(file.size)}</p>
                                        </div>

                                        {/* Context Actions */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.url); notify('success', '链接复制'); }} className="p-1.5 bg-black/60 rounded text-white hover:bg-brand-cyan hover:text-black transition-colors"><Link className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="min-w-full inline-block align-middle">
                                <div className="border border-white/5 rounded-xl overflow-hidden">
                                    <table className="min-w-full divide-y divide-white/5">
                                        <thead className="bg-white/[0.02]">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Size</th>
                                                <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 bg-transparent">
                                            {filteredFiles.map((file) => (
                                                <tr 
                                                    key={file.key} 
                                                    onClick={(e) => toggleSelection(file.key, e.ctrlKey || e.metaKey)}
                                                    className={`hover:bg-white/5 transition-colors cursor-pointer ${selectedFileIds.has(file.key) ? 'bg-brand-lime/5' : ''}`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-white/5 rounded">
                                                                <div className="w-5 h-5">{getFileIcon(file.key)}</div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className={`text-sm font-medium ${selectedFileIds.has(file.key) ? 'text-brand-lime' : 'text-gray-200'}`}>{file.key}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono">{formatSize(file.size)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono">{new Date(file.uploaded).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => {e.stopPropagation(); navigator.clipboard.writeText(file.url)}} className="text-brand-cyan hover:text-white"><Copy className="w-4 h-4" /></button>
                                                            <button onClick={(e) => {e.stopPropagation(); handleDelete(file.key)}} className="text-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    ) : (
                        // MOUNTED DRIVE VIEW (Placeholder simulation)
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/5">
                                <Globe className={`w-16 h-16 ${activeMount?.provider === 'aliyun' ? 'text-orange-500' : 'text-brand-cyan'}`} />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">{activeMount?.name}</h2>
                            <p className="text-gray-500 max-w-md mb-8">{activeMount?.description || '外部资源挂载点'}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-left bg-white/5 p-6 rounded-2xl border border-white/10 w-full max-w-lg mb-8">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Provider</span>
                                    <p className="text-white font-mono">{activeMount?.provider.toUpperCase()}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Size</span>
                                    <p className="text-white font-mono">{activeMount?.size}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Target URL</span>
                                    <p className="text-brand-cyan font-mono truncate text-xs mt-1">{activeMount?.downloadUrl}</p>
                                </div>
                            </div>

                            <a href={activeMount?.downloadUrl} target="_blank" className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform shadow-xl flex items-center gap-2">
                                <ExternalLink className="w-5 h-5" /> 访问外部资源
                            </a>
                            <p className="text-xs text-gray-600 mt-4">此驱动器由外部服务提供，文件管理不可用。</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MOUNT MODAL */}
            {mountModalOpen && (
                <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#111] w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Server className="w-5 h-5 text-brand-cyan" /> 
                                {editingMountId ? '编辑挂载点' : '连接网络驱动器'}
                            </h3>
                            <button onClick={() => setMountModalOpen(false)} className="hover:text-white text-gray-500"><LayoutGrid className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">显示名称 (Label)</label>
                                <input value={mountForm.name} onChange={e => setMountForm({...mountForm, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none" placeholder="我的阿里云盘分享" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">提供商</label>
                                    <select value={mountForm.provider} onChange={e => setMountForm({...mountForm, provider: e.target.value as any})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none">
                                        <option value="aliyun">阿里云盘</option>
                                        <option value="onedrive">OneDrive</option>
                                        <option value="google">Google Drive</option>
                                        <option value="other">HTTPS 直链</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">资源链接 (URL)</label>
                                    <input value={mountForm.downloadUrl} onChange={e => setMountForm({...mountForm, downloadUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none font-mono text-xs" placeholder="https://..." />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">备注信息</label>
                                <textarea value={mountForm.description} onChange={e => setMountForm({...mountForm, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-brand-cyan outline-none h-20 resize-none text-sm" placeholder="提取码: 1234..." />
                            </div>
                        </div>
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3">
                            {editingMountId && (
                                <button onClick={(e) => deleteMount(editingMountId, e)} className="px-4 py-3 rounded-xl border border-red-500/20 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-colors">断开</button>
                            )}
                            <button onClick={handleSaveMount} className="flex-1 py-3 bg-brand-cyan text-black font-bold rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,255,0.2)]">保存连接</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
