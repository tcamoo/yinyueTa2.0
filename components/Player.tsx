
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Mic2, Maximize2, VolumeX, Expand } from 'lucide-react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onToggleLyrics: () => void;
}

// --- DRAGGABLE SPIRIT COMPONENT ---
// Enhanced to be more "reactive" even with fake data
const DraggableSpirit = ({ isPlaying, getVisualData }: { isPlaying: boolean, getVisualData: () => { bass: number, mid: number, high: number } }) => {
    const [pos, setPos] = useState({ x: window.innerWidth / 2 - 40, y: window.innerHeight - 180 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    // Initial Position adjustment for mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
             setPos({ x: window.innerWidth - 100, y: window.innerHeight - 200 });
        }
    }, []);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => ({
                x: Math.min(prev.x, window.innerWidth - 80),
                y: Math.min(prev.y, window.innerHeight - 160) // Adjusted for mobile bottom bar
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drag Logic
    const handleMouseDown = (clientX: number, clientY: number) => {
        setIsDragging(true);
        dragOffset.current = {
            x: clientX - pos.x,
            y: clientY - pos.y
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handleMouseDown(e.touches[0].clientX, e.touches[0].clientY);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
            }
        };
        const handleTouchMove = (e: TouchEvent) => {
             if (isDragging) {
                 e.preventDefault(); // Prevent scrolling while dragging spirit
                 setPos({ x: e.touches[0].clientX - dragOffset.current.x, y: e.touches[0].clientY - dragOffset.current.y });
             }
        };
        const handleUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging]);

    // Visualizer Loop
    useEffect(() => {
        const render = () => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = 30; 

            ctx.clearRect(0, 0, width, height);

            // Get Data (Real or Simulated)
            const { bass, mid, high } = isPlaying ? getVisualData() : { bass: 0, mid: 0, high: 0 };
            
            // Idle Animation
            const idleBreath = isPlaying ? 0 : Math.sin(Date.now() / 1000) * 5;

            const scale = 1 + (bass / 255) * 0.4; 
            const glow = (mid / 255); 
            const jitter = (high / 255) * 8; 

            // Draw Glow
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * scale * 0.8, centerX, centerY, radius * scale * 3);
            gradient.addColorStop(0, `rgba(204, 255, 0, ${0.2 + glow * 0.4})`); 
            gradient.addColorStop(0.5, `rgba(0, 255, 255, ${glow * 0.2})`);   
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * scale * 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Draw Core Spirit
            ctx.beginPath();
            for (let i = 0; i <= 360; i += 10) {
                const angle = (i * Math.PI) / 180;
                // Complex organic shape deformation
                const r = (radius * scale) + idleBreath + (Math.sin(i * 0.2 + Date.now()/100) * jitter) + (Math.cos(i * 0.5) * (bass/20));
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ccff00';
            ctx.shadowBlur = 15 + bass * 0.3;
            ctx.fill();

            // Eyes
            const time = Date.now() / 1000;
            const eyeOffsetX = Math.sin(time) * 3;
            const blink = Math.sin(time * 3) > 0.98 ? 0.1 : 1; 
            
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.ellipse(centerX - 10 + eyeOffsetX, centerY - 2, 4, 4 * blink, 0, 0, Math.PI * 2);
            ctx.ellipse(centerX + 10 + eyeOffsetX, centerY - 2, 4, 4 * blink, 0, 0, Math.PI * 2);
            ctx.fill();

            rafRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, getVisualData]);

    return (
        <div 
            className="fixed z-[100] cursor-move transition-transform duration-75 active:scale-110 active:cursor-grabbing touch-none"
            style={{ 
                left: pos.x, 
                top: pos.y,
                transform: `translate3d(0,0,0) scale(${isDragging ? 1.1 : 1})`,
            }}
            onMouseDown={(e) => handleMouseDown(e.clientX, e.clientY)}
            onTouchStart={handleTouchStart}
        >
             <canvas ref={canvasRef} width={200} height={200} className="w-[100px] h-[100px] pointer-events-none" />
        </div>
    );
};

export const Player: React.FC<PlayerProps> = ({ currentSong, isPlaying, onPlayPause, onToggleLyrics }) => {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Audio Context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // --- ROBUST AUDIO DATA PROVIDER ---
  // Returns real data if available, or highly convincing fake data if CORS blocked
  const getVisualData = () => {
      let bass = 0, mid = 0, high = 0;
      let rawData: Uint8Array | null = null;

      // 1. Try get Real Data
      if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          rawData = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(rawData);
          
          // Calculate bands
          // Check if data is empty (all zeros) which implies CORS silence
          let sum = 0;
          for(let i=0; i<bufferLength; i++) sum += rawData[i];
          
          if (sum > 0) {
              // We have real data!
              const bassSlice = rawData.slice(0, 10);
              const midSlice = rawData.slice(10, 50);
              const highSlice = rawData.slice(50, 100);
              bass = bassSlice.reduce((a, b) => a + b, 0) / bassSlice.length;
              mid = midSlice.reduce((a, b) => a + b, 0) / midSlice.length;
              high = highSlice.reduce((a, b) => a + b, 0) / highSlice.length;
              return { bass, mid, high, rawData };
          }
      }

      // 2. Fallback: Rhythm Simulation (BPM based)
      // This runs if analyser is null OR if data is all zeros (CORS)
      const now = Date.now();
      
      // Simulate Kick Drum (approx 128 BPM = ~468ms per beat)
      // Use a sharp sine wave power for "kick" effect
      const beatInterval = 468;
      const beatOffset = now % beatInterval;
      const beatProgress = beatOffset / beatInterval;
      
      // Sharp attack, fast decay
      let kick = 0;
      if (beatProgress < 0.1) {
          kick = 255 * (beatProgress * 10); // Attack
      } else {
          kick = 255 * Math.max(0, 1 - (beatProgress - 0.1) * 2); // Decay
      }

      // Add secondary rhythms (Hi-hats on off-beats)
      const hat = (now % (beatInterval/2)) < 50 ? 150 : 0;
      
      // Add noise/jitter
      const noise = Math.random() * 30;

      bass = Math.min(255, kick * 0.9 + noise);
      mid = Math.min(255, kick * 0.5 + hat + noise);
      high = Math.min(255, hat + noise + Math.random() * 20);

      // Generate fake raw data array for the spectrum visualizer
      if (!rawData) rawData = new Uint8Array(32).fill(0);
      for(let i=0; i<32; i++) {
          // Create a wave that moves
          const val = (Math.sin(i * 0.5 + now/100) + 1) * 100;
          rawData[i] = Math.min(255, val + (i < 5 ? bass : i > 20 ? high : mid) * 0.5);
      }

      return { bass, mid, high, rawData };
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentSong?.fileUrl) return;

    setHasError(false);

    const handlePlayback = async () => {
        try {
            if (isPlaying) {
                // Initialize Audio Context carefully
                if (!audioContextRef.current) {
                    try {
                        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                        const ctx = new AudioContext();
                        audioContextRef.current = ctx;
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 256; 
                        analyser.smoothingTimeConstant = 0.7; // Snappier response
                        analyserRef.current = analyser;
                        
                        // Prevent connecting source twice
                        if (!sourceRef.current) {
                           const source = ctx.createMediaElementSource(audio);
                           sourceRef.current = source;
                           source.connect(analyser);
                           analyser.connect(ctx.destination);
                        }
                    } catch (e) {
                        console.warn("Audio Context Init Failed (CORS or Browser Restriction), falling back to simulation.", e);
                    }
                }
                
                if (audioContextRef.current?.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
                startVisualizer();
            } else {
                audio.pause();
                stopVisualizer();
            }
        } catch (error: any) {
            console.error('Playback Error:', error);
            if (error.name !== 'AbortError') setHasError(true);
        }
    };

    handlePlayback();
  }, [isPlaying, currentSong]); 

  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.muted = isMuted;
      }
  }, [isMuted]);

  // Bottom Bar Visualizer Loop
  const startVisualizer = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      const draw = () => {
          if (!canvasRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          const width = canvasRef.current.width;
          const height = canvasRef.current.height;
          ctx.clearRect(0, 0, width, height);
          
          const { rawData } = getVisualData();
          
          // Downsample data to match bar count (approx 40 bars)
          const barCount = 40;
          const barWidth = width / barCount;
          const gap = 2;

          for (let i = 0; i < barCount; i++) {
              let value = 0;
              if (rawData && rawData.length > 0) {
                   // Map i to index in rawData
                   const index = Math.floor((i / barCount) * (rawData.length / 2)); 
                   value = rawData[index] || 0;
              }
              
              const percent = value / 255;
              // Make bars bounce from bottom
              const barHeight = Math.max(4, percent * height); 

              const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
              gradient.addColorStop(0, '#ccff00');
              gradient.addColorStop(1, '#00ffff');

              ctx.fillStyle = gradient;
              // Use roundRect if supported, else rect
              if (ctx.roundRect) {
                 ctx.beginPath();
                 ctx.roundRect(i * barWidth, height - barHeight, barWidth - gap, barHeight, [2, 2, 0, 0]);
                 ctx.fill();
              } else {
                 ctx.fillRect(i * barWidth, height - barHeight, barWidth - gap, barHeight);
              }
          }

          animationRef.current = requestAnimationFrame(draw);
      };
      draw();
  };

  const stopVisualizer = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleTimeUpdate = () => {
      if (audioRef.current) {
          const curr = audioRef.current.currentTime;
          const dur = audioRef.current.duration;
          if (dur && !isNaN(dur)) {
             setCurrentTime(curr);
             setDuration(dur);
             setProgress((curr / dur) * 100);
          }
      }
  };

  const handleEnded = () => {
      onPlayPause(); 
      setProgress(0);
      stopVisualizer();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
      if (audioRef.current && duration > 0) {
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          audioRef.current.currentTime = pos * duration;
      }
  };

  const formatTime = (time: number) => {
      if (!time || isNaN(time)) return "0:00";
      const min = Math.floor(time / 60);
      const sec = Math.floor(time % 60);
      return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  useEffect(() => {
      const event = new CustomEvent('music-time-update', { detail: currentTime });
      window.dispatchEvent(event);
  }, [currentTime]);

  if (!currentSong || !currentSong.fileUrl) return null;

  return (
    <>
        {/* DRAGGABLE SPIRIT CHARACTER (Passes Data Fetcher) */}
        <DraggableSpirit isPlaying={isPlaying} getVisualData={getVisualData} />

        {/* BOTTOM PLAYER BAR */}
        {/* Adjusted bottom position for mobile to sit above navigation bar */}
        <div className="fixed bottom-[80px] lg:bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl glass-high rounded-[2rem] z-50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-t border-white/20 overflow-hidden transition-all duration-300">
        
            <audio 
                key={currentSong.id} 
                ref={audioRef}
                src={currentSong.fileUrl}
                crossOrigin="anonymous" 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={(e) => {
                    console.error("Native Audio Error", e);
                    setHasError(true);
                    if(isPlaying) onPlayPause();
                }}
            />

            {/* 1. Song Info */}
            <div className="flex items-center w-full md:w-1/4 min-w-0 gap-3 md:gap-4 relative z-10 group/info">
                <div 
                    className="relative cursor-pointer w-12 h-12 md:w-16 md:h-16 shrink-0 transition-transform group-hover/info:scale-105"
                    onClick={onToggleLyrics}
                >
                    <div className={`absolute inset-0 rounded-full border-[2px] border-white/20 bg-black flex items-center justify-center overflow-hidden shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                        <img 
                        src={currentSong.coverUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute w-2 md:w-3 h-2 md:h-3 bg-black rounded-full border border-gray-700 z-10"></div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/info:opacity-100 flex items-center justify-center transition-opacity z-20 backdrop-blur-[1px]">
                        <Expand className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h3 className="text-white font-bold text-sm md:text-base whitespace-nowrap hover:text-brand-lime transition-colors cursor-pointer truncate" onClick={onToggleLyrics}>
                        {currentSong.title}
                        </h3>
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                        {currentSong.artist}
                    </p>
                    {/* Mobile Only Progress Text */}
                    <div className="md:hidden flex items-center gap-1 text-[10px] text-gray-500 font-mono mt-0.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Mobile Play Button (Right Aligned) */}
                <button 
                    onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                    className="md:hidden w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
            </div>

            {/* 2. Controls (Desktop Only mainly) */}
            <div className="hidden md:flex flex-col items-center w-1/2 px-4 relative z-10">
                <div className="flex items-center gap-6 mb-2">
                <button className="text-gray-400 hover:text-white hover:scale-110 transition-all">
                    <SkipBack className="w-6 h-6 fill-current" />
                </button>
                
                <button 
                    onClick={onPlayPause}
                    disabled={hasError}
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg
                    ${isPlaying 
                        ? 'bg-brand-lime text-black shadow-[0_0_25px_rgba(204,255,0,0.5)] scale-110' 
                        : 'bg-white text-black hover:bg-brand-lime hover:scale-110'}
                    ${hasError ? 'opacity-50 cursor-not-allowed bg-red-900 text-red-200' : ''}
                    `}
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                
                <button className="text-gray-400 hover:text-white hover:scale-110 transition-all">
                    <SkipForward className="w-6 h-6 fill-current" />
                </button>
                </div>
                
                <div className="w-full max-w-lg flex items-center gap-3 relative h-10">
                <span className="text-xs font-mono text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
                <div 
                    className="flex-1 h-full relative group cursor-pointer flex items-end"
                    onClick={handleSeek}
                    >
                    <canvas 
                        ref={canvasRef} 
                        width={300} 
                        height={32} 
                        className={`w-full h-full absolute bottom-0 left-0 transition-opacity duration-500 pointer-events-none ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                    />
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden absolute bottom-2 left-0 group-hover:h-2 transition-all z-10">
                        <div 
                            className="absolute h-full bg-white group-hover:bg-brand-lime shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <span className="text-xs font-mono text-gray-500 w-10">{formatTime(duration)}</span>
                </div>
            </div>

            {/* 3. Volume (Desktop Only) */}
            <div className="hidden md:flex items-center justify-end w-1/4 gap-4 relative z-10">
                <button onClick={onToggleLyrics} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors group">
                    <Mic2 className="w-5 h-5 text-gray-400 group-hover:text-brand-lime" />
                </button>

                <div className="flex items-center gap-2 group">
                <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />}
                </button>
                </div>
            </div>
            
            {/* Mobile Progress Bar (Absolute Bottom) */}
            <div className="md:hidden absolute bottom-0 left-0 w-full h-1 bg-white/10" onClick={handleSeek}>
                <div 
                    className="h-full bg-brand-lime shadow-[0_0_10px_var(--brand-primary)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    </>
  );
};
