import { Controller, Get, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { StreamingService } from '../services/streaming.service.js';

@Controller('music/stream')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get(':cid')
  async streamManifest(@Param('cid') cid: string, @Res() res: Response) {
    const manifest = await this.streamingService.getManifestWithSecurity(cid);

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(manifest);
  }

  @Get('segment/:cid')
  async streamSegment(
    @Param('cid') cid: string,
    @Query('exp') exp: string,
    @Query('hmac') hmac: string,
    @Res() res: Response,
  ) {
    try {
      const segment = await this.streamingService.getDecryptedSegment(
        cid,
        exp,
        hmac,
      );

      res.setHeader('Content-Type', 'video/mp2t');
      res.send(segment);
    } catch (error) {
      console.error('Erreur lors du streaming du segment:', error);

      if (!res.headersSent) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Erreur lors de la récupération du segment.');
      }
    }
  }
}
