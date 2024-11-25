import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('store')
    async store(@Body() body: { did: string; signature: string }): Promise<any> {
        const { did, signature } = body;

        try {
            const profile = await this.userService.store({ did, signature });
            return { success: true, message: 'Profil utilisateur stocké avec succès', profile };
        } catch (error) {
            console.error('Erreur lors du stockage du profil utilisateur', error);
            return { success: false, error: 'Erreur lors du stockage du profil utilisateur' };
        }
    }

    @Get('get/:did')
    async get(@Param('did') did: string): Promise<any> {
        try {
            const profile = await this.userService.get(did);
            return profile ? { success: true, profile } : { success: false, message: 'Profil non trouvé' };
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la récupération du profil utilisateur' };
        }
    }

    @Put('update/:did')
    async update(
        @Param('did') did: string,
        @Body() updates: { username?: string; artistName?: string; isArtist?: boolean }
    ): Promise<any> {
        try {
            const updatedProfile = await this.userService.update(did, updates);
            return { success: true, message: 'Profil utilisateur mis à jour avec succès', updatedProfile };
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil utilisateur', error);
            return { success: false, error: 'Erreur lors de la mise à jour du profil utilisateur' };
        }
    }
}
