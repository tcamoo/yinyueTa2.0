import React, { useState } from 'react';
import { Playlist, Song } from '../types';
import { Plus, X, Music2, MoreVertical, PlayCircle } from 'lucide-react';
import { MOCK_PLAYLISTS } from '../constants';

interface PlaylistsProps {
  playlists: Playlist[];
  onCreatePlaylist: (name: string, desc: string) => void;
}

export const PlaylistsView: React.FC<PlaylistsProps> = ({ playlists, onCreatePlaylist }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreatePlaylist(name, desc);
      setName('');
      setDesc('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="pb-40 animate-in fade-in zoom-in-95 duration-500">
      <header className="flex items-center justify-between mb-12">
        <div>
           <h1 className="text-5xl font-display font-bold mb-2">我的歌单</h1>
           <p className="text-gray-400">收藏你的音乐品味。</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="px-6 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-brand-lime hover:scale-105 transition-all shadow-lg"
        >
           <Plus className="w-5 h-5" />
           新建歌单
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {/* Create Card (Visual shortcut) */}
         <div 
            onClick={() => setIsModalOpen(true)}
            className="aspect-square rounded-[2rem] border-2 border-dashed border-white/10 hover:border-brand-lime hover:bg-brand-lime/5 transition-all flex flex-col items-center justify-center cursor-pointer group"
         >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-brand-lime group-hover:bg-brand-lime/20">
               <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold text-gray-500 group-hover:text-white">创建新歌单</span>
         </div>

         {playlists.map((playlist) => (
            <div key={playlist.id} className="group cursor-pointer">
               <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-4 shadow-2xl">
                  <img src={playlist.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2" alt={playlist.name} />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                     <button className="w-14 h-14 bg-brand-lime rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_20px_#ccff00]">
                        <PlayCircle className="w-8 h-8 fill-current" />
                     </button>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
                     <Music2 className="w-3 h-3" /> {playlist.songCount} 首
                  </div>
               </div>
               
               <div className="flex justify-between items-start px-1">
                  <div>
                     <h3 className="text-xl font-bold text-white group-hover:text-brand-lime transition-colors mb-1">{playlist.name}</h3>
                     <p className="text-sm text-gray-500 line-clamp-1">{playlist.description}</p>
                  </div>
                  <button className="text-gray-600 hover:text-white transition-colors">
                     <MoreVertical className="w-5 h-5" />
                  </button>
               </div>
            </div>
         ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-[#1a1a1a] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
               <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
               >
                  <X className="w-6 h-6" />
               </button>
               
               <h2 className="text-2xl font-bold mb-6">新建歌单</h2>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="block text-sm font-bold text-gray-400 mb-2">歌单名称</label>
                     <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-lime transition-colors"
                        placeholder="给歌单起个好听的名字..."
                        autoFocus
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-400 mb-2">描述 (可选)</label>
                     <textarea 
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-lime transition-colors h-24 resize-none"
                        placeholder="描述一下这个歌单的氛围..."
                     />
                  </div>
                  <button 
                     type="submit"
                     className="w-full py-4 bg-brand-lime text-black font-bold rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                  >
                     创建
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};