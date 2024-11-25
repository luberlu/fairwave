type Serializer<T> = {
	parse: (text: string) => T;
	stringify: (object: T) => string;
};

type StorageType = 'local' | 'session';

interface Options<T> {
	storage?: StorageType;
	serializer?: Serializer<T>;
	syncTabs?: boolean;
	onWriteError?: (error: unknown) => void;
	onParseError?: (error: unknown) => void;
	beforeRead?: (value: T) => T;
	beforeWrite?: (value: T) => T;
}

export function persistedState<T>(key: string, initialValue: T, options: Options<T> = {}) {
	const {
		storage = 'local',
		serializer = JSON,
		syncTabs = true,
		onWriteError = console.error,
		onParseError = console.error,
		beforeRead = (v: T) => v,
		beforeWrite = (v: T) => v
	} = options;

	// Détecte le type de stockage (localStorage ou sessionStorage)
	const storageArea =
		typeof window !== 'undefined' && storage === 'local'
			? localStorage
			: typeof window !== 'undefined' && storage === 'session'
			? sessionStorage
			: null;

	let storedValue: T;

	// Charge l'état initial depuis le stockage (si disponible)
	try {
		if (storageArea) {
			const item = storageArea.getItem(key);
			storedValue = item ? beforeRead(serializer.parse(item)) : initialValue;
		} else {
			storedValue = initialValue;
		}
	} catch (error) {
		onParseError(error);
		storedValue = initialValue;
	}

	let state = $state(storedValue);

	// Met à jour le stockage lorsque l'état change
	function updateStorage(value: T) {
		if (!storageArea) return;

		try {
			const valueToStore = beforeWrite(value);
			storageArea.setItem(key, serializer.stringify(valueToStore));
		} catch (error) {
			onWriteError(error);
		}
	}

	// Synchronisation inter-onglets (si activé)
	if (syncTabs && typeof window !== 'undefined' && storageArea === localStorage) {
		window.addEventListener('storage', (event) => {
			if (event.key === key && event.storageArea === localStorage) {
				try {
					const newValue = event.newValue ? serializer.parse(event.newValue) : initialValue;
					state = beforeRead(newValue);
				} catch (error) {
					onParseError(error);
				}
			}
		});
	}

	// Écoute les changements pour synchroniser avec le stockage
	$effect.root(() => {
		$effect(() => {
			updateStorage(state);
		});

		return () => {};
	});

	return {
		get value() {
			return state;
		},
		set value(newValue: T) {
			state = newValue;
		},
		reset() {
			state = initialValue;
		}
	};
}
