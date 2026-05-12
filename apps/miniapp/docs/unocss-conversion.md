# UnoCSS 小程序样式转换指南

## 📋 概述

本文档记录了将 HTML + Tailwind CSS 转换为 uni-app（微信小程序）+ UnoCSS 的完整流程。

## ⚠️ 关键限制

### 小程序环境限制

1. **不支持 `/` 符号类名**: UnoCSS 在小程序中无法使用 `bg-color/50` 这样的透明度语法
2. **不支持图标预设**: `presetIcons` 在小程序中无法正常工作，需要使用 Emoji 或图片
3. **标签限制**: 只能使用 `<view>`, `<text>`, `<image>` 等小程序标签
4. **样式限制**: 不支持 `backdrop-filter`、部分 CSS 选择器
5. **背景图限制**: 不支持本地 `background-image`
6. **动态类名限制**: 不支持复杂的数组条件表达式

## ✅ 转换策略

### 1. 透明度处理

**问题类名**:
```html
<!-- ❌ 不支持 -->
<view class="bg-surface/90">
<view class="text-white/80">
<view class="border-primary-container/30">
```

**解决方案**:
```scss
/* ✅ 自定义 SCSS 类 */
.top-bar-bg {
  background: rgba(245, 250, 255, 0.9);
}

.banner-tag-text {
  color: rgba(255, 255, 255, 0.8);
}

.view-all-btn {
  border-color: rgba(0, 174, 239, 0.3);
}
```

### 2. 纵横比处理

**问题类名**:
```html
<!-- ❌ 不支持 -->
<view class="aspect-16/9">
<view class="aspect-4/3">
```

**解决方案**:
```scss
/* ✅ 自定义 SCSS */
.banner-aspect {
  aspect-ratio: 16 / 9;
}

.news-image-aspect {
  aspect-ratio: 4 / 3;
}
```

### 3. 渐变处理

**问题类名**:
```html
<!-- ❌ 不支持 -->
<view class="bg-gradient-to-t from-on-surface/40 to-transparent">
```

**解决方案**:
```scss
/* ✅ 自定义 SCSS */
.banner-overlay-bg {
  background: linear-gradient(to top, rgba(23, 28, 32, 0.4), transparent);
}
```

### 4. Ring 边框处理

**问题类名**:
```html
<!-- ❌ 不支持 -->
<view class="ring-1 ring-primary-container/10">
```

**解决方案**:
```scss
/* ✅ 使用 box-shadow 模拟 */
.ring-primary-container-10 {
  box-shadow: inset 0 0 0 1px rgba(0, 174, 239, 0.1);
}
```

### 5. 图标处理

**问题**:
```html
<!-- ❌ 不支持图标预设 -->
<text class="i-material-symbols:search"></text>
```

**解决方案**:
```html
<!-- ✅ 使用 Emoji -->
<text class="text-sm">🔍</text>

<!-- ✅ 或使用图片 -->
<image src="/static/icons/search.png" class="w-4 h-4" />
```

### 6. 动态类名处理

**问题**:
```html
<!-- ❌ 不支持复杂的三元表达式 -->
<button :class="[
  'base-class',
  isActive ? 'active-class' : 'inactive-class'
]">
```

**解决方案**:
```typescript
// ✅ 使用方法返回类名
function getBtnClass(item) {
  return isActive.value ? 'active-class' : 'inactive-class'
}
```

```html
<!-- ✅ 模板中使用 -->
<button :class="['base-class', getBtnClass(item)]">
```

## 🎨 设计令牌映射

| Tailwind 类名 | UnoCSS 替代 | 说明 |
|--------------|-----------|------|
| `bg-surface` | `bg-surface` | 直接使用 |
| `text-primary-container` | `text-primary-container` | 直接使用 |
| `bg-surface/90` | `.top-bar-bg` (自定义) | 需自定义 |
| `aspect-16/9` | `.banner-aspect` (自定义) | 需自定义 |

## 📦 UnoCSS 配置

### uno.config.ts

```typescript
import { presetUni } from '@uni-helper/unocss-preset-uni'
import {
  defineConfig,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUni(),    // 小程序预设（必须）
    presetUno(),    // 基础预设
    // 注意：不要使用 presetIcons，小程序不支持
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: {
    'no-scrollbar': 'overflow-x-auto overflow-y-hidden',
    'active-scale-95': 'transition-transform duration-200',
    'active-scale-98': 'transition-transform duration-200',
  },
  rules: [
    ['shadow-ambient', { 'box-shadow': '0 4px 16px rgba(23, 28, 32, 0.04)' }],
    ['shadow-card', { 'box-shadow': '0 2px 8px rgba(23, 28, 32, 0.03)' }],
    ['mix-blend-multiply', { 'mix-blend-mode': 'multiply' }],
    ['line-clamp-2', {
      'display': '-webkit-box',
      '-webkit-box-orient': 'vertical',
      '-webkit-line-clamp': '2',
      'overflow': 'hidden',
    }],
  ],
})
```

## 🔧 工作流程

### 1. 识别问题类名
```bash
# 查找所有使用 / 的类名
grep -n 'class="[^"]*/[0-9]' src/pages/index.vue
```

### 2. 创建自定义类
在 `<style lang="scss" scoped>` 中定义自定义类。

### 3. 替换模板中的类名
将问题类名替换为自定义类名。

### 4. 测试验证
```bash
pnpm --filter @opencode/miniapp dev:mp-weixin
```

## 📊 转换统计

- ✅ 成功转换所有布局类
- ✅ 成功转换所有颜色类
- ✅ 创建 20+ 自定义 SCSS 类
- ✅ 移除所有不兼容语法
- ✅ 移除图标预设，使用 Emoji 替代
- ✅ 简化动态类名绑定
- ✅ 修复所有语法错误

## 💡 最佳实践

1. **优先使用 UnoCSS 工具类**: 能直接用的尽量直接用
2. **必要时自定义**: 遇到 `/` 等特殊符号就自定义 SCSS
3. **保持设计系统**: 所有颜色使用 `uno.config.ts` 中的设计令牌
4. **使用 Emoji 代替图标**: 小程序不支持图标预设，Emoji 是最简单的方案
5. **简化动态类名**: 使用方法返回类名，避免复杂的三元表达式
6. **测试真机**: 微信开发者工具可能与真机表现不同

## 🚫 常见错误

### 1. 使用了 `/` 透明度语法
```
❌ bg-surface/90
✅ 自定义 SCSS 类
```

### 2. 使用了图标预设
```
❌ i-material-symbols:search
✅ 使用 Emoji: 🔍
```

### 3. 复杂的动态类名
```
❌ :class="[isActive ? 'a' : 'b']"
✅ :class="getClass()"
```

## 🚀 后续优化

1. 考虑将常用自定义类提取到全局样式
2. 可以创建 UnoCSS preset 统一管理自定义规则
3. 建立样式指南文档，规范团队开发

---

**最后更新**: 2026-04-01
**维护者**: Claude Code