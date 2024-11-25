import { persistedState } from '../utils/persistedState.svelte';

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

export const userProfile = persistedState('userProfile', defaultUserProfile, {
	storage: 'local',
	syncTabs: true,
	onWriteError: (error: any) => console.error('Erreur lors de l’écriture:', error),
	onParseError: (error: any) => console.error('Erreur lors du parsing:', error)
});


/**
 * Met à jour une ou plusieurs propriétés du profil utilisateur.
 * @param updates Les propriétés à mettre à jour.
 */
export function setUserProfile(updates: Partial<UserProfile>): void {
	userProfile.value = { ...userProfile.value, ...updates };
}

/**
 * Réinitialise le profil utilisateur.
 */
export function resetUserProfile(): void {
	userProfile.reset();
}