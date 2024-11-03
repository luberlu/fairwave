import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusicController } from './music/music.controller.js';
import { MusicService } from './music/music.service.js';
import { AuthController } from './auth.controller.js';
import { DbService } from './db/db.service.js';

@Module({
  imports: [],
  controllers: [AppController, MusicController, AuthController],
  providers: [AppService, MusicService, DbService],
})
export class AppModule {}
