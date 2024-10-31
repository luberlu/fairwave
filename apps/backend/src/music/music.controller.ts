import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { MusicService } from './music.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import CryptoJS from 'crypto-js';


@Controller('music')
export class MusicController {
  constructor(private readonly musicService: MusicService) {}

  private secretKey = 'test';

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMusic(
    @Body() body: { title: string }, // Récupère le titre depuis le corps
    @UploadedFile() file: Express.Multer.File // Récupère le fichier uploadé
  ){
    const chunkSize = 1024 * 1024; // 64 Ko
    const chunkCIDs: string[] = []; // Tableau pour stocker les CIDs des morceaux

    for (let i = 0; i < file.buffer.length; i += chunkSize) {
        const chunk = file.buffer.slice(i, i + chunkSize);
        const encryptedChunk = CryptoJS.AES.encrypt(chunk.toString('base64'), this.secretKey).toString();
        
        // Ajout du chunk chiffré à IPFS et récupération du CID
        const chunkCID = await this.musicService.uploadToIPFS(Buffer.from(encryptedChunk, 'utf-8'));
        chunkCIDs.push(chunkCID);
    }

    // Créer un fichier JSON avec les CIDs
    const manifest = JSON.stringify(chunkCIDs);
    const manifestCID = await this.musicService.uploadToIPFS(Buffer.from(manifest, 'utf-8'));

    return { title: body.title, ipfsHash: manifestCID }; // Retourner le CID principal
}


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

  @Post('upload3')
@UseInterceptors(FileInterceptor('file')) // Intercepteur pour gérer le fichier
async uploadMusic3(
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
