import { useState, useEffect, useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SyncData {
  tracks: any[];
  playlists: any[];
  settings: any;
  mappings: any[];
  presets: any[];
}

interface CloudSyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
  progress: number;
}

interface MixerDB extends DBSchema {
  tracks: {
    key: string;
    value: any;
  };
  playlists: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
  mappings: {
    key: string;
    value: any;
  };
  presets: {
    key: string;
    value: any;
  };
}

export const useCloudSync = () => {
  const [state, setState] = useState<CloudSyncState>({
    isSyncing: false,
    lastSync: null,
    error: null,
    progress: 0
  });

  const [db, setDB] = useState<IDBPDatabase<MixerDB> | null>(null);

  // Initialize IndexedDB
  const initializeDB = useCallback(async () => {
    try {
      const database = await openDB<MixerDB>('mixer', 1, {
        upgrade(db) {
          db.createObjectStore('tracks');
          db.createObjectStore('playlists');
          db.createObjectStore('settings');
          db.createObjectStore('mappings');
          db.createObjectStore('presets');
        }
      });
      setDB(database);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize database'
      }));
    }
  }, []);

  // Save data to IndexedDB
  const saveToLocal = useCallback(async (data: SyncData) => {
    if (!db) return;

    try {
      const tx = db.transaction(['tracks', 'playlists', 'settings', 'mappings', 'presets'], 'readwrite');

      await Promise.all([
        tx.store.put(data.tracks, 'tracks'),
        tx.store.put(data.playlists, 'playlists'),
        tx.store.put(data.settings, 'settings'),
        tx.store.put(data.mappings, 'mappings'),
        tx.store.put(data.presets, 'presets')
      ]);

      await tx.done;
    } catch (error) {
      console.error('Failed to save data locally:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to save data locally'
      }));
    }
  }, [db]);

  // Load data from IndexedDB
  const loadFromLocal = useCallback(async (): Promise<SyncData | null> => {
    if (!db) return null;

    try {
      const tx = db.transaction(['tracks', 'playlists', 'settings', 'mappings', 'presets'], 'readonly');

      const [tracks, playlists, settings, mappings, presets] = await Promise.all([
        tx.store.get('tracks'),
        tx.store.get('playlists'),
        tx.store.get('settings'),
        tx.store.get('mappings'),
        tx.store.get('presets')
      ]);

      await tx.done;

      return {
        tracks: tracks || [],
        playlists: playlists || [],
        settings: settings || {},
        mappings: mappings || [],
        presets: presets || []
      };
    } catch (error) {
      console.error('Failed to load data locally:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load data locally'
      }));
      return null;
    }
  }, [db]);

  // Sync with cloud
  const sync = useCallback(async (data: SyncData) => {
    setState(prev => ({
      ...prev,
      isSyncing: true,
      error: null,
      progress: 0
    }));

    try {
      // Save to local storage first
      await saveToLocal(data);

      // Simulate cloud sync with progress updates
      const totalSteps = 5;
      for (let i = 0; i < totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setState(prev => ({
          ...prev,
          progress: ((i + 1) / totalSteps) * 100
        }));
      }

      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        progress: 100
      }));
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: 'Failed to sync with cloud'
      }));
    }
  }, [saveToLocal]);

  // Export data
  const exportData = useCallback(async () => {
    const data = await loadFromLocal();
    if (!data) return;

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixer-backup-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to export data'
      }));
    }
  }, [loadFromLocal]);

  // Import data
  const importData = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as SyncData;
      await sync(data);
    } catch (error) {
      console.error('Failed to import data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to import data'
      }));
    }
  }, [sync]);

  // Initialize on mount
  useEffect(() => {
    initializeDB();
  }, [initializeDB]);

  return {
    isSyncing: state.isSyncing,
    lastSync: state.lastSync,
    error: state.error,
    progress: state.progress,
    sync,
    exportData,
    importData
  };
}; 