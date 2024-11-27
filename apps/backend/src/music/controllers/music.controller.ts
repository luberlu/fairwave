import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Headers
  } from '@nestjs/common';
  import { MusicService } from '../services/music.service.js';
  import { BlockchainService } from '../services/blockchain.service.js';
  
  @Controller('music')
  export class MusicController {
    constructor(
      private readonly musicService: MusicService,
      private readonly blockchainService: BlockchainService,
    ) {}

    /**
     * Get all tracks registered by a specific user.
     */
    @Get('user-tracks')
    async getUserTracks(@Headers('X-User-Did') userDid: string) {
      if (!userDid) {
        throw new HttpException(
          'DID de l’utilisateur manquant',
          HttpStatus.BAD_REQUEST,
        );
      }
  
      try {
        const tracks = await this.blockchainService.getUserTracks(userDid);
        return { success: true, tracks };
      } catch (error) {
        console.error('Erreur lors de la récupération des morceaux:', error);
        throw new HttpException(
          'Erreur lors de la récupération des morceaux',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  
    /**
     * Get all tracks stored in the GUN database.
     */
    @Get('all')
    async getAll() {
      try {
        const tracks = await this.musicService.getAll(); // Appelle la méthode du MusicService
        return { success: true, tracks };
      } catch (error) {
        console.error(
          'Erreur lors de la récupération de tous les morceaux:',
          error,
        );
        throw new HttpException(
          'Erreur lors de la récupération des morceaux',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  