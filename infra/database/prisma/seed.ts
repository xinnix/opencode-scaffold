import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@opencode/database';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Create Permissions (仅用于 Admin)
  // ============================================
  console.log('Creating permissions...');

  const permissions = await Promise.all([
    // Todo permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'create' } },
      update: {},
      create: { resource: 'todo', action: 'create', description: '创建待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'read' } },
      update: {},
      create: { resource: 'todo', action: 'read', description: '查看待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'update' } },
      update: {},
      create: { resource: 'todo', action: 'update', description: '更新待办' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'todo', action: 'delete' } },
      update: {},
      create: { resource: 'todo', action: 'delete', description: '删除待办' },
    }),

    // User permissions (管理小程序用户)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'create' } },
      update: {},
      create: { resource: 'user', action: 'create', description: '创建用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'read' } },
      update: {},
      create: { resource: 'user', action: 'read', description: '查看用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'update' } },
      update: {},
      create: { resource: 'user', action: 'update', description: '更新用户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'user', action: 'delete' } },
      update: {},
      create: { resource: 'user', action: 'delete', description: '删除用户' },
    }),

    // Admin permissions (管理员管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'create' } },
      update: {},
      create: { resource: 'admin', action: 'create', description: '创建管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'read' } },
      update: {},
      create: { resource: 'admin', action: 'read', description: '查看管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'update' } },
      update: {},
      create: { resource: 'admin', action: 'update', description: '更新管理员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'admin', action: 'delete' } },
      update: {},
      create: { resource: 'admin', action: 'delete', description: '删除管理员' },
    }),

    // Role permissions
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'create' } },
      update: {},
      create: { resource: 'role', action: 'create', description: '创建角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'read' } },
      update: {},
      create: { resource: 'role', action: 'read', description: '查看角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'update' } },
      update: {},
      create: { resource: 'role', action: 'update', description: '更新角色' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'role', action: 'delete' } },
      update: {},
      create: { resource: 'role', action: 'delete', description: '删除角色' },
    }),

    // Menu permissions (菜单可见性权限)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'dashboard' } },
      update: {},
      create: { resource: 'menu', action: 'dashboard', description: '仪表盘菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'merchants' } },
      update: {},
      create: { resource: 'menu', action: 'merchants', description: '商户管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'merchant-categories' } },
      update: {},
      create: { resource: 'menu', action: 'merchant-categories', description: '商户分类菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'coupon-templates' } },
      update: {},
      create: { resource: 'menu', action: 'coupon-templates', description: '券模板管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'orders' } },
      update: {},
      create: { resource: 'menu', action: 'orders', description: '订单管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'settlements' } },
      update: {},
      create: { resource: 'menu', action: 'settlements', description: '结算管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'redemptions' } },
      update: {},
      create: { resource: 'menu', action: 'redemptions', description: '核销记录菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'users' } },
      update: {},
      create: { resource: 'menu', action: 'users', description: '用户管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'news' } },
      update: {},
      create: { resource: 'menu', action: 'news', description: '新闻管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'admins' } },
      update: {},
      create: { resource: 'menu', action: 'admins', description: '管理员管理菜单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'menu', action: 'roles' } },
      update: {},
      create: { resource: 'menu', action: 'roles', description: '角色管理菜单' },
    }),

    // Merchant permissions (商户管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchant', action: 'create' } },
      update: {},
      create: { resource: 'merchant', action: 'create', description: '创建商户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchant', action: 'read' } },
      update: {},
      create: { resource: 'merchant', action: 'read', description: '查看商户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchant', action: 'update' } },
      update: {},
      create: { resource: 'merchant', action: 'update', description: '更新商户' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchant', action: 'delete' } },
      update: {},
      create: { resource: 'merchant', action: 'delete', description: '删除商户' },
    }),

    // MerchantCategory permissions (商户分类管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchantCategory', action: 'create' } },
      update: {},
      create: { resource: 'merchantCategory', action: 'create', description: '创建商户分类' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchantCategory', action: 'read' } },
      update: {},
      create: { resource: 'merchantCategory', action: 'read', description: '查看商户分类' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchantCategory', action: 'update' } },
      update: {},
      create: { resource: 'merchantCategory', action: 'update', description: '更新商户分类' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'merchantCategory', action: 'delete' } },
      update: {},
      create: { resource: 'merchantCategory', action: 'delete', description: '删除商户分类' },
    }),

    // News permissions (新闻管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'news', action: 'create' } },
      update: {},
      create: { resource: 'news', action: 'create', description: '创建新闻' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'news', action: 'read' } },
      update: {},
      create: { resource: 'news', action: 'read', description: '查看新闻' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'news', action: 'update' } },
      update: {},
      create: { resource: 'news', action: 'update', description: '更新新闻' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'news', action: 'delete' } },
      update: {},
      create: { resource: 'news', action: 'delete', description: '删除新闻' },
    }),

    // CouponTemplate permissions (券模板管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'couponTemplate', action: 'create' } },
      update: {},
      create: { resource: 'couponTemplate', action: 'create', description: '创建券模板' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'couponTemplate', action: 'read' } },
      update: {},
      create: { resource: 'couponTemplate', action: 'read', description: '查看券模板' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'couponTemplate', action: 'update' } },
      update: {},
      create: { resource: 'couponTemplate', action: 'update', description: '更新券模板' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'couponTemplate', action: 'delete' } },
      update: {},
      create: { resource: 'couponTemplate', action: 'delete', description: '删除券模板' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'couponTemplate', action: 'adjust_stock' } },
      update: {},
      create: { resource: 'couponTemplate', action: 'adjust_stock', description: '调整券模板库存' },
    }),

    // Order permissions (订单管理 - 管理端)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'order', action: 'read' } },
      update: {},
      create: { resource: 'order', action: 'read', description: '查看订单' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'order', action: 'approve_refund' } },
      update: {},
      create: { resource: 'order', action: 'approve_refund', description: '审批退款' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'order', action: 'reject_refund' } },
      update: {},
      create: { resource: 'order', action: 'reject_refund', description: '拒绝退款' },
    }),

    // Settlement permissions (结算管理)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'settlement', action: 'read' } },
      update: {},
      create: { resource: 'settlement', action: 'read', description: '查看结算' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'settlement', action: 'confirm' } },
      update: {},
      create: { resource: 'settlement', action: 'confirm', description: '确认结算' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'settlement', action: 'mark_paid' } },
      update: {},
      create: { resource: 'settlement', action: 'mark_paid', description: '标记已支付' },
    }),

    // Handler permissions (核销员管理 - 补全)
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'create' } },
      update: {},
      create: { resource: 'handler', action: 'create', description: '创建核销员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'read' } },
      update: {},
      create: { resource: 'handler', action: 'read', description: '查看核销员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'update' } },
      update: {},
      create: { resource: 'handler', action: 'update', description: '更新核销员' },
    }),
    prisma.permission.upsert({
      where: { resource_action: { resource: 'handler', action: 'delete' } },
      update: {},
      create: { resource: 'handler', action: 'delete', description: '删除核销员' },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. Create Roles (仅用于 Admin)
  // ============================================
  console.log('Creating roles...');

  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super_admin' },
    update: {},
    create: {
      name: '超级管理员',
      slug: 'super_admin',
      description: '系统超级管理员，拥有所有权限',
      level: 0,
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: '管理员',
      slug: 'admin',
      description: '系统管理员',
      level: 100,
      isSystem: true,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { slug: 'viewer' },
    update: {},
    create: {
      name: '访客',
      slug: 'viewer',
      description: '只读权限管理员',
      level: 200,
      isSystem: true,
    },
  });

  console.log('✅ Created 3 roles');

  // ============================================
  // 3. Assign Permissions to Roles
  // ============================================
  console.log('Assigning permissions to roles...');

  // Super admin gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin gets most permissions
  const adminPermissions = permissions.filter(
    (p) => !p.action.includes('delete') || p.resource === 'todo',
  );
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Viewer gets only read permissions
  const viewerPermissions = permissions.filter((p) => p.action === 'read');
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Assigned permissions to roles');

  // ============================================
  // 4. Create Demo Admin Users (管理端用户)
  // ============================================
  console.log('Creating demo admin users...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@example.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roles: {
        create: {
          roleId: superAdminRole.id,
        },
      },
    },
  });

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  const viewer = await prisma.admin.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      username: 'viewer',
      email: 'viewer@example.com',
      passwordHash,
      firstName: 'Viewer',
      lastName: 'Admin',
      roles: {
        create: {
          roleId: viewerRole.id,
        },
      },
    },
  });

  console.log('✅ Created 3 demo admin users');

  // ============================================
  // 5. Create Demo Miniapp Users (小程序用户)
  // ============================================
  console.log('Creating demo miniapp users...');

  const miniappUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      email: 'user@example.com',
      passwordHash,
      nickname: '测试用户',
      phone: '13800138000',
    },
  });

  const miniappUser2 = await prisma.user.upsert({
    where: { username: 'user2' },
    update: {},
    create: {
      username: 'user2',
      email: 'user2@example.com',
      passwordHash,
      nickname: '测试用户2',
    },
  });

  console.log('✅ Created 2 demo miniapp users');

  // ============================================
  // 6. Demo Todos (removed — Todo model deleted from schema)
  // ============================================

  // ============================================
  // 7+ Demo data for removed models (merchantCategory, merchant, couponTemplate, etc.)
  // Skipped — these models have been removed from schema.prisma
  // ============================================


  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📱 管理端测试账号 (Admin - password: password123):');
  console.log('  - superadmin@example.com (Super Admin)');
  console.log('  - admin@example.com (Admin)');
  console.log('  - viewer@example.com (Viewer)');
  console.log('');
  console.log('📱 小程序测试账号 (User - password: password123):');
  console.log('  - user@example.com (普通用户)');
  console.log('  - user2@example.com (普通用户2)');
  console.log('');
  console.log('📊 业务数据统计:');
  console.log('  - 5个商户分类');
  console.log('  - 6个商户 (餐饮、零售、娱乐)');
  console.log('  - 4个券模板');
  console.log('  - 5个订单 (多种状态)');
  console.log('  - 3条新闻');
  console.log('  - 4个结算单');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
