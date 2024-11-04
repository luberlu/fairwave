// UserStore.ts
import { localStorageWritable } from '../utils/localStorageWritable';
import type { Writable } from 'svelte/store';

export const did: Writable<string> = localStorageWritable<string>('userDID', '');
export const status: Writable<string> = localStorageWritable<string>('userStatus', '');
export const isAuthenticated: Writable<boolean> = localStorageWritable<boolean>('userAuthenticated', false);
export const encryptionKey: Writable<string | null> = localStorageWritable<string | null>('encryptionKey', null);
export const isArtist: Writable<boolean> = localStorageWritable<boolean>('userIsArtist', false);

export const username: Writable<string> = localStorageWritable('username', '');
export const role: Writable<string> = localStorageWritable('role', '');
export const artistName: Writable<string> = localStorageWritable('artistName', '');

export function setUserProfile(profile: { username: string; role: string; artistName?: string }) {
	username.set(profile.username);
	role.set(profile.role);
	if (profile.role === "Artist" && profile.artistName) artistName.set(profile.artistName);
}