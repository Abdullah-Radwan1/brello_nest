import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  controllers: [AiController],
  providers: [AiService],
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 1,
        },
      ],
    }),
  ],
})
export class AiModule {}
