
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { LyricsOverlay } from './components/LyricsOverlay';
import { NotificationContainer, NotificationItem, NotificationType } from './components/Notification';
import { Home } from './views/Home';
import { Charts } from './views/Charts';
import { Gallery } from './views/Gallery';
import { Library } from './views/Library';
import { MVView } from './views/MV';
import { DJView } from './views/DJ';
import { ArticlesView } from './views/Articles';
import { SoftwareView } from './views/Software'; 
import { View, Song, Playlist, Theme, MV, GalleryItem, DJSet, Article, PageHeaders, SoftwareItem, NavItem } from './types';
import { MOCK_SONGS, MOCK_PLAYLISTS, THEMES, MOCK_MVS, GALLERY_ITEMS, MOCK_DJ_SETS, MOCK_ARTICLES, DEFAULT_HEADERS, MOCK_SOFTWARE, DEFAULT_NAV_ITEMS } from './constants';
import { cloudService } from './services/cloudService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // GLOBAL STATE
  const [userSongs, setUserSongs] = useState<Song[]>(MOCK_SONGS);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [mvs, setMvs] = useState<MV[]>(MOCK_MVS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [djSets, setDjSets] = useState<DJSet[]>(MOCK_DJ_SETS);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [softwareItems, setSoftwareItems] = useState<SoftwareItem[]>(MOCK_SOFTWARE);
  const [pageHeaders, setPageHeaders] = useState<PageHeaders>(DEFAULT_HEADERS);
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

  // Visualizer Refs
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  
  // Visualizer Logic State
  const visualState = useRef({
      bass: { current: 0, target: 0 },
      mid: { current: 0, target: 0 },
      high: { current: 0, target: 0 }
  });
  const rafRef = useRef<number>(0);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (type: NotificationType, message: string) => {
     const id = Date.now().toString() + Math.random();
     setNotifications(prev => [...prev, { id, type, message }]);
     setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
     }, 4000);
  };

  const removeNotification = (id: string) => {
     setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const cloudData = await cloudService.loadData();
      
      if (cloudData) {
        if (cloudData.songs) setUserSongs(cloudData.songs);
        if (cloudData.mvs) setMvs(cloudData.mvs);
        if (cloudData.galleryItems) setGalleryItems(cloudData.galleryItems);
        if (cloudData.djSets) setDjSets(cloudData.djSets);
        if (cloudData.articles) setArticles(cloudData.articles);
        if (cloudData.playlists) setPlaylists(cloudData.playlists);
        if (cloudData.softwareItems) setSoftwareItems(cloudData.softwareItems);
        if (cloudData.pageHeaders) setPageHeaders(cloudData.pageHeaders);
        if (cloudData.navItems) setNavItems(cloudData.navItems);
        if (cloudData.themeId) {
          const t = THEMES.find(t => t.id === cloudData.themeId);
          if(t) setCurrentTheme(t);
        }
      }
      setIsLoading(false);
    };

    initData();
  }, []);

  useEffect(() => {
      const handleTimeUpdate = (e: CustomEvent<number>) => {
          setPlaybackTime(e.detail);
      };
      window.addEventListener('music-time-update' as any, handleTimeUpdate);
      return () => window.removeEventListener('music-time-update' as any, handleTimeUpdate);
  }, []);

  // --- SMOOTH & ELEGANT AUDIO VISUALIZER ---
  // Uses Linear Interpolation (Lerp) to prevent jitter and creates a breathing effect
  useEffect(() => {
      // 1. Listen for raw data updates
      const handleAudioData = (e: CustomEvent<{ bass: number, mid: number, high: number }>) => {
          const { bass, mid, high } = e.detail;
          visualState.current.bass.target = bass;
          visualState.current.mid.target = mid;
          visualState.current.high.target = high;
      };

      window.addEventListener('audio-visual-data' as any, handleAudioData);

      // 2. Animation Loop (60fps)
      const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

      const loop = () => {
          // Smooth out the values (Lag effect)
          // Factor 0.05 means it moves 5% towards the target per frame -> very smooth/slow
          visualState.current.bass.current = lerp(visualState.current.bass.current, visualState.current.bass.target, 0.05);
          visualState.current.mid.current = lerp(visualState.current.mid.current, visualState.current.mid.target, 0.03);
          visualState.current.high.current = lerp(visualState.current.high.current, visualState.current.high.target, 0.04);

          const { bass, mid, high } = visualState.current;

          if (blob1Ref.current) {
              // Primary Blob (Top Right) - Reacts to Mid/High (Subtle movement)
              // Low opacity to prevent glare
              const scale = 1 + (mid.current / 255) * 0.2; // Max scale 1.2
              const x = Math.sin(Date.now() / 5000) * 30; // Slow ambient drift
              const opacity = 0.08 + (mid.current / 255) * 0.1; // Max opacity ~0.18
              
              blob1Ref.current.style.transform = `translate(${x}px, 0) scale(${scale})`;
              blob1Ref.current.style.opacity = opacity.toFixed(3);
          }

          if (blob2Ref.current) {
              // Secondary Blob (Bottom Left) - Reacts to Bass (Breathing)
              const scale = 1 + (bass.current / 255) * 0.3; 
              const y = Math.cos(Date.now() / 4000) * 30;
              const opacity = 0.05 + (bass.current / 255) * 0.15; // Max opacity ~0.2
              
              blob2Ref.current.style.transform = `translate(0, ${y}px) scale(${scale})`;
              blob2Ref.current.style.opacity = opacity.toFixed(3);
          }

          if (blob3Ref.current) {
              // Accent Blob (Center) - Very subtle
              const scale = 0.8 + (high.current / 255) * 0.2;
              const opacity = 0.03 + (high.current / 255) * 0.1;
              
              blob3Ref.current.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${Date.now() / 50}deg)`;
              blob3Ref.current.style.opacity = opacity.toFixed(3);
          }

          rafRef.current = requestAnimationFrame(loop);
      };

      loop();

      return () => {
          window.removeEventListener('audio-visual-data' as any, handleAudioData);
          cancelAnimationFrame(rafRef.current);
      };
  }, []);

  useEffect(() => {
    if (currentView === View.MV) {
      setIsPlaying(false);
    }
  }, [currentView]);

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handlePlayDJSet = (djSet: DJSet) => {
      const adaptedSong: Song = {
          id: djSet.id,
          title: djSet.title,
          artist: djSet.djName,
          coverUrl: djSet.coverUrl,
          duration: djSet.duration,
          fileUrl: djSet.fileUrl,
          plays: djSet.plays,
          neteaseId: djSet.neteaseId
      };
      handlePlaySong(adaptedSong);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReadArticle = (article: Article) => {
      setCurrentArticle(article);
      setCurrentView(View.ARTICLES);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderView = () => {
    switch (currentView) {
      case View.HOME:
        return (
          <Home 
            songs={userSongs}
            mvs={mvs}
            articles={articles}
            galleryItems={galleryItems}
            djSets={djSets}
            softwareItems={softwareItems}
            onPlaySong={handlePlaySong} 
            currentSongId={currentSong?.id} 
            onChangeView={setCurrentView} 
            onReadArticle={handleReadArticle}
            headerConfig={pageHeaders[View.HOME]}
          />
        );
      case View.MV:
        return <MVView mvs={mvs} headerConfig={pageHeaders[View.MV]} />;
      case View.DJ:
        return (
            <DJView 
                djSets={djSets} 
                onPlaySet={handlePlayDJSet} 
                currentSongId={currentSong?.id} 
                isPlaying={isPlaying} 
                headerConfig={pageHeaders[View.DJ]}
            />
        );
      case View.ARTICLES:
        return (
            <ArticlesView 
                articles={articles}
                selectedArticle={currentArticle}
                onSelectArticle={setCurrentArticle}
                djSets={djSets}
                songs={userSongs}
                onPlaySong={handlePlaySong}
                currentSongId={currentSong?.id}
                isPlaying={isPlaying}
                headerConfig={pageHeaders[View.ARTICLES]}
            />
        );
      case View.CHARTS:
        return (
          <Charts 
            songs={userSongs} 
            onPlaySong={handlePlaySong} 
            currentSongId={currentSong?.id} 
            isPlaying={isPlaying}
            headerConfig={pageHeaders[View.CHARTS]}
          />
        );
      case View.GALLERY:
        return <Gallery items={galleryItems} />;
      case View.SOFTWARE:
        return <SoftwareView softwareItems={softwareItems} headerConfig={pageHeaders[View.SOFTWARE]} />;
      case View.LIBRARY:
        return (
          <Library 
            songs={userSongs} 
            setSongs={setUserSongs} 
            mvs={mvs}
            setMvs={setMvs}
            galleryItems={galleryItems}
            setGalleryItems={setGalleryItems}
            djSets={djSets}
            setDjSets={setDjSets}
            articles={articles}
            setArticles={setArticles}
            playlists={playlists}
            softwareItems={softwareItems}
            setSoftwareItems={setSoftwareItems}
            onPlaySong={handlePlaySong}
            currentTheme={currentTheme}
            setTheme={setCurrentTheme}
            pageHeaders={pageHeaders}
            setPageHeaders={setPageHeaders}
            notify={addNotification}
            navItems={navItems} 
            setNavItems={setNavItems} 
          />
        );
      default:
        return (
          <Home 
            songs={userSongs}
            mvs={mvs}
            articles={articles}
            galleryItems={galleryItems}
            djSets={djSets}
            softwareItems={softwareItems}
            onPlaySong={handlePlaySong} 
            currentSongId={currentSong?.id} 
            onChangeView={setCurrentView} 
            onReadArticle={handleReadArticle}
            headerConfig={pageHeaders[View.HOME]}
          />
        );
    }
  };

  if (isLoading) {
    return (
       <div className="fixed inset-0 bg-black flex items-center justify-center text-brand-lime">
          <div className="flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 animate-spin" />
             <span className="text-sm font-bold tracking-[0.3em] animate-pulse">CONNECTING CLOUD</span>
          </div>
       </div>
    );
  }

  return (
    <div 
      className="flex min-h-screen font-sans text-white bg-dark-950 overflow-x-hidden selection:bg-brand-lime selection:text-black transition-colors duration-700"
      style={{
        '--brand-primary': currentTheme.colors.primary,
        '--brand-secondary': currentTheme.colors.secondary,
        '--brand-accent': currentTheme.colors.accent,
        '--bg-deep': currentTheme.colors.bgDeep,
        '--bg-surface': currentTheme.colors.bgSurface,
      } as React.CSSProperties}
    >
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />

      {/* DYNAMIC BACKGROUND (Refined for Softness) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-dark-950">
         <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
         
         {/* Blob 1: Secondary Color (Top Right) */}
         <div 
           ref={blob1Ref}
           className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] rounded-full blur-[160px] will-change-transform"
           style={{ 
             background: `radial-gradient(circle, ${currentTheme.colors.secondary} 0%, transparent 70%)`,
             opacity: 0.08, // Initial Low Opacity
             transformOrigin: 'center center'
           }} 
         />
         
         {/* Blob 2: Primary Color (Bottom Left) */}
         <div 
           ref={blob2Ref}
           className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[180px] will-change-transform"
           style={{ 
             background: `radial-gradient(circle, ${currentTheme.colors.primary} 0%, transparent 70%)`,
             opacity: 0.05, // Initial Low Opacity
             transformOrigin: 'center center'
           }} 
         />
         
         {/* Blob 3: Accent Color (Center - very subtle) */}
         <div 
           ref={blob3Ref}
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full blur-[140px] mix-blend-plus-lighter will-change-transform"
           style={{
             background: `radial-gradient(circle, ${currentTheme.colors.accent} 0%, transparent 70%)`,
             opacity: 0.03, // Initial Low Opacity
           }}
         />
      </div>

      <Sidebar currentView={currentView} onChangeView={setCurrentView} navItems={navItems} />

      <main className="flex-1 lg:ml-72 p-4 lg:p-12 pt-24 lg:pt-12 min-h-screen relative z-10 transition-colors duration-500">
        <div className="max-w-[1600px] mx-auto">
          {renderView()}
        </div>
      </main>

      <div className="fixed top-0 left-0 right-0 h-16 glass z-30 flex items-center justify-between px-6 lg:hidden border-b border-white/5">
        <span className="font-display font-black text-xl tracking-tight text-white italic">YINYUETAI</span>
        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-brand-lime animate-pulse' : 'bg-gray-600'}`} />
      </div>

      {/* Hide Player on MV, Library, AND ARTICLES views to provide immersion */}
      {currentView !== View.MV && currentView !== View.LIBRARY && currentView !== View.ARTICLES && (
        <Player 
          currentSong={currentSong} 
          isPlaying={isPlaying} 
          onPlayPause={handlePlayPause} 
          onToggleLyrics={() => currentSong && setShowLyrics(true)}
        />
      )}

      {currentSong && (
          <LyricsOverlay 
              song={currentSong} 
              currentTime={playbackTime} 
              isOpen={showLyrics} 
              onClose={() => setShowLyrics(false)}
              isPlaying={isPlaying}
          />
      )}
    </div>
  );
};

export default App;
