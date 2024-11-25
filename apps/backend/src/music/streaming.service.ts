import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import CryptoJS from 'crypto-js';
import { Readable } from 'stream';

@Injectable()
export class StreamingService {
  constructor(private readonly storageService: StorageService) {}

  async getMusicStream(
    cid: string,
    encryptionKey: string,
  ): Promise<{
    stream: Readable | null;
    metadata: { title: string; duration: number } | null;
  }> {
    const manifestData = await this.getManifestData(cid);

    if (!manifestData) return { stream: null, metadata: null };

    let metadata: { title: string; duration: number; chunks: string[] };

    try {
      metadata = JSON.parse(manifestData);
    } catch (error) {
      console.error('Erreur lors du parsing des métadonnées du manifest:', error);
      return { stream: null, metadata: null };
    }

    const { title, duration } = metadata;
    const chunkCIDs = metadata.chunks;

    const chunkPromises = chunkCIDs.map(async (chunkCID, index) => {
      try {
        const chunkStream = await this.storageService.getFileStream(chunkCID);
        const chunkBuffer = await this.streamToBuffer(chunkStream);
        const decryptedData = this.decryptChunk(chunkBuffer, encryptionKey);

        if (index === 0 && !this.isValidAudio(Buffer.from(decryptedData))) {
          throw new Error('Le fichier audio est invalide.');
        }

        return Buffer.from(decryptedData.toString(), 'base64');
      } catch (error) {
        console.error(`Erreur lors de la récupération ou du déchiffrement du chunk ${chunkCID}:`, error);
        throw new Error('Erreur de déchiffrement ou de récupération du chunk.');
      }
    });

    try {
      const stream = Readable.from(chunkPromises);
      return { stream, metadata: { title, duration } };
    } catch (error) {
      console.error('Erreur lors de la création du flux audio:', error);
      return { stream: null, metadata: null };
    }
  }

  private async getManifestData(manifestCID: string): Promise<string | null> {
    const stream = await this.storageService.getFileStream(manifestCID);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
  }

  private isValidAudio(buffer: Buffer): boolean {
    const id3Header = buffer.toString('utf-8', 0, 3);
    return id3Header === '//v' || id3Header === 'SUQ';
  }

  private decryptChunk(chunkBuffer: Uint8Array, encryptionKey: string): Buffer {
    try {
      const encryptedData = Buffer.from(chunkBuffer).toString('utf-8');
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Base64);
      return Buffer.from(decryptedData, 'base64');
    } catch (error) {
      console.error('Erreur lors du déchiffrement du chunk:', error);
      throw error;
    }
  }

  private async streamToBuffer(
    stream: AsyncIterable<Uint8Array>,
  ): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
