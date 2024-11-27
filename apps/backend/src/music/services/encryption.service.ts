import { Injectable } from '@nestjs/common';
import CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  encryptData(data: Buffer, secretKey: string): Buffer {
    const encrypted = CryptoJS.AES.encrypt(
      data.toString('base64'),
      secretKey,
    ).toString();
    return Buffer.from(encrypted, 'utf-8');
  }

  decryptData(encryptedData: Buffer, secretKey: string): Buffer {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedData.toString('utf-8'),
      secretKey,
    );
    const decoded = decrypted.toString(CryptoJS.enc.Utf8);
    return Buffer.from(decoded, 'base64');
  }
}
