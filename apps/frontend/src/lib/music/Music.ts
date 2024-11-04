export class Music {
	title: string | null = null;
	duration: number | null = null;
	mediaSource: MediaSource | null = null;
	sourceBuffer: SourceBuffer | null = null;
	status = { success: false, message: '' };
	reader: ReadableStreamDefaultReader<Uint8Array> | null = null; // Déclaration du reader

	constructor(public audioElement: HTMLAudioElement) {
		this.mediaSource = new MediaSource();
	}

	initializeStreaming(reader: ReadableStreamDefaultReader<Uint8Array> | null) {
		if (!this.mediaSource || !reader) {
			this.status = {
				success: false,
				message: 'Erreur : Source ou lecteur non disponible.'
			};
			return;
		}

		// Stockez le reader pour l'utiliser dans onSourceOpen
		this.reader = reader;
        this.mediaSource.addEventListener('sourceopen', this.onSourceOpen.bind(this));
		this.audioElement.src = URL.createObjectURL(this.mediaSource);

		this.status = {
			success: true,
			message: 'Lecture du flux audio en cours.'
		};
	}

	private async onSourceOpen() {
		if (!this.mediaSource || !this.reader) return;

		this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
		let isAppending = false;

		while (true) {
			const { done, value } = await this.reader.read();
			if (done) break;

			while (isAppending) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			isAppending = true;
			this.sourceBuffer.appendBuffer(value);
			this.sourceBuffer.addEventListener('updateend', () => {
				isAppending = false;
			});
		}
	}
}
