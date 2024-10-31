import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusicController } from './music/music.controller.js';
import { MusicService } from './music/music.service.js';

@Module({
  imports: [],
  controllers: [AppController, MusicController],
  providers: [AppService, MusicService],
})
export class AppModule {}
