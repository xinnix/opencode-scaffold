-- ============================================
-- 1. 创建权限数据
-- ============================================
INSERT INTO permissions (id, resource, action, description)
VALUES
  ('p5', 'user', 'create', '创建用户'),
  ('p6', 'user', 'read', '查看用户'),
  ('p7', 'user', 'update', '更新用户'),
  ('p8', 'user', 'delete', '删除用户'),
  ('p9', 'admin', 'create', '创建管理员'),
  ('p10', 'admin', 'read', '查看管理员'),
  ('p11', 'admin', 'update', '更新管理员'),
  ('p12', 'admin', 'delete', '删除管理员'),
  ('p13', 'role', 'create', '创建角色'),
  ('p14', 'role', 'read', '查看角色'),
  ('p15', 'role', 'update', '更新角色'),
  ('p16', 'role', 'delete', '删除角色')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================
-- 2. 创建角色数据
-- ============================================
INSERT INTO roles (id, name, slug, description, level, "isSystem", "createdAt", "updatedAt")
VALUES
  ('r1', '超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 0, true, NOW(), NOW()),
  ('r2', '管理员', 'admin', '系统管理员', 100, true, NOW(), NOW()),
  ('r3', '访客', 'viewer', '只读权限管理员', 200, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. 分配权限给角色
-- ============================================
-- 超级管理员拥有所有权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r1', 'r1', permissions.id, NOW() FROM permissions
ON CONFLICT DO NOTHING;

-- 管理员拥有大部分权限（非删除权限）
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r2', 'r2', permissions.id, NOW() FROM permissions
WHERE action != 'delete'
ON CONFLICT DO NOTHING;

-- 访客只有读权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r3', 'r3', permissions.id, NOW() FROM permissions WHERE action = 'read'
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 创建管理员用户
-- ============================================
-- 密码: password123 (bcrypt hash)
INSERT INTO admins (id, username, email, "passwordHash", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES
  ('a1', 'superadmin', 'superadmin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Super', 'Admin', true, NOW(), NOW()),
  ('a2', 'admin', 'admin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Admin', 'User', true, NOW(), NOW()),
  ('a3', 'viewer', 'viewer@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Viewer', 'Admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 分配角色给管理员
INSERT INTO admin_roles (id, "adminId", "roleId", "assignedAt")
VALUES
  ('ar1', 'a1', 'r1', NOW()),
  ('ar2', 'a2', 'r2', NOW()),
  ('ar3', 'a3', 'r3', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 创建小程序用户
-- ============================================
INSERT INTO users (id, username, email, "passwordHash", nickname, phone, "isActive", "createdAt", "updatedAt")
VALUES
  ('u1', 'user', 'user@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户', '13800138000', true, NOW(), NOW()),
  ('u2', 'user2', 'user2@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户2', NULL, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
