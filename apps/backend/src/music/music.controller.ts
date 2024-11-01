import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { MusicService } from './music.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { parseBuffer } from 'music-metadata';
import CryptoJS from 'crypto-js';


@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  private secretKey = 'test';

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMusic(
      @Body() body: { title: string },
      @UploadedFile() file: Express.Multer.File
  ) {
      const chunkSize = 1024 * 1024; // 1 Mo
      const chunkCIDs: string[] = [];

      // Récupérer les métadonnées
      const metadata = await parseBuffer(file.buffer);
      const duration = metadata.format.duration; // Récupérer la durée

      for (let i = 0; i < file.buffer.length; i += chunkSize) {
          const chunk = file.buffer.slice(i, i + chunkSize);

          // Chiffrement du chunk
          // Convertir le chunk en base64
          const base64Chunk = chunk.toString('base64');
          const encryptedChunk = CryptoJS.AES.encrypt(base64Chunk, this.secretKey).toString();

          // Ajout du chunk chiffré à IPFS et récupération du CID
          const chunkCID = await this.musicService.uploadToIPFS(Buffer.from(encryptedChunk, 'utf-8'));
          chunkCIDs.push(chunkCID);
      }

      // Créer un fichier JSON avec les CIDs
      const manifest = JSON.stringify({
        title: body.title,
        duration: duration,
        chunks: chunkCIDs
      });

      const manifestCID = await this.musicService.uploadToIPFS(Buffer.from(manifest, 'utf-8'));

      return { title: body.title, ipfsHash: manifestCID }; // Retourner le CID principal
  }

  @Get('stream/:cid')
  async streamMusic(@Param('cid') cid: string, @Res() res: Response) {
    await this.musicService.getMusicStream(res, cid); // Appel du service pour le streaming
  }
  
}
