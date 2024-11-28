<script lang="ts">
	import { playerState, updatePlayerState } from '$lib/player/playerStore';
	import { formatTime } from '$lib/utils/time';
    
    let { audioElement }: {
        audioElement: HTMLAudioElement | null;
    } = $props();

    let progressionTime = $derived(
		playerState.value.currentTime ? formatTime(playerState.value.currentTime) : '0:00'
	);

    let duration = $derived(
		playerState.value.duration ? formatTime(playerState.value.duration) : '0:00'
	);

	let progressPercentage = $derived(
		(playerState.value.duration ? (playerState.value.currentTime / (playerState.value.duration || 1)) * 100 : 0) + '%'
	);

	function seek(event: MouseEvent | KeyboardEvent) {
		if (audioElement) {
			const progressBar = event.currentTarget as HTMLDivElement;
			const rect = progressBar.getBoundingClientRect();
			const clickX = event instanceof MouseEvent ? event.clientX - rect.left : rect.width / 2;

			const newTime = (clickX / rect.width) * (playerState.value.duration || 0);
			audioElement.currentTime = newTime;
			updatePlayerState({ currentTime: newTime });
		}
	}
</script>

<div class="progress-container">
	<div class="timing timing-left">
		{progressionTime}
	</div>
	<div class="progress-bar" onclick={seek} onkeydown={seek} role="button" tabindex="0">
		<div
			class="progress-fill"
			style="width: {progressPercentage}"
		></div>
	</div>
	<div class="timing timing-right">
		{duration}
	</div>
</div>

<style>
	.progress-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.progress-bar {
		width: 100%;
		margin: 0 1rem;
		max-width: 800px;
		background: #e5e7eb;
		height: 8px;
		position: relative;
		cursor: pointer;
	}
	.progress-fill {
		height: 100%;
		background: #3b82f6;
		width: 0;
		transition: width 0.05s linear;
	}
	.timing {
		font-size: 0.875rem;
		color: #6b7280;
		margin-left: 1rem;
		margin-right: 1rem;
	}
</style>
