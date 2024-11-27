import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../services/upload.service.js';
import { parseBuffer } from 'music-metadata';
import { EncryptionService } from '../services/encryption.service.js';
import { SecretKeyService } from '../services/secretkey.service.js';
import { BlockchainService } from '../services/blockchain.service.js';
import { MusicService } from '../services/music.service.js';

@Controller('music/upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly encryptionService: EncryptionService,
    private readonly secretKeyService: SecretKeyService,
    private readonly blockchainService: BlockchainService,
    private readonly musicService: MusicService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadMusic(
    @Body() body: { title: string; userDid: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!body.userDid) {
      throw new HttpException(
        'Utilisateur non authentifié',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const secretKey = this.secretKeyService.getSecretKey();

      const metadata = await parseBuffer(file.buffer);
      const audioMetadata = {
        title: metadata.common.title || body.title || 'Titre inconnu',
        artist: metadata.common.artist || 'Artiste inconnu',
        album: metadata.common.album || 'Album inconnu',
        duration: metadata.format.duration || 0,
      };

      const cleanedBuffer = await this.uploadService.preprocessMP3(file.buffer);
      const { segments, manifest } =
        await this.uploadService.generateHLS(cleanedBuffer);

      const encryptedSegments = segments.map((segment) =>
        this.encryptionService.encryptData(segment, secretKey),
      );

      const { manifestCID, segmentCIDs } =
        await this.uploadService.uploadHLSFilesToIPFS(
          encryptedSegments,
          manifest,
        );

      const trackExists = await this.blockchainService.isTrackRegistered(
        body.userDid,
        manifestCID,
      );
      if (trackExists) {
        throw new HttpException('Track already exists.', HttpStatus.CONFLICT);
      }

      await this.blockchainService.registerTrack(body.userDid, manifestCID);

      const trackData = {
        cid: manifestCID,
        title: audioMetadata.title,
        artist: audioMetadata.artist,
        album: audioMetadata.album,
        duration: audioMetadata.duration,
        artistDid: body.userDid,
        timestamp: new Date().toISOString(),
      };

      await this.musicService.store(trackData);

      return { success: true, title: audioMetadata.title, cid: manifestCID };
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
}
