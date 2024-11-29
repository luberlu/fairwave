<script lang="ts">
	import { Icon, Play, PlayPause } from 'svelte-hero-icons';
	import { playerState } from '$lib/player/playerStore';

	let { togglePlay } = $props();

	let iconPlay = $derived(playerState.value.isPlaying ? PlayPause : Play);
	let label = $derived(playerState.value.isPlaying ? 'Pause' : 'Play');
</script>

<div class="controls">
	<button onclick={ togglePlay } aria-label={ label }>
		<Icon src={ iconPlay } class="h-6 w-6" />
	</button>
</div>

<style>
	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: white;
	}
</style>
