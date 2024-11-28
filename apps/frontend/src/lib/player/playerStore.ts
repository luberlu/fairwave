// src/lib/music/stores/playerStore.ts
import { persistedState } from '$lib/utils/persistedState.svelte';
import type { MusicTrack } from '$lib/music/actions/fetchMusic';

// Define the interface for the player's state
export interface PlayerState {
	cid: string; // Currently playing track CID
	metadata: MusicTrack | null; // Metadata for the currently playing track
	isPlaying: boolean; // Whether the player is actively playing
	currentTime: number; // Current playback position in seconds
    duration: number;
}

// Default state for the player
const defaultPlayerState: PlayerState = {
	cid: '',
	metadata: null,
	isPlaying: false,
	currentTime: 0,
    duration: 0
};

// Create the persisted state
export const playerState = persistedState('playerState', defaultPlayerState, {
	storage: 'local',
	syncTabs: true,
	onWriteError: (error: any) => console.error('Erreur lors de l’écriture:', error),
	onParseError: (error: any) => console.error('Erreur lors du parsing:', error),
    beforeRead: (state) => ({
		...state,
		isPlaying: false,
	}),
});

/**
 * Updates the player state with specific properties.
 * @param updates Properties to update in the player state.
 */
export function updatePlayerState(updates: Partial<PlayerState>): void {
    if(updates.cid && updates.cid === playerState.value.cid){
        return;
    }
    
	playerState.value = { ...playerState.value, ...updates };
}

/**
 * Resets the player state to its default values.
 */
export function resetPlayerState(): void {
	playerState.reset();
}
