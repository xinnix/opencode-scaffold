# 小程序首页数据接入完成

## 🎯 头图区域（Hero Section）

### 功能说明

✅ **已接入新闻中 isHero 为 true 的数据**

**实现逻辑：**

1. 从新闻 API 获取所有已发布的新闻
2. 筛选 `isHero: true` 的新闻作为头图展示
3. 其余新闻作为普通新闻列表展示
4. 如果没有 Hero 新闻，显示默认图片

**数据结构：**

```typescript
heroNews: [
  {
    id: string,
    title: string,
    image: string, // bannerUrl
    tag: string, // 'Featured Event'
  },
];
```

**展示方式：**

- 显示第一条 Hero 新闻的图片
- 叠加渐变遮罩层
- 底部显示标题和标签
- 支持未来扩展为轮播

**后端配置：**

- 在管理后台设置新闻的 `isHero` 字段为 `true`
- 可设置多条 Hero 新闻
- API 自动返回 `isHero` 字段

---

## 🎨 UI 优化

### 标题布局优化

✅ **已改为上下分布，中文在上，英文在下，靠左对齐**

**示例：**

```
汉都天地 · 严选
Selected Stores
```

**改动位置：**

1. 顶部标题（汉都天地 / HD HUB）
2. 优惠券区块（抢购超值券 / Limited Offer）
3. 商户区块（汉都天地 · 严选 / Selected Stores）
4. 新闻区块（商场快讯 / Latest News）

### 商户区域标签优化

✅ **已改为现代标签样式**

**功能改进：**

- ✅ 添加"全部"选项（默认选中）
- ✅ 选择"全部"时显示所有商户
- ✅ 按区域筛选商户

**样式优化：**

- ✅ 缩小标签尺寸（padding: 6rpx 20rpx）
- ✅ 缩小文字大小（font-size: 22rpx）
- ✅ 标签间距：8rpx（通过 margin 实现）
- ✅ 圆角设计（border-radius: 24rpx）
- ✅ 主题色激活状态（#00aeef）
- ✅ 柔和阴影效果
- ✅ 平滑过渡动画

**样式特性：**

- 激活：主题色背景（#00aeef）+ 白色文字 + 阴影
- 未激活：白色背景 + 灰色文字 + 淡边框
- 最小宽度：72rpx
- 标签间距：8rpx margin（首尾无间距）

**交互体验：**

- 点击反馈动画
- 选中状态放大效果（scale: 1.02）
- 未选中状态点击缩小效果（scale: 0.95）

### 优惠券卡片优化

✅ **已优化卡片尺寸和间距**

**改进内容：**

- ✅ 卡片宽度：260rpx（响应式尺寸，可显示两个半）
- ✅ 卡片间距：32rpx（gap-4）
- ✅ 圆角设计：rounded-xl（更圆润）
- ✅ 左侧彩条：蓝色标识 + 圆角
- ✅ 背景模糊：backdrop-filter blur(20rpx)
- ✅ 边框：2rpx solid
- ✅ 文字优化：
  - 价格文字更大（text-2xl）
  - 描述文字换行支持
  - 按钮文字更清晰（text-xs）

**布局计算：**

- 页面宽度：750rpx
- 左右内边距：24rpx（px-6）
- 可用宽度：726rpx
- 两个半卡片：260rpx × 2.5 + 32rpx × 2.5 = 730rpx
- 用户可看到 2.5 张卡片，引导滑动查看更多

**视觉效果：**

- 紧凑的卡片设计
- 清晰的卡片间距
- 现代的毛玻璃效果
- 柔和的阴影
- 平滑的点击反馈

### 长度单位优化

✅ **已将自定义样式中的 px 改为 rpx**

**转换规则：**

- 1px ≈ 2rpx（小程序响应式单位）
- 阴影效果：4px → 8rpx，16px → 32rpx
- 卡片宽度：140px → 280rpx
- 区域标签：padding 5px 14px → 10rpx 28rpx
- 最小宽度：48px → 96rpx
- 边框：1px → 2rpx
- 字体大小：12px → 24rpx

**优势：**

- 更好的响应式适配
- 自动适应不同屏幕尺寸
- 保持设计一致性

---

## 🐛 已知问题修复

### 新闻图片不显示问题

**问题原因：**

1. 使用了 `aspect-ratio` CSS 属性，部分环境不支持
2. 图片容器样式问题

**解决方案：**
✅ 已改用 `padding-bottom` 方式实现 4:3 比例
✅ 添加了背景色占位（`bg-gray-100`）
✅ 添加了图片懒加载
✅ 添加了图片加载事件监听和错误处理

**调试方法：**

1. 打开浏览器控制台（F12）
2. 查看是否有图片加载错误日志
3. 访问测试页面：http://localhost:5174/test-images.html
4. 检查网络面板，查看图片请求状态

---

## 📋 改动概述

已成功将小程序首页接入真实后端数据，包括：

- ✅ 商户列表（按区域筛选）
- ✅ 新闻资讯（已发布状态）
- ✅ 优惠券模板（有效状态）

## 🔄 主要改动

### 1. 数据接口集成（`apps/miniapp/src/pages/index.vue`）

```typescript
import { merchantApi, newsApi, couponApi } from '@/api/business';

// 并行加载三个接口数据
const [merchantsRes, newsRes, couponsRes] = await Promise.all([
  merchantApi.getList({ limit: 20, status: 'ACTIVE' }),
  newsApi.getList({ limit: 4, status: 'PUBLISHED' }),
  couponApi.getList({ limit: 10, status: 'ACTIVE' }),
]);
```

### 2. 数据格式适配

**商户数据映射：**

```typescript
{
  id: m.id,
  name: m.name,
  desc: m.description || m.category,
  image: m.logo || `https://picsum.photos/seed/${m.id}/200/200`,
  area: m.area || 'A区',  // 适配后端 "A区"、"B区"、"C区" 格式
}
```

**新闻数据映射：**

```typescript
{
  id: n.id,
  title: n.title,
  date: new Date(n.createdAt).toLocaleDateString('zh-CN'),
  tag: n.status === 'PUBLISHED' ? '公告' : '活动',
  image: n.bannerUrl || `https://picsum.photos/seed/${n.id}/400/300`,
}
```

**优惠券数据映射：**

```typescript
{
  id: c.id,
  price: Number(c.buyPrice),
  value: Number(c.faceValue),
  desc: c.description || `${c.title}\n限时抢购`,
}
```

### 3. 用户体验优化

- ✅ 添加下拉刷新功能
- ✅ 添加加载状态提示
- ✅ 错误处理和用户提示
- ✅ 区域筛选逻辑优化

## 🚀 测试方法

### 1. 启动服务

```bash
# 启动后端 API（端口 3000）
pnpm --filter @opencode/api dev

# 启动小程序 H5（端口 5174）
pnpm --filter @opencode/miniapp dev
```

### 2. 访问测试

浏览器访问：http://localhost:5174/

### 3. API 测试

```bash
# 测试商户接口
curl "http://localhost:3000/api/merchants?limit=5&status=ACTIVE"

# 测试新闻接口
curl "http://localhost:3000/api/news?limit=4&status=PUBLISHED"

# 测试优惠券接口
curl "http://localhost:3000/api/coupon-templates?limit=10&status=ACTIVE"
```

## 📊 数据示例

### 商户数据

```json
{
  "id": "cm1",
  "name": "海底捞火锅",
  "logo": null,
  "category": "餐饮",
  "area": "A区",
  "floor": "3F",
  "description": "知名火锅连锁品牌，提供优质服务",
  "status": "ACTIVE"
}
```

### 新闻数据

```json
{
  "id": "cmnfkyjoe0001hmqdb2xma94u",
  "title": "大叔大婶",
  "bannerUrl": "https://feedbackhub.oss-cn-zhangjiakou.aliyuncs.com/...",
  "status": "PUBLISHED",
  "createdAt": "2026-04-01T05:03:20.606Z"
}
```

### 优惠券数据

```json
{
  "id": "cmnfea6r70004dgqdv6yyk3xi",
  "title": "30 元代 50 元餐饮卷",
  "buyPrice": "30",
  "faceValue": "50",
  "stock": 100,
  "status": "ACTIVE",
  "validFrom": "2026-03-31T16:00:00.000Z",
  "validUntil": "2026-04-29T16:00:00.000Z"
}
```

## 🎯 功能清单

- [x] 商户列表展示
- [x] 区域筛选（A区/B区/C区）
- [x] 新闻资讯展示
- [x] 优惠券列表展示
- [x] 下拉刷新
- [x] 加载状态
- [x] 错误处理

## 🔧 后续优化建议

1. **图片优化**
   - 添加图片懒加载
   - 使用缩略图接口

2. **缓存策略**
   - 实现数据缓存，减少请求
   - 添加过期时间控制

3. **分页加载**
   - 商户列表分页
   - 滚动加载更多

4. **搜索功能**
   - 实现商户搜索
   - 添加搜索历史

5. **性能优化**
   - 骨架屏加载
   - 图片预加载

## 📝 注意事项

1. **区域字段格式**
   - 后端返回 "A区"、"B区"、"C区"
   - 前端已适配该格式

2. **数据状态筛选**
   - 商户：`status=ACTIVE`
   - 新闻：`status=PUBLISHED`
   - 优惠券：`status=ACTIVE`

3. **默认图片**
   - 商户无 logo 时使用 picsum.photos 占位图
   - 新闻无 banner 时使用 picsum.photos 占位图

## ✅ 完成标记

数据接入已完成，可以正常使用。如有问题请检查：

1. 后端服务是否正常启动
2. 数据库是否有测试数据
3. 浏览器控制台是否有错误信息
