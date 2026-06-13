import Dexie from 'dexie';

export const db = new Dexie('finapp');

db.version(1).stores({
  apiCache: 'key, updatedAt',
  syncQueue: '++id, createdAt',
  idMap: 'tempId',
});
