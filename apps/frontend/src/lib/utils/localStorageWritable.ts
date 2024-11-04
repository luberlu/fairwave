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
