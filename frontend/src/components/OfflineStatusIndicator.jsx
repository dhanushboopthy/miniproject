import React, { useState, useEffect } from 'react';
import { getSyncStatus, onSyncStatusChange } from '../utils/offlineSync';

export default function OfflineStatusIndicator() {
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    isSyncing: false,
  });
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = onSyncStatusChange((syncStatus) => {
      setSyncInfo(syncStatus);
    });

    // Update sync status periodically
    const updateStatus = async () => {
      const currentStatus = await getSyncStatus();
      setStatus(currentStatus);
    };

    const interval = setInterval(updateStatus, 2000);
    updateStatus();

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Don't show if nothing pending and online
  if (status.isOnline && status.pending === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (status.isSyncing) return '#f97316'; // Orange
    if (status.isOnline && status.pending === 0) return '#22c55e'; // Green
    if (status.isOnline && status.pending > 0) return '#eab308'; // Yellow
    return '#ef4444'; // Red - offline
  };

  const getStatusText = () => {
    if (status.isSyncing) return '⟳ Syncing...';
    if (!status.isOnline) return '📱 Offline Mode';
    if (status.pending > 0) return `⟳ ${status.pending} pending`;
    return '✅ Synced';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 16px',
        backgroundColor: getStatusColor(),
        color: 'white',
        borderRadius: '24px',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000,
      }}
      title={syncInfo?.message || getStatusText()}
    >
      {getStatusText()}
    </div>
  );
}
