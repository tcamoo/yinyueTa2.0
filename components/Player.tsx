
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
const DraggableSpirit = ({ isPlaying, analyser }: { isPlaying: boolean, analyser: AnalyserNode | null }) => {
    // Default position: centered horizontally, slightly above bottom
    const [pos, setPos] = useState({ x: window.innerWidth / 2 - 40, y: window.innerHeight - 180 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    // Handle Window Resize to keep it on screen
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => ({
                x: Math.min(prev.x, window.innerWidth - 80),
                y: Math.min(prev.y, window.innerHeight - 80)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drag Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPos({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };
        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
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
            const radius = 30; // Base radius

            ctx.clearRect(0, 0, width, height);

            // Get Frequency Data
            let bass = 0;
            let mid = 0;
            let high = 0;
            
            if (analyser) {
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                // Simple average for bands
                const bassSlice = dataArray.slice(0, 10);
                const midSlice = dataArray.slice(10, 50);
                const highSlice = dataArray.slice(50, 100);

                bass = bassSlice.reduce((a, b) => a + b, 0) / bassSlice.length;
                mid = midSlice.reduce((a, b) => a + b, 0) / midSlice.length;
                high = highSlice.reduce((a, b) => a + b, 0) / highSlice.length;
            } else if (isPlaying) {
                // Simulation fallback
                const time = Date.now() / 1000;
                bass = 100 + Math.sin(time * 10) * 50;
                mid = 80 + Math.cos(time * 5) * 30;
                high = 60 + Math.sin(time * 20) * 20;
            }

            const scale = 1 + (bass / 255) * 0.5; // Bass pulses size
            const glow = (mid / 255); // Mids control glow opacity
            const jitter = (high / 255) * 5; // Highs control jitter

            // Draw Glow
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * scale * 0.8, centerX, centerY, radius * scale * 3);
            gradient.addColorStop(0, `rgba(204, 255, 0, ${0.2 + glow * 0.5})`); // Brand Lime
            gradient.addColorStop(0.5, `rgba(0, 255, 255, ${glow * 0.3})`);   // Brand Cyan
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * scale * 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw Core Spirit
            ctx.beginPath();
            // Deform shape based on bass
            for (let i = 0; i <= 360; i += 10) {
                const angle = (i * Math.PI) / 180;
                // Add some organic noise
                const noise = Math.sin((i + Date.now()/20) * 0.1) * jitter; 
                const r = (radius * scale) + noise;
                const x = centerX + Math.cos(angle) * r;
                const y = centerY + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ccff00';
            ctx.shadowBlur = 20 + bass * 0.2;
            ctx.fill();

            // Eyes (Blink and move)
            const time = Date.now() / 1000;
            const eyeOffsetX = Math.sin(time) * 5;
            const blink = Math.sin(time * 3) > 0.95 ? 0.1 : 1; // Random blink
            
            ctx.fillStyle = '#000';
            ctx.shadowBlur = 0;
            // Left Eye
            ctx.beginPath();
            ctx.ellipse(centerX - 10 + eyeOffsetX, centerY - 2, 4, 4 * blink, 0, 0, Math.PI * 2);
            ctx.fill();
            // Right Eye
            ctx.beginPath();
            ctx.ellipse(centerX + 10 + eyeOffsetX, centerY - 2, 4, 4 * blink, 0, 0, Math.PI * 2);
            ctx.fill();

            rafRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [analyser, isPlaying]);

    return (
        <div 
            className="fixed z-[100] cursor-move transition-transform duration-75 active:scale-110 active:cursor-grabbing"
            style={{ 
                left: pos.x, 
                top: pos.y,
                transform: `translate3d(0,0,0) scale(${isDragging ? 1.1 : 1})`,
                touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
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
  
  // Audio Context for real visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Handle Play/Pause Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentSong?.fileUrl) return;

    setHasError(false);

    const handlePlayback = async () => {
        try {
            if (isPlaying) {
                // Initialize Audio Context if user interacts
                if (!audioContextRef.current) {
                    try {
                        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                        const ctx = new AudioContext();
                        audioContextRef.current = ctx;
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 256; // Higher resolution for Spirit
                        analyserRef.current = analyser;
                        
                        if (!sourceRef.current) {
                           const source = ctx.createMediaElementSource(audio);
                           sourceRef.current = source;
                           source.connect(analyser);
                           analyser.connect(ctx.destination);
                        }
                    } catch (e) {
                        console.warn("Audio Context init failed (likely CORS), falling back to simulation", e);
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

  // Bottom Bar Visualizer
  const startVisualizer = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      const draw = () => {
          if (!canvasRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          const width = canvasRef.current.width;
          const height = canvasRef.current.height;
          ctx.clearRect(0, 0, width, height);
          
          let dataArray: Uint8Array | null = null;
          if (analyserRef.current) {
               const bufferLength = analyserRef.current.frequencyBinCount;
               dataArray = new Uint8Array(bufferLength);
               analyserRef.current.getByteFrequencyData(dataArray);
          }

          const barWidth = 4;
          const gap = 2;
          const totalBars = Math.floor(width / (barWidth + gap));

          for (let i = 0; i < totalBars; i++) {
              let value = 0;
              if (dataArray) {
                   // Map bars to frequency data (lower frequencies on left)
                   const index = Math.floor((i / totalBars) * (dataArray.length / 2)); 
                   value = dataArray[index] || 0;
              } else {
                   // Fallback simulation
                   value = Math.random() * 50 + 50 * (isPlaying ? 1 : 0);
              }
              
              const percent = value / 255;
              const barHeight = percent * height * 0.8;

              const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
              gradient.addColorStop(0, '#ccff00');
              gradient.addColorStop(1, '#00ffff');

              ctx.fillStyle = gradient;
              ctx.roundRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight, 2);
              ctx.fill();
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
        {/* DRAGGABLE SPIRIT CHARACTER */}
        <DraggableSpirit isPlaying={isPlaying} analyser={analyserRef.current} />

        {/* BOTTOM PLAYER BAR */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-6xl glass-high rounded-3xl z-50 px-6 py-4 flex items-center justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-t border-white/20 overflow-hidden">
        
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
            <div className="flex items-center w-1/4 min-w-0 gap-4 relative z-10 group/info">
                <div 
                    className="relative cursor-pointer w-16 h-16 transition-transform group-hover/info:scale-105"
                    onClick={onToggleLyrics}
                >
                    <div className={`absolute inset-0 rounded-full border-[2px] border-white/20 bg-black flex items-center justify-center overflow-hidden shadow-2xl ${isPlaying ? 'animate-spin-slow' : ''}`}>
                        <img 
                        src={currentSong.coverUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute w-3 h-3 bg-black rounded-full border border-gray-700 z-10"></div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/info:opacity-100 flex items-center justify-center transition-opacity z-20 backdrop-blur-[1px]">
                        <Expand className="w-6 h-6 text-white" />
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <h3 className="text-white font-bold text-base whitespace-nowrap hover:text-brand-lime transition-colors cursor-pointer" onClick={onToggleLyrics}>
                    {currentSong.title}
                    </h3>
                    {hasError && <span className="text-[10px] bg-red-500/20 text-red-500 border border-red-500/30 px-1 rounded font-mono">Error</span>}
                </div>
                <p className="text-gray-400 text-xs truncate">
                    {currentSong.artist}
                </p>
                </div>
            </div>

            {/* 2. Controls */}
            <div className="flex flex-col items-center w-1/2 px-4 relative z-10">
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

            {/* 3. Volume */}
            <div className="flex items-center justify-end w-1/4 gap-4 relative z-10">
                <button onClick={onToggleLyrics} className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors group">
                    <Mic2 className="w-5 h-5 text-gray-400 group-hover:text-brand-lime" />
                </button>

                <div className="hidden lg:flex items-center gap-2 group">
                <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />}
                </button>
                </div>
            </div>
        </div>
    </>
  );
};
