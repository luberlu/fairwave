import { writable, type Writable } from 'svelte/store';

export function localStorageWritable<T>(key: string, initialValue: T): Writable<T> {
	const storeValue = typeof window !== 'undefined' && localStorage.getItem(key);
	const data = storeValue ? JSON.parse(storeValue) : initialValue;
	const store = writable<T>(data);

	if (typeof window !== 'undefined') {
		store.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}

/**
 * Crée un état réactif avec persistance dans `localStorage`.
 * @param key La clé utilisée pour stocker l'état dans `localStorage`.
 * @param defaultValue La valeur par défaut si aucune donnée n'est trouvée.
 * @returns Un état réactif persisté.
 */
export function localStorageState<T>(key: string, defaultValue: T): T {
	// Charger l'état initial depuis localStorage
	const storedValue = typeof window !== 'undefined' && localStorage.getItem(key);
	const initialState = storedValue ? JSON.parse(storedValue) : defaultValue;

	// Créer l'état réactif avec $state
	const state = $state(initialState);

	if (typeof window !== 'undefined') {
		// Synchroniser automatiquement les changements dans localStorage
		Object.keys(state).forEach((prop) => {
			state[prop].subscribe(() => {
				const serializedState = JSON.stringify(state);
				localStorage.setItem(key, serializedState);
			});
		});
	}

	return state as T;
}
