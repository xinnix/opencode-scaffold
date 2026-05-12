import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { Public, CurrentUser } from '../decorators/decorators';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';

// 🔥 关键：直接使用 @opencode/shared 的 Zod schema
import {
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
} from '@opencode/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '注册小程序用户' })
  @ApiResponse({
    status: 201,
    description: '用户注册成功',
  })
  async register(@Body() body: typeof RegisterSchema) {
    // ✅ 使用 Zod schema 进行运行时验证
    const validatedData = RegisterSchema.parse(body);

    // 调用业务逻辑
    return this.authService.registerUser(validatedData);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '小程序用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  async login(@Body() body: typeof LoginSchema) {
    // ✅ 运行时验证
    const validatedData = LoginSchema.parse(body);
    return this.authService.loginUser(validatedData);
  }

  @Public()
  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '微信登录' })
  @ApiResponse({
    status: 200,
    description: '微信登录成功',
  })
  async wechatLogin(@Body('code') code: string) {
    return this.authService.loginWithWechat(code);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  async adminLogin(@Body() body: typeof LoginSchema) {
    // ✅ 运行时验证
    const validatedData = LoginSchema.parse(body);
    return this.authService.loginAdmin(validatedData);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
  })
  async refreshToken(@Body() body: typeof RefreshTokenSchema) {
    const validatedData = RefreshTokenSchema.parse(body);
    return this.authService.refreshToken(validatedData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '用户信息',
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
  })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '更新当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '用户信息更新成功',
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
  })
  async updateCurrentUser(
    @CurrentUser() user: any,
    @Body() body: { nickname?: string; avatar?: string },
  ) {
    return this.authService.updateUserProfile(user.id, body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({
    status: 200,
    description: '登出成功',
  })
  async logout(
    @CurrentUser() user: any,
    @Body() body: z.infer<typeof RefreshTokenSchema>,
  ) {
    const validatedData = RefreshTokenSchema.parse(body);
    return this.authService.logout(user.id, validatedData.refreshToken);
  }

}
