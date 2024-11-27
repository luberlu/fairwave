import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { parseBuffer } from 'music-metadata';
import CryptoJS from 'crypto-js';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import * as path from 'path';

// Définit __dirname pour les modules ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

@Injectable()
export class UploadHLSService {
  constructor(private readonly storageService: StorageService) {}

  async generateHLS(fileBuffer: Buffer): Promise<{ segments: Buffer[], manifest: Buffer }> {
    const tempDir = path.join(process.cwd(), 'temp', `hls-${Date.now()}`); // Utilisation de process.cwd()
    const outputDir = path.join(tempDir, 'hls'); // Répertoire HLS pour FFmpeg
    const inputFilePath = path.join(tempDir, 'input.mp3'); // Chemin du fichier d'entrée
    const manifestPath = path.join(outputDir, 'output.m3u8'); // Chemin du manifeste HLS
  
    try {
      // Création des répertoires nécessaires
      await fs.mkdir(outputDir, { recursive: true });
  
      // Sauvegarder le fichier temporairement
      await fs.writeFile(inputFilePath, fileBuffer);
  
      // Commande FFmpeg pour générer HLS
      const command = `ffmpeg -i ${inputFilePath} -hls_time 10 -hls_playlist_type vod -f hls ${manifestPath}`;
      await new Promise<void>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error('Erreur lors de l\'exécution de FFmpeg :', stderr);
            reject(new Error(`FFmpeg failed: ${stderr}`));
            return;
          }
          resolve();
        });
      });
  
      // Lire les fichiers HLS
      const files = await fs.readdir(outputDir);
  
      // Récupérer les segments et le manifeste sous forme de Buffers
      const segmentBuffers = await Promise.all(
        files
          .filter((file) => file.endsWith('.ts'))
          .map((file) => fs.readFile(path.join(outputDir, file)))
      );
  
      const manifestBuffer = await fs.readFile(manifestPath);
  
      // Nettoyer les fichiers temporaires après le traitement
      // await fs.rm(tempDir, { recursive: true, force: true });
  
      return { segments: segmentBuffers, manifest: manifestBuffer };
    } catch (error) {
      console.error('Erreur lors de la génération des fichiers HLS :', error);
  
      // Nettoyer les fichiers temporaires en cas d'erreur
      await fs.rm(tempDir, { recursive: true, force: true }).catch((cleanupError) => {
        console.error('Erreur lors du nettoyage des fichiers temporaires :', cleanupError);
      });
  
      throw error; // Relance l'erreur pour la gérer en amont
    }
  }

  
/**
 * Réécrit un fichier manifest `.m3u8` avec des chemins relatifs pour les segments.
 * @param manifest Le contenu du fichier manifest `.m3u8` en texte brut.
 * @param segmentCIDs Liste des CIDs IPFS des segments.
 * @param relativePath Le chemin relatif pour accéder aux segments (par défaut: `/api/music-hls/hls/segment/`).
 * @returns Le contenu du manifest mis à jour avec les chemins relatifs des segments.
 */
rewriteHLSManifestWithRelativePath(
  manifest: string,
  segmentCIDs: string[],
  relativePath: string = '/api/music-hls/hls/segment/',
): string {
  const lines = manifest.split('\n');
  let segmentIndex = 0;

  return lines
    .map((line) => {
      // Identifier les lignes correspondant aux segments `.ts`
      if (line.endsWith('.ts') && segmentIndex < segmentCIDs.length) {
        const relativeUrl = `${relativePath}${segmentCIDs[segmentIndex]}`;
        segmentIndex++;
        return relativeUrl;
      }
      return line; // Gardez les autres lignes inchangées
    })
    .join('\n');
}


  /**
   * Upload les segments HLS et met à jour le manifest avec leurs CIDs.
   * @param segments Liste des segments sous forme de Buffers.
   * @param manifest Le manifest HLS sous forme de Buffer.
   * @param ipfsGateway URL de la passerelle IPFS (par défaut: `https://gateway.ipfs.io`).
   * @returns Un objet contenant les CIDs des segments et le CID du manifest mis à jour.
   */
  async uploadHLSFilesToIPFS(
    segments: Buffer[],
    manifest: Buffer,
  ): Promise<{ manifestCID: string; segmentCIDs: string[] }> {
    // Étape 1 : Uploader chaque segment
    const segmentCIDs = await Promise.all(
      segments.map((segment) => this.storageService.uploadToIPFS(segment)),
    );

    // Étape 2 : Réécrire le manifest
    const manifestString = manifest.toString('utf-8');
    const updatedManifest = this.rewriteHLSManifestWithRelativePath(
      manifestString,
      segmentCIDs
    );

    // Étape 3 : Uploader le manifest mis à jour
    const manifestCID = await this.storageService.uploadToIPFS(Buffer.from(updatedManifest, 'utf-8'));

    return { manifestCID, segmentCIDs };
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
