import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserController } from './user/user.controller.js';
import { UserService } from './user/user.service.js';
import { MusicModule } from './music/music.module.js';
import { DbModule } from './db/db.module.js';

@Module({
  imports: [DbModule, MusicModule],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
