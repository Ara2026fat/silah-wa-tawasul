export type SyncStatus =
  | 'unconfigured' // no Supabase env vars — cloud sync not set up
  | 'signedOut' // configured, but no active session
  | 'idle' // signed in, nothing happening right now
  | 'syncing'
  | 'offline' // signed in, but navigator says we're offline
  | 'error';
