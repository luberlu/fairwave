import { Module } from '@nestjs/common';
import { MusicController } from './music.controller.js';
import { UploadService } from './upload.service.js';
import { StreamingService } from './streaming.service.js';
import { BlockchainService } from './blockchain.service.js';
import { StorageService } from './storage.service.js';

@Module({
  controllers: [MusicController],
  providers: [StorageService, UploadService, StreamingService, BlockchainService],
})
export class MusicModule {}