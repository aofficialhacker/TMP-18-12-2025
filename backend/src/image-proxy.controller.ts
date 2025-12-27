import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('image-proxy')
export class ImageProxyController {
  @Get()
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send('Image url missing');

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': new URL(url).origin,
        },
      });

      if (!response.ok) return res.status(502).send('Unable to fetch image');

      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } catch {
      res.status(502).send('Unable to fetch image');
    }
  }
}
