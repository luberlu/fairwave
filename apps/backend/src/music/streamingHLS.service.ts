import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service.js';
import CryptoJS from 'crypto-js';
import { Readable } from 'stream';

@Injectable()
export class StreamingHLSService {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Déchiffre un chunk AES chiffré.
   * @param encryptedData - Données chiffrées en chaîne de caractères.
   * @param secretKey - Clé secrète utilisée pour le déchiffrement.
   * @returns Les données déchiffrées en chaîne de caractères.
   */
  private decryptChunk(encryptedData: string, secretKey: string): string | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erreur lors du déchiffrement :', error);
      return null;
    }
  }
}
