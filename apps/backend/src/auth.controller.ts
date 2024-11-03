import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DbService } from './db/db.service.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly gunDbService: DbService) {}

    @Post('store-profile')
    async storeProfile(@Body() body: { address: string; signature: string; did: string }): Promise<any> {
        const { address, did } = body;

        try {
            const profile = await this.gunDbService.storeUserProfile({ address, did });
            return { success: true, message: 'Profil utilisateur stocké avec succès', profile };
        } catch (error) {
            console.error('Erreur lors du stockage du profil utilisateur', error);
            return { success: false, error: 'Erreur lors du stockage du profil utilisateur' };
        }
    }

    @Get('get-profile/:address')
    async getProfile(@Param('address') address: string): Promise<any> {
        try {
            const profile = await this.gunDbService.getUserProfile(address);
            return profile ? { success: true, profile } : { success: false, message: 'Profil non trouvé' };
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la récupération du profil utilisateur' };
        }
    }
}
