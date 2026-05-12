import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { FileStorageService } from "../shared/services/file-storage.service";
import jwt from "jsonwebtoken";
import { INestApplication } from "@nestjs/common";

// Global service references
let prismaServiceInstance: PrismaService | null = null;
let fileStorageServiceInstance: FileStorageService | null = null;
let appInstance: INestApplication | null = null;

export const setPrismaService = (prisma: PrismaService) => {
  prismaServiceInstance = prisma;
};

export const setFileStorageService = (fileStorage: FileStorageService) => {
  fileStorageServiceInstance = fileStorage;
};

export const setAppInstance = (app: INestApplication) => {
  appInstance = app;
};

// User interface for context
export interface User {
  id: string;
  email: string;
  username?: string;
  permissions: string[];
  roles: any[];
}

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Extract and verify JWT token from Authorization header
 * Returns user object if token is valid, null otherwise
 */
async function verifyJwtToken(req: any, prisma: PrismaService): Promise<User | null> {
  try {
    // Extract Authorization header
    const authHeader = req?.headers?.authorization || req?.req?.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Fetch admin from database with roles and permissions
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    // Flatten permissions
    const permissions = admin.roles?.flatMap((ar: any) =>
      ar.role.permissions?.map((rp: any) =>
        `${rp.permission.resource}:${rp.permission.action}`,
      ),
    ) || [];

    return {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      permissions,
      roles: admin.roles?.map((ar: any) => ar.role) || [],
    };
  } catch (error) {
    // Token is invalid or expired
    if (error instanceof jwt.JsonWebTokenError) {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

// Create context with optional user (from JWT verification)
export const createContext = async (opts: any) => {
  const prisma = prismaServiceInstance || opts?.prisma;
  const fileStorage = fileStorageServiceInstance || opts?.fileStorage;
  const app = appInstance || opts?.app;
  const req = opts?.req;

  // Verify JWT token and get user
  let user: User | null = null;
  if (prisma && req) {
    user = await verifyJwtToken(req, prisma);
  }

  return {
    prisma,
    fileStorage,
    app,
    req,
    res: opts?.res,
    user,
  };
};

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
// JWT token is verified in createContext, ctx.user will be null if no valid token
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please provide a valid JWT token.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Permission procedure - requires specific permission
export const permissionProcedure = (resource: string, action: string) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const permissionString = `${resource}:${action}`;

    // Get user permissions from context
    const userPermissions: string[] = ctx.user?.permissions || [];

    // Super admin has all permissions
    // Note: ctx.user.roles is an array of Role objects (from verifyJwtToken)
    const hasSuperAdminRole = ctx.user?.roles?.some((r: any) => r?.slug === 'super_admin') || false;

    if (!hasSuperAdminRole && !userPermissions.includes(permissionString)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing permission: ${permissionString}`,
      });
    }

    return next();
  });

// Export permission helpers for use in routers
export { hasPermission, hasSuperAdminRole, hasAdminRole } from '../shared/permissions';

// Re-export CRUD helpers from trpc.helper
export {
  createCrudRouter,
  createReadOnlyRouter,
  createCrudRouterWithCustom,
  type CrudRouterOptions,
} from './trpc.helper';

// BaseService can still be used for REST controllers or custom services
export { BaseService } from '../common/base.service';
