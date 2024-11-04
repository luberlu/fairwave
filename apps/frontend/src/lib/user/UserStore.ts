// UserStore.ts
import { localStorageWritable } from '../utils/localStorageWritable';
import type { Writable } from 'svelte/store';

export const did: Writable<string> = localStorageWritable<string>('userDID', '');
export const status: Writable<string> = localStorageWritable<string>('userStatus', '');
export const isAuthenticated: Writable<boolean> = localStorageWritable<boolean>('userAuthenticated', false);
export const encryptionKey: Writable<string | null> = localStorageWritable<string | null>('encryptionKey', null);
