# UnoCSS 小程序转换快速参考卡片

> **适用于**: HTML + Tailwind → uni-app + UnoCSS
> **打印提示**: A4 纸打印，贴在显示器旁边

---

## ⚡ 30秒快速检查

```bash
# 转换前必查清单
□ 特殊字符？ → 用自定义 SCSS 类
□ 动态类名？ → 完整类名或 safelist
□ 标签正确？ → view/text/image
□ 背景图片？ → 网络地址或 Base64
□ 单位转换？ → px 自动变 rpx
```

---

## 🚫 禁止使用的语法

### 1. 特殊字符类名

```html
<!-- ❌ 禁止 -->
<view class="w-[100px]"></view>
<view class="bg-blue/50"></view>
<view class="top-1/2"></view>

<!-- ✅ 正确：使用自定义 SCSS -->
<style>
  .w-100px {
    width: 100px;
  }
  .bg-blue-50 {
    background: rgba(0, 123, 255, 0.5);
  }
  .top-half {
    top: 50%;
  }
</style>
```

### 2. 动态拼接类名

```html
<!-- ❌ 禁止 -->
<view :class="'text-' + color"></view>

<!-- ✅ 正确：完整类名 -->
<view :class="color === 'red' ? 'text-red' : 'text-blue'"></view>

<!-- ✅ 或使用方法 -->
<view :class="getTextClass(color)"></view>
```

### 3. 属性化语法

```html
<!-- ❌ 禁止 -->
<view border="2 red"></view>

<!-- ✅ 正确 -->
<view class="border-2 border-red"></view>
```

---

## ✅ 标签转换对照表

| HTML        | 小程序    | 说明                   |
| ----------- | --------- | ---------------------- |
| `<div>`     | `<view>`  | 块级容器               |
| `<section>` | `<view>`  | 块级容器               |
| `<article>` | `<view>`  | 块级容器               |
| `<span>`    | `<text>`  | 行内文本               |
| `<p>`       | `<text>`  | 段落文本               |
| `<img>`     | `<image>` | 图片 ⚠️ 需要 mode 属性 |
| `<a>`       | `<view>`  | 导航（用事件处理）     |

---

## 📐 单位转换速查

| Web (px) | UnoCSS 类名   | 小程序 (rpx) | 说明     |
| -------- | ------------- | ------------ | -------- |
| 10px     | `w-10`        | 10rpx        | 自动转换 |
| 100px    | `w-100`       | 100rpx       | 自动转换 |
| 固定 px  | `w-[100px]px` | 100px        | 强制单位 |

**设计稿基准**: 375px 宽度

---

## 🎨 常用颜色透明度处理

```html
<!-- 方案 1: 现代小程序支持 (推荐) -->
<view class="text-black/50"></view>

<!-- 方案 2: 兼容旧版本 -->
<view class="text-black text-opacity-50"></view>

<!-- 方案 3: 自定义 SCSS -->
<style>
  .text-black-50 {
    color: rgba(0, 0, 0, 0.5);
  }
</style>
```

---

## 🔧 动态类名解决方案

### 方案 1: 完整三元表达式 ⭐ 推荐

```html
<view :class="isActive ? 'bg-red' : 'bg-blue'"></view>
```

### 方案 2: 方法返回

```typescript
function getBtnClass(status: string) {
  const classMap = {
    active: 'bg-green text-white',
    pending: 'bg-yellow text-black',
    disabled: 'bg-gray text-gray-500',
  };
  return classMap[status] || 'bg-white';
}
```

```html
<view :class="getBtnClass(status)"></view>
```

### 方案 3: Safelist 预生成

```typescript
// uno.config.ts
export default defineConfig({
  safelist: ['bg-red', 'bg-blue', 'bg-green', 'text-white', 'text-black'],
});
```

---

## 🖼️ 背景图片处理

```html
<!-- ❌ 错误：本地路径 -->
<view style="background-image: url(@/assets/bg.png)"></view>

<!-- ✅ 方案 1: 网络图片 -->
<view style="background-image: url(https://cdn.example.com/bg.png)"></view>

<!-- ✅ 方案 2: 使用 <image> 标签 -->
<view class="relative">
  <image src="/static/bg.png" class="absolute inset-0 w-full h-full" />
  <view class="relative z-10">内容</view>
</view>

<!-- ✅ 方案 3: Emoji 代替图标 -->
<text>🔍 📱 ⭐</text>
```

---

## 📋 Claude Code 指令模板

复制粘贴给 Claude Code：

```
将 HTML + Tailwind 转为 uni-app + UnoCSS：

1. 标签 → view/text/image (加 mode)
2. 类名 → 传统 class，禁用属性化
3. 特殊字符 [、]、/ → 自定义 SCSS
4. 动态类名 → 完整三元或方法
5. px → 自动转 rpx
6. 背景图 → 网络地址或 <image> 标签
7. 图标 → Emoji 或图片
```

---

## 🐛 故障排查速查

| 症状       | 可能原因 | 解决方案      |
| ---------- | -------- | ------------- |
| 类名不生效 | 特殊字符 | 用自定义 SCSS |
| 编译报错   | 动态拼接 | 改用完整类名  |
| 真机无样式 | CSS 变量 | 降级处理      |
| 图片不显示 | 本地路径 | 改网络地址    |

---

## 📚 必备文档

- **完整指南**: `tailwind-to-unocss-guide.md`
- **转换示例**: `unocss-conversion.md`
- **配置说明**: `unocss-config-check.md`
- **在线文档**: https://uni-helper.js.org/unocss-preset-uni

---

**版本**: 1.0.0
**更新时间**: 2026-04-01
