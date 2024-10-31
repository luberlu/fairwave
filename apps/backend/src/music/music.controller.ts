import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { MusicService } from './music.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import CryptoJS from 'crypto-js';


@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  private secretKey = 'test';

  // Endpoint pour uploader un fichier sur IPFS
  @Post('upload2')
  @UseInterceptors(FileInterceptor('file')) // Intercepteur pour gérer le fichier
  async uploadMusic2(
    @Body() body: { title: string }, // Récupère le titre depuis le corps
    @UploadedFile() file: Express.Multer.File // Récupère le fichier uploadé
  ) {
    // Chiffrement du fichier avec AES
    const encrypted = CryptoJS.AES.encrypt(file.buffer.toString('base64'), this.secretKey).toString();

    // Le texte chiffré peut être directement stocké comme une chaîne
    const cid = await this.musicService.uploadToIPFS(Buffer.from(encrypted, 'utf-8')); // Utiliser le contenu chiffré
    return { title: body.title, ipfsHash: cid };
  }

  @Post('upload')
@UseInterceptors(FileInterceptor('file')) // Intercepteur pour gérer le fichier
async uploadMusic(
  @Body() body: { title: string }, // Récupère le titre depuis le corps
  @UploadedFile() file: Express.Multer.File // Récupère le fichier uploadé
) {
  // Chiffrement du fichier avec AES
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(file.buffer), // Utiliser le buffer directement
    this.secretKey
  ).toString();

  // Le texte chiffré peut être directement stocké comme une chaîne
  const cid = await this.musicService.uploadToIPFS(Buffer.from(encrypted, 'utf-8')); // Utiliser le contenu chiffré
  return { title: body.title, ipfsHash: cid };
}

  // Endpoint pour récupérer un fichier depuis IPFS par son CID
  /*@Get(':cid')
  async getMusic(@Param('cid') cid: string) {
    // Appel du service pour récupérer le contenu du fichier depuis IPFS
    const fileContent = await this.musicService.getFileFromIPFS(cid);
    return { content: fileContent };
  }*/

  @Get('stream/:cid')
  async streamMusic(@Param('cid') cid: string, @Res() res: Response) {
    await this.musicService.getMusicStream(res, cid); // Appel du service pour le streaming
  }
  
}
