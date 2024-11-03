import { Injectable, HttpException } from '@nestjs/common';
import { ethers, ContractTransaction } from 'ethers';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import CryptoJS from 'crypto-js';
import { CID } from 'multiformats/cid';
import { Readable } from 'stream';
import { parseBuffer } from 'music-metadata';

@Injectable()
export class MusicService {
  private helia: any;
  private fs: any;
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.initHelia();
    this.provider = new ethers.JsonRpcProvider('http://localhost:8545'); // URL Hardhat par défaut

    this.contract = new ethers.Contract(
      '0x5fbdb2315678afecb367f032d93f642f64180aa3', // Remplace par l'adresse de ton contrat déployé
      [
        'function registerTrack(string cid) public',
        'function isOwner(address user, string cid) public view returns (bool)',
      ],
      this.provider,
    );
  }

  async initHelia() {
    const blockstore = new FsBlockstore('./storage');
    this.helia = await createHelia({ blockstore });
    this.fs = unixfs(this.helia);
  }

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

  async isTrackRegistered(cid: string): Promise<boolean> {
    try {
      const isOwner = await this.contract.isOwner(this.contract.target, cid);
      return isOwner;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de l'existence du morceau:",
        error,
      );
      return false; // En cas d'erreur, on considère que le morceau n'est pas enregistré
    }
  }

  // Enregistre le morceau sur la blockchain
  async registerTrackOnBlockchain(userAddress: string, cid: string) {
    console.log(
      'register new track on blockchain: userAdress: ',
      userAddress,
      ' cid => ',
      cid,
    );

    const signer = await this.provider.getSigner(userAddress); // Récupérer le Signer via l’adresse
    const contractWithSigner = this.contract.connect(signer); // Connecter le signer au contrat

    try {
      const registerTrackFn = contractWithSigner.getFunction('registerTrack');
      const transaction = await registerTrackFn(cid);
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement sur la blockchain:",
        error,
      );
      throw new HttpException(
        "Erreur lors de l'enregistrement sur la blockchain",
        403,
      );
    }
  }

  async verifyOwnershipOnBlockchain(
    cid: string,
    userAddress: string,
  ): Promise<boolean> {
    try {
      const isOwner = await this.contract.isOwner(userAddress, cid);
      return isOwner;
    } catch (error) {
      console.error(
        'Erreur lors de la vérification de la propriété sur la blockchain:',
        error,
      );
      throw new Error('Erreur lors de la vérification de la propriété');
    }
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
      const chunkCID = await this.uploadToIPFS(
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
    return await this.uploadToIPFS(Buffer.from(manifest, 'utf-8'));
  }

  async uploadToIPFS(file: Buffer): Promise<string> {
    const cid = await this.fs.addFile({ content: file });
    return cid.toString();
  }

  async getMusicStream(
    cidStr: string,
    encryptionKey: string,
  ): Promise<{
    stream: Readable | null;
    metadata: { title: string; duration: number } | null;
  }> {
    const manifestCID = CID.parse(cidStr);
    const manifestData = await this.getManifestData(manifestCID);

    if (!manifestData) return { stream: null, metadata: null };

    let metadata: { title: string; duration: number; chunks: string[] };

    try {
      metadata = JSON.parse(manifestData);
    } catch (error) {
      console.error(
        'Erreur lors du parsing des métadonnées du manifest:',
        error,
      );
      return { stream: null, metadata: null };
    }

    const { title, duration } = metadata;
    const chunkCIDs = metadata.chunks;

    const chunkPromises = chunkCIDs.map(async (chunkCID, index) => {
      try {
        const chunkStream = this.fs.cat(CID.parse(chunkCID));
        const chunkBuffer = await streamToBuffer(chunkStream);
        const decryptedData = this.decryptChunk(chunkBuffer, encryptionKey);

        if (index === 0 && !this.isValidAudio(Buffer.from(decryptedData))) {
          throw new Error('Le fichier audio est invalide.');
        }

        return Buffer.from(decryptedData.toString(), 'base64');
      } catch (error) {
        console.error(
          `Erreur lors de la récupération ou du déchiffrement du chunk ${chunkCID}:`,
          error,
        );
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
async function streamToBuffer(
  stream: AsyncIterable<Uint8Array>,
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
