import React from 'react';
import { subscribeSyncStatus, getFullSyncStatus } from '../api/client.js';

export function useSyncStatus() {
  const [state, setState] = React.useState({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncing: false,
    pending: 0,
  });

  React.useEffect(() => {
    let mounted = true;

    async function refresh() {
      const next = await getFullSyncStatus();
      if (mounted) setState(next);
    }

    const unsub = subscribeSyncStatus(() => refresh());
    const onConnectivity = () => refresh();

    window.addEventListener('online', onConnectivity);
    window.addEventListener('offline', onConnectivity);
    refresh();

    return () => {
      mounted = false;
      unsub();
      window.removeEventListener('online', onConnectivity);
      window.removeEventListener('offline', onConnectivity);
    };
  }, []);

  const status = !state.online
    ? 'offline'
    : state.syncing || state.pending > 0
      ? 'syncing'
      : 'synced';

  return { status, pending: state.pending, online: state.online };
}
