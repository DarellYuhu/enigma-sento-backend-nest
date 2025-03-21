import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: () => void) {
    const { ip, method, baseUrl: url } = req;

    res.on('close', () => {
      const { statusCode } = res;
      if (statusCode === 500) {
        this.logger.log({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      }
      this.logger.log(`${method} ${url} ${statusCode} - ${ip}`);
    });

    next();
  }
}
