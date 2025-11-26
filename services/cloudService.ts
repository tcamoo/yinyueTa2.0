
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
const ADMIN_KEY_STORAGE = 'yinyuetai_admin_key';

export const cloudService = {
  // Local Storage Management for Admin Key
  setAdminKey: (key: string) => {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
  },

  getAdminKey: (): string => {
    return localStorage.getItem(ADMIN_KEY_STORAGE) || '';
  },

  // 1. Sync Data (Load) - Public
  loadData: async (): Promise<AppData | null> => {
    try {
      const res = await fetch(`${API_BASE}/sync`);
      if (!res.ok) {
          console.warn("Cloud sync endpoint returned status:", res.status);
          return null;
      }
      const data = await res.json();
      if (data.warning) console.warn("Backend Warning:", data.warning);
      if (data.empty) return null; // No data in KV yet
      return data as AppData;
    } catch (error) {
      console.error("Cloud Load Error:", error);
      return null;
    }
  },

  // 2. Sync Data (Save) - Protected
  saveData: async (data: AppData): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const key = cloudService.getAdminKey();
      if (key) headers['x-admin-key'] = key;

      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          // Throw error text to be caught by UI
          throw new Error(err.error || `Error ${res.status}`);
      }
      return true;
    } catch (error: any) {
      console.error("Cloud Save Error:", error);
      // Re-throw to let UI handle the specific error message (e.g. Unauthorized)
      throw error;
    }
  },

  // 3. Upload File to R2 - Protected
  uploadFile: async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const filename = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      
      const headers: Record<string, string> = {};
      const key = cloudService.getAdminKey();
      if (key) headers['x-admin-key'] = key;

      const res = await fetch(`${API_BASE}/upload?filename=${filename}`, {
        method: 'PUT',
        headers: headers,
        body: file,
      });

      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
      }
      
      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Cloud Upload Error:", error);
      alert(error instanceof Error ? error.message : "Upload Failed");
      return null;
    }
  }
};
