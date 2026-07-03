# Errows Design 自定义样式

## 概述

`errows.css` 包含了 Errows Design 系统的自定义样式，包括渐变、阴影等。这些样式已经集成到 Tailwind CSS 中，可以在 `errows-web` 和 `errows-design` 的 Storybook 中使用。

## 使用方式

### 1. 渐变背景

使用自定义的 Tailwind class：

```tsx
// Primary 渐变背景
<div className="bg-errows-gradient-primary">
  渐变背景内容
</div>

// Secondary 渐变背景
<div className="bg-errows-gradient-secondary">
  渐变背景内容
</div>
```

### 2. 渐变文字

```tsx
// Primary 渐变文字
<h1 className="text-errows-gradient-primary">
  渐变文字标题
</h1>

// Secondary 渐变文字
<h1 className="text-errows-gradient-secondary">
  渐变文字标题
</h1>
```

### 3. 使用 CSS 变量

如果需要在 style 属性中使用：

```tsx
<div style={{ background: 'var(--errows-gradient-primary)' }}>
  使用 CSS 变量
</div>
```

## 可用的渐变

### Primary Gradient
- **变量**: `--errows-gradient-primary`
- **值**: `linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)`
- **Tailwind 类**: 
  - `bg-errows-gradient-primary` (背景)
  - `text-errows-gradient-primary` (文字)

### Secondary Gradient
- **变量**: `--errows-gradient-secondary`
- **值**: `linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)`
- **Tailwind 类**: 
  - `bg-errows-gradient-secondary` (背景)
  - `text-errows-gradient-secondary` (文字)

## 添加新的自定义样式

要添加新的自定义 Tailwind 类，请在 `errows.css` 的 `@layer utilities` 部分添加：

```css
@layer utilities {
  .your-custom-class {
    /* 你的样式 */
  }
}
```

## 注意事项

1. `errows.css` 已经通过 `globals.css` 导入，无需额外导入
2. 所有自定义类都可以在 errows-web 和 Storybook 中使用
3. CSS linter 可能会显示 `@theme`、`@layer` 等 at-rule 的警告，这是正常的（Tailwind CSS v4 的新语法）
