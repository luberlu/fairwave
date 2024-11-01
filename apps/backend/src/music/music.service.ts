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

  async getMusicStream(res: Response, cidStr: string, encryptionKey: string): Promise<StreamableFile| null | undefined> {
    const manifestCID = CID.parse(cidStr);
    const manifestData = await this.getManifestData(manifestCID);

    const stream = new Readable();
    stream._read = () => {};

    if (!manifestData) {
        res.status(500).send('Erreur lors de la récupération du fichier.');
        return null; // Arrêtez l'exécution si le manifest échoue
    }

    console.log('encrypt key !! => ', encryptionKey);
    if(!encryptionKey){
      res.status(500).send('Erreur lors de la récupération du fichier : pas de clé secrète');
      return null;
    }

    let metadata: { title: string; duration: number; chunks: string[] };

    try {
        // Extraire les métadonnées du manifest
        metadata = JSON.parse(manifestData);
    } catch (error) {
        console.error('Erreur lors du parsing des métadonnées du manifest:', error);
        res.status(500).send('Erreur lors du parsing des métadonnées.');
        return; // Arrêtez l'exécution si le parsing échoue
    }

    const chunkCIDs = metadata.chunks;

    if (!chunkCIDs) {
        res.status(500).send('Erreur lors de la récupération des chunks.');
        return; // Arrêtez l'exécution si les chunks échouent
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    // Optionnel: inclure des en-têtes supplémentaires, comme le titre et la durée
    res.setHeader('X-Title', metadata.title || 'Unknown Title');
    res.setHeader('X-Duration', metadata.duration ? metadata.duration.toString() : 'unknown');
    

    try {
      let isFirstChunk = true; // Indicateur pour le premier chunk

        for (const chunkCID of chunkCIDs) {
          console.log('chunkCID => ', chunkCID);
            const chunkStream = this.fs.cat(CID.parse(chunkCID));
            
            // Traitement de chaque chunk
            const chunkBuffer = await streamToBuffer(chunkStream);
            const decryptedData = this.decryptChunk(chunkBuffer, encryptionKey); // Déchiffement

            if (isFirstChunk) {
              if (!this.isValidAudio(Buffer.from(decryptedData))) {
                res.status(400).send('Le fichier audio est invalide.'); // Renvoie une erreur si le fichier n'est pas valide
                return;
              }
              isFirstChunk = false; // Passer à false après la première vérification
          }

          stream.push(Buffer.from(decryptedData.toString(), 'base64'));
        }

        stream.push(null); // Indique que le stream est terminé
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }

    res.send(stream.read());
    // Utiliser res.send pour renvoyer le flux
    
}

// Fonction pour vérifier si le buffer audio est valide
private isValidAudio(buffer: Buffer): boolean {
  // Vérifier si le buffer commence correctement
  const id3Header = buffer.toString('utf-8', 0, 3); // Lire les premiers octets
  return id3Header === '//v'; 
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