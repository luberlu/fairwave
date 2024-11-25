import { Injectable, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

interface MusicTrack {
  cid: string; // Content Identifier sur IPFS
  title: string; // Titre du morceau
  artistDid: string; // DID de l'utilisateur/artiste
  duration?: number; // Durée du morceau
  timestamp?: string; // Date d'ajout
}

interface GunAck {
  err?: string;
  ok?: number;
}

@Injectable()
export class MusicService implements OnModuleInit {
  private gunInstance: any;

  constructor(private readonly dbService: DbService) {}

  /**
   * Initialise l'instance GUN sur le chemin 'music'.
   */
  onModuleInit() {
    this.gunInstance = this.dbService.getInstance().get('music');
  }

  /**
   * Stocke un nouveau morceau dans GUN.
   * @param track Les métadonnées du morceau à stocker.
   * @returns Le morceau stocké.
   */
  async store(track: MusicTrack): Promise<MusicTrack> {
    return new Promise((resolve, reject) => {
      this.gunInstance.get(track.cid).put(track, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error('Erreur lors du stockage du morceau'));
        } else {
          console.log(`Morceau stocké avec succès : CID ${track.cid}`);
          resolve(track);
        }
      });
    });
  }

  /**
   * Récupère un morceau à partir de son CID.
   * @param cid Le CID du morceau.
   * @returns Les métadonnées du morceau ou null si non trouvé.
   */
  async get(cid: string): Promise<MusicTrack | null> {
    return new Promise((resolve) => {
      this.gunInstance.get(cid).once((data: MusicTrack) => {
        resolve(data || null); // Résout avec null si aucun morceau n'est trouvé
      });
    });
  }

  /**
   * Met à jour les métadonnées d'un morceau existant.
   * @param cid Le CID du morceau à mettre à jour.
   * @param updates Les propriétés à mettre à jour.
   * @returns Les métadonnées mises à jour.
   */
  async update(cid: string, updates: Partial<MusicTrack>): Promise<MusicTrack> {
    return new Promise((resolve, reject) => {
      this.gunInstance.get(cid).put(updates, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error('Erreur lors de la mise à jour du morceau'));
        } else {
          resolve({ cid, ...updates } as MusicTrack);
        }
      });
    });
  }

  /**
   * Supprime un morceau en le rendant inexistant dans GUN.
   * @param cid Le CID du morceau à supprimer.
   * @returns Un boolean indiquant si la suppression a réussi.
   */
  async delete(cid: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.gunInstance.get(cid).put(null, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error('Erreur lors de la suppression du morceau'));
        } else {
          console.log(`Morceau supprimé avec succès : CID ${cid}`);
          resolve(true);
        }
      });
    });
  }

  /**
   * Récupère tous les morceaux appartenant à un artiste spécifique.
   * @param artistDid Le DID de l'artiste.
   * @returns Une liste des morceaux de l'artiste.
   */
  async getTracksByArtist(artistDid: string): Promise<MusicTrack[]> {
    return new Promise((resolve, reject) => {
      const tracks: MusicTrack[] = [];
      this.gunInstance.map().once((data: MusicTrack) => {
        if (data && data.artistDid === artistDid) {
          tracks.push(data);
        }
      });

      setTimeout(() => {
        resolve(tracks);
      }, 1000); // Timeout pour s'assurer que tous les morceaux sont récupérés
    });
  }
}
