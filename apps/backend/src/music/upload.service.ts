import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { parseBuffer } from 'music-metadata';
import CryptoJS from 'crypto-js';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async uploadMusic(
    title: string,
    secretKey: string,
    buffer: Buffer,
  ): Promise<{ manifestCID: string }> {
    const duration = await this.getAudioDuration(buffer);
    const chunkCIDs = await this.encryptAndUploadChunks(buffer, secretKey);
    const manifestCID = await this.createManifest(title, duration, chunkCIDs);
    return { manifestCID };
  }

  private async getAudioDuration(buffer: Buffer): Promise<number> {
    const metadata = await parseBuffer(buffer);
    return metadata.format.duration ?? 0;
  }

  private async encryptAndUploadChunks(
    buffer: Buffer,
    secretKey: string,
    chunkSize = 1024 * 1024,
  ): Promise<string[]> {
    const chunkCIDs: string[] = [];
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);
      const encryptedChunk = this.encryptChunk(chunk, secretKey);
      const chunkCID = await this.storageService.uploadToIPFS(
        Buffer.from(encryptedChunk, 'utf-8'),
      );
      chunkCIDs.push(chunkCID);
    }
    return chunkCIDs;
  }

  private encryptChunk(chunk: Buffer, secretKey: string): string {
    const base64Chunk = chunk.toString('base64');
    return CryptoJS.AES.encrypt(base64Chunk, secretKey).toString();
  }

  private async createManifest(
    title: string,
    duration: number,
    chunkCIDs: string[],
  ): Promise<string> {
    const manifest = JSON.stringify({ title, duration, chunks: chunkCIDs });
    return this.storageService.uploadToIPFS(Buffer.from(manifest, 'utf-8'));
  }
}
