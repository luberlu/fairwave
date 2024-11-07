// db.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import Gun from 'gun';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

@Injectable()
export class DbService implements OnModuleInit {
    private gun: any;

    onModuleInit() {
        const server = http.createServer();

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);

        this.gun = Gun({
            web: server,
            file: join(__dirname, '..', '..', '..', '..', 'storage', 'tmp'),
        });

        server.listen(8765, () => {
            console.log('Gun server démarré sur http://localhost:8765/gun');
        });
    }

    getInstance() {
        return this.gun;
    }
}
