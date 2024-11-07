import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MusicController } from './music/music.controller.js';
import { MusicService } from './music/music.service.js';
import { UserController } from './user.controller.js';
import { DbService } from './db/db.service.js';
import { UserService } from './user.service.js';

@Module({
  imports: [],
  controllers: [AppController, MusicController, UserController],
  providers: [AppService, MusicService, DbService, UserService],
})
export class AppModule {}
