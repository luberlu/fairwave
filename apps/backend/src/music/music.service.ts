import { Injectable } from '@nestjs/common';
import { Helia, createHelia } from 'helia';
import { unixfs, UnixFS } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { Response } from 'express';
import { parseBuffer } from 'music-metadata';
import { FsBlockstore } from 'blockstore-fs'; // Importer le module de stockage sur disque
import CryptoJS from 'crypto-js';

@Injectable()
export class MusicService {
  private helia: any;
  private fs: any;
  private secretKey = 'test';

  constructor() {
    this.initHelia();
  }

  async initHelia() {
    // Créer un blockstore pour le stockage sur disque
    const blockstore = new FsBlockstore('./storage'); // Spécifiez le chemin où vous souhaitez stocker les fichiers
    this.helia = await createHelia({ blockstore }); // Initialiser Helia avec le blockstore
    this.fs = unixfs(this.helia); // Initialiser UnixFS avec Helia
  }

  async uploadToIPFS(file: Buffer): Promise<string> {
    const cid = await this.fs.addFile({ content: file }); // Pas besoin de pin: true ici
    return cid.toString();
  }

  async getMusicStream(res: Response, cidStr: string) {
    const manifestCID = CID.parse(cidStr);
    const manifestData = await this.getManifestData(manifestCID);

    if (!manifestData) {
        res.status(500).send('Erreur lors de la récupération du fichier.');
        return; // Arrêtez l'exécution si le manifest échoue
    }

    const chunkCIDs = this.parseManifestData(manifestData);

    if (!chunkCIDs) {
        res.status(500).send('Erreur lors du parsing du manifest JSON.');
        return; // Arrêtez l'exécution si le parsing échoue
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    try {
          for (const chunkCID of chunkCIDs) {
            const chunkStream = this.fs.cat(CID.parse(chunkCID));

            // Traitement de chaque chunk
            const chunkBuffer = await streamToBuffer(chunkStream);
            const decryptedData = this.decryptChunk(chunkBuffer); // Déchiffement

            // Écriture du chunk déchiffré dans la réponse
            res.write(Buffer.from(decryptedData.toString(), 'base64')); // Utilisation de 'base64'
        }

        res.end(); // Terminer la réponse après tous les chunks
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
  }

  private decryptChunk(chunkBuffer: Uint8Array): Buffer {
    try {
        const encryptedData = Buffer.from(chunkBuffer).toString('utf-8'); // Convertir le buffer en chaîne

        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Base64); // Convertir en base64

        // Retourner le Buffer déchiffré
        return Buffer.from(decryptedData, 'base64'); // Convertir en Buffer
    } catch (error) {
        console.error('Erreur lors du déchiffrement du chunk:', error);
        throw error; // Lancer l'erreur pour gestion ultérieure
    }
  }

  private async getManifestData(manifestCID: CID): Promise<string | null> {
      const stream = this.fs.cat(manifestCID);
      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) {
          chunks.push(chunk);
      }

      // Convertir le buffer en chaîne UTF-8
      return Buffer.concat(chunks).toString('utf-8');
  }

  private parseManifestData(manifestData: string): string[] | null {
      try {
          console.log('Manifest Data:', manifestData); // Vérifiez le contenu ici
          return JSON.parse(manifestData);
      } catch (error) {
          console.error('Erreur lors du parsing du manifest JSON:', error);
          return null;
      }
  }
}

// Fonction pour convertir le stream en buffer
async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks);
}
