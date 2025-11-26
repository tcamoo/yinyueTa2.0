

export enum View {
  HOME = 'HOME',
  CHARTS = 'CHARTS',
  GALLERY = 'GALLERY',
  LIBRARY = 'LIBRARY',
  MV = 'MV',
  PLAYLISTS = 'PLAYLISTS',
  DJ = 'DJ',
  ARTICLES = 'ARTICLES',
  SOFTWARE = 'SOFTWARE', // New View
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  fileUrl?: string;
  plays: number;
  description?: string;
  neteaseId?: string;
  lyrics?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  photographer: string;
  spanClass: string;
}

export interface MV {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  videoUrl: string;
  duration: string;
  views: number;
  tags: string[];
  category?: string;
  isFeatured?: boolean; 
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songCount: number;
}

export interface DJSet {
  id: string;
  title: string;
  djName: string;
  coverUrl: string;
  fileUrl: string;
  duration: string;
  bpm: number;
  tags: string[];
  plays: number;
  description?: string;
  neteaseId?: string;
}

export interface ArticleContentStyle {
  fontFamily: 'sans' | 'serif' | 'mono' | 'art';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  lineHeight: 'tight' | 'normal' | 'loose';
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  coverUrl: string;
  date: string;
  mood: string; 
  linkedSongId?: string;
  tags: string[];
  style?: ArticleContentStyle;
}

// New Interface for Software/Resources
export interface SoftwareItem {
  id: string;
  name: string;
  version: string;
  description: string;
  platform: 'win' | 'mac' | 'linux' | 'mobile' | 'cloud';
  size: string;
  provider: 'r2' | 'aliyun' | 'onedrive' | 'google' | 'other';
  downloadUrl: string;
  iconUrl?: string; // Optional custom icon
  updateDate: string;
  isOfficial?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;   
    secondary: string; 
    accent: string;    
    bgDeep: string;
    bgSurface: string;
  };
  previewColor: string;
}

export interface PageHeaderConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredItemId?: string; 
}

export type PageHeaders = Record<string, PageHeaderConfig>;
