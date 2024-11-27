import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import { EncryptionService } from './encryption.service.js';
import { SecretKeyService } from './secretkey.service.js';
import crypto from 'crypto';

@Injectable()
export class StreamingService {
  constructor(
    private readonly storageService: StorageService,
    private readonly encryptionService: EncryptionService,
    private readonly secretKeyService: SecretKeyService,
  ) {}

  /**
   * Récupère le manifeste depuis IPFS et ajoute les paramètres de sécurité (`exp` et `hmac`) à chaque segment.
   */
  async getManifestWithSecurity(cid: string): Promise<string> {
    const manifestStream = await this.storageService.downloadFromIPFS(cid);
    if (!manifestStream) {
      throw new HttpException('Manifest introuvable', HttpStatus.NOT_FOUND);
    }

    const manifestBuffer = await this.streamToBuffer(manifestStream);
    const manifestContent = manifestBuffer.toString('utf-8');
    const updatedManifest = this.addSecurityToManifest(manifestContent);

    return updatedManifest;
  }

  /**
   * Récupère et déchiffre un segment chiffré depuis IPFS.
   */
  async getDecryptedSegment(
    cid: string,
    exp: string,
    hmac: string,
  ): Promise<Buffer> {
    const secretKey = this.secretKeyService.getSecretKey();
    if (!secretKey) {
      throw new HttpException(
        'Clé secrète manquante',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > parseInt(exp, 10)) {
      throw new HttpException('URL expirée', HttpStatus.FORBIDDEN);
    }

    // Valider la signature HMAC
    const segmentPath = `/api/music/stream/segment/${cid}`;
    const isValidHmac = this.validateHmac(
      segmentPath,
      parseInt(exp, 10),
      hmac,
      secretKey,
    );
    if (!isValidHmac) {
      throw new HttpException('Signature invalide', HttpStatus.FORBIDDEN);
    }

    // Récupérer le segment chiffré depuis IPFS
    const encryptedSegmentBuffer =
      await this.storageService.downloadAsBufferFromIPFS(cid);
    if (!encryptedSegmentBuffer) {
      throw new HttpException(
        `Segment introuvable pour le CID : ${cid}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Déchiffrer le segment
    const decryptedSegment = this.encryptionService.decryptData(
      encryptedSegmentBuffer,
      secretKey,
    );
    return decryptedSegment;
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
        if (line.startsWith('/api/music/stream/segment/')) {
          const hmac = this.generateHmac(line, expiration, secretKey);
          return `${line}?exp=${expiration}&hmac=${hmac}`;
        }
        return line;
      })
      .join('\n');
  }

  /**
   * Génère un HMAC signé pour un chemin.
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
   * Vérifie un HMAC signé pour un chemin.
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

  /**
   * Convertit un stream en Buffer.
   */
  private async streamToBuffer(
    stream: AsyncIterable<Uint8Array>,
  ): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
