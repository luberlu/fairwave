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

	let bufferPercentage = $derived(
		(playerState.value.buffer ? (playerState.value.buffer / playerState.value.duration) * 100 : 0) + '%'
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
		<div class="buffer-fill" style="width: {bufferPercentage}"></div>
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
		background: #464f0e;
		height: 6px;
		position: relative;
		cursor: pointer;
	}
	.buffer-fill {
		height: 100%;
		background: #656f25;
		width: 0;
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
	}
	.progress-fill {
		height: 100%;
		background: #d5f029;
		width: 0;
		transition: width 0.05s linear;
		z-index: 1;
		position: absolute;
	}
	.timing {
		font-size: 0.875rem;
		color: #b7b7b7;
		margin-left: 1rem;
		margin-right: 1rem;
	}
</style>
