// This service communicates with the Worker API endpoints defined in worker.js

export interface AppData {
  songs: any[];
  mvs: any[];
  galleryItems: any[];
  djSets: any[];
  articles: any[];
  playlists: any[];
  pageHeaders: any;
  themeId: string;
}

const API_BASE = '/api';

export const cloudService = {
  // 1. Sync Data (Load)
  loadData: async (): Promise<AppData | null> => {
    try {
      const res = await fetch(`${API_BASE}/sync`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      if (data.empty) return null; // No data in KV yet
      return data as AppData;
    } catch (error) {
      console.error("Cloud Load Error:", error);
      return null;
    }
  },

  // 2. Sync Data (Save)
  saveData: async (data: AppData): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (error) {
      console.error("Cloud Save Error:", error);
      return false;
    }
  },

  // 3. Upload File to R2
  uploadFile: async (file: File): Promise<string | null> => {
    try {
      // Create a clean filename
      const ext = file.name.split('.').pop();
      const filename = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      
      const res = await fetch(`${API_BASE}/upload?filename=${filename}`, {
        method: 'PUT',
        body: file, // Send raw binary
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Cloud Upload Error:", error);
      return null;
    }
  }
};
