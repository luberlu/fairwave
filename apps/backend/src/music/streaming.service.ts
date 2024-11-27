import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.js';

@Injectable()
export class StreamingService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Convertit un stream en Buffer.
   */
  async streamToBuffer(
    stream: AsyncIterable<Uint8Array>,
  ): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
