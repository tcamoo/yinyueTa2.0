

import { Song, GalleryItem, MV, Playlist, Theme, DJSet, Article, PageHeaders, View } from './types';

// --- PAGE HEADERS ---
export const DEFAULT_HEADERS: PageHeaders = {
  [View.HOME]: {
    title: '首映现场',
    subtitle: 'PREMIERE',
    description: '探索声音与视觉的边界，一场关于赛博未来的视听盛宴。'
  },
  [View.CHARTS]: {
    title: '流行趋势',
    subtitle: 'POPULAR TRENDS',
    description: '捕捉全球频率共振。从独立地下到主流巅峰，此刻正在发生的听觉盛宴。'
  },
  [View.DJ]: {
    title: '舞池核心',
    subtitle: 'CLUB ZONE',
    description: '这里没有暂停键。只有 128 BPM 的心脏跳动。'
  },
  [View.ARTICLES]: {
    title: '深度专栏',
    subtitle: 'MAGAZINE',
    description: '探索音乐背后的文化、技术与故事。为您精选的深度阅读体验。'
  },
  [View.MV]: {
    title: 'MV 频道',
    subtitle: 'VISUAL CHANNEL',
    description: '视觉与听觉的终极共鸣。'
  }
};

// --- THEME PRESETS ---
export const THEMES: Theme[] = [
  {
    id: 'cyberpunk',
    name: '赛博霓虹',
    colors: {
      primary: '#ccff00',   // Acid Lime
      secondary: '#ff0099', // Hot Pink
      accent: '#00ffff',    // Cyan
      bgDeep: '#050505',
      bgSurface: '#0a0a0a',
    },
    previewColor: '#ccff00'
  },
  {
    id: 'acid',
    name: '酸性黑金',
    colors: {
      primary: '#D9F99D', 
      secondary: '#FCD34D',
      accent: '#F87171',
      bgDeep: '#000000',
      bgSurface: '#111111',
    },
    previewColor: '#D9F99D'
  },
  {
    id: 'deep-ocean',
    name: '深海极光',
    colors: {
      primary: '#22d3ee',   
      secondary: '#f472b6', 
      accent: '#818cf8',    
      bgDeep: '#020617',    
      bgSurface: '#0f172a', 
    },
    previewColor: '#22d3ee'
  },
  {
    id: 'volcanic',
    name: '火山黑曜',
    colors: {
      primary: '#fb923c',   
      secondary: '#dc2626', 
      accent: '#fbbf24',    
      bgDeep: '#180404',    
      bgSurface: '#250808', 
    },
    previewColor: '#fb923c'
  },
  {
    id: 'royal',
    name: '皇家紫金',
    colors: {
      primary: '#d8b4fe',   
      secondary: '#f0abfc', 
      accent: '#818cf8',    
      bgDeep: '#1e1b4b',    
      bgSurface: '#2e1065', 
    },
    previewColor: '#d8b4fe'
  }
];

// Reliable, direct MP3 links from Free Music Archive & Archive.org
export const MOCK_SONGS: Song[] = [
  {
    id: '1',
    title: 'Night Owl',
    artist: 'Broke For Free',
    coverUrl: 'https://picsum.photos/id/111/400/400',
    duration: '3:22',
    plays: 1250043,
    description: 'Minimal Techno 的经典之作，仿佛置身于深夜的柏林地下。',
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3',
    lyrics: `[00:10.00] Night lights passing by
[00:20.50] In the shadow of the owl
[00:45.00] (Instrumental Break)
[01:10.00] Deep in the concrete jungle
[01:25.00] We find our rhythm`
  },
  {
    id: '2',
    title: 'Enthusiast',
    artist: 'Tours',
    coverUrl: 'https://picsum.photos/id/212/400/400',
    duration: '3:35',
    plays: 890200,
    description: '充满活力的合成器纹理，适合在高速公路上飞驰时聆听。',
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3'
  },
  {
    id: '3',
    title: 'Shipping Lanes',
    artist: 'Chad Crouch',
    coverUrl: 'https://picsum.photos/id/313/400/400',
    duration: '3:18',
    plays: 560000,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Shipping_Lanes.mp3'
  },
  {
    id: '4',
    title: 'Algorithms',
    artist: 'Chad Crouch',
    coverUrl: 'https://picsum.photos/id/414/400/400',
    duration: '2:58',
    plays: 430120,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Chad_Crouch/Arps/Chad_Crouch_-_Algorithms.mp3'
  },
  {
    id: '5',
    title: 'Moonlight Reprise',
    artist: 'Kai Engel',
    coverUrl: 'https://picsum.photos/id/515/400/400',
    duration: '3:42',
    plays: 320000,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Irsens_Tale/Kai_Engel_-_04_-_Moonlight_Reprise.mp3'
  },
];

export const NEW_RELEASES: Song[] = [
  {
    id: 'n1',
    title: 'Sentinel',
    artist: 'Kai Engel',
    coverUrl: 'https://picsum.photos/id/88/400/400',
    duration: '3:45',
    plays: 1200,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/ccCommunity/Kai_Engel/Satin/Kai_Engel_-_04_-_Sentinel.mp3'
  },
  {
    id: 'n2',
    title: 'Visualizations',
    artist: 'Podington Bear',
    coverUrl: 'https://picsum.photos/id/99/400/400',
    duration: '4:20',
    plays: 3400,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Podington_Bear/Inspiration/Podington_Bear_-_Visualizations.mp3'
  },
  {
    id: 'n3',
    title: 'Sepia',
    artist: 'Podington Bear',
    coverUrl: 'https://picsum.photos/id/128/400/400',
    duration: '5:10',
    plays: 900,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Podington_Bear/Brooding/Podington_Bear_-_Sepia.mp3'
  },
  {
    id: 'n4',
    title: 'Filaments',
    artist: 'Podington Bear',
    coverUrl: 'https://picsum.photos/id/221/400/400',
    duration: '2:55',
    plays: 5600,
    fileUrl: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/Music_for_Video/Podington_Bear/Atmospheric/Podington_Bear_-_Filaments.mp3'
  }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'art1',
    title: '模拟合成器的复兴：为何我们需要“不完美”的声音？',
    excerpt: '在数字化精准的今天，电压的不稳定性反而成为了一种昂贵的美学。DAW 里的波形是数学的产物，是冰冷的逻辑。而模拟电路受温度、湿度甚至电源纯净度的影响。',
    content: '在 2024 年的音乐制作领域，我们见证了一场前所未有的“硬件复兴”。从 Moog 到 Korg，各大厂商都在复刻 80 年代的经典电路。为什么？因为数字音频太完美了。DAW 里的波形是数学的产物，是冰冷的逻辑。而模拟电路受温度、湿度甚至电源纯净度的影响，这种不可预测的“漂移”正是人类听觉渴望的有机质感...\n\n当我们谈论“温暖”的声音时，我们实际上是在谈论失真。偶次谐波失真让声音听起来更厚实，而磁带的轻微抖动（Wow & Flutter）则带来了一种怀旧的时间感。',
    author: 'Noise Architect',
    date: '2024-10-24',
    coverUrl: 'https://picsum.photos/id/453/800/400',
    mood: '#ff4d4d', // Intense
    tags: ['Tech', 'Synth', 'Opinion'],
    linkedSongId: '1'
  },
  {
    id: 'art2',
    title: '东京地下 Club 指南：涩谷之外的低频避难所',
    excerpt: '避开游客拥挤的知名夜店，带你潜入只有资深 Raver 才知道的隐秘舞池。这里没有招牌，只有一扇厚重的铁门。',
    content: '如果你厌倦了 WOMB 的排队人潮，不妨在凌晨 2 点转入这个不起眼的小巷。这里没有招牌，只有一扇厚重的铁门和溢出门缝的 Sub-bass。这里的 DJ 不放 Top 100，只专注于 Minimal Techno 和实验电子。\n\n酒保不说话，每个人都在闭眼跳舞。这是东京的 B 面，是属于孤独者的低频避难所。在这座巨大的赛博都市中，只有在 130 BPM 的节奏里，我们才能找到片刻的真实。',
    author: 'Night Walker',
    date: '2024-10-22',
    coverUrl: 'https://picsum.photos/id/244/800/400',
    mood: '#00ffff', // Cyber
    tags: ['Travel', 'Club Culture', 'Tokyo'],
    linkedSongId: 'dj1'
  },
  {
    id: 'art3',
    title: '算法是否正在杀死小众流派？',
    excerpt: '当推荐系统只通过“完播率”来判断音乐好坏时，那些需要耐心聆听的长篇巨制正在消失。',
    content: '流媒体平台的算法逻辑很简单：如果听众在 5 秒内切歌，这首歌就是“垃圾”。为了迎合算法，歌曲的前奏消失了，副歌被提前了，时长被压缩到 2 分钟。这种快餐化的生产模式正在扼杀 Post-Rock、Ambient 这样需要铺垫的流派。\n\n我们需要重新夺回主动选择的权力，而不是被动接受投喂。去寻找那些没有被算法标记的角落，去听完整张专辑，去阅读 Liner Notes。',
    author: 'AI Critic',
    date: '2024-10-20',
    coverUrl: 'https://picsum.photos/id/345/800/400',
    mood: '#7928ca', // Emo
    tags: ['Industry', 'AI', 'Culture'],
    linkedSongId: '2'
  }
];

export const MOODS = [
  { label: '极致愤怒', color: '#ff4d4d' },
  { label: '赛博忧郁', color: '#00ffff' },
  { label: '迷幻药', color: '#ccff00' },
  { label: '工业噪音', color: '#ffffff' },
  { label: '酸性爵士', color: '#ff0099' },
  { label: '深夜EMO', color: '#7928ca' },
];

export const RADIO_STATIONS = [
  { id: 'r1', name: '24/7 Lo-Fi Girl', listeners: '12k', img: 'https://picsum.photos/id/345/200/200' },
  { id: 'r2', name: 'Synthwave Radio', listeners: '8.4k', img: 'https://picsum.photos/id/349/200/200' },
  { id: 'r3', name: 'Classical Focus', listeners: '5k', img: 'https://picsum.photos/id/366/200/200' },
  { id: 'r4', name: 'Jazz Bar', listeners: '3.2k', img: 'https://picsum.photos/id/399/200/200' },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: 'g1', title: '录音室·光', photographer: 'Lina W.', imageUrl: 'https://picsum.photos/id/240/600/800', spanClass: 'col-span-1 row-span-2' },
  { id: 'g2', title: '万人现场', photographer: 'Rock Star', imageUrl: 'https://picsum.photos/id/241/800/400', spanClass: 'col-span-2 row-span-1' },
  { id: 'g3', title: '黑胶·时光', photographer: 'Old School', imageUrl: 'https://picsum.photos/id/242/400/400', spanClass: 'col-span-1 row-span-1' },
  { id: 'g4', title: '幕后花絮', photographer: 'Candid Cam', imageUrl: 'https://picsum.photos/id/243/400/400', spanClass: 'col-span-1 row-span-1' },
  { id: 'g5', title: '狂热崇拜', photographer: 'Crowd Surf', imageUrl: 'https://picsum.photos/id/244/800/600', spanClass: 'col-span-2 row-span-2' },
  { id: 'g6', title: '琴弦特写', photographer: 'Macro Music', imageUrl: 'https://picsum.photos/id/250/400/600', spanClass: 'col-span-1 row-span-2' },
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: '深夜emo专用',
    description: '当城市入睡，这些声音陪你醒着。',
    coverUrl: 'https://picsum.photos/id/102/300/300',
    songCount: 42
  },
  {
    id: 'p2',
    name: '代码编译中...',
    description: '高专注度电子乐，提升你的生产力。',
    coverUrl: 'https://picsum.photos/id/160/300/300',
    songCount: 128
  }
];

// --- HELPER TO GENERATE LARGE DATA SETS ---

const MV_SOURCES = [
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

const DJ_SOURCES = [
    'https://archive.org/download/classic-house-mixtape-1990/Classic%20House%20Mixtape%201990.mp3',
    'https://archive.org/download/Techno_Mix_March_2003/01_Techno_Mix_March_2003.mp3',
    'https://archive.org/download/IbizaChilloutLoungeMix/Ibiza%20Chillout%20Lounge%20Mix.mp3',
    'https://archive.org/download/LTJBukemLogicalProgressionLevel1CD1/LTJ%20Bukem%20-%20Logical%20Progression%20Level%201%20-%20CD1.mp3'
];

// Expanded Data Pools for 100 items
const MV_TITLES_PART1 = ['Cyber', 'Neon', 'Future', 'Midnight', 'Electric', 'Quantum', 'Void', 'Solar', 'Lunar', 'Hyper', 'Sonic', 'Velvet', 'Chrome', 'Liquid', 'Ghost'];
const MV_TITLES_PART2 = ['City', 'Dreams', 'Memories', 'Pulse', 'Wave', 'Motion', 'Drift', 'Echo', 'Vibe', 'Soul', 'Runner', 'Dancer', 'Engine', 'Protocol', 'System'];
const MV_TITLES_CN = ['光影之都', '赛博朋克', '未来边缘', '午夜飞行', '霓虹恶魔', '量子纠缠', '深海回响', '星际穿越', '虚空行者', '电子羊', '最后的浪漫', '重力反转', '时间尽头', '数字雨'];
const ARTISTS_POOL = ['The Weeknd', 'Daft Punk', 'Kavinsky', 'Justice', 'Gesaffelstein', 'Nina Kraviz', 'Peggy Gou', 'Skrillex', 'Deadmau5', 'Aphex Twin', 'Grimes', 'Porter Robinson', 'Madeon', 'Rüfüs Du Sol', 'Odesza', 'Flume', 'Disclosure', 'Zedd', 'Martin Garrix', 'Calvin Harris'];
const CATEGORIES = ['Cinematic', 'Animation', 'Live', 'VFX', 'Sci-Fi', 'Surreal', 'Promo', 'Documentary'];

const generateMockMVs = (count: number): MV[] => {
    return Array.from({ length: count }).map((_, i) => {
        const isEnglish = Math.random() > 0.4; // 60% English, 40% Chinese
        const title = isEnglish 
            ? `${MV_TITLES_PART1[Math.floor(Math.random() * MV_TITLES_PART1.length)]} ${MV_TITLES_PART2[Math.floor(Math.random() * MV_TITLES_PART2.length)]}`
            : `${MV_TITLES_CN[Math.floor(Math.random() * MV_TITLES_CN.length)]} ${Math.floor(Math.random() * 999)}`;
        
        return {
            id: `mv_gen_${i}`,
            title: title,
            artist: ARTISTS_POOL[Math.floor(Math.random() * ARTISTS_POOL.length)],
            // Use unique seed for each image to ensure no duplicates
            coverUrl: `https://picsum.photos/seed/mv_v2_${i}/800/450`, 
            videoUrl: MV_SOURCES[i % MV_SOURCES.length],
            duration: `0${Math.floor(Math.random() * 5) + 3}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            views: Math.floor(Math.random() * 9000000) + 50000,
            tags: ['4K', Math.random() > 0.5 ? '60FPS' : 'HDR', 'Official'],
            category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
            isFeatured: i === 0 
        };
    });
};

const DJ_TITLES_PREFIX = ['Cyber', 'Neon', 'Deep', 'Acid', 'Future', 'Retro', 'Space', 'Urban', 'Night', 'Dark'];
const DJ_TITLES_SUFFIX = ['Dreams', 'Rider', 'Flow', 'Wave', 'Pulse', 'Vibes', 'City', 'Runner', 'Soul', 'Mind'];

const generateMockDJSets = (count: number): DJSet[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `dj_gen_${i}`,
        title: `${DJ_TITLES_PREFIX[i % DJ_TITLES_PREFIX.length]} Club Mix Vol.${i + 1}`,
        djName: `DJ ${DJ_TITLES_SUFFIX[i % DJ_TITLES_SUFFIX.length]}`,
        coverUrl: `https://picsum.photos/seed/dj${i}/400/400`,
        fileUrl: DJ_SOURCES[i % DJ_SOURCES.length],
        duration: `${40 + (i % 40)}:00`,
        bpm: 120 + (i % 30),
        tags: [i % 2 === 0 ? 'House' : 'Techno', 'Mix'],
        plays: Math.floor(Math.random() * 100000) + 5000
    }));
};

export const MOCK_MVS: MV[] = generateMockMVs(100);
export const MOCK_DJ_SETS: DJSet[] = generateMockDJSets(50);
