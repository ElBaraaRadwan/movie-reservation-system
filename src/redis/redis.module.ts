import { Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as unknown as string, // Cast to string to satisfy type requirements
        host: configService.get<string>('REDIS_HOST'), // Redis host
        port: configService.get<number>('REDIS_PORT'), // Redis port
        auth_pass: configService.get<string>('REDIS_PASSWORD'), // Optional if password-protected
        ttl: 600, // Default time-to-live (in seconds)
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}