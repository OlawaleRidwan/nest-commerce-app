// src/redis/redis.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    this.client = new Redis({
      // host: process.env.REDIS_HOST || '127.0.0.1',
      // port: Number(process.env.REDIS_PORT) || 6379,
      // password: process.env.REDIS_PASSWORD || undefined,
      host: 'redis-19723.c251.east-us-mz.azure.redns.redis-cloud.com',
      port: 19723,
      password: 'xuKioNwrUdru33Cc5epMSCBsOrgMaxEO',
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully!');
    });

    this.client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async set(key: string, value: string, expirySeconds?: number) {
    if (expirySeconds) {
      await this.client.set(key, value, 'EX', expirySeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
