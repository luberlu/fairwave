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

  async getMusicStreamFirstWorking(res: Response, cidStr: string) {
    const cid = CID.parse(cidStr);
    const stream = this.fs.cat(cid);

    // Répondre avec un flux
    res.setHeader('Content-Type', 'audio/mpeg'); // Définir le type MIME correct
    res.setHeader('Accept-Ranges', 'bytes'); // Indiquer que le serveur supporte les requêtes de plage
    
    // Obtention des métadonnées
    let metadata: any = null;
    let duration: number | null = null;

    try {
        const buffer = await streamToBuffer(stream); // Convertir le stream en buffer pour les métadonnées
        metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
        duration = metadata.format.duration; // Récupérer la durée

        // Envoyer la durée dans les en-têtes
        res.setHeader('X-Duration', duration ? duration.toString() : 'unknown');
        
        // Récupérer à nouveau le flux pour l'envoyer
        const newStream = this.fs.cat(cid);
        
        for await (const chunk of newStream) {
            res.write(chunk); // Écrire chaque chunk dans la réponse
        }
        res.end(); // Terminer la réponse
    } catch (error) {
        console.error('Erreur lors de la récupération du fichier:', error);
        res.status(500).send('Erreur lors de la récupération du fichier.');
    }

    res.end(); // Terminer la réponse
  }

  async getMusicStream(res: Response, cidStr: string) {
    const manifestCID = CID.parse(cidStr);
    const stream = this.fs.cat(manifestCID);

    // Récupérer tout le contenu du stream pour le manifest
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    
    // Convertir le buffer en chaîne UTF-8
    const manifestData = Buffer.concat(chunks).toString('utf-8'); 
    console.log('Manifest Data:', manifestData); // Vérifiez le contenu ici

    let chunkCIDs: string[];

    try {
        // Parse le contenu en JSON
        chunkCIDs = JSON.parse(manifestData);
    } catch (error) {
        console.error('Erreur lors du parsing du manifest JSON:', error);
        res.status(500).send('Erreur lors de la récupération du fichier.');
        return; // Arrêtez l'exécution si le parsing échoue
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    // Pour chaque CID de chunk, lisez et déchiffrez le contenu
    try {
        for (const chunkCID of chunkCIDs) {
            const chunkStream = this.fs.cat(CID.parse(chunkCID));

            // Convertir chaque chunk en buffer et déchiffrer
            const chunkBuffer = await streamToBuffer(chunkStream); // Fonction pour convertir le stream en buffer
            const encryptedChunk = chunkBuffer.toString('utf-8'); // Convertir en chaîne
            
            // Déchiffrement de chaque morceau
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedChunk, this.secretKey);
            const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8); // Convertir en texte

            // Vérifier si le déchiffrement a réussi
            if (!decryptedData) {
                throw new Error('Le déchiffrement a échoué ou les données sont vides.');
            }

            // Écrire le contenu déchiffré dans la réponse
            res.write(Buffer.from(decryptedData, 'base64')); // Écrire le contenu déchiffré
        }
        res.end(); // Terminer la réponse
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
}

  async getMusicStream2(res: Response, cidStr: string) {
    const cid = CID.parse(cidStr);
    const stream = this.fs.cat(cid);

    res.setHeader('Content-Type', 'audio/mpeg'); // Définir le type MIME correct
    res.setHeader('Accept-Ranges', 'bytes'); // Indiquer que le serveur supporte les requêtes de plage

    try {
        // Streaming des données
        for await (const chunk of stream) {
            // Déchiffrement du chunk
            //const encryptedData = chunk.toString('utf-8'); // Convertir le chunk en chaîne
            //console.log('encryptedData => ', encryptedData);

            const decryptedBytes = CryptoJS.AES.decrypt(Buffer.from(chunk, 'base64').toString(), this.secretKey);

            console.log('decryptedBytes => ', Buffer.from(decryptedBytes.toString(CryptoJS.enc.Utf8)));

            //const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8); // Convertir en texte

            // Vérifier si le déchiffrement a réussi
            /*if (!decryptedData) {
                throw new Error('Le déchiffrement a échoué ou les données sont vides.');
            }*/

            // Écrire le contenu déchiffré dans la réponse
            res.write(Buffer.from(decryptedBytes.toString(CryptoJS.enc.Utf8), 'base64')); // Écrire le contenu déchiffré
        }
        res.end(); // Terminer la réponse
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
}

  async getMusicStreamWork(res: Response, cidStr: string) {
    const cid = CID.parse(cidStr);
    const stream = this.fs.cat(cid);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    try {
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            console.log(chunk);
            chunks.push(chunk);
        }

        const encryptedBuffer = Buffer.concat(chunks);
        const encryptedData = encryptedBuffer.toString('utf-8'); // Convertir le buffer en chaîne

        // Déchiffrement
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
        const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8); // Convertir en texte

        // Vérifier si le déchiffrement a réussi
        if (!decryptedData) {
            throw new Error('Le déchiffrement a échoué ou les données sont vides.');
        }

        // Écrire le contenu déchiffré dans la réponse
        res.write(Buffer.from(decryptedData, 'base64')); // Écrire le contenu déchiffré
        res.end();
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
}

async getMusicStream3(res: Response, cidStr: string) {
    const cid = CID.parse(cidStr);
    const stream = this.fs.cat(cid);

    // Répondre avec un flux
    res.setHeader('Content-Type', 'audio/mpeg'); // Définir le type MIME correct
    res.setHeader('Accept-Ranges', 'bytes'); // Indiquer que le serveur supporte les requêtes de plage

    // Obtention des métadonnées
    let metadata: any = null;
    let duration: number | null = null;

    try {
        // Convertir le stream en buffer pour les métadonnées
        const buffer = await streamToBuffer(stream);
        metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
        duration = metadata.format.duration; // Récupérer la durée

        // Envoyer la durée dans les en-têtes
        res.setHeader('X-Duration', duration ? duration.toString() : 'unknown');
    } catch (error) {
        console.error('Erreur lors de la récupération des métadonnées:', error);
        res.status(500).send('Erreur lors de la récupération des métadonnées.');
        return; // Arrête l'exécution si les métadonnées échouent
    }

    // Récupérer le flux pour le streaming
    const newStream = this.fs.cat(cid);

    // Streaming des données
    try {
        for await (const chunk of newStream) {
            // Déchiffrement du chunk
            const encryptedData = chunk.toString('utf-8'); // Convertir le chunk en chaîne
            //console.log('encryptedData => ', encryptedData);

            const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
            const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8); // Convertit en texte UTF-8

            // Vérifier si le déchiffrement a réussi
            if (!decryptedData) {
                throw new Error('Le déchiffrement a échoué ou les données sont vides.');
            }

            // Écrire le chunk déchiffré dans la réponse
            res.write(Buffer.from(decryptedData, 'base64')); // Écrire le contenu déchiffré en tant que buffer
        }
        res.end(); // Terminer la réponse
    } catch (error) {
        console.error('Erreur lors du streaming du fichier:', error);
        res.status(500).send('Erreur lors du streaming du fichier.');
    }
}


  async getMusicStreamWC(res: Response, cidStr: string) {
      const cid = CID.parse(cidStr);
      const stream = this.fs.cat(cid);

      // Répondre avec un flux
      res.setHeader('Content-Type', 'audio/mpeg'); // Définir le type MIME correct
      res.setHeader('Accept-Ranges', 'bytes'); // Indiquer que le serveur supporte les requêtes de plage
      
      // Obtention des métadonnées
      let metadata: any = null;
      let duration: number | null = null;

      try {
          const buffer = await streamToBuffer(stream); // Convertir le stream en buffer pour les métadonnées
          metadata = await parseBuffer(buffer, { mimeType: 'audio/mpeg' });
          duration = metadata.format.duration; // Récupérer la durée

          // Envoyer la durée dans les en-têtes
          res.setHeader('X-Duration', duration ? duration.toString() : 'unknown');
          
          // Récupérer à nouveau le flux pour l'envoyer
          const newStream = this.fs.cat(cid);
          
          for await (const chunk of newStream) {
              res.write(chunk); // Écrire chaque chunk dans la réponse
          }
          res.end(); // Terminer la réponse
      } catch (error) {
          console.error('Erreur lors de la récupération du fichier:', error);
          res.status(500).send('Erreur lors de la récupération du fichier.');
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
