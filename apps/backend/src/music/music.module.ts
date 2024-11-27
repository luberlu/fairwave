import { Module } from '@nestjs/common';
import { UploadController } from './controllers/upload.controller.js';
import { StreamingController } from './controllers/streaming.controller.js';
import { MetadataController } from './controllers/metadata.controller.js';
import { MusicService } from './services/music.service.js';
import { StreamingService } from './services/streaming.service.js';
import { UploadService } from './services/upload.service.js';
import { BlockchainService } from './services/blockchain.service.js';
import { StorageService } from './services/storage.service.js';
import { SecretKeyService } from './services/secretkey.service.js';
import { EncryptionService } from './services/encryption.service.js';
import { DbModule } from '../db/db.module.js';
import { MusicController } from './controllers/music.controller.js';

@Module({
  controllers: [MusicController, UploadController, StreamingController, MetadataController],
  providers: [
    MusicService,
    StreamingService,
    UploadService,
    BlockchainService,
    StorageService,
    SecretKeyService,
    EncryptionService,
  ],
  imports: [DbModule],
})
export class MusicModule {}
