# @errows/icons

Icon library for Errows project.

> **Note**: The Storybook documentation for icons has been integrated into the `@errows/design` package. To view and interact with all icons, run Storybook from the design system package.

## Viewing Icons

To view all icons with interactive documentation:

```bash
cd packages/errows-design
pnpm install
pnpm storybook
```

Then navigate to **Foundation/Icons** in Storybook to see all available icons with click-to-copy functionality.

## Features

- **Auto-export**: All icons from `src/icons/*.svg` are automatically exported
- **React components**: SVG icons are converted to React components via `vite-plugin-svgr`
- **Type-safe**: Full TypeScript support

## Usage

Import icons in your application:

```tsx
import { GoogleIcon, AppleIcon } from '@errows/icons';

function MyComponent() {
  return (
    <div>
      <GoogleIcon className="w-6 h-6" />
      <AppleIcon className="w-6 h-6" />
    </div>
  );
}
```

## Adding New Icons

1. Add your `.svg` file to `src/icons/`
2. Export it in `src/index.ts`:
   ```ts
   export { default as YourIconName } from './icons/your-icon.svg?react';
   ```
3. The icon will automatically appear in Storybook

## Build Storybook

To build a static version of Storybook:

```bash
pnpm build-storybook
```
