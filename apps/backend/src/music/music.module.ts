import { Module } from '@nestjs/common';
import { MusicController } from './music.controller.js';
import { UploadService } from './upload.service.js';
import { StreamingService } from './streaming.service.js';
import { BlockchainService } from './blockchain.service.js';
import { StorageService } from './storage.service.js';
import { MusicService } from './music.service.js';
import { DbModule } from '../db/db.module.js';

@Module({
  controllers: [MusicController],
  providers: [MusicService, StorageService, UploadService, StreamingService, BlockchainService],
  imports: [DbModule],
})
export class MusicModule {}