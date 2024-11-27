import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretKeyService {
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    try {
      let secretKey = this.configService.get<string>('SECRET_KEY');

      if (!secretKey) {
        throw new Error(
          'SECRET_KEY is not defined in the environment variables',
        );
      } else {
        this.secretKey = secretKey;
      }
    } catch (error: any) {
      console.error('Error retrieving SECRET_KEY:', error.message);
      throw new HttpException(
        'Internal Server Error: Missing SECRET_KEY. Please configure the environment variables correctly.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getSecretKey(): string {
    return this.secretKey;
  }
}
