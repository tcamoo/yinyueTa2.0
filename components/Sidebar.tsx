
import React from 'react';
import { Home, Image, Radio, Film, LayoutGrid, Disc, FileText, Globe } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const mainNavItems = [
    { id: View.HOME, label: '首映', sub: 'Premiere', icon: Home },
    { id: View.MV, label: '视界', sub: 'Visuals', icon: Film },
    { id: View.GALLERY, label: '画廊', sub: 'Gallery', icon: Image }, // Added Gallery
    { id: View.CHARTS, label: '榜单', sub: 'Charts', icon: Globe },
    { id: View.DJ, label: '电音', sub: 'Club', icon: Disc },
    { id: View.ARTICLES, label: '专栏', sub: 'Read', icon: FileText },
    { id: View.LIBRARY, label: '管理', sub: 'Admin', icon: LayoutGrid },
  ];

  // Mobile nav priority
  const mobileNavItems = [
      mainNavItems[0], // Home
      mainNavItems[1], // MV
      mainNavItems[2], // Gallery (Replaced DJ/Playlists priority)
      mainNavItems[4], // DJ
      mainNavItems[6]  // Library
  ];

  // Desktop Sidebar
  return (
    <>
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className="hidden lg:flex w-72 h-screen flex-col justify-between fixed left-0 top-0 z-40 bg-transparent pl-6 py-6 transition-all duration-300">
        
        {/* Glass Panel Container */}
        <div className="w-full h-full glass rounded-[2rem] flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Background Ambient Light */}
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-brand-lime/10 to-transparent pointer-events-none transition-colors duration-500"></div>

          {/* LOGO AREA */}
          <div className="h-32 flex items-center justify-start px-8 relative z-10">
            <div className="relative group cursor-pointer" onClick={() => onChangeView(View.HOME)}>
               <div className="absolute inset-0 -inset-x-4 bg-brand-lime/20 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
               <div className="relative flex items-center gap-4">
                 <div className="relative w-14 h-14 flex items-center justify-center bg-black/80 rounded-2xl border border-white/10 group-hover:border-brand-lime/50 transition-all duration-500 shadow-xl backdrop-blur-md overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-lime/10 to-brand-cyan/10 opacity-50"></div>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--brand-primary)" />
                                <stop offset="100%" stopColor="var(--brand-accent)" />
                            </linearGradient>
                        </defs>
                        <rect x="4" y="8" width="5" height="12" rx="2.5" fill="url(#logoGradient)" className="animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.1s' }} />
                        <rect x="11.5" y="3" width="5" height="22" rx="2.5" fill="url(#logoGradient)" className="animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                        <rect x="19" y="10" width="5" height="8" rx="2.5" fill="url(#logoGradient)" className="animate-[pulse_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                    </svg>
                 </div>
                 <div className="flex flex-col">
                    <span className="font-display font-black text-3xl tracking-tighter text-white leading-none italic group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-brand-lime transition-all duration-500">
                      音悦台
                    </span>
                    <div className="flex items-center justify-between w-full mt-1.5 pl-0.5">
                       <span className="text-[0.55rem] tracking-[0.3em] text-brand-lime font-bold uppercase transition-colors group-hover:text-brand-accent">Yinyuetai</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 flex flex-col gap-3 px-6 mt-4 overflow-y-auto scrollbar-hide">
            {mainNavItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`
                    group flex items-center justify-start w-full p-4 rounded-xl transition-all duration-300 relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-brand-pink/80 to-brand-purple/80 text-white shadow-[0_0_20px_var(--brand-secondary)] translate-x-2' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'group-hover:text-brand-lime'} transition-colors`} />
                  <div className="flex flex-col ml-4 text-left relative z-10">
                     <span className={`font-bold text-base ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.label}</span>
                     <span className={`text-[10px] uppercase font-display tracking-wider transition-colors ${isActive ? 'text-white/80' : 'text-gray-600 group-hover:text-gray-400'}`}>{item.sub}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* VIP BADGE */}
          <div className="p-6 pb-8 relative z-10">
            <div className="p-5 rounded-2xl bg-black border border-brand-lime/30 relative overflow-hidden group cursor-pointer hover:border-brand-lime transition-all shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-brand-lime blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-brand-lime/20 flex items-center justify-center text-brand-lime transition-colors">
                   <Radio className="w-4 h-4" />
                 </div>
                 <h4 className="font-bold text-sm text-white italic">VIP 尊享</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">Hi-Res 无损音质</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV (Visible only on Mobile) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-2xl border-t border-white/10 z-50 pb-safe safe-area-bottom">
          <div className="flex justify-around items-center h-16 px-2">
              {mobileNavItems.map((item) => {
                  const isActive = currentView === item.id;
                  const Icon = item.icon;
                  return (
                      <button 
                        key={item.id}
                        onClick={() => onChangeView(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive ? 'text-brand-lime' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          <div className={`p-1.5 rounded-full transition-all ${isActive ? 'bg-brand-lime/10 translate-y-[-2px]' : ''}`}>
                             <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-[10px] font-bold transform scale-90">{item.label}</span>
                      </button>
                  )
              })}
          </div>
      </nav>
    </>
  );
};
