/**
 * IndexedDB utilities for offline storage
 * Stores measurements and other data while offline for sync when reconnected
 */

import { openDB } from 'idb';

const DB_NAME = 'anganwadi_offline_db';
const STORE_NAME = 'measurements';
const VERSION = 1;

let db = null;

/**
 * Initialize IndexedDB connection
 */
export async function initDB() {
  if (db) return db;

  db = await openDB(DB_NAME, VERSION, {
    upgrade(db) {
      // Create object store for measurements
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status');
        store.createIndex('child_id', 'child_id');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });

  return db;
}

/**
 * Save measurement for offline sync
 */
export async function saveMeasurementOffline(measurement) {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readwrite').store;

  const offlineMeasurement = {
    ...measurement,
    status: 'pending', // pending, synced, failed
    timestamp: Date.now(),
    synced_at: null,
  };

  return store.add(offlineMeasurement);
}

/**
 * Get all pending measurements
 */
export async function getPendingMeasurements() {
  const db = await initDB();
  const index = db
    .transaction(STORE_NAME, 'readonly')
    .store.index('status');

  return index.getAll('pending');
}

/**
 * Mark measurement as synced
 */
export async function markMeasurementSynced(id) {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readwrite').store;

  const measurement = await store.get(id);
  if (measurement) {
    measurement.status = 'synced';
    measurement.synced_at = Date.now();
    await store.put(measurement);
  }
}

/**
 * Mark measurement as failed to sync
 */
export async function markMeasurementFailed(id, error) {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readwrite').store;

  const measurement = await store.get(id);
  if (measurement) {
    measurement.status = 'failed';
    measurement.error = error;
    measurement.last_attempt = Date.now();
    await store.put(measurement);
  }
}

/**
 * Delete synced measurements
 */
export async function deleteSyncedMeasurements() {
  const db = await initDB();
  const index = db
    .transaction(STORE_NAME, 'readwrite')
    .store.index('status');

  const synced = await index.getAll('synced');
  const store = db.transaction(STORE_NAME, 'readwrite').store;

  for (const measurement of synced) {
    await store.delete(measurement.id);
  }

  return synced.length;
}

/**
 * Get all measurements (for debugging)
 */
export async function getAllMeasurements() {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readonly').store;
  return store.getAll();
}

/**
 * Clear all measurements (for reset)
 */
export async function clearAllMeasurements() {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readwrite').store;
  await store.clear();
}

/**
 * Get offline queue stats
 */
export async function getOfflineStats() {
  const db = await initDB();
  const store = db.transaction(STORE_NAME, 'readonly').store;
  const index = store.index('status');

  const pending = await index.getAll('pending');
  const synced = await index.getAll('synced');
  const failed = await index.getAll('failed');

  return {
    pending: pending.length,
    synced: synced.length,
    failed: failed.length,
    total: pending.length + synced.length + failed.length,
  };
}
