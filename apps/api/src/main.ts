// apps/api/src/main.ts
import dotenv from "dotenv";
import path from "path";

// Load .env from apps/api directory
dotenv.config();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./core/filters/http-exception.filter";

import { PrismaService } from "./prisma/prisma.service";
import { FileStorageService } from "./shared/services/file-storage.service";
import { appRouter } from "./trpc/app.router";
import { createContext, setPrismaService, setFileStorageService, setAppInstance } from "./trpc/trpc";
import * as trpcExpress from "@trpc/server/adapters/express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import express from "express";
import { json } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  const corsOrigin = process.env.CORS_ORIGIN || "*";

  app.enableCors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(","),
  });

  // 捕获 raw body 用于微信支付/退款回调验签
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        if (req.url?.includes("/payments/wechat/callback") ||
            req.url?.includes("/payments/wechat/refund-callback")) {
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
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up tRPC middleware
  const prismaService = app.get(PrismaService);
  setPrismaService(prismaService);

  const fileStorageService = app.get(FileStorageService);
  setFileStorageService(fileStorageService);

  setAppInstance(app);

  (app as any).use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: (opts) => createContext(opts),
      onError({ error, path }) {
        console.error(`tRPC Error on path '${path}':`, error);
      },
    })
  );

  // Set up Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle("OpenCode API")
    .setDescription("Full-stack monorepo with NestJS, tRPC, and Prisma")
    .setVersion("1.0")
    .addTag("todos", "Todo resource operations")
    .addTag("users", "User resource operations")
    .addTag("roles", "Role resource operations")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(port);
  console.log(`🚀 后端已启动: http://localhost:${port}/trpc`);
  console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
  console.log(`🔌 REST API: http://localhost:${port}/api`);
}
bootstrap();
