import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface StatusState {
	message: string;
	timeout: number; // Durée d'affichage en millisecondes
}

const defaultStatusState: StatusState = {
	message: '',
	timeout: 3000,
};

export const statusStore: Writable<StatusState> = writable(defaultStatusState);

/**
 * Définit un message de statut temporaire.
 * @param message Le message à afficher.
 * @param timeout (Optionnel) La durée d'affichage du message en millisecondes.
 */
export function setStatus(message: string, timeout: number = 3000): void {
	statusStore.set({ message, timeout });
	if (timeout > 0) {
		setTimeout(() => statusStore.set(defaultStatusState), timeout);
	}
}

/**
 * Réinitialise le message de statut.
 */
export function clearStatus(): void {
	statusStore.set(defaultStatusState);
}
