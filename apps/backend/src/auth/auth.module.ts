import { Module } from '@nestjs/common';
import { KeyService } from './key.service.js';
import { KeyController } from './key.controller.js';

@Module({
  providers: [KeyService],
  controllers: [KeyController],
  exports: [KeyService],
})
export class AuthModule {}
