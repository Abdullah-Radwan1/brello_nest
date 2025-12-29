import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GenerateDescriptionDto } from './dto/generate_description_dto';

@Injectable()
export class AiService {
  async generateDescription(dto: GenerateDescriptionDto) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.openrouter}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate a short, catchy project description for "${dto.title}" in less than 25 words.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      let providerMessage = 'Unknown error';

      try {
        const errorJson = await res.json();
        providerMessage =
          errorJson?.error?.message || errorJson?.message || providerMessage;
      } catch {
        providerMessage = await res.text();
      }

      throw new HttpException(
        {
          message:
            res.status === 429
              ? 'You have reached the request limit. Please wait and try again.'
              : 'AI service is temporarily unavailable.',
          provider: 'OpenRouter',
          providerStatus: res.status,
          providerMessage,
        },
        res.status === 429
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.BAD_GATEWAY,
      );
    }

    const data = await res.json();

    return {
      description:
        data.choices?.[0]?.message?.content ?? 'No description found.',
    };
  }
}
