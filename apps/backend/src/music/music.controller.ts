import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
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
    @Body() body: { title: string; secretKey: string; userAddress: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!body.userAddress) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Étape 1 : Effectuer l'upload sur IPFS pour obtenir le CID
      const result = await this.musicService.uploadMusic(
        body.title,
        body.secretKey,
        file.buffer,
      );

      // Étape 2 : Vérifier si le CID est déjà enregistré sur la blockchain
      const trackExists = await this.musicService.isTrackRegistered(
        result.manifestCID,
      );

      if (trackExists) {
        throw new HttpException('Track already exists.', HttpStatus.CONFLICT);
      }

      // Étape 3 : Enregistrer le morceau sur la blockchain
      await this.musicService.registerTrackOnBlockchain(
        body.userAddress,
        result.manifestCID,
      );

      return { success: true, title: body.title, cid: result.manifestCID };
    } catch (error) {
      console.error(
        "Erreur lors de l'upload ou de l'enregistrement sur la blockchain:",
        error,
      );
      return {
        success: false,
        message: "Erreur lors de l'enregistrement sur la blockchain",
      };
    }
  }

  @Get('stream/:cid')
  async streamMusic(
    @Param('cid') cid: string,
    @Headers('X-User-Address') userAddress: string, // Adresse de l'utilisateur
    @Headers('X-Encryption-Key') encryptionKey: string,
    @Res() res: Response,
  ) {
    // Vérifiez que l'adresse est fournie
    if (!userAddress) {
      return res.status(401).send('Utilisateur non authentifié');
    }

    // Vérifiez sur la blockchain si l'utilisateur est bien le propriétaire du morceau
    const isOwner = await this.musicService.verifyOwnershipOnBlockchain(
      cid,
      userAddress,
    );

    if (!isOwner) {
      return res
        .status(403)
        .send("Accès refusé : Vous n'êtes pas le propriétaire de ce fichier.");
    }

    // Si la vérification est réussie, obtenez le flux de musique
    const result = await this.musicService.getMusicStream(cid, encryptionKey);

    if (!result || !result.stream || !result.metadata) {
      res.status(500).send('Erreur lors de la récupération du fichier.');
      return;
    }

    const { stream, metadata } = result;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Title', metadata.title);
    res.setHeader('X-Duration', metadata.duration.toString());

    stream.on('data', (chunk: any) => res.write(chunk));
    stream.on('end', () => res.end());
    stream.on('error', (err: any) => {
      res.status(500).send(err);
    });
  }

  @Get('user-tracks')
  async getUserTracks(@Headers('X-User-Address') userAddress: string) {
    if (!userAddress) {
      throw new HttpException(
        'Adresse de l’utilisateur manquante',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const tracks = await this.musicService.getUserTracks(userAddress);
      return { success: true, tracks };
    } catch (error) {
      console.error('Erreur lors de la récupération des morceaux:', error);
      throw new HttpException(
        'Erreur lors de la récupération des morceaux',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('test')
  @Header('Content-Type', 'audio/mpeg')
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'music.mp3'));
    return new StreamableFile(file);
  }
}
