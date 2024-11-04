import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DbService } from './db/db.service.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly gunDbService: DbService) {}

    @Post('store-profile')
    async storeProfile(@Body() body: { did: string; signature: string }): Promise<any> {
        const { did, signature } = body;

        try {
            // On utilise le DID pour stocker le profil utilisateur
            const profile = await this.gunDbService.storeUserProfile({ did, signature });
            return { success: true, message: 'Profil utilisateur stocké avec succès', profile };
        } catch (error) {
            console.error('Erreur lors du stockage du profil utilisateur', error);
            return { success: false, error: 'Erreur lors du stockage du profil utilisateur' };
        }
    }

    @Get('get-profile/:did')
    async getProfile(@Param('did') did: string): Promise<any> {
        try {
            // On utilise le DID pour récupérer le profil utilisateur
            const profile = await this.gunDbService.getUserProfile(did);
            return profile ? { success: true, profile } : { success: false, message: 'Profil non trouvé' };
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la récupération du profil utilisateur' };
        }
    }
}
