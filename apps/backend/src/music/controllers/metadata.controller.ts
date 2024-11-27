import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MusicService, MusicTrack } from '../services/music.service.js';

@Controller('music/metadata')
export class MetadataController {
  constructor(private readonly musicService: MusicService) {}

  @Get(':cid')
  async getMetadata(@Param('cid') cid: string): Promise<MusicTrack> {
    const metadata = await this.musicService.get(cid);

    if (!metadata) {
      throw new HttpException(
        'Métadonnées introuvables pour ce CID',
        HttpStatus.NOT_FOUND,
      );
    }

    return metadata;
  }
}
