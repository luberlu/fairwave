import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res, Headers, StreamableFile, Header } from '@nestjs/common';
import { MusicService } from './music.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { parseBuffer } from 'music-metadata';
import CryptoJS from 'crypto-js';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMusic(
      @Body() body: { title: string, secretKey: string }, // Ajout de la clé secrète dans le corps
      @UploadedFile() file: Express.Multer.File
  ) {
      const chunkSize = 1024 * 1024; // 1 Mo
      const chunkCIDs: string[] = [];

      // Récupérer les métadonnées
      const metadata = await parseBuffer(file.buffer);
      const duration = metadata.format.duration; // Récupérer la durée

      console.log('ici1');

      for (let i = 0; i < file.buffer.length; i += chunkSize) {
          const chunk = file.buffer.slice(i, i + chunkSize);
          console.log('ici3');

          // Chiffrement du chunk
          // Convertir le chunk en base64
          const base64Chunk = chunk.toString('base64');
          console.log('ma clé screte => ', body.secretKey);
          const encryptedChunk = CryptoJS.AES.encrypt(base64Chunk, body.secretKey).toString(); // Utiliser la clé fournie par l'utilisateur

          // Ajout du chunk chiffré à IPFS et récupération du CID
          const chunkCID = await this.musicService.uploadToIPFS(Buffer.from(encryptedChunk, 'utf-8'));
          chunkCIDs.push(chunkCID);
      }

      console.log('ici2');

      // Créer un fichier JSON avec les CIDs et les métadonnées
      const manifest = JSON.stringify({
        title: body.title,
        duration: duration,
        chunks: chunkCIDs
      });

      const manifestCID = await this.musicService.uploadToIPFS(Buffer.from(manifest, 'utf-8'));

      return { title: body.title, ipfsHash: manifestCID }; // Retourner le CID principal
  }

  @Get('stream/:cid')
  async streamMusic(@Param('cid') cid: string, @Res() res: Response, @Headers('X-Encryption-Key') encryptionKey: string) {
      const stream = await this.musicService.getMusicStream(cid, encryptionKey);

      if (!stream) {
          res.status(500).send('Erreur lors de la récupération du fichier.');
          return;
      }
      
      res.setHeader('Content-Type', 'audio/mpeg');
      stream.pipe(res);
  }

  @Get('test')
  @Header('Content-Type', 'audio/mpeg')
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'music.mp3'));
    return new StreamableFile(file);
  }

}
