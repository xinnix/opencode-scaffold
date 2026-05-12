// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";

// 基础模块
import { AuthModule } from "./modules/auth/module";
import { UserModule } from "./modules/user/module";
import { RoleModule } from "./modules/role/module";
import { PermissionModule } from "./modules/permission/module";
import { UploadModule } from "./modules/upload/module";
import { WechatModule } from "./modules/wechat/wechat.module";
import { PaymentModule } from "./modules/payment/module";
import { AgentsModule } from "./modules/agents/agents.module";

// 全局过滤器/拦截器
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./core/filters/http-exception.filter";
import { TransformInterceptor } from "./core/interceptors/transform.interceptor";
import { FileStorageService } from "./shared/services/file-storage.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../.env"],
    }),
    // 数据库模块（全局，必须在最前）
    PrismaModule,
    // 基础模块
    AuthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    UploadModule,
    WechatModule,
    PaymentModule,
    AgentsModule,
  ],
  providers: [
    Reflector,
    FileStorageService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
