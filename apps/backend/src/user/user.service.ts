import { Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service.js';

interface UserProfile {
    did: string;
    signature: string;
    username?: string;
    artistName?: string;
    isArtist?: boolean;
}

interface GunAck {
    err?: string;
    ok?: number;
}

@Injectable()
export class UserService {
    private gunInstance: any;

    constructor(private readonly dbService: DbService) {}

    onModuleInit() {
        this.gunInstance = this.dbService.getInstance().get('users');
    }

    async store(profile: UserProfile): Promise<UserProfile> {
        return new Promise((resolve, reject) => {
            this.gunInstance.get(profile.did).put(profile, (ack: GunAck) => {
                if (ack.err) {
                    reject(new Error('Erreur lors du stockage du profil utilisateur'));
                } else {
                    console.log(`Profil utilisateur stocké pour DID ${profile.did}`);
                    resolve(profile);
                }
            });
        });
    }
    async get(did: string): Promise<UserProfile | null> {
        return new Promise((resolve) => {
            this.gunInstance.get(did).once((data: UserProfile) => {
                resolve(data || null); // Résout avec null si aucun profil n'est trouvé
            });
        });
    }

    async update(did: string, updates: Partial<UserProfile>): Promise<UserProfile> {
        return new Promise((resolve, reject) => {
            this.gunInstance.get(did).put(updates, (ack: GunAck) => {
                if (ack.err) {
                    reject(new Error('Erreur lors de la mise à jour du profil utilisateur'));
                } else {
                    resolve({ did, ...updates } as UserProfile);
                }
            });
        });
    }
}
