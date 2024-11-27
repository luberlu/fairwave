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
import { MusicService, MusicTrack } from './music.service.js';
import { StreamingService } from './streaming.service.js';
import { BlockchainService } from './blockchain.service.js';
import { createReadStream } from 'fs';
import { join } from 'path';
import { StorageService } from './storage.service.js';
import { StreamingHLSService } from './streamingHLS.service.js';
import { UploadHLSService } from './uploadHLS.service.js';
import { pipeline } from 'stream';
  import { promisify } from 'util';
  import { parseBuffer } from 'music-metadata';
import { SecretKeyService } from './secretkey.service.js';
import { EncryptionService } from './encryption.service.js';

@Controller('music-hls')
export class MusicHLSController {
  constructor(
    private readonly storageService: StorageService,
    private readonly musicService: MusicService,
    private readonly uploadService: UploadHLSService,
    private readonly streamingService: StreamingHLSService,
    private readonly blockchainService: BlockchainService,
    private readonly secretKeyService: SecretKeyService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Get(':cid/metadata')
  async getHLSMetadata(@Param('cid') cid: string): Promise<MusicTrack> {
  // Cherchez les métadonnées dans la base de données ou un autre stockage
  const metadata = await this.musicService.get(cid);

  if (!metadata) {
    throw new HttpException('Métadonnées introuvables pour ce CID', HttpStatus.NOT_FOUND);
  }

  return metadata;
}

  @Get('hls/:cid')
  async streamHLS(
    @Param('cid') cid: string,
    @Headers('X-User-Did') userDid: string,
    @Res() res: Response,
  ) {
    // Vérifiez la propriété
    /*const isOwner = await this.blockchainService.isTrackRegistered(userDid, cid);
    if (!isOwner) {
      throw new HttpException("Vous n'êtes pas autorisé à accéder à ce contenu.", HttpStatus.FORBIDDEN);
    }*/

    // Récupérez le manifeste depuis IPFS
    const manifestStream = await this.storageService.downloadFromIPFS(cid);

    // Convertir le stream AsyncIterable<Uint8Array> en un Buffer complet
    const chunks: Uint8Array[] = [];

    for await (const chunk of manifestStream) {
      chunks.push(chunk);
    }
    const manifestBuffer = Buffer.concat(chunks);

    // Envoyer le manifeste directement dans la réponse
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(manifestBuffer);
  }

  
  @Get('hls/segment/:cid')
  async streamHLSSegment(
    @Param('cid') cid: string,
    @Res() res: Response,
  ) {
    try {
      // Validation du CID
      if (!cid) {
        throw new HttpException('CID manquant', HttpStatus.BAD_REQUEST);
      }
  
      // Récupérer le segment depuis IPFS
      const segmentStream = await this.storageService.downloadFromIPFS(cid);
  
      if (!segmentStream) {
        throw new HttpException(
          `Segment introuvable pour le CID : ${cid}`,
          HttpStatus.NOT_FOUND,
        );
      }
  
      res.setHeader('Content-Type', 'video/mp2t'); // MIME type pour segments HLS
  
      // Utilisation de pipeline pour streamer proprement
      const pipelineAsync = promisify(pipeline);
      await pipelineAsync(segmentStream, res);
    } catch (error) {
      console.error('Erreur lors du streaming du segment HLS :', error);
  
      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send("Erreur lors de la récupération du segment HLS.");
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
    throw new HttpException('Utilisateur non authentifié', HttpStatus.UNAUTHORIZED);
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
    const { segments, manifest } = await this.uploadService.generateHLS(cleanedBuffer);

      console.log('segments before upload => ', segments);

    console.log('segments => ', segments);

    // Étape 2 : Encrypter les segments avec la clé générique
    const encryptedSegments = segments.map((segment) =>
      this.encryptionService.encryptData(segment, secretKey),
    );

    console.log('encrypSeg', encryptedSegments);

    // Étape 3 : Upload segments et manifest sur IPFS
    const { manifestCID, segmentCIDs } = await this.uploadService.uploadHLSFilesToIPFS(
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
    console.error("Erreur lors de l'upload ou de l'enregistrement sur la blockchain:", error);
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

  /**
   * Get all tracks stored in the GUN database.
   */
  @Get('all')
  async getAllTracks() {
    try {
      const tracks = await this.musicService.getAllTracks(); // Appelle la méthode du MusicService
      return { success: true, tracks };
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les morceaux:', error);
      throw new HttpException(
        'Erreur lors de la récupération des morceaux',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
