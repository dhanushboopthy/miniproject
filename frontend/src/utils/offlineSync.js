/**
 * Offline Sync Service
 * Handles syncing offline measurements when connectivity returns
 */

import { growthApi } from '../api/growthApi';
import {
  getPendingMeasurements,
  markMeasurementSynced,
  markMeasurementFailed,
  getOfflineStats,
} from './offlineDB';

let syncInProgress = false;
let syncObservers = [];

export function onSyncStatusChange(callback) {
  syncObservers.push(callback);
  return () => {
    syncObservers = syncObservers.filter((cb) => cb !== callback);
  };
}

function notifyObservers(status) {
  syncObservers.forEach((cb) => cb(status));
}

/**
 * Sync all pending measurements
 */
export async function syncOfflineMeasurements() {
  if (syncInProgress) return;

  syncInProgress = true;
  notifyObservers({ status: 'syncing', message: 'Syncing offline data...' });

  try {
    const pending = await getPendingMeasurements();

    if (pending.length === 0) {
      notifyObservers({ status: 'success', message: 'All data synced' });
      syncInProgress = false;
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const measurement of pending) {
      try {
        // Remove offline metadata before sending
        const { id, status, timestamp, synced_at, error, last_attempt, ...data } = measurement;

        await growthApi.addMeasurement(data);
        await markMeasurementSynced(id);
        synced++;
      } catch (err) {
        await markMeasurementFailed(measurement.id, err.message);
        failed++;
      }
    }

    notifyObservers({
      status: failed === 0 ? 'success' : 'partial',
      message: `Synced ${synced}/${pending.length} measurements`,
      synced,
      failed,
    });

    syncInProgress = false;
    return { synced, failed };
  } catch (err) {
    notifyObservers({ status: 'error', message: 'Sync failed: ' + err.message });
    syncInProgress = false;
    throw err;
  }
}

/**
 * Set up automatic sync on online/offline events
 */
export function setupAutoSync() {
  // Sync when coming back online
  window.addEventListener('online', async () => {
    console.log('Back online, syncing data...');
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Debounce
    try {
      await syncOfflineMeasurements();
    } catch (err) {
      console.error('Auto sync failed:', err);
    }
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost, offline mode enabled');
    notifyObservers({ status: 'offline', message: 'Offline mode enabled' });
  });

  // Check initial connectivity
  if (navigator.onLine) {
    // Sync immediately on app start if online
    setTimeout(async () => {
      const stats = await getOfflineStats();
      if (stats.pending > 0) {
        try {
          await syncOfflineMeasurements();
        } catch (err) {
          console.error('Startup sync failed:', err);
        }
      }
    }, 2000);
  } else {
    notifyObservers({ status: 'offline', message: 'You are offline' });
  }
}

/**
 * Get sync status for UI display
 */
export async function getSyncStatus() {
  const stats = await getOfflineStats();
  const isOnline = navigator.onLine;

  return {
    isOnline,
    isSyncing: syncInProgress,
    ...stats,
  };
}
