import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class KeyService {
  private keys: Map<string, { key: Buffer; expiration: number }> = new Map();

  /**
   * Génère une clé AES unique pour une session et la stocke.
   * @param sessionId ID unique de la session ou de l'utilisateur.
   * @param ttl Durée de vie de la clé en secondes (par défaut : 1 heure).
   * @returns La clé AES générée.
   */
  generateKeyForSession(sessionId: string, ttl: number = 3600): Buffer {
    const key = crypto.randomBytes(16); // AES-128 nécessite une clé de 16 octets
    const expiration = Date.now() + ttl * 1000; // Expiration en millisecondes
    this.keys.set(sessionId, { key, expiration });
    return key;
  }

  /**
   * Récupère une clé AES pour une session.
   * @param sessionId ID unique de la session ou de l'utilisateur.
   * @returns La clé AES ou `undefined` si elle est expirée ou inexistante.
   */
  getKeyForSession(sessionId: string): Buffer | undefined {
    const entry = this.keys.get(sessionId);
    if (entry && entry.expiration > Date.now()) {
      return entry.key;
    }
    this.keys.delete(sessionId); // Supprime la clé expirée
    return undefined;
  }

  /**
   * Supprime une clé après utilisation ou expiration.
   * @param sessionId ID unique de la session ou de l'utilisateur.
   */
  deleteKeyForSession(sessionId: string): void {
    this.keys.delete(sessionId);
  }
}
