// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global() //  VERY IMPORTANT: makes RedisService available app-wide without re-importing
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
