# 全局 Loading 使用指南

## 功能特性

✅ **定制化设计**：渐变背景 + Logo 动画 + 进度条
✅ **最小显示时间**：至少显示 500ms，避免闪烁
✅ **并发请求支持**：多个请求同时进行时，loading 不会提前消失
✅ **自动异常处理**：请求失败时自动隐藏 loading
✅ **可配置**：支持自定义文案和关闭 loading

---

## 使用方式

### 1. 默认使用（自动显示 loading）

```typescript
import { http } from '@/utils/http'

// 显示 "加载中..."
http.get('/api/coupons')

// 自定义 loading 文案
http.post('/api/order', data, { loadingText: '提交订单中...' })
```

### 2. 静默请求（不显示 loading）

适用于轮询、后台刷新等场景：

```typescript
// 不显示 loading
http.get('/api/status', null, { showLoading: false })
```

### 3. 手动控制 Loading

适用于特殊场景（如文件上传进度）：

```typescript
import { showLoading, hideLoading } from '@/stores/loading'

// 手动显示
showLoading('上传文件中...')

// 手动隐藏（会在至少 500ms 后隐藏）
hideLoading()
```

---

## 设计亮点

### 视觉效果

- 🎨 **渐变背景**：紫色渐变 + 毛玻璃效果
- 🎯 **Logo 动画**：浮动 + 脉冲效果
- ⚡ **进度条**：流动的加载进度条
- 🎭 **淡入淡出**：平滑的显示/隐藏动画

### 技术特性

- **最小显示时间**：500ms 保护机制
- **计数器机制**：支持并发请求
- **防触摸穿透**：全屏遮罩层
- **响应式状态**：Vue 3 reactive

---

## 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showLoading` | boolean | true | 是否显示 loading |
| `loadingText` | string | '加载中...' | Loading 文案 |

---

## 最小显示时间机制

为避免快速请求导致的 loading 闪烁，系统会保证 loading 至少显示 500ms：

```
请求开始 → 立即显示 loading
请求结束（< 500ms） → 延迟隐藏，保证显示时长
请求结束（> 500ms） → 立即隐藏
```

---

## 注意事项

1. **所有网络请求默认显示 loading**，如需关闭请设置 `showLoading: false`
2. **并发请求场景**：loading 会等所有请求完成才隐藏
3. **App.vue 必须引入 GlobalLoading 组件**（已自动配置）