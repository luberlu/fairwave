import { Injectable, OnModuleInit } from '@nestjs/common';
import Gun from 'gun';

// Interface pour le profil utilisateur
interface UserProfile {
    address: string;
    did: string;
}

// Interface pour l'accusé de réception GunDB (ack)
interface GunAck {
    err?: string;
    ok?: number;
}

@Injectable()
export class DbService implements OnModuleInit {
    private gun: any;

    onModuleInit() {
        // Initialisation de Gun
        this.gun = Gun({ web: { port: 8765 } });
        console.log('GunDB initialisé');
    }

     // Méthode pour exposer Gun aux autres services
    getInstance() {
        return this.gun;
    }

    // Méthode pour stocker un profil utilisateur dans Gun
    async storeUserProfile(profile: UserProfile): Promise<UserProfile> {
        return new Promise((resolve, reject) => {
            const userProfiles = this.gun.get('userProfiles');
            userProfiles.set(profile, (ack: GunAck) => {
                if (ack.err) {
                    reject(new Error('Erreur lors du stockage du profil utilisateur'));
                } else {
                    console.log(`Profil utilisateur stocké pour ${profile.address}`);
                    resolve(profile);
                }
            });
        });
    }

    // Méthode pour récupérer un profil utilisateur par adresse
    async getUserProfile(address: string): Promise<UserProfile | null> {
        return new Promise((resolve, reject) => {
            const userProfiles = this.gun.get('userProfiles');
            userProfiles.map().once((data: UserProfile) => {
                if (data && data.address === address) {
                    resolve(data);
                }
            });
            // Si aucun profil n'est trouvé, on résout avec null
            setTimeout(() => resolve(null), 1000); // Ajoute un timeout pour éviter des promesses en attente indéfinie
        });
    }
}
