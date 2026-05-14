import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
        genReqId: (req: any) => req.headers['x-request-id'] || randomUUID(),
        serializers: {
          req(req: any) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              query: req.query,
            };
          },
          res(res: any) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggingModule {}
