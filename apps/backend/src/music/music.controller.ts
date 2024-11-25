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
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service.js';
import { MusicService } from './music.service.js';
import { StreamingService } from './streaming.service.js';
import { BlockchainService } from './blockchain.service.js';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('music')
export class MusicController {
  constructor(
    private readonly musicService: MusicService,
    private readonly uploadService: UploadService,
    private readonly streamingService: StreamingService,
    private readonly blockchainService: BlockchainService,
  ) {}

  /**
   * Upload a music file, encrypt it, and register its metadata on the blockchain.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMusic(
    @Body() body: { title: string; secretKey: string; userDid: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!body.userDid) {
      throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
    }

    try {
      // Step 1: Upload music to IPFS and get CID
      const result = await this.uploadService.uploadMusic(
        body.title,
        body.secretKey,
        file.buffer,
      );

      // Step 2: Check if track is already registered on the blockchain
      const trackExists = await this.blockchainService.isTrackRegistered(
        body.userDid,
        result.manifestCID,
      );

      if (trackExists) {
        throw new HttpException('Track already exists.', HttpStatus.CONFLICT);
      }

      // Step 3: Register track on the blockchain
      await this.blockchainService.registerTrack(body.userDid, result.manifestCID);

      // Step 4: Save track metadata in GUN database
      const trackData = {
        cid: result.manifestCID,
        title: body.title,
        artistDid: body.userDid,
        timestamp: new Date().toISOString(),
      };
      await this.musicService.store(trackData);

      return { success: true, title: body.title, cid: result.manifestCID };
    } catch (error) {
      console.error("Erreur lors de l'upload ou de l'enregistrement sur la blockchain:", error);
      return {
        success: false,
        message: "Erreur lors de l'enregistrement sur la blockchain",
      };
    }
  }

  /**
   * Stream music securely by decrypting chunks and verifying ownership.
   */
  @Get('stream/:cid')
  async streamMusic(
    @Param('cid') cid: string,
    @Headers('X-User-Did') userDid: string, // DID of the user
    @Headers('X-Encryption-Key') encryptionKey: string,
    @Res() res: Response,
  ) {
    if (!userDid) {
      return res.status(HttpStatus.UNAUTHORIZED).send('Utilisateur non authentifié');
    }

    // Verify ownership on the blockchain
    const isOwner = await this.blockchainService.isTrackRegistered(userDid, cid);

    if (!isOwner) {
      return res.status(HttpStatus.FORBIDDEN).send("Vous n'êtes pas le propriétaire de ce fichier.");
    }

    // Get the music stream and metadata
    const result = await this.streamingService.getMusicStream(cid, encryptionKey);

    if (!result || !result.stream || !result.metadata) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Erreur lors de la récupération du fichier.');
      return;
    }

    const { stream, metadata } = result;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Title', metadata.title);
    res.setHeader('X-Duration', metadata.duration.toString());

    stream.on('data', (chunk: any) => res.write(chunk));
    stream.on('end', () => res.end());
    stream.on('error', (err: any) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(err);
    });
  }

  /**
   * Get all tracks registered by a specific user.
   */
  @Get('user-tracks')
  async getUserTracks(@Headers('X-User-Did') userDid: string) {
    if (!userDid) {
      throw new HttpException('DID de l’utilisateur manquant', HttpStatus.BAD_REQUEST);
    }

    try {
      const tracks = await this.blockchainService.getUserTracks(userDid);
      return { success: true, tracks };
    } catch (error) {
      console.error('Erreur lors de la récupération des morceaux:', error);
      throw new HttpException(
        'Erreur lors de la récupération des morceaux',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Example endpoint to test streaming a local file.
   */
  @Get('test')
  @Header('Content-Type', 'audio/mpeg')
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'music.mp3'));
    return new StreamableFile(file);
  }
}
