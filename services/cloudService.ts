

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
      if (!res.ok) {
          // If 503 or other error, it means backend not ready or errored
          console.warn("Cloud sync endpoint returned status:", res.status);
          return null;
      }
      const data = await res.json();
      if (data.warning) console.warn(data.warning);
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
      
      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.error) alert(`保存失败: ${err.error}`);
          return false;
      }
      return true;
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

      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.error) alert(`上传失败: ${err.error}`);
          return null;
      }
      
      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Cloud Upload Error:", error);
      return null;
    }
  }
};
