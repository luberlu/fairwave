import { Injectable } from '@nestjs/common';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { CID } from 'multiformats/cid';

@Injectable()
export class StorageService {
  private helia: any;
  private fs: any;

  constructor() {
    this.initHelia();
  }

  async initHelia() {
    const blockstore = new FsBlockstore('../../storage/music');
    this.helia = await createHelia({ blockstore });
    this.fs = unixfs(this.helia);
  }

  /**
   * Ajoute un fichier sur IPFS.
   * @param file Le contenu du fichier sous forme de Buffer.
   * @returns Le CID du fichier ajouté.
   */
  async uploadToIPFS(file: Buffer): Promise<string> {
    const cid = await this.fs.addFile({ content: file });
    return cid.toString();
  }

  /**
   * Récupère un fichier depuis IPFS à partir de son CID.
   * @param cid Le CID du fichier à récupérer.
   * @returns Un stream du fichier récupéré.
   */
  async getFileStream(cid: string): Promise<AsyncIterable<Uint8Array>> {
    const parsedCID = CID.parse(cid);
    return this.fs.cat(parsedCID);
  }
}
