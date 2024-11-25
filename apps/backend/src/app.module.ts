import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
// import { MusicController } from './music/music.controller.js';
// import { MusicService } from './music/music.service.js';
import { UserController } from './user/user.controller.js';
import { DbService } from './db/db.service.js';
import { UserService } from './user/user.service.js';
import { MusicModule } from './music/music.module.js';

@Module({
  imports: [MusicModule],
  controllers: [AppController, UserController],
  providers: [AppService, DbService, UserService],
})
export class AppModule {}
