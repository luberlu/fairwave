import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    Res,
    Headers,
    StreamableFile,
    Header,
  } from '@nestjs/common';
  import { MusicService } from './music.service.js';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
  
  @Controller('music')
  export class MusicController {
    constructor(private readonly musicService: MusicService) {}
  
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadMusic(
      @Body() body: { title: string; secretKey: string },
      @UploadedFile() file: Express.Multer.File
    ) {
      const result = await this.musicService.uploadMusic(body.title, body.secretKey, file.buffer);
      return { title: body.title, ipfsHash: result.manifestCID };
    }
  
    @Get('stream/:cid')
    async streamMusic(
      @Param('cid') cid: string,
      @Res() res: Response,
      @Headers('X-Encryption-Key') encryptionKey: string
    ) {
      const result = await this.musicService.getMusicStream(cid, encryptionKey);
  
      if (!result || !result.stream || !result.metadata) {
        res.status(500).send('Erreur lors de la récupération du fichier.');
        return;
      }
  
      const { stream, metadata } = result;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Title', metadata.title);
      res.setHeader('X-Duration', metadata.duration.toString());
      res.writeHead(200);
  
      stream.on('data', (chunk: any) => res.write(chunk));
      stream.on('end', () => res.end());
      stream.on('error', (err: any) => {
        console.error('Erreur lors de la diffusion du flux audio:', err);
        res.status(500).send('Erreur lors de la diffusion du fichier audio.');
      });
    }
  
    @Get('test')
    @Header('Content-Type', 'audio/mpeg')
    getFile(): StreamableFile {
      const file = createReadStream(join(process.cwd(), 'music.mp3'));
      return new StreamableFile(file);
    }
  }
  