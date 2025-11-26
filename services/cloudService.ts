

// This service communicates with the Worker API endpoints defined in worker.js

export interface AppData {
  songs: any[];
  mvs: any[];
  galleryItems: any[];
  djSets: any[];
  articles: any[];
  playlists: any[];
  softwareItems?: any[]; // Added software support
  pageHeaders: any;
  themeId: string;
}

export interface R2File {
    key: string;
    size: number;
    uploaded: string;
    url: string;
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

  // 0. Verify Key (New)
  verifyKey: async (key: string): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE}/auth`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key })
          });
          if (res.ok) {
              const data = await res.json();
              return data.valid === true;
          }
          return false;
      } catch (e) {
          console.error("Auth check failed", e);
          return false;
      }
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
          throw new Error(err.error || `Error ${res.status}`);
      }
      return true;
    } catch (error: any) {
      console.error("Cloud Save Error:", error);
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
  },

  // 4. List R2 Files (New) - Protected
  listStorage: async (): Promise<{ files: R2File[] }> => {
      try {
          const headers: Record<string, string> = {};
          const key = cloudService.getAdminKey();
          if (key) headers['x-admin-key'] = key;

          const res = await fetch(`${API_BASE}/storage/list`, {
              method: 'GET',
              headers: headers
          });

          if (!res.ok) throw new Error("Failed to list files");
          return await res.json();
      } catch (error: any) {
          console.error("Storage List Error:", error);
          throw error;
      }
  },

  // 5. Delete R2 File (New) - Protected
  deleteStorage: async (key: string): Promise<boolean> => {
      try {
          const headers: Record<string, string> = {};
          const adminKey = cloudService.getAdminKey();
          if (adminKey) headers['x-admin-key'] = adminKey;

          const res = await fetch(`${API_BASE}/storage/delete?key=${encodeURIComponent(key)}`, {
              method: 'DELETE',
              headers: headers
          });

          if (!res.ok) throw new Error("Failed to delete file");
          return true;
      } catch (error: any) {
          console.error("Storage Delete Error:", error);
          throw error;
      }
  }
};
