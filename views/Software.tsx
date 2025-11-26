
import React, { useState } from 'react';
import { SoftwareItem, PageHeaderConfig } from '../types';
import { Download, Monitor, Smartphone, Cloud, Globe, Search, Box, Cpu, HardDrive } from 'lucide-react';

interface SoftwareViewProps {
  softwareItems: SoftwareItem[];
  headerConfig: PageHeaderConfig;
}

export const SoftwareView: React.FC<SoftwareViewProps> = ({ softwareItems, headerConfig }) => {
  const [filter, setFilter] = useState<'all' | 'win' | 'mac' | 'mobile'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = softwareItems.filter(item => {
      const matchesFilter = filter === 'all' || item.platform === filter;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  const getProviderIcon = (provider: string) => {
      switch(provider) {
          case 'aliyun': return <span className="text-orange-500 font-bold">AliYun</span>;
          case 'onedrive': return <span className="text-blue-500 font-bold">OneDrive</span>;
          case 'r2': return <span className="text-brand-lime font-bold">R2</span>;
          default: return <span className="text-gray-400">Link</span>;
      }
  };

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'win': return <Monitor className="w-4 h-4" />;
          case 'mac': return <Cpu className="w-4 h-4" />;
          case 'mobile': return <Smartphone className="w-4 h-4" />;
          default: return <Box className="w-4 h-4" />;
      }
  };

  return (
    <div className="pb-40 animate-in fade-in duration-700">
        {/* HEADER */}
        <header className="mb-16 relative overflow-hidden rounded-[3rem] border border-white/5 bg-black p-12 text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan blur-[150px] opacity-10 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan border border-brand-cyan/20 mb-6 shadow-[0_0_30px_rgba(0,255,255,0.15)]">
                    <Cloud className="w-8 h-8" />
                </div>
                <h1 className="text-5xl md:text-7xl font-display font-black text-white mb-4 tracking-tighter">
                    {headerConfig.title}
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    {headerConfig.description}
                </p>
                
                {/* Search & Filter Bar */}
                <div className="mt-10 flex flex-col md:flex-row gap-4 w-full max-w-xl">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search resources..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:border-brand-cyan focus:bg-white/10 outline-none transition-all"
                        />
                    </div>
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                        {['all', 'win', 'mac', 'mobile'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-full text-sm font-bold uppercase transition-all ${filter === f ? 'bg-brand-cyan text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => (
                <div key={item.id} className="group relative bg-[#0a0a0a] rounded-[2rem] p-6 border border-white/5 hover:border-brand-cyan/30 transition-all hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                    
                    {/* Top Row: Provider Badge */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs flex items-center gap-2">
                             {getProviderIcon(item.provider)}
                             <span className="text-gray-500 font-mono">| {item.size}</span>
                        </div>
                        {item.isOfficial && (
                            <div className="px-2 py-0.5 rounded bg-brand-lime/20 text-brand-lime text-[10px] font-bold uppercase border border-brand-lime/20">
                                Verified
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-brand-cyan/50 transition-colors">
                                {getPlatformIcon(item.platform)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white leading-none group-hover:text-brand-cyan transition-colors">{item.name}</h3>
                                <span className="text-xs font-mono text-gray-500">{item.version}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5em]">
                            {item.description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                         <div className="text-xs text-gray-600 font-mono">
                             Updated: {item.updateDate}
                         </div>
                         <a 
                            href={item.downloadUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-brand-cyan hover:scale-105 transition-all shadow-lg"
                         >
                             <Download className="w-4 h-4" /> Download
                         </a>
                    </div>
                </div>
            ))}
        </div>

        {filteredItems.length === 0 && (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Box className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-400">No resources found</h3>
                <p className="text-gray-600">Try adjusting your filters.</p>
            </div>
        )}
    </div>
  );
};
