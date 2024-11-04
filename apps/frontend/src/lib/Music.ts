// Music.ts
export class Music {
	title: string | null = null;
	duration: number | null = null;
	mediaSource: MediaSource | null = null;
	sourceBuffer: SourceBuffer | null = null;
	status = { success: false, message: '' };

	constructor(public audioElement: HTMLAudioElement) {
		this.mediaSource = new MediaSource();
		this.audioElement.src = URL.createObjectURL(this.mediaSource);
	}

	initializeStreaming(reader: ReadableStreamDefaultReader<Uint8Array> | null) {
		if (!this.mediaSource || !reader) {
			this.status = {
				success: false,
				message: 'Erreur : Source ou lecteur non disponible.'
			};
			return;
		}

		// Active le statut dès que l'ouverture de la source commence
		this.status = {
			success: true,
			message: 'Lecture du flux audio en cours.'
		};

		this.mediaSource.addEventListener('sourceopen', async () => {
			this.sourceBuffer = this.mediaSource!.addSourceBuffer('audio/mpeg');
			let isAppending = false;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				// Gestion des buffers pour éviter des erreurs lors de l'ajout de données
				while (isAppending) {
					await new Promise((resolve) => setTimeout(resolve, 50));
				}

				isAppending = true;
				this.sourceBuffer.appendBuffer(value);
				this.sourceBuffer.addEventListener('updateend', () => {
					isAppending = false;
				});
			}
		});
	}
}
