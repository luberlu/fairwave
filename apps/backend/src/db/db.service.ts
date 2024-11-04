import { Injectable, OnModuleInit } from '@nestjs/common';
import Gun from 'gun';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Interface pour le profil utilisateur
interface UserProfile {
    did: string;
    signature: string;
    // Ajoutez d'autres champs si nécessaire, comme role, encryptionKey, etc.
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
        const server = http.createServer();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        
        // Initialiser Gun avec le serveur HTTP
        this.gun = Gun({
            web: server,
            file: join(__dirname, '..', '..', '..', '..', 'storage', 'tmp'), // Dossier pour les fichiers temporaires
        });

        // Écouter sur le port 8765
        server.listen(8765, () => {
            console.log('Gun server démarré sur http://localhost:8765/gun');
        });
    }

    // Méthode pour exposer Gun aux autres services
    getInstance() {
        return this.gun;
    }

    // Méthode pour stocker un profil utilisateur dans Gun en utilisant DID
    async storeUserProfile(profile: UserProfile): Promise<UserProfile> {
        return new Promise((resolve, reject) => {
            const userProfiles = this.gun.get('userProfiles');
            userProfiles.get(profile.did).put(profile, (ack: GunAck) => {
                if (ack.err) {
                    reject(new Error('Erreur lors du stockage du profil utilisateur'));
                } else {
                    console.log(`Profil utilisateur stocké pour DID ${profile.did}`);
                    resolve(profile);
                }
            });
        });
    }

    // Méthode pour récupérer un profil utilisateur par DID
    async getUserProfile(did: string): Promise<UserProfile | null> {
        return new Promise((resolve) => {
            const userProfiles = this.gun.get('userProfiles');
            userProfiles.get(did).once((data: UserProfile) => {
                if (data) {
                    resolve(data);
                } else {
                    resolve(null); // Si aucun profil n'est trouvé, résout avec null
                }
            });
        });
    }
}
