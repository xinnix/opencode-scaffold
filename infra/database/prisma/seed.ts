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
    where: { email: 'user@example.com' },
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
    where: { email: 'user2@example.com' },
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
  // 6. Create Demo Todos (关联到小程序用户)
  // ============================================
  console.log('Creating demo todos...');

  await prisma.todo.createMany({
    data: [
      {
        title: '学习 NestJS',
        description: '完成 NestJS 官方教程',
        priority: 1,
        userId: miniappUser.id,
      },
      {
        title: '学习 tRPC',
        description: '理解 tRPC 的基本概念和用法',
        priority: 2,
        userId: miniappUser.id,
      },
      {
        title: '学习 Prisma',
        description: '掌握 Prisma ORM 的基本操作',
        priority: 3,
        isCompleted: true,
        userId: miniappUser.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 3 demo todos');

  // ============================================
  // 7. Create Merchant Categories
  // ============================================
  console.log('Creating merchant categories...');

  const categories = await Promise.all([
    prisma.merchantCategory.upsert({
      where: { slug: 'restaurant' },
      update: {},
      create: {
        name: '餐饮',
        slug: 'restaurant',
        description: '餐饮美食类商户',
        sortOrder: 1,
        status: 'ACTIVE',
      },
    }),
    prisma.merchantCategory.upsert({
      where: { slug: 'retail' },
      update: {},
      create: {
        name: '零售',
        slug: 'retail',
        description: '零售百货类商户',
        sortOrder: 2,
        status: 'ACTIVE',
      },
    }),
    prisma.merchantCategory.upsert({
      where: { slug: 'entertainment' },
      update: {},
      create: {
        name: '娱乐',
        slug: 'entertainment',
        description: '休闲娱乐类商户',
        sortOrder: 3,
        status: 'ACTIVE',
      },
    }),
    prisma.merchantCategory.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: {
        name: '美容',
        slug: 'beauty',
        description: '美容美发服务类商户',
        sortOrder: 4,
        status: 'ACTIVE',
      },
    }),
    prisma.merchantCategory.upsert({
      where: { slug: 'services' },
      update: {},
      create: {
        name: '生活服务',
        slug: 'services',
        description: '生活服务类商户',
        sortOrder: 5,
        status: 'ACTIVE',
      },
    }),
  ]);

  const restaurantCategory = categories.find((c) => c.slug === 'restaurant')!;
  const retailCategory = categories.find((c) => c.slug === 'retail')!;
  const entertainmentCategory = categories.find((c) => c.slug === 'entertainment')!;

  console.log(`✅ Created ${categories.length} merchant categories`);

  // ============================================
  // 8. Create Demo Merchants
  // ============================================
  console.log('Creating demo merchants...');

  const merchants = await prisma.merchant.createMany({
    data: [
      {
        name: '海底捞火锅',
        categoryId: restaurantCategory.id,
        area: 'A区',
        floor: '3F',
        phone: '021-12345678',
        gallery: ['https://example.com/haidilao1.jpg', 'https://example.com/haidilao2.jpg'],
        description: '知名火锅连锁品牌，提供优质服务',
        status: 'ACTIVE',
      },
      {
        name: '星巴克咖啡',
        categoryId: restaurantCategory.id,
        area: 'A区',
        floor: '1F',
        phone: '021-23456789',
        gallery: ['https://example.com/starbucks1.jpg'],
        description: '全球知名咖啡品牌',
        status: 'ACTIVE',
      },
      {
        name: '优衣库',
        categoryId: retailCategory.id,
        area: 'B区',
        floor: '2F',
        phone: '021-34567890',
        gallery: ['https://example.com/uniqlo1.jpg'],
        description: '日本知名服装品牌',
        status: 'ACTIVE',
      },
      {
        name: '万达影城',
        categoryId: entertainmentCategory.id,
        area: 'C区',
        floor: '5F',
        phone: '021-45678901',
        gallery: ['https://example.com/wanda1.jpg'],
        description: 'IMAX激光影院',
        status: 'ACTIVE',
      },
      {
        name: '肯德基',
        categoryId: restaurantCategory.id,
        area: 'B区',
        floor: '1F',
        phone: '021-56789012',
        gallery: ['https://example.com/kfc1.jpg'],
        description: '全球连锁快餐品牌',
        status: 'ACTIVE',
      },
      {
        name: '耐克',
        categoryId: retailCategory.id,
        area: 'C区',
        floor: '3F',
        phone: '021-67890123',
        gallery: ['https://example.com/nike1.jpg'],
        description: '运动服装品牌',
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${merchants.count || 6} demo merchants`);

  // 获取刚创建的商户
  const allMerchants = await prisma.merchant.findMany();
  const merchant1 = allMerchants.find((m) => m.name === '海底捞火锅')!;
  const merchant2 = allMerchants.find((m) => m.name === '星巴克咖啡')!;
  const merchant3 = allMerchants.find((m) => m.name === '万达影城')!;

  // ============================================
  // 9. Create Demo Coupon Templates
  // ============================================
  console.log('Creating demo coupon templates...');

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  await prisma.couponTemplate.createMany({
    data: [
      {
        title: '50元代100元火锅券',
        buyPrice: 50,
        faceValue: 100,
        stock: 1000,
        merchantScope: [merchant1.id],
        saleFrom: now,
        saleUntil: nextMonth,
        useFrom: now,
        useUntil: nextMonth,
        description: '适用于海底捞火锅全场消费，每人每次限用2张',
        status: 'ACTIVE',
      },
      {
        title: '星巴克30元饮品券',
        buyPrice: 25,
        faceValue: 30,
        stock: 500,
        merchantScope: [merchant2.id],
        saleFrom: now,
        saleUntil: nextYear,
        useFrom: now,
        useUntil: nextYear,
        description: '适用于星巴克全场饮品，不限时段',
        status: 'ACTIVE',
      },
      {
        title: '9.9元观影特惠券',
        buyPrice: 9.9,
        faceValue: 50,
        stock: 2000,
        merchantScope: [merchant3.id],
        saleFrom: now,
        saleUntil: nextMonth,
        useFrom: now,
        useUntil: nextMonth,
        description: '万达影城2D/3D通用，节假日可用',
        status: 'ACTIVE',
      },
      {
        title: '100元美食通用券',
        buyPrice: 80,
        faceValue: 100,
        stock: 300,
        merchantScope: [merchant1.id, merchant2.id],
        saleFrom: now,
        saleUntil: nextMonth,
        useFrom: now,
        useUntil: nextMonth,
        description: '适用于所有餐饮类商户',
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 4 demo coupon templates');

  // 获取刚创建的券模板
  const allTemplates = await prisma.couponTemplate.findMany();
  const template1 = allTemplates.find((t) => t.title.includes('火锅'))!;
  const template2 = allTemplates.find(
    (t) => t.title.includes('星巴克') || t.title.includes('饮品'),
  )!;
  const template3 = allTemplates.find((t) => t.title.includes('观影') || t.title.includes('9.9'))!;
  const template4 = allTemplates.find((t) => t.title.includes('通用'))!;

  // ============================================
  // 10. Create Demo Orders
  // ============================================
  console.log('Creating demo orders...');

  const generateOrderNo = (index: number) => `20240326000${index}`;

  await prisma.order.createMany({
    data: [
      {
        orderNo: generateOrderNo(1),
        userId: miniappUser.id,
        templateId: template1.id,
        status: 'PAID',
        payId: 'WX' + Date.now() + '1',
        paidAt: new Date(Date.now() - 86400000), // 1天前
        redeemMerchantId: merchant1.id,
        redeemedAt: new Date(Date.now() - 3600000), // 1小时前
        price: 50,
        faceValue: 100,
      },
      {
        orderNo: generateOrderNo(2),
        userId: miniappUser.id,
        templateId: template2.id,
        status: 'PAID',
        payId: 'WX' + Date.now() + '2',
        paidAt: new Date(Date.now() - 172800000), // 2天前
        price: 25,
        faceValue: 30,
      },
      {
        orderNo: generateOrderNo(3),
        userId: miniappUser.id,
        templateId: template3.id,
        status: 'REDEEMED',
        payId: 'WX' + Date.now() + '3',
        paidAt: new Date(Date.now() - 259200000), // 3天前
        redeemMerchantId: merchant3.id,
        redeemedAt: new Date(Date.now() - 86400000), // 1天前
        price: 9.9,
        faceValue: 50,
      },
      {
        orderNo: generateOrderNo(4),
        userId: miniappUser2.id,
        templateId: template1.id,
        status: 'UNPAID',
        price: 50,
        faceValue: 100,
      },
      {
        orderNo: generateOrderNo(5),
        userId: miniappUser2.id,
        templateId: template4.id,
        status: 'REFUNDED',
        payId: 'WX' + Date.now() + '5',
        paidAt: new Date(Date.now() - 432000000), // 5天前
        refundId: 'REFUND' + Date.now(),
        refundReason: '不想使用了',
        refundedAt: new Date(Date.now() - 345600000), // 4天前
        price: 80,
        faceValue: 100,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 5 demo orders');

  // ============================================
  // 11. Create Demo News
  // ============================================
  console.log('Creating demo news...');

  await prisma.news.createMany({
    data: [
      {
        title: '春季美食节盛大开幕',
        bannerUrl: 'https://example.com/news1.jpg',
        content:
          '<p>春季美食节活动火热进行中！</p><p>参与商户：海底捞、星巴克、肯德基等</p><p>活动时间：2024年3月1日-3月31日</p>',
        viewCount: 1523,
        status: 'PUBLISHED',
      },
      {
        title: '新商户入驻：耐克旗舰店',
        bannerUrl: 'https://example.com/news2.jpg',
        content: '<p>欢迎耐克旗舰店盛大开业！</p><p>开业期间全场8折优惠</p><p>地址：商场3F</p>',
        viewCount: 856,
        status: 'PUBLISHED',
      },
      {
        title: '五一劳动节促销活动预告',
        bannerUrl: 'https://example.com/news3.jpg',
        content: '<p>五一劳动节即将到来，更多精彩活动敬请期待！</p>',
        viewCount: 342,
        status: 'DRAFT',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 3 demo news');

  // ============================================
  // 12. Create Demo Settlements
  // ============================================
  console.log('Creating demo settlements...');

  await prisma.settlement.createMany({
    data: [
      {
        merchantId: merchant1.id,
        period: '2024-02',
        totalAmount: 15000,
        orderCount: 300,
        status: 'PAID',
        snapshotData: { orders: [] },
        confirmedAt: new Date('2024-03-05'),
        confirmedBy: 'superadmin@example.com',
        paidAt: new Date('2024-03-10'),
      },
      {
        merchantId: merchant2.id,
        period: '2024-02',
        totalAmount: 8500,
        orderCount: 340,
        status: 'PAID',
        snapshotData: { orders: [] },
        confirmedAt: new Date('2024-03-05'),
        confirmedBy: 'admin@example.com',
        paidAt: new Date('2024-03-10'),
      },
      {
        merchantId: merchant3.id,
        period: '2024-02',
        totalAmount: 22000,
        orderCount: 2200,
        status: 'CONFIRMED',
        snapshotData: { orders: [] },
        confirmedAt: new Date('2024-03-05'),
        confirmedBy: 'superadmin@example.com',
      },
      {
        merchantId: merchant1.id,
        period: '2024-03',
        totalAmount: 18000,
        orderCount: 360,
        status: 'PENDING',
        snapshotData: { orders: [] },
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created 4 demo settlements');

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
