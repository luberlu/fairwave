// UserStore.ts
import { writable, type Writable } from 'svelte/store';

export const address: Writable<string> = writable<string>('');
export const status: Writable<string> = writable<string>('');
export const isAuthenticated: Writable<boolean> = writable<boolean>(false);
export const encryptionKey: Writable<string | null> = writable<string | null>(null);
