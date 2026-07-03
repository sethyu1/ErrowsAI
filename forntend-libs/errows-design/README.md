# @errows/design

Design system for Errows project with integrated component library and icon gallery.

## Features

- **Component Library**: Reusable UI components built with React and Tailwind CSS
- **Icon Gallery**: Complete icon library from `@errows/icons` with click-to-copy functionality
- **Storybook Documentation**: Interactive documentation for all components and icons
- **Type-safe**: Full TypeScript support

## Installation

Install dependencies:

```bash
cd packages/errows-design
pnpm install
```

## Development

Run Storybook to view and test all components and icons:

```bash
pnpm storybook
```

This will start Storybook at `http://localhost:6006`

You can browse:
- **Foundation/Icons**: Complete icon gallery with click-to-copy import statements
- **Components**: All UI components with interactive controls

## Usage

### Using Components

Import components in your application:

```tsx
import { Button, Input, Card } from '@errows/design';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Using Icons

Icons from `@errows/icons` are automatically integrated:

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

## Project Structure

```
src/
├── components/      # UI components
├── hooks/          # React hooks
├── lib/            # Utility functions
├── stories/        # Storybook stories
│   ├── Icons.stories.tsx    # Icon gallery
│   └── Button.stories.tsx   # Component examples
└── styles/         # Global styles
```

## Adding New Stories

Create a new story file in `src/stories/`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from '../components/your-component';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Default: Story = {
  args: {
    // component props
  },
};
```

## Build Storybook

To build a static version of Storybook:

```bash
pnpm build-storybook
```

The static files will be generated in `storybook-static/` directory.
