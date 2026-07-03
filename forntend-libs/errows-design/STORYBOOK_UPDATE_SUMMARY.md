# Storybook 文档样式更新总结

## 已完成更新的组件文档

✅ **Button.stories.tsx** - 已应用统一样式
✅ **Card.stories.tsx** - 已应用统一样式  
✅ **Dialog.stories.tsx** - 已应用统一样式
✅ **Form.stories.tsx** - 已应用统一样式
✅ **Popover.stories.tsx** - 已应用统一样式
✅ **Switch.stories.tsx** - 已应用统一样式

## 待更新的组件文档

⏳ **Input.stories.tsx** - 需要更新
⏳ **InputGroup.stories.tsx** - 需要更新
⏳ **Label.stories.tsx** - 需要更新
⏳ **Icons.stories.tsx** - 需要检查

## 统一样式系统

所有文档现在使用 `story-styles.ts` 中定义的统一样式：

### 主要样式
- `storyStyles.container` - 容器样式
- `storyStyles.h1` - 主标题（带渐变效果）
- `storyStyles.h2` - 二级标题
- `storyStyles.h3` - 三级标题
- `storyStyles.section` - 区块样式
- `storyStyles.codeBlock` - 代码块样式（深色渐变背景）
- `storyStyles.text` - 正文样式
- `storyStyles.textMuted` - 次要文字样式

### 代码块特性
- 深色渐变背景
- 毛玻璃效果
- 专业等宽字体
- 阴影效果
- 在 dark 模式下完美显示

## 下一步

继续更新剩余的组件文档以保持一致性。
