

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { LyricsOverlay } from './components/LyricsOverlay';
import { Home } from './views/Home';
import { Charts } from './views/Charts';
import { Gallery } from './views/Gallery';
import { Library } from './views/Library';
import { MVView } from './views/MV';
import { PlaylistsView } from './views/Playlists';
import { DJView } from './views/DJ';
import { ArticlesView } from './views/Articles';
import { View, Song, Playlist, Theme, MV, GalleryItem, DJSet, Article, PageHeaders } from './types';
import { MOCK_SONGS, MOCK_PLAYLISTS, THEMES, MOCK_MVS, GALLERY_ITEMS, MOCK_DJ_SETS, MOCK_ARTICLES, DEFAULT_HEADERS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  
  // GLOBAL STATE FOR CMS (Library/Admin)
  const [userSongs, setUserSongs] = useState<Song[]>(MOCK_SONGS);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);
  const [mvs, setMvs] = useState<MV[]>(MOCK_MVS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY_ITEMS);
  const [djSets, setDjSets] = useState<DJSet[]>(MOCK_DJ_SETS);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [pageHeaders, setPageHeaders] = useState<PageHeaders>(DEFAULT_HEADERS);
  
  // Navigation State
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  
  // Theme State - Default to Cyberpunk
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);

  // Listen for playback time updates from Player
  useEffect(() => {
      const handleTimeUpdate = (e: CustomEvent<number>) => {
          setPlaybackTime(e.detail);
      };
      window.addEventListener('music-time-update' as any, handleTimeUpdate);
      return () => window.removeEventListener('music-time-update' as any, handleTimeUpdate);
  }, []);

  // Pause music if entering MV mode to prevent overlap and audio conflict
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

  const handleCreatePlaylist = (name: string, desc: string) => {
     const newPlaylist: Playlist = {
        id: Date.now().toString(),
        name,
        description: desc,
        coverUrl: `https://picsum.photos/seed/${Date.now()}/300/300`,
        songCount: 0
     };
     setPlaylists([newPlaylist, ...playlists]);
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
      case View.PLAYLISTS:
        return <PlaylistsView playlists={playlists} onCreatePlaylist={handleCreatePlaylist} />;
      case View.GALLERY:
        return <Gallery items={galleryItems} />;
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
            onPlaySong={handlePlaySong}
            currentTheme={currentTheme}
            setTheme={setCurrentTheme}
            pageHeaders={pageHeaders}
            setPageHeaders={setPageHeaders}
          />
        );
      default:
        return (
          <Home 
            songs={userSongs}
            mvs={mvs}
            articles={articles}
            onPlaySong={handlePlaySong} 
            currentSongId={currentSong?.id} 
            onChangeView={setCurrentView} 
            onReadArticle={handleReadArticle}
            headerConfig={pageHeaders[View.HOME]}
          />
        );
    }
  };

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
      
      {/* ELEGANT FLUID BACKGROUND (Music Reactive Enhanced) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Noise Texture */}
         <div className="absolute inset-0 bg-noise opacity-[0.05]"></div>
         
         {/* Top Mesh - Reacts significantly to Music State */}
         <div 
           className={`absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full blur-[100px] mix-blend-screen transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1)`}
           style={{ 
             background: `radial-gradient(circle, ${currentTheme.colors.secondary} 0%, transparent 60%)`,
             transform: isPlaying ? 'scale(1.2) translate(-50px, 50px)' : 'scale(1)',
             opacity: isPlaying ? 0.35 : 0.1,
             animation: isPlaying ? 'blob-slow 5s infinite alternate' : 'blob-slow 20s infinite alternate'
           }} 
         />
         
         {/* Bottom Mesh - Reacts significantly to Music State */}
         <div 
           className={`absolute bottom-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] mix-blend-screen transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1)`}
           style={{ 
             background: `radial-gradient(circle, ${currentTheme.colors.primary} 0%, transparent 60%)`,
             transform: isPlaying ? 'scale(1.4) translate(40px, -40px)' : 'scale(1)',
             opacity: isPlaying ? 0.35 : 0.1,
             animation: isPlaying ? 'blob-slow 7s infinite alternate-reverse' : 'blob-slow 25s infinite alternate-reverse'
           }} 
         />

         {/* Center Breather */}
         <div 
           className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[80px] transition-all duration-[800ms] ease-out mix-blend-overlay`}
           style={{
             background: `radial-gradient(circle, ${currentTheme.colors.accent} 0%, transparent 60%)`,
             opacity: isPlaying ? 0.4 : 0.05,
             transform: isPlaying ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%) scale(0.9)',
           }}
         />
      </div>

      {/* Sidebar */}
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-12 pt-24 lg:pt-12 min-h-screen relative z-10 transition-colors duration-500">
        <div className="max-w-[1600px] mx-auto">
          {renderView()}
        </div>
      </main>

      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 glass z-30 flex items-center justify-between px-6 lg:hidden border-b border-white/5">
        <span className="font-display font-black text-xl tracking-tight text-white italic">YINYUETAI</span>
        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-brand-lime animate-pulse' : 'bg-gray-600'}`} />
      </div>

      {/* Player (Hidden in MV View to avoid obstruction) */}
      {currentView !== View.MV && (
        <Player 
          currentSong={currentSong} 
          isPlaying={isPlaying} 
          onPlayPause={handlePlayPause} 
          onToggleLyrics={() => currentSong && setShowLyrics(true)}
        />
      )}

      {/* FULLSCREEN LYRICS OVERLAY */}
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