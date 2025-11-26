
import React, { useState } from 'react';
import { SoftwareItem, PageHeaderConfig } from '../types';
import { Download, Monitor, Smartphone, Cloud, Globe, Search, Box, Cpu, HardDrive, Filter, CheckCircle } from 'lucide-react';

interface SoftwareViewProps {
  softwareItems: SoftwareItem[];
  headerConfig: PageHeaderConfig | undefined;
}

export const SoftwareView: React.FC<SoftwareViewProps> = ({ softwareItems = [], headerConfig }) => {
  const [filter, setFilter] = useState<'all' | 'win' | 'mac' | 'mobile'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback config to prevent crash if headerConfig is undefined
  const config = headerConfig || {
      title: '资源中心',
      subtitle: 'DOWNLOADS',
      description: '探索精选的音频工具与资源。'
  };

  const safeItems = Array.isArray(softwareItems) ? softwareItems : [];

  const filteredItems = safeItems.filter(item => {
      const matchesFilter = filter === 'all' || item.platform === filter;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const getProviderIcon = (provider: string) => {
      switch(provider) {
          case 'aliyun': return <span className="text-orange-500 font-bold flex items-center gap-1"><Cloud className="w-3 h-3" /> AliYun</span>;
          case 'onedrive': return <span className="text-blue-500 font-bold flex items-center gap-1"><Cloud className="w-3 h-3" /> OneDrive</span>;
          case 'r2': return <span className="text-brand-lime font-bold flex items-center gap-1"><HardDrive className="w-3 h-3" /> R2</span>;
          default: return <span className="text-gray-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Link</span>;
      }
  };

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'win': return <Monitor className="w-5 h-5" />;
          case 'mac': return <Cpu className="w-5 h-5" />;
          case 'mobile': return <Smartphone className="w-5 h-5" />;
          default: return <Box className="w-5 h-5" />;
      }
  };

  return (
    <div className="pb-40 animate-in fade-in duration-700">
        {/* HEADER */}
        <header className="mb-16 relative overflow-hidden rounded-[3rem] border border-white/5 bg-[#050505] p-12 lg:p-20 text-center shadow-2xl group">
            {/* Animated Glow */}
            <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-brand-cyan/10 blur-[150px] rounded-full group-hover:bg-brand-cyan/15 transition-colors duration-1000 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
            
            <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-brand-cyan border border-white/10 mb-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] animate-float">
                    <Cloud className="w-10 h-10" />
                </div>
                
                <h1 className="text-5xl md:text-8xl font-display font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">{config.title}</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                    {config.description}
                </p>
                
                {/* Search & Filter Bar */}
                <div className="mt-12 flex flex-col md:flex-row gap-4 w-full max-w-2xl bg-white/5 p-2 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search firmware, plugins, tools..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none py-4 pl-14 pr-6 text-white focus:ring-0 outline-none text-lg placeholder:text-gray-600 font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 pr-2 overflow-x-auto scrollbar-hide">
                        {['all', 'win', 'mac', 'mobile'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-6 py-3 rounded-full text-sm font-bold uppercase transition-all whitespace-nowrap flex items-center gap-2 ${filter === f ? 'bg-white text-black shadow-lg scale-105' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {f === 'all' && <Filter className="w-3 h-3" />}
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
            {filteredItems.map((item, index) => (
                <div 
                    key={item.id} 
                    className="group relative bg-[#0a0a0a] rounded-[2.5rem] p-8 border border-white/5 hover:border-brand-cyan/40 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    {/* Top Meta */}
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-black/40 backdrop-blur-sm transition-colors">
                             {getProviderIcon(item.provider)}
                             <span className="text-gray-600">|</span>
                             <span className="text-gray-400">{item.size}</span>
                        </div>
                        {item.isOfficial && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lime/10 text-brand-lime text-[10px] font-black uppercase border border-brand-lime/20 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                                <CheckCircle className="w-3 h-3" /> Verified
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="mb-8 flex-1 relative z-10">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-brand-cyan/50 transition-all shadow-inner group-hover:scale-110 duration-500">
                                {getPlatformIcon(item.platform)}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white leading-none group-hover:text-brand-cyan transition-colors mb-2 tracking-tight">{item.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 group-hover:border-brand-cyan/20">{item.version}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed font-light min-h-[4.5em] group-hover:text-gray-300 transition-colors">
                            {item.description || 'No description provided for this resource.'}
                        </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto relative z-10 group-hover:border-white/10 transition-colors">
                         <div className="text-[10px] text-gray-600 font-mono font-bold uppercase tracking-wider">
                             Updated {item.updateDate}
                         </div>
                         <a 
                            href={item.downloadUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-brand-cyan hover:scale-105 transition-all shadow-lg shadow-white/10 hover:shadow-brand-cyan/30"
                         >
                             <Download className="w-4 h-4" /> Download
                         </a>
                    </div>
                </div>
            ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-0 animate-in fade-in duration-1000 fill-mode-forwards">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Search className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">No resources found</h3>
                <p className="text-gray-500 max-w-sm">We couldn't find any software matching your filters. Try adjusting your search criteria.</p>
            </div>
        )}
    </div>
  );
};
