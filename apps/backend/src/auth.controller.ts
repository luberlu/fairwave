import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
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
            const profile = await this.gunDbService.getUserProfile(did);
            return profile ? { success: true, profile } : { success: false, message: 'Profil non trouvé' };
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la récupération du profil utilisateur' };
        }
    }

    @Put('update-profile/:did')
    async updateProfile(
        @Param('did') did: string,
        @Body() updates: { username?: string; artistName?: string; isArtist?: boolean }
    ): Promise<any> {
        try {
            const updatedProfile = await this.gunDbService.updateUserProfile(did, updates);
            return { success: true, message: 'Profil utilisateur mis à jour avec succès', updatedProfile };
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la mise à jour du profil utilisateur' };
        }
    }
}
