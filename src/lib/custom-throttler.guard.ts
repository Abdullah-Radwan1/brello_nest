
import {
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new BadRequestException({
      statusCode: 429,
      error: 'RATE_LIMIT_EXCEEDED',
      message: `You have exceeded the limit of ${throttlerLimitDetail.limit} requests. Please try again in 2 minutes.`,
      ttl: throttlerLimitDetail.ttl,
    });
  }
}
