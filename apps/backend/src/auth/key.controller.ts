import { Controller, Get, Param, HttpException, HttpStatus, Res } from '@nestjs/common';
import { KeyService } from './key.service';
import { Response } from 'express';

@Controller('auth/key')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  /**
   * Sert une clé AES pour une session.
   * @param sessionId ID de session pour récupérer la clé.
   * @param res Objet réponse HTTP.
   */
  @Get(':sessionId')
  serveKey(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const key = this.keyService.getKeyForSession(sessionId);

    if (!key) {
      throw new HttpException('Clé introuvable ou expirée.', HttpStatus.NOT_FOUND);
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(key);
  }
}
