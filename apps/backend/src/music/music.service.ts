import { Injectable } from '@nestjs/common';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { FsBlockstore } from 'blockstore-fs';
import CryptoJS from 'crypto-js';
import { Readable } from 'stream';
import { parseBuffer } from 'music-metadata';

@Injectable()
export class MusicService {
  private helia: any;
  private fs: any;

  constructor() {
    this.initHelia();
  }

  async initHelia() {
    const blockstore = new FsBlockstore('./storage');
    this.helia = await createHelia({ blockstore });
    this.fs = unixfs(this.helia);
  }

  async uploadMusic(title: string, secretKey: string, buffer: Buffer): Promise<{ manifestCID: string }> {
    const duration = await this.getAudioDuration(buffer);
    const chunkCIDs = await this.encryptAndUploadChunks(buffer, secretKey);
    const manifestCID = await this.createManifest(title, duration, chunkCIDs);
    return { manifestCID };
  }

  private async getAudioDuration(buffer: Buffer): Promise<number> {
    const metadata = await parseBuffer(buffer);
    return metadata.format.duration ?? 0;
  }

  private async encryptAndUploadChunks(buffer: Buffer, secretKey: string, chunkSize = 1024 * 1024): Promise<string[]> {
    const chunkCIDs: string[] = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, i + chunkSize);
      const encryptedChunk = this.encryptChunk(chunk, secretKey);
      const chunkCID = await this.uploadToIPFS(Buffer.from(encryptedChunk, 'utf-8'));
      chunkCIDs.push(chunkCID);
    }

    return chunkCIDs;
  }

  private encryptChunk(chunk: Buffer, secretKey: string): string {
    const base64Chunk = chunk.toString('base64');
    return CryptoJS.AES.encrypt(base64Chunk, secretKey).toString();
  }

  private async createManifest(title: string, duration: number, chunkCIDs: string[]): Promise<string> {
    const manifest = JSON.stringify({ title, duration, chunks: chunkCIDs });
    return await this.uploadToIPFS(Buffer.from(manifest, 'utf-8'));
  }

  async uploadToIPFS(file: Buffer): Promise<string> {
    const cid = await this.fs.addFile({ content: file });
    return cid.toString();
  }

  async getMusicStream(cidStr: string, encryptionKey: string): Promise<{ stream: Readable | null; metadata: { title: string; duration: number } | null }> {
    const manifestCID = CID.parse(cidStr);
    const manifestData = await this.getManifestData(manifestCID);

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
      const chunkStream = this.fs.cat(CID.parse(chunkCID));
      const chunkBuffer = await streamToBuffer(chunkStream);
      const decryptedData = this.decryptChunk(chunkBuffer, encryptionKey);

      if (index === 0 && !this.isValidAudio(Buffer.from(decryptedData))) {
        throw new Error('Le fichier audio est invalide.');
      }

      return Buffer.from(decryptedData.toString(), 'base64');
    });

    const stream = Readable.from(chunkPromises);
    return { stream, metadata: { title, duration } };
  }

  private async getManifestData(manifestCID: CID): Promise<string | null> {
    const stream = this.fs.cat(manifestCID);
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
}

// Fonction pour convertir un stream en buffer
async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
