export interface UserProfile {
	did: string;
	isArtist: boolean;
	username: string;
	role: string;
	artistName?: string;
}

const defaultUserProfile: UserProfile = {
	did: '',
	isArtist: false,
	username: '',
	role: '',
	artistName: undefined,
};

// Déclarez le profil utilisateur en tant qu'état réactif
export let userProfile = $state(defaultUserProfile);

/**
 * Met à jour une ou plusieurs propriétés du profil utilisateur.
 * @param updates Les propriétés à mettre à jour.
 */
export function setUserProfile(updates: Partial<UserProfile>): void {
	Object.assign(userProfile, updates);
}

/**
 * Réinitialise le profil utilisateur.
 */
export function resetUserProfile(): void {
	Object.assign(userProfile, defaultUserProfile);
}
