import { localStorageWritable } from '../utils/localStorage.svelte';
import type { Writable } from 'svelte/store';

export interface AuthState {
	isAuthenticated: boolean;
	encryptionKey: string | null;
}

// État par défaut de l'authentification
const defaultAuthState: AuthState = {
	isAuthenticated: false,
	encryptionKey: null,
};

// Utilise localStorageWritable pour la persistance
export const authStore: Writable<AuthState> = localStorageWritable<AuthState>(
	'authState', // Clé utilisée dans localStorage
	defaultAuthState
);

/**
 * Met à jour une ou plusieurs propriétés du store d'authentification.
 * @param updates Les propriétés à mettre à jour.
 */
export function setAuthState(updates: Partial<AuthState>): void {
	authStore.update((state) => ({ ...state, ...updates }));
}

/**
 * Réinitialise le store d'authentification à son état par défaut.
 */
export function resetAuthState(): void {
	authStore.set(defaultAuthState);
}
