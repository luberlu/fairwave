import { Injectable } from '@nestjs/common';
import { Helia, createHelia } from 'helia';
import { unixfs, UnixFS } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { Response,  } from 'express';
import { FsBlockstore } from 'blockstore-fs'; // Importer le module de stockage sur disque
import CryptoJS from 'crypto-js';
import { Readable } from 'stream';
import { StreamableFile } from '@nestjs/common';

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

  async getMusicStream(
    cidStr: string,
    encryptionKey: string
  ): Promise<{ stream: Readable | null; metadata: { title: string; duration: number } | null }> {
    const manifestCID = CID.parse(cidStr);
    const manifestData = await this.getManifestData(manifestCID);

    if (!manifestData) {
        return { stream: null, metadata: null }; // Arrêtez l'exécution si le manifest échoue
    }

    let metadata: { title: string; duration: number; chunks: string[] };

    try {
        metadata = JSON.parse(manifestData);
    } catch (error) {
        console.error('Erreur lors du parsing des métadonnées du manifest:', error);
        return { stream: null, metadata: null }; // Arrêtez l'exécution si le parsing échoue
    }

    const { title, duration } = metadata; // Extraire uniquement title et duration pour les métadonnées finales
    const chunkCIDs = metadata.chunks;

    // Créer un tableau de Promesses pour chaque chunk
    const chunkPromises = chunkCIDs.map(async (chunkCID, index) => {
        const chunkStream = this.fs.cat(CID.parse(chunkCID));
        const chunkBuffer = await streamToBuffer(chunkStream);
        const decryptedData = this.decryptChunk(chunkBuffer, encryptionKey); // Déchiffrement

        if (index === 0) {
            if (!this.isValidAudio(Buffer.from(decryptedData))) {
                throw new Error('Le fichier audio est invalide.'); // Renvoie une erreur si le fichier n'est pas valide
            }
        }

        return Buffer.from(Buffer.from(decryptedData.toString(), 'base64')); // Retourner le chunk déchiffré sous forme de Buffer
    });

    // Utiliser Readable.from() pour créer un Readable stream à partir des Promesses
    const stream = Readable.from(chunkPromises);

    // Retourner le flux et les métadonnées sans les chunks
    return { stream, metadata: { title, duration } };
}


// Fonction pour vérifier si le buffer audio est valide
private isValidAudio(buffer: Buffer): boolean {
  // Vérifier si le buffer commence correctement
  const id3Header = buffer.toString('utf-8', 0, 3); // Lire les premiers octets
  return (id3Header === '//v' || id3Header === 'SUQ'); 
}

// Modifiez également la fonction de déchiffrement pour accepter la clé
private decryptChunk(chunkBuffer: Uint8Array, encryptionKey: string): Buffer {
  try {
      const encryptedData = Buffer.from(chunkBuffer).toString('utf-8'); // Convertir le buffer en chaîne
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey); // Utiliser la clé fournie
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


function sleep(ms: any) {
  return new Promise(resolve => setTimeout(resolve, ms));
}