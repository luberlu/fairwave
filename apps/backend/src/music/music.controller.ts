import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  Headers
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MusicService, MusicTrack } from './music.service.js';
import { BlockchainService } from './blockchain.service.js';
import { StorageService } from './storage.service.js';
import { UploadService } from './upload.service.js';
import { parseBuffer } from 'music-metadata';
import { SecretKeyService } from './secretkey.service.js';
import { EncryptionService } from './encryption.service.js';
import crypto from 'crypto';
import { StreamingService } from './streaming.service.js';

@Controller('music')
export class MusicController {
  constructor(
    private readonly storageService: StorageService,
    private readonly musicService: MusicService,
    private readonly uploadService: UploadService,
    private readonly blockchainService: BlockchainService,
    private readonly secretKeyService: SecretKeyService,
    private readonly encryptionService: EncryptionService,
    private readonly streamingService: StreamingService
  ) {}

  @Get(':cid/metadata')
  async getHLSMetadata(@Param('cid') cid: string): Promise<MusicTrack> {
    // Cherchez les métadonnées dans la base de données ou un autre stockage
    const metadata = await this.musicService.get(cid);

    if (!metadata) {
      throw new HttpException(
        'Métadonnées introuvables pour ce CID',
        HttpStatus.NOT_FOUND,
      );
    }

    return metadata;
  }

  @Get('hls/:cid')
  async streamHLS(
    @Param('cid') cid: string,
    @Headers('X-User-Did') userDid: string,
    @Res() res: Response,
  ) {
    // Récupérez le manifeste depuis IPFS
    const manifestStream = await this.storageService.downloadFromIPFS(cid);

    const manifestBuffer = await this.streamingService.streamToBuffer(manifestStream);
    const manifestContent = manifestBuffer.toString('utf-8');

    // Ajouter `exp` et `hmac` aux URLs des segments
    const updatedManifest = this.addSecurityToManifest(manifestContent);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(updatedManifest);
  }

  @Get('hls/segment/:cid')
  async streamHLSSegment(
    @Param('cid') cid: string,
    @Query('exp') exp: string,
    @Query('hmac') hmac: string,
    @Res() res: Response,
  ) {
    try {
      // Valider le CID
      if (!cid) {
        throw new HttpException('CID manquant', HttpStatus.BAD_REQUEST);
      }

      const secretKey = this.secretKeyService.getSecretKey();
      if (!secretKey) {
        throw new HttpException(
          'Clé secrète manquante',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Vérifiez si l'URL est expirée
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > parseInt(exp, 10)) {
        throw new HttpException('URL expirée', HttpStatus.FORBIDDEN);
      }

      // Valider la signature HMAC
      const segmentPath = `/api/music/hls/segment/${cid}`;
      const isValidHmac = this.validateHmac(
        segmentPath,
        parseInt(exp, 10),
        hmac,
        secretKey,
      );
      if (!isValidHmac) {
        throw new HttpException('Signature invalide', HttpStatus.FORBIDDEN);
      }

      // Récupérer et décrypter le segment
      const encryptedSegmentBuffer =
        await this.storageService.downloadAsBufferFromIPFS(cid);
      if (!encryptedSegmentBuffer) {
        throw new HttpException(
          `Segment introuvable pour le CID : ${cid}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const decryptedSegment = this.encryptionService.decryptData(
        encryptedSegmentBuffer,
        secretKey,
      );

      // Envoyer le segment déchiffré
      res.setHeader('Content-Type', 'video/mp2t');
      res.send(decryptedSegment);
    } catch (error) {
      console.error('Erreur lors du streaming du segment HLS :', error);

      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Erreur lors de la récupération du segment HLS.');
      }
    }
  }

  @Post('upload')
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
      // Récupérer la clé secrète depuis SecretKeyService
      const secretKey = this.secretKeyService.getSecretKey();

      // Extraire les métadonnées audio
      const metadata = await parseBuffer(file.buffer);
      const audioMetadata = {
        title: metadata.common.title || body.title || 'Titre inconnu',
        artist: metadata.common.artist || 'Artiste inconnu',
        album: metadata.common.album || 'Album inconnu',
        duration: metadata.format.duration || 0,
      };

      console.log('Méta-données audio extraites:', audioMetadata);

      const cleanedBuffer = await this.uploadService.preprocessMP3(file.buffer);

      // Étape 1 : Générer les segments et le manifest
      const { segments, manifest } =
        await this.uploadService.generateHLS(cleanedBuffer);

      // Étape 2 : Encrypter les segments avec la clé générique
      const encryptedSegments = segments.map((segment) =>
        this.encryptionService.encryptData(segment, secretKey),
      );

      // Étape 3 : Upload segments et manifest sur IPFS
      const { manifestCID, segmentCIDs } =
        await this.uploadService.uploadHLSFilesToIPFS(
          encryptedSegments,
          manifest,
        );

      console.log('Segments chiffrés:', segmentCIDs);
      console.log('Manifest CID:', manifestCID);

      // Étape 4 : Vérifiez si la piste est déjà enregistrée sur la blockchain
      const trackExists = await this.blockchainService.isTrackRegistered(
        body.userDid,
        manifestCID,
      );

      if (trackExists) {
        throw new HttpException('Track already exists.', HttpStatus.CONFLICT);
      }

      // Étape 5 : Enregistrer la piste sur la blockchain
      await this.blockchainService.registerTrack(body.userDid, manifestCID);

      // Étape 6 : Sauvegarder les métadonnées dans la base de données
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

  /**
   * Get all tracks registered by a specific user.
   */
  @Get('user-tracks')
  async getUserTracks(@Headers('X-User-Did') userDid: string) {
    if (!userDid) {
      throw new HttpException(
        'DID de l’utilisateur manquant',
        HttpStatus.BAD_REQUEST,
      );
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
   * Get all tracks stored in the GUN database.
   */
  @Get('all')
  async getAllTracks() {
    try {
      const tracks = await this.musicService.getAllTracks(); // Appelle la méthode du MusicService
      return { success: true, tracks };
    } catch (error) {
      console.error(
        'Erreur lors de la récupération de tous les morceaux:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des morceaux',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ajoute des paramètres `exp` et `hmac` aux URLs des segments dans le manifeste HLS.
   */
  private addSecurityToManifest(manifest: string): string {
    const lines = manifest.split('\n');
    const secretKey = this.secretKeyService.getSecretKey();
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60; // 1 heure de validité

    return lines
      .map((line) => {
        if (line.startsWith('/api/music/hls/segment/')) {
          const hmac = this.generateHmac(line, expiration, secretKey);
          return `${line}?exp=${expiration}&hmac=${hmac}`;
        }
        return line;
      })
      .join('\n');
  }

  /**
   * Génère un HMAC signé pour un segment.
   */
  private generateHmac(
    path: string,
    expiration: number,
    secretKey: string,
  ): string {
    return crypto
      .createHmac('sha256', secretKey)
      .update(`${path}:${expiration}`)
      .digest('hex');
  }

  /**
   * Vérifie un HMAC signé pour un segment.
   */
  private validateHmac(
    path: string,
    expiration: number,
    providedHmac: string,
    secretKey: string,
  ): boolean {
    const expectedHmac = this.generateHmac(path, expiration, secretKey);
    return expectedHmac === providedHmac;
  }
}
