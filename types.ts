

export enum View {
  HOME = 'HOME',
  CHARTS = 'CHARTS',
  GALLERY = 'GALLERY',
  LIBRARY = 'LIBRARY',
  MV = 'MV',
  PLAYLISTS = 'PLAYLISTS',
  DJ = 'DJ',
  ARTICLES = 'ARTICLES',
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
  isFeatured?: boolean; // New field for homepage customization
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
  mood: string; // Hex color
  linkedSongId?: string;
  tags: string[];
  style?: ArticleContentStyle;
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

export interface StorageConfig {
  provider: 'R2' | 'S3' | 'MinIO';
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicUrlBase: string;
}

export interface PageHeaderConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredItemId?: string; // For setting a hero song/set on Charts/DJ pages
}

export type PageHeaders = Record<string, PageHeaderConfig>;