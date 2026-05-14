// apps/api/src/main.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/api directory
dotenv.config();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/http-exception.filter';

import { PrismaService } from './prisma/prisma.service';
import { FileStorageService } from './shared/services/file-storage.service';
import { appRouter } from './trpc/app.router';
import {
  createContext,
  setPrismaService,
  setFileStorageService,
  setAppInstance,
} from './trpc/trpc';
import * as trpcExpress from '@trpc/server/adapters/express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { json } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Switch to pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS with production validation
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  if (isProduction && corsOrigin === '*') {
    logger.warn('CORS_ORIGIN is "*" in production. This is insecure.');
  }
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Body size limit + raw body capture for WeChat payment callbacks
  app.use(
    json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        if (
          req.url?.includes('/payments/wechat/callback') ||
          req.url?.includes('/payments/wechat/refund-callback')
        ) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  // 配置静态文件服务（用于访问上传的文件）
  const uploadPath = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../../uploads');
  app.use(express.static(uploadPath));

  // Set global prefix for all REST API routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up tRPC middleware
  const prismaService = app.get(PrismaService);
  setPrismaService(prismaService.extended || prismaService);

  const fileStorageService = app.get(FileStorageService);
  setFileStorageService(fileStorageService);

  setAppInstance(app);

  (app as any).use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: (opts) => createContext(opts),
    }),
  );

  // Set up Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('OpenCode API')
    .setDescription('Full-stack monorepo with NestJS, tRPC, and Prisma')
    .setVersion('1.0')
    .addTag('todos', 'Todo resource operations')
    .addTag('users', 'User resource operations')
    .addTag('roles', 'Role resource operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Backend started: http://localhost:${port}/trpc`);
  logger.log(`API docs: http://localhost:${port}/api/docs`);
  logger.log(`REST API: http://localhost:${port}/api`);
  logger.log(`Health: http://localhost:${port}/api/health`);
}
bootstrap();
