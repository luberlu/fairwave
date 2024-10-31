import { Injectable } from '@nestjs/common';
import { Helia, createHelia } from 'helia';
import { unixfs, UnixFS } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { Response } from 'express';
import { parseBuffer } from 'music-metadata';
import { FsBlockstore } from 'blockstore-fs'; // Importer le module de stockage sur disque

@Injectable()
export class MusicService {
  private helia: any;
  private fs: any;

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
